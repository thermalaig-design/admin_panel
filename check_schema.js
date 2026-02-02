import { supabase } from './backend/config/supabase.js';

const checkDatabaseSchema = async () => {
  try {
    console.log('Checking database schema...');
    
    // Try to get the table structure
    const { data, error } = await supabase
      .from('Members Table')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error accessing Members Table:', error);
      
      // Try the fallback table name
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('members_table')
        .select('*')
        .limit(1);
      
      if (fallbackError) {
        console.error('Error accessing members_table:', fallbackError);
        return;
      }
      
      console.log('Successfully accessed members_table');
      console.log('Sample data:', fallbackData[0]);
      
      // Check columns
      const columns = Object.keys(fallbackData[0] || {});
      console.log('Available columns:', columns);
      
      // Check if is_elected_member exists
      console.log('Has is_elected_member:', columns.includes('is_elected_member'));
      console.log('Has position:', columns.includes('position'));
      
    } else {
      console.log('Successfully accessed Members Table');
      console.log('Sample data:', data[0]);
      
      // Check columns
      const columns = Object.keys(data[0] || {});
      console.log('Available columns:', columns);
      
      // Check if is_elected_member exists
      console.log('Has is_elected_member:', columns.includes('is_elected_member'));
      console.log('Has position:', columns.includes('position'));
    }
    
  } catch (error) {
    console.error('Error checking database schema:', error);
  }
};

checkDatabaseSchema();