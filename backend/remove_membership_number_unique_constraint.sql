-- Remove the unique constraint on membership_number to allow same member in multiple committees
DROP INDEX IF EXISTS idx_membership_number;

-- Optional: Create a regular index instead for better query performance (if needed)
-- CREATE INDEX IF NOT EXISTS idx_membership_number ON public.committee_members USING btree (membership_number) TABLESPACE pg_default;