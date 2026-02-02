import React, { useState, useEffect, useMemo } from 'react';
import { Users, Search, Plus, Edit2, Trash2, X, Save, Loader, ChevronLeft } from 'lucide-react';
import Pagination from '../components/Pagination';
import { 
  getAllCommitteeMembersAdmin, 
  createCommitteeMember, 
  updateCommitteeMember, 
  deleteCommitteeMember 
} from '../services/adminApi';

const CommitteeMembersPage = ({ onNavigate }) => {
  const [committeeMembers, setCommitteeMembers] = useState([]);
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
      const response = await getAllCommitteeMembersAdmin();
      setCommitteeMembers(response?.data || []);
    } catch (err) {
      console.error('Error loading committee members:', err);
      setError(`Failed to load committee members: ${err.message || 'Please make sure backend server is running'}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) return committeeMembers;
    
    return committeeMembers.filter(item => {
      try {
        return Object.values(item).some(value => 
          value && value.toString().toLowerCase().includes(q)
        );
      } catch {
        return false;
      }
    });
  }, [searchQuery, committeeMembers]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({});
    setShowAddForm(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setShowAddForm(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Are you sure you want to delete this committee member?')) {
      return;
    }

    try {
      const id = item.id || item.committee_id || item['S. No.'];
      await deleteCommitteeMember(id);
      setCommitteeMembers(committeeMembers.filter(c => (c.id || c.committee_id || c['S. No.']) !== id));
      alert('Committee member deleted successfully!');
    } catch (err) {
      console.error('Error deleting committee member:', err);
      alert(`Failed to delete: ${err.message || 'Unknown error'}`);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const id = editingItem?.id || editingItem?.committee_id || editingItem?.['S. No.'];

      if (id) {
        await updateCommitteeMember(id, formData);
        setCommitteeMembers(committeeMembers.map(c => 
          (c.id || c.committee_id || c['S. No.']) === id ? { ...c, ...formData } : c
        ));
      } else {
        const newCommitteeMember = await createCommitteeMember(formData);
        setCommitteeMembers([...committeeMembers, newCommitteeMember.data]);
      }
      
      setShowAddForm(false);
      setEditingItem(null);
      setFormData({});
      alert(editingItem ? 'Committee member updated successfully!' : 'Committee member added successfully!');
    } catch (err) {
      console.error('Error saving committee member:', err);
      alert(`Failed to save: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    const fields = [
      { key: 'member_name_english', label: 'Member Name (English)', required: true },
      { key: 'committee_name_english', label: 'Committee Name (English)' },
      { key: 'committee_name_hindi', label: 'Committee Name (Hindi)' },
      { key: 'member_role', label: 'Member Role' },
      { key: 'membership_number', label: 'Membership Number' },
    ];
    
    return (
      <div className="px-6 mt-4">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {editingItem ? 'Edit' : 'Add'} Committee Member
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
                  value={formData[field.key] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required={field.required}
                />
              </div>
            ))}
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
    const displayName = item.member_name_english || item.Name || 'N/A';
    const id = item.id || item.committee_id || item['S. No.'];

    return (
      <div key={id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-bold text-gray-800 text-base mb-2">{displayName}</h3>
            <div className="space-y-1 text-sm text-gray-600">
              {item.committee_name_english && (
                <p><span className="font-medium">Committee:</span> {item.committee_name_english}</p>
              )}
              {item.committee_name_hindi && (
                <p><span className="font-medium">Committee (Hindi):</span> {item.committee_name_hindi}</p>
              )}
              {item.member_role && (
                <p><span className="font-medium">Role:</span> {item.member_role}</p>
              )}
              {item.membership_number && (
                <p><span className="font-medium">Membership #:</span> {item.membership_number}</p>
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
              <h2 className="text-lg font-bold text-gray-800">Committee Members</h2>
              <p className="text-gray-500 text-sm">Manage committee members</p>
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
                <h3 className="text-gray-800 font-semibold text-sm">No committee members found</h3>
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

export default CommitteeMembersPage;