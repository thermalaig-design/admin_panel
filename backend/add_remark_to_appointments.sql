-- Add remark column to appointments table
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS remark TEXT;

-- Update the trigger function to include remark column in updates
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger is in place
CREATE TRIGGER update_appointments_updated_at_trigger 
BEFORE UPDATE ON appointments 
FOR EACH ROW 
EXECUTE FUNCTION update_appointments_updated_at();

-- Add RLS policy for appointments table to allow updates
-- Since the appointments table already has RLS policies, we'll just ensure the remark column is accessible