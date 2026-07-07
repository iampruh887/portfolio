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
  links jsonb not null default '[]',
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
  published_at date not null default current_date,
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
       for each row execute function extensions.moddatetime (updated_at)', t);
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
