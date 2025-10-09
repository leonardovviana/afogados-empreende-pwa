alter table public.registration_settings
  add column if not exists sales_closed boolean not null default false;

update public.registration_settings
  set sales_closed = coalesce(sales_closed, false)
  where id = 1;
