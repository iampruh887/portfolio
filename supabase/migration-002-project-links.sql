-- Adds free-form links to projects: [{ "label": "Demo", "url": "https://..." }, ...]
-- Run once in the Supabase SQL editor. Idempotent.
alter table projects
  add column if not exists links jsonb not null default '[]';
