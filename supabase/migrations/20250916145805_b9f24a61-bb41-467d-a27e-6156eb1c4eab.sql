-- Check if support_tickets table exists and create if not
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'support_tickets') THEN
    CREATE TABLE public.support_tickets (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      tenant_id UUID NOT NULL,
      client_id UUID NOT NULL,
      contact_id UUID NULL,
      ticket_number TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'other',
      priority TEXT NOT NULL DEFAULT 'medium',
      status TEXT NOT NULL DEFAULT 'submitted',
      created_by UUID,
      assigned_to UUID,
      resolved_at TIMESTAMP WITH TIME ZONE,
      sla_due_date TIMESTAMP WITH TIME ZONE,
      actual_hours DECIMAL DEFAULT 0,
      estimated_hours DECIMAL,
      auto_assigned BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    
    -- Enable RLS
    ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS policies
    CREATE POLICY "Users can manage support tickets in their tenant"
      ON public.support_tickets
      FOR ALL
      USING (tenant_id = get_current_user_tenant_id());
  END IF;
END
$$;