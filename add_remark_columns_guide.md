# Adding Remark Columns to Database Tables

## Overview
This document explains how to add the missing `remark` column to both the `appointments` and `referrals` tables to fix the error you're experiencing when trying to save remarks.

## Steps to Add Remark Columns

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase dashboard
2. Navigate to the "SQL Editor" tab
3. Execute the following SQL commands:

#### For Appointments Table:
```sql
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS remark TEXT;
```

#### For Referrals Table:
```sql
ALTER TABLE public.referrals 
ADD COLUMN IF NOT EXISTS remark TEXT;
```

### Option 2: Using Database Client

If you have direct database access, connect to your PostgreSQL database and run the same commands as above.

### Option 3: Using the Created SQL Files

You can also use the SQL files created in this project:

1. Navigate to `backend/add_remark_to_appointments.sql`
2. Copy the content and run it in your SQL editor
3. Navigate to `backend/add_remark_to_referrals.sql`
4. Copy the content and run it in your SQL editor

## Verification

After adding the columns, you can verify they exist by running:

```sql
-- Check appointments table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'appointments' AND column_name = 'remark';

-- Check referrals table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'referrals' AND column_name = 'remark';
```

## Expected Result

Once the columns are added, the error "Failed to load resource: the server responded with a status of 500 (Internal Server Error)" when saving remarks should be resolved.

## Troubleshooting

If you encounter permission errors:
- Make sure you're using a role with DDL permissions (typically `postgres` or a superuser role)
- Check that Row Level Security (RLS) policies allow updates to these tables
- Verify that your Supabase service roles have the necessary permissions

## RLS Policy Update (if needed)

If you encounter issues with updating the tables after adding the columns, you may need to adjust the RLS policies. For example, for the appointments table:

```sql
-- Example RLS policy that allows authenticated users to update
CREATE POLICY "Allow update for authenticated users" ON public.appointments
    FOR UPDATE USING (auth.role() = 'authenticated');
```