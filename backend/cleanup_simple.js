import { supabase } from './config/supabase.js';

const cleanupDuplicates = async () => {
  try {
    console.log('Starting cleanup process...\n');
    
    // Get all members
    const { data: allMembers, error: fetchError } = await supabase
      .from('Members Table')
      .select('"S. No.", "Membership number", Name, type')
      .order('"S. No."', { ascending: true });
    
    if (fetchError) throw fetchError;
    
    console.log(`Total members: ${allMembers.length}`);
    
    // Group by membership number
    const grouped = {};
    allMembers.forEach(member => {
      const num = member['Membership number'];
      if (num) {
        if (!grouped[num]) grouped[num] = [];
        grouped[num].push(member);
      }
    });
    
    // Find duplicates
    const duplicates = Object.entries(grouped)
      .filter(([num, members]) => members.length > 1)
      .map(([num, members]) => ({ number: num, members }));
    
    console.log(`\nFound ${duplicates.length} duplicate membership numbers\n`);
    
    if (duplicates.length === 0) {
      console.log('No duplicates found. Adding unique constraint...\n');
    } else {
      // Process duplicates
      let deletedCount = 0;
      
      for (const { number, members } of duplicates) {
        console.log(`Processing ${number}: ${members.length} entries`);
        
        // Sort by S. No. and keep the first one
        members.sort((a, b) => a['S. No.'] - b['S. No.']);
        const membersToDelete = members.slice(1);
        
        console.log(`  Keeping: ${members[0].Name} (ID: ${members[0]['S. No.']})`);
        
        // Delete duplicates
        for (const member of membersToDelete) {
          console.log(`  Deleting: ${member.Name} (ID: ${member['S. No.']})`);
          
          const { error: deleteError } = await supabase
            .from('Members Table')
            .delete()
            .eq('"S. No."', member['S. No.']);
          
          if (deleteError) {
            console.error(`    Error: ${deleteError.message}`);
          } else {
            deletedCount++;
          }
        }
        console.log('');
      }
      
      console.log(`Deleted ${deletedCount} duplicate entries\n`);
    }
    
    // Add unique constraint using raw SQL
    console.log('Adding unique constraint on membership_number...');
    
    try {
      // Try to add constraint directly
      const { error: constraintError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE "Members Table" ADD CONSTRAINT unique_membership_number UNIQUE ("Membership number");'
      });
      
      if (constraintError) {
        console.log('Using alternative method to ensure uniqueness...');
        // Alternative approach: verify no duplicates exist
        const { data: verifyData, error: verifyError } = await supabase
          .from('Members Table')
          .select('"Membership number"');
        
        if (!verifyError) {
          const numbers = verifyData.map(m => m['Membership number']).filter(Boolean);
          const uniqueNumbers = [...new Set(numbers)];
          
          if (numbers.length === uniqueNumbers.length) {
            console.log('✅ All membership numbers are now unique!');
          } else {
            console.log('⚠️  Some duplicates still exist');
          }
        }
      } else {
        console.log('✅ Unique constraint added successfully');
      }
    } catch (err) {
      console.log('Skipping constraint addition due to RPC limitations');
      console.log('Uniqueness will be enforced by application logic');
    }
    
    // Final verification
    console.log('\nFinal verification...');
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
        console.log('\n✅ SUCCESS: All duplicates removed!');
      } else {
        console.log('\n⚠️  WARNING: Some duplicates may still exist');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
};

cleanupDuplicates();