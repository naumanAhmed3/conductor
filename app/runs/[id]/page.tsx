import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRun, getRunSteps } from '@/lib/repo';
import type { RunStep } from '@/lib/types';
import { fmtDuration, fmtTime } from '@/lib/format';
import { Nav } from '../../nav';
import { ActionChip, RunStatusPill, StepStatusDot } from '../../ui';

export const dynamic = 'force-dynamic';

export default async function RunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const run = await getRun(id);
  if (!run) notFound();
  const steps = await getRunSteps(id);
  const extracted = Object.entries(run.extracted ?? {});

  return (
    <>
      <Nav />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <Link
          href={`/flows/${run.flowId}`}
          className="text-[12px] text-neutral-500 hover:text-neutral-300"
        >
          ← {run.flowName}
        </Link>

        {/* Header */}
        <div className="mt-4 cd-fade">
          <div className="flex items-center gap-3">
            <RunStatusPill status={run.status} />
            <code className="text-[12px] font-mono text-neutral-500">
              {run.id}
            </code>
          </div>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">
            {run.flowName}
          </h1>
          <div className="mt-2 flex items-center gap-2 flex-wrap text-[12px] font-mono text-neutral-500">
            <span className="text-brand/80">{run.trigger}</span>
            <span className="text-edge">·</span>
            <span>{fmtTime(run.startedAt)}</span>
            <span className="text-edge">·</span>
            <span>{run.stepCount} steps</span>
            <span className="text-edge">·</span>
            <span>{fmtDuration(run.durationMs)} total</span>
          </div>
        </div>

        {run.error && (
          <div className="mt-5 rounded-lg bg-bad/10 ring-1 ring-bad/25 px-4 py-3">
            <div className="text-[11px] uppercase tracking-wide text-bad/80">
              Run failed
            </div>
            <code className="mt-1 block text-[12.5px] font-mono text-bad break-all">
              {run.error}
            </code>
          </div>
        )}

        {/* Extracted data */}
        {extracted.length > 0 && (
          <section className="mt-7">
            <h2 className="text-sm font-semibold text-neutral-300 mb-3">
              Extracted data
            </h2>
            <div className="rounded-xl ring-1 ring-edge bg-surface divide-y divide-edge-soft">
              {extracted.map(([key, value]) => (
                <div key={key} className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <code className="text-[12.5px] font-mono text-brand">
                      {key}
                    </code>
                    {Array.isArray(value) && (
                      <span className="text-[11px] text-neutral-600">
                        {value.length} item{value.length === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-[12.5px] text-neutral-400 leading-relaxed">
                    {Array.isArray(value)
                      ? value.slice(0, 14).join('  ·  ') +
                        (value.length > 14 ? '  …' : '')
                      : String(value)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Step timeline */}
        <section className="mt-7">
          <h2 className="text-sm font-semibold text-neutral-300 mb-3">
            Step timeline
          </h2>
          <div className="space-y-3">
            {steps.map((step) => (
              <StepCard key={step.idx} step={step} />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

function StepCard({ step }: { step: RunStep }) {
  const failed = step.status === 'failed';
  const skipped = step.status === 'skipped';
  return (
    <div
      className={`rounded-xl ring-1 overflow-hidden ${
        failed ? 'ring-bad/30 bg-bad/5' : 'ring-edge bg-surface'
      } ${skipped ? 'opacity-55' : ''}`}
    >
      <div className="flex items-center gap-3 px-4 py-2.5">
        <span className="text-[11px] font-mono text-neutral-600 w-5 text-right">
          {step.idx + 1}
        </span>
        <StepStatusDot status={step.status} />
        <ActionChip action={step.action} />
        <span className="text-[13px] text-neutral-200 flex-1 min-w-0 truncate">
          {step.label}
        </span>
        {step.attempts > 1 && (
          <span className="text-[10.5px] font-mono text-brand/80 bg-brand/10 ring-1 ring-brand/20 rounded px-1.5 py-0.5">
            {step.attempts}× tries
          </span>
        )}
        {!skipped && (
          <span className="text-[11px] font-mono text-neutral-500 w-14 text-right">
            {fmtDuration(step.durationMs)}
          </span>
        )}
      </div>

      {step.selector && (
        <code className="block px-4 pb-1.5 text-[11px] font-mono text-neutral-600 break-all">
          {step.selector}
        </code>
      )}

      {step.detail && (
        <div
          className={`mx-4 mb-2.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-mono break-all ${
            failed
              ? 'bg-bad/10 text-bad'
              : 'bg-surface-2 text-neutral-400'
          }`}
        >
          {failed ? step.detail : `→ ${step.detail}`}
        </div>
      )}

      {step.screenshot && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`data:image/jpeg;base64,${step.screenshot}`}
          alt={`Screenshot after step ${step.idx + 1}`}
          className="w-full max-h-[440px] object-cover object-top border-t border-edge-soft"
        />
      )}
    </div>
  );
}
