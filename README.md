# Portfolio

React + Vite portfolio with a radial menu, driven by Supabase, deployed on Vercel.

## Stack
- Vite + React SPA, react-router
- Supabase: Postgres (RLS read-only public) + Storage (`media` bucket)
- Vercel serverless functions in `/api` (admin writes, GitHub contribution graph)

## Local dev
1. `npm install`
2. Copy `.env.example` → `.env.local` **and** `.env` (Vite reads `.env.local`; the
   Vercel dev functions read `.env`). Fill in the values in both.
3. `npx vercel dev` (serves the app AND `/api` functions on http://localhost:3000).
   Plain `npm run dev` works for UI-only work but does not serve `/api`.

## Content management
Two ways in, same password (`ADMIN_PASSWORD`):
- **Secret combo**: type `pruh` anywhere on the site (or press `Ctrl+Shift+A`) → enter
  the password → a floating "✎ edit site" chip appears and stays for the session.
- **Direct**: open `/admin` and log in.

Add/edit/delete/reorder/hide rows per section (projects, blogs, experiences,
languages, skills, hero images, profile). Projects support free-form links —
one per line as `Label | https://url` — rendered as buttons on the project card.
Writes go through `/api/admin/*` (service-role key, server-side only) — the browser
never holds a write-capable key.

## Database
Schema: `supabase/schema.sql` · Seed: `supabase/seed.sql` — run both in the Supabase
SQL editor. Existing databases also need `supabase/migration-002-project-links.sql`
(adds the `links` column to projects).

## Env vars (set the same in Vercel → Project Settings → Environment Variables)
| Var | Where | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | client | read-only public data |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | server | admin writes |
| `ADMIN_PASSWORD` | server | gates `/api/admin/*` |
| `GITHUB_TOKEN` | server | contribution heatmap (`read:user`) |
