-- Create enum for subscription status if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'push_subscription_status'
    ) THEN
        CREATE TYPE public.push_subscription_status AS ENUM ('active', 'revoked');
    END IF;
END
$$;

-- Create table to persist push subscriptions per registration
CREATE TABLE IF NOT EXISTS public.web_push_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id uuid REFERENCES public.exhibitor_registrations(id) ON DELETE CASCADE,
    cpf_hash text NOT NULL,
    endpoint text NOT NULL,
    subscription jsonb NOT NULL,
    status public.push_subscription_status NOT NULL DEFAULT 'active',
    last_status public.registration_status,
    company_name text,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (registration_id, endpoint, cpf_hash)
);

-- Helpful indexes for lookups
CREATE INDEX IF NOT EXISTS web_push_subscriptions_endpoint_idx ON public.web_push_subscriptions (endpoint);
CREATE INDEX IF NOT EXISTS web_push_subscriptions_registration_idx ON public.web_push_subscriptions (registration_id);
CREATE INDEX IF NOT EXISTS web_push_subscriptions_status_idx ON public.web_push_subscriptions (status);

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.set_web_push_subscriptions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_web_push_subscriptions_updated_at ON public.web_push_subscriptions;
CREATE TRIGGER trg_web_push_subscriptions_updated_at
BEFORE UPDATE ON public.web_push_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.set_web_push_subscriptions_updated_at();

-- Enable RLS
ALTER TABLE public.web_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: allow anonymous clients to insert/update/delete subscriptions tied to their endpoint + hash
CREATE POLICY web_push_subscriptions_insert_policy
    ON public.web_push_subscriptions
    FOR INSERT
    TO anon
    WITH CHECK (TRUE);

CREATE POLICY web_push_subscriptions_update_policy
    ON public.web_push_subscriptions
    FOR UPDATE
    TO anon
    USING (TRUE)
    WITH CHECK (TRUE);

CREATE POLICY web_push_subscriptions_delete_policy
    ON public.web_push_subscriptions
    FOR DELETE
    TO anon
    USING (TRUE);

CREATE POLICY web_push_subscriptions_select_policy
    ON public.web_push_subscriptions
    FOR SELECT
    TO anon
    USING (TRUE);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.web_push_subscriptions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.web_push_subscriptions TO authenticated;
