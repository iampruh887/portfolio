# Portfolio Supabase + About Me + Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the portfolio content-driven via Supabase, add the About Me dashboard from Figma, and add a password-gated `/admin` panel (secured by Vercel serverless functions) so the owner can add/remove/reorder/hide content.

**Architecture:** Vite React SPA (client) + Vercel serverless functions in `/api` + Supabase (Postgres + Storage). Browser holds only the anon key (RLS read-only, published rows). All writes go through `/api/admin/*` which validates `ADMIN_PASSWORD` and uses the service-role key server-side. GitHub contribution graph via `/api/contributions` (GitHub GraphQL + `GITHUB_TOKEN`).

**Tech Stack:** React 19, Vite 8, react-router-dom 7, @supabase/supabase-js 2, Vercel Node serverless functions (ESM), vitest.

**Spec:** `docs/superpowers/specs/2026-07-06-portfolio-supabase-admin-design.md`

## Global Constraints

- Site stays a Vite SPA deployed on Vercel; `/api/*` are Vercel serverless functions (ESM, `type: module` already set).
- Client env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Server-only env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `GITHUB_TOKEN`. Service-role key and admin password must NEVER appear in client code or `VITE_`-prefixed vars.
- Tables: `profile`, `projects`, `blogs`, `experiences`, `languages`, `skills`, `hero_images`. List tables share columns `sort_order int`, `is_published boolean`, `created_at`, `updated_at`. Ordering everywhere: `sort_order asc, created_at asc`.
- One `projects` table feeds BOTH the Projects carousel and the About-Me works list.
- Theme (matches Figma + existing CSS): background texture `src/assets/red.jpeg` (reds `#8a0a0f`/`#541118`), panels `#D9D9D9`, accent yellow `#F7FF00`, dark panel `#161b22`-family for heatmap. Existing screens already use this palette — do not restyle them; reuse it on new pages.
- Existing UI behavior of Menu/Projects/Blogs (pie menu, carousel, list toggle) must keep working.
- Admin reorder is implemented with up/down arrows (equivalent to spec's reorder requirement; no drag library).
- Upload endpoint accepts JSON `{ filename, contentType, dataBase64 }` (max 4 MB) instead of multipart — simpler on Vercel, same result: public URL in `media` bucket.
- Commit after every task. Test command: `npm test` (vitest run).

---

### Task 1: Dependencies, vercel.json, env scaffolding, test runner

**Files:**
- Modify: `package.json` (deps + `test` script)
- Create: `vercel.json`
- Create: `.env.example`
- Modify: `.gitignore` (ensure `.env*` ignored, keep `.env.example`)

**Interfaces:**
- Produces: installed packages `react-router-dom`, `@supabase/supabase-js`, dev `vitest`; SPA rewrite so `/projects`, `/admin` etc. deep-link on Vercel; documented env var names for all later tasks.

- [ ] **Step 1: Install dependencies**

```bash
npm install react-router-dom @supabase/supabase-js
npm install -D vitest
```

- [ ] **Step 2: Add test script to package.json**

In `package.json` `"scripts"`, add:

```json
"test": "vitest run --passWithNoTests"
```

- [ ] **Step 3: Create vercel.json (SPA rewrite excluding /api)**

```json
{
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

- [ ] **Step 4: Create .env.example**

```bash
# Client (exposed to browser — anon key is read-only via RLS)
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Server only (Vercel env vars — NEVER prefix with VITE_)
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ADMIN_PASSWORD=choose-a-long-password
GITHUB_TOKEN=github_pat_readonly
```

- [ ] **Step 5: Ensure .gitignore covers env files**

Append to `.gitignore` if not present:

```
.env
.env.local
.env*.local
```

- [ ] **Step 6: Verify build and test runner**

Run: `npm run build && npm test`
Expected: build succeeds; vitest exits 0 ("No test files found" is OK due to --passWithNoTests).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vercel.json .env.example .gitignore
git commit -m "chore: add router, supabase client, vitest, vercel SPA rewrite, env scaffolding"
```

---

### Task 2: Supabase schema + seed SQL

**Files:**
- Create: `supabase/schema.sql`
- Create: `supabase/seed.sql`

**Interfaces:**
- Produces: the 7 tables with RLS (public SELECT of published rows only), `moddatetime` updated_at triggers, public `media` storage bucket. Seed rows from resume/Figma. Later tasks rely on exact column names given here.

- [ ] **Step 1: Write supabase/schema.sql**

```sql
-- Portfolio schema. Idempotent: safe to re-run in the Supabase SQL editor.
create extension if not exists moddatetime schema extensions;

-- ---------- profile (single row) ----------
create table if not exists profile (
  id int primary key default 1 check (id = 1),
  name text not null default '',
  tagline text not null default '',
  bio text not null default '',
  avatar_url text not null default '',
  github_username text not null default '',
  email text not null default '',
  linkedin_url text not null default '',
  education text not null default '',
  resume_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- projects (feeds carousel AND about-me works list) ----------
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  tech text[] not null default '{}',
  repo_url text not null default '',
  live_url text not null default '',
  image_url text not null default '',
  date_label text not null default '',
  featured boolean not null default false,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- blogs ----------
create table if not exists blogs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique,
  content text not null default '',
  cover_image_url text not null default '',
  published_at date not null default now(),
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- experiences ----------
create table if not exists experiences (
  id uuid primary key default gen_random_uuid(),
  role text not null,
  org text not null default '',
  location text not null default '',
  description text not null default '',
  start_date date,
  end_date date,
  is_current boolean not null default false,
  kind text not null default 'work' check (kind in ('work','activity')),
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- languages (spoken) ----------
create table if not exists languages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rating smallint not null default 3 check (rating between 1 and 5),
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- skills (tech stack) ----------
create table if not exists skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'language'
    check (category in ('language','framework','library','ai_tool','dev_tool','other')),
  icon_slug text not null default '',
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- hero_images ("this image will keep changing") ----------
create table if not exists hero_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  caption text not null default '',
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- updated_at triggers ----------
do $$
declare t text;
begin
  foreach t in array array['profile','projects','blogs','experiences','languages','skills','hero_images'] loop
    execute format('drop trigger if exists handle_updated_at on %I', t);
    execute format(
      'create trigger handle_updated_at before update on %I
       for each row execute procedure extensions.moddatetime (updated_at)', t);
  end loop;
end $$;

-- ---------- RLS: public may SELECT published rows only; no public writes ----------
alter table profile enable row level security;
alter table projects enable row level security;
alter table blogs enable row level security;
alter table experiences enable row level security;
alter table languages enable row level security;
alter table skills enable row level security;
alter table hero_images enable row level security;

drop policy if exists "public read profile" on profile;
create policy "public read profile" on profile for select using (true);

do $$
declare t text;
begin
  foreach t in array array['projects','blogs','experiences','languages','skills','hero_images'] loop
    execute format('drop policy if exists "public read published" on %I', t);
    execute format(
      'create policy "public read published" on %I for select using (is_published = true)', t);
  end loop;
end $$;

-- ---------- storage bucket (public read; writes only via service role) ----------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;
```

- [ ] **Step 2: Write supabase/seed.sql**

```sql
-- Seed data from resume (May 2026) + Figma. Idempotent via fixed UUIDs.

insert into profile (id, name, tagline, bio, github_username, email, linkedin_url, education)
values (
  1,
  'Nishant Prabhat',
  'AI / ML engineer in the making',
  'B.Tech CSE student at IIIT Guwahati building agentic AI systems, ML models, and the occasional robot.',
  'iampruh887',
  'iampruh887@gmail.com',
  'https://linkedin.com/in/nishant-prabhat',
  'B.Tech in Computer Science and Engineering, Indian Institute of Information Technology Guwahati (CPI 7.49), Aug 2023 – Present'
)
on conflict (id) do nothing;

insert into projects (id, title, description, tech, date_label, sort_order) values
('11111111-0000-0000-0000-000000000001',
 'Hybrid Multi-Tier GPU Offloading for Memory Wall',
 'Three-tier GPU execution model (GPU-PIC, GPU-LLC, GPU-PIM) reducing the memory wall through selective offloading. MSHR-based offload detection and threshold routing in GPGPU-Sim across cache and L2 controllers, with multi-tier scheduling and alternate timing paths for hierarchical execution validation.',
 array['C++','GPGPU-Sim','GPU Architecture'], 'Apr 2026', 1),
('11111111-0000-0000-0000-000000000002',
 'AI Representation Optimizer',
 'Agentic architecture orchestrating specialized agents for e-commerce store analysis and optimization. Planner/worker agent orchestration with task decomposition, LLM-driven aggregation, and an LLM interface for chained reasoning and context-aware merchant recommendations.',
 array['JavaScript','Node.js','Ollama','Agent Orchestration'], 'Apr 2026', 2),
('11111111-0000-0000-0000-000000000003',
 'DeepFake Audio Detection',
 'Deepfake speech classification using Wav2Vec2 with gradient checkpointing and mixed-precision training. Audiomentations-based augmentation for robust multi-class classification across 4 speech classes; optimized PyTorch pipeline for the ComSys 6 hackathon.',
 array['Python','PyTorch','Transformers','Wav2Vec2','Librosa'], 'Oct 2025', 3),
('11111111-0000-0000-0000-000000000004',
 'Facial Recognition and Classification',
 'Dual pipelines for facial verification (88.26% accuracy, 92.56% precision) using FaceNet embeddings, and gender classification with EfficientNet-B0 (92.38% accuracy, 0.93 F1) for ComSys Hackathon 5.',
 array['Python','PyTorch','FaceNet','EfficientNet-B0','MTCNN'], 'Jul 2025', 4),
('11111111-0000-0000-0000-000000000005',
 'Visually Controlled Robotic Arm',
 'Vision-guided robotic arm for real-time hand gesture tracking and laser pointer control. ESP32 + Arduino firmware for motor control, with robust hand detection and gesture recognition via OpenCV and MediaPipe.',
 array['ESP32','Arduino','OpenCV','MediaPipe'], 'Mar 2025', 5),
('11111111-0000-0000-0000-000000000006',
 'nanoGPT on Hindi Literature',
 'Trained a nanoGPT model on a Hindi literature corpus to generate text in Devanagari.',
 array['Python','PyTorch','nanoGPT'], '2024', 6),
('11111111-0000-0000-0000-000000000007',
 'Implementing CLIP from Scratch',
 'Re-implemented the CLIP contrastive image–text architecture from scratch.',
 array['Python','PyTorch'], '2024', 7),
('11111111-0000-0000-0000-000000000008',
 'Lunar Lander Optimization',
 'Reinforcement-learning agent solving Gymnasium LunarLander.',
 array['Python','Reinforcement Learning'], '2024', 8),
('11111111-0000-0000-0000-000000000009',
 'Fashion MNIST Classifier',
 'CNN classifier for the Fashion-MNIST dataset.',
 array['Python','PyTorch'], '2023', 9),
('11111111-0000-0000-0000-000000000010',
 'Bigram Language Model',
 'Character-level bigram language model built from first principles.',
 array['Python'], '2023', 10)
on conflict (id) do nothing;

insert into experiences (id, role, org, location, description, start_date, end_date, is_current, kind, sort_order) values
('22222222-0000-0000-0000-000000000001',
 'AI Intern (Agentic Systems & Automation Platforms)', 'Stealth Startup', 'Remote',
 'Automated root cause analysis and merging of industrial datasets; built an AutoML platform for industrial datasets and machineries; deployed AutoML + RAG assistant + image segmentation platform to Azure.',
 '2025-12-01', '2026-04-30', false, 'work', 1),
('22222222-0000-0000-0000-000000000002',
 'AI Intern (Agentic Systems)', 'Stealth Startup', 'Remote',
 'Worked with agentic AI frameworks including LangChain and Google ADK; built prototype agents with tool use, memory, and task decomposition across modular environments.',
 '2025-07-01', '2025-10-31', false, 'work', 2),
('22222222-0000-0000-0000-000000000003',
 'Python Intern', 'Jobmato', 'Remote',
 'Built large-scale web scraping and structured data ingestion pipelines for candidate-job mapping.',
 '2025-03-01', '2025-08-31', false, 'work', 3),
('22222222-0000-0000-0000-000000000004',
 'Research Intern', 'DLRL, DRDO', 'Hyderabad, Telangana',
 'Explored and benchmarked neural translation models (RNN, LSTM, GRU) for low-resource Indian languages; presented findings to senior scientists.',
 '2024-05-01', '2024-07-31', false, 'work', 4),
('22222222-0000-0000-0000-000000000005',
 'ML Society Coordinator', 'IIIT Guwahati', 'Guwahati, Assam',
 'Coordinator of the ML Society.', null, null, true, 'activity', 5),
('22222222-0000-0000-0000-000000000006',
 'Tech Head — INIZIO''25', 'IIIT Guwahati', 'Guwahati, Assam',
 'Tech head for the INIZIO''25 hackathon.', null, null, false, 'activity', 6),
('22222222-0000-0000-0000-000000000007',
 'Reading Club Coordinator', 'IIIT Guwahati', 'Guwahati, Assam',
 'Coordinator of the Reading Club.', null, null, true, 'activity', 7)
on conflict (id) do nothing;

insert into languages (id, name, rating, sort_order) values
('33333333-0000-0000-0000-000000000001', 'English', 5, 1),
('33333333-0000-0000-0000-000000000002', 'Hindi', 4, 2),
('33333333-0000-0000-0000-000000000003', 'Telugu', 3, 3),
('33333333-0000-0000-0000-000000000004', 'Assamese', 4, 4)
on conflict (id) do nothing;

insert into skills (id, name, category, icon_slug, sort_order) values
('44444444-0000-0000-0000-000000000001', 'Python', 'language', 'python', 1),
('44444444-0000-0000-0000-000000000002', 'Java', 'language', 'openjdk', 2),
('44444444-0000-0000-0000-000000000003', 'C/C++', 'language', 'cplusplus', 3),
('44444444-0000-0000-0000-000000000004', 'Go', 'language', 'go', 4),
('44444444-0000-0000-0000-000000000005', 'JavaScript', 'language', 'javascript', 5),
('44444444-0000-0000-0000-000000000006', 'React', 'framework', 'react', 6),
('44444444-0000-0000-0000-000000000007', 'Node.js', 'framework', 'nodedotjs', 7),
('44444444-0000-0000-0000-000000000008', 'Flask', 'framework', 'flask', 8),
('44444444-0000-0000-0000-000000000009', 'FastAPI', 'framework', 'fastapi', 9),
('44444444-0000-0000-0000-000000000010', 'PyTorch', 'library', 'pytorch', 10),
('44444444-0000-0000-0000-000000000011', 'NumPy', 'library', 'numpy', 11),
('44444444-0000-0000-0000-000000000012', 'OpenCV', 'library', 'opencv', 12),
('44444444-0000-0000-0000-000000000013', 'MediaPipe', 'library', 'mediapipe', 13),
('44444444-0000-0000-0000-000000000014', 'Scrapy', 'library', 'scrapy', 14),
('44444444-0000-0000-0000-000000000015', 'LangChain', 'ai_tool', 'langchain', 15),
('44444444-0000-0000-0000-000000000016', 'RAG', 'ai_tool', '', 16),
('44444444-0000-0000-0000-000000000017', 'Agent Systems', 'ai_tool', '', 17),
('44444444-0000-0000-0000-000000000018', 'n8n', 'ai_tool', 'n8n', 18),
('44444444-0000-0000-0000-000000000019', 'Git', 'dev_tool', 'git', 19),
('44444444-0000-0000-0000-000000000020', 'Arduino', 'dev_tool', 'arduino', 20),
('44444444-0000-0000-0000-000000000021', 'ESP32', 'dev_tool', 'espressif', 21)
on conflict (id) do nothing;

insert into blogs (id, title, slug, content, sort_order) values
('55555555-0000-0000-0000-000000000001', 'Hello World', 'hello-world',
 'First post — this blog is now served from Supabase. Edit or delete me in /admin.', 1)
on conflict (id) do nothing;
```

- [ ] **Step 3: Commit**

```bash
git add supabase/schema.sql supabase/seed.sql
git commit -m "feat: supabase schema (7 tables, RLS read-only public, media bucket) and seed data"
```

- [ ] **Step 4: CHECKPOINT — owner action required**

Ask the owner to (and wait for confirmation):
1. Create a Supabase project at https://supabase.com/dashboard.
2. SQL Editor → paste & run `supabase/schema.sql`, then `supabase/seed.sql`.
3. Copy Project URL, anon key, service_role key (Settings → API).
4. Create `.env.local` in repo root from `.env.example` with real values (also pick `ADMIN_PASSWORD`; `GITHUB_TOKEN` can wait until Task 4).

Verify: in Supabase Table Editor, `projects` has 10 rows, `experiences` 7, `languages` 4, `skills` 21, `profile` 1.

---

### Task 3: Server auth + table allowlist + admin Supabase client

**Files:**
- Create: `api/_lib/auth.js`
- Create: `api/_lib/auth.test.js`
- Create: `api/_lib/tables.js`
- Create: `api/_lib/tables.test.js`
- Create: `api/_lib/supabaseAdmin.js`

(Vercel ignores underscore-prefixed dirs under `api/`, so `_lib` files — including tests — never deploy as functions.)

**Interfaces:**
- Produces: `isAuthorized(req) -> boolean` (checks `x-admin-password` header against `process.env.ADMIN_PASSWORD`, timing-safe); `ALLOWED_TABLES: string[]` and `isAllowedTable(name) -> boolean`; `adminClient() -> SupabaseClient` (service role).

- [ ] **Step 1: Write failing tests — api/_lib/auth.test.js**

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { isAuthorized } from './auth.js'

describe('isAuthorized', () => {
  beforeEach(() => { process.env.ADMIN_PASSWORD = 'secret123' })

  it('accepts the correct password header', () => {
    expect(isAuthorized({ headers: { 'x-admin-password': 'secret123' } })).toBe(true)
  })
  it('rejects a wrong password', () => {
    expect(isAuthorized({ headers: { 'x-admin-password': 'nope' } })).toBe(false)
  })
  it('rejects a missing header', () => {
    expect(isAuthorized({ headers: {} })).toBe(false)
  })
  it('rejects everything when ADMIN_PASSWORD is unset', () => {
    delete process.env.ADMIN_PASSWORD
    expect(isAuthorized({ headers: { 'x-admin-password': '' } })).toBe(false)
  })
})
```

- [ ] **Step 2: Write failing tests — api/_lib/tables.test.js**

```js
import { describe, it, expect } from 'vitest'
import { ALLOWED_TABLES, isAllowedTable } from './tables.js'

describe('table allowlist', () => {
  it('contains exactly the 7 content tables', () => {
    expect([...ALLOWED_TABLES].sort()).toEqual(
      ['blogs','experiences','hero_images','languages','profile','projects','skills'])
  })
  it('accepts a known table', () => {
    expect(isAllowedTable('projects')).toBe(true)
  })
  it('rejects unknown / injection-y names', () => {
    expect(isAllowedTable('users; drop table projects')).toBe(false)
    expect(isAllowedTable('storage.objects')).toBe(false)
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — cannot resolve `./auth.js` / `./tables.js`.

- [ ] **Step 4: Implement api/_lib/auth.js**

```js
import { timingSafeEqual } from 'node:crypto'

export function isAuthorized(req) {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return false
  const given = String(req.headers?.['x-admin-password'] ?? '')
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}
```

- [ ] **Step 5: Implement api/_lib/tables.js**

```js
export const ALLOWED_TABLES = [
  'profile', 'projects', 'blogs', 'experiences', 'languages', 'skills', 'hero_images',
]

export function isAllowedTable(name) {
  return ALLOWED_TABLES.includes(name)
}
```

- [ ] **Step 6: Implement api/_lib/supabaseAdmin.js**

```js
import { createClient } from '@supabase/supabase-js'

export function adminClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm test`
Expected: 7 tests PASS.

- [ ] **Step 8: Commit**

```bash
git add api/_lib
git commit -m "feat: admin auth check, table allowlist, service-role supabase client (with tests)"
```

---

### Task 4: GitHub contributions endpoint

**Files:**
- Create: `api/_lib/github.js`
- Create: `api/_lib/github.test.js`
- Create: `api/contributions.js`

**Interfaces:**
- Consumes: `GITHUB_TOKEN` env var.
- Produces: `normalizeCalendar(calendar) -> { total, weeks: [{ days: [{ date, count, level }] }] }` (level 0–4); `GET /api/contributions?user=<login>` returning that JSON with `Cache-Control: s-maxage=3600`.

- [ ] **Step 1: Write failing test — api/_lib/github.test.js**

```js
import { describe, it, expect } from 'vitest'
import { normalizeCalendar } from './github.js'

const fixture = {
  totalContributions: 42,
  weeks: [
    { contributionDays: [
      { date: '2026-06-29', contributionCount: 0, contributionLevel: 'NONE' },
      { date: '2026-06-30', contributionCount: 3, contributionLevel: 'FIRST_QUARTILE' },
      { date: '2026-07-01', contributionCount: 12, contributionLevel: 'FOURTH_QUARTILE' },
    ]},
  ],
}

describe('normalizeCalendar', () => {
  it('maps GitHub quartile levels to 0-4 and keeps counts/dates', () => {
    const out = normalizeCalendar(fixture)
    expect(out.total).toBe(42)
    expect(out.weeks).toHaveLength(1)
    expect(out.weeks[0].days).toEqual([
      { date: '2026-06-29', count: 0, level: 0 },
      { date: '2026-06-30', count: 3, level: 1 },
      { date: '2026-07-01', count: 12, level: 4 },
    ])
  })
  it('defaults unknown levels to 0', () => {
    const out = normalizeCalendar({ totalContributions: 1, weeks: [
      { contributionDays: [{ date: '2026-01-01', contributionCount: 1, contributionLevel: 'WEIRD' }] },
    ]})
    expect(out.weeks[0].days[0].level).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `./github.js`.

- [ ] **Step 3: Implement api/_lib/github.js**

```js
const LEVELS = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
}

export function normalizeCalendar(calendar) {
  return {
    total: calendar.totalContributions,
    weeks: calendar.weeks.map((w) => ({
      days: w.contributionDays.map((d) => ({
        date: d.date,
        count: d.contributionCount,
        level: LEVELS[d.contributionLevel] ?? 0,
      })),
    })),
  }
}

export const CONTRIBUTIONS_QUERY = `
  query ($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks { contributionDays { date contributionCount contributionLevel } }
        }
      }
    }
  }
`
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (9 tests total).

- [ ] **Step 5: Implement api/contributions.js**

```js
import { normalizeCalendar, CONTRIBUTIONS_QUERY } from './_lib/github.js'

export default async function handler(req, res) {
  const login = String(req.query.user ?? 'iampruh887')
  if (!/^[A-Za-z0-9-]{1,39}$/.test(login)) {
    return res.status(400).json({ error: 'invalid username' })
  }
  if (!process.env.GITHUB_TOKEN) {
    return res.status(503).json({ error: 'GITHUB_TOKEN not configured' })
  }
  try {
    const resp = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `bearer ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: CONTRIBUTIONS_QUERY, variables: { login } }),
    })
    const json = await resp.json()
    const calendar = json?.data?.user?.contributionsCollection?.contributionCalendar
    if (!calendar) return res.status(502).json({ error: 'unexpected github response' })
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')
    return res.status(200).json(normalizeCalendar(calendar))
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
```

- [ ] **Step 6: Manual verification (requires GITHUB_TOKEN in .env.local)**

Run: `npx vercel dev` (link project if prompted), then in another shell:
`curl -s http://localhost:3000/api/contributions | head -c 300`
Expected: JSON starting `{"total":...,"weeks":[{"days":[{"date":...`. If the owner hasn't created the token yet, note it and continue — re-verify in Task 11.

- [ ] **Step 7: Commit**

```bash
git add api/_lib/github.js api/_lib/github.test.js api/contributions.js
git commit -m "feat: live GitHub contribution calendar endpoint with normalized levels"
```

---

### Task 5: Admin CRUD/upload/reorder/login endpoints

**Files:**
- Create: `api/admin/login.js`
- Create: `api/admin/[table].js`
- Create: `api/admin/[table]/[id].js`
- Create: `api/admin/reorder.js`
- Create: `api/admin/upload.js`

**Interfaces:**
- Consumes: `isAuthorized`, `isAllowedTable`, `adminClient` from Task 3.
- Produces HTTP API (all require header `x-admin-password`):
  - `POST /api/admin/login` → `{ ok: true }` | 401
  - `GET /api/admin/:table` → all rows (incl. unpublished), ordered
  - `POST /api/admin/:table` (JSON body = row) → created row (201)
  - `PATCH /api/admin/:table/:id` (JSON body = partial) → updated row
  - `DELETE /api/admin/:table/:id` → `{ ok: true }`
  - `POST /api/admin/reorder` body `{ table, ids: [...] }` → `{ ok: true }` (sort_order = position)
  - `POST /api/admin/upload` body `{ filename, contentType, dataBase64 }` → `{ url }`

- [ ] **Step 1: Implement api/admin/login.js**

```js
import { isAuthorized } from '../_lib/auth.js'

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' })
  if (!isAuthorized(req)) return res.status(401).json({ error: 'unauthorized' })
  return res.status(200).json({ ok: true })
}
```

- [ ] **Step 2: Implement api/admin/[table].js (list + create)**

```js
import { isAuthorized } from '../_lib/auth.js'
import { isAllowedTable } from '../_lib/tables.js'
import { adminClient } from '../_lib/supabaseAdmin.js'

export default async function handler(req, res) {
  if (!isAuthorized(req)) return res.status(401).json({ error: 'unauthorized' })
  const { table } = req.query
  if (!isAllowedTable(table)) return res.status(400).json({ error: 'unknown table' })
  const sb = adminClient()

  if (req.method === 'GET') {
    const query = sb.from(table).select('*')
    const { data, error } = table === 'profile'
      ? await query
      : await query.order('sort_order').order('created_at')
    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const { data, error } = await sb.from(table).insert(req.body).select().single()
    if (error) return res.status(400).json({ error: error.message })
    return res.status(201).json(data)
  }

  return res.status(405).json({ error: 'method not allowed' })
}
```

- [ ] **Step 3: Implement api/admin/[table]/[id].js (update + delete)**

```js
import { isAuthorized } from '../../_lib/auth.js'
import { isAllowedTable } from '../../_lib/tables.js'
import { adminClient } from '../../_lib/supabaseAdmin.js'

export default async function handler(req, res) {
  if (!isAuthorized(req)) return res.status(401).json({ error: 'unauthorized' })
  const { table, id } = req.query
  if (!isAllowedTable(table)) return res.status(400).json({ error: 'unknown table' })
  const sb = adminClient()

  if (req.method === 'PATCH') {
    const { data, error } = await sb.from(table).update(req.body).eq('id', id).select().single()
    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'DELETE') {
    const { error } = await sb.from(table).delete().eq('id', id)
    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'method not allowed' })
}
```

- [ ] **Step 4: Implement api/admin/reorder.js**

```js
import { isAuthorized } from '../_lib/auth.js'
import { isAllowedTable } from '../_lib/tables.js'
import { adminClient } from '../_lib/supabaseAdmin.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' })
  if (!isAuthorized(req)) return res.status(401).json({ error: 'unauthorized' })
  const { table, ids } = req.body ?? {}
  if (!isAllowedTable(table) || table === 'profile' || !Array.isArray(ids)) {
    return res.status(400).json({ error: 'bad request' })
  }
  const sb = adminClient()
  for (let i = 0; i < ids.length; i++) {
    const { error } = await sb.from(table).update({ sort_order: i + 1 }).eq('id', ids[i])
    if (error) return res.status(400).json({ error: error.message })
  }
  return res.status(200).json({ ok: true })
}
```

- [ ] **Step 5: Implement api/admin/upload.js**

```js
import { isAuthorized } from '../_lib/auth.js'
import { adminClient } from '../_lib/supabaseAdmin.js'

export const config = { api: { bodyParser: { sizeLimit: '4mb' } } }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' })
  if (!isAuthorized(req)) return res.status(401).json({ error: 'unauthorized' })
  const { filename, contentType, dataBase64 } = req.body ?? {}
  if (!filename || !contentType || !dataBase64) {
    return res.status(400).json({ error: 'filename, contentType, dataBase64 required' })
  }
  if (!contentType.startsWith('image/')) {
    return res.status(400).json({ error: 'only image uploads allowed' })
  }
  const buffer = Buffer.from(dataBase64, 'base64')
  const path = `${Date.now()}-${String(filename).replace(/[^\w.-]/g, '_')}`
  const sb = adminClient()
  const { error } = await sb.storage.from('media').upload(path, buffer, { contentType })
  if (error) return res.status(400).json({ error: error.message })
  const { data } = sb.storage.from('media').getPublicUrl(path)
  return res.status(200).json({ url: data.publicUrl })
}
```

- [ ] **Step 6: Manual verification with vercel dev**

With `.env.local` populated, run `npx vercel dev`, then:

```bash
# wrong password -> 401
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:3000/api/admin/login -H 'x-admin-password: wrong'
# right password -> 200
curl -s -X POST http://localhost:3000/api/admin/login -H "x-admin-password: $ADMIN_PASSWORD"
# list includes seeded rows
curl -s "http://localhost:3000/api/admin/languages" -H "x-admin-password: $ADMIN_PASSWORD"
# create + delete round-trip
curl -s -X POST http://localhost:3000/api/admin/languages -H "x-admin-password: $ADMIN_PASSWORD" \
  -H 'content-type: application/json' -d '{"name":"TestLang","rating":2,"sort_order":99}'
# (take the returned id) then:
curl -s -X DELETE "http://localhost:3000/api/admin/languages/<ID>" -H "x-admin-password: $ADMIN_PASSWORD"
```

Expected: 401, `{"ok":true}`, 4 languages, created row JSON, `{"ok":true}`.
Also verify RLS lockdown: an anon-key insert must fail:

```bash
curl -s "$VITE_SUPABASE_URL/rest/v1/languages" -H "apikey: $VITE_SUPABASE_ANON_KEY" \
  -H 'content-type: application/json' -d '{"name":"hax","rating":1}'
```

Expected: RLS policy violation error, NOT a created row.

- [ ] **Step 7: Commit**

```bash
git add api/admin
git commit -m "feat: password-gated admin API (crud, reorder, image upload, login)"
```

---

### Task 6: Client data layer

**Files:**
- Create: `src/lib/supabase.js`
- Create: `src/lib/content.js`
- Create: `src/lib/adminApi.js`

**Interfaces:**
- Produces:
  - `supabase` — anon client singleton.
  - `fetchList(table) -> Promise<row[]>` (published, ordered), `fetchProfile() -> Promise<row|null>`.
  - Admin: `adminLogin(password)`, `adminList(table)`, `adminCreate(table, row)`, `adminUpdate(table, id, patch)`, `adminDelete(table, id)`, `adminReorder(table, ids)`, `adminUpload(file) -> Promise<url>`. Password persisted in `sessionStorage['admin_pw']` by `adminLogin`.

- [ ] **Step 1: Implement src/lib/supabase.js**

```js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)
```

- [ ] **Step 2: Implement src/lib/content.js**

```js
import { supabase } from './supabase.js'

export async function fetchList(table) {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function fetchProfile() {
  const { data, error } = await supabase.from('profile').select('*').maybeSingle()
  if (error) throw error
  return data
}
```

- [ ] **Step 3: Implement src/lib/adminApi.js**

```js
const PW_KEY = 'admin_pw'

function headers(json = true) {
  const h = { 'x-admin-password': sessionStorage.getItem(PW_KEY) ?? '' }
  if (json) h['content-type'] = 'application/json'
  return h
}

async function unwrap(resPromise) {
  const res = await resPromise
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`)
  return body
}

export async function adminLogin(password) {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'x-admin-password': password },
  })
  if (!res.ok) throw new Error('Wrong password')
  sessionStorage.setItem(PW_KEY, password)
  return true
}

export function adminLoggedIn() {
  return Boolean(sessionStorage.getItem(PW_KEY))
}

export function adminLogout() {
  sessionStorage.removeItem(PW_KEY)
}

export const adminList = (table) =>
  unwrap(fetch(`/api/admin/${table}`, { headers: headers(false) }))

export const adminCreate = (table, row) =>
  unwrap(fetch(`/api/admin/${table}`, { method: 'POST', headers: headers(), body: JSON.stringify(row) }))

export const adminUpdate = (table, id, patch) =>
  unwrap(fetch(`/api/admin/${table}/${id}`, { method: 'PATCH', headers: headers(), body: JSON.stringify(patch) }))

export const adminDelete = (table, id) =>
  unwrap(fetch(`/api/admin/${table}/${id}`, { method: 'DELETE', headers: headers(false) }))

export const adminReorder = (table, ids) =>
  unwrap(fetch('/api/admin/reorder', { method: 'POST', headers: headers(), body: JSON.stringify({ table, ids }) }))

export async function adminUpload(file) {
  const dataBase64 = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
  const body = { filename: file.name, contentType: file.type, dataBase64 }
  const out = await unwrap(fetch('/api/admin/upload', {
    method: 'POST', headers: headers(), body: JSON.stringify(body),
  }))
  return out.url
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: success (files are imported later; build confirms syntax).

- [ ] **Step 5: Commit**

```bash
git add src/lib
git commit -m "feat: client data layer (public reads via anon key, admin api wrapper)"
```

---

### Task 7: URL routing (react-router) + About slice on the pie menu

**Files:**
- Modify: `src/main.jsx` (wrap in BrowserRouter)
- Modify: `src/App.jsx` (Routes instead of state)
- Modify: `src/Menu.jsx` (slice 3 navigates to `about`; simplify click handler)
- Create: `src/pages/About.jsx` (placeholder — replaced in Task 10)

**Interfaces:**
- Consumes: existing `Menu`, `Blog`, `Projects` components (`onNavigate(view)` prop API preserved).
- Produces: routes `/`, `/projects`, `/blogs`, `/about` (and `/admin` slot added in Task 11); `onNavigate` receives `'menu' | 'projects' | 'blogs' | 'about'`.

- [ ] **Step 1: Update src/main.jsx**

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

(Keep existing imports in main.jsx if they differ — the change is wrapping `<App />` in `<BrowserRouter>`.)

- [ ] **Step 2: Rewrite src/App.jsx with routes**

```jsx
import { Routes, Route, useNavigate } from 'react-router-dom'
import Menu from './Menu.jsx'
import Blog from './Blogs.jsx'
import Projects from './Projects.jsx'
import About from './pages/About.jsx'

const VIEW_PATHS = { menu: '/', projects: '/projects', blogs: '/blogs', about: '/about' }

function App() {
  const navigate = useNavigate()
  const handleNavigate = (view) => navigate(VIEW_PATHS[view] ?? '/')

  return (
    <Routes>
      <Route path="/" element={<Menu onNavigate={handleNavigate} />} />
      <Route path="/projects" element={<Projects onNavigate={handleNavigate} />} />
      <Route path="/blogs" element={<Blog onNavigate={handleNavigate} />} />
      <Route path="/about" element={<About onNavigate={handleNavigate} />} />
      <Route path="*" element={<Menu onNavigate={handleNavigate} />} />
    </Routes>
  )
}

export default App
```

- [ ] **Step 3: Create placeholder src/pages/About.jsx**

```jsx
import Menu from '../Menu.jsx'

function About({ onNavigate }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#fff' }}>
      <p>About page — built in Task 10.</p>
      <div style={{ transform: 'scale(0.4)' }}>
        <Menu onNavigate={onNavigate} />
      </div>
    </div>
  )
}

export default About
```

- [ ] **Step 4: Update src/Menu.jsx slice handling**

Replace `handleSliceClick` (currently only handles slices 1 and 2) with:

```jsx
  const SLICE_VIEWS = { 1: 'projects', 2: 'blogs', 3: 'about' }

  const handleSliceClick = (slice) => {
    const view = SLICE_VIEWS[slice]
    if (!view || !onNavigate) return
    setHoveredSlice(null)
    setIsNavigating(true)
    setTimeout(() => {
      onNavigate(view)
      setTimeout(() => setIsNavigating(false), 500)
    }, 0)
  }
```

(Keep `handleWalkthroughClick` and the rest of the component unchanged. The slice-3 `<path>` already calls `handleSliceClick(3)`.)

- [ ] **Step 5: Verify in dev server**

Run: `npm run dev`, open http://localhost:5173.
Expected: pie menu at `/`; clicking PROJECTS → `/projects` (carousel works); BLOGS → `/blogs`; ABOUT ME → `/about` placeholder; browser back/forward works; hard-refresh on `/projects` still renders (Vite dev serves SPA fallback natively).

- [ ] **Step 6: Commit**

```bash
git add src/main.jsx src/App.jsx src/Menu.jsx src/pages/About.jsx
git commit -m "feat: url routing with react-router; ABOUT ME pie slice navigates to /about"
```

---

### Task 8: Blogs page reads from Supabase

**Files:**
- Modify: `src/Blogs.jsx`

**Interfaces:**
- Consumes: `fetchList('blogs')` from Task 6. Blog row: `{ id, title, content, cover_image_url, published_at }`.

- [ ] **Step 1: Rewrite src/Blogs.jsx data handling**

Replace the hardcoded `totalBlogs = 10` and the ten `blogitem` divs. Full component:

```jsx
import { useState, useEffect } from "react";
import "./style/Blogs.css";
import Menu from "./Menu.jsx";
import { fetchList } from "./lib/content.js";
import commentIcon from "./assets/comment.png";
import chevronBackward from "./assets/chevron_backward.png";
import fullscreenIcon from "./assets/fullscreen.png";
import chevronForward from "./assets/chevron_forward.png";
import favoriteIcon from "./assets/favorite.png";

function Blog({ onNavigate }) {
    const [isListVisible, setIsListVisible] = useState(true);
    const [currentBlog, setCurrentBlog] = useState(0);
    const [blogs, setBlogs] = useState([]);
    const [status, setStatus] = useState('loading'); // loading | ready | error

    useEffect(() => {
        fetchList('blogs')
            .then((rows) => { setBlogs(rows); setStatus('ready'); })
            .catch(() => setStatus('error'));
    }, []);

    const totalBlogs = blogs.length;
    const toggleList = () => setIsListVisible(!isListVisible);
    const handlePrevious = () => setCurrentBlog((p) => (p === 0 ? totalBlogs - 1 : p - 1));
    const handleNext = () => setCurrentBlog((p) => (p === totalBlogs - 1 ? 0 : p + 1));

    const blog = blogs[currentBlog];

    return (
        <>
            <div className="blog-wrap">
                <div className={`hamburger ${!isListVisible ? 'rotated' : ''}`} onClick={toggleList}></div>
                {isListVisible && (
                    <div className="list">
                        {blogs.map((b, i) => (
                            <div key={b.id}
                                 className={`blogitem ${currentBlog === i ? 'active' : ''}`}
                                 onClick={() => setCurrentBlog(i)}>
                                {b.title}
                            </div>
                        ))}
                    </div>
                )}
                <div className="blogview-container">
                    <div className={`blogview ${!isListVisible ? 'expanded' : ''}`}>
                        <div className="blog-content">
                            {status === 'loading' && <p>Loading…</p>}
                            {status === 'error' && <p>Couldn’t load blogs. Try again later.</p>}
                            {status === 'ready' && !blog && <p>No blogs yet — check back soon.</p>}
                            {blog && (
                                <>
                                    <h2>{blog.title}</h2>
                                    {blog.cover_image_url && (
                                        <img src={blog.cover_image_url} alt="" className="blog-cover" />
                                    )}
                                    {blog.content.split(/\n{2,}/).map((para, i) => (
                                        <p key={i}>{para}</p>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                    <div className="icon-bar">
                        <img src={commentIcon} alt="comment" className="icon" />
                        <img src={chevronBackward} alt="backward" className="icon" onClick={handlePrevious} />
                        <img src={fullscreenIcon} alt="fullscreen" className="icon" />
                        <img src={chevronForward} alt="forward" className="icon" onClick={handleNext} />
                        <img src={favoriteIcon} alt="favorite" className="icon" />
                    </div>
                </div>
                <div className="menu-in-blog">
                    <Menu onNavigate={onNavigate} />
                </div>
            </div>
        </>
    );
}

export default Blog;
```

- [ ] **Step 2: Add blog cover style to src/style/Blogs.css**

Append:

```css
.blog-cover {
    max-width: 100%;
    border-radius: 8px;
    margin: 8px 0 16px;
}
```

- [ ] **Step 3: Verify in dev server**

`.env.local` must hold `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`. Run `npm run dev`, open `/blogs`.
Expected: the seeded "Hello World" blog appears in the list and renders; prev/next don't crash with one item; empty-DB case shows "No blogs yet".

- [ ] **Step 4: Commit**

```bash
git add src/Blogs.jsx src/style/Blogs.css
git commit -m "feat: blogs page renders content from supabase"
```

---

### Task 9: Projects page reads from Supabase

**Files:**
- Modify: `src/Projects.jsx`

**Interfaces:**
- Consumes: `fetchList('projects')`. Project row: `{ id, title, description, tech, repo_url, live_url, image_url, date_label }`.

- [ ] **Step 1: Rewrite src/Projects.jsx data handling**

Keep the carousel/eye-toggle structure and CSS classes exactly; replace hardcoded counts/labels. Full component:

```jsx
import { useState, useEffect } from "react";
import "./style/Projects.css";
import Menu from "./Menu.jsx";
import { fetchList } from "./lib/content.js";
import commentIcon from "./assets/comment.png";
import chevronBackward from "./assets/chevron_backward.png";
import fullscreenIcon from "./assets/fullscreen.png";
import chevronForward from "./assets/chevron_forward.png";
import favoriteIcon from "./assets/favorite.png";
import eyeOn from "./assets/Eye.png";
import eyeOff from "./assets/Eye off.png";

function ProjectCard({ project }) {
    if (!project) return null;
    return (
        <div className="project-card">
            <h2 className="project-title">{project.title}</h2>
            {project.image_url && <img src={project.image_url} alt="" className="project-image" />}
            <p className="project-desc">{project.description}</p>
            {project.tech?.length > 0 && (
                <div className="project-tech">
                    {project.tech.map((t) => <span key={t} className="tech-chip">{t}</span>)}
                </div>
            )}
            <div className="project-links">
                {project.repo_url && <a href={project.repo_url} target="_blank" rel="noreferrer">Code</a>}
                {project.live_url && <a href={project.live_url} target="_blank" rel="noreferrer">Live</a>}
            </div>
        </div>
    );
}

function Projects({ onNavigate }) {
    const [currentProject, setCurrentProject] = useState(0);
    const [direction, setDirection] = useState('');
    const [viewMode, setViewMode] = useState('on');
    const [isListVisible, setIsListVisible] = useState(true);
    const [projects, setProjects] = useState([]);
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        fetchList('projects')
            .then((rows) => { setProjects(rows); setStatus('ready'); })
            .catch(() => setStatus('error'));
    }, []);

    const totalProjects = projects.length;
    const getPreviousProject = () => (currentProject === 0 ? totalProjects - 1 : currentProject - 1);
    const getNextProject = () => (currentProject === totalProjects - 1 ? 0 : currentProject + 1);

    const handlePrevious = () => {
        if (totalProjects < 2) return;
        setDirection('slide-right');
        setTimeout(() => setCurrentProject((p) => (p === 0 ? totalProjects - 1 : p - 1)), 300);
        setTimeout(() => setDirection(''), 600);
    };

    const handleNext = () => {
        if (totalProjects < 2) return;
        setDirection('slide-left');
        setTimeout(() => setCurrentProject((p) => (p === totalProjects - 1 ? 0 : p + 1)), 300);
        setTimeout(() => setDirection(''), 600);
    };

    const toggleList = () => setIsListVisible(!isListVisible);

    if (status !== 'ready' || totalProjects === 0) {
        return (
            <div className="projects-wrap">
                <div className="projects-empty">
                    {status === 'loading' ? 'Loading…' :
                     status === 'error' ? 'Couldn’t load projects.' : 'No projects yet.'}
                </div>
                <div className="menu-in-projects"><Menu onNavigate={onNavigate} /></div>
            </div>
        );
    }

    return (
        <>
            <div className="projects-wrap">
                <div className="view-toggle">
                    <div className={`view-option ${viewMode === 'on' ? 'active' : ''}`} onClick={() => setViewMode('on')}>
                        <img src={eyeOn} alt="eye on" className="eye-icon" />
                    </div>
                    <div className={`view-option ${viewMode === 'off' ? 'active' : ''}`} onClick={() => setViewMode('off')}>
                        <img src={eyeOff} alt="eye off" className="eye-icon" />
                    </div>
                </div>

                {viewMode === 'on' ? (
                    <>
                        <div className="menu-in-projects">
                            <Menu onNavigate={onNavigate} />
                        </div>
                        <div className="projectview-container">
                            <div className="project-carousel">
                                <div className="project-side project-left" onClick={handlePrevious}>
                                    <div className="project-preview-content">
                                        <div className="preview-number">{projects[getPreviousProject()]?.title}</div>
                                    </div>
                                </div>
                                <div className={`projectview ${direction}`}>
                                    <ProjectCard project={projects[currentProject]} />
                                </div>
                                <div className="project-side project-right" onClick={handleNext}>
                                    <div className="project-preview-content">
                                        <div className="preview-number">{projects[getNextProject()]?.title}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="project-icon-bar">
                                <img src={commentIcon} alt="comment" className="project-icon" />
                                <img src={chevronBackward} alt="backward" className="project-icon" onClick={handlePrevious} />
                                <img src={fullscreenIcon} alt="fullscreen" className="project-icon" />
                                <img src={chevronForward} alt="forward" className="project-icon" onClick={handleNext} />
                                <img src={favoriteIcon} alt="favorite" className="project-icon" />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="projects-list-view">
                        <div className={`hamburger ${!isListVisible ? 'rotated' : ''}`} onClick={toggleList}></div>
                        {isListVisible && (
                            <div className="project-list">
                                {projects.map((p, i) => (
                                    <div key={p.id}
                                         className={`project-list-item ${i === currentProject ? 'active' : ''}`}
                                         onClick={() => setCurrentProject(i)}>
                                        {p.title}
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="projectview-list-container">
                            <div className={`projectview-list ${!isListVisible ? 'expanded' : ''}`}>
                                <ProjectCard project={projects[currentProject]} />
                            </div>
                            <div className="project-list-icon-bar">
                                <img src={commentIcon} alt="comment" className="project-icon" />
                                <img src={chevronBackward} alt="backward" className="project-icon" onClick={handlePrevious} />
                                <img src={fullscreenIcon} alt="fullscreen" className="project-icon" />
                                <img src={chevronForward} alt="forward" className="project-icon" onClick={handleNext} />
                                <img src={favoriteIcon} alt="favorite" className="project-icon" />
                            </div>
                        </div>
                        <div className="menu-in-projects-list">
                            <Menu onNavigate={onNavigate} />
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

export default Projects;
```

- [ ] **Step 2: Add card styles to src/style/Projects.css**

Append:

```css
.project-card {
    padding: 32px;
    max-width: 720px;
    margin: 0 auto;
    text-align: left;
    overflow-y: auto;
    max-height: 100%;
}

.project-title { margin: 0 0 12px; }

.project-image {
    max-width: 100%;
    max-height: 260px;
    border-radius: 8px;
    margin-bottom: 12px;
    object-fit: cover;
}

.project-desc { line-height: 1.5; color: #222; }

.project-tech { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }

.tech-chip {
    background: #F7FF00;
    color: #000;
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 600;
}

.project-links { display: flex; gap: 16px; }
.project-links a { color: #000; font-weight: 700; }

.projects-empty {
    height: 100vh;
    display: grid;
    place-items: center;
    color: #fff;
    font-size: 20px;
}

.project-list-item.active { background-color: #F7FF00; }
```

- [ ] **Step 3: Verify in dev server**

Run `npm run dev`, open `/projects`.
Expected: carousel shows the 10 seeded projects with real titles/descriptions/tech chips; side panels show neighbor titles; eye-off list view lists all titles and clicking selects.

- [ ] **Step 4: Commit**

```bash
git add src/Projects.jsx src/style/Projects.css
git commit -m "feat: projects page renders supabase projects in carousel and list views"
```

---

### Task 10: About Me page (Figma `about me` frame)

**Files:**
- Create: `src/components/ContributionGraph.jsx`
- Rewrite: `src/pages/About.jsx`
- Create: `src/style/About.css`

**Interfaces:**
- Consumes: `fetchList`, `fetchProfile` (Task 6); `GET /api/contributions?user=` (Task 4); `Menu` component.
- Produces: `/about` page with heatmap, rotating hero, pie menu, works list, avatar + skills grid, languages with stars, experience timeline.

- [ ] **Step 1: Implement src/components/ContributionGraph.jsx**

```jsx
import { useEffect, useState } from 'react'

const LEVEL_COLORS = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353']

function ContributionGraph({ username }) {
  const [cal, setCal] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!username) return
    fetch(`/api/contributions?user=${encodeURIComponent(username)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setCal)
      .catch(() => setError(true))
  }, [username])

  if (error) return <div className="contrib-fallback">contributions unavailable</div>
  if (!cal) return <div className="contrib-fallback">loading contributions…</div>

  return (
    <div className="contrib-graph" title={`${cal.total} contributions in the last year`}>
      {cal.weeks.map((week, wi) => (
        <div className="contrib-week" key={wi}>
          {week.days.map((day) => (
            <div
              key={day.date}
              className="contrib-day"
              style={{ backgroundColor: LEVEL_COLORS[day.level] }}
              title={`${day.date}: ${day.count}`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export default ContributionGraph
```

- [ ] **Step 2: Rewrite src/pages/About.jsx**

```jsx
import { useEffect, useState } from 'react'
import Menu from '../Menu.jsx'
import ContributionGraph from '../components/ContributionGraph.jsx'
import { fetchList, fetchProfile } from '../lib/content.js'
import '../style/About.css'

function Stars({ rating }) {
  return (
    <span className="stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rating ? 'star filled' : 'star'}>★</span>
      ))}
    </span>
  )
}

function HeroRotator({ images }) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (images.length < 2) return
    const t = setInterval(() => setIndex((i) => (i + 1) % images.length), 4000)
    return () => clearInterval(t)
  }, [images.length])
  if (images.length === 0) {
    return <div className="hero-placeholder">this image will keep changing</div>
  }
  const img = images[index]
  return (
    <figure className="hero-figure">
      <img src={img.image_url} alt={img.caption || ''} />
      {img.caption && <figcaption>{img.caption}</figcaption>}
    </figure>
  )
}

function formatRange(exp) {
  const fmt = (d) => d
    ? new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : ''
  if (!exp.start_date) return ''
  return `${fmt(exp.start_date)} – ${exp.is_current || !exp.end_date ? 'Present' : fmt(exp.end_date)}`
}

function About({ onNavigate }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    Promise.all([
      fetchProfile(),
      fetchList('projects'),
      fetchList('experiences'),
      fetchList('languages'),
      fetchList('skills'),
      fetchList('hero_images'),
    ])
      .then(([profile, projects, experiences, languages, skills, heroImages]) =>
        setData({ profile, projects, experiences, languages, skills, heroImages }))
      .catch(() => setError(true))
  }, [])

  if (error) return <div className="about-status">Couldn’t load this page.</div>
  if (!data) return <div className="about-status">Loading…</div>

  const { profile, projects, experiences, languages, skills, heroImages } = data

  return (
    <div className="about-wrap">
      <div className="about-grid">
        <section className="about-panel contrib-panel">
          <ContributionGraph username={profile?.github_username} />
          <span className="panel-note">learn how we count contributions</span>
        </section>

        <section className="about-panel hero-panel">
          <HeroRotator images={heroImages} />
        </section>

        <div className="about-menu">
          <Menu onNavigate={onNavigate} />
        </div>

        <section className="about-panel works-panel">
          <h3>works</h3>
          <ul className="works-list">
            {projects.map((p) => (
              <li key={p.id}>
                <span className="work-title">{p.title}</span>
                {p.tech?.length > 0 && <span className="work-tech">{p.tech.join(' · ')}</span>}
              </li>
            ))}
          </ul>
        </section>

        <section className="about-panel identity-panel">
          {profile?.avatar_url
            ? <img className="avatar" src={profile.avatar_url} alt={profile?.name || 'avatar'} />
            : <div className="avatar avatar-placeholder">{(profile?.name || '?').slice(0, 1)}</div>}
          <h2>{profile?.name}</h2>
          <p className="tagline">{profile?.tagline}</p>
          <p className="education">{profile?.education}</p>
          <div className="skills-grid">
            {skills.map((s) => (
              <div className="skill" key={s.id} title={s.name}>
                {s.icon_slug
                  ? <img src={`https://cdn.simpleicons.org/${s.icon_slug}`} alt={s.name} loading="lazy" />
                  : <span className="skill-text">{s.name}</span>}
              </div>
            ))}
          </div>
        </section>

        <section className="about-panel right-panel">
          <div className="languages">
            {languages.map((l) => (
              <div className="language-row" key={l.id}>
                <span>{l.name}</span>
                <Stars rating={l.rating} />
              </div>
            ))}
          </div>
          <div className="experience">
            {experiences.map((e) => (
              <div className="exp-row" key={e.id}>
                <div className="exp-role">{e.role}{e.org ? ` @ ${e.org}` : ''}</div>
                <div className="exp-meta">{formatRange(e)}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default About
```

- [ ] **Step 3: Create src/style/About.css**

```css
.about-wrap {
  min-height: 100vh;
  padding: 24px;
  box-sizing: border-box;
  color: #1a1a1a;
}

.about-status {
  height: 100vh;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 20px;
}

.about-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr 0.9fr;
  grid-template-areas:
    "contrib hero menu"
    "works identity right";
  gap: 20px;
  max-width: 1500px;
  margin: 0 auto;
}

.about-panel {
  background: #D9D9D9;
  border-radius: 16px;
  padding: 20px;
  overflow: hidden;
}

/* --- contribution heatmap (dark card like GitHub) --- */
.contrib-panel { grid-area: contrib; background: #0d1117; color: #c9d1d9; }
.contrib-graph { display: flex; gap: 3px; overflow-x: auto; padding-bottom: 6px; }
.contrib-week { display: flex; flex-direction: column; gap: 3px; }
.contrib-day { width: 10px; height: 10px; border-radius: 2px; flex: 0 0 auto; }
.contrib-fallback { padding: 24px 8px; font-size: 14px; }
.panel-note { font-size: 11px; opacity: 0.6; }

/* --- hero --- */
.hero-panel { grid-area: hero; background: #111; color: #eee; display: grid; place-items: center; min-height: 220px; }
.hero-figure { margin: 0; width: 100%; height: 100%; }
.hero-figure img { width: 100%; height: 100%; max-height: 260px; object-fit: cover; border-radius: 10px; }
.hero-figure figcaption { font-size: 12px; text-align: center; padding-top: 6px; }
.hero-placeholder { font-style: italic; opacity: 0.8; }

/* --- pie menu --- */
.about-menu { grid-area: menu; display: grid; place-items: center; }
.about-menu .wrapper { height: auto; }
.about-menu .circle { height: 260px; width: 260px; }

/* --- works --- */
.works-panel { grid-area: works; background: #541118; color: #f2e6e6; max-height: 460px; overflow-y: auto; }
.works-panel h3 { margin-top: 0; text-transform: uppercase; letter-spacing: 1px; }
.works-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.works-list li { background: rgba(255,255,255,0.07); border-radius: 8px; padding: 10px 12px; }
.work-title { display: block; font-weight: 700; }
.work-tech { display: block; font-size: 12px; opacity: 0.75; margin-top: 2px; }

/* --- identity --- */
.identity-panel { grid-area: identity; text-align: center; }
.avatar { width: 120px; height: 120px; border-radius: 50%; object-fit: cover; }
.avatar-placeholder { display: inline-grid; place-items: center; background: #8a0a0f; color: #fff; font-size: 48px; }
.identity-panel h2 { margin: 10px 0 2px; }
.tagline { margin: 0; font-weight: 600; }
.education { font-size: 13px; color: #444; }
.skills-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(44px, 1fr)); gap: 10px; margin-top: 14px; }
.skill { background: #fff; border-radius: 10px; padding: 8px; display: grid; place-items: center; min-height: 44px; box-sizing: border-box; }
.skill img { width: 28px; height: 28px; }
.skill-text { font-size: 10px; font-weight: 700; text-align: center; }

/* --- right column: languages + experience --- */
.right-panel { grid-area: right; background: #541118; color: #f2e6e6; display: flex; flex-direction: column; gap: 18px; max-height: 460px; overflow-y: auto; }
.language-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 18px; }
.stars .star { color: rgba(255,255,255,0.25); font-size: 18px; }
.stars .star.filled { color: #F7FF00; }
.exp-row { padding: 10px 0; border-top: 1px solid rgba(255,255,255,0.15); }
.exp-role { font-weight: 700; }
.exp-meta { font-size: 12px; opacity: 0.75; }

@media (max-width: 1000px) {
  .about-grid {
    grid-template-columns: 1fr;
    grid-template-areas: "menu" "contrib" "hero" "identity" "works" "right";
  }
}
```

- [ ] **Step 4: Verify in dev server**

Run `npm run dev` (use `npx vercel dev` if you also want the heatmap API locally), open `/about`.
Expected: heatmap (or "contributions unavailable" without token), hero placeholder text, working pie menu, 10 works, name/education, 21 skill tiles with icons, 4 languages with yellow stars, 7 experiences with date ranges. Layout roughly matches the Figma zones.

- [ ] **Step 5: Commit**

```bash
git add src/pages/About.jsx src/components/ContributionGraph.jsx src/style/About.css
git commit -m "feat: about me dashboard page (heatmap, hero, works, skills, languages, experience)"
```

---

### Task 11: Admin UI (`/admin`)

**Files:**
- Create: `src/admin/sectionConfig.js`
- Create: `src/admin/AdminSection.jsx`
- Create: `src/admin/Admin.jsx`
- Create: `src/style/Admin.css`
- Modify: `src/App.jsx` (add lazy `/admin` route)

**Interfaces:**
- Consumes: everything in `src/lib/adminApi.js` (Task 6).
- Produces: `/admin` — password login, tab per table, list + add/edit/delete/publish-toggle/move-up-down, image upload fields, profile single-row editor.

- [ ] **Step 1: Create src/admin/sectionConfig.js**

```js
// Field types: text | textarea | number | checkbox | date | image | tags | select
export const SECTIONS = {
  profile: {
    label: 'Profile',
    single: true,
    fields: [
      { name: 'name', type: 'text' },
      { name: 'tagline', type: 'text' },
      { name: 'bio', type: 'textarea' },
      { name: 'avatar_url', type: 'image' },
      { name: 'github_username', type: 'text' },
      { name: 'email', type: 'text' },
      { name: 'linkedin_url', type: 'text' },
      { name: 'education', type: 'textarea' },
      { name: 'resume_url', type: 'text' },
    ],
  },
  projects: {
    label: 'Projects',
    titleField: 'title',
    fields: [
      { name: 'title', type: 'text', required: true },
      { name: 'description', type: 'textarea' },
      { name: 'tech', type: 'tags' },
      { name: 'repo_url', type: 'text' },
      { name: 'live_url', type: 'text' },
      { name: 'image_url', type: 'image' },
      { name: 'date_label', type: 'text' },
      { name: 'featured', type: 'checkbox' },
    ],
  },
  blogs: {
    label: 'Blogs',
    titleField: 'title',
    fields: [
      { name: 'title', type: 'text', required: true },
      { name: 'slug', type: 'text' },
      { name: 'content', type: 'textarea' },
      { name: 'cover_image_url', type: 'image' },
      { name: 'published_at', type: 'date' },
    ],
  },
  experiences: {
    label: 'Experience',
    titleField: 'role',
    fields: [
      { name: 'role', type: 'text', required: true },
      { name: 'org', type: 'text' },
      { name: 'location', type: 'text' },
      { name: 'description', type: 'textarea' },
      { name: 'start_date', type: 'date' },
      { name: 'end_date', type: 'date' },
      { name: 'is_current', type: 'checkbox' },
      { name: 'kind', type: 'select', options: ['work', 'activity'] },
    ],
  },
  languages: {
    label: 'Languages',
    titleField: 'name',
    fields: [
      { name: 'name', type: 'text', required: true },
      { name: 'rating', type: 'number', min: 1, max: 5 },
    ],
  },
  skills: {
    label: 'Skills',
    titleField: 'name',
    fields: [
      { name: 'name', type: 'text', required: true },
      { name: 'category', type: 'select', options: ['language','framework','library','ai_tool','dev_tool','other'] },
      { name: 'icon_slug', type: 'text' },
    ],
  },
  hero_images: {
    label: 'Hero images',
    titleField: 'caption',
    fields: [
      { name: 'image_url', type: 'image', required: true },
      { name: 'caption', type: 'text' },
    ],
  },
}
```

- [ ] **Step 2: Create src/admin/AdminSection.jsx**

```jsx
import { useEffect, useState, useCallback } from 'react'
import {
  adminList, adminCreate, adminUpdate, adminDelete, adminReorder, adminUpload,
} from '../lib/adminApi.js'

function Field({ field, value, onChange }) {
  const set = (v) => onChange(field.name, v)
  switch (field.type) {
    case 'textarea':
      return <textarea rows={5} value={value ?? ''} onChange={(e) => set(e.target.value)} />
    case 'number':
      return <input type="number" min={field.min} max={field.max}
                    value={value ?? ''} onChange={(e) => set(Number(e.target.value))} />
    case 'checkbox':
      return <input type="checkbox" checked={Boolean(value)} onChange={(e) => set(e.target.checked)} />
    case 'date':
      return <input type="date" value={value ?? ''} onChange={(e) => set(e.target.value)} />
    case 'select':
      return (
        <select value={value ?? field.options[0]} onChange={(e) => set(e.target.value)}>
          {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      )
    case 'tags':
      return <input type="text" placeholder="comma, separated"
                    value={Array.isArray(value) ? value.join(', ') : (value ?? '')}
                    onChange={(e) => set(e.target.value)} />
    case 'image':
      return (
        <div className="image-field">
          {value && <img src={value} alt="" className="image-preview" />}
          <input type="file" accept="image/*" onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            try { set(await adminUpload(file)) }
            catch (err) { alert(`Upload failed: ${err.message}`) }
          }} />
          <input type="text" placeholder="or paste URL" value={value ?? ''}
                 onChange={(e) => set(e.target.value)} />
        </div>
      )
    default:
      return <input type="text" value={value ?? ''} onChange={(e) => set(e.target.value)} />
  }
}

function normalize(fields, form) {
  const out = { ...form }
  for (const f of fields) {
    if (f.type === 'tags' && typeof out[f.name] === 'string') {
      out[f.name] = out[f.name].split(',').map((s) => s.trim()).filter(Boolean)
    }
    if (f.type === 'date' && out[f.name] === '') out[f.name] = null
  }
  return out
}

function RowForm({ config, initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ?? {})
  const change = (name, v) => setForm((f) => ({ ...f, [name]: v }))
  const missing = config.fields.filter((f) => f.required && !form[f.name])
  return (
    <div className="row-form">
      {config.fields.map((f) => (
        <label key={f.name}>
          <span>{f.name}{f.required ? ' *' : ''}</span>
          <Field field={f} value={form[f.name]} onChange={change} />
        </label>
      ))}
      <div className="form-actions">
        <button disabled={missing.length > 0} onClick={() => onSave(normalize(config.fields, form))}>
          Save
        </button>
        {onCancel && <button className="secondary" onClick={onCancel}>Cancel</button>}
      </div>
    </div>
  )
}

function AdminSection({ table, config }) {
  const [rows, setRows] = useState([])
  const [editing, setEditing] = useState(null) // row id | 'new' | null
  const [error, setError] = useState('')

  const load = useCallback(() => {
    adminList(table).then(setRows).catch((e) => setError(e.message))
  }, [table])

  useEffect(() => { load() }, [load])

  const wrap = (fn) => async (...args) => {
    setError('')
    try { await fn(...args); setEditing(null); load() }
    catch (e) { setError(e.message) }
  }

  const create = wrap((form) => adminCreate(table, { ...form, sort_order: rows.length + 1 }))
  const update = wrap((id, form) => adminUpdate(table, id, form))
  const remove = wrap(async (id) => {
    if (!confirm('Delete this item?')) throw new Error('cancelled')
    await adminDelete(table, id)
  })
  const togglePublish = wrap((row) => adminUpdate(table, row.id, { is_published: !row.is_published }))
  const move = wrap(async (index, delta) => {
    const ids = rows.map((r) => r.id)
    const j = index + delta
    if (j < 0 || j >= ids.length) throw new Error('cancelled')
    ;[ids[index], ids[j]] = [ids[j], ids[index]]
    await adminReorder(table, ids)
  })

  if (config.single) {
    const row = rows[0]
    if (!row) return <p>Loading…</p>
    return (
      <div className="admin-section">
        {error && <p className="admin-error">{error}</p>}
        <RowForm config={config} initial={row} onSave={(form) => update(row.id, form)} />
      </div>
    )
  }

  return (
    <div className="admin-section">
      {error && <p className="admin-error">{error}</p>}
      {editing === 'new'
        ? <RowForm config={config} onSave={create} onCancel={() => setEditing(null)} />
        : <button onClick={() => setEditing('new')}>+ Add</button>}
      <ul className="admin-rows">
        {rows.map((row, i) => (
          <li key={row.id} className={row.is_published ? '' : 'unpublished'}>
            {editing === row.id ? (
              <RowForm config={config} initial={row}
                       onSave={(form) => update(row.id, form)}
                       onCancel={() => setEditing(null)} />
            ) : (
              <div className="admin-row">
                <span className="row-title">{row[config.titleField] || '(untitled)'}</span>
                <span className="row-actions">
                  <button onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
                  <button onClick={() => move(i, 1)} disabled={i === rows.length - 1}>↓</button>
                  <button onClick={() => togglePublish(row)}>
                    {row.is_published ? 'hide' : 'show'}
                  </button>
                  <button onClick={() => setEditing(row.id)}>edit</button>
                  <button className="danger" onClick={() => remove(row.id)}>delete</button>
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default AdminSection
```

- [ ] **Step 3: Create src/admin/Admin.jsx**

```jsx
import { useState } from 'react'
import { SECTIONS } from './sectionConfig.js'
import AdminSection from './AdminSection.jsx'
import { adminLogin, adminLoggedIn, adminLogout } from '../lib/adminApi.js'
import '../style/Admin.css'

function Login({ onSuccess }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    try { await adminLogin(password); onSuccess() }
    catch { setError('Wrong password') }
  }
  return (
    <form className="admin-login" onSubmit={submit}>
      <h1>Admin</h1>
      <input type="password" autoFocus placeholder="password"
             value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Enter</button>
      {error && <p className="admin-error">{error}</p>}
    </form>
  )
}

function Admin() {
  const [loggedIn, setLoggedIn] = useState(adminLoggedIn())
  const tables = Object.keys(SECTIONS)
  const [active, setActive] = useState('projects')

  if (!loggedIn) return <div className="admin-wrap"><Login onSuccess={() => setLoggedIn(true)} /></div>

  return (
    <div className="admin-wrap">
      <header className="admin-header">
        <h1>Portfolio admin</h1>
        <button className="secondary" onClick={() => { adminLogout(); setLoggedIn(false) }}>
          Log out
        </button>
      </header>
      <nav className="admin-tabs">
        {tables.map((t) => (
          <button key={t} className={t === active ? 'active' : ''} onClick={() => setActive(t)}>
            {SECTIONS[t].label}
          </button>
        ))}
      </nav>
      <AdminSection key={active} table={active} config={SECTIONS[active]} />
    </div>
  )
}

export default Admin
```

- [ ] **Step 4: Create src/style/Admin.css**

```css
.admin-wrap {
  min-height: 100vh;
  background: #1c1c1e;
  color: #eee;
  padding: 24px;
  box-sizing: border-box;
  font-family: system-ui, sans-serif;
}

.admin-login { max-width: 320px; margin: 20vh auto; display: flex; flex-direction: column; gap: 12px; }
.admin-header { display: flex; justify-content: space-between; align-items: center; max-width: 900px; margin: 0 auto; }
.admin-tabs { display: flex; flex-wrap: wrap; gap: 8px; max-width: 900px; margin: 16px auto; }
.admin-tabs button.active { background: #F7FF00; color: #000; }

.admin-section { max-width: 900px; margin: 0 auto; }
.admin-rows { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
.admin-rows li { background: #2a2a2e; border-radius: 8px; padding: 10px 14px; }
.admin-rows li.unpublished { opacity: 0.45; }
.admin-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.row-title { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.row-actions { display: flex; gap: 6px; flex: 0 0 auto; }

.row-form { display: flex; flex-direction: column; gap: 10px; background: #2a2a2e; border-radius: 8px; padding: 14px; margin-top: 12px; }
.row-form label { display: grid; grid-template-columns: 140px 1fr; align-items: start; gap: 10px; font-size: 14px; }
.row-form input[type="text"], .row-form input[type="number"], .row-form input[type="date"],
.row-form textarea, .row-form select {
  width: 100%; box-sizing: border-box; background: #1c1c1e; color: #eee;
  border: 1px solid #444; border-radius: 6px; padding: 8px;
}
.form-actions { display: flex; gap: 8px; }

.admin-wrap button {
  background: #3a3a3e; color: #eee; border: none; border-radius: 6px;
  padding: 6px 14px; cursor: pointer; font-size: 14px;
}
.admin-wrap button:hover { background: #4a4a4e; }
.admin-wrap button:disabled { opacity: 0.4; cursor: default; }
.admin-wrap button.danger { background: #7a1f1f; }
.admin-wrap button.secondary { background: transparent; border: 1px solid #555; }

.image-field { display: flex; flex-direction: column; gap: 6px; }
.image-preview { max-width: 160px; border-radius: 6px; }
.admin-error { color: #ff7b72; }
```

- [ ] **Step 5: Add the /admin route to src/App.jsx**

Add imports at the top and the route:

```jsx
import { lazy, Suspense } from 'react'
const Admin = lazy(() => import('./admin/Admin.jsx'))
```

Inside `<Routes>`, before the catch-all:

```jsx
<Route path="/admin" element={
  <Suspense fallback={<div style={{ color: '#fff', padding: 40 }}>Loading…</div>}>
    <Admin />
  </Suspense>
} />
```

- [ ] **Step 6: Verify end-to-end with vercel dev**

Run `npx vercel dev`, open http://localhost:3000/admin.
Expected: wrong password rejected; correct password shows tabs. Then verify each operation once on Projects: add a test project (appears on `/projects` and `/about`), edit it, move it with ↑/↓ (order changes on public pages), hide it (disappears from public pages but stays in admin, dimmed), upload an image (preview renders; URL is a supabase.co public URL), delete it. Verify Profile tab edits save. Verify Hero images upload shows up rotating on `/about`.

- [ ] **Step 7: Run full test suite + build**

Run: `npm test && npm run build`
Expected: all tests pass; build succeeds.

- [ ] **Step 8: Commit**

```bash
git add src/admin src/style/Admin.css src/App.jsx
git commit -m "feat: password-gated /admin panel with crud, reorder, publish toggle, uploads"
```

---

### Task 12: Deployment to Vercel + final verification

**Files:**
- Modify: `README.md` (replace Vite boilerplate with setup/deploy notes)

**Interfaces:**
- Consumes: everything above.

- [ ] **Step 1: Rewrite README.md**

```markdown
# Portfolio

React + Vite portfolio with a radial menu, driven by Supabase, deployed on Vercel.

## Stack
- Vite + React SPA, react-router
- Supabase: Postgres (RLS read-only public) + Storage (`media` bucket)
- Vercel serverless functions in `/api` (admin writes, GitHub contribution graph)

## Local dev
1. `npm install`
2. Copy `.env.example` → `.env.local` and fill in values.
3. `npx vercel dev` (serves the app AND `/api` functions). Plain `npm run dev` works for UI-only work.

## Content management
Open `/admin`, enter `ADMIN_PASSWORD`. Add/edit/delete/reorder/hide rows per section.
Writes go through `/api/admin/*` (service-role key, server-side only) — the browser never
holds a write-capable key.

## Database
Schema: `supabase/schema.sql` · Seed: `supabase/seed.sql` — run both in the Supabase SQL editor.

## Env vars (set the same in Vercel → Project Settings → Environment Variables)
| Var | Where | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | client | read-only public data |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | server | admin writes |
| `ADMIN_PASSWORD` | server | gates `/api/admin/*` |
| `GITHUB_TOKEN` | server | contribution heatmap (`read:user`) |
```

- [ ] **Step 2: CHECKPOINT — owner sets Vercel env vars**

Ask the owner to add all six env vars in Vercel → Project → Settings → Environment Variables (Production + Preview), including the `GITHUB_TOKEN` (fine-grained PAT, read-only). Wait for confirmation.

- [ ] **Step 3: Deploy and verify production**

```bash
git push origin main
```

Vercel auto-deploys. Then verify on the production URL:
1. `/` pie menu; all three slices navigate.
2. `/projects` shows seeded projects; `/blogs` shows the seed blog; `/about` fully renders including the live contribution heatmap.
3. Deep-link refresh works on every route (vercel.json rewrite).
4. `/admin` rejects a wrong password; with the right password a full add→edit→hide→delete cycle works and is reflected on the public pages.
5. Security spot-check: `curl -s -X POST https://<prod-domain>/api/admin/projects -H 'content-type: application/json' -d '{"title":"hax"}'` returns 401; the anon-key REST insert (Task 5 Step 6 command, with prod URL) is rejected by RLS; the JS bundle contains no service-role key (`grep -r "service_role" dist/` after `npm run build` finds nothing).

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: setup, content management, and deployment notes"
git push origin main
```

---

## Self-review notes

- Spec coverage: schema/RLS/bucket (T2), serverless admin API incl. login/upload/reorder (T5), contributions endpoint (T4), client read layer (T6), routing + about slice (T7), blogs/projects from DB (T8/T9), About page (T10), admin UI (T11), deploy + security verification (T12). Re-skin requirement resolved: existing CSS already implements the Figma red/gray/yellow theme (verified by color-sampling the Figma export vs. `src/index.css` + existing stylesheets); About page reuses the same palette.
- Deviations from spec (both approved directions): upload uses base64 JSON instead of multipart; reorder uses ↑/↓ buttons instead of drag. Login-token optimization skipped — password header per request (spec allows).
- Type consistency: `fetchList`/`fetchProfile` (T6) used in T8–T10; `adminList/adminCreate/adminUpdate/adminDelete/adminReorder/adminUpload` (T6) used in T11; `isAuthorized/isAllowedTable/adminClient` (T3) used in T4–T5; column names in T8–T11 match `schema.sql` (T2).
