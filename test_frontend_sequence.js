import axios from 'axios';

// Test the exact sequence that the frontend does
const testFrontendSequence = async () => {
  try {
    console.log('=== TESTING FRONTEND SEQUENCE ===');
    
    // 1. Load all members (like loadData function does)
    console.log('1. Loading all members...');
    const membersResponse = await axios.get('http://localhost:5175/api/admin/members');
    console.log('Members loaded:', membersResponse.data.count, 'members');
    
    // Get the first member to edit
    const firstMember = membersResponse.data.data[0];
    console.log('First member:', firstMember);
    
    // 2. Try to update the member (like handleSave does for edit)
    console.log('2. Updating member...');
    const updateData = {
      Name: 'Frontend Test Updated Member',
      'Membership number': firstMember['Membership number'] || 'TEST001',
      Mobile: firstMember.Mobile || '9876543210',
      Email: firstMember.Email || 'test@example.com',
      type: 'Patron',
      'Company Name': firstMember['Company Name'] || 'Test Company',
      'Address Home': firstMember['Address Home'] || 'Test Address',
      'Address Office': firstMember['Address Office'] || 'Test Office',
      'Resident Landline': firstMember['Resident Landline'] || '011-12345678',
      'Office Landline': firstMember['Office Landline'] || '011-87654321',
      is_elected_member: false,
      position: null
    };
    
    const id = firstMember.id || firstMember['S. No.'];
    console.log('Updating member ID:', id);
    console.log('Update data:', updateData);
    
    const updateResponse = await axios.put(`http://localhost:5175/api/admin/members/${id}`, updateData);
    console.log('Update response:', updateResponse.data);
    
    // 3. Try to create a new member (like handleSave does for create)
    console.log('3. Creating new member...');
    const createData = {
      Name: 'Frontend Test New Member',
      'Membership number': 'NEWTEST001',
      Mobile: '9876543213',
      Email: 'newtest@example.com',
      type: 'Patron',
      'Company Name': 'New Test Company',
      'Address Home': 'New Test Address',
      'Address Office': 'New Test Office',
      'Resident Landline': '011-12345679',
      'Office Landline': '011-87654323',
      is_elected_member: false,
      position: null
    };
    
    console.log('Create data:', createData);
    
    const createResponse = await axios.post('http://localhost:5175/api/admin/members', createData);
    console.log('Create response:', createResponse.data);
    
    console.log('=== ALL TESTS PASSED ===');
    
  } catch (error) {
    console.error('=== FRONTEND SEQUENCE ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      console.error('Response headers:', error.response.headers);
    }
    console.error('Error stack:', error.stack);
  }
};

testFrontendSequence();