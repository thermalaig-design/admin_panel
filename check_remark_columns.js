import { supabaseAdmin } from './backend/config/supabase.js';

async function checkRemarkColumns() {
  console.log('Checking for remark columns in appointments and referrals tables...\n');

  try {
    // Check if remark column exists in appointments table
    console.log('Checking appointments table for remark column...');
    const { data: appointmentsColumns, error: appColError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'appointments')
      .ilike('column_name', 'remark');

    if (appColError) {
      console.error('Error checking appointments columns:', appColError);
    } else {
      if (appointmentsColumns && appointmentsColumns.length > 0) {
        console.log('✓ Remark column already exists in appointments table');
      } else {
        console.log('✗ Remark column missing from appointments table');
        console.log('\nTo add the remark column to appointments table, run this SQL in your Supabase SQL editor:');
        console.log('ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS remark TEXT;');
      }
    }

    // Check if remark column exists in referrals table
    console.log('\nChecking referrals table for remark column...');
    const { data: referralsColumns, error: refColError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'referrals')
      .ilike('column_name', 'remark');

    if (refColError) {
      console.error('Error checking referrals columns:', refColError);
    } else {
      if (referralsColumns && referralsColumns.length > 0) {
        console.log('✓ Remark column already exists in referrals table');
      } else {
        console.log('✗ Remark column missing from referrals table');
        console.log('\nTo add the remark column to referrals table, run this SQL in your Supabase SQL editor:');
        console.log('ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS remark TEXT;');
      }
    }

    console.log('\nNote: Direct ALTER TABLE commands cannot be executed via the Supabase client for security reasons.');
    console.log('Please run the suggested SQL commands in your Supabase SQL editor or database client.');
    
  } catch (error) {
    console.error('Error in checkRemarkColumns:', error);
  }
}

// Run the function
checkRemarkColumns();