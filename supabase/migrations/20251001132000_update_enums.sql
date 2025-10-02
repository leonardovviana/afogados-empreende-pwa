DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'registration_status_new'
  ) THEN
    DROP TYPE public.registration_status_new;
  END IF;

  CREATE TYPE public.registration_status_new AS ENUM (
    'Pendente',
    'Aguardando pagamento',
    'Participação confirmada',
    'Recusado'
  );

  ALTER TABLE public.exhibitor_registrations
    ALTER COLUMN status DROP DEFAULT,
    ALTER COLUMN status TYPE public.registration_status_new
      USING (
        CASE status::text
          WHEN 'Aprovado - aguardando pagamento' THEN 'Aguardando pagamento'
          WHEN 'Stand Confirmado' THEN 'Participação confirmada'
          WHEN 'Aprovado' THEN 'Participação confirmada'
          ELSE status::text
        END
      )::public.registration_status_new,
    ALTER COLUMN status SET DEFAULT 'Pendente';

  DROP TYPE public.registration_status;
  ALTER TYPE public.registration_status_new RENAME TO registration_status;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'payment_method_new'
  ) THEN
    DROP TYPE public.payment_method_new;
  END IF;

  CREATE TYPE public.payment_method_new AS ENUM (
    'R$ 700,00 No lançamento',
    'R$ 850,00 Após o lançamento',
    'R$ 750,00 Dois ou mais stands'
  );

  ALTER TABLE public.exhibitor_registrations
    ALTER COLUMN payment_method DROP DEFAULT,
    ALTER COLUMN payment_method TYPE public.payment_method_new
      USING (
        CASE payment_method::text
          WHEN 'À vista' THEN 'R$ 700,00 No lançamento'
          WHEN 'PIX' THEN 'R$ 700,00 No lançamento'
          WHEN 'Parcelado' THEN 'R$ 850,00 Após o lançamento'
          WHEN 'Boleto' THEN 'R$ 750,00 Dois ou mais stands'
          ELSE 'R$ 700,00 No lançamento'
        END
      )::public.payment_method_new,
    ALTER COLUMN payment_method SET DEFAULT 'R$ 700,00 No lançamento';

  DROP TYPE public.payment_method;
  ALTER TYPE public.payment_method_new RENAME TO payment_method;
END $$;
