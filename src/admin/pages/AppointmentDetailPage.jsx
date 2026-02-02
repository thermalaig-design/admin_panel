import React, { useState } from 'react';
import { 
  X, Trash2, Loader, ArrowLeft, CheckCircle2, 
  AlertTriangle, Clock, User, Phone, Calendar, Stethoscope, 
  FileText, BadgeCheck, Mail, MapPin, RotateCcw, MessageSquare
} from 'lucide-react';
import { 
  updateAppointment,
  deleteAppointment
} from '../services/adminApi';

const AppointmentDetailPage = ({ appointment, onBack, onRefresh }) => {
  const [currentApp, setCurrentApp] = useState(appointment);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Remark Modal State
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [remarkText, setRemarkText] = useState('');
  const [remarkLoading, setRemarkLoading] = useState(false);
  
  // Reschedule Modal State
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '', remark: '' });
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  const getStatusConfig = (status) => {
    if (!status) return { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' };
    
    switch (status.toLowerCase()) {
      case 'pending':
        return { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500', icon: Clock };
      case 'confirmed':
        return { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500', icon: CheckCircle2 };
      case 'cancelled':
        return { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500', icon: X };
      case 'completed':
        return { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500', icon: BadgeCheck };
      case 'rescheduled':
        return { bg: 'bg-purple-50', text: 'text-purple-600', dot: 'bg-purple-500', icon: RotateCcw };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500', icon: Clock };
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
      await updateAppointment(currentApp.id, { status: newStatus });
      setCurrentApp(prev => ({ ...prev, status: newStatus }));
      
      // Show success toast
      setSuccessMessage(`Appointment ${newStatus.toLowerCase()} successfully!`);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error updating appointment status:', error);
      alert(`Failed to update appointment status: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAppointment(currentApp.id);
      if (onRefresh) onRefresh();
      onBack();
      
      // Show success toast
      setSuccessMessage('Appointment deleted successfully!');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert(`Failed to delete appointment: ${error.message}`);
    }
  };

  // Handle Accept (Confirm)
  const handleAccept = async () => {
    // Open remark modal instead of direct confirmation
    setRemarkText(currentApp.remark || '');
    setShowRemarkModal({ ...currentApp, action: 'accept' });
  };

  // Open Remark Modal
  const openRemarkModal = () => {
    setRemarkText(currentApp.remark || '');
    setShowRemarkModal(true);
  };

  // Save Remark
  const handleSaveRemark = async () => {
    try {
      setRemarkLoading(true);
      
      // If this is for accepting an appointment
      if (showRemarkModal.action === 'accept') {
        await updateAppointment(currentApp.id, { 
          status: 'Confirmed', 
          remark: remarkText 
        });
        setCurrentApp(prev => ({ ...prev, status: 'Confirmed', remark: remarkText }));
        setSuccessMessage('Appointment accepted with remark!');
      } else {
        // Regular remark update
        await updateAppointment(currentApp.id, { remark: remarkText });
        setCurrentApp(prev => ({ ...prev, remark: remarkText }));
        setSuccessMessage('Remark saved successfully!');
      }
      
      setShowRemarkModal(false);
      setRemarkText('');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error saving remark:', error);
      alert(`Failed to save remark: ${error.message}`);
    } finally {
      setRemarkLoading(false);
    }
  };

  // Open Reschedule Modal
  const openRescheduleModal = () => {
    const currentDate = currentApp.appointment_date ? new Date(currentApp.appointment_date) : new Date();
    setRescheduleData({
      date: currentDate.toISOString().split('T')[0],
      time: currentDate.toTimeString().slice(0, 5),
      remark: currentApp.remark || ''
    });
    setShowRescheduleModal(true);
  };

  // Handle Reschedule
  const handleReschedule = async () => {
    if (!rescheduleData.date || !rescheduleData.time) {
      alert('Please select both date and time');
      return;
    }
    
    try {
      setRescheduleLoading(true);
      const newDateTime = new Date(`${rescheduleData.date}T${rescheduleData.time}`);
      const updateData = { 
        appointment_date: newDateTime.toISOString(),
        status: 'Rescheduled'
      };
      
      // Add remark if provided
      if (rescheduleData.remark.trim()) {
        updateData.remark = rescheduleData.remark.trim();
      }
      
      await updateAppointment(currentApp.id, updateData);
      setCurrentApp(prev => ({ 
        ...prev, 
        appointment_date: newDateTime.toISOString(), 
        status: 'Rescheduled',
        remark: rescheduleData.remark.trim() || prev.remark
      }));
      setShowRescheduleModal(false);
      setRescheduleData({ date: '', time: '', remark: '' });
      
      setSuccessMessage('Appointment rescheduled successfully!');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      alert(`Failed to reschedule appointment: ${error.message}`);
    } finally {
      setRescheduleLoading(false);
    }
  };

  const statusConfig = getStatusConfig(currentApp.status);

  return (
    <div className="flex-1 pb-10 overflow-y-auto bg-slate-50 min-h-screen">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back to Appointments</span>
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-red-200"
            title="Delete"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Patient Card */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden sticky top-24">
              {/* Orange Top Border */}
              <div className="h-1.5 bg-gradient-to-r from-orange-400 to-amber-500"></div>
              
              {/* Patient Avatar & Info */}
              <div className="p-6 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <User className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{currentApp.patient_name || 'Unknown'}</h2>
                <p className="text-gray-500 text-sm mt-1">Case #{currentApp.id?.toString().slice(-3) || 'N/A'}</p>
                
                {/* Status Badge */}
                <div className="mt-4">
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${statusConfig.bg} ${statusConfig.text} border border-current/20`}>
                    <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`}></span>
                    {currentApp.status || 'Pending'}
                  </span>
                </div>
              </div>


            </div>

            {/* Action Buttons Section */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mt-6">
              <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-indigo-50/50 border-b border-gray-100">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                  ACTIONS
                </h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-3 gap-3">
                  {/* Accept Button */}
                  <button
                    onClick={handleAccept}
                    disabled={currentApp.status === 'Confirmed' || currentApp.status === 'Completed' || updating}
                    className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl text-xs font-medium transition-all border ${
                      currentApp.status === 'Confirmed' || currentApp.status === 'Completed'
                        ? 'bg-emerald-50 text-emerald-400 border-emerald-200 cursor-not-allowed'
                        : 'bg-white text-emerald-600 border-emerald-200 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    <CheckCircle2 className="h-5 w-5 mb-1" />
                    ACCEPT
                  </button>
                  
                  {/* Reschedule Button */}
                  <button
                    onClick={openRescheduleModal}
                    disabled={currentApp.status === 'Completed' || updating}
                    className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl text-xs font-medium transition-all border ${
                      currentApp.status === 'Completed'
                        ? 'bg-purple-50 text-purple-400 border-purple-200 cursor-not-allowed'
                        : 'bg-white text-purple-600 border-purple-200 hover:border-purple-300 hover:text-purple-700 hover:bg-purple-50'
                    }`}
                  >
                    <RotateCcw className="h-5 w-5 mb-1" />
                    RESCHEDULE
                  </button>
                  
                  {/* Complete Button */}
                  <button
                    onClick={() => handleStatusChange('Completed')}
                    disabled={currentApp.status === 'Completed' || updating}
                    className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl text-xs font-medium transition-all border ${
                      currentApp.status === 'Completed'
                        ? 'bg-blue-50 text-blue-400 border-blue-200 cursor-not-allowed'
                        : 'bg-white text-blue-600 border-blue-200 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50'
                    }`}
                  >
                    <BadgeCheck className="h-5 w-5 mb-1" />
                    COMPLETE
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Details */}
          <div className="flex-1 space-y-6">
            {/* Patient Information Card */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50/50 border-b border-gray-100">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  PATIENT INFORMATION
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Full Name</p>
                      <p className="text-gray-900 font-semibold mt-1">{currentApp.patient_name || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Phone Number</p>
                      <p className="text-gray-900 font-semibold mt-1">{currentApp.patient_phone || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Age</p>
                      <p className="text-gray-900 font-semibold mt-1">{currentApp.patient_age ? `${currentApp.patient_age} years` : 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Gender</p>
                      <p className="text-gray-900 font-semibold mt-1">{currentApp.patient_gender || 'N/A'}</p>
                    </div>
                  </div>
                  {(currentApp.booking_for || currentApp.booking_type) && (
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                        <BadgeCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Booking Type</p>
                        <p className="text-gray-900 font-semibold mt-1">
                          {(currentApp.booking_for || currentApp.booking_type) === 'self' ? 'Self Booking' : 'Family Member Booking'}
                        </p>
                      </div>
                    </div>
                  )}
                  {currentApp.patient_relationship && (
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Relationship</p>
                        <p className="text-gray-900 font-semibold mt-1">{currentApp.patient_relationship}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-4 md:col-span-2">
                    <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Address</p>
                      <p className="text-gray-900 font-semibold mt-1">{currentApp.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Appointment Details Card */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-cyan-50/50 border-b border-gray-100">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-cyan-600" />
                  APPOINTMENT DETAILS
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-cyan-50 rounded-xl text-cyan-600">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Doctor</p>
                      <p className="text-gray-900 font-semibold mt-1">{currentApp.doctor_name || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-cyan-50 rounded-xl text-cyan-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Department</p>
                      <p className="text-gray-900 font-semibold mt-1">{currentApp.department || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-cyan-50 rounded-xl text-cyan-600">
                      <BadgeCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</p>
                      <p className="text-gray-900 font-semibold mt-1">{currentApp.appointment_type || 'General Consultation'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-cyan-50 rounded-xl text-cyan-600">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Date & Time</p>
                      <p className="text-gray-900 font-semibold mt-1">{formatFullDate(currentApp.appointment_date)}</p>
                    </div>
                  </div>
                  {currentApp.membership_number && (
                    <div className="flex items-start gap-4 md:col-span-2">
                      <div className="p-2.5 bg-cyan-50 rounded-xl text-cyan-600">
                        <BadgeCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Membership Number</p>
                        <p className="text-blue-600 font-bold mt-1">{currentApp.membership_number}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Referral Source Card */}
            {currentApp.referred_by && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-purple-50/50 border-b border-gray-100">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <User className="h-5 w-5 text-purple-600" />
                    REFERRAL SOURCE
                  </h3>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                      {currentApp.referred_by?.charAt(0)?.toUpperCase() || 'R'}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Referred By</p>
                      <p className="text-gray-900 font-bold text-lg mt-0.5">{currentApp.referred_by}</p>
                      {currentApp.referrer_phone && (
                        <p className="text-gray-500 text-sm">{currentApp.referrer_phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Reason & Medical History Card */}
            {(currentApp.reason || currentApp.medical_history) && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-amber-50/50 border-b border-gray-100">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-amber-600" />
                    REASON & MEDICAL HISTORY
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  {currentApp.reason && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Reason for Appointment</p>
                      <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">{currentApp.reason}</p>
                    </div>
                  )}
                  {currentApp.medical_history && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Medical History</p>
                      <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">{currentApp.medical_history}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete Appointment?</h3>
            <p className="text-gray-500 text-center mb-6">
              This action cannot be undone. The appointment will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
            </div>
          </div>
        )}
        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete Appointment?</h3>
              <p className="text-gray-500 text-center mb-6">
                This action cannot be undone. The appointment will be permanently removed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Remark Modal */}
        {showRemarkModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                {showRemarkModal.action === 'accept' ? 'Accept Appointment with Remark' : 'Add Remark'}
              </h3>
              <p className="text-gray-500 text-center mb-6">
                {showRemarkModal.action === 'accept' 
                  ? `Accept appointment for ${currentApp.patient_name} and add a remark` 
                  : `Add a private remark for ${currentApp.patient_name}`}
              </p>
              
              <div className="mb-6">
                <textarea
                  value={remarkText}
                  onChange={(e) => setRemarkText(e.target.value)}
                  placeholder="Enter your remark here..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRemarkModal(false);
                    setRemarkText('');
                  }}
                  disabled={remarkLoading}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRemark}
                  disabled={remarkLoading}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
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

        {/* Reschedule Modal */}
        {showRescheduleModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <RotateCcw className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Reschedule Appointment</h3>
              <p className="text-gray-500 text-center mb-6">
                Select new date and time for <span className="font-semibold text-gray-700">{currentApp.patient_name}</span>
              </p>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Date</label>
                  <input
                    type="date"
                    value={rescheduleData.date}
                    onChange={(e) => setRescheduleData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Time</label>
                  <input
                    type="time"
                    value={rescheduleData.time}
                    onChange={(e) => setRescheduleData(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Remark (Optional)</label>
                  <textarea
                    value={rescheduleData.remark}
                    onChange={(e) => setRescheduleData(prev => ({ ...prev, remark: e.target.value }))}
                    placeholder="Add a remark for this rescheduling..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRescheduleModal(false);
                    setRescheduleData({ date: '', time: '' });
                  }}
                  disabled={rescheduleLoading}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReschedule}
                  disabled={rescheduleLoading}
                  className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {rescheduleLoading ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Reschedule'
                  )}
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

export default AppointmentDetailPage;
