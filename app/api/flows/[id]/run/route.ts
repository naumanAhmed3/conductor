import { NextResponse } from 'next/server';
import { getFlow, recordRun } from '@/lib/repo';
import { executeFlow } from '@/lib/executor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Real Chromium launch + a multi-step flow needs well over the default.
export const maxDuration = 60;

// POST /api/flows/:id/run — execute the flow now and record the run.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const flow = await getFlow(id);
    if (!flow) {
      return NextResponse.json({ error: 'Flow not found' }, { status: 404 });
    }
    const result = await executeFlow(flow);
    const runId = await recordRun(flow, 'manual', result);
    return NextResponse.json({ runId, status: result.status });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Run failed' },
      { status: 500 },
    );
  }
}
