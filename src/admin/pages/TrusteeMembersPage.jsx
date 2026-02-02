import React, { useState, useEffect, useMemo } from 'react';
import { Star, Search, Plus, Edit2, Trash2, X, Save, Loader, ChevronLeft } from 'lucide-react';
import Pagination from '../components/Pagination';
import { 
  getAllMembersAdmin, 
  createMember, 
  updateMember, 
  deleteMember,
  getAllElectedMembersAdmin,
  createElectedMember,
  updateElectedMember,
  deleteElectedMember
} from '../services/adminApi';

const TrusteeMembersPage = ({ onNavigate }) => {
  const [trusteeMembers, setTrusteeMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch both members and elected members
      const [membersResponse, electedResponse] = await Promise.all([
        getAllMembersAdmin(),
        getAllElectedMembersAdmin()
      ]);
      
      // Filter for trustee members based on type field
      const allMembers = membersResponse?.data || [];
      const electedMembersData = electedResponse?.data || [];
      
      const filteredTrustees = allMembers.filter(member => 
        (member.type || '').toLowerCase().includes('trustee') ||
        (member.type || '').toLowerCase().includes('board') ||
        (member.type || '').toLowerCase().includes('chairman') ||
        (member.type || '').toLowerCase().includes('president') ||
        (member.type || '').toLowerCase().includes('vice')
      );
      
      // Merge trustee members with their elected member details
      const mergedTrustees = filteredTrustees.map(trustee => {
        const electedMatch = electedMembersData.find(elected => 
          elected.membership_number === trustee['Membership number'] ||
          elected.membership_number === trustee.membership_number ||
          elected.membership_number === trustee.Membership_number
        );
        
        return {
          ...trustee,
          ...(electedMatch || {}), // Add elected details if they exist
          // Don't add is_elected_member to member data - it belongs in elected_members table only
          is_elected_member: !!electedMatch
        };
      });
      
      setTrusteeMembers(mergedTrustees);
    } catch (err) {
      console.error('Error loading trustee members:', err);
      setError(`Failed to load trustee members: ${err.message || 'Please make sure backend server is running'}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) return trusteeMembers;
    
    return trusteeMembers.filter(item => {
      try {
        return Object.values(item).some(value => 
          value && value.toString().toLowerCase().includes(q)
        );
      } catch {
        return false;
      }
    });
  }, [searchQuery, trusteeMembers]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({ type: 'Trustee', isElected: false }); // Set default type as Trustee
    setShowAddForm(true);
  };

  const handleEdit = (item) => {
    // Create form data that combines member and elected member fields
    const combinedFormData = {
      ...item,
      isElected: item.is_elected_member || false,
      position: item.position || '',
      location: item.location || ''
    };
    setEditingItem(item);
    setFormData(combinedFormData);
    setShowAddForm(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Are you sure you want to delete this trustee member?')) {
      return;
    }

    try {
      const id = item.id || item['S. No.'];
      await deleteMember(id);
      setTrusteeMembers(trusteeMembers.filter(m => (m.id || m['S. No.']) !== id));
      alert('Trustee member deleted successfully!');
    } catch (err) {
      console.error('Error deleting trustee member:', err);
      alert(`Failed to delete: ${err.message || 'Unknown error'}`);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const id = editingItem?.id || editingItem?.['S. No.'];

      // Prepare member data - determine type based on conversion checkbox
      let memberType = 'Trustee';
      if (formData.convertToPatron) {
        memberType = 'Patron';
      }
      
      const memberData = { ...formData, type: memberType };
      
      // Extract temporary fields not needed for member creation/update
      const {
        convertToPatron: _convertToPatronValue, // UI-only field, not saved to DB
        isElected: isElectedValue, position: positionValue, location: locationValue, // temporary UI fields
        created_at: _createdAtValue, updated_at: _updatedAtValue, // system timestamp fields (ignored)
        id: _memberIdValue, membership_number: _membershipNumberValue, // primary key and cross-table field (ignored)
        ...cleanMemberData
      } = memberData;
      
      const memberPayload = cleanMemberData;
      
      const isElected = isElectedValue;
      const electedPosition = positionValue;
      const electedLocation = locationValue;
      
      // Add is_elected_member field if the member is elected
      if (isElected) {
        memberPayload.is_elected_member = true;
      } else {
        memberPayload.is_elected_member = false;
      };

      // Determine the membership number for elected member operations
      let membershipNumber = memberPayload['Membership number'] || editingItem?.['Membership number'];
      if (!membershipNumber) {
        // Try alternative field names
        membershipNumber = memberPayload.membership_number || editingItem?.membership_number || 
                           memberPayload.Membership_number || editingItem?.Membership_number;
      }
      
      if (id) {
        // Update existing member
        await updateMember(id, memberPayload);
        setTrusteeMembers(trusteeMembers.map(m => 
          (m.id || m['S. No.']) === id ? { ...m, ...memberPayload } : m
        ));
      } else {
        // Create new member
        const response = await createMember(memberPayload);
        setTrusteeMembers([...trusteeMembers, response.data]);
        // If this is a new member, get the membership number from the response
        if (!membershipNumber && (response?.data?.['Membership number'] || response?.data?.membership_number)) {
          membershipNumber = response.data['Membership number'] || response.data.membership_number;
        }
      }
      
      // Handle elected member functionality if needed
      if (isElected) {
        if (membershipNumber) {
          // Add to elected_members table
          const electedData = {
            membership_number: membershipNumber,
            position: electedPosition,
            location: electedLocation
          };
          
          // Check if already exists
          const electedMembers = await getAllElectedMembersAdmin();
          const existingElected = electedMembers.data.find(e => e.membership_number === membershipNumber);
          
          if (existingElected) {
            // Update existing
            await updateElectedMember(existingElected.id || existingElected.elected_id || existingElected['S. No.'], electedData);
          } else {
            // Create new
            await createElectedMember(electedData);
          }
        }
      } else if (editingItem && editingItem.is_elected_member && !isElected) {
        // Remove from elected_members table if user unchecked elected option
        if (membershipNumber) {
          const electedMembers = await getAllElectedMembersAdmin();
          const electedRecord = electedMembers.data.find(e => e.membership_number === membershipNumber);
          if (electedRecord) {
            await deleteElectedMember(electedRecord.id || electedRecord.elected_id || electedRecord['S. No.']);
          }
        }
      }
      
      // Reload data to reflect changes
      loadData();
      
      setShowAddForm(false);
      setEditingItem(null);
      setFormData({});
      alert(editingItem ? 'Trustee member updated successfully!' : 'Trustee member added successfully!');
    } catch (err) {
      console.error('Error saving trustee member:', err);
      console.error('Error name:', err.name);
      console.error('Error message:', err.message);
      console.error('Error code:', err.code);
      console.error('Error response:', err.response);
      if (err.response) {
        console.error('Error response data:', err.response.data);
        console.error('Error response status:', err.response.status);
      }
      
      // Create a more detailed error message
      let errorMessage = 'Unknown error';
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      alert(`Failed to save: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    const fields = [
      { key: 'Name', label: 'Name', required: true },
      { key: 'Membership number', label: 'Membership Number' },
      { key: 'Mobile', label: 'Mobile' },
      { key: 'Email', label: 'Email' },
      { key: 'type', label: 'Type', defaultValue: 'Trustee' },
      { key: 'Company Name', label: 'Company Name' },
      { key: 'Address Home', label: 'Address Home', fullWidth: true },
      { key: 'Address Office', label: 'Address Office', fullWidth: true },
      { key: 'Resident Landline', label: 'Resident Landline' },
      { key: 'Office Landline', label: 'Office Landline' },
    ];
    
    return (
      <div className="px-6 mt-4">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {editingItem ? 'Edit' : 'Add'} Trustee Member
            </h2>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingItem(null);
                setFormData({});
              }}
              className="p-2 rounded-xl hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field.key} className={field.fullWidth ? 'md:col-span-2' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </label>
                <input
                  type={field.type || 'text'}
                  value={formData[field.key] || field.defaultValue || ''}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required={field.required}
                />
              </div>
            ))}
                        
            {/* Convert to Patron Option */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.convertToPatron || false}
                  onChange={(e) => setFormData({ ...formData, convertToPatron: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">Convert this member to Patron?</span>
              </label>
            </div>
                        
            {/* Elected Member Option */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Is this person an Elected Member?
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="isElected"
                    checked={formData.isElected === true}
                    onChange={() => setFormData({ ...formData, isElected: true })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-gray-700">Yes</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="isElected"
                    checked={formData.isElected === false}
                    onChange={() => setFormData({ ...formData, isElected: false })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-gray-700">No</span>
                </label>
              </div>
            </div>
            
            {/* Elected Member Details - Show only if elected */}
            {formData.isElected && (
              <div className="md:col-span-2 space-y-4 pt-4 border-t border-gray-200">
                <h3 className="font-semibold text-gray-800">Elected Member Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Position
                    </label>
                    <input
                      type="text"
                      value={formData.position || ''}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location || ''}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingItem(null);
                setFormData({});
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderMemberCard = (item) => {
    const displayName = item.Name || 'N/A';
    const id = item.id || item['S. No.'];

    return (
      <div key={id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-bold text-gray-800 text-base mb-2">{displayName}</h3>
            <div className="space-y-1 text-sm text-gray-600">
              {item.type && (
                <p><span className="font-medium">Type:</span> {item.type}</p>
              )}
              {item.position && (
                <p><span className="font-medium">Position:</span> {item.position} {item.is_elected_member && '(Elected)'}</p>
              )}
              {item.location && (
                <p><span className="font-medium">Location:</span> {item.location}</p>
              )}
              {item['Membership number'] && (
                <p><span className="font-medium">Membership:</span> {item['Membership number']}</p>
              )}
              {item.Mobile && (
                <p><span className="font-medium">Mobile:</span> {item.Mobile}</p>
              )}
              {item.Email && (
                <p><span className="font-medium">Email:</span> {item.Email}</p>
              )}
              {item['Company Name'] && (
                <p><span className="font-medium">Company:</span> {item['Company Name']}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 pt-4 border-t border-gray-100">
          <button
            onClick={() => handleEdit(item)}
            className="flex-1 bg-indigo-50 text-indigo-600 px-3 py-2 rounded-lg font-medium hover:bg-indigo-100 flex items-center justify-center gap-2"
          >
            <Edit2 className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={() => handleDelete(item)}
            className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded-lg font-medium hover:bg-red-100 flex items-center justify-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 pb-10">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="px-4 sm:px-6 mt-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (showAddForm || editingItem) {
                  // Close the form if it's open
                  setShowAddForm(false);
                  setEditingItem(null);
                  setFormData({});
                } else {
                  // Navigate back to main if form is not open
                  onNavigate('main');
                }
              }}
              className="bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-gray-200"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Trustee Members</h2>
              <p className="text-gray-500 text-sm">Manage trustee members</p>
            </div>
          </div>
        </div>

        {/* Search & Add */}
        <div className="px-4 sm:px-6 mt-4 flex gap-3">
          <div className="flex-1 bg-gray-50 rounded-lg p-2 flex items-center gap-2 border border-gray-200 focus-within:border-indigo-300">
            <Search className="h-4 w-4 text-gray-400 ml-1" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 placeholder-gray-400 text-sm py-1"
            />
          </div>
          <button
            onClick={handleAdd}
            className="bg-indigo-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-1.5 text-sm"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>

        {/* Form */}
        {(showAddForm || editingItem) && renderForm()}

        {/* Error Message */}
        {error && !showAddForm && !editingItem && (
          <div className="px-4 sm:px-6 mt-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-600 font-medium text-sm">{error}</p>
              <button 
                onClick={loadData}
                className="mt-2 bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && !filteredData.length && !showAddForm && !editingItem && (
          <div className="px-4 sm:px-6 mt-4 text-center py-16">
            <Loader className="h-6 w-6 animate-spin text-indigo-600 mx-auto" />
            <p className="text-gray-500 text-sm mt-2">Loading...</p>
          </div>
        )}

        {/* Content List */}
        {!showAddForm && !editingItem && (
          <div className="px-4 sm:px-6 mt-4 space-y-3">
            {!loading && filteredData.length > 0 ? (
              paginatedData.map(item => renderMemberCard(item))
            ) : !loading ? (
              <div className="text-center py-16">
                <div className="bg-gray-50 h-14 w-14 rounded-full flex items-center justify-center mx-auto mb-3 border border-dashed border-gray-300">
                  <Search className="h-6 w-6 text-gray-300" />
                </div>
                <h3 className="text-gray-800 font-semibold text-sm">No trustee members found</h3>
                <p className="text-gray-500 text-xs mt-1">Try adding new or search differently</p>
              </div>
            ) : null}
            
            {filteredData.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredData.length}
                itemsPerPage={itemsPerPage}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrusteeMembersPage;