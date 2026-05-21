import { NextResponse } from 'next/server';
import { seedFlows } from '@/lib/repo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/seed — reset the control plane to the sample flows.
export async function POST() {
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
