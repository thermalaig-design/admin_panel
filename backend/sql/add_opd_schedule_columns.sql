-- Add JSONB columns for OPD schedules
ALTER TABLE public.opd_schedule
  ADD COLUMN IF NOT EXISTS general_opd_schedule jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS private_opd_schedule jsonb DEFAULT '[]'::jsonb;

-- Verify columns:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name='opd_schedule' AND column_name IN ('general_opd_schedule','private_opd_schedule');
