import axios from 'axios';

// Test with exact data structure that frontend sends
const testExactFrontendData = async () => {
  try {
    console.log('Testing with exact frontend data structure...');
    
    // Get existing member data first
    const getResponse = await axios.get('http://localhost:5002/api/admin/members/1');
    console.log('Existing member data:', getResponse.data);
    
    // Use the exact same structure as frontend would send
    const updateData = {
      Name: 'Updated Test Member',
      'Membership number': 'TEST001',
      Mobile: '9876543210',
      Email: 'test@example.com',
      type: 'Patron',
      'Company Name': 'Test Company Ltd',
      'Address Home': '123 Test Street, Test City',
      'Address Office': '456 Office Avenue, Business District',
      'Resident Landline': '011-12345678',
      'Office Landline': '011-87654321',
      is_elected_member: false,
      position: null
    };
    
    console.log('Sending update data:', updateData);
    
    const updateResponse = await axios.put('http://localhost:5002/api/admin/members/1', updateData);
    console.log('Update Success:', updateResponse.data);
    
    // Now test with a membership number that might already exist
    const createData = {
      Name: 'New Test Member',
      'Membership number': 'TEST001',  // This might cause a unique constraint violation
      Mobile: '9876543212',
      Email: 'newtest@example.com',
      type: 'Patron',
      'Company Name': 'New Test Company Ltd',
      'Address Home': '789 New Street, New City',
      'Address Office': '321 New Avenue, New District',
      'Resident Landline': '011-12345679',
      'Office Landline': '011-87654322',
      is_elected_member: false,
      position: null
    };
    
    console.log('Sending create data with potential duplicate membership number:', createData);
    
    const createResponse = await axios.post('http://localhost:5002/api/admin/members', createData);
    console.log('Create Success:', createResponse.data);
    
  } catch (error) {
    console.error('Error details:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
    if (error.response?.data?.message) {
      console.error('Server message:', error.response.data.message);
    }
  }
};

testExactFrontendData();