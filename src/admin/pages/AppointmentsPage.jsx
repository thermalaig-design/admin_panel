import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar, Phone, Clock, Users, Search,
  CheckCircle2, XCircle, RotateCcw,
  X, Stethoscope,
  BadgeCheck, RefreshCw, Loader, MessageSquare,
  AlertCircle, Heart
} from 'lucide-react';
import {
  getAllAppointmentsAdmin,
  updateAppointment
} from '../services/adminApi';
import AppointmentDetailPage from './AppointmentDetailPage';
import Pagination from '../components/Pagination';

const STATUS_CONFIG = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', icon: Clock },
  confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', icon: CheckCircle2 },
  completed: { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500', icon: BadgeCheck },
  rescheduled: { bg: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500', icon: RotateCcw },
  cancelled: { bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500', icon: XCircle }
};

const REMARK_TEMPLATES = {
  accept: [
    "Your appointment has been confirmed. Please arrive 15 minutes early.",
    "Appointment confirmed. Please bring previous medical reports.",
    "Confirmed. Doctor may be delayed by 30 minutes, please be patient.",
    "Confirmed. Please bring your membership card for verification.",
    "Appointment confirmed. Please carry your ID proof and insurance documents."
  ],
  reschedule: [
    "Your appointment has been rescheduled due to doctor's unavailability.",
    "Rescheduled to a better time slot. Please check the updated time.",
    "Doctor has requested rescheduling. Sorry for the inconvenience.",
    "Appointment moved to accommodate emergency cases. Thank you for understanding.",
    "Rescheduled as per your request. Please confirm the new timing."
  ],
  reject: [
    "Sorry, the doctor is unavailable on the requested date. Please book another slot.",
    "The requested time slot is fully booked. Please choose a different time.",
    "Doctor is on leave. Please try booking with another doctor or a different date."
  ]
};

const TemplateSelector = ({ templates, value, onChange }) => (
  <div className="space-y-3">
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quick Templates</p>
    <div className="flex flex-col gap-2">
      {templates.map((t, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(t)}
          className={`text-left text-sm px-3 py-2.5 rounded-lg border transition-all ${value === t
            ? 'bg-indigo-50 border-indigo-300 text-indigo-800 ring-1 ring-indigo-200'
            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
            }`}
        >
          {t}
        </button>
      ))}
    </div>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Or type a custom remark..."
      rows={3}
      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
    />
  </div>
);

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailPage, setShowDetailPage] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(null);
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '', remark: '' });
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [showRemarkModal, setShowRemarkModal] = useState(null);
  const [remarkText, setRemarkText] = useState('');
  const [remarkLoading, setRemarkLoading] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectRemark, setRejectRemark] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

  // complete state
  const [completeLoading, setCompleteLoading] = useState(null);

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const response = await getAllAppointmentsAdmin();
      setAppointments(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error loading appointments:', err);
      setError('Failed to load appointments. Please make sure backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = useMemo(() => {
    let filtered = appointments;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app =>
        app.patient_name?.toLowerCase().includes(query) ||
        app.patient_phone?.toLowerCase().includes(query) ||
        app.doctor_name?.toLowerCase().includes(query) ||
        app.department?.toLowerCase().includes(query) ||
        app.membership_number?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(app => app.status?.toLowerCase() === filterStatus.toLowerCase());
    }

    return filtered;
  }, [appointments, searchQuery, filterStatus]);

  const paginatedAppointments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAppointments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAppointments, currentPage]);

  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);

  const stats = useMemo(() => {
    return {
      total: appointments.length,
      pending: appointments.filter(a => a.status?.toLowerCase() === 'pending').length,
      confirmed: appointments.filter(a => a.status?.toLowerCase() === 'confirmed').length,
      completed: appointments.filter(a => a.status?.toLowerCase() === 'completed').length,
      rescheduled: appointments.filter(a => a.status?.toLowerCase() === 'rescheduled').length,
      cancelled: appointments.filter(a => a.status?.toLowerCase() === 'cancelled').length,
    };
  }, [appointments]);

  const parseDateTime = (dateStr, timeStr) => {
    if (!dateStr) return null;
    if (timeStr) {
      return new Date(`${dateStr}T${timeStr}`);
    }
    if (dateStr.includes('T')) {
      return new Date(dateStr);
    }
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const formatDate = (appointment) => {
    const dateObj = parseDateTime(appointment.appointment_date, appointment.appointment_time);
    if (!dateObj) return 'N/A';
    return dateObj.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (appointment) => {
    if (!appointment.appointment_time) return '';
    const dateObj = parseDateTime(appointment.appointment_date, appointment.appointment_time);
    if (!dateObj) return '';
    return dateObj.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusConfig = (status) => {
    const config = STATUS_CONFIG[status?.toLowerCase()];
    return config || STATUS_CONFIG.pending;
  };

  const handleStatusChange = async (e, appointmentId, newStatus) => {
    e.stopPropagation();

    if (newStatus === 'Confirmed') {
      const appointment = appointments.find(app => app.id === appointmentId);
      if (appointment) {
        setRemarkText(appointment.remark || '');
        setShowRemarkModal({ ...appointment, action: 'accept' });
      }
      return;
    }

    try {
      await updateAppointment(appointmentId, { status: newStatus });
      setAppointments(prev => prev.map(app =>
        app.id === appointmentId ? { ...app, status: newStatus } : app
      ));

      setSuccessMessage(`Appointment ${newStatus.toLowerCase()} successfully!`);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (err) {
      console.error('Error updating appointment status:', err);
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleComplete = async (e, appointmentId) => {
    e.stopPropagation();
    try {
      setCompleteLoading(appointmentId);
      await updateAppointment(appointmentId, { status: 'Completed' });
      setAppointments(prev => prev.map(app =>
        app.id === appointmentId ? { ...app, status: 'Completed' } : app
      ));
      setSuccessMessage('Appointment marked as completed!');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (err) {
      alert('Failed to complete: ' + err.message);
    } finally {
      setCompleteLoading(null);
    }
  };

  const openRejectModal = (e, appointment) => {
    e.stopPropagation();
    setRejectRemark('');
    setShowRejectModal(appointment);
  };

  const handleReject = async () => {
    if (!rejectRemark.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    try {
      setRejectLoading(true);
      await updateAppointment(showRejectModal.id, { status: 'Cancelled', remark: rejectRemark });
      setAppointments(prev => prev.map(app =>
        app.id === showRejectModal.id ? { ...app, status: 'Cancelled', remark: rejectRemark } : app
      ));
      setShowRejectModal(null);
      setRejectRemark('');
      setSuccessMessage('Appointment rejected!');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (err) {
      alert('Failed to reject: ' + err.message);
    } finally {
      setRejectLoading(false);
    }
  };

  const openRescheduleModal = (e, appointment) => {
    e.stopPropagation();
    setRescheduleData({
      date: appointment.appointment_date || new Date().toISOString().split('T')[0],
      time: appointment.appointment_time || '',
      remark: appointment.remark || ''
    });
    setShowRescheduleModal(appointment);
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

      await updateAppointment(showRescheduleModal.id, updateData);
      setAppointments(prev => prev.map(app =>
        app.id === showRescheduleModal.id
          ? {
            ...app,
            appointment_date: rescheduleData.date,
            appointment_time: rescheduleData.time,
            status: 'Rescheduled',
            remark: rescheduleData.remark.trim() || app.remark
          }
          : app
      ));
      setShowRescheduleModal(null);
      setRescheduleData({ date: '', time: '', remark: '' });

      setSuccessMessage('Appointment rescheduled successfully!');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (err) {
      console.error('Error rescheduling appointment:', err);
      alert('Failed to reschedule appointment: ' + err.message);
    } finally {
      setRescheduleLoading(false);
    }
  };

  const openRemarkModal = (e, appointment) => {
    e.stopPropagation();
    setRemarkText(appointment.remark || '');
    setShowRemarkModal(appointment);
  };

  const handleSaveRemark = async () => {
    try {
      setRemarkLoading(true);

      if (showRemarkModal.action === 'accept') {
        await updateAppointment(showRemarkModal.id, {
          status: 'Confirmed',
          remark: remarkText
        });
        setAppointments(prev => prev.map(app =>
          app.id === showRemarkModal.id
            ? { ...app, status: 'Confirmed', remark: remarkText }
            : app
        ));
        setSuccessMessage('Appointment accepted with remark!');
      } else {
        await updateAppointment(showRemarkModal.id, { remark: remarkText });
        setAppointments(prev => prev.map(app =>
          app.id === showRemarkModal.id ? { ...app, remark: remarkText } : app
        ));
        setSuccessMessage('Remark saved successfully!');
      }

      setShowRemarkModal(null);
      setRemarkText('');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (err) {
      console.error('Error saving remark:', err);
      alert('Failed to save remark: ' + err.message);
    } finally {
      setRemarkLoading(false);
    }
  };

  const openDetailPage = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailPage(true);
  };

  const closeDetailPage = () => {
    setShowDetailPage(false);
    setSelectedAppointment(null);
  };

  if (showDetailPage && selectedAppointment) {
    return (
      <AppointmentDetailPage
        appointment={selectedAppointment}
        onBack={closeDetailPage}
        onRefresh={loadAppointments}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex-1 pb-10 overflow-y-auto bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader className="h-10 w-10 animate-spin text-indigo-600" />
            <p className="text-gray-500">Loading appointments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 pb-10 overflow-y-auto bg-gradient-to-br from-slate-50 via-gray-50 to-gray-100 min-h-screen">
      {/* Header Section */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-indigo-100 rounded-xl">
                  <Calendar className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
                  <p className="text-sm text-gray-500 mt-0.5">Manage and track all patient appointments</p>
                </div>
              </div>
            </div>
            <button
              onClick={loadAppointments}
              className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors shadow-sm border border-indigo-100"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 py-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
          {[
            { key: 'total', label: 'Total', count: stats.total, icon: Users, color: 'indigo' },
            { key: 'pending', label: 'Pending', count: stats.pending, icon: Clock, color: 'amber' },
            { key: 'confirmed', label: 'Confirmed', count: stats.confirmed, icon: CheckCircle2, color: 'emerald' },
            { key: 'cancelled', label: 'Cancelled', count: stats.cancelled, icon: XCircle, color: 'red' }
          ].map(stat => {
            const colorMap = {
              indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
              amber: 'bg-amber-50 text-amber-600 border-amber-100',
              emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
              blue: 'bg-blue-50 text-blue-600 border-blue-100',
              red: 'bg-red-50 text-red-600 border-red-100'
            };
            return (
              <button
                key={stat.key}
                onClick={() => setFilterStatus(stat.key === 'total' ? 'all' : stat.key)}
                className={`${colorMap[stat.color]} p-4 rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer text-left`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{stat.count}</p>
                    <p className="text-xs text-gray-600 mt-1 font-medium">{stat.label}</p>
                  </div>
                  <stat.icon className="h-8 w-8 opacity-20" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters Section */}

      <div className="px-6 pb-4">
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient name, phone, membership number, doctor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-10 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 text-sm shadow-sm transition-all font-medium placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <div className="flex gap-2 flex-wrap">
              {[
                { key: 'all', label: 'All', icon: Users },
                { key: 'pending', label: 'Pending', icon: Clock },
                { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
                { key: 'rescheduled', label: 'Rescheduled', icon: RotateCcw },
                { key: 'cancelled', label: 'Cancelled', icon: XCircle }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilterStatus(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${filterStatus === tab.key
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                    }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Appointments List */}
      <div className="px-6 pb-6">
        {paginatedAppointments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No appointments found</h3>
            <p className="text-gray-500 text-sm">
              {searchQuery || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No appointments have been created yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedAppointments.map((appointment) => {
              const statusConfig = getStatusConfig(appointment.status);
              const bookingFor = String(appointment.booking_for || '').toLowerCase();
              const relationship = String(appointment.patient_relationship || '').trim();
              const relationshipLower = relationship.toLowerCase();
              const shouldShowFamilyBadge =
                bookingFor === 'family' &&
                relationship.length > 0 &&
                relationshipLower !== 'self';
              return (
                <div
                  key={appointment.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all hover:border-indigo-200 cursor-pointer group"
                  onClick={() => openDetailPage(appointment)}
                >
                  <div className="flex items-start gap-4 p-5">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:scale-110 transition-transform">
                        {appointment.patient_name?.charAt(0)?.toUpperCase() || 'P'}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${statusConfig.bg} rounded-lg shadow-sm flex items-center justify-center border-2 border-white`}>
                        <div className={`w-2 h-2 rounded-full ${statusConfig.dot}`}></div>
                      </div>
                    </div>

                    {/* Patient Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors text-base">
                              {appointment.patient_name || 'Unknown Patient'}
                            </h3>
                            {shouldShowFamilyBadge && (
                              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full font-semibold">
                                <Heart className="h-3 w-3" />Family
                                {relationship ? ` (${relationship})` : ''}
                              </span>
                            )}
                            <span className="inline-flex items-center text-xs px-2.5 py-1 bg-gray-50 text-gray-700 border border-gray-200 rounded-full font-semibold">
                              ID: {appointment.id}
                            </span>
                          </div>

                          {/* Contact & Details */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mt-2">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />
                              <span className="font-medium">{appointment.patient_phone || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Stethoscope className="h-3.5 w-3.5 text-purple-400 flex-shrink-0" />
                              <span className="font-medium truncate">{appointment.doctor_name || 'Not assigned'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Clock className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                              <span className="font-medium">{formatDate(appointment)}{appointment.appointment_time ? ` • ${formatTime(appointment)}` : ''}</span>
                            </div>
                          </div>

                          {/* Additional Info */}
                          {(appointment.membership_number || appointment.patient_age) && (
                            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                              {appointment.membership_number && (
                                <span className="font-medium">Membership: <span className="text-indigo-600 font-bold">{appointment.membership_number}</span></span>
                              )}
                              {appointment.patient_age && (
                                <span className="font-medium">Age: <span className="text-gray-700">{appointment.patient_age} yrs</span></span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Status Badge & Actions */}
                        <div className="flex flex-col items-end gap-3 flex-shrink-0">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tight ${statusConfig.badge}`}>
                            {appointment.status || 'Pending'}
                          </span>

                          {/* Action Buttons — clearly labeled */}
                          <div className="flex flex-wrap gap-1.5 justify-end" onClick={(e) => e.stopPropagation()}>
                            {/* Accept — pending or rescheduled */}
                            {(appointment.status?.toLowerCase() === 'pending' || appointment.status?.toLowerCase() === 'rescheduled') && (
                              <button
                                onClick={(e) => handleStatusChange(e, appointment.id, 'Confirmed')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200 text-sm font-semibold"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                Accept
                              </button>
                            )}
                            {/* Reschedule — not completed/cancelled */}
                            {!['completed', 'cancelled'].includes(appointment.status?.toLowerCase()) && (
                              <button
                                onClick={(e) => openRescheduleModal(e, appointment)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors border border-purple-200 text-sm font-semibold"
                              >
                                <RotateCcw className="h-4 w-4" />
                                Reschedule
                              </button>
                            )}
                            {/* Complete — only confirmed */}
                            {appointment.status?.toLowerCase() === 'confirmed' && (
                              <button
                                onClick={(e) => handleComplete(e, appointment.id)}
                                disabled={completeLoading === appointment.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200 text-sm font-semibold disabled:opacity-50"
                              >
                                <BadgeCheck className="h-4 w-4" />
                                {completeLoading === appointment.id ? 'Saving...' : 'Complete'}
                              </button>
                            )}
                            {/* Reject — pending only */}
                            {appointment.status?.toLowerCase() === 'pending' && (
                              <button
                                onClick={(e) => openRejectModal(e, appointment)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors border border-red-200 text-sm font-semibold"
                              >
                                <XCircle className="h-4 w-4" />
                                Reject
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Remark Preview */}
                  {appointment.remark && (
                    <div className="px-5 py-3 bg-blue-50/50 border-t border-blue-100 text-xs text-blue-700">
                      <div className="flex gap-2 items-start">
                        <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-blue-500" />
                        <p className="line-clamp-1">{appointment.remark}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 pb-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredAppointments.length}
            itemsPerPage={itemsPerPage}
          />
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full sm:max-w-lg shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 px-6 py-4 flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <RotateCcw className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Reschedule Appointment</h3>
                <p className="text-purple-200 text-sm">{showRescheduleModal.patient_name}</p>
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">New Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={rescheduleData.date}
                    onChange={(e) => setRescheduleData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">New Time <span className="text-red-500">*</span></label>
                  <input
                    type="time"
                    value={rescheduleData.time}
                    onChange={(e) => setRescheduleData(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Remark for Patient</label>
                <TemplateSelector
                  templates={REMARK_TEMPLATES.reschedule}
                  value={rescheduleData.remark}
                  onChange={(val) => setRescheduleData(prev => ({ ...prev, remark: val }))}
                />
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => { setShowRescheduleModal(null); setRescheduleData({ date: '', time: '', remark: '' }); }}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 font-semibold text-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReschedule}
                disabled={rescheduleLoading}
                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {rescheduleLoading ? <><Loader className="h-4 w-4 animate-spin" />Rescheduling...</> : <><RotateCcw className="h-4 w-4" />Reschedule</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accept / Remark Modal */}
      {showRemarkModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full sm:max-w-lg shadow-2xl overflow-hidden">
            <div className={`px-6 py-4 flex items-center gap-3 ${showRemarkModal.action === 'accept' ? 'bg-gradient-to-r from-emerald-600 to-emerald-800' : 'bg-gradient-to-r from-indigo-600 to-indigo-800'}`}>
              <div className="p-2 bg-white/20 rounded-lg">
                {showRemarkModal.action === 'accept' ? <CheckCircle2 className="h-5 w-5 text-white" /> : <MessageSquare className="h-5 w-5 text-white" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {showRemarkModal.action === 'accept' ? 'Accept Appointment' : 'Add Remark'}
                </h3>
                <p className="text-white/80 text-sm">{showRemarkModal.patient_name}</p>
              </div>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <TemplateSelector
                templates={REMARK_TEMPLATES.accept}
                value={remarkText}
                onChange={setRemarkText}
              />
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => { setShowRemarkModal(null); setRemarkText(''); }}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 font-semibold text-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRemark}
                disabled={remarkLoading}
                className={`flex-1 px-4 py-3 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${showRemarkModal.action === 'accept' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
              >
                {remarkLoading ? <><Loader className="h-4 w-4 animate-spin" />Saving...</> : showRemarkModal.action === 'accept' ? <><CheckCircle2 className="h-4 w-4" />Accept & Send</> : <><MessageSquare className="h-4 w-4" />Save Remark</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full sm:max-w-lg shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-800 px-6 py-4 flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <XCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Reject Appointment</h3>
                <p className="text-red-200 text-sm">{showRejectModal.patient_name}</p>
              </div>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Reason for Rejection <span className="text-red-500">*</span></label>
              <TemplateSelector
                templates={REMARK_TEMPLATES.reject}
                value={rejectRemark}
                onChange={setRejectRemark}
              />
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => { setShowRejectModal(null); setRejectRemark(''); }}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 font-semibold text-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={rejectLoading}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {rejectLoading ? <><Loader className="h-4 w-4 animate-spin" />Rejecting...</> : <><XCircle className="h-4 w-4" />Reject Appointment</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5" />
            <p className="font-medium">{successMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;
