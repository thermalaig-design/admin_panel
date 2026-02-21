-- Remove duplicate members and make membership_number unique
-- This script will:
-- 1. Identify duplicates based on membership_number
-- 2. Keep the record with the lowest "S. No." for each duplicate
-- 3. Delete the duplicate records
-- 4. Add unique constraint on membership_number

-- Step 1: Create a temporary table with the records to keep
CREATE TEMP TABLE temp_members_to_keep AS
SELECT DISTINCT ON ("Membership number") 
    "S. No.",
    "Membership number",
    Name,
    type
FROM "Members Table"
WHERE "Membership number" IS NOT NULL
ORDER BY "Membership number", "S. No." ASC;

-- Step 2: Delete duplicates (records not in the temp table)
DELETE FROM "Members Table" 
WHERE "S. No." NOT IN (
    SELECT "S. No." FROM temp_members_to_keep
) 
AND "Membership number" IS NOT NULL;

-- Step 3: Drop the temp table
DROP TABLE temp_members_to_keep;

-- Step 4: Add unique constraint on membership_number
-- First remove existing constraint if it exists
ALTER TABLE "Members Table" DROP CONSTRAINT IF EXISTS unique_membership_number;

-- Add the unique constraint
ALTER TABLE "Members Table" 
ADD CONSTRAINT unique_membership_number 
UNIQUE ("Membership number");

-- Verify the results
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT "Membership number") as unique_membership_numbers,
    (COUNT(*) - COUNT(DISTINCT "Membership number")) as duplicates_remaining
FROM "Members Table" 
WHERE "Membership number" IS NOT NULL;

-- Count by type
SELECT 
    type,
    COUNT(*) as count
FROM "Members Table"
GROUP BY type
ORDER BY type;