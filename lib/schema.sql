-- Conductor schema — browser-automation control plane.
-- Apply with: node --env-file=.env.local scripts/migrate.mjs

-- A flow is a declarative automation: a named sequence of steps
-- targeting a website. `steps` holds the ordered JSON step list.
create table if not exists flows (
  id          text primary key,
  name        text not null,
  description text not null default '',
  start_url   text not null,
  steps       jsonb not null default '[]',
  tags        text[] not null default '{}',
  enabled     boolean not null default true,
  schedule    text,                              -- 'daily' or null
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- A run is one execution of a flow. flow_name is denormalised so a
-- run survives the flow being renamed or deleted.
create table if not exists runs (
  id          text primary key,
  flow_id     text not null references flows(id) on delete cascade,
  flow_name   text not null,
  status      text not null,                     -- passed | failed
  trigger     text not null default 'manual',    -- manual | schedule | api
  started_at  timestamptz not null,
  finished_at timestamptz not null,
  duration_ms integer not null,
  step_count  integer not null default 0,
  error       text,
  extracted   jsonb not null default '{}',       -- merged extracted values
  created_at  timestamptz not null default now()
);

create index if not exists runs_flow_idx   on runs (flow_id, created_at desc);
create index if not exists runs_recent_idx on runs (created_at desc);

-- One row per executed step within a run, in execution order.
create table if not exists run_steps (
  run_id      text not null references runs(id) on delete cascade,
  idx         integer not null,
  action      text not null,
  label       text not null,
  selector    text,
  status      text not null,                     -- passed | failed | skipped
  duration_ms integer not null default 0,
  attempts    integer not null default 1,
  detail      text,                              -- extracted value or error
  screenshot  text,                              -- base64 JPEG, nullable
  primary key (run_id, idx)
);
