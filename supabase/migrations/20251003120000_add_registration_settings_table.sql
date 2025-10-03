-- Manage launch pricing availability for exhibitor registrations.

create table if not exists public.registration_settings (
  id integer primary key check (id = 1),
  launch_pricing_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.registration_settings (id, launch_pricing_enabled)
values (1, true)
on conflict (id) do nothing;

create or replace function public.set_registration_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists registration_settings_set_updated_at on public.registration_settings;

create trigger registration_settings_set_updated_at
before update on public.registration_settings
for each row
execute function public.set_registration_settings_updated_at();

alter table public.registration_settings enable row level security;

create policy registration_settings_read_public
on public.registration_settings
for select
using (true);

create policy registration_settings_insert_auth
on public.registration_settings
for insert
with check (auth.role() = 'authenticated');

create policy registration_settings_update_auth
on public.registration_settings
for update
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');
