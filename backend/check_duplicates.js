import { supabase } from './config/supabase.js';

const checkDuplicates = async () => {
  try {
    const { data, error } = await supabase.from('Members Table').select('*');
    if (error) throw error;

    console.log('Total members:', data.length);
    
    const patrons = data.filter(m => m.type === 'Patron');
    const trustees = data.filter(m => m.type === 'Trustee');
    console.log('Patron members:', patrons.length);
    console.log('Trustee members:', trustees.length);
    
    // Find duplicate membership numbers
    const membershipNumbers = data.map(m => m['Membership number']).filter(Boolean);
    const numberCount = {};
    
    membershipNumbers.forEach(num => {
      numberCount[num] = (numberCount[num] || 0) + 1;
    });
    
    const duplicates = Object.entries(numberCount)
      .filter(([num, count]) => count > 1)
      .map(([num, count]) => ({ number: num, count }));
    
    console.log('\nDuplicate membership numbers:');
    console.log('Total duplicates:', duplicates.length);
    
    duplicates.forEach(({ number, count }) => {
      const members = data.filter(m => m['Membership number'] === number);
      console.log(`\n${number} (appears ${count} times):`);
      members.forEach(m => {
        console.log(`  - ${m.Name} (${m.type}) - ID: ${m['S. No.']}`);
      });
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
};

checkDuplicates();