import type { RunStatus, StepAction, StepStatus } from '@/lib/types';

// ─────────────────────────────────────────────────────────────
// Small shared presentational components.
// ─────────────────────────────────────────────────────────────

export function RunStatusPill({ status }: { status: RunStatus }) {
  const passed = status === 'passed';
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-medium rounded-full px-2 py-0.5 ring-1 ${
        passed
          ? 'text-ok bg-ok/10 ring-ok/25'
          : 'text-bad bg-bad/10 ring-bad/25'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${passed ? 'bg-ok' : 'bg-bad'}`}
      />
      {passed ? 'passed' : 'failed'}
    </span>
  );
}

const STEP_DOT: Record<StepStatus, string> = {
  passed: 'bg-ok',
  failed: 'bg-bad',
  skipped: 'bg-neutral-600',
};

export function StepStatusDot({ status }: { status: StepStatus }) {
  return (
    <span
      className={`w-2 h-2 rounded-full shrink-0 ${STEP_DOT[status]}`}
      title={status}
    />
  );
}

const ACTION_LABEL: Record<StepAction, string> = {
  goto: 'GO TO',
  click: 'CLICK',
  fill: 'FILL',
  select: 'SELECT',
  waitFor: 'WAIT',
  extract: 'EXTRACT',
  assertText: 'ASSERT',
  screenshot: 'SHOT',
};

export function ActionChip({ action }: { action: StepAction }) {
  return (
    <span className="text-[10px] font-mono font-semibold tracking-wide text-brand bg-brand/10 ring-1 ring-brand/20 rounded px-1.5 py-0.5">
      {ACTION_LABEL[action]}
    </span>
  );
}

export function Tag({ label }: { label: string }) {
  return (
    <span className="text-[10.5px] font-mono text-neutral-400 bg-surface-2 ring-1 ring-edge rounded px-1.5 py-0.5">
      {label}
    </span>
  );
}
