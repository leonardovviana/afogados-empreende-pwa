DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'payment_method'
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM pg_enum
      WHERE enumtypid = 'payment_method'::regtype
        AND enumlabel = 'R$ 700,00 No lançamento'
    ) THEN
      ALTER TYPE public.payment_method
        RENAME VALUE 'R$ 700,00 No lançamento' TO 'R$ 700,00 Lançamento';
    END IF;
  END IF;
END $$;

ALTER TABLE public.exhibitor_registrations
  ALTER COLUMN payment_method SET DEFAULT 'R$ 700,00 Lançamento';
