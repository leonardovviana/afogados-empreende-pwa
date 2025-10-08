-- Add new registration status for stand selection flow
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'registration_status'
          AND e.enumlabel = 'Escolha seu stand'
    ) THEN
        ALTER TYPE registration_status ADD VALUE 'Escolha seu stand';
    END IF;
END $$;

-- Extend exhibitor_registrations with stand selection metadata
ALTER TABLE public.exhibitor_registrations
    ADD COLUMN IF NOT EXISTS stand_selection_slot_start integer,
    ADD COLUMN IF NOT EXISTS stand_selection_slot_end integer,
    ADD COLUMN IF NOT EXISTS stand_selection_window_started_at timestamptz,
    ADD COLUMN IF NOT EXISTS stand_selection_window_expires_at timestamptz,
    ADD COLUMN IF NOT EXISTS stand_selection_choices text,
    ADD COLUMN IF NOT EXISTS stand_selection_submitted_at timestamptz,
    ADD COLUMN IF NOT EXISTS stand_selection_notification_last_sent timestamptz,
    ADD COLUMN IF NOT EXISTS stand_selection_notifications_count integer DEFAULT 0 NOT NULL;

ALTER TABLE public.exhibitor_registrations
    ADD CONSTRAINT stand_selection_slot_check
    CHECK (
        stand_selection_slot_start IS NULL
        OR stand_selection_slot_end IS NULL
        OR stand_selection_slot_start <= stand_selection_slot_end
    );

CREATE INDEX IF NOT EXISTS exhibitor_registrations_stand_selection_status_idx
    ON public.exhibitor_registrations (status, stand_selection_window_started_at);

CREATE INDEX IF NOT EXISTS exhibitor_registrations_stand_selection_deadline_idx
    ON public.exhibitor_registrations (stand_selection_window_expires_at);
