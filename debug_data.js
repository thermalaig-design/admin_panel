// Debug script to check what data is being sent
console.log('=== DEBUG INFO ===');

// Simulate the frontend data structure
const sampleMember = {
  'S. No.': 1,
  'Membership number': 'TEST001',
  Name: 'Test Member',
  'Address Home': 'Test Address',
  'Company Name': 'Test Company',
  'Address Office': 'Test Office',
  'Resident Landline': '011-12345678',
  'Office Landline': '011-87654321',
  Mobile: '9876543210',
  Email: 'test@example.com',
  type: 'Patron',
  position: null,
  is_elected_member: false
};

console.log('Sample member data:', sampleMember);
console.log('ID extraction:', sampleMember?.id || sampleMember?.['S. No.']);
console.log('Has id property:', 'id' in sampleMember);
console.log('Has S. No. property:', 'S. No.' in sampleMember);

// Simulate the formData structure
const formData = {
  Name: 'Updated Test Member',
  'Membership number': 'TEST001',
  Mobile: '9876543210',
  Email: 'test@example.com',
  type: 'Patron',
  'Company Name': 'Test Company Ltd',
  'Address Home': '123 Test Street',
  'Address Office': '456 Test Avenue',
  'Resident Landline': '011-12345678',
  'Office Landline': '011-87654321',
  isElected: false
};

console.log('Form data:', formData);

// Simulate the memberPayload creation
const memberData = { ...formData, type: 'Patron' };
const isElected = memberData.isElected;
const memberPayload = {
  ...memberData,
  isElected: undefined,
  position: undefined,
  location: undefined
};

if (isElected) {
  memberPayload.is_elected_member = true;
} else {
  memberPayload.is_elected_member = false;
}

console.log('Member payload:', memberPayload);
console.log('Final data being sent to API:', memberPayload);