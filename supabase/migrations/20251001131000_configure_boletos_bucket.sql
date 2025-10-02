insert into storage.buckets (id, name, public)
values ('boletos', 'boletos', false)
on conflict (id) do nothing;

drop policy if exists "Authenticated users can upload boletos" on storage.objects;
drop policy if exists "Authenticated users can update boletos" on storage.objects;
drop policy if exists "Authenticated users can view boletos" on storage.objects;
drop policy if exists "Authenticated users can delete boletos" on storage.objects;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated users can upload boletos'
  ) then
    create policy "Authenticated users can upload boletos"
      on storage.objects for insert to authenticated
      with check (bucket_id = 'boletos');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated users can update boletos'
  ) then
    create policy "Authenticated users can update boletos"
      on storage.objects for update to authenticated
      using (bucket_id = 'boletos')
      with check (bucket_id = 'boletos');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated users can view boletos'
  ) then
    create policy "Authenticated users can view boletos"
      on storage.objects for select to authenticated
      using (bucket_id = 'boletos');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated users can delete boletos'
  ) then
    create policy "Authenticated users can delete boletos"
      on storage.objects for delete to authenticated
      using (bucket_id = 'boletos');
  end if;
end $$;
