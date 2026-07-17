-- Add favourite-folder support to the linked Supabase project.

create table if not exists public.gym_pilot_favourite_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(user_id, name)
);

create index if not exists gym_pilot_favourite_folders_user_id_idx
on public.gym_pilot_favourite_folders (user_id);

alter table public.gym_pilot_favourite_folders enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'gym_pilot_favourite_folders'
      and policyname = 'Users can manage their own favourite folders'
  ) then
    create policy "Users can manage their own favourite folders"
    on public.gym_pilot_favourite_folders
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  end if;
end
$$;

alter table public.gym_pilot_favourites
  add column if not exists folder text;

alter table public.gym_pilot_favourites
  add column if not exists folder_id uuid references public.gym_pilot_favourite_folders(id) on delete set null;

create index if not exists gym_pilot_favourites_folder_id_idx
on public.gym_pilot_favourites (folder_id);
