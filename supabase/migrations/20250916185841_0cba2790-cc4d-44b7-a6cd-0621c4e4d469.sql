-- Add enterprise features to proposal_catalog table
ALTER TABLE public.proposal_catalog 
ADD COLUMN IF NOT EXISTS cost_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS inventory_qty INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_stock_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_code TEXT,
ADD COLUMN IF NOT EXISTS qbo_item_id TEXT,
ADD COLUMN IF NOT EXISTS qbo_sync_status TEXT DEFAULT 'pending' CHECK (qbo_sync_status IN ('pending', 'synced', 'error')),
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;

-- Create index for QuickBooks sync status for better performance
CREATE INDEX IF NOT EXISTS idx_proposal_catalog_qbo_sync ON public.proposal_catalog(qbo_sync_status);
CREATE INDEX IF NOT EXISTS idx_proposal_catalog_category ON public.proposal_catalog(category);
CREATE INDEX IF NOT EXISTS idx_proposal_catalog_item_type ON public.proposal_catalog(item_type);

-- Update existing records to have proper sync status
UPDATE public.proposal_catalog 
SET qbo_sync_status = 'pending' 
WHERE qbo_sync_status IS NULL;