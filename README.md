# Conductor — Browser Automation Control Plane

Conductor runs **declarative browser-automation flows** against real websites
with **real headless Chromium**, and records every step it takes — the timing,
the retries, the data it extracted, and a screenshot of the page afterwards.

It is the control plane for the kind of work an access or inventory review does
against a SaaS application: log in, confirm a page is reachable, pull a
directory, audit a catalog — except you can watch exactly what the browser did.

**Live demo:** https://conductor-woad.vercel.app

> Open any flow and press **Run flow now**. The request launches a genuine
> headless Chromium *on Vercel*, drives a public sandbox site through the
> flow's steps, and returns a run you can inspect step by step.

---

## What it does

A **flow** is a declarative automation — a JSON list of steps targeting a
website. A **run** is one execution of a flow. Conductor:

1. **Executes** the flow with Playwright-driven Chromium, step by step, with
   per-step retries and timeouts.
2. **Captures** a JPEG screenshot of the page after every step.
3. **Extracts** structured data (`extract` steps) into named variables.
4. **Records** the whole run — status, durations, attempts, errors, the
   screenshot filmstrip — into Postgres.
5. **Schedules** flows: a daily cron runs whichever scheduled flow has gone
   longest without a run.

The five sample flows target real, public, automation-friendly sandbox sites
(`saucedemo.com`, `quotes.toscrape.com`, `books.toscrape.com`,
`the-internet.herokuapp.com`).

---

## Architecture

```
  Browser ──▶ Next.js (App Router) on Vercel
                │
                ├─ Dashboard ........ overview · flow detail · run detail
                │
                ├─ POST /api/flows/:id/run ──┐
                ├─ GET  /api/cron  (daily) ──┤
                │                            ▼
                │                   lib/executor.ts
                │                   ┌─────────────────────────────┐
                │                   │ launch headless Chromium    │
                │                   │  • Vercel → @sparticuz/...  │
                │                   │  • local  → system Chrome   │
                │                   │ run each step · retry ·     │
                │                   │ screenshot · extract        │
                │                   └─────────────────────────────┘
                │                            │
                └────────────────────────────┴──▶ Postgres (Neon)
                                                   flows · runs · run_steps
```

### The executor

`lib/executor.ts` is environment-aware. On Vercel it launches
[`@sparticuz/chromium`](https://github.com/Sparticuz/chromium) — a slim,
serverless-ready Chromium build — through `playwright-core`. Locally it drives
the system Google Chrome via Playwright's `chrome` channel. **The Chromium
major version of `@sparticuz/chromium` is pinned to match the one
`playwright-core` expects** (both Chromium 148) — a mismatch there is the usual
cause of serverless Playwright breaking.

Each step is attempted up to twice, timed, and screenshotted. The first
failure halts the run; the remaining steps are recorded as `skipped`.

### Step actions

| Action | Purpose |
|---|---|
| `goto` | navigate to a URL |
| `click` | click an element (`optional` to ignore if missing) |
| `fill` | type into an input |
| `select` | choose a `<select>` option |
| `waitFor` | wait for an element to become visible |
| `extract` | pull text / an attribute into a named variable (`multiple` for lists) |
| `assertText` | fail the run unless an element contains a substring |
| `screenshot` | force an extra capture point |

---

## Tech stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Playwright** (`playwright-core`) + **`@sparticuz/chromium`** for serverless execution
- **Postgres** (Neon) via `postgres.js` — hand-written SQL, no ORM
- **Tailwind CSS v4**
- **Vercel** — hosting, serverless functions (`maxDuration` 60s), Cron

---

## Project structure

```
conductor/
├── lib/
│   ├── types.ts       Flow / FlowStep / Run / RunStep types
│   ├── schema.sql     flows · runs · run_steps
│   ├── db.ts          lazy postgres.js connection
│   ├── flows.ts       the five sample flow definitions
│   ├── executor.ts    the Playwright engine
│   ├── repo.ts        data access (hand-written SQL)
│   └── format.ts      formatting helpers
├── app/
│   ├── page.tsx              overview — stats, flows, recent runs
│   ├── flows/[id]/page.tsx   flow definition + run history
│   ├── runs/[id]/page.tsx    run detail — the screenshot timeline
│   ├── api/seed/route.ts             reset to the sample flows
│   ├── api/flows/[id]/run/route.ts   execute a flow now
│   └── api/cron/route.ts             the daily scheduler
├── scripts/migrate.mjs   applies lib/schema.sql
└── vercel.json           daily cron → /api/cron
```

---

## Run it locally

Requires Node 20+, pnpm, a Postgres database, and Google Chrome installed.

```bash
pnpm install

# point at your database
echo 'DATABASE_URL=postgres://…' > .env.local

# create the tables
node --env-file=.env.local scripts/migrate.mjs

pnpm dev
```

Open http://localhost:3000, click **Load sample flows**, open a flow, and press
**Run flow now** — locally this drives your installed Chrome.

---

## Design notes & limitations

- **Synchronous execution.** A run executes within the request that triggers
  it (well inside the 60-second function budget for these flows). A
  production system would queue runs and execute them on a worker pool — the
  `executeFlow` / `recordRun` split already isolates that seam.
- **Screenshots are stored as base64 JPEGs in Postgres.** Simple and
  self-contained at demo scale; blob storage would be the move at volume.
- **Selectors are static.** Self-healing selectors that survive markup changes
  are a deliberate non-goal here — that is a separate project.
- The sample flows hit third-party sandbox sites, so a run can legitimately
  fail if one of those sites is down. Conductor records that cleanly — a failed
  step, an error message, and a screenshot of the page where it stopped.

---

## License

MIT
