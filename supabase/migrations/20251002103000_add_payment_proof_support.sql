alter table public.exhibitor_registrations
  add column if not exists payment_proof_path text,
  add column if not exists payment_proof_uploaded_at timestamptz;

-- Garantir bucket dedicado para comprovantes enviados pelos expositores
-- (uploads feitos pelo público via chave anon).
do $$
begin
  if not exists (
    select 1 from storage.buckets where id = 'payment-proofs'
  ) then
    insert into storage.buckets (id, name, public)
    values ('payment-proofs', 'payment-proofs', false);
  end if;
end $$;

-- Políticas de acesso para uploads realizados pelo público (anon)
-- e visualização/gestão no painel (authenticated).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Anon users can upload payment proofs'
  ) then
    create policy "Anon users can upload payment proofs"
      on storage.objects for insert to anon
      with check (bucket_id = 'payment-proofs');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Anon users can update payment proofs'
  ) then
    create policy "Anon users can update payment proofs"
      on storage.objects for update to anon
      using (bucket_id = 'payment-proofs')
      with check (bucket_id = 'payment-proofs');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Anon users can view payment proofs'
  ) then
    create policy "Anon users can view payment proofs"
      on storage.objects for select to anon
      using (bucket_id = 'payment-proofs');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated users can view payment proofs'
  ) then
    create policy "Authenticated users can view payment proofs"
      on storage.objects for select to authenticated
      using (bucket_id = 'payment-proofs');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated users can delete payment proofs'
  ) then
    create policy "Authenticated users can delete payment proofs"
      on storage.objects for delete to authenticated
      using (bucket_id = 'payment-proofs');
  end if;
end $$;
