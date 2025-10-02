do $$
begin
  if not exists (
    select 1 from storage.buckets where id = 'boletos'
  ) then
    insert into storage.buckets (id, name, public)
    values ('boletos', 'boletos', false);
  end if;
end $$;

-- Garantir políticas de acesso consistentes para usuários autenticados
-- usando blocos condicionais para evitar duplicidades.
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

-- Permitir leitura anônima via URLs assinadas, respeitando o tempo de expiração.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Anonymously download signed boletos'
  ) then
    create policy "Anonymously download signed boletos"
      on storage.objects for select to anon
      using (bucket_id = 'boletos');
  end if;
end $$;
