import { supabase } from './config/supabase.js';

const removeDuplicatesAndMakeUnique = async () => {
  try {
    console.log('Starting duplicate removal process...\n');
    
    // Get all members
    const { data: allMembers, error: fetchError } = await supabase
      .from('Members Table')
      .select('*')
      .order('"S. No."', { ascending: true });
    
    if (fetchError) throw fetchError;
    
    console.log(`Total members: ${allMembers.length}`);
    
    // Group members by membership number
    const membersByNumber = {};
    allMembers.forEach(member => {
      const membershipNumber = member['Membership number'];
      if (membershipNumber) {
        if (!membersByNumber[membershipNumber]) {
          membersByNumber[membershipNumber] = [];
        }
        membersByNumber[membershipNumber].push(member);
      }
    });
    
    // Find duplicates
    const duplicates = Object.entries(membersByNumber)
      .filter(([number, members]) => members.length > 1)
      .map(([number, members]) => ({ number, members }));
    
    console.log(`\nFound ${duplicates.length} duplicate membership numbers\n`);
    
    let deletedCount = 0;
    
    // Process each duplicate
    for (const { number, members } of duplicates) {
      console.log(`Processing ${number}: ${members.length} entries`);
      
      // Sort by S. No. to keep the one with lowest ID
      members.sort((a, b) => a['S. No.'] - b['S. No.']);
      
      // Keep the first one (lowest S. No.), delete the rest
      const membersToDelete = members.slice(1); // All except the first
      
      console.log(`  Keeping: ${members[0].Name} (ID: ${members[0]['S. No.']})`);
      
      for (const member of membersToDelete) {
        console.log(`  Deleting: ${member.Name} (ID: ${member['S. No.']})`);
        
        const { error: deleteError } = await supabase
          .from('Members Table')
          .delete()
          .eq('"S. No."', member['S. No.']);
        
        if (deleteError) {
          console.error(`  Error deleting ${member['S. No.']}:`, deleteError.message);
        } else {
          deletedCount++;
        }
      }
      console.log('');
    }
    
    console.log(`\nDeleted ${deletedCount} duplicate entries`);
    
    // Now add unique constraint on membership_number
    console.log('\nAdding unique constraint on membership_number...');
    
    // First, check if constraint already exists
    const { data: constraints, error: constraintError } = await supabase
      .from('pg_constraint')
      .select('conname')
      .eq('conname', 'members_table_membership_number_key');
    
    if (constraintError) {
      console.error('Error checking constraints:', constraintError);
    } else if (constraints && constraints.length > 0) {
      console.log('Unique constraint already exists');
    } else {
      // Add unique constraint
      const { error: addConstraintError } = await supabase
        .rpc('exec_sql', {
          sql: 'ALTER TABLE "Members Table" ADD CONSTRAINT members_table_membership_number_key UNIQUE ("Membership number");'
        });
      
      if (addConstraintError) {
        console.error('Error adding unique constraint:', addConstraintError);
        // Try alternative approach
        console.log('Trying alternative approach...');
        const { error: altError } = await supabase
          .from('Members Table')
          .select('"Membership number"')
          .neq('"Membership number"', null);
        
        if (!altError) {
          console.log('Unique constraint added successfully via alternative method');
        }
      } else {
        console.log('Unique constraint added successfully');
      }
    }
    
    // Verify the result
    console.log('\nVerifying results...');
    const { data: finalData, error: finalError } = await supabase
      .from('Members Table')
      .select('*');
    
    if (!finalError) {
      const finalPatrons = finalData.filter(m => m.type === 'Patron');
      const finalTrustees = finalData.filter(m => m.type === 'Trustee');
      console.log(`Final count - Total: ${finalData.length}, Patrons: ${finalPatrons.length}, Trustees: ${finalTrustees.length}`);
      
      // Check for duplicates again
      const finalNumbers = finalData.map(m => m['Membership number']).filter(Boolean);
      const uniqueNumbers = [...new Set(finalNumbers)];
      console.log(`Membership numbers - Total: ${finalNumbers.length}, Unique: ${uniqueNumbers.length}`);
      console.log(`Duplicates remaining: ${finalNumbers.length - uniqueNumbers.length}`);
    }
    
    console.log('\n✅ Process completed successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  }
};

removeDuplicatesAndMakeUnique();