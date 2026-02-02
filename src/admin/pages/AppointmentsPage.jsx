import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, User, Phone, Mail, MapPin, Clock, Users, Search, 
  Filter, Plus, Edit2, Trash2, CheckCircle2, XCircle, RotateCcw, 
  Eye, Save, X, ArrowLeft, ChevronLeft, Stethoscope, FileText, 
  ChevronRight, BadgeCheck, AlertTriangle, RefreshCw, Loader, MessageSquare
} from 'lucide-react';
import { 
  getAllAppointmentsAdmin, 
  updateAppointment, 
  deleteAppointment 
} from '../services/adminApi';
import AppointmentDetailPage from './AppointmentDetailPage';
import Pagination from '../components/Pagination';

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailPage, setShowDetailPage] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(null);
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '', remark: '' });
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  // Remark Modal State
  const [showRemarkModal, setShowRemarkModal] = useState(null);
  const [remarkText, setRemarkText] = useState('');
  const [remarkLoading, setRemarkLoading] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadAppointments();
  }, []);

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

  const statusCounts = useMemo(() => {
    return {
      all: appointments.length,
      pending: appointments.filter(a => a.status?.toLowerCase() === 'pending').length,
      confirmed: appointments.filter(a => a.status?.toLowerCase() === 'confirmed').length,
      completed: appointments.filter(a => a.status?.toLowerCase() === 'completed').length,
      rescheduled: appointments.filter(a => a.status?.toLowerCase() === 'rescheduled').length,
    };
  }, [appointments]);

  const handleStatusChange = async (e, appointmentId, newStatus) => {
    e.stopPropagation();
    
    // If accepting (Confirmed), open remark modal instead of direct confirmation
    if (newStatus === 'Confirmed') {
      const appointment = appointments.find(app => app.id === appointmentId);
      if (appointment) {
        setRemarkText(appointment.remark || '');
        setShowRemarkModal({ ...appointment, action: 'accept' });
      }
      return;
    }
    
    // Handle other status changes
    try {
      await updateAppointment(appointmentId, { status: newStatus });
      setAppointments(prev => prev.map(app => 
        app.id === appointmentId ? { ...app, status: newStatus } : app
      ));
      
      // Show success toast
      setSuccessMessage(`Appointment ${newStatus.toLowerCase()} successfully!`);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (err) {
      console.error('Error updating appointment status:', err);
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleDelete = async (appointmentId) => {
    try {
      await deleteAppointment(appointmentId);
      setAppointments(prev => prev.filter(app => app.id !== appointmentId));
      setShowDeleteConfirm(null);
      
      // Show success toast
      setSuccessMessage('Appointment deleted successfully!');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (err) {
      console.error('Error deleting appointment:', err);
      alert('Failed to delete appointment: ' + err.message);
    }
  };

  const openRescheduleModal = (e, appointment) => {
    e.stopPropagation();
    const currentDate = appointment.appointment_date ? new Date(appointment.appointment_date) : new Date();
    setRescheduleData({
      date: currentDate.toISOString().split('T')[0],
      time: currentDate.toTimeString().slice(0, 5),
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
      const newDateTime = new Date(`${rescheduleData.date}T${rescheduleData.time}`);
      const updateData = { 
        appointment_date: newDateTime.toISOString(),
        status: 'Rescheduled'
      };
      
      // Add remark if provided
      if (rescheduleData.remark.trim()) {
        updateData.remark = rescheduleData.remark.trim();
      }
      
      await updateAppointment(showRescheduleModal.id, updateData);
      setAppointments(prev => prev.map(app => 
        app.id === showRescheduleModal.id 
          ? { 
              ...app, 
              appointment_date: newDateTime.toISOString(), 
              status: 'Rescheduled',
              remark: rescheduleData.remark.trim() || app.remark
            } 
          : app
      ));
      setShowRescheduleModal(null);
      setRescheduleData({ date: '', time: '', remark: '' });
      
      // Show success toast
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
      
      // If this is for accepting an appointment
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
        // Regular remark update
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

  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', icon: Clock };
      case 'confirmed':
        return { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', icon: CheckCircle2 };
      case 'completed':
        return { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500', icon: BadgeCheck };
      case 'rescheduled':
        return { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500', icon: RotateCcw };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500', icon: Clock };
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

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
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
    <div className="flex-1 pb-10 overflow-y-auto bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="px-6 py-5 bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
            <p className="text-sm text-gray-500 mt-1">Manage all appointment requests</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full font-medium text-sm">
              {filteredAppointments.length} Total
            </span>
            <button
              onClick={loadAppointments}
              className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {[{
              key: 'all', label: 'All Appointments', count: statusCounts.all, gradient: 'from-indigo-500 to-purple-600', icon: Users },
              { key: 'pending', label: 'Pending', count: statusCounts.pending, gradient: 'from-amber-400 to-orange-500', icon: Clock },
              { key: 'confirmed', label: 'Confirmed', count: statusCounts.confirmed, gradient: 'from-emerald-400 to-green-600', icon: CheckCircle2 },
              { key: 'completed', label: 'Completed', count: statusCounts.completed, gradient: 'from-blue-400 to-cyan-600', icon: BadgeCheck },
              { key: 'rescheduled', label: 'Rescheduled', count: statusCounts.rescheduled, gradient: 'from-purple-400 to-violet-600', icon: RotateCcw },
            ].map(stat => (
            <button
              key={stat.key}
              onClick={() => setFilterStatus(stat.key)}
              className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all ${
                filterStatus === stat.key
                  ? 'border-indigo-500 bg-white shadow-lg scale-105'
                  : 'border-transparent bg-white hover:bg-white hover:shadow-md'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-3 shadow-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-6 py-2">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone, doctor, membership..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 my-4 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Appointments Grid */}
      <div className="px-6 py-4">
        {paginatedAppointments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No appointments found</h3>
            <p className="text-gray-500">
              {searchQuery || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter.' 
                : 'No appointments have been created yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedAppointments.map((appointment) => {
              const statusConfig = getStatusConfig(appointment.status);
              
                return (
                    <div 
                      key={appointment.id} 
                      className="bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:border-indigo-200 transition-all group relative flex flex-col"
                    >
                      {/* Premium Header Line with Remove Button */}
                      <div className="flex items-center justify-between px-5 py-3 bg-gray-50/50 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${statusConfig.dot} animate-pulse shadow-sm`}></div>
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${statusConfig.text}`}>
                            {appointment.status || 'Pending'}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(appointment.id);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Remove Appointment"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Card Body - Click to view details */}
                      <div 
                        onClick={() => openDetailPage(appointment)}
                        className="p-5 cursor-pointer flex-1"
                      >
                        {/* Patient Info */}
                        <div className="flex items-start gap-4 mb-5">
                          <div className="relative">
                            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-105 transition-transform duration-300">
                              {appointment.patient_name?.charAt(0)?.toUpperCase() || 'P'}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-lg shadow-sm flex items-center justify-center border border-gray-100">
                              <User className="h-3 w-3 text-indigo-600" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-extrabold text-gray-900 text-lg leading-tight group-hover:text-indigo-600 transition-colors truncate">
                                {appointment.patient_name || 'Unknown'}
                              </h3>
                              {(appointment.booking_for || appointment.booking_type) && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100">
                                  {(appointment.booking_for || appointment.booking_type) === 'self' ? 'SELF' : 'FAMILY'}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col gap-1 mt-1">
                              <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5 text-indigo-400" />
                                {appointment.patient_phone || 'N/A'}
                              </p>
                              {appointment.membership_number && (
                                <p className="text-[11px] text-indigo-500 font-bold tracking-tight">
                                  #{appointment.membership_number}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-5">
                          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 hover:border-indigo-100 hover:bg-white transition-all">
                            <div className="flex items-center gap-2 mb-1">
                              <Stethoscope className="h-3.5 w-3.5 text-indigo-500" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Doctor</span>
                            </div>
                            <p className="text-xs font-bold text-slate-700 truncate">{appointment.doctor_name || 'Not Assigned'}</p>
                          </div>
                          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 hover:border-purple-100 hover:bg-white transition-all">
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="h-3.5 w-3.5 text-purple-500" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Type</span>
                            </div>
                            <p className="text-xs font-bold text-slate-700 truncate">{appointment.appointment_type || 'General'}</p>
                          </div>
                        </div>

                        {/* Schedule Badge */}
                        <div className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 mb-2">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-xl shadow-sm">
                              <Calendar className="h-4 w-4 text-indigo-600" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">Scheduled For</p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-extrabold text-indigo-900">{formatDate(appointment.appointment_date)}</span>
                                <span className="w-1 h-1 rounded-full bg-indigo-300"></span>
                                <span className="text-xs font-bold text-indigo-600">{formatTime(appointment.appointment_date)}</span>
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-indigo-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="p-4 bg-gray-50/50 border-t border-gray-100">
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={(e) => handleStatusChange(e, appointment.id, 'Confirmed')}
                            disabled={appointment.status === 'Confirmed' || appointment.status === 'Completed'}
                            className={`flex flex-col items-center justify-center gap-1 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-tighter transition-all shadow-sm border ${
                              appointment.status === 'Confirmed' || appointment.status === 'Completed'
                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 hover:shadow-emerald-200/50'
                            }`}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Accept
                          </button>
                          <button
                            onClick={(e) => openRescheduleModal(e, appointment)}
                            disabled={appointment.status === 'Completed'}
                            className={`flex flex-col items-center justify-center gap-1 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-tighter transition-all shadow-sm border ${
                              appointment.status === 'Completed'
                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                                : 'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-600 hover:text-white hover:border-purple-600 hover:shadow-purple-200/50'
                            }`}
                          >
                            <RotateCcw className="h-4 w-4" />
                            Reschedule
                          </button>
                          <button
                            onClick={(e) => handleStatusChange(e, appointment.id, 'Completed')}
                            disabled={appointment.status === 'Completed'}
                            className={`flex flex-col items-center justify-center gap-1 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-tighter transition-all shadow-sm border ${
                              appointment.status === 'Completed'
                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                                : 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:shadow-blue-200/50'
                            }`}
                          >
                            <BadgeCheck className="h-4 w-4" />
                            Complete
                          </button>
                        </div>
                      </div>
                    </div>
                );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
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
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
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
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <RotateCcw className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Reschedule Appointment</h3>
            <p className="text-gray-500 text-center mb-6">
              Select new date and time for <span className="font-semibold text-gray-700">{showRescheduleModal.patient_name}</span>
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
                  setShowRescheduleModal(null);
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
                ? `Accept appointment for ${showRemarkModal.patient_name} and add a remark` 
                : `Add a private remark for ${showRemarkModal.patient_name}`}
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
                  setShowRemarkModal(null);
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

export default AppointmentsPage;
