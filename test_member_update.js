import axios from 'axios';

// Test the member update endpoint directly
const testUpdateMember = async () => {
  try {
    console.log('Testing member update...');
    
    // Try to update a member with minimal data
    const testData = {
      Name: 'Test Member Updated',
      'Membership number': 'TEST001',
      Mobile: '9876543210',
      Email: 'test@example.com',
      type: 'Patron'
    };
    
    // Try to update with ID = 1 (assuming it exists)
    const response = await axios.put('http://localhost:5002/api/admin/members/1', testData);
    console.log('Success:', response.data);
    
  } catch (error) {
    console.error('Error details:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  }
};

testUpdateMember();