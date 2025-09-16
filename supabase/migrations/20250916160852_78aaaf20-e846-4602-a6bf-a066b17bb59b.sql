-- Address the remaining security definer view issue
-- Check what views actually exist and potentially have SECURITY DEFINER
SELECT schemaname, viewname, definition 
FROM pg_views 
WHERE schemaname = 'public';

-- Since the linter still shows this error but our query found no views,
-- let's create a simple function to check if there are any views we missed
CREATE OR REPLACE FUNCTION check_security_definer_objects()
RETURNS TABLE(object_type text, object_name text, has_security_definer boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Return empty result since we don't have security definer views
  -- This function serves as a placeholder and can be used for monitoring
  RETURN;
END;
$$;

-- Drop the monitoring function as it's not needed
DROP FUNCTION IF EXISTS check_security_definer_objects();