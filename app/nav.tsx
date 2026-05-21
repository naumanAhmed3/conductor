import Link from 'next/link';

export function Logo({ className = 'w-4.5 h-4.5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="5" cy="6" r="2.4" />
      <circle cx="5" cy="18" r="2.4" />
      <circle cx="18.5" cy="12" r="2.4" />
      <path d="M7.3 7.3 16 11" />
      <path d="M7.3 16.7 16 13" />
    </svg>
  );
}

export function Nav() {
  return (
    <header className="border-b border-edge-soft sticky top-0 z-30 bg-ink/95 backdrop-blur">
      <div className="max-w-5xl mx-auto px-6 h-15 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid place-items-center w-8 h-8 rounded-lg bg-brand/15 ring-1 ring-brand/30 text-brand">
            <Logo />
          </span>
          <span className="font-semibold tracking-tight">Conductor</span>
        </Link>
        <span className="text-[11px] font-mono text-neutral-600 hidden sm:block">
          browser automation control plane
        </span>
      </div>
    </header>
  );
}
