import React, { useState, useEffect } from 'react';
import { getAllSponsors, updateSponsor } from '../services/sponsorApi';

const PublicSponsorDisplay = () => {
  const [sponsor, setSponsor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    positions: [],
    about: '',
    photo_url: '',
    is_active: true
  });
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    const fetchSponsor = async () => {
      try {
        setIsLoading(true);
        const result = await getAllSponsors();
        console.log('Sponsor API result:', result); // Debug log
        
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
        
        console.log('Processed sponsor data:', data); // Debug log
        
        // Get the first active sponsor or the first one if no active filter
        if (Array.isArray(data) && data.length > 0) {
          // Filter for active sponsors only
          const activeSponsors = data.filter(s => s.is_active !== false);
          console.log('Active sponsors found:', activeSponsors); // Debug log
          const sponsorData = activeSponsors.length > 0 ? activeSponsors[0] : data[0];
          setSponsor(sponsorData);
          // Pre-populate form data if editing
          if (isEditing && sponsorData) {
            setFormData({
              name: sponsorData.name || '',
              position: sponsorData.position || '',
              positions: Array.isArray(sponsorData.positions) ? sponsorData.positions : sponsorData.positions ? String(sponsorData.positions).split(',').map(p => p.trim()).filter(p => p) : [],
              about: sponsorData.about || '',
              photo_url: sponsorData.photo_url || '',
              is_active: sponsorData.is_active !== undefined ? sponsorData.is_active : true
            });
            setImagePreview(sponsorData.photo_url || '');
          }
        } else {
          setSponsor(null);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching sponsor:', err);
        setError('Failed to load sponsor information');
        setSponsor(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSponsor();
  }, [isEditing]);

  const handleEditClick = () => {
    if (sponsor) {
      // Set form data to current sponsor data
      setFormData({
        name: sponsor.name || '',
        position: sponsor.position || '',
        positions: Array.isArray(sponsor.positions) ? sponsor.positions : sponsor.positions ? String(sponsor.positions).split(',').map(p => p.trim()).filter(p => p) : [],
        about: sponsor.about || '',
        photo_url: sponsor.photo_url || '',
              is_active: sponsor.is_active !== undefined ? sponsor.is_active : true
      });
      setImagePreview(sponsor.photo_url || '');
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      name: '',
      position: '',
      positions: [],
      about: '',
      photo_url: '',
      is_active: true
    });
    setImagePreview('');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'positions') {
      // Handle positions as an array
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
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const compressImage = (file, callback) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions (max 800x800)
      let { width, height } = img;
      const maxWidth = 800;
      const maxHeight = 800;
      
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height *= maxWidth / width));
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width *= maxHeight / height));
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw image on canvas
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert back to blob
      canvas.toBlob((blob) => {
        const compressedFile = new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() });
        callback(compressedFile);
      }, 'image/jpeg', 0.8); // 80% quality
    };
    
    img.src = URL.createObjectURL(file);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (limit to 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size too large. Please select an image under 2MB.');
        return;
      }
      
      // Check file type
      if (!file.type.match('image.*')) {
        setError('Please select a valid image file (jpg, png, gif, etc.)');
        return;
      }
      
      // Compress image if needed
      compressImage(file, (compressedFile) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target.result);
          setFormData(prev => ({
            ...prev,
            photo_url: e.target.result // In real app, this would be the uploaded URL
          }));
        };
        reader.readAsDataURL(compressedFile);
      });
    }
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Name cannot be empty');
      return;
    }
    
    if (!formData.position.trim()) {
      setError('Position cannot be empty');
      return;
    }

    try {
      setIsLoading(true);
      const result = await updateSponsor(sponsor.id, {
        ...formData,
        positions: Array.isArray(formData.positions) ? formData.positions : String(formData.positions).split(',').map(p => p.trim()).filter(p => p)
      });
      
      // Refresh the sponsor data
      setSponsor(result.data);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError('Failed to update sponsor');
      console.error('Error updating sponsor:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !isEditing) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl lg:rounded-3xl p-5 lg:p-6 shadow-sm">
        <div className="animate-pulse flex flex-col items-center">
          <div className="rounded-full bg-gray-200 h-20 w-20 mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (error || !sponsor) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl lg:rounded-3xl p-5 lg:p-6 shadow-sm">
        <div className="text-center py-8">
          <div className="mx-auto mb-4 w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-gray-500">No sponsor information available</p>
        </div>
      </div>
    );
  }

  if (isEditing) {
    // Editing mode - Show form
    return (
      <div className="bg-white border border-gray-200 rounded-2xl lg:rounded-3xl p-5 lg:p-6 shadow-sm">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Sponsor Details</h2>
        </div>
        
        <form onSubmit={handleSaveChanges} className="space-y-4">
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
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
              rows="3"
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
              placeholder="Tell us about the sponsor..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center pt-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Active</span>
              </label>
            </div>
          </div>

          <div className="text-center">
            <div className="relative inline-block mb-4">
              <img
                src={imagePreview || formData.photo_url || '/placeholder-avatar.jpg'}
                alt="Sponsor Preview"
                className="w-16 h-16 rounded-full object-cover mx-auto border-4 border-gray-100 shadow-md"
                onError={(e) => {
                  e.target.src = '/placeholder-avatar.jpg';
                }}
              />
              <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-4 lg:px-6 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors duration-300 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 lg:px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 text-sm font-medium"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl lg:rounded-3xl p-5 lg:p-6 shadow-sm">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Sponsor Details</h2>
        <div className="mx-auto mb-4">
          <img
            src={sponsor.photo_url || '/placeholder-avatar.jpg'}
            alt={sponsor.name}
            className="w-16 h-16 rounded-full object-cover mx-auto border-4 border-gray-100 shadow-md"
            onError={(e) => {
              e.target.src = '/placeholder-avatar.jpg';
            }}
          />
        </div>
        <h3 className="text-lg lg:text-xl font-bold text-gray-800 mb-1">{sponsor.name}</h3>
        <p className="text-sm text-gray-600 mb-1">{sponsor.position}</p>
        {sponsor.positions && Array.isArray(sponsor.positions) && sponsor.positions.length > 0 && (
          <p className="text-sm text-gray-500 mb-2">{sponsor.positions.join(', ')}</p>
        )}
        <p className="text-sm text-gray-500">{sponsor.about}</p>
        {sponsor.is_active === false && (
          <div className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full mt-2">
            Inactive
          </div>
        )}
        <div className="mt-6">
          <button
            onClick={handleEditClick}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            Edit Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublicSponsorDisplay;