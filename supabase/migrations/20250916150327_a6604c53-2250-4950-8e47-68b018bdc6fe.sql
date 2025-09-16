-- Create enum types for ticket system
CREATE TYPE IF NOT EXISTS ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent', 'critical');
CREATE TYPE IF NOT EXISTS ticket_status AS ENUM ('draft', 'submitted', 'in_review', 'approved', 'rejected', 'in_progress', 'pending_client', 'resolved', 'closed');

-- Update support_tickets table to use proper enum types and set defaults
DO $$
BEGIN
  -- Update status column to use enum type with default
  ALTER TABLE support_tickets ALTER COLUMN status TYPE ticket_status USING status::ticket_status;
  ALTER TABLE support_tickets ALTER COLUMN status SET DEFAULT 'submitted'::ticket_status;
  
  -- Update priority column to use enum type with default  
  ALTER TABLE support_tickets ALTER COLUMN priority TYPE ticket_priority USING priority::ticket_priority;
  ALTER TABLE support_tickets ALTER COLUMN priority SET DEFAULT 'medium'::ticket_priority;
  
  -- Set description to allow NULL since it's optional
  ALTER TABLE support_tickets ALTER COLUMN description DROP NOT NULL;
END $$;