import React, { useState, useEffect, useMemo } from 'react';
import { 
    HeartPulse, Search, Trash2, X, 
    CheckCircle2, AlertTriangle, Clock, 
    User, Phone, Calendar, Users,
    RefreshCw, BadgeCheck, ChevronRight, Sparkles, MessageSquare, Loader
  } from 'lucide-react';
import Pagination from '../components/Pagination';
import ReferralDetailPage from './ReferralDetailPage';
import { 
  getAllReferralsAdmin, 
  updateReferral,
  deleteReferral
} from '../services/adminApi';

const ReferralsPage = () => {
  const [referrals, setReferrals] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const [filterStatus, setFilterStatus] = useState('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [showDetailPage, setShowDetailPage] = useState(false);

  // Remark Modal State
  const [showRemarkModal, setShowRemarkModal] = useState(null);
  const [remarkText, setRemarkText] = useState('');
  const [remarkLoading, setRemarkLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllReferralsAdmin();
      setReferrals(response?.data || []);
    } catch (err) {
      console.error('Error loading referrals:', err);
      setError(`Failed to load referrals: ${err.message || 'Please make sure backend server is running'}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredReferrals = useMemo(() => {
    let filtered = referrals;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(referral => 
        referral.patient_name?.toLowerCase().includes(query) ||
        referral.user_name?.toLowerCase().includes(query) ||
        referral.referred_to_doctor?.toLowerCase().includes(query) ||
        referral.department?.toLowerCase().includes(query) ||
        referral.medical_condition?.toLowerCase().includes(query) ||
        referral.patient_phone?.toLowerCase().includes(query) ||
        referral.user_phone?.toLowerCase().includes(query) ||
        referral.category?.toLowerCase().includes(query)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(referral => referral.status?.toLowerCase() === filterStatus.toLowerCase());
    }

    return filtered;
  }, [referrals, searchQuery, filterStatus]);

  const paginatedReferrals = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredReferrals.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredReferrals, currentPage]);

  const totalPages = Math.ceil(filteredReferrals.length / itemsPerPage);

  const statusCounts = useMemo(() => {
    return {
      all: referrals.length,
      pending: referrals.filter(r => r.status?.toLowerCase() === 'pending').length,
      approved: referrals.filter(r => r.status?.toLowerCase() === 'approved').length,
      rejected: referrals.filter(r => r.status?.toLowerCase() === 'rejected').length,
      completed: referrals.filter(r => r.status?.toLowerCase() === 'completed').length,
    };
  }, [referrals]);

  const getStatusConfig = (status) => {
    if (!status) return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', gradient: 'from-gray-500 to-gray-600' };
    
    switch (status.toLowerCase()) {
      case 'pending':
        return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', gradient: 'from-amber-500 to-orange-500' };
      case 'approved':
        return { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', gradient: 'from-emerald-500 to-teal-500' };
      case 'rejected':
        return { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200', gradient: 'from-rose-500 to-pink-500' };
      case 'completed':
        return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', gradient: 'from-blue-500 to-indigo-500' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', gradient: 'from-gray-500 to-gray-600' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleStatusChange = async (e, referralId, newStatus) => {
    e.stopPropagation();
    try {
      await updateReferral(referralId, { status: newStatus });
      loadData();
    } catch (error) {
      console.error('Error updating referral status:', error);
      alert(`Failed to update referral status: ${error.message}`);
    }
  };

  const handleDelete = async (referralId) => {
    try {
      await deleteReferral(referralId);
      loadData();
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting referral:', error);
      alert(`Failed to delete referral: ${error.message}`);
    }
  };

  const openRemarkModal = (e, referral) => {
    e.stopPropagation();
    setRemarkText(referral.remark || '');
    setShowRemarkModal(referral);
  };

  const handleSaveRemark = async () => {
    try {
      setRemarkLoading(true);
      await updateReferral(showRemarkModal.id, { remark: remarkText });
      setReferrals(prev => prev.map(ref => 
        ref.id === showRemarkModal.id ? { ...ref, remark: remarkText } : ref
      ));
      setShowRemarkModal(null);
      setRemarkText('');
    } catch (err) {
      console.error('Error saving remark:', err);
      alert('Failed to save remark: ' + err.message);
    } finally {
      setRemarkLoading(false);
    }
  };

  const openDetailPage = (referral) => {
    setSelectedReferral(referral);
    setShowDetailPage(true);
  };

  const closeDetailPage = () => {
    setShowDetailPage(false);
    setSelectedReferral(null);
  };

  if (showDetailPage && selectedReferral) {
    return (
      <ReferralDetailPage 
        referral={selectedReferral} 
        onBack={closeDetailPage}
        onRefresh={loadData}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium">Loading Referrals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 pb-10 overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 min-h-screen">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-4 sm:px-6 py-5 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <HeartPulse className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Patient Referrals</h1>
                <p className="text-xs text-slate-500">Manage and track referral requests</p>
              </div>
            </div>
            <button
              onClick={loadData}
              className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-slate-200 hover:border-indigo-200"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
{/* Stats Cards - Responsive */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-6">
            {[
              { key: 'all', label: 'All Referrals', count: statusCounts.all, iconBg: 'bg-violet-500', icon: Users },
              { key: 'pending', label: 'Pending', count: statusCounts.pending, iconBg: 'bg-orange-500', icon: Clock },
              { key: 'approved', label: 'Confirmed', count: statusCounts.approved, iconBg: 'bg-emerald-500', icon: CheckCircle2 },
              { key: 'rejected', label: 'Cancelled', count: statusCounts.rejected, iconBg: 'bg-rose-500', icon: X },
              { key: 'completed', label: 'Completed', count: statusCounts.completed, iconBg: 'bg-blue-500', icon: BadgeCheck },
            ].map(stat => (
              <button
                key={stat.key}
                onClick={() => setFilterStatus(stat.key)}
                className={`relative bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 text-center transition-all duration-200 ${
                  filterStatus === stat.key
                    ? 'ring-2 ring-indigo-400 ring-offset-2 shadow-lg'
                    : 'border border-slate-200 hover:shadow-md hover:border-slate-300'
                }`}
              >
                <div className={`w-9 h-9 sm:w-12 sm:h-12 ${stat.iconBg} rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-4 shadow-lg`}>
                  <stat.icon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
                <span className="text-lg sm:text-2xl font-bold text-slate-800 block">{stat.count}</span>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-0.5 sm:mt-1 truncate">{stat.label}</p>
              </button>
            ))}
          </div>

        {/* Search Bar - Separate Line */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by patient name, doctor, phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-10 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all text-sm text-slate-700 placeholder:text-slate-400 shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
            </div>
            <p className="text-rose-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Referrals Grid */}
        {paginatedReferrals.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <HeartPulse className="h-10 w-10 text-indigo-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">No referrals found</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              {searchQuery || filterStatus !== 'all' 
                ? "No matching referrals for your filters." 
                : "Referral requests will appear here."}
            </p>
            {(searchQuery || filterStatus !== 'all') && (
              <button
                onClick={() => { setSearchQuery(''); setFilterStatus('all'); }}
                className="mt-6 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-indigo-200 transition-all"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedReferrals.map((referral) => {
              const statusConfig = getStatusConfig(referral.status);
              
              return (
                <div 
                  key={referral.id} 
                  className="group bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-300 overflow-hidden"
                >
                  {/* Status Strip */}
                  <div className={`h-1.5 bg-gradient-to-r ${statusConfig.gradient}`}></div>
                  
                  {/* Card Body */}
                  <div 
                    onClick={() => openDetailPage(referral)}
                    className="p-5 cursor-pointer"
                  >
                    {/* Status & Date Row */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
                        {referral.status || 'Pending'}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(referral.created_at)}
                      </span>
                    </div>

                    {/* Referrer Info */}
                    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
                      <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-200 group-hover:shadow-lg group-hover:scale-105 transition-all">
                        {referral.user_name?.charAt(0)?.toUpperCase() || 'R'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-indigo-500 uppercase tracking-wide font-semibold mb-0.5">Referred By</p>
                        <h3 className="text-sm font-semibold text-slate-800 truncate">{referral.user_name || 'Unknown'}</h3>
                      </div>
                    </div>

                    {/* Patient Info */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Patient</p>
                          <p className="text-sm font-semibold text-slate-700 truncate">{referral.patient_name || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
                          <Phone className="h-4 w-4 text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Phone</p>
                          <p className="text-sm text-slate-600 truncate">{referral.patient_phone || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* View Details Link */}
                    <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
                      <span className="text-xs text-indigo-500 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                        View Details <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="px-4 py-3.5 bg-slate-50/80 border-t border-slate-100">
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={(e) => handleStatusChange(e, referral.id, 'Approved')}
                        disabled={referral.status === 'Approved'}
                        className={`py-2 px-1 rounded-xl text-[10px] font-semibold transition-all ${
                          referral.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-400 cursor-not-allowed border border-emerald-100'
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 shadow-sm hover:shadow'
                        }`}
                      >
                        Approve
                      </button>
                      <button
                        onClick={(e) => openRemarkModal(e, referral)}
                        className="py-2 px-1 bg-white text-blue-600 border border-slate-200 rounded-xl text-[10px] font-semibold hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 shadow-sm hover:shadow transition-all flex flex-col items-center justify-center"
                      >
                        <MessageSquare className="h-3 w-3 mb-0.5" />
                        Remark
                      </button>
                      <button
                        onClick={(e) => handleStatusChange(e, referral.id, 'Completed')}
                        disabled={referral.status === 'Completed'}
                        className={`py-2 px-1 rounded-xl text-[10px] font-semibold transition-all ${
                          referral.status === 'Completed'
                            ? 'bg-blue-100 text-blue-400 cursor-not-allowed border border-blue-100'
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 shadow-sm hover:shadow'
                        }`}
                      >
                        Complete
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(referral.id);
                        }}
                        className="py-2 px-1 bg-white text-slate-500 border border-slate-200 rounded-xl text-[10px] font-semibold hover:border-rose-300 hover:text-rose-500 hover:bg-rose-50 shadow-sm hover:shadow transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <div className="w-16 h-16 bg-gradient-to-br from-rose-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="h-8 w-8 text-rose-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Delete Referral?</h3>
            <p className="text-slate-500 text-center text-sm mb-8">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-semibold text-slate-600 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl hover:shadow-lg hover:shadow-rose-200 transition-all font-semibold text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remark Modal */}
      {showRemarkModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Add Remark</h3>
            <p className="text-slate-500 text-center text-sm mb-8">
              Add a private remark for <span className="font-semibold text-slate-700">{showRemarkModal.patient_name}</span>
            </p>
            
            <div className="mb-8">
              <textarea
                value={remarkText}
                onChange={(e) => setRemarkText(e.target.value)}
                placeholder="Enter your remark here..."
                rows={4}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none transition-all resize-none text-sm text-slate-700"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRemarkModal(null);
                  setRemarkText('');
                }}
                disabled={remarkLoading}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-semibold text-slate-600 text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRemark}
                disabled={remarkLoading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {remarkLoading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Remark'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralsPage;
