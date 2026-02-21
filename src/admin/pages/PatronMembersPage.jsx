import React, { useState, useEffect, useMemo } from 'react';
import { Award, Search, Plus, Edit2, Trash2, X, Save, Loader, ChevronLeft, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
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

const PatronMembersPage = ({ onNavigate }) => {
  const [patronMembers, setPatronMembers] = useState([]);
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
      
      // Filter for patron members based on type field
      const allMembers = membersResponse?.data || [];
      const electedMembersData = electedResponse?.data || [];
      
      const filteredPatrons = allMembers.filter(member => 
        (member.type || '').toLowerCase().includes('patron') ||
        (member.type || '').toLowerCase().includes('donor') ||
        (member.type || '').toLowerCase().includes('supporter') ||
        (member.type || '').toLowerCase().includes('honorary')
      );
      
      // Merge patron members with their elected member details
      const mergedPatrons = filteredPatrons.map(patron => {
        const electedMatch = electedMembersData.find(elected => 
          elected.membership_number === patron['Membership number'] ||
          elected.membership_number === patron.membership_number ||
          elected.membership_number === patron.Membership_number
        );
        
        return {
          ...patron,
          ...(electedMatch || {}), // Add elected details if they exist
          is_elected_member: !!electedMatch
        };
      });
      
      // Remove duplicates based on membership number or name
      const uniquePatrons = mergedPatrons.filter((patron, index, self) => {
        // First try to deduplicate by membership number
        const membershipNumber = patron['Membership number'] || patron.membership_number || patron.Membership_number;
        if (membershipNumber) {
          return index === self.findIndex(p => 
            (p['Membership number'] || p.membership_number || p.Membership_number) === membershipNumber
          );
        }
        // If no membership number, deduplicate by name
        const name = patron.Name || patron.name || '';
        return index === self.findIndex(p => 
          (p.Name || p.name || '') === name
        );
      });
      
      // Sort patrons alphabetically by name
      const sortedPatrons = uniquePatrons.sort((a, b) => {
        const nameA = (a.Name || a.name || '').toString().toLowerCase();
        const nameB = (b.Name || b.name || '').toString().toLowerCase();
        return nameA.localeCompare(nameB);
      });
      
      setPatronMembers(sortedPatrons);
    } catch (err) {
      console.error('Error loading patron members:', err);
      setError(`Failed to load patron members: ${err.message || 'Please make sure backend server is running'}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    let result;
    
    if (!q) {
      result = patronMembers;
    } else {
      result = patronMembers.filter(item => {
        try {
          return Object.values(item).some(value => 
            value && value.toString().toLowerCase().includes(q)
          );
        } catch {
          return false;
        }
      });
    }
    
    // Sort the filtered results alphabetically by name
    return result.sort((a, b) => {
      const nameA = (a.Name || a.name || '').toString().toLowerCase();
      const nameB = (b.Name || b.name || '').toString().toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [searchQuery, patronMembers]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({ type: 'Patron', isElected: false }); // Set default type as Patron
    setShowAddForm(true);
  };

  const handleDownload = () => {
    if (!filteredData.length) {
      alert('No data to download');
      return;
    }

    // Prepare data for Excel
    const dataToExport = filteredData.map((item) => ({
      'Name': item.Name || 'N/A',
      'Membership Number': item['Membership number'] || item.membership_number || 'N/A',
      'Mobile': item.Mobile || 'N/A',
      'Email': item.Email || 'N/A',
      'Type': item.type || 'N/A',
      'Company Name': item['Company Name'] || 'N/A',
      'Address Home': item['Address Home'] || 'N/A',
      'Address Office': item['Address Office'] || 'N/A',
      'Resident Landline': item['Resident Landline'] || 'N/A',
      'Office Landline': item['Office Landline'] || 'N/A',
      'Position': item.position || 'N/A',
      'Location': item.location || 'N/A',
      'Is Elected Member': item.is_elected_member ? 'Yes' : 'No'
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Patron Members');

    // Set column widths
    worksheet['!cols'] = [
      { wch: 20 }, // Name
      { wch: 15 }, // Membership Number
      { wch: 12 }, // Mobile
      { wch: 15 }, // Email
      { wch: 15 }, // Type
      { wch: 20 }, // Company Name
      { wch: 20 }, // Address Home
      { wch: 20 }, // Address Office
      { wch: 15 }, // Resident Landline
      { wch: 15 }, // Office Landline
      { wch: 15 }, // Position
      { wch: 15 }, // Location
      { wch: 12 }  // Is Elected Member
    ];

    // Generate filename with current date
    const date = new Date().toISOString().slice(0, 10);
    const filename = `Patron_Members_${date}.xlsx`;

    // Download the file
    XLSX.writeFile(workbook, filename);
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
    if (!window.confirm('Are you sure you want to delete this patron member?')) {
      return;
    }

    try {
      const id = item.id || item['S. No.'];
      await deleteMember(id);
      
      // Remove the deleted item and maintain alphabetical order
      const updatedPatronMembers = patronMembers.filter(m => (m.id || m['S. No.']) !== id);
      
      // Sort the remaining members alphabetically by name
      const sortedPatronMembers = updatedPatronMembers.sort((a, b) => {
        const nameA = (a.Name || a.name || '').toString().toLowerCase();
        const nameB = (b.Name || b.name || '').toString().toLowerCase();
        return nameA.localeCompare(nameB);
      });
      
      setPatronMembers(sortedPatronMembers);
      alert('Patron member deleted successfully!');
    } catch (err) {
      console.error('Error deleting patron member:', err);
      alert(`Failed to delete: ${err.message || 'Unknown error'}`);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const id = editingItem?.id || editingItem?.['S. No.'];

      // Prepare member data - determine type based on conversion checkbox
      let memberType = 'Patron';
      if (formData.convertToTrustee) {
        memberType = 'Trustee';
      }
      
      const memberData = { ...formData, type: memberType };
      
      // Extract temporary fields not needed for member creation/update
      const {
        convertToTrustee: _convertToTrusteeValue, // UI-only field, not saved to DB
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
        const updatedPatronMembers = patronMembers.map(m => 
          (m.id || m['S. No.']) === id ? { ...m, ...memberPayload } : m
        );
        
        // Sort the updated members alphabetically by name for immediate UI update
        const sortedPatronMembers = updatedPatronMembers.sort((a, b) => {
          const nameA = (a.Name || a.name || '').toString().toLowerCase();
          const nameB = (b.Name || b.name || '').toString().toLowerCase();
          return nameA.localeCompare(nameB);
        });
        
        setPatronMembers(sortedPatronMembers);
      } else {
        // Create new member
        const response = await createMember(memberPayload);
        const newPatronMembers = [...patronMembers, response.data];
        
        // Sort the new members alphabetically by name for immediate UI update
        const sortedPatronMembers = newPatronMembers.sort((a, b) => {
          const nameA = (a.Name || a.name || '').toString().toLowerCase();
          const nameB = (b.Name || b.name || '').toString().toLowerCase();
          return nameA.localeCompare(nameB);
        });
        
        setPatronMembers(sortedPatronMembers);
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
      alert(editingItem ? 'Patron member updated successfully!' : 'Patron member added successfully!');
    } catch (err) {
      console.error('Error saving patron member:', err);
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
      { key: 'type', label: 'Type', defaultValue: 'Patron' },
      // { key: 'convertToTrustee', label: 'Change to Trustee?', type: 'checkbox' },
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
              {editingItem ? 'Edit' : 'Add'} Patron Member
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
                        
            {/* Convert to Trustee Option */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.convertToTrustee || false}
                  onChange={(e) => setFormData({ ...formData, convertToTrustee: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">Convert this member to Trustee?</span>
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
              <h2 className="text-lg font-bold text-gray-800">Patron Members</h2>
              <p className="text-gray-500 text-sm">Manage patron members</p>
            </div>
          </div>
        </div>

        {/* Search & Add & Download */}
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
            onClick={handleDownload}
            className="bg-green-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-green-700 flex items-center gap-1.5 text-sm"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
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
                <h3 className="text-gray-800 font-semibold text-sm">No patron members found</h3>
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

export default PatronMembersPage;