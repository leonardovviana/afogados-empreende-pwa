-- Fix search_path security issue for update_updated_at_column function
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = '';

-- Recreate the trigger that was dropped by CASCADE
CREATE TRIGGER update_exhibitor_registrations_updated_at
BEFORE UPDATE ON public.exhibitor_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();