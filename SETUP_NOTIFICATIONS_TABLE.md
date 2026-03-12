# 📲 Setting Up Notifications Table for Send Message Feature

## 🎯 Problem
The "Send Message" feature in the admin panel is trying to insert notifications into a `notifications` table that doesn't exist in Supabase, causing the INSERT operation to fail.

## 📋 Solution Overview
We need to create a `notifications` table in Supabase to store user-specific notifications sent to trustees and patrons.

## 🛠️ Step-by-Step Setup

### Step 1: Locate the SQL Script
The SQL script to create the notifications table is located at:
```
backend/sql/create_notifications_table.sql
```

### Step 2: Run the SQL Script in Supabase Dashboard
1. **Open your browser** and go to [Supabase Dashboard](https://supabase.com/dashboard)
2. **Select your project** (likely named "hospital_management")
3. **Click on "SQL Editor"** in the left sidebar
4. **Click "New Query"** 
5. **Open the SQL file** `backend/sql/create_notifications_table.sql` in your code editor
6. **Copy the entire content** of the file
7. **Paste it into the Supabase SQL Editor**
8. **Click the "RUN" button**

### Step 3: Verify the Table Creation
After running the script, you should see a success message in the SQL Editor output.

## 📊 Table Structure Created

The script creates a `notifications` table with the following columns:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique identifier for each notification |
| `user_id` | INTEGER | References user_profiles.id (foreign key) |
| `title` | TEXT | Notification title |
| `message` | TEXT | Notification message content |
| `is_read` | BOOLEAN | Read status (defaults to FALSE) |
| `type` | VARCHAR(50) | Notification type (defaults to 'general') |
| `target_audience` | VARCHAR(20) | Audience type ('trustees', 'patrons', or 'both') |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last updated timestamp |

## 🔐 Security Features

- **Row Level Security (RLS)** enabled
- Users can only see their own notifications
- Proper indexes for performance
- Automatic updated_at timestamp management

## 🧪 Test the Send Message Feature

After setting up the table:

1. **Refresh your admin panel** (Ctrl+Shift+R to hard refresh)
2. Go to **Admin Panel → Send Message**
3. Select recipients (Trustees/Patrons/Both)
4. Enter a title and message
5. Click "Send Notification"
6. Check that notifications are created in the Supabase dashboard

## 🔍 Verify in Supabase Dashboard

To confirm the notifications are being saved:

1. Go to **Supabase Dashboard → Project → Table Editor**
2. Look for the `notifications` table in the list
3. Click on it to view the data
4. You should see entries created when you send messages

## 🔄 Alternative Method: Using Node Script

If you prefer to run it programmatically:

1. Make sure your `.env` file has the correct Supabase credentials:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. Run the setup script:
   ```bash
   cd backend
   node setup_notifications_table.js
   ```

However, the recommended approach is to run the SQL script directly in the Supabase SQL Editor as described in Step 2 above.

## 🚀 Once Complete

After setting up the notifications table:
- The "Send Message" feature will work properly
- Notifications will be stored in the database
- Users will receive targeted notifications based on their membership type
- You'll be able to track which notifications have been read/unread

## ❗ Important Notes

- The table has foreign key relationship with `user_profiles` table, so make sure that table exists
- The table uses UUID for IDs to ensure global uniqueness
- Row Level Security ensures users only see their own notifications
- The `user_id` references the `id` column in the `user_profiles` table (not the UUID)

## 🆘 Troubleshooting

**Problem**: SQL script fails to run
- Solution: Make sure you're using the service role key, not the anon key
- Solution: Check that the `user_profiles` table exists first

**Problem**: Foreign key constraint error
- Solution: Ensure `user_profiles` table exists before creating the notifications table

**Problem**: Still seeing INSERT errors
- Solution: Hard refresh your browser and try again
- Solution: Check browser console for specific error messages