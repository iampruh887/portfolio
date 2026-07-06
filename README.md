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
Open `/admin`, enter `ADMIN_PASSWORD`. Add/edit/delete/reorder/hide rows per section
(projects, blogs, experiences, languages, skills, hero images, profile). Writes go
through `/api/admin/*` (service-role key, server-side only) — the browser never holds
a write-capable key.

## Database
Schema: `supabase/schema.sql` · Seed: `supabase/seed.sql` — run both in the Supabase
SQL editor.

## Env vars (set the same in Vercel → Project Settings → Environment Variables)
| Var | Where | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | client | read-only public data |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | server | admin writes |
| `ADMIN_PASSWORD` | server | gates `/api/admin/*` |
| `GITHUB_TOKEN` | server | contribution heatmap (`read:user`) |
