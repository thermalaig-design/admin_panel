import { supabaseAdmin } from './config/supabase.js';

// Alternative approach using raw SQL - this might work better with Supabase
async function addRemarkColumnsRawSQL() {
  console.log('Attempting to add remark columns using raw SQL...');
  
  try {
    // Note: Supabase doesn't allow direct ALTER TABLE through the client by default for security
    // The safest way is to run these commands directly in the Supabase SQL editor
    console.log('\nTo add the remark columns, please run the following SQL commands in your Supabase SQL editor:');
    console.log('\nFor appointments table:');
    console.log('ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS remark TEXT;');
    console.log('\nFor referrals table:');
    console.log('ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS remark TEXT;');
    
    // Let's also check if the columns already exist
    const { data: appointmentsColumns, error: appColError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'appointments')
      .eq('column_name', 'remark');

    if (appColError) {
      console.error('Error checking appointments columns:', appColError);
    } else {
      if (appointmentsColumns && appointmentsColumns.length > 0) {
        console.log('✓ Remark column already exists in appointments table');
      } else {
        console.log('✗ Remark column missing from appointments table');
      }
    }

    const { data: referralsColumns, error: refColError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'referrals')
      .eq('column_name', 'remark');

    if (refColError) {
      console.error('Error checking referrals columns:', refColError);
    } else {
      if (referralsColumns && referralsColumns.length > 0) {
        console.log('✓ Remark column already exists in referrals table');
      } else {
        console.log('✗ Remark column missing from referrals table');
      }
    }
  } catch (error) {
    console.error('Error in addRemarkColumnsRawSQL:', error);
  }
}

// Run the function
addRemarkColumnsRawSQL();