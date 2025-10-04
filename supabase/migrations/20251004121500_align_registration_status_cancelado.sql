DO $$
DECLARE
  has_recusado boolean := EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumtypid = 'registration_status'::regtype
      AND enumlabel = 'Recusado'
  );
BEGIN
  IF has_recusado THEN
    ALTER TYPE public.registration_status RENAME VALUE 'Recusado' TO 'Cancelado';
  END IF;
END $$;

-- Ensure existing rows use the normalized label
UPDATE public.exhibitor_registrations
SET status = 'Cancelado'
WHERE status::text = 'Cancelado';

UPDATE public.web_push_subscriptions
SET last_status = 'Cancelado'
WHERE last_status::text = 'Cancelado';
