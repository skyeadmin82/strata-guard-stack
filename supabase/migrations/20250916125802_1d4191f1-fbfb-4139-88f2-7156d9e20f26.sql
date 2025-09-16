-- Check if contract_templates table exists and create if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contract_templates') THEN
        CREATE TABLE contract_templates (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            contract_type contract_type NOT NULL,
            template_content TEXT NOT NULL,
            variables JSONB DEFAULT '{}'::jsonb,
            validation_rules JSONB DEFAULT '{}'::jsonb,
            default_pricing_type pricing_type NOT NULL,
            is_active BOOLEAN DEFAULT true,
            created_by UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;
        
        -- Only create policy if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'contract_templates' 
            AND policyname = 'Users can manage contract templates in their tenant'
        ) THEN
            CREATE POLICY "Users can manage contract templates in their tenant" 
            ON contract_templates 
            FOR ALL 
            USING (tenant_id = get_current_user_tenant_id());
        END IF;
        
        CREATE TRIGGER update_contract_templates_updated_at
        BEFORE UPDATE ON contract_templates
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;