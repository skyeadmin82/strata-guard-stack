-- Add domains field to clients table
ALTER TABLE public.clients 
ADD COLUMN domains text[] DEFAULT '{}';

-- Add a comment to document the purpose
COMMENT ON COLUMN public.clients.domains IS 'Array of verified domains for this client - used for email validation, ticket assignment, and user authentication';

-- Create an index for better performance when searching by domain
CREATE INDEX idx_clients_domains ON public.clients USING GIN(domains);

-- Create a function to extract domain from email
CREATE OR REPLACE FUNCTION public.extract_email_domain(email_address text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT LOWER(SPLIT_PART(email_address, '@', 2));
$$;

-- Create a function to check if email domain is allowed for client
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