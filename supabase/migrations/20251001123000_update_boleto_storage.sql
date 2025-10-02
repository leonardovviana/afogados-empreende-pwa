do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'exhibitor_registrations'
      and column_name = 'boleto_url'
  ) then
    alter table public.exhibitor_registrations
      rename column boleto_url to boleto_path;
  end if;
end $$;

update public.exhibitor_registrations
set boleto_path = regexp_replace(
    boleto_path,
    '^https?://[^/]+/storage/v1/object/public/boletos/',
    ''
  )
where boleto_path is not null;
