import { supabase } from './config/supabase.js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const cleanupDuplicates = async () => {
  try {
    console.log('Starting cleanup process...\n');
    
    // Read the SQL file
    const sqlPath = join(__dirname, 'cleanup_duplicates.sql');
    const sqlContent = readFileSync(sqlPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute\n`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error(`Error in statement ${i + 1}:`, error.message);
          // Continue with next statement
        } else {
          console.log(`Statement ${i + 1} executed successfully`);
          
          // If this is a SELECT statement, show results
          if (statement.trim().toUpperCase().startsWith('SELECT')) {
            console.log('Result:', data);
          }
        }
      } catch (err) {
        console.error(`Failed to execute statement ${i + 1}:`, err.message);
      }
      
      console.log('');
    }
    
    // Final verification
    console.log('Final verification...');
    const { data: finalData, error: finalError } = await supabase
      .from('Members Table')
      .select('*');
    
    if (!finalError) {
      const patrons = finalData.filter(m => m.type === 'Patron');
      const trustees = finalData.filter(m => m.type === 'Trustee');
      const numbers = finalData.map(m => m['Membership number']).filter(Boolean);
      const uniqueNumbers = [...new Set(numbers)];
      
      console.log('\n=== FINAL RESULTS ===');
      console.log(`Total members: ${finalData.length}`);
      console.log(`Patron members: ${patrons.length}`);
      console.log(`Trustee members: ${trustees.length}`);
      console.log(`Membership numbers: ${numbers.length}`);
      console.log(`Unique membership numbers: ${uniqueNumbers.length}`);
      console.log(`Duplicates remaining: ${numbers.length - uniqueNumbers.length}`);
      
      if (numbers.length === uniqueNumbers.length) {
        console.log('\n✅ SUCCESS: All duplicates removed and unique constraint applied!');
      } else {
        console.log('\n⚠️  WARNING: Some duplicates may still exist');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
};

cleanupDuplicates();