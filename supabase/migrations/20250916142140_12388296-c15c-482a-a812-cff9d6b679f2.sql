-- Fix data integrity issues only (constraints already exist)

-- Update existing contacts to have valid created_by values
UPDATE public.contacts 
SET created_by = (SELECT id FROM public.users ORDER BY created_at LIMIT 1)
WHERE created_by IS NULL;

-- Add domains to existing clients based on their email domains
UPDATE public.clients 
SET domains = ARRAY[LOWER(SPLIT_PART(email, '@', 2))]
WHERE email IS NOT NULL 
  AND email != '' 
  AND (domains IS NULL OR array_length(domains, 1) IS NULL OR array_length(domains, 1) = 0);

-- Add helpful indexes for performance (these are safe to run with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_contacts_created_by ON public.contacts(created_by);
CREATE INDEX IF NOT EXISTS idx_contacts_tenant_id ON public.contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contacts_client_id ON public.contacts(client_id);