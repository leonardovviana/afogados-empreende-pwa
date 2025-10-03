-- Adiciona coluna derivada para armazenar CPF/CNPJ normalizado (apenas dígitos)
-- e permite impor unicidade mesmo quando o cadastro original possui máscara.

alter table public.exhibitor_registrations
  add column if not exists cpf_cnpj_normalized text;

-- Preenche valores existentes convertendo o campo principal em dígitos.
update public.exhibitor_registrations
set cpf_cnpj_normalized = nullif(regexp_replace(coalesce(cpf_cnpj, ''), '[^0-9]', '', 'g'), '')
where cpf_cnpj is not null
  and (cpf_cnpj_normalized is distinct from nullif(regexp_replace(cpf_cnpj, '[^0-9]', '', 'g'), ''));

-- Garante unicidade somente quando o valor normalizado existir.
create unique index if not exists exhibitor_registrations_cpf_cnpj_normalized_key
  on public.exhibitor_registrations (cpf_cnpj_normalized)
  where cpf_cnpj_normalized is not null and length(cpf_cnpj_normalized) > 0;
