import type { Browser, Page } from 'playwright-core';
import type { Flow, FlowStep, RunStep, StepStatus } from './types';

// ─────────────────────────────────────────────────────────────
// The Conductor engine. Takes a declarative Flow and runs it with a
// real headless Chromium:
//   • on Vercel  → @sparticuz/chromium (a slim, serverless-ready build)
//   • locally    → the system Google Chrome via the 'chrome' channel
// Each step is retried, timed, and screenshotted. A failure halts the
// run and the remaining steps are recorded as skipped.
// ─────────────────────────────────────────────────────────────

const MAX_ATTEMPTS = 2;
const STEP_TIMEOUT = 15_000;
const VIEWPORT = { width: 1200, height: 760 };

export interface ExecResult {
  status: 'passed' | 'failed';
  steps: RunStep[];
  extracted: Record<string, unknown>;
  error: string | null;
  durationMs: number;
}

async function launchBrowser(): Promise<Browser> {
  const { chromium } = await import('playwright-core');

  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const sparticuz = (await import('@sparticuz/chromium')).default;
    sparticuz.setGraphicsMode = false;
    return chromium.launch({
      args: sparticuz.args,
      executablePath: await sparticuz.executablePath(),
      headless: true,
    });
  }

  // Local development — drive the installed Google Chrome.
  return chromium.launch({ headless: true, channel: 'chrome' });
}

/** Run a single step. Returns a short detail string (extracted value,
 *  final URL, asserted text) or null. Throws on failure. */
async function runStep(
  page: Page,
  step: FlowStep,
  extracted: Record<string, unknown>,
): Promise<string | null> {
  const timeout = step.timeoutMs ?? STEP_TIMEOUT;

  switch (step.action) {
    case 'goto':
      await page.goto(step.url!, { waitUntil: 'domcontentloaded', timeout });
      return page.url();

    case 'click':
      await page.click(step.selector!, { timeout });
      return null;

    case 'fill':
      await page.fill(step.selector!, step.value ?? '', { timeout });
      return null;

    case 'select':
      await page.selectOption(step.selector!, step.value ?? '', { timeout });
      return `selected "${step.value}"`;

    case 'waitFor':
      await page.waitForSelector(step.selector!, { timeout, state: 'visible' });
      return null;

    case 'assertText': {
      const el = page.locator(step.selector!).first();
      await el.waitFor({ timeout, state: 'visible' });
      const text = (await el.innerText()).trim();
      if (!text.includes(step.contains ?? '')) {
        throw new Error(
          `expected "${step.selector}" to contain "${step.contains}", got "${text.slice(0, 80)}"`,
        );
      }
      return text;
    }

    case 'extract': {
      const loc = page.locator(step.selector!);
      if (step.multiple) {
        const els = await loc.all();
        const values: string[] = [];
        for (const el of els) {
          const v = step.attr
            ? (await el.getAttribute(step.attr)) ?? ''
            : (await el.innerText()).trim();
          if (v) values.push(v);
        }
        extracted[step.as!] = values;
        return `${values.length} value${values.length === 1 ? '' : 's'}`;
      }
      const el = loc.first();
      await el.waitFor({ timeout, state: 'visible' });
      const value = step.attr
        ? (await el.getAttribute(step.attr)) ?? ''
        : (await el.innerText()).trim();
      extracted[step.as!] = value;
      return value.slice(0, 200);
    }

    case 'screenshot':
      return null; // a screenshot is captured after every step anyway
  }
}

export async function executeFlow(flow: Flow): Promise<ExecResult> {
  const startedAt = Date.now();
  const steps: RunStep[] = [];
  const extracted: Record<string, unknown> = {};
  let browser: Browser | null = null;
  let failed = false;
  let error: string | null = null;

  // The flow's startUrl is executed as an explicit first step so it
  // shows up in the run timeline like any other.
  const allSteps: FlowStep[] = [
    { action: 'goto', label: `Open ${flow.startUrl}`, url: flow.startUrl },
    ...flow.steps,
  ];

  try {
    browser = await launchBrowser();
    const context = await browser.newContext({ viewport: VIEWPORT });
    const page = await context.newPage();

    for (let idx = 0; idx < allSteps.length; idx++) {
      const step = allSteps[idx];

      // Once a step has failed, the rest are recorded as skipped.
      if (failed) {
        steps.push({
          idx,
          action: step.action,
          label: step.label,
          selector: step.selector ?? null,
          status: 'skipped',
          durationMs: 0,
          attempts: 0,
          detail: null,
          screenshot: null,
        });
        continue;
      }

      const stepStart = Date.now();
      let attempts = 0;
      let status: StepStatus = 'passed';
      let detail: string | null = null;
      let stepError: string | null = null;

      while (attempts < MAX_ATTEMPTS) {
        attempts++;
        try {
          detail = await runStep(page, step, extracted);
          status = 'passed';
          stepError = null;
          break;
        } catch (e) {
          stepError = e instanceof Error ? e.message : String(e);
          if (step.optional) {
            status = 'skipped';
            stepError = null;
            break;
          }
          status = 'failed';
          if (attempts < MAX_ATTEMPTS) await page.waitForTimeout(600);
        }
      }

      // A screenshot of the page state after the step.
      let screenshot: string | null = null;
      try {
        const buffer = await page.screenshot({ type: 'jpeg', quality: 50 });
        screenshot = buffer.toString('base64');
      } catch {
        /* page may have navigated away — skip the shot */
      }

      steps.push({
        idx,
        action: step.action,
        label: step.label,
        selector: step.selector ?? null,
        status,
        durationMs: Date.now() - stepStart,
        attempts,
        detail: status === 'failed' ? stepError : detail,
        screenshot,
      });

      if (status === 'failed') {
        failed = true;
        error = `Step ${idx + 1} — ${step.label}: ${stepError}`;
      }
    }

    await context.close();
  } catch (e) {
    failed = true;
    error = e instanceof Error ? e.message : String(e);
  } finally {
    if (browser) await browser.close().catch(() => {});
  }

  return {
    status: failed ? 'failed' : 'passed',
    steps,
    extracted,
    error,
    durationMs: Date.now() - startedAt,
  };
}
