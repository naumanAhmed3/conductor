import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFlow, runsForFlow } from '@/lib/repo';
import type { FlowStep } from '@/lib/types';
import { fmtDuration, hostOf, relativeTime } from '@/lib/format';
import { Nav } from '../../nav';
import { ActionChip, RunStatusPill, Tag } from '../../ui';
import { RunButton } from '../../run-button';

export const dynamic = 'force-dynamic';

export default async function FlowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const flow = await getFlow(id);
  if (!flow) notFound();

  const runs = await runsForFlow(flow.id);
  const steps: FlowStep[] = [
    { action: 'goto', label: `Open ${flow.startUrl}`, url: flow.startUrl },
    ...flow.steps,
  ];

  return (
    <>
      <Nav />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <Link
          href="/"
          className="text-[12px] text-neutral-500 hover:text-neutral-300"
        >
          ← All flows
        </Link>

        {/* Header */}
        <div className="mt-4 flex items-start gap-4 cd-fade">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold tracking-tight">
              {flow.name}
            </h1>
            <p className="mt-2 text-[14px] text-neutral-400 leading-relaxed max-w-2xl">
              {flow.description}
            </p>
            <div className="mt-3 flex items-center gap-2 flex-wrap text-[11px] font-mono text-neutral-500">
              <a
                href={flow.startUrl}
                target="_blank"
                rel="noreferrer"
                className="text-brand/90 hover:underline"
              >
                {hostOf(flow.startUrl)}
              </a>
              <span className="text-edge">·</span>
              <span>{steps.length} steps</span>
              {flow.schedule && (
                <>
                  <span className="text-edge">·</span>
                  <span className="text-brand/80">schedule: {flow.schedule}</span>
                </>
              )}
              {flow.tags.map((t) => (
                <Tag key={t} label={t} />
              ))}
            </div>
          </div>
          <RunButton flowId={flow.id} />
        </div>

        {/* Steps */}
        <section className="mt-9">
          <h2 className="text-sm font-semibold text-neutral-300 mb-3">
            Flow definition
          </h2>
          <ol className="rounded-xl ring-1 ring-edge overflow-hidden divide-y divide-edge-soft">
            {steps.map((step, i) => (
              <li
                key={i}
                className="flex gap-3.5 px-4 py-3 bg-surface items-start"
              >
                <span className="text-[11px] font-mono text-neutral-600 w-5 text-right pt-0.5 shrink-0">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <ActionChip action={step.action} />
                    <span className="text-[13px] text-neutral-200">
                      {step.label}
                    </span>
                  </div>
                  <StepDetail step={step} />
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Run history */}
        <section className="mt-9">
          <h2 className="text-sm font-semibold text-neutral-300 mb-3">
            Run history
          </h2>
          {runs.length === 0 ? (
            <p className="text-sm text-neutral-500 rounded-xl bg-surface ring-1 ring-edge px-4 py-6 text-center">
              This flow has not run yet. Press{' '}
              <span className="text-brand">Run flow now</span> above.
            </p>
          ) : (
            <div className="rounded-xl ring-1 ring-edge overflow-hidden divide-y divide-edge-soft">
              {runs.map((r) => (
                <Link
                  key={r.id}
                  href={`/runs/${r.id}`}
                  className="flex items-center gap-3 px-4 py-2.5 bg-surface hover:bg-surface-2 transition"
                >
                  <RunStatusPill status={r.status} />
                  <span className="text-[12px] font-mono text-neutral-600">
                    {r.trigger}
                  </span>
                  <span className="text-[12px] font-mono text-neutral-500 ml-auto">
                    {r.stepCount} steps
                  </span>
                  <span className="text-[12px] font-mono text-neutral-400 w-14 text-right">
                    {fmtDuration(r.durationMs)}
                  </span>
                  <span className="text-[11px] text-neutral-600 w-16 text-right">
                    {relativeTime(r.createdAt)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}

function StepDetail({ step }: { step: FlowStep }) {
  const bits: string[] = [];
  if (step.url) bits.push(step.url);
  if (step.selector) bits.push(step.selector);
  if (step.value !== undefined) bits.push(`= "${step.value}"`);
  if (step.contains !== undefined) bits.push(`contains "${step.contains}"`);
  if (step.as) bits.push(`→ ${step.as}${step.multiple ? '[]' : ''}`);
  if (step.attr) bits.push(`@${step.attr}`);
  if (bits.length === 0) return null;
  return (
    <code className="mt-1 block text-[11.5px] font-mono text-neutral-500 break-all">
      {bits.join('  ')}
    </code>
  );
}
