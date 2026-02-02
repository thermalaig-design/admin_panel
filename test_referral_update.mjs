import axios from 'axios';

async function testReferralUpdate() {
  try {
    console.log('Testing referral update...');
    
    // First, get all referrals to see what we have
    const getAllResponse = await axios.get('http://localhost:5002/api/admin/referrals');
    console.log('All referrals:', getAllResponse.data);
    
    if (getAllResponse.data.data && getAllResponse.data.data.length > 0) {
      const firstReferral = getAllResponse.data.data[0];
      console.log('First referral:', firstReferral);
      
      // Try to update the first referral
      const updateData = {
        remark: 'Test remark from backend test script'
      };
      
      console.log('Updating referral with ID:', firstReferral.id);
      console.log('Update data:', updateData);
      
      const updateResponse = await axios.put(
        `http://localhost:5002/api/admin/referrals/${firstReferral.id}`, 
        updateData
      );
      
      console.log('Update response:', updateResponse.data);
    } else {
      console.log('No referrals found in database');
    }
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testReferralUpdate();