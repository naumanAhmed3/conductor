import { NextResponse } from 'next/server';
import { seedFlows } from '@/lib/repo';
import { requireAdmin } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/seed — reset the control plane to the sample flows.
export async function POST(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;
  if (process.env.ENABLE_DESTRUCTIVE_SEED !== 'true') {
    return NextResponse.json({ error: 'Destructive seed is disabled' }, { status: 403 });
  }
  try {
    const seeded = await seedFlows();
    return NextResponse.json({ seeded });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Seed failed' },
      { status: 500 },
    );
  }
}
