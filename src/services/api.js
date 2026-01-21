import axios from 'axios';

const API_BASE_URL = 'https://admin-self-seven.vercel.app/api'; // Using proxy in vite.config.js to forward to backend server

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Get all members
export const getAllMembers = async () => {
  try {
    const response = await api.get('/members');
    return response.data;
  } catch (error) {
    console.error('Error fetching all members:', error);
    throw error;
  }
};

// Get members by page
export const getMembersPage = async (page = 1, limit = 100) => {
  try {
    const response = await api.get(`/members?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching members page:', error);
    throw error;
  }
};

// Get doctors
export const getDoctors = async () => {
  try {
    const response = await api.get('/doctors');
    return response.data;
  } catch (error) {
    console.error('Error fetching doctors:', error);
    throw error;
  }
};

// Get members by type
export const getMembersByType = async (type) => {
  try {
    const response = await api.get(`/members/type/${type}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching members of type ${type}:`, error);
    throw error;
  }
};

// Search members
export const searchMembers = async (query, type = null) => {
  try {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (type) params.append('type', type);
    
    const response = await api.get(`/members/search?${params}`);
    return response.data;
  } catch (error) {
    console.error('Error searching members:', error);
    throw error;
  }
};

// Get member types
export const getMemberTypes = async () => {
  try {
    const response = await api.get('/members/types');
    return response.data;
  } catch (error) {
    console.error('Error fetching member types:', error);
    throw error;
  }
};

// Get all doctors
export const getAllDoctors = async () => {
  try {
    const response = await api.get('/doctors');
    return response.data;
  } catch (error) {
    console.error('Error fetching doctors:', error);
    throw error;
  }
};

// Get all committee members
export const getAllCommitteeMembers = async () => {
  try {
    const response = await api.get('/committee');
    return response.data;
  } catch (error) {
    console.error('Error fetching committee members:', error);
    throw error;
  }
};

// Get all hospitals
export const getAllHospitals = async () => {
  try {
    const response = await api.get('/hospitals');
    return response.data;
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    throw error;
  }
};

// Get all elected members
export const getAllElectedMembers = async () => {
  try {
    const response = await api.get('/elected-members');
    return response.data;
  } catch (error) {
    console.error('Error fetching elected members:', error);
    throw error;
  }
};

// Referral API functions
export const createReferral = async (referralData) => {
  try {
    const user = localStorage.getItem('user');
    const userId = user ? JSON.parse(user).Mobile || JSON.parse(user).mobile || JSON.parse(user).id : null;
    
    const response = await api.post('/referrals', referralData, {
      headers: {
        'user-id': userId,
        'user': user
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating referral:', error);
    throw error;
  }
};

export const getUserReferrals = async () => {
  try {
    const user = localStorage.getItem('user');
    const userId = user ? JSON.parse(user).Mobile || JSON.parse(user).mobile || JSON.parse(user).id : null;
    
    const response = await api.get('/referrals/my-referrals', {
      headers: {
        'user-id': userId
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching referrals:', error);
    throw error;
  }
};

export const getReferralCounts = async () => {
  try {
    const user = localStorage.getItem('user');
    const userId = user ? JSON.parse(user).Mobile || JSON.parse(user).mobile || JSON.parse(user).id : null;
    
    const response = await api.get('/referrals/counts', {
      headers: {
        'user-id': userId
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching referral counts:', error);
    throw error;
  }
};

export const updateReferral = async (referralId, referralData) => {
  try {
    const user = localStorage.getItem('user');
    const userId = user ? JSON.parse(user).Mobile || JSON.parse(user).mobile || JSON.parse(user).id : null;
    
    const response = await api.patch(`/referrals/${referralId}`, referralData, {
      headers: {
        'user-id': userId,
        'user': user
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating referral:', error);
    throw error;
  }
};

export const deleteReferral = async (referralId) => {
  try {
    const user = localStorage.getItem('user');
    const userId = user ? JSON.parse(user).Mobile || JSON.parse(user).mobile || JSON.parse(user).id : null;
    
    const response = await api.delete(`/referrals/${referralId}`, {
      headers: {
        'user-id': userId
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting referral:', error);
    throw error;
  }
};

// Preload commonly used data

export const preloadCommonData = async () => {
  try {
    // Load small amounts of data in parallel for quick initial load
    const [membersPreview, memberTypes, hospitals] = await Promise.allSettled([
      getMembersPage(1, 50),  // Get a small preview
      getMemberTypes(),
      getAllHospitals()       // Hospitals are typically small dataset
    ]);
    
    const result = {
      membersPreview: membersPreview.status === 'fulfilled' ? membersPreview.value : null,
      memberTypes: memberTypes.status === 'fulfilled' ? memberTypes.value : null,
      hospitals: hospitals.status === 'fulfilled' ? hospitals.value : null
    };
    
    console.log('✅ Preloaded common data for faster directory loading');
    return result;
  } catch (error) {
    console.error('Error preloading common data:', error);
    return {};
  }
};