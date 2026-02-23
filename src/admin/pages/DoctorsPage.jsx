import React, { useState, useEffect, useMemo } from 'react';
import { Stethoscope, Search, Plus, Edit2, Trash2, X, Save, Loader, ChevronLeft, Clock, Calendar, User, Phone, Award, Building2, ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';
import Pagination from '../components/Pagination';
import { uploadImage } from '../../services/galleryApi';
import supabase from '../../services/supabaseClient';
import DayWiseOPDScheduler from '../components/DayWiseOPDScheduler';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_FULL = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' };

function fmt12(time24) {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

const DaySelector = ({ label, value, onChange }) => {
  const selected = value ? value.split(',').map(d => d.trim()).filter(Boolean) : [];

  const toggle = (day) => {
    let next;
    if (selected.includes(day)) {
      next = selected.filter(d => d !== day);
    } else {
      next = [...selected, day];
    }
    onChange(next.join(', '));
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {DAYS.map(day => {
          const active = selected.includes(day);
          return (
            <button
              key={day}
              type="button"
              title={DAY_FULL[day]}
              onClick={() => toggle(day)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150 select-none
                ${active
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                  : 'bg-white border-gray-300 text-gray-600 hover:border-indigo-400 hover:text-indigo-600'
                }`}
            >
              {day}
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <p className="text-xs text-indigo-600 mt-1.5 font-medium">
          Selected: {selected.map(d => DAY_FULL[d] || d).join(', ')}
        </p>
      )}
    </div>
  );
};

const DoctorsPage = ({ onNavigate }) => {
  const [doctors, setDoctors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [slotError, setSlotError] = useState('');

  // Departments for dropdown + add-new
  const [departments, setDepartments] = useState([]);
  const [deptQuery, setDeptQuery] = useState('');
  const [showDeptList, setShowDeptList] = useState(false);

  // Hospital dropdown states
  const [hospitals, setHospitals] = useState([]);
  const [hospitalQuery, setHospitalQuery] = useState('');
  const [showHospitalList, setShowHospitalList] = useState(false);

  // Slot states – arrays of { start, end, label }
  const [generalSchedule, setGeneralSchedule] = useState([]);
  const [privateSchedule, setPrivateSchedule] = useState([]);

  // Availability/Leave management states
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [selectedDoctorForAvailability, setSelectedDoctorForAvailability] = useState(null);
  const [availabilityData, setAvailabilityData] = useState({
    is_available: true,
    unavailability_reason: '',
    leave_start_date: '',
    leave_end_date: ''
  });
  const [availabilitySaving, setAvailabilitySaving] = useState(false);

  const itemsPerPage = 20;

  useEffect(() => {
    loadData();
  }, []);

  // ensure page is at top on mount and when the add/edit detail form opens
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    if (showAddForm || editingItem) {
      // jump immediately to top (no smooth animation)
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [showAddForm, editingItem]);

  // populate departments from loaded doctors
  useEffect(() => {
    const depts = Array.from(new Set((doctors || []).map(d => d.department).filter(Boolean)));
    setDepartments(depts);
  }, [doctors]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [doctorsRes, hospitalsRes] = await Promise.all([
        supabase.from('opd_schedule').select('*').order('consultant_name', { ascending: true }),
        supabase.from('hospitals').select('id, hospital_name, address, city, state, pincode').eq('is_active', true).order('hospital_name', { ascending: true }).limit(1000)
      ]);
      if (doctorsRes.error) throw doctorsRes.error;
      setDoctors(doctorsRes.data || []);
      if (!hospitalsRes.error) setHospitals(hospitalsRes.data || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) return doctors;
    return doctors.filter(item => {
      try {
        return Object.values(item).some(value =>
          value && value.toString().toLowerCase().includes(q)
        );
      } catch { return false; }
    });
  }, [searchQuery, doctors]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const resetForm = () => {
    setShowAddForm(false);
    setEditingItem(null);
    setFormData({});
    setGeneralSchedule([]);
    setPrivateSchedule([]);
    setSlotError('');
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({ is_available_for_opd: true });
    setGeneralSchedule([]);
    setPrivateSchedule([]);
    setSlotError('');
    setDeptQuery('');
    setShowDeptList(false);
    setHospitalQuery('');
    setShowHospitalList(false);
    setShowAddForm(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({ ...item, is_available_for_opd: item.is_available_for_opd === undefined ? true : item.is_available_for_opd });
    setDeptQuery(item.department || '');
    setHospitalQuery(item.hospital_name || '');
    setShowHospitalList(false);
    // Pre-fill hospital_address from hospitals list if available
    const matchedHospital = hospitals.find(h => h.hospital_name === item.hospital_name);
    if (matchedHospital) {
      const addr = [matchedHospital.address, matchedHospital.city, matchedHospital.state, matchedHospital.pincode].filter(Boolean).join(', ');
      setFormData(prev => ({ ...prev, hospital_address: addr }));
    }
    // Restore saved schedules (new format: array of {day, start, end, slotDuration, slots})
    const gs = Array.isArray(item.general_opd_schedule) ? item.general_opd_schedule
      : (item.general_opd_schedule ? JSON.parse(item.general_opd_schedule) : []);
    const ps = Array.isArray(item.private_opd_schedule) ? item.private_opd_schedule
      : (item.private_opd_schedule ? JSON.parse(item.private_opd_schedule) : []);
    setGeneralSchedule(gs);
    setPrivateSchedule(ps);
    setSlotError('');
    setShowAddForm(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Are you sure you want to delete this doctor?')) return;
    try {
      const id = item.id;
      const { error: err } = await supabase.from('opd_schedule').delete().eq('id', id);
      if (err) throw err;
      setDoctors(doctors.filter(d => d.id !== id));
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const handleOpenAvailability = (item) => {
    setSelectedDoctorForAvailability(item);
    setAvailabilityData({
      is_available: item.is_available !== false,
      unavailability_reason: item.unavailability_reason || '',
      leave_start_date: item.leave_start_date || '',
      leave_end_date: item.leave_end_date || ''
    });
    setShowAvailabilityModal(true);
  };

  const handleSaveAvailability = async () => {
    if (!selectedDoctorForAvailability) return;

    // Validation
    if (!availabilityData.is_available) {
      if (!availabilityData.leave_start_date) {
        alert('Please select leave start date');
        return;
      }
      if (!availabilityData.leave_end_date) {
        alert('Please select leave end date');
        return;
      }
      if (new Date(availabilityData.leave_start_date) > new Date(availabilityData.leave_end_date)) {
        alert('Leave end date must be after or same as start date');
        return;
      }
    }

    try {
      setAvailabilitySaving(true);
      const updateData = {
        is_available: availabilityData.is_available,
        unavailability_reason: availabilityData.unavailability_reason || null,
        leave_start_date: availabilityData.is_available ? null : availabilityData.leave_start_date,
        leave_end_date: availabilityData.is_available ? null : availabilityData.leave_end_date,
        updated_at: new Date().toISOString()
      };

      const { error: err } = await supabase
        .from('opd_schedule')
        .update(updateData)
        .eq('id', selectedDoctorForAvailability.id);

      if (err) throw err;

      // Update local state
      setDoctors(doctors.map(d =>
        d.id === selectedDoctorForAvailability.id
          ? { ...d, ...updateData }
          : d
      ));

      setShowAvailabilityModal(false);
      setSelectedDoctorForAvailability(null);
      alert('Availability updated successfully');
    } catch (err) {
      alert(`Failed to update availability: ${err.message}`);
    } finally {
      setAvailabilitySaving(false);
    }
  };

  const handleSave = async () => {
    if (!formData.consultant_name?.trim()) {
      alert('Consultant name is required.');
      return;
    }

    setSlotError('');

    try {
      setLoading(true);
      const id = editingItem?.id;

      const payload = {
        ...formData,
        general_opd_schedule: generalSchedule,
        private_opd_schedule: privateSchedule,
      };
      // Remove id from payload
      delete payload.id;
      delete payload.doctor_id;
      delete payload['S. No.'];
      // Remove old format fields
      delete payload.general_opd_slots;
      delete payload.private_opd_slots;
      delete payload.general_opd_start;
      delete payload.general_opd_end;
      delete payload.private_opd_start;
      delete payload.private_opd_end;
      delete payload.general_slot_duration_minutes;
      delete payload.private_slot_duration_minutes;

      // Supabase PGRST204-safe save: strip unknown columns on error and retry
      const saveWithRetry = async (tableFn) => {
        let data = { ...payload };
        for (let attempt = 0; attempt < 8; attempt++) {
          const result = await tableFn(data);
          if (!result.error) return result;
          const { error } = result;
          if (error.code === 'PGRST204' && error.message) {
            const m = error.message.match(/Could not find the '(.+?)' column/i);
            if (m && m[1] && Object.prototype.hasOwnProperty.call(data, m[1])) {
              delete data[m[1]];
              continue;
            }
          }
          return result;
        }
        return { data: null, error: new Error('Max retries exceeded') };
      };

      if (id) {
        const result = await saveWithRetry(d =>
          supabase.from('opd_schedule').update(d).eq('id', id).select().single()
        );
        if (result.error) throw result.error;
        setDoctors(doctors.map(d => d.id === id ? { ...d, ...payload, id } : d));
      } else {
        const result = await saveWithRetry(d =>
          supabase.from('opd_schedule').insert([d]).select().single()
        );
        if (result.error) throw result.error;
        setDoctors([...doctors, result.data]);
      }

      resetForm();
      alert(editingItem ? 'Doctor updated successfully!' : 'Doctor added successfully!');
    } catch (err) {
      console.error('Error saving doctor:', err);
      alert(`Failed to save: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-800 placeholder-gray-400 transition-all outline-none";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";

  const SectionTitle = ({ icon: Icon, title, color = 'indigo' }) => (
    <div className={`flex items-center gap-2 mb-4 pb-2 border-b border-gray-100`}>
      <div className={`p-1.5 rounded-lg bg-${color}-50`}>
        <Icon className={`h-4 w-4 text-${color}-600`} />
      </div>
      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{title}</h3>
    </div>
  );

  const renderForm = () => {
    return (
      <div className="px-4 sm:px-6 mt-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3"></div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {editingItem ? 'Edit Doctor' : 'Add New Doctor'}
              </h2>
              <p className="text-indigo-200 text-xs">Fill in the doctor's information below</p>
            </div>
            <button
              onClick={resetForm}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>

          <div className="p-6 space-y-7">

            {/* — Basic Info — */}
            <div>
              <SectionTitle icon={User} title="Basic Information" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className={labelClass}>Consultant Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="Dr. Full Name"
                    value={formData.consultant_name || ''}
                    onChange={(e) => setFormData({ ...formData, consultant_name: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Department</label>
                  <div className="relative">
                    <input
                      placeholder="e.g. Cardiology"
                      value={deptQuery}
                      onChange={(e) => {
                        const q = e.target.value;
                        setDeptQuery(q);
                        setFormData({ ...formData, department: q });
                        setShowDeptList(true);
                      }}
                      onFocus={() => setShowDeptList(true)}
                      onBlur={() => setTimeout(() => setShowDeptList(false), 150)}
                      className={inputClass}
                    />
                    {showDeptList && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-sm max-h-44 overflow-auto">
                        {(departments.filter(d => d.toLowerCase().includes((deptQuery || '').toLowerCase())).length === 0) ? (
                          <div className="px-3 py-2 text-sm text-gray-500">No matches</div>
                        ) : (
                          departments.filter(d => d.toLowerCase().includes((deptQuery || '').toLowerCase())).map(d => (
                            <div key={d} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50">
                              <div className="flex-1 cursor-pointer" onMouseDown={() => { setDeptQuery(d); setFormData({ ...formData, department: d }); setShowDeptList(false); }}>{d}</div>
                              <button
                                type="button"
                                title="Delete department"
                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); if (!window.confirm(`Delete department "${d}"?`)) return; setDepartments(departments.filter(x => x !== d)); if (formData.department === d) setFormData({ ...formData, department: '' }); if (deptQuery === d) setDeptQuery(''); }}
                                className="ml-2 text-red-500 hover:text-red-700 px-2 py-0.5 rounded"
                              >
                                ×
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                    <div className="mt-2 flex gap-2">
                      <button type="button" onClick={() => {
                        const v = (deptQuery || '').trim();
                        if (!v) { alert('Enter a department name'); return; }
                        if (!departments.includes(v)) {
                          setDepartments([v, ...departments]);
                          alert('New department added');
                        }
                        setFormData({ ...formData, department: v });
                        setDeptQuery(v);
                        setShowDeptList(false);
                      }} className="px-3 py-2 bg-gray-100 rounded-lg">Add</button>
                    </div>
                  </div>
                  {/* Current departments (chips) with delete option */}

                </div>
                <div>
                  <label className={labelClass}>Designation</label>
                  <input type="text" placeholder="e.g. Senior Consultant" value={formData.designation || ''} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} className={inputClass} />
                </div>
                {/* <div className="md:col-span-2">
                  <label className={labelClass}>Available for OPD</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input type="radio" name="is_available_for_opd" checked={!!formData.is_available_for_opd} onChange={() => setFormData({ ...formData, is_available_for_opd: true })} />
                      <span className="text-sm">Yes</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="is_available_for_opd" checked={!formData.is_available_for_opd} onChange={() => setFormData({ ...formData, is_available_for_opd: false })} />
                      <span className="text-sm">No</span>
                    </label>
                  </div>
                </div> */}
                <div>
                  <label className={labelClass}>Qualification</label>
                  <input type="text" placeholder="e.g. MBBS, MD" value={formData.qualification || ''} onChange={(e) => setFormData({ ...formData, qualification: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Experience (Years)</label>
                  <input type="number" placeholder="e.g. 10" value={formData.experience_years || ''} onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })} className={inputClass} />
                </div>
              </div>
            </div>

            {/* — Hospital & Contact — */}
            <div>
              <SectionTitle icon={Building2} title="Hospital & Contact" color="emerald" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Hospital Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search hospital..."
                      value={hospitalQuery}
                      onChange={(e) => {
                        const q = e.target.value;
                        setHospitalQuery(q);
                        setFormData({ ...formData, hospital_name: q });
                        setShowHospitalList(true);
                      }}
                      onFocus={() => setShowHospitalList(true)}
                      onBlur={() => setTimeout(() => setShowHospitalList(false), 180)}
                      className={inputClass}
                    />
                    {showHospitalList && (
                      <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-auto">
                        {hospitals
                          .filter(h =>
                            !hospitalQuery ||
                            h.hospital_name.toLowerCase().includes(hospitalQuery.toLowerCase()) ||
                            (h.address && h.address.toLowerCase().includes(hospitalQuery.toLowerCase())) ||
                            (h.city && h.city.toLowerCase().includes(hospitalQuery.toLowerCase()))
                          )
                          .length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500">No hospitals found</div>
                        ) : (
                          hospitals
                            .filter(h =>
                              !hospitalQuery ||
                              h.hospital_name.toLowerCase().includes(hospitalQuery.toLowerCase()) ||
                              (h.address && h.address.toLowerCase().includes(hospitalQuery.toLowerCase())) ||
                              (h.city && h.city.toLowerCase().includes(hospitalQuery.toLowerCase()))
                            )
                            .map(h => {
                              const addressLine = [h.address, h.city, h.state].filter(Boolean).join(', ');
                              return (
                                <div
                                  key={h.id}
                                  onMouseDown={() => {
                                    const addressLine = [h.address, h.city, h.state, h.pincode].filter(Boolean).join(', ');
                                    setHospitalQuery(h.hospital_name);
                                    setFormData({ ...formData, hospital_name: h.hospital_name, hospital_address: addressLine });
                                    setShowHospitalList(false);
                                  }}
                                  className="px-3 py-2.5 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-0"
                                >
                                  <p className="text-sm font-semibold text-gray-800">{h.hospital_name}</p>
                                  {addressLine && <p className="text-xs text-gray-500 mt-0.5">{addressLine}</p>}
                                </div>
                              );
                            })
                        )}
                      </div>
                    )}
                  </div>
                  {formData.hospital_address && (
                    <div className="mt-1.5 flex items-start gap-1.5 px-2 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg">
                      <svg className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      <p className="text-xs text-emerald-700 font-medium leading-relaxed">{formData.hospital_address}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Unit</label>
                  <input type="text" placeholder="Unit name" value={formData.unit || ''} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Mobile</label>
                  <input type="text" placeholder="Contact number" value={formData.mobile || ''} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Consultation Fee (₹)</label>
                  <input type="number" placeholder="0" step="1" min="0" value={formData.consultation_fee || ''} onChange={(e) => setFormData({ ...formData, consultation_fee: e.target.value })} className={inputClass} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Unit Notes</label>
                  <textarea
                    placeholder="Any additional unit notes..."
                    value={formData.unit_notes || ''}
                    onChange={(e) => setFormData({ ...formData, unit_notes: e.target.value })}
                    className={`${inputClass} resize-none`}
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Overlap Error Banner */}
            {slotError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700 font-medium">{slotError}</p>
              </div>
            )}

            <div className="mb-4">
              <label className={labelClass}>Available for OPD</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input type="radio" name="is_available_for_opd" checked={!!formData.is_available_for_opd} onChange={() => setFormData({ ...formData, is_available_for_opd: true })} />
                  <span className="text-sm">Yes</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="is_available_for_opd" checked={!formData.is_available_for_opd} onChange={() => setFormData({ ...formData, is_available_for_opd: false })} />
                  <span className="text-sm">No</span>
                </label>
              </div>
            </div>

            {formData.is_available_for_opd && (
              <>
                {/* — General OPD — */}
                <div>
                  <SectionTitle icon={Calendar} title="General OPD Schedule" color="blue" />
                  <DayWiseOPDScheduler
                    type="general"
                    label="General OPD Days & Times"
                    schedule={generalSchedule}
                    onChange={setGeneralSchedule}
                    color="blue"
                    conflictingSchedule={privateSchedule}
                  />
                </div>

                {/* — Private OPD — */}
                <div>
                  <SectionTitle icon={Calendar} title="Private OPD Schedule" color="purple" />
                  <DayWiseOPDScheduler
                    type="private"
                    label="Private OPD Days & Times"
                    schedule={privateSchedule}
                    onChange={setPrivateSchedule}
                    color="purple"
                    conflictingSchedule={generalSchedule}
                  />
                </div>
              </>
            )}

            {/* — Doctor Image — */}
            <div>
              <SectionTitle icon={ImageIcon} title="Doctor Photo" color="rose" />
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <label className="block w-full cursor-pointer">
                    <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${uploadingImage ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30'}`}>
                      {uploadingImage ? (
                        <div className="flex items-center justify-center gap-2 text-indigo-600">
                          <Loader className="h-5 w-5 animate-spin" />
                          <span className="text-sm font-medium">Uploading...</span>
                        </div>
                      ) : (
                        <>
                          <ImageIcon className="h-8 w-8 text-gray-300 mx-auto mb-1" />
                          <p className="text-sm text-gray-500">Click to upload photo</p>
                          <p className="text-xs text-gray-400 mt-0.5">PNG, JPG up to 5MB</p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files && e.target.files[0];
                        if (!file) return;
                        try {
                          setUploadingImage(true);
                          const res = await uploadImage(file, null, 'doctor-images');
                          if (res?.data?.url) {
                            setFormData({ ...formData, doctor_image_url: res.data.url });
                          } else if (res?.data?.publicUrl) {
                            setFormData({ ...formData, doctor_image_url: res.data.publicUrl });
                          }
                        } catch (err) {
                          alert('Image upload failed: ' + (err.message || err));
                        } finally {
                          setUploadingImage(false);
                        }
                      }}
                    />
                  </label>
                </div>
                {formData.doctor_image_url && (
                  <div className="relative flex-shrink-0">
                    <img src={formData.doctor_image_url} alt="doctor" className="h-20 w-20 rounded-xl object-cover border-2 border-indigo-100 shadow-sm" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, doctor_image_url: '' })}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
            <button
              onClick={handleSave}
              disabled={loading || !!slotError}
              className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              {loading ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {loading ? 'Saving...' : editingItem ? 'Update Doctor' : 'Add Doctor'}
            </button>
            <button
              onClick={resetForm}
              className="px-5 py-2.5 border border-gray-300 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDoctorCard = (item) => {
    const displayName = item.consultant_name || item.Name || 'N/A';
    const id = item.id;
    const isOnLeave = item.is_available === false;

    return (
      <div key={id} className={`bg-white rounded-2xl shadow-sm border transition-all hover:shadow-md ${isOnLeave ? 'border-amber-200' : 'border-gray-100'}`}>
        {/* Leave banner */}
        {isOnLeave && (
          <div className="bg-amber-50 border-b border-amber-200 rounded-t-2xl px-4 py-2 flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
            <span className="text-xs font-semibold text-amber-700">
              On Holiday
              {item.leave_start_date && item.leave_end_date
                ? `: ${new Date(item.leave_start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} → ${new Date(item.leave_end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`
                : ''
              }
            </span>
            {item.unavailability_reason && (
              <span className="text-xs text-amber-500 ml-1">({item.unavailability_reason})</span>
            )}
          </div>
        )}

        <div className="p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <h3 className="font-bold text-gray-800 text-base">{displayName}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isOnLeave ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                  }`}>
                  {isOnLeave ? 'On Leave' : 'Available'}
                </span>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                {item.department && (
                  <p><span className="font-medium">Dept:</span> {item.department}</p>
                )}
                {item.designation && (
                  <p><span className="font-medium">Designation:</span> {item.designation}</p>
                )}
                {item.qualification && (
                  <p><span className="font-medium">Qualification:</span> {item.qualification}</p>
                )}
                {item.unit && (
                  <p><span className="font-medium">Unit:</span> {item.unit}</p>
                )}
                {item.mobile && (
                  <p><Phone className="inline h-3.5 w-3.5 mr-1 text-gray-400" />{item.mobile}</p>
                )}
              </div>
            </div>
            {/* move avatar to the right side container and make it larger */}
            {item.doctor_image_url ? (
              <img
                src={item.doctor_image_url}
                alt={displayName}
                className="h-32 w-32 rounded-2xl object-contain bg-white border-2 border-indigo-100 shadow-sm flex-shrink-0 ml-3 p-1"
              />
            ) : (
              <div className="h-32 w-32 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 flex-shrink-0 ml-3">
                <Stethoscope className="h-8 w-8 text-gray-300" />
              </div>
            )}
          </div>

          {/* OPD Schedule Info */}
          {(item.general_opd_schedule || item.private_opd_schedule) && (
            <div className="mb-3 space-y-1.5">
              {item.general_opd_schedule && Array.isArray(item.general_opd_schedule) && item.general_opd_schedule.length > 0 && (
                <div className="bg-blue-50 rounded-lg px-2.5 py-1.5 flex items-start gap-2">
                  <Clock className="h-3.5 w-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="text-xs text-blue-700 font-semibold">General OPD</span>
                    <div className="flex flex-col gap-1 mt-0.5">
                      {item.general_opd_schedule.map((day, idx) => (
                        <span key={idx} className="text-xs text-blue-600">
                          <span className="font-medium">{day.day}:</span> {day.start && day.end ? `${fmt12(day.start)}–${fmt12(day.end)}` : 'Not set'}
                          {day.slots && day.slots.length > 0 && <span className="ml-1 bg-blue-100 text-blue-600 px-1.5 rounded-full text-xs">({day.slots.length})</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {item.private_opd_schedule && Array.isArray(item.private_opd_schedule) && item.private_opd_schedule.length > 0 && (
                <div className="bg-purple-50 rounded-lg px-2.5 py-1.5 flex items-start gap-2">
                  <Clock className="h-3.5 w-3.5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="text-xs text-purple-700 font-semibold">Private OPD</span>
                    <div className="flex flex-col gap-1 mt-0.5">
                      {item.private_opd_schedule.map((day, idx) => (
                        <span key={idx} className="text-xs text-purple-600">
                          <span className="font-medium">{day.day}:</span> {day.start && day.end ? `${fmt12(day.start)}–${fmt12(day.end)}` : 'Not set'}
                          {day.slots && day.slots.length > 0 && <span className="ml-1 bg-purple-100 text-purple-600 px-1.5 rounded-full text-xs">({day.slots.length})</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Availability detail box */}
          {isOnLeave && (
            <div className="rounded-xl border bg-amber-50 border-amber-200 px-3 py-2 mb-3 flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-amber-700">Holiday: </span>
                {item.leave_start_date && item.leave_end_date ? (
                  <span className="text-xs text-amber-600">
                    {new Date(item.leave_start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    {' → '}
                    {new Date(item.leave_end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    <span className="ml-1 text-amber-400">
                      ({Math.ceil((new Date(item.leave_end_date) - new Date(item.leave_start_date)) / (1000 * 60 * 60 * 24)) + 1}d)
                    </span>
                  </span>
                ) : (
                  <span className="text-xs text-amber-500">Dates not set</span>
                )}
                {item.unavailability_reason && (
                  <span className="text-xs text-amber-400 ml-1">· {item.unavailability_reason}</span>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-3 border-t border-gray-100">
            <button
              onClick={() => handleEdit(item)}
              className="flex-1 bg-indigo-50 text-indigo-600 px-3 py-2 rounded-lg font-medium hover:bg-indigo-100 flex items-center justify-center gap-1.5 text-sm transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              onClick={() => handleOpenAvailability(item)}
              className={`flex-1 px-3 py-2 rounded-lg font-medium flex items-center justify-center gap-1.5 text-sm transition-colors ${isOnLeave
                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                : 'bg-green-50 text-green-700 hover:bg-green-100'
                }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              {isOnLeave ? 'Set Holiday' : 'Availability'}
            </button>
            <button
              onClick={() => handleDelete(item)}
              className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded-lg font-medium hover:bg-red-100 flex items-center justify-center gap-1.5 text-sm transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAvailabilityModal = () => {
    if (!showAvailabilityModal || !selectedDoctorForAvailability) return null;

    const doc = selectedDoctorForAvailability;
    const today = new Date().toISOString().split('T')[0];

    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Doctor Availability</h3>
                <p className="text-indigo-200 text-xs">Set holiday / leave period</p>
              </div>
            </div>
            <button
              onClick={() => setShowAvailabilityModal(false)}
              className="bg-white/20 hover:bg-white/30 p-1.5 rounded-lg transition-colors"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-5">

            {/* Doctor Info Card */}
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-3">
              {doc.doctor_image_url ? (
                <img src={doc.doctor_image_url} alt={doc.consultant_name} className="h-12 w-12 rounded-xl object-cover border-2 border-indigo-100" />
              ) : (
                <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-indigo-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-sm truncate">{doc.consultant_name}</p>
                {doc.department && <p className="text-xs text-gray-500 truncate">{doc.department}</p>}
                {doc.designation && <p className="text-xs text-gray-400 truncate">{doc.designation}</p>}
              </div>
              <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${doc.is_available !== false ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                {doc.is_available !== false ? 'Available' : 'On Leave'}
              </span>
            </div>

            {/* Current Leave Info (if any) */}
            {doc.leave_start_date && doc.leave_end_date && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm">
                <p className="text-blue-700 font-semibold text-xs mb-1.5">Current Saved Leave Period:</p>
                <div className="flex items-center gap-2 text-blue-600 font-medium">
                  <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>
                    {new Date(doc.leave_start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {' '}&rarr;{' '}
                    {new Date(doc.leave_end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                {doc.unavailability_reason && (
                  <p className="text-blue-500 text-xs mt-1">Reason: {doc.unavailability_reason}</p>
                )}
              </div>
            )}

            {/* Status Toggle */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2.5">Availability Status</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAvailabilityData({ ...availabilityData, is_available: true, leave_start_date: '', leave_end_date: '', unavailability_reason: '' })}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${availabilityData.is_available
                    ? 'border-green-500 bg-green-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                >
                  <div className={`p-2 rounded-full ${availabilityData.is_available ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <CheckCircle className={`h-5 w-5 ${availabilityData.is_available ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-bold ${availabilityData.is_available ? 'text-green-700' : 'text-gray-500'}`}>Available</p>
                    <p className="text-xs text-gray-400 mt-0.5">Doctor available</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAvailabilityData({ ...availabilityData, is_available: false })}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${!availabilityData.is_available
                    ? 'border-amber-500 bg-amber-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                >
                  <div className={`p-2 rounded-full ${!availabilityData.is_available ? 'bg-amber-100' : 'bg-gray-100'}`}>
                    <Calendar className={`h-5 w-5 ${!availabilityData.is_available ? 'text-amber-600' : 'text-gray-400'}`} />
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-bold ${!availabilityData.is_available ? 'text-amber-700' : 'text-gray-500'}`}>On Holiday</p>
                    <p className="text-xs text-gray-400 mt-0.5">Set leave period</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Leave/Holiday Details */}
            {!availabilityData.is_available && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-amber-600" />
                  <p className="text-sm font-bold text-amber-800">Holiday / Leave Period</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      From Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      min={today}
                      value={availabilityData.leave_start_date}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAvailabilityData({
                          ...availabilityData,
                          leave_start_date: val,
                          // auto-reset end date if it's before new start
                          leave_end_date: availabilityData.leave_end_date && availabilityData.leave_end_date < val ? '' : availabilityData.leave_end_date
                        });
                      }}
                      className="w-full px-3 py-2.5 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      To Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      min={availabilityData.leave_start_date || today}
                      value={availabilityData.leave_end_date}
                      onChange={(e) => setAvailabilityData({ ...availabilityData, leave_end_date: e.target.value })}
                      className="w-full px-3 py-2.5 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-sm bg-white"
                    />
                  </div>
                </div>

                {/* Duration display */}
                {availabilityData.leave_start_date && availabilityData.leave_end_date && availabilityData.leave_start_date <= availabilityData.leave_end_date && (
                  <div className="bg-amber-100 rounded-lg px-3 py-2 flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                    <span className="text-xs font-medium text-amber-800">
                      {Math.ceil((new Date(availabilityData.leave_end_date) - new Date(availabilityData.leave_start_date)) / (1000 * 60 * 60 * 24)) + 1} day(s) leave:
                      {' '}{new Date(availabilityData.leave_start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      {' '}&rarr;{' '}
                      {new Date(availabilityData.leave_end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Reason (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Annual Holiday, Medical Leave, Conference..."
                    value={availabilityData.unavailability_reason}
                    onChange={(e) => setAvailabilityData({ ...availabilityData, unavailability_reason: e.target.value })}
                    className="w-full px-3 py-2.5 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-sm bg-white"
                  />
                </div>
              </div>
            )}

            {availabilityData.is_available && doc.is_available === false && (
              <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2.5">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-green-700 font-medium">Doctor will be marked as available. Any existing leave record will be cleared.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-5 py-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
            <button
              onClick={() => setShowAvailabilityModal(false)}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAvailability}
              disabled={availabilitySaving}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors text-sm shadow-sm"
            >
              {availabilitySaving ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Availability
                </>
              )}
            </button>
          </div>
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
                  resetForm();
                } else {
                  onNavigate('main');
                }
              }}
              className="bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-gray-200"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Doctors</h2>
              <p className="text-gray-500 text-sm">Manage doctors</p>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 mt-6 flex items-center gap-3">
          <div className="flex items-center flex-1 gap-2 bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 shadow-sm hover:border-indigo-300 hover:shadow-md focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200 transition-all duration-150">
            <Search className="h-5 w-5 text-indigo-500 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search doctors by name, department, designation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 placeholder-gray-400 text-sm outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={handleAdd}
            className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 active:bg-indigo-800 flex items-center gap-2 text-sm shadow-sm transition-all duration-150 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            Add Doctor
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
              paginatedData.map(item => renderDoctorCard(item))
            ) : !loading ? (
              <div className="text-center py-16">
                <div className="bg-gray-50 h-14 w-14 rounded-full flex items-center justify-center mx-auto mb-3 border border-dashed border-gray-300">
                  <Search className="h-6 w-6 text-gray-300" />
                </div>
                <h3 className="text-gray-800 font-semibold text-sm">No doctors found</h3>
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

        {/* Availability Modal */}
        {renderAvailabilityModal()}
      </div>
    </div>
  );
};

export default DoctorsPage;