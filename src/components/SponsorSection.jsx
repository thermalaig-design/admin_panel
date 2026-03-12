import React, { useState, useEffect } from 'react';
import { Upload, Camera, Edit3, Save, X, UserPlus, RefreshCw, Plus, Trash2, AlertCircle } from 'lucide-react';
import { getAllSponsors, createSponsor, updateSponsor, deleteSponsor } from '../services/sponsorApi';

const SponsorSection = () => {
  const [sponsors, setSponsors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch sponsors on mount
  useEffect(() => {
    fetchSponsors();
  }, []);

  const fetchSponsors = async () => {
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
      
      setSponsors(data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching sponsors:', error);
      setError('Failed to load sponsors');
      setSponsors([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSponsor = async (e) => {
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
      if (editingId) {
        await updateSponsor(editingId, {
          ...formData,
          positions: Array.isArray(formData.positions) ? formData.positions : String(formData.positions).split(',').map(p => p.trim()).filter(p => p)
        });
        setSuccess('Sponsor updated successfully');
      } else {
        await createSponsor({
          ...formData,
          positions: Array.isArray(formData.positions) ? formData.positions : String(formData.positions).split(',').map(p => p.trim()).filter(p => p)
        });
        setSuccess('Sponsor created successfully');
      }
      await fetchSponsors();
      setFormData({
        name: '',
        position: '',
        positions: [],
        about: '',
        photo_url: '',
        is_active: true,
        priority: 0
      });
      setEditingId(null);
      setShowForm(false);
      setImagePreview('');
      setError(null);
    } catch (err) {
      setError('Failed to save sponsor');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSponsor = (sponsor) => {
    setFormData({
      name: sponsor.name,
      position: sponsor.position,
      positions: Array.isArray(sponsor.positions) ? sponsor.positions : sponsor.positions ? String(sponsor.positions).split(',').map(p => p.trim()).filter(p => p) : [],
      about: sponsor.about,
      photo_url: sponsor.photo_url,
      is_active: sponsor.is_active,
      priority: sponsor.priority
    });
    setEditingId(sponsor.id);
    setImagePreview(sponsor.photo_url || '');
    setShowForm(true);
  };

  const handleDeleteSponsor = async (id) => {
    if (window.confirm('Are you sure you want to delete this sponsor?')) {
      try {
        setIsLoading(true);
        await deleteSponsor(id);
        setSuccess('Sponsor deleted successfully');
        await fetchSponsors();
        setError(null);
      } catch (err) {
        setError('Failed to delete sponsor');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
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

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
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

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl lg:rounded-3xl p-5 lg:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 lg:p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
            <UserPlus className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg lg:text-xl font-bold text-gray-800">Sponsor Management</h2>
            <p className="text-gray-500 text-xs lg:text-sm">Manage sponsor information</p>
          </div>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add</span>
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 lg:p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 lg:p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
          <Save className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <p className="text-emerald-700 text-sm">{success}</p>
        </div>
      )}

      {showForm && (
        <div className="mb-6 p-4 lg:p-5 bg-amber-50 border border-amber-200 rounded-xl">
          <h3 className="text-base font-bold text-gray-800 mb-4">
            {editingId ? 'Edit Sponsor' : 'Create New Sponsor'}
          </h3>
          <form onSubmit={handleAddSponsor} className="space-y-4">
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

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 lg:px-6 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors duration-300 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 lg:px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 text-sm font-medium"
              >
                {isLoading ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading && !showForm && (
        <div className="text-center py-10">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
          </div>
          <p className="mt-4 text-gray-500 text-sm">Loading sponsors...</p>
        </div>
      )}

      {!isLoading && sponsors.length === 0 && !showForm && (
        <div className="text-center py-12">
          <UserPlus className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium mb-2">No sponsors yet</p>
          <p className="text-gray-400 text-sm mb-4">
            Create your first sponsor to get started
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            <Plus className="h-4 w-4" />
            Create Sponsor
          </button>
        </div>
      )}

      {!isLoading && sponsors.length > 0 && (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {sponsors.map((sponsor) => (
            <div
              key={sponsor.id}
              className={`p-4 border rounded-xl transition-all duration-300 ${
                sponsor.is_active
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <img
                    src={sponsor.photo_url || '/placeholder-avatar.jpg'}
                    alt={sponsor.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                    onError={(e) => {
                      e.target.src = '/placeholder-avatar.jpg';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-gray-800 font-medium flex-1 break-words">
                        {sponsor.name}
                      </p>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${
                          sponsor.is_active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {sponsor.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{sponsor.position}</p>
                    {sponsor.positions && Array.isArray(sponsor.positions) && sponsor.positions.length > 0 && (
                      <p className="text-sm text-gray-500 mb-1">{sponsor.positions.join(', ')}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>
                        {new Date(sponsor.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleEditSponsor(sponsor)}
                    title="Edit"
                    className="p-1.5 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all duration-300"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() =>
                      handleDeleteSponsor(sponsor.id)
                    }
                    title="Delete"
                    className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-all duration-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SponsorSection;