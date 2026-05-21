// ─────────────────────────────────────────────────────────────
// Conductor — shared types
// ─────────────────────────────────────────────────────────────

/** The actions a flow step can perform. */
export type StepAction =
  | 'goto'
  | 'click'
  | 'fill'
  | 'select'
  | 'waitFor'
  | 'extract'
  | 'assertText'
  | 'screenshot';

/** One declarative step in a flow. */
export interface FlowStep {
  action: StepAction;
  label: string;
  /** goto */
  url?: string;
  /** click | fill | select | waitFor | extract | assertText */
  selector?: string;
  /** fill | select */
  value?: string;
  /** extract — name to store the result under */
  as?: string;
  /** extract — read this attribute instead of the text content */
  attr?: string;
  /** extract — collect every match, not just the first */
  multiple?: boolean;
  /** assertText — substring the element text must contain */
  contains?: string;
  /** click — do not fail the run if the element is missing */
  optional?: boolean;
  /** per-step timeout override (ms) */
  timeoutMs?: number;
}

/** A declarative automation targeting a website. */
export interface Flow {
  id: string;
  name: string;
  description: string;
  startUrl: string;
  steps: FlowStep[];
  tags: string[];
  enabled: boolean;
  /** 'daily' to be picked up by the scheduler, or null for manual-only. */
  schedule: string | null;
  createdAt: string;
  updatedAt: string;
}

export type RunStatus = 'passed' | 'failed';
export type StepStatus = 'passed' | 'failed' | 'skipped';
export type RunTrigger = 'manual' | 'schedule' | 'api';

/** The recorded outcome of one executed step. */
export interface RunStep {
  idx: number;
  action: StepAction;
  label: string;
  selector: string | null;
  status: StepStatus;
  durationMs: number;
  attempts: number;
  /** extracted value (passed) or error message (failed) */
  detail: string | null;
  /** base64 JPEG of the page after the step, or null */
  screenshot: string | null;
}

/** One execution of a flow. */
export interface Run {
  id: string;
  flowId: string;
  flowName: string;
  status: RunStatus;
  trigger: RunTrigger;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  stepCount: number;
  error: string | null;
  extracted: Record<string, unknown>;
  createdAt: string;
}
