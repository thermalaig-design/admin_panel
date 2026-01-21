import React, { useState, useEffect } from 'react';
import { Upload, Camera, Edit3, Save, X, UserPlus, RefreshCw } from 'lucide-react';
import { getAllSponsors, createSponsor, updateSponsor, deleteSponsor } from '../services/sponsorApi';

const SponsorSection = () => {
  const [sponsor, setSponsor] = useState(null);
  const [showChangeForm, setShowChangeForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    positions: [],
    about: '',
    photo_url: '',
    is_active: true,
    priority: 0
  });
  const [imagePreview, setImagePreview] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isChanging, setIsChanging] = useState(false);

  // Fetch sponsor data from backend
  useEffect(() => {
    fetchSponsor();
  }, []);

  const fetchSponsor = async () => {
    try {
      setIsLoading(true);
      // Fetch sponsor data from the backend API
      const result = await getAllSponsors();
      
      // Handle different response formats
      let data;
      if (result && result.data) {
        // Response format: { success: true, data: [...] }
        data = result.data;
      } else if (Array.isArray(result)) {
        // Response format: [...]
        data = result;
      } else {
        // Unexpected format
        console.warn('Unexpected response format:', result);
        data = [];
      }
      
      if (Array.isArray(data) && data.length > 0) {
        // Get the first active sponsor or the first one if no active filter
        const sponsorData = data[0];
        setSponsor(sponsorData);
        setFormData({
          name: sponsorData.name || '',
          position: sponsorData.position || '',
          positions: Array.isArray(sponsorData.positions) ? sponsorData.positions : sponsorData.positions ? String(sponsorData.positions).split(',') : [],
          about: sponsorData.about || '',
          photo_url: sponsorData.photo_url || '',
          is_active: sponsorData.is_active !== undefined ? sponsorData.is_active : true,
          priority: sponsorData.priority || 0
        });
        setImagePreview(sponsorData.photo_url || '');
      } else {
        // No sponsors found
        setSponsor(null);
        resetFormData();
      }
    } catch (error) {
      console.error('Error fetching sponsor:', error);
      // Set sponsor to null on error so UI shows "No sponsor" message
      setSponsor(null);
      resetFormData();
    } finally {
      setIsLoading(false);
    }
  };

  const resetFormData = () => {
    setFormData({
      name: '',
      position: '',
      positions: [],
      about: '',
      photo_url: '',
      is_active: true,
      priority: 0
    });
    setImagePreview('');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        setFormData(prev => ({
          ...prev,
          photo_url: e.target.result // In real app, this would be the uploaded URL
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let result;
      
      if (sponsor && !isChanging) {
        // Update existing sponsor
        result = await updateSponsor(sponsor.id, {
          ...formData,
          updated_by: 'admin'
        });
      } else {
        // Create new sponsor (there should only be one)
        result = await createSponsor({
          ...formData,
          created_by: 'admin'
        });
      }

      if (result.success) {
        setSponsor(result.data);
        setIsEditing(false);
        setShowChangeForm(false);
        setIsChanging(false);
        alert('Sponsor details saved successfully!');
        fetchSponsor(); // Refresh the data
      } else {
        alert(result.message || 'Failed to save sponsor details');
      }
    } catch (error) {
      console.error('Error saving sponsor:', error);
      alert('Error saving sponsor details');
    }
  };

  const handleChangeSponsor = async () => {
    if (sponsor) {
      if (window.confirm('Are you sure you want to change the sponsor? This will remove the current sponsor.')) {
        try {
          // Delete current sponsor
          const result = await deleteSponsor(sponsor.id);
          if (result.success) {
            setSponsor(null);
            resetFormData();
            setShowChangeForm(true);
            setIsChanging(true);
          }
        } catch (error) {
          console.error('Error changing sponsor:', error);
          alert('Error changing sponsor');
        }
      }
    } else {
      setShowChangeForm(true);
      setIsChanging(true);
    }
  };

  const handleEditClick = () => {
    if (isEditing) {
      // Cancel editing - revert to original values
      if (sponsor) {
        setFormData({
          name: sponsor.name || '',
          position: sponsor.position || '',
          positions: Array.isArray(sponsor.positions) ? sponsor.positions : sponsor.positions ? String(sponsor.positions).split(',') : [],
          about: sponsor.about || '',
          photo_url: sponsor.photo_url || '',
          is_active: sponsor.is_active !== undefined ? sponsor.is_active : true,
          priority: sponsor.priority || 0
        });
        setImagePreview(sponsor.photo_url || '');
      } else {
        resetFormData();
      }
    }
    setIsEditing(!isEditing);
    setShowChangeForm(false);
    setIsChanging(false);
  };

  const handleCancelChange = () => {
    setShowChangeForm(false);
    setIsChanging(false);
    if (sponsor) {
      setIsEditing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 lg:p-8 shadow-sm">
        <div className="animate-pulse flex flex-col items-center">
          <div className="rounded-full bg-gray-200 h-24 w-24 mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 lg:p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-gray-800">Our Sponsor</h2>
          {sponsor && (
            <p className="text-sm text-gray-500 mt-1">
              Current sponsor: <span className="font-medium text-blue-600">{sponsor.name}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {sponsor && (
            <button
              onClick={handleChangeSponsor}
              className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-full hover:bg-orange-100 transition-colors"
            >
              <RefreshCw className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-orange-600 font-medium">Change</span>
            </button>
          )}
          <button
            onClick={handleEditClick}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full hover:bg-blue-100 transition-colors"
          >
            {isEditing ? (
              <>
                <X className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-600 font-medium">Cancel</span>
              </>
            ) : (
              <>
                <Edit3 className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-600 font-medium">
                  {sponsor ? 'Edit' : 'Add Sponsor'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {!isEditing && !showChangeForm ? (
        // Display mode
        <div className="text-center">
          {sponsor ? (
            <>
              <div className="mx-auto mb-6">
                <img
                  src={imagePreview || sponsor.photo_url || '/placeholder-avatar.jpg'}
                  alt={sponsor.name}
                  className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-gray-100 shadow-md"
                  onError={(e) => {
                    e.target.src = '/placeholder-avatar.jpg';
                  }}
                />
              </div>
              <h3 className="text-lg lg:text-xl font-bold text-gray-800 mb-1">{sponsor.name}</h3>
              <p className="text-sm text-gray-600 mb-1">{sponsor.position}</p>
              {sponsor.positions && Array.isArray(sponsor.positions) && sponsor.positions.length > 0 && (
                <p className="text-sm text-gray-500 mb-1">{Array.isArray(sponsor.positions) ? sponsor.positions.join(', ') : String(sponsor.positions)}</p>
              )}
              <p className="text-sm text-gray-500 mb-4">{sponsor.about}</p>
              {sponsor.is_active === false && (
                <div className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                  Inactive
                </div>
              )}
              <div className="mt-4 text-xs text-gray-400">
                Priority: {sponsor.priority || 0}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto mb-4 w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Camera className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500">No sponsor details available</p>
              <button
                onClick={() => {
                  setShowChangeForm(true);
                  setIsChanging(true);
                }}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
              >
                <UserPlus className="h-4 w-4" />
                Add Sponsor
              </button>
            </div>
          )}
        </div>
      ) : (
        // Edit/Change mode
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center">
            <div className="relative inline-block mb-4">
              <img
                src={imagePreview || formData.photo_url || '/placeholder-avatar.jpg'}
                alt="Sponsor Preview"
                className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-gray-100 shadow-md"
                onError={(e) => {
                  e.target.src = '/placeholder-avatar.jpg';
                }}
              />
              <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer">
                <Upload className="h-4 w-4 text-gray-600" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter sponsor name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position *
              </label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter sponsor position"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Positions (comma separated)
            </label>
            <input
              type="text"
              name="positions"
              value={Array.isArray(formData.positions) ? formData.positions.join(', ') : String(formData.positions) || ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value.trim() === '') {
                  setFormData(prev => ({
                    ...prev,
                    positions: []
                  }));
                } else {
                  const positions = value.split(',').map(pos => pos.trim()).filter(pos => pos);
                  setFormData(prev => ({
                    ...prev,
                    positions: positions
                  }));
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter positions separated by commas"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              About
            </label>
            <textarea
              name="about"
              value={formData.about}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Tell us about the sponsor..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <input
                type="number"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Priority (0-100)"
              />
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Active</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleCancelChange}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isChanging ? 'Change Sponsor' : 'Save Details'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SponsorSection;