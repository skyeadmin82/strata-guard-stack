-- Enable real-time updates for contacts table
ALTER TABLE public.contacts REPLICA IDENTITY FULL;

-- Add contacts table to real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;