alter table public.exhibitor_registrations
  add column if not exists boleto_url text,
  add column if not exists boleto_uploaded_at timestamptz;
