-- Create enum for company size
CREATE TYPE public.company_size AS ENUM ('MEI', 'ME', 'EPP', 'Médio', 'Grande', 'Autônomo informal');

-- Create enum for registration status
CREATE TYPE public.registration_status AS ENUM ('Pendente', 'Aprovado', 'Recusado');

-- Create enum for payment method
CREATE TYPE public.payment_method AS ENUM ('À vista', 'Parcelado', 'PIX', 'Boleto');

-- Create table for exhibitor registrations
CREATE TABLE public.exhibitor_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cpf_cnpj TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  responsible_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  company_size company_size NOT NULL,
  business_segment TEXT NOT NULL,
  stands_quantity INTEGER NOT NULL DEFAULT 1,
  payment_method payment_method NOT NULL,
  status registration_status NOT NULL DEFAULT 'Pendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.exhibitor_registrations ENABLE ROW LEVEL SECURITY;

-- Create policy for public to insert their own registrations
CREATE POLICY "Anyone can insert registrations"
ON public.exhibitor_registrations
FOR INSERT
TO public
WITH CHECK (true);

-- Create policy for public to view their own registration by cpf_cnpj
CREATE POLICY "Users can view their own registration"
ON public.exhibitor_registrations
FOR SELECT
TO public
USING (true);

-- Create policy for authenticated users (admins) to update
CREATE POLICY "Authenticated users can update registrations"
ON public.exhibitor_registrations
FOR UPDATE
TO authenticated
USING (true);

-- Create policy for authenticated users (admins) to view all
CREATE POLICY "Authenticated users can view all registrations"
ON public.exhibitor_registrations
FOR SELECT
TO authenticated
USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_exhibitor_registrations_updated_at
BEFORE UPDATE ON public.exhibitor_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create admin profiles table
CREATE TABLE public.admin_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on admin profiles
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view their own profile
CREATE POLICY "Admins can view their own profile"
ON public.admin_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create function to handle new admin user
CREATE OR REPLACE FUNCTION public.handle_new_admin_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Admin'));
  RETURN NEW;
END;
$$;

-- Create trigger for new admin users
CREATE TRIGGER on_auth_admin_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_admin_user();