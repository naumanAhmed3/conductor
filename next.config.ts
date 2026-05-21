import type { NextConfig } from 'next';

// Globs (per-package, version-agnostic) for the executor's native deps.
const EXECUTOR_DEPS = [
  './node_modules/.pnpm/playwright-core@*/node_modules/playwright-core/**',
  './node_modules/.pnpm/@sparticuz+chromium@*/node_modules/@sparticuz/chromium/**',
];

const nextConfig: NextConfig = {
  // Chromium + Playwright must stay outside the bundler — they ship
  // native binaries and load files relative to their own package.
  serverExternalPackages: ['@sparticuz/chromium', 'playwright-core'],
  // The serverless tracer misses files these packages read at runtime
  // (playwright-core's browsers.json, the @sparticuz chromium pack), so
  // the run routes force them into the function bundle.
  outputFileTracingIncludes: {
    '/api/flows/[id]/run': EXECUTOR_DEPS,
    '/api/cron': EXECUTOR_DEPS,
  },
};

export default nextConfig;
