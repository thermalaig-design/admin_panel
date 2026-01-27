import React, { useState } from 'react';
import { 
  HeartPulse, X, Trash2, CheckCircle2, 
  AlertTriangle, Clock, User, Phone, Calendar, Stethoscope, 
  FileText, BadgeCheck, IdCard, Mail,
  ArrowLeft, MapPin, Hash, UserCheck
} from 'lucide-react';
import { 
  updateReferral,
  deleteReferral
} from '../services/adminApi';

const ReferralDetailPage = ({ referral, onBack, onRefresh }) => {
  const [currentReferral, setCurrentReferral] = useState(referral);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const getStatusConfig = (status) => {
    if (!status) return { bg: 'bg-gray-100', text: 'text-gray-600', gradient: 'from-gray-500 to-gray-600' };
    
    switch (status.toLowerCase()) {
      case 'pending':
        return { bg: 'bg-amber-100', text: 'text-amber-700', gradient: 'from-amber-500 to-orange-500' };
      case 'approved':
        return { bg: 'bg-emerald-100', text: 'text-emerald-700', gradient: 'from-emerald-500 to-teal-500' };
      case 'rejected':
        return { bg: 'bg-rose-100', text: 'text-rose-700', gradient: 'from-rose-500 to-pink-500' };
      case 'completed':
        return { bg: 'bg-blue-100', text: 'text-blue-700', gradient: 'from-blue-500 to-indigo-500' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-600', gradient: 'from-gray-500 to-gray-600' };
    }
  };

  const formatFullDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      await updateReferral(currentReferral.id, { status: newStatus });
      setCurrentReferral(prev => ({ ...prev, status: newStatus }));
      
      // Show success toast
      setSuccessMessage(`Referral ${newStatus.toLowerCase()} successfully!`);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error updating referral status:', error);
      alert(`Failed to update referral status: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteReferral(currentReferral.id);
      if (onRefresh) onRefresh();
      onBack();
    } catch (error) {
      console.error('Error deleting referral:', error);
      alert(`Failed to delete referral: ${error.message}`);
    }
  };

  const statusConfig = getStatusConfig(currentReferral.status);

  const InfoRow = ({ icon: Icon, label, value, iconColor = "text-slate-400" }) => (
    <div className="flex items-start gap-3 py-3.5 border-b border-slate-100 last:border-0">
      <div className={`mt-0.5 p-2 rounded-lg bg-slate-50 ${iconColor}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">{label}</p>
        <p className="text-sm text-slate-800 font-medium break-words">{value || 'N/A'}</p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 pb-10 overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Navigation Bar */}
        <div className="py-6 flex items-center justify-between">
          <button
            onClick={onBack}
            className="group flex items-center gap-3 text-slate-600 hover:text-indigo-600 transition-all"
          >
            <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-200 group-hover:border-indigo-200 group-hover:shadow-md transition-all">
              <ArrowLeft className="h-5 w-5" />
            </div>
            <span className="font-semibold">Back to Referrals</span>
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2.5 bg-white text-rose-500 hover:bg-rose-50 rounded-xl shadow-sm border border-slate-200 hover:border-rose-200 transition-all"
            title="Delete Referral"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Summary & Status */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Gradient Header */}
              <div className={`h-2 bg-gradient-to-r ${statusConfig.gradient}`}></div>
              
              <div className="p-6 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-indigo-200">
                  <UserCheck className="h-10 w-10" />
                </div>
                <h2 className="text-lg font-bold text-slate-800 truncate">{currentReferral.patient_name}</h2>
                <p className="text-sm text-slate-500 mb-4">Case #{currentReferral.id?.toString().slice(-6)}</p>
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider ${statusConfig.bg} ${statusConfig.text}`}>
                  {currentReferral.status || 'Pending'}
                </span>
              </div>
              
              <div className="p-5 bg-slate-50/80 border-t border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest text-center mb-4">Update Status</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleStatusChange('Approved')}
                    disabled={currentReferral.status === 'Approved' || updating}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl text-[10px] font-bold transition-all ${
                      currentReferral.status === 'Approved'
                        ? 'bg-emerald-100 text-emerald-400 cursor-not-allowed'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 shadow-sm hover:shadow'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    APPROVE
                  </button>
                  <button
                    onClick={() => handleStatusChange('Pending')}
                    disabled={currentReferral.status === 'Pending' || updating}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl text-[10px] font-bold transition-all ${
                      currentReferral.status === 'Pending'
                        ? 'bg-amber-100 text-amber-400 cursor-not-allowed'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50 shadow-sm hover:shadow'
                    }`}
                  >
                    <Clock className="h-4 w-4" />
                    PENDING
                  </button>
                  <button
                    onClick={() => handleStatusChange('Rejected')}
                    disabled={currentReferral.status === 'Rejected' || updating}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl text-[10px] font-bold transition-all ${
                      currentReferral.status === 'Rejected'
                        ? 'bg-rose-100 text-rose-400 cursor-not-allowed'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-rose-300 hover:text-rose-500 hover:bg-rose-50 shadow-sm hover:shadow'
                    }`}
                  >
                    <X className="h-4 w-4" />
                    REJECT
                  </button>
                  <button
                    onClick={() => handleStatusChange('Completed')}
                    disabled={currentReferral.status === 'Completed' || updating}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl text-[10px] font-bold transition-all ${
                      currentReferral.status === 'Completed'
                        ? 'bg-blue-100 text-blue-400 cursor-not-allowed'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 shadow-sm hover:shadow'
                    }`}
                  >
                    <BadgeCheck className="h-4 w-4" />
                    COMPLETE
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Patient Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <User className="h-4 w-4 text-indigo-500" />
                  Patient Information
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                  <InfoRow icon={User} label="Full Name" value={currentReferral.patient_name} iconColor="text-blue-500" />
                  <InfoRow icon={Phone} label="Phone Number" value={currentReferral.patient_phone} iconColor="text-blue-500" />
                  <InfoRow icon={Calendar} label="Age" value={currentReferral.patient_age ? `${currentReferral.patient_age} years` : 'N/A'} iconColor="text-blue-500" />
                  <InfoRow icon={UserCheck} label="Gender" value={currentReferral.patient_gender} iconColor="text-blue-500" />
                  <div className="sm:col-span-2">
                    <InfoRow icon={MapPin} label="Address" value={currentReferral.patient_address} iconColor="text-blue-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Referral Source */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-purple-500" />
                  Referral Source
                </h3>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200">
                    {currentReferral.user_name?.charAt(0)?.toUpperCase() || 'R'}
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">Referred By</p>
                    <p className="text-base font-bold text-slate-800">{currentReferral.user_name || 'Unknown'}</p>
                    <p className="text-xs text-slate-500 font-medium">{currentReferral.user_phone}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                  <InfoRow icon={Hash} label="Membership No." value={currentReferral.membership_number} iconColor="text-indigo-500" />
                  <InfoRow icon={IdCard} label="Membership Type" value={currentReferral.membership_type} iconColor="text-indigo-500" />
                  <InfoRow icon={Mail} label="Referrer Email" value={currentReferral.user_email} iconColor="text-indigo-500" />
                  <InfoRow icon={Calendar} label="Request Date" value={formatFullDate(currentReferral.created_at)} iconColor="text-indigo-500" />
                </div>
              </div>
            </div>

            {/* Medical Context */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-emerald-500" />
                  Medical Assessment
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 mb-6">
                  <InfoRow icon={Stethoscope} label="Assigned Doctor" value={currentReferral.referred_to_doctor} iconColor="text-emerald-500" />
                  <InfoRow icon={HeartPulse} label="Department" value={currentReferral.department} iconColor="text-emerald-500" />
                </div>
                <div className="p-5 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-2xl border border-slate-200">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-3 flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5" />
                    Clinical Condition
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">
                    {currentReferral.medical_condition || 'No clinical notes provided.'}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
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
              This action is permanent and cannot be reversed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-semibold text-slate-600 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl hover:shadow-lg hover:shadow-rose-200 transition-all font-semibold text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500/50">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <p className="font-semibold">{successMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralDetailPage;
