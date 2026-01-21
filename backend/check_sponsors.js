import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSponsors() {
  try {
    console.log('Checking sponsors table...');
    
    // Check if sponsors table exists and has data
    const { data, error } = await supabase
      .from('sponsors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error querying sponsors table:', error);
      console.error('Error details:', error.message);
      return;
    }

    console.log('Sponsors found:', data.length);
    if (data.length > 0) {
      console.log('Sponsor details:');
      data.forEach((sponsor, index) => {
        console.log(`${index + 1}. ${sponsor.name} - ${sponsor.position}`);
        console.log('   About:', sponsor.about || 'No description');
        console.log('   Active:', sponsor.is_active);
        console.log('   Priority:', sponsor.priority);
        console.log('   Photo URL:', sponsor.photo_url || 'No photo');
        console.log('---');
      });
    } else {
      console.log('No sponsors found in the database');
      console.log('You need to add a sponsor through the admin panel');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkSponsors();