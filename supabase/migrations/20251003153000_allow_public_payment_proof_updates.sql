-- Allow anonymous visitors to update only the payment proof columns while
-- protecting every other field on exhibitor registrations.

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'exhibitor_registrations'
      and policyname = 'Anon users can update payment proof'
  ) then
    create policy "Anon users can update payment proof"
      on public.exhibitor_registrations
      for update
      to anon
      using (true)
      with check (true);
  end if;
end $$;

create or replace function public.restrict_public_payment_proof_updates()
returns trigger
language plpgsql
as $$
declare
  request_role text := current_setting('request.jwt.claim.role', true);
begin
  if request_role = 'anon' then
    if new.id is distinct from old.id
      or new.cpf_cnpj is distinct from old.cpf_cnpj
      or new.company_name is distinct from old.company_name
      or new.responsible_name is distinct from old.responsible_name
      or new.phone is distinct from old.phone
      or new.company_size is distinct from old.company_size
      or new.business_segment is distinct from old.business_segment
      or new.stands_quantity is distinct from old.stands_quantity
      or new.payment_method is distinct from old.payment_method
      or new.status is distinct from old.status
      or new.total_amount is distinct from old.total_amount
      or new.boleto_path is distinct from old.boleto_path
      or new.boleto_uploaded_at is distinct from old.boleto_uploaded_at
    then
      raise exception 'Somente o comprovante de pagamento pode ser atualizado por visitantes.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_public_payment_proof_updates on public.exhibitor_registrations;

create trigger protect_public_payment_proof_updates
before update on public.exhibitor_registrations
for each row
execute function public.restrict_public_payment_proof_updates();
