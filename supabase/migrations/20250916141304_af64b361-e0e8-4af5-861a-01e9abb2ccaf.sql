-- Fix security warnings by updating the functions with proper search_path

-- Update extract_email_domain function with search_path
CREATE OR REPLACE FUNCTION public.extract_email_domain(email_address text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SECURITY definer 
SET search_path = public
AS $$
  SELECT LOWER(SPLIT_PART(email_address, '@', 2));
$$;

-- Update is_email_domain_allowed function (already has search_path, but ensuring it's correct)
CREATE OR REPLACE FUNCTION public.is_email_domain_allowed(email_address text, client_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN (SELECT array_length(domains, 1) FROM clients WHERE id = client_uuid) IS NULL OR 
         (SELECT array_length(domains, 1) FROM clients WHERE id = client_uuid) = 0 THEN 
      true -- If no domains specified, allow any email
    ELSE 
      extract_email_domain(email_address) = ANY(SELECT unnest(domains) FROM clients WHERE id = client_uuid)
  END;
$$;