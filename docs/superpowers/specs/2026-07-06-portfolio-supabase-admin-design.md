# Portfolio: About-Me page, Supabase content, and password-gated admin

**Date:** 2026-07-06
**Owner:** Nishant Prabhat (github: `iampruh887`)
**Status:** Approved design — ready for implementation plan

## 1. Goal

Turn the currently-hardcoded Vite + React portfolio into a content-driven site backed by
Supabase, add the new **About Me** dashboard from Figma, re-skin the existing Projects and
Blogs screens to the red Figma theme, and give the owner a password-gated `/admin` panel to
add / edit / remove / reorder / hide content as his progress changes. The site stays deployed
on Vercel as a Vite SPA.

Figma source: `daTqqET21I7yRi0OX8dGgg` (frames: `landing`, `projects-normal`, `blogs`, `about me`).

## 2. Scope

In scope:
- New **About Me** page (rich dashboard).
- **Red re-skin** of Projects and Blogs screens to match Figma.
- **Supabase** as the content store for all list content.
- **Serverless admin API** on Vercel (`/api/*`) + `/admin` UI, password-gated.
- **Live GitHub contribution heatmap** via serverless function.
- **Supabase Storage** for image uploads.

Out of scope (for now):
- Supabase Auth / multi-user accounts (single owner, password gate only).
- Comments/favorites persistence (icons in Figma remain decorative unless trivially wired).
- Pixel-perfect rebuild of Projects/Blogs interaction (keep existing behavior, just re-skin).

## 3. Architecture

Vite React SPA (client) + Vercel serverless functions (`/api`) + Supabase (Postgres + Storage).

```
Browser (public site)  --anon key, RLS read-only-->  Supabase (SELECT published rows)
Browser (/admin)       --POST + password header-->   Vercel /api/admin/*  --service-role key-->  Supabase (INSERT/UPDATE/DELETE)
Browser (About Me)     --GET-->                       Vercel /api/contributions --GitHub token--> GitHub GraphQL
```

**Security model (the reason for the serverless layer):**
- The browser only ever holds the Supabase **anon** key. RLS policies allow **SELECT only** (and only `is_published = true` rows for public reads).
- All writes and Storage uploads go through `/api/admin/*`, which validates a shared secret
  (`ADMIN_PASSWORD`) sent by the admin UI, then performs the write with the Supabase
  **service-role** key. The service-role key and admin password live only in Vercel env vars,
  never in client bundles.
- This makes the password gate real: without the serverless layer, a client-side write key
  would let anyone bypass the UI and write directly.

### Environment variables
- Client (build-time, `VITE_` prefixed): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- Server (Vercel functions only): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `GITHUB_TOKEN`.

### Routing
- Add `react-router-dom`. Routes: `/` (menu), `/projects`, `/blogs`, `/about`, `/admin`.
- Keep the existing radial-menu navigation working (it drives the same routes).
- Add `vercel.json` with an SPA rewrite (all non-`/api` paths -> `/index.html`) so deep links
  and `/admin` load correctly on Vercel. `/api/*` is excluded from the rewrite.

## 4. Data model (Supabase / Postgres)

All list tables have `id uuid pk default gen_random_uuid()`, `sort_order int`,
`is_published boolean default true`, `created_at timestamptz default now()`,
`updated_at timestamptz default now()`. Ordering is `sort_order asc, created_at asc`.

- **`profile`** (single row): `name`, `tagline`, `bio`, `avatar_url`, `github_username`,
  `email`, `linkedin_url`, `education` (text or jsonb), `resume_url`.
- **`projects`** (feeds BOTH the Projects carousel and the About-Me works list):
  `title`, `description`, `tech text[]`, `repo_url`, `live_url`, `image_url`, `date_label`,
  `featured boolean` (optional: highlight in carousel), plus the common fields.
- **`blogs`**: `title`, `slug`, `content` (markdown/text), `cover_image_url`, `published_at`,
  plus common fields.
- **`experiences`**: `role`, `org`, `location`, `description`, `start_date`, `end_date`,
  `is_current boolean`, `kind` (e.g. `work` | `activity`), plus common fields.
- **`languages`**: `name`, `rating smallint` (1–5), plus common fields.
- **`skills`**: `name`, `category` (`language`|`framework`|`library`|`ai_tool`|`dev_tool`),
  `icon_slug`, plus common fields.
- **`hero_images`** ("image will keep changing"): `image_url`, `caption`, plus common fields.

### RLS policies
- Enable RLS on every table.
- Public role: `SELECT` allowed where `is_published = true` (all tables). No insert/update/delete.
- Writes only via service-role key (bypasses RLS) inside serverless functions.

### Storage
- One public bucket `media` (public read). Uploads only through `/api/admin/upload`
  (service-role). Returns a public URL stored in the relevant row's `*_url` field.

## 5. Serverless API (`/api`, Vercel functions)

- `GET /api/contributions` — fetches the GitHub contribution calendar for
  `profile.github_username` via GitHub GraphQL (`contributionsCollection`) using `GITHUB_TOKEN`;
  returns a normalized `{ weeks: [{ days: [{ date, count, level }] }], total }`. Cached
  (e.g. `s-maxage`) to avoid rate limits.
- `POST /api/admin/login` — verifies `ADMIN_PASSWORD`; returns a short-lived signed token
  (HMAC of a timestamp) the admin UI stores in memory/session for subsequent calls. (Simplest
  acceptable: require the password header on each write; token is an optimization.)
- `POST /api/admin/:table` — create row. `PATCH /api/admin/:table/:id` — update.
  `DELETE /api/admin/:table/:id` — delete. `POST /api/admin/reorder` — bulk sort_order update.
  All require a valid admin credential; all use the service-role client.
- `POST /api/admin/upload` — multipart image upload to the `media` bucket; returns public URL.
- A shared `api/_lib/` holds the service-role Supabase client factory and the auth check.

## 6. Admin UI (`/admin`)

- Password screen -> dashboard with a section/tab per table.
- Each section: list of existing rows (respecting sort_order) with edit / delete / publish
  toggle / drag-to-reorder, plus an "Add" form. Image fields use the upload endpoint.
- `profile` section edits the single row.
- Minimal styling; functional over pretty. Not linked from the public navigation.

## 7. About Me page (public)

Layout mirrors Figma frame `about me` (red textured background, rounded off-white panels):
- **Top-left:** GitHub contribution heatmap (live, from `/api/contributions`).
- **Top-center:** "this image will keep changing" hero — rotates through `hero_images`.
- **Top-right:** the radial pie menu (reused component).
- **Bottom-left:** works list from `projects` (title + tech, icon).
- **Bottom-center:** profile avatar (`profile.avatar_url`) + tech-stack logo grid from `skills`.
- **Right-center:** spoken `languages` with star ratings.
- **Bottom-right:** `experiences` timeline.
All sections read from Supabase; empty/hidden rows simply don't render.

### Seed content (initial rows)
- **projects** (works): Hybrid Multi-Tier GPU Offloading; AI Representation Optimizer; Facial
  Recognition & Classification; DeepFake Audio Detection; Visually Controlled Robotic Arm;
  nanoGPT on Hindi literature; CLIP from Scratch; Lunar Lander Optimization; Fashion MNIST
  Classifier; Bigram Language Model. (First five carry full descriptions/tech from the resume.)
- **experiences:** AI Intern · Agentic Systems & Automation · Stealth Startup (Dec 2025–Apr 2026);
  AI Intern · Agentic Systems · Stealth Startup (Jul–Oct 2025); Python Intern · Jobmato
  (Mar–Aug 2025); Research Intern · DLRL, DRDO (May–Jul 2024); ML Society Coordinator,
  Tech Head INIZIO'25, Reading Club Coordinator · IIIT Guwahati (kind=activity).
- **languages:** English 5, Assamese 4, Hindi 4, Telugu 3.
- **skills:** Python, Java, C/C++, Go, JavaScript, React, Node.js, Bootstrap, Flask, FastAPI,
  PyTorch, NumPy, Matplotlib, OpenCV, MediaPipe, Scrapy, LangChain, google-adk, nanoGPT, RAG,
  Reinforcement Learning, Agent Systems, n8n, Git, ESP32, Arduino (categorized).
- **profile:** Nishant Prabhat; IIIT Guwahati B.Tech CSE (CPI 7.49); github `iampruh887`;
  email `iampruh887@gmail.com`; linkedin `nishant-prabhat`.

Seed data is applied as an idempotent SQL/JS seed script the owner runs once against Supabase.

## 8. Re-skin (Projects & Blogs)

- Apply the red textured background + rounded off-white panel styling from Figma to the existing
  `Projects.jsx`/`Blogs.jsx` screens. Keep their existing carousel / list-toggle behavior.
- Replace hardcoded arrays (`totalBlogs = 10`, `totalProjects = 5`, `blogitem1..10`, `Project N`)
  with data fetched from Supabase (`blogs`, `projects`).

## 9. Testing / verification

- Supabase: RLS denies anonymous writes (verify a direct anon insert fails); public SELECT
  returns only published rows.
- Admin API: wrong password rejected; correct password can create/update/delete/reorder/upload.
- About Me renders all sections from seeded data; hiding a row removes it from the public page.
- `/api/contributions` returns a valid calendar for `iampruh887`.
- Local dev works (Vite + `vercel dev` for functions); production build deploys to Vercel with
  env vars set.

## 10. Open items / assumptions

- Company name is literally "Stealth Startup" per resume (kept as-is).
- Figma-only activities (overBOOKED, Mavericks society) omitted from seed; re-addable via admin.
- Avatar and hero images to be uploaded by the owner via the admin after deploy (seed uses
  placeholders or empty until uploaded).
- GitHub token is a read-only classic/fine-grained PAT with `read:user` scope.
