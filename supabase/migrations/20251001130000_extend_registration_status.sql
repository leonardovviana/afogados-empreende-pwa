DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumlabel = 'Aprovado - aguardando pagamento'
      AND enumtypid = 'registration_status'::regtype
  ) THEN
    ALTER TYPE public.registration_status
      ADD VALUE 'Aprovado - aguardando pagamento'
      AFTER 'Aprovado';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumlabel = 'Stand Confirmado'
      AND enumtypid = 'registration_status'::regtype
  ) THEN
    ALTER TYPE public.registration_status
      ADD VALUE 'Stand Confirmado'
      AFTER 'Aprovado - aguardando pagamento';
  END IF;
END $$;
