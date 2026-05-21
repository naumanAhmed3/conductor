'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function SeedButton({
  label = 'Load sample flows',
}: {
  label?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const seed = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      if (!res.ok) throw new Error('Seed failed');
      router.refresh();
    } catch {
      alert('Could not load sample flows.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={seed}
      disabled={busy}
      className="px-3.5 h-9 rounded-lg bg-brand text-ink text-sm font-semibold hover:brightness-110 disabled:opacity-50 transition"
    >
      {busy ? 'Loading…' : label}
    </button>
  );
}
