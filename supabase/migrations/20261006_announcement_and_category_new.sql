-- Run in the Supabase SQL editor. Public library reads use the anon key.
-- prompt_drafts stays service-role only (RLS on, no anon policies).

alter table public.categories
	add column if not exists new_until timestamptz;

comment on column public.categories.new_until is
	'When in the future, the category shows the Category New badge.';

create table if not exists public.announcements (
	id uuid primary key default gen_random_uuid(),
	enabled boolean not null default false,
	message text not null default '',
	href text,
	cta_label text,
	ends_at timestamptz,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

comment on table public.announcements is
	'At most one enabled Announcement should be current. The app reads the newest enabled row.';

create table if not exists public.prompt_drafts (
	id uuid primary key default gen_random_uuid(),
	pack_slug text not null unique,
	payload jsonb not null,
	status text not null default 'draft'
		check (status in ('draft', 'approved')),
	source_url text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

comment on table public.prompt_drafts is
	'One Prompt Draft per Model Pack slug. Kickoff upserts the draft row. Approve publishes live rows.';

alter table public.announcements enable row level security;
alter table public.prompt_drafts enable row level security;

drop policy if exists announcements_public_read on public.announcements;
create policy announcements_public_read
	on public.announcements
	for select
	to anon, authenticated
	using (true);

-- Optional: keep ChatGPT Images showing as Category New until you set a real window.
-- update public.categories
-- set new_until = now() + interval '14 days'
-- where slug = 'chatgpt-images-2-0';

-- After creating a real starter category + Pack Tag, set OpenAI (and other vendors) to:
-- update public.authors set highlighted = false where slug in ('openai', 'anthropic');
-- update public.authors set verified = true where slug in ('openai', 'anthropic');
