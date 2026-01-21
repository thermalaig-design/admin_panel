import axios from 'axios';

const API_BASE_URL = import.meta.env.PROD 
  ? 'https://admin-self-seven.vercel.app/api' 
  : '/api'; // Use proxy in development

// Create axios instance
export const sponsorApi = axios.create({
  baseURL: API_BASE_URL,
});

// Get all sponsors (should return only one)
export const getAllSponsors = async () => {
  try {
    const response = await sponsorApi.get('/sponsors');
    return response.data;
  } catch (error) {
    console.error('Error fetching sponsors:', error);
    throw error;
  }
};

// Get sponsor by ID
export const getSponsorById = async (id) => {
  try {
    const response = await sponsorApi.get(`/sponsors/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching sponsor:', error);
    throw error;
  }
};

// Create sponsor
export const createSponsor = async (sponsorData) => {
  try {
    const response = await sponsorApi.post('/admin/sponsors', sponsorData);
    return response.data;
  } catch (error) {
    console.error('Error creating sponsor:', error);
    throw error;
  }
};

// Update sponsor
export const updateSponsor = async (id, sponsorData) => {
  try {
    const response = await sponsorApi.put(`/admin/sponsors/${id}`, sponsorData);
    return response.data;
  } catch (error) {
    console.error('Error updating sponsor:', error);
    throw error;
  }
};

// Delete sponsor
export const deleteSponsor = async (id) => {
  try {
    const response = await sponsorApi.delete(`/admin/sponsors/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting sponsor:', error);
    throw error;
  }
};