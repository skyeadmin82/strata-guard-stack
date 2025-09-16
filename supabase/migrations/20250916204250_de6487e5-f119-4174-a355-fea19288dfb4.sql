-- Move pg_net extension from public to extensions schema to fix security warning
-- First create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move pg_net extension from public to extensions schema
DROP EXTENSION IF EXISTS pg_net CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- Also ensure other critical extensions are in the correct schema
-- This prevents potential security issues from extensions in public schema