import { NextResponse } from 'next/server';
import { dueScheduledFlow, recordRun } from '@/lib/repo';
import { executeFlow } from '@/lib/executor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// GET /api/cron — the scheduler. Vercel Cron hits this; it executes the
// single scheduled flow that has gone longest without a run, which keeps
// each invocation comfortably inside the function time budget.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const flow = await dueScheduledFlow();
    if (!flow) {
      return NextResponse.json({ ran: false, reason: 'no scheduled flow' });
    }
    const result = await executeFlow(flow);
    const runId = await recordRun(flow, 'schedule', result);
    return NextResponse.json({
      ran: true,
      flow: flow.id,
      runId,
      status: result.status,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Cron failed' },
      { status: 500 },
    );
  }
}
