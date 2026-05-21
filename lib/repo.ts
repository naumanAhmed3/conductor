import { randomBytes } from 'node:crypto';
import { db } from './db';
import { sampleFlows } from './flows';
import type { ExecResult } from './executor';
import type { Flow, Run, RunStep, RunTrigger } from './types';

// ─────────────────────────────────────────────────────────────
// Data access. Hand-written SQL over postgres.js — no ORM.
// ─────────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */

function mapFlow(r: any): Flow {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    startUrl: r.start_url,
    steps: r.steps,
    tags: r.tags,
    enabled: r.enabled,
    schedule: r.schedule,
    createdAt: new Date(r.created_at).toISOString(),
    updatedAt: new Date(r.updated_at).toISOString(),
  };
}

function mapRun(r: any): Run {
  return {
    id: r.id,
    flowId: r.flow_id,
    flowName: r.flow_name,
    status: r.status,
    trigger: r.trigger,
    startedAt: new Date(r.started_at).toISOString(),
    finishedAt: new Date(r.finished_at).toISOString(),
    durationMs: r.duration_ms,
    stepCount: r.step_count,
    error: r.error,
    extracted: r.extracted,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

function mapStep(r: any): RunStep {
  return {
    idx: r.idx,
    action: r.action,
    label: r.label,
    selector: r.selector,
    status: r.status,
    durationMs: r.duration_ms,
    attempts: r.attempts,
    detail: r.detail,
    screenshot: r.screenshot,
  };
}

// ── Flows ────────────────────────────────────────────────────

export async function listFlows(): Promise<Flow[]> {
  const rows = await db()`select * from flows order by name`;
  return rows.map(mapFlow);
}

export async function getFlow(id: string): Promise<Flow | null> {
  const rows = await db()`select * from flows where id = ${id}`;
  return rows.length ? mapFlow(rows[0]) : null;
}

/** Replace all flows (and, by cascade, all runs) with the samples. */
export async function seedFlows(): Promise<number> {
  const sql = db();
  const flows = sampleFlows();
  await sql.begin(async (tx) => {
    await tx`delete from flows`;
    for (const f of flows) {
      await tx`
        insert into flows (id, name, description, start_url, steps, tags, enabled, schedule)
        values (${f.id}, ${f.name}, ${f.description}, ${f.startUrl},
                ${sql.json(f.steps as any)}, ${f.tags}, ${f.enabled}, ${f.schedule})`;
    }
  });
  return flows.length;
}

// ── Runs ─────────────────────────────────────────────────────

/** Persist a completed execution as a run plus its step rows. */
export async function recordRun(
  flow: Flow,
  trigger: RunTrigger,
  result: ExecResult,
): Promise<string> {
  const id = 'run_' + randomBytes(5).toString('hex');
  const finishedAt = new Date();
  const startedAt = new Date(finishedAt.getTime() - result.durationMs);
  const sql = db();

  await sql.begin(async (tx) => {
    await tx`
      insert into runs (id, flow_id, flow_name, status, trigger, started_at,
                        finished_at, duration_ms, step_count, error, extracted)
      values (${id}, ${flow.id}, ${flow.name}, ${result.status}, ${trigger},
              ${startedAt}, ${finishedAt}, ${result.durationMs},
              ${result.steps.length}, ${result.error},
              ${sql.json(result.extracted as any)})`;
    for (const s of result.steps) {
      await tx`
        insert into run_steps (run_id, idx, action, label, selector, status,
                               duration_ms, attempts, detail, screenshot)
        values (${id}, ${s.idx}, ${s.action}, ${s.label}, ${s.selector},
                ${s.status}, ${s.durationMs}, ${s.attempts}, ${s.detail},
                ${s.screenshot})`;
    }
  });
  return id;
}

export async function listRuns(limit = 30): Promise<Run[]> {
  const rows = await db()`
    select * from runs order by created_at desc limit ${limit}`;
  return rows.map(mapRun);
}

export async function runsForFlow(flowId: string, limit = 20): Promise<Run[]> {
  const rows = await db()`
    select * from runs where flow_id = ${flowId}
    order by created_at desc limit ${limit}`;
  return rows.map(mapRun);
}

/** The most recent run for each flow, keyed by flow id. */
export async function latestRunPerFlow(): Promise<Record<string, Run>> {
  const rows = await db()`
    select distinct on (flow_id) * from runs
    order by flow_id, created_at desc`;
  const out: Record<string, Run> = {};
  for (const r of rows) out[r.flow_id] = mapRun(r);
  return out;
}

export async function getRun(id: string): Promise<Run | null> {
  const rows = await db()`select * from runs where id = ${id}`;
  return rows.length ? mapRun(rows[0]) : null;
}

export async function getRunSteps(runId: string): Promise<RunStep[]> {
  const rows = await db()`
    select * from run_steps where run_id = ${runId} order by idx`;
  return rows.map(mapStep);
}

// ── Dashboard ────────────────────────────────────────────────

export interface DashboardStats {
  flowCount: number;
  runCount: number;
  passRate: number; // 0..1, NaN-safe
  avgDurationMs: number;
}

export async function dashboardStats(): Promise<DashboardStats> {
  const [flows] = await db()`select count(*)::int as n from flows`;
  const [runs] = await db()`
    select
      count(*)::int as n,
      count(*) filter (where status = 'passed')::int as passed,
      coalesce(avg(duration_ms), 0)::int as avg_ms
    from runs`;
  return {
    flowCount: flows.n,
    runCount: runs.n,
    passRate: runs.n > 0 ? runs.passed / runs.n : 0,
    avgDurationMs: runs.avg_ms,
  };
}

/** The enabled, scheduled flow that has gone longest without a run. */
export async function dueScheduledFlow(): Promise<Flow | null> {
  const rows = await db()`
    select f.* from flows f
    where f.enabled and f.schedule is not null
    order by (select max(r.created_at) from runs r where r.flow_id = f.id)
             asc nulls first
    limit 1`;
  return rows.length ? mapFlow(rows[0]) : null;
}
