# Add Remark Columns to Database Tables

## Problem
You're getting a 500 Internal Server Error when trying to save remarks in both appointments and referrals pages. This is because the `remark` column doesn't exist in the database tables.

## Solution
You need to add the `remark` column to both the `appointments` and `referrals` tables in your Supabase database.

## Steps to Add the Columns

### Step 1: Go to Supabase Dashboard
1. Open your browser and go to [https://supabase.com](https://supabase.com)
2. Log in to your account
3. Select your project

### Step 2: Open SQL Editor
1. In the left sidebar, click on "SQL Editor"
2. Click on "New Query"

### Step 3: Add Remark Column to Appointments Table
1. Copy and paste the following SQL command into the editor:
```sql
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS remark TEXT;
```
2. Click "Run" to execute the command

### Step 4: Add Remark Column to Referrals Table
1. In the same SQL editor, copy and paste the following SQL command:
```sql
ALTER TABLE public.referrals 
ADD COLUMN IF NOT EXISTS remark TEXT;
```
2. Click "Run" to execute the command

### Step 5: Verify the Columns Were Added
1. To verify that the columns were added successfully, run the following query:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'appointments' 
AND column_name = 'remark';
```
2. You should see one row returned with the column name and data type.

3. Similarly, check for the referrals table:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'referrals' 
AND column_name = 'remark';
```

## Expected Result
After adding the columns, you should be able to save remarks in both the appointments and referrals pages without any errors.

## Additional Notes
- The `IF NOT EXISTS` clause ensures that the command won't fail if the column already exists
- The `TEXT` data type allows for variable-length text, which is suitable for remarks
- These changes are safe and won't affect any existing data in your tables

## Troubleshooting
If you encounter any issues:
1. Make sure you're using the correct database connection
2. Ensure you have the necessary permissions to modify the database schema
3. Check that the table names are correct (`public.appointments` and `public.referrals`)

If you continue to have issues, please share the exact error message you're seeing.