import axios from 'axios';

// Test exactly what the frontend is sending
const testPatronMemberSave = async () => {
  try {
    console.log('Testing patron member save...');
    
    // This is what the frontend sends when editing
    const editData = {
      Name: 'Test Patron Member',
      'Membership number': 'PATRON001',
      Mobile: '9876543210',
      Email: 'patron@test.com',
      type: 'Patron',
      'Company Name': 'Test Company',
      'Address Home': 'Test Address Home',
      'Address Office': 'Test Address Office',
      'Resident Landline': '011-12345678',
      'Office Landline': '011-87654321',
      is_elected_member: false
    };
    
    console.log('Sending edit data:', editData);
    
    // Try to update with ID = 1
    const response = await axios.put('http://localhost:5002/api/admin/members/1', editData);
    console.log('Edit Success:', response.data);
    
    // Also test creating a new member
    const createData = {
      Name: 'New Patron Member',
      'Membership number': 'PATRON002',
      Mobile: '9876543211',
      Email: 'newpatron@test.com',
      type: 'Patron',
      'Company Name': 'New Test Company',
      'Address Home': 'New Test Address Home',
      'Address Office': 'New Test Address Office',
      'Resident Landline': '011-12345679',
      'Office Landline': '011-87654322',
      is_elected_member: false
    };
    
    console.log('Sending create data:', createData);
    
    const createResponse = await axios.post('http://localhost:5002/api/admin/members', createData);
    console.log('Create Success:', createResponse.data);
    
  } catch (error) {
    console.error('Error details:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  }
};

testPatronMemberSave();