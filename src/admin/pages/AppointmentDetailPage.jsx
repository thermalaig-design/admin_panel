import React, { useState } from 'react';
import {
  X, ArrowLeft, Trash2, Calendar, Clock, Phone, User,
  Stethoscope, FileText, MessageSquare, CheckCircle2, RotateCcw,
  BadgeCheck, AlertTriangle, Loader, MapPin, Mail, Award
} from 'lucide-react';
import { updateAppointment, deleteAppointment } from '../services/adminApi';

const STATUS_CONFIG = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  completed: { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  rescheduled: { bg: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' }
};

const AppointmentDetailPage = ({ appointment, onBack, onRefresh }) => {
  const [currentApp, setCurrentApp] = useState(appointment);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [remarkText, setRemarkText] = useState('');
  const [remarkLoading, setRemarkLoading] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '', remark: '' });
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  const getStatusConfig = (status) => {
    return STATUS_CONFIG[status?.toLowerCase()] || STATUS_CONFIG.pending;
  };

  const parseDateTime = (dateStr, timeStr) => {
    if (!dateStr) return null;
    if (timeStr) return new Date(`${dateStr}T${timeStr}`);
    if (dateStr.includes('T')) return new Date(dateStr);
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const formatDate = (app) => {
    const dateObj = parseDateTime(app.appointment_date, app.appointment_time);
    if (!dateObj) return 'N/A';
    return dateObj.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (app) => {
    if (!app.appointment_time) return '';
    const dateObj = parseDateTime(app.appointment_date, app.appointment_time);
    if (!dateObj) return '';
    return dateObj.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStatusChange = async (newStatus) => {
    if (newStatus === 'Confirmed') {
      setRemarkText(currentApp.remark || '');
      setShowRemarkModal({ ...currentApp, action: 'accept' });
      return;
    }

    setUpdating(true);
    try {
      await updateAppointment(currentApp.id, { status: newStatus });
      setCurrentApp(prev => ({ ...prev, status: newStatus }));
      setSuccessMessage(`Appointment ${newStatus.toLowerCase()} successfully!`);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      if (onRefresh) onRefresh();
    } catch (error) {
      alert(`Failed to update: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAppointment(currentApp.id);
      setSuccessMessage('Appointment deleted successfully!');
      setShowSuccessToast(true);
      setTimeout(() => {
        if (onRefresh) onRefresh();
        onBack();
      }, 500);
    } catch (error) {
      alert(`Failed to delete: ${error.message}`);
    }
  };

  const handleSaveRemark = async () => {
    try {
      setRemarkLoading(true);
      const action = showRemarkModal.action;

      const updateData = action === 'accept'
        ? { status: 'Confirmed', remark: remarkText }
        : { remark: remarkText };

      await updateAppointment(currentApp.id, updateData);

      setCurrentApp(prev => ({
        ...prev,
        ...(action === 'accept' && { status: 'Confirmed' }),
        remark: remarkText
      }));

      setSuccessMessage(action === 'accept'
        ? 'Appointment accepted with remark!'
        : 'Remark saved successfully!'
      );
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      setShowRemarkModal(false);
      setRemarkText('');
      if (onRefresh) onRefresh();
    } catch (error) {
      alert(`Failed to save remark: ${error.message}`);
    } finally {
      setRemarkLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleData.date || !rescheduleData.time) {
      alert('Please select both date and time');
      return;
    }

    try {
      setRescheduleLoading(true);
      const updateData = {
        appointment_date: rescheduleData.date,
        appointment_time: rescheduleData.time,
        status: 'Rescheduled'
      };

      if (rescheduleData.remark.trim()) {
        updateData.remark = rescheduleData.remark.trim();
      }

      await updateAppointment(currentApp.id, updateData);

      setCurrentApp(prev => ({
        ...prev,
        appointment_date: rescheduleData.date,
        appointment_time: rescheduleData.time,
        status: 'Rescheduled',
        remark: rescheduleData.remark.trim() || prev.remark
      }));

      setSuccessMessage('Appointment rescheduled successfully!');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      setShowRescheduleModal(false);
      setRescheduleData({ date: '', time: '', remark: '' });
      if (onRefresh) onRefresh();
    } catch (error) {
      alert(`Failed to reschedule: ${error.message}`);
    } finally {
      setRescheduleLoading(false);
    }
  };

  const statusConfig = getStatusConfig(currentApp.status);

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to <span className="hidden sm:inline">Appointments</span>
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar */}
          <div className="space-y-6">
            {/* Patient Card */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                  <span className="text-2xl font-bold text-white">
                    {currentApp.patient_name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-gray-900">{currentApp.patient_name}</h2>
                <p className="text-sm text-gray-500 mt-1">ID: {currentApp.id}</p>

                <div className="mt-4">
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold ${statusConfig.badge}`}>
                    <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`}></span>
                    {currentApp.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800 text-sm">Quick Actions</h3>
              </div>
              <div className="p-4 space-y-2">
                <button
                  onClick={() => handleStatusChange('Confirmed')}
                  disabled={currentApp.status === 'Completed'}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${currentApp.status === 'Completed'
                      ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Accept Appointment
                </button>
                <button
                  onClick={() => setShowRescheduleModal(true)}
                  disabled={currentApp.status === 'Completed'}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${currentApp.status === 'Completed'
                      ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                    }`}
                >
                  <RotateCcw className="h-4 w-4" />
                  Reschedule
                </button>
                <button
                  onClick={() => setShowRemarkModal({ ...currentApp, action: 'remark' })}
                  className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all"
                >
                  <MessageSquare className="h-4 w-4" />
                  Add Remark
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Appointment Details */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                  Appointment Details
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex gap-4">
                    <div className="p-2.5 bg-blue-50 rounded-lg h-fit">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Appointment Date</p>
                      <p className="text-gray-900 font-semibold mt-1">{formatDate(currentApp)}</p>
                      {formatTime(currentApp) && (
                        <p className="text-sm text-gray-600 mt-1">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {formatTime(currentApp)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="p-2.5 bg-purple-50 rounded-lg h-fit">
                      <Stethoscope className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Doctor</p>
                      <p className="text-gray-900 font-semibold mt-1">{currentApp.doctor_name || 'Not assigned'}</p>
                      {currentApp.department && (
                        <p className="text-sm text-gray-600 mt-1">{currentApp.department}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="p-2.5 bg-amber-50 rounded-lg h-fit">
                      <FileText className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Appointment Type</p>
                      <p className="text-gray-900 font-semibold mt-1">{currentApp.appointment_type || 'General Consultation'}</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="p-2.5 bg-green-50 rounded-lg h-fit">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Status</p>
                      <p className="text-gray-900 font-semibold mt-1">{currentApp.status}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Patient Information */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Patient Information
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex gap-4">
                    <div className="p-2.5 bg-blue-50 rounded-lg h-fit">
                      <Phone className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Phone</p>
                      <p className="text-gray-900 font-semibold mt-1">{currentApp.patient_phone || 'N/A'}</p>
                    </div>
                  </div>

                  {currentApp.patient_email && (
                    <div className="flex gap-4">
                      <div className="p-2.5 bg-indigo-50 rounded-lg h-fit">
                        <Mail className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Email</p>
                        <p className="text-gray-900 font-semibold mt-1">{currentApp.patient_email}</p>
                      </div>
                    </div>
                  )}

                  {currentApp.patient_age && (
                    <div className="flex gap-4">
                      <div className="p-2.5 bg-pink-50 rounded-lg h-fit">
                        <User className="h-5 w-5 text-pink-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Age</p>
                        <p className="text-gray-900 font-semibold mt-1">{currentApp.patient_age} years</p>
                      </div>
                    </div>
                  )}

                  {currentApp.patient_gender && (
                    <div className="flex gap-4">
                      <div className="p-2.5 bg-purple-50 rounded-lg h-fit">
                        <User className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Gender</p>
                        <p className="text-gray-900 font-semibold mt-1">{currentApp.patient_gender}</p>
                      </div>
                    </div>
                  )}

                  {currentApp.membership_number && (
                    <div className="flex gap-4">
                      <div className="p-2.5 bg-yellow-50 rounded-lg h-fit">
                        <Award className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Membership</p>
                        <p className="text-gray-900 font-semibold mt-1">{currentApp.membership_number}</p>
                      </div>
                    </div>
                  )}

                  {currentApp.address && (
                    <div className="flex gap-4 sm:col-span-2">
                      <div className="p-2.5 bg-red-50 rounded-lg h-fit">
                        <MapPin className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Address</p>
                        <p className="text-gray-900 font-semibold mt-1">{currentApp.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Reason & Medical History */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800">Medical Information</h3>
              </div>
              <div className="p-6 space-y-6">
                {currentApp.reason && (
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-2">Reason for Visit</p>
                    <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{currentApp.reason}</p>
                  </div>
                )}
                {currentApp.medical_history && (
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-2">Medical History</p>
                    <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{currentApp.medical_history}</p>
                  </div>
                )}
                {currentApp.remark && (
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-2">Remark</p>
                    <p className="text-gray-800 bg-blue-50 p-3 rounded-lg border border-blue-200">{currentApp.remark}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete Appointment?</h3>
            <p className="text-gray-600 text-center text-sm mb-6">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-4">
              <RotateCcw className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-5">Reschedule</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Date *</label>
                <input
                  type="date"
                  value={rescheduleData.date}
                  onChange={(e) => setRescheduleData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Time *</label>
                <input
                  type="time"
                  value={rescheduleData.time}
                  onChange={(e) => setRescheduleData(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Note (Optional)</label>
                <textarea
                  value={rescheduleData.remark}
                  onChange={(e) => setRescheduleData(prev => ({ ...prev, remark: e.target.value }))}
                  placeholder="Reason for rescheduling..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRescheduleModal(false);
                  setRescheduleData({ date: '', time: '', remark: '' });
                }}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleReschedule}
                disabled={rescheduleLoading}
                className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {rescheduleLoading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Rescheduling...
                  </>
                ) : (
                  'Reschedule'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remark Modal */}
      {showRemarkModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-4">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-5">
              {showRemarkModal.action === 'accept' ? 'Accept Appointment' : 'Add Remark'}
            </h3>

            <div className="mb-6">
              <textarea
                value={remarkText}
                onChange={(e) => setRemarkText(e.target.value)}
                placeholder="Enter your remark..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRemarkModal(false);
                  setRemarkText('');
                }}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRemark}
                disabled={remarkLoading}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {remarkLoading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-[100]">
          <div className="bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5" />
            <p className="font-medium">{successMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentDetailPage;
