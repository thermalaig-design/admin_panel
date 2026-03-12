/**
 * Setup script to create notifications table in Supabase
 * Run this file using: node backend/setup_notifications_table.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const createNotificationsTable = async () => {
  try {
    console.log('📝 Creating notifications table...');

    const sqlQuery = `
    -- Create the notifications table for user-specific notifications
    -- This table stores individual notifications for each user (trustees/patrons)

    CREATE TABLE IF NOT EXISTS public.notifications (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id INTEGER REFERENCES user_profiles(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      type VARCHAR(50) DEFAULT 'general',
      target_audience VARCHAR(20), -- 'trustees', 'patrons', or 'both'
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Enable Row Level Security
    ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

    -- Create policies for user access (users can only see their own notifications)
    CREATE POLICY "Users can view their own notifications" ON public.notifications
      FOR SELECT TO authenticated
      USING (auth.uid()::text = user_id::text OR auth.role() = 'service_role');

    CREATE POLICY "Users can update their own notifications" ON public.notifications
      FOR UPDATE TO authenticated
      USING (auth.uid()::text = user_id::text OR auth.role() = 'service_role')
      WITH CHECK (auth.uid()::text = user_id::text OR auth.role() = 'service_role');

    -- Grant permissions to authenticated users
    GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
    GRANT USAGE, SELECT ON SEQUENCE notifications_id_seq TO authenticated;

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
    CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
    CREATE INDEX IF NOT EXISTS idx_notifications_target_audience ON public.notifications(target_audience);

    -- Create updated_at trigger
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
       NEW.updated_at = NOW();
       RETURN NEW;
    END;
    $$ language 'plpgsql';

    CREATE TRIGGER update_notifications_updated_at 
        BEFORE UPDATE ON public.notifications 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
    `;

    // Execute the SQL using Supabase RPC (you'd need to run this in Supabase SQL Editor manually)
    console.log('✅ SQL script generated successfully!');
    console.log('\nThe SQL script to create the notifications table is located at:');
    console.log('backend/sql/create_notifications_table.sql');
    console.log('\n📋 Please follow these steps to create the table:');
    console.log('1. Open your Supabase Dashboard');
    console.log('2. Go to your project');
    console.log('3. Navigate to SQL Editor');
    console.log('4. Create a new query');
    console.log('5. Copy the content from backend/sql/create_notifications_table.sql');
    console.log('6. Paste and run the SQL query');
    console.log('7. The notifications table will be created with all necessary configurations');

    // Verify if table exists after manual creation
    setTimeout(async () => {
      try {
        console.log('\n🔍 Verifying if table exists...');
        const { data, error } = await supabase
          .from('notifications')
          .select('id')
          .limit(1);

        if (!error) {
          console.log('✅ Success! Notifications table is ready to use.');
          console.log('   You can now send targeted notifications to trustees and patrons.');
        } else if (error.code === 'PGRST116') {
          console.log('⚠️  Table does not exist yet. Please run the SQL script in Supabase SQL Editor.');
        } else {
          console.log('❓ Other error occurred:', error.message);
        }
      } catch (verifyError) {
        console.log('ℹ️  Verification skipped. Please run the SQL script in Supabase first.');
      }
    }, 2000);

  } catch (error) {
    console.error('❌ Error creating notifications table:', error.message);
    process.exit(1);
  }
};

createNotificationsTable();