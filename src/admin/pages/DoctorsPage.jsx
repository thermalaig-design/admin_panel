import React, { useState, useEffect, useMemo } from 'react';
import { Stethoscope, Search, Plus, Edit2, Trash2, X, Save, Loader, ChevronLeft, Clock, Calendar, User, Phone, Award, Building2, ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';
import Pagination from '../components/Pagination';
import { uploadImage } from '../../services/galleryApi';
import supabase from '../../services/supabaseClient';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_FULL = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' };

// Generate time slots between start and end with given duration (minutes)
function generateSlots(start, end, durationMinutes) {
  if (!start || !end || !durationMinutes || durationMinutes <= 0) return [];
  const slots = [];
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let current = sh * 60 + sm;
  const endMin = eh * 60 + em;
  if (current >= endMin) return [];
  while (current + durationMinutes <= endMin) {
    const slotStart = `${String(Math.floor(current / 60)).padStart(2, '0')}:${String(current % 60).padStart(2, '0')}`;
    const slotEndMin = current + durationMinutes;
    const slotEnd = `${String(Math.floor(slotEndMin / 60)).padStart(2, '0')}:${String(slotEndMin % 60).padStart(2, '0')}`;
    slots.push({ start: slotStart, end: slotEnd, label: `${fmt12(slotStart)} – ${fmt12(slotEnd)}` });
    current += durationMinutes;
  }
  return slots;
}

function fmt12(time24) {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

// Check if two slot arrays have any time overlap
function slotsOverlap(slotsA, slotsB) {
  for (const a of slotsA) {
    for (const b of slotsB) {
      const aStart = toMinutes(a.start), aEnd = toMinutes(a.end);
      const bStart = toMinutes(b.start), bEnd = toMinutes(b.end);
      if (aStart < bEnd && aEnd > bStart) return true;
    }
  }
  return false;
}

function toMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// Check if a time range [startA, endA] overlaps with [startB, endB]
function timeRangeOverlaps(startA, endA, startB, endB) {
  if (!startA || !endA || !startB || !endB) return false;
  const sA = toMinutes(startA), eA = toMinutes(endA);
  const sB = toMinutes(startB), eB = toMinutes(endB);
  if (sA >= eA || sB >= eB) return false;
  return sA < eB && eA > sB;
}

// Generate time options across the day at given step (minutes)
function timeOptions(step = 15) {
  const out = [];
  for (let m = 0; m < 24 * 60; m += step) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    out.push(`${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
  }
  return out;
}

// Decide whether an end-time option should be disabled
function endOptionDisabled(type, startVal, optVal, generalStart, generalEnd) {
  if (!startVal || !optVal) return false;
  const s = toMinutes(startVal);
  const o = toMinutes(optVal);
  // end must be strictly after start
  if (o <= s) return true;
  // for private OPD, ensure the resulting range does not overlap general OPD
  if (type === 'private' && generalStart && generalEnd) {
    const gs = toMinutes(generalStart);
    const ge = toMinutes(generalEnd);
    // if private range [s, o) overlaps [gs, ge)
    if (s < ge && o > gs) return true;
  }
  return false;
}

// Add minutes to a HH:MM time string
function addMinutes(time, mins) {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const tot = h * 60 + m + mins;
  const nh = Math.floor((tot + 24 * 60) % (24 * 60) / 60);
  const nm = (tot + 24 * 60) % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

function timeInsideRange(t, start, end) {
  if (!t || !start || !end) return false;
  const tt = toMinutes(t), s = toMinutes(start), e = toMinutes(end);
  return tt >= s && tt < e;
}

// Check if a single time option falls within any general slot
function optionInGeneral(opt, generalSlots) {
  if (!generalSlots || generalSlots.length === 0) return false;
  const ot = toMinutes(opt);
  return generalSlots.some(s => ot >= toMinutes(s.start) && ot < toMinutes(s.end));
}

// Check if a candidate private range [start, end) would overlap any general slot
function rangeOverlapsGeneral(start, end, generalSlots) {
  if (!start || !end) return false;
  if (!generalSlots || generalSlots.length === 0) return false;
  const s = toMinutes(start), e = toMinutes(end);
  if (s >= e) return true;
  return generalSlots.some(gs => (s < toMinutes(gs.end) && e > toMinutes(gs.start)));
}

// Generic: check if an option falls inside any slot list
function optionInSlots(opt, slots) {
  if (!opt || !slots || slots.length === 0) return false;
  const t = toMinutes(opt);
  return slots.some(s => t >= toMinutes(s.start) && t < toMinutes(s.end));
}

// Generic: check if range [start,end) overlaps any slot in list
function rangeOverlapsSlots(start, end, slots) {
  if (!start || !end || !slots || slots.length === 0) return false;
  const s = toMinutes(start), e = toMinutes(end);
  if (s >= e) return true;
  return slots.some(sl => (s < toMinutes(sl.end) && e > toMinutes(sl.start)));
}

// Time options between `from` and `to` (inclusive start, exclusive end)
function timeOptionsRange(from = '09:00', to = '23:45', step = 15) {
  const out = [];
  const startMin = toMinutes(from);
  const endMin = toMinutes(to);
  for (let m = startMin; m <= endMin; m += step) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    out.push(`${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
  }
  return out;
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

// Slot chips display with delete capability
const SlotChips = ({ slots, onDelete, color = 'blue' }) => {
  if (!slots || slots.length === 0) return null;
  const colorMap = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-red-50 hover:border-red-300 hover:text-red-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-red-50 hover:border-red-300 hover:text-red-600',
  };
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {slots.map((slot, i) => (
        <div
          key={i}
          className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${colorMap[color]}`}
        >
          <Clock className="h-3 w-3" />
          <span>{slot.label}</span>
          <button
            type="button"
            onClick={() => onDelete(i)}
            className="ml-0.5 opacity-50 group-hover:opacity-100 transition-opacity"
            title="Remove slot"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
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

  // Slot states – arrays of { start, end, label }
  const [generalSlots, setGeneralSlots] = useState([]);
  const [privateSlots, setPrivateSlots] = useState([]);

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

  // populate departments from loaded doctors
  useEffect(() => {
    const depts = Array.from(new Set((doctors || []).map(d => d.department).filter(Boolean)));
    setDepartments(depts);
  }, [doctors]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('opd_schedule')
        .select('*')
        .order('consultant_name', { ascending: true });
      if (err) throw err;
      setDoctors(data || []);
    } catch (err) {
      console.error('Error loading doctors:', err);
      setError(`Failed to load doctors: ${err.message}`);
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
    setGeneralSlots([]);
    setPrivateSlots([]);
    setSlotError('');
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({ is_available_for_opd: true });
    setGeneralSlots([]);
    setPrivateSlots([]);
    setSlotError('');
    setDeptQuery('');
    setShowDeptList(false);
    setShowAddForm(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({ ...item, is_available_for_opd: item.is_available_for_opd === undefined ? true : item.is_available_for_opd });
    setDeptQuery(item.department || '');
    // Restore saved slots
    const gs = Array.isArray(item.general_opd_slots) ? item.general_opd_slots
      : (item.general_opd_slots ? JSON.parse(item.general_opd_slots) : []);
    const ps = Array.isArray(item.private_opd_slots) ? item.private_opd_slots
      : (item.private_opd_slots ? JSON.parse(item.private_opd_slots) : []);
    setGeneralSlots(gs);
    setPrivateSlots(ps);
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

    // Validate no overlap between general and private slots
    if (generalSlots.length > 0 && privateSlots.length > 0 && slotsOverlap(generalSlots, privateSlots)) {
      setSlotError('General OPD aur Private OPD ke time slots overlap ho rahe hain. Please timing fix karein.');
      return;
    }
    setSlotError('');

    try {
      setLoading(true);
      const id = editingItem?.id;

      const payload = {
        ...formData,
        general_opd_slots: generalSlots,
        private_opd_slots: privateSlots,
        general_slot_duration_minutes: formData.general_slot_duration_minutes ? parseInt(formData.general_slot_duration_minutes) : null,
        private_slot_duration_minutes: formData.private_slot_duration_minutes ? parseInt(formData.private_slot_duration_minutes) : null,
      };
      // Remove id from payload
      delete payload.id;
      delete payload.doctor_id;
      delete payload['S. No.'];

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

  // Generate slots for given OPD type
  const handleGenerateSlots = (type) => {
    const start = type === 'general' ? formData.general_opd_start : formData.private_opd_start;
    const end = type === 'general' ? formData.general_opd_end : formData.private_opd_end;
    const dur = type === 'general'
      ? parseInt(formData.general_slot_duration_minutes || formData.slot_duration_minutes || 0)
      : parseInt(formData.private_slot_duration_minutes || formData.slot_duration_minutes || 0);

    if (!start || !end) { alert('Please select start and end time first.'); return; }
    if (!dur || dur <= 0) { alert('Please enter a valid slot duration (minutes).'); return; }

    const slots = generateSlots(start, end, dur);
    if (slots.length === 0) {
      alert('No slots could be generated. Check that start time is before end time and duration fits.');
      return;
    }

    if (type === 'general') {
      setGeneralSlots(slots);
      // validate overlap immediately
      if (privateSlots.length > 0 && slotsOverlap(slots, privateSlots)) {
        setSlotError('General OPD aur Private OPD ke time slots overlap ho rahe hain. Please timing fix karein.');
      } else {
        setSlotError('');
      }
    } else {
      setPrivateSlots(slots);
      if (generalSlots.length > 0 && slotsOverlap(generalSlots, slots)) {
        setSlotError('General OPD aur Private OPD ke time slots overlap ho rahe hain. Please timing fix karein.');
      } else {
        setSlotError('');
      }
    }
  };

  const deleteGeneralSlot = (idx) => {
    const next = generalSlots.filter((_, i) => i !== idx);
    setGeneralSlots(next);
    if (privateSlots.length > 0 && slotsOverlap(next, privateSlots)) {
      setSlotError('Overlap detected.');
    } else {
      setSlotError('');
    }
  };

  const deletePrivateSlot = (idx) => {
    const next = privateSlots.filter((_, i) => i !== idx);
    setPrivateSlots(next);
    if (generalSlots.length > 0 && slotsOverlap(generalSlots, next)) {
      setSlotError('Overlap detected.');
    } else {
      setSlotError('');
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
                        {(departments.filter(d => d.toLowerCase().includes((deptQuery||'').toLowerCase())).length === 0) ? (
                          <div className="px-3 py-2 text-sm text-gray-500">No matches</div>
                        ) : (
                          departments.filter(d => d.toLowerCase().includes((deptQuery||'').toLowerCase())).map(d => (
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
                  <input type="text" placeholder="Hospital name" value={formData.hospital_name || ''} onChange={(e) => setFormData({ ...formData, hospital_name: e.target.value })} className={inputClass} />
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
                  <input type="number" placeholder="0.00" step="0.01" value={formData.consultation_fee || ''} onChange={(e) => setFormData({ ...formData, consultation_fee: e.target.value })} className={inputClass} />
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
              <div className="bg-blue-50/50 rounded-xl p-4 space-y-4 border border-blue-100">
                <DaySelector
                  label="OPD Days"
                  value={formData.general_opd_days || ''}
                  onChange={(val) => setFormData({ ...formData, general_opd_days: val })}
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>
                      <Clock className="inline h-3.5 w-3.5 mr-1 text-blue-500" />
                      Start Time
                    </label>
                    <select
                      value={formData.general_opd_start || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, general_opd_start: val });
                        setGeneralSlots([]);
                        setSlotError('');
                      }}
                      className={inputClass}
                    >
                      <option value="">Select time</option>
                      {timeOptionsRange('09:00', '23:45', 15).map(opt => (
                        <option key={opt} value={opt} disabled={optionInSlots(opt, privateSlots)}>
                          {fmt12(opt)}{optionInSlots(opt, privateSlots) ? ' — busy' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>
                      <Clock className="inline h-3.5 w-3.5 mr-1 text-blue-500" />
                      End Time
                    </label>
                    <select
                      value={formData.general_opd_end || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (formData.general_opd_start && toMinutes(val) <= toMinutes(formData.general_opd_start)) {
                          setSlotError('End time must be after Start time.');
                          setFormData({ ...formData, general_opd_end: '' });
                          setGeneralSlots([]);
                          return;
                        }
                        // if resulting general range overlaps any private slot, reject
                        if (rangeOverlapsSlots(formData.general_opd_start || '', val, privateSlots)) {
                          setSlotError('General OPD range would overlap Private OPD. Choose a different end time.');
                          setFormData({ ...formData, general_opd_end: '' });
                          setGeneralSlots([]);
                          return;
                        }
                        setFormData({ ...formData, general_opd_end: val });
                        setGeneralSlots([]);
                        setSlotError('');
                      }}
                      className={inputClass}
                    >
                      <option value="">Select time</option>
                      {timeOptionsRange('09:00', '23:45', 15).map(opt => (
                        <option key={opt} value={opt} disabled={!formData.general_opd_start || toMinutes(opt) <= toMinutes(formData.general_opd_start) || optionInSlots(opt, privateSlots) || rangeOverlapsSlots(formData.general_opd_start || '', opt, privateSlots)}>
                          {fmt12(opt)}{optionInSlots(opt, privateSlots) ? ' — busy' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Slot Duration */}
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className={labelClass}>
                      <Clock className="inline h-3.5 w-3.5 mr-1 text-blue-500" />
                      Slot Duration (minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="240"
                      placeholder="e.g. 15"
                      value={formData.general_slot_duration_minutes || ''}
                      onChange={(e) => setFormData({ ...formData, general_slot_duration_minutes: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleGenerateSlots('general')}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    Generate Slots
                  </button>
                </div>

                {/* Generated Slots */}
                {generalSlots.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-blue-700 mb-1">
                      {generalSlots.length} slot{generalSlots.length !== 1 ? 's' : ''} generated — click × to remove
                    </p>
                    <SlotChips slots={generalSlots} onDelete={deleteGeneralSlot} color="blue" />
                  </div>
                )}
              </div>
            </div>
              {/* — Private OPD — */}
              <div>
                <SectionTitle icon={Calendar} title="Private OPD Schedule" color="purple" />
                <div className="bg-purple-50/50 rounded-xl p-4 space-y-4 border border-purple-100">
                  <DaySelector
                    label="OPD Days"
                    value={formData.private_opd_days || ''}
                    onChange={(val) => setFormData({ ...formData, private_opd_days: val })}
                  />

                  {/* Blocked time hint from General OPD */}
                  {formData.general_opd_start && formData.general_opd_end && toMinutes(formData.general_opd_start) < toMinutes(formData.general_opd_end) && (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                      <p className="text-xs text-amber-700 font-medium">
                        General OPD blocked: <span className="font-bold">{fmt12(formData.general_opd_start)} – {fmt12(formData.general_opd_end)}</span>. Private OPD time must not overlap this range.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>
                        <Clock className="inline h-3.5 w-3.5 mr-1 text-purple-500" />
                        Start Time
                      </label>
                      <select
                        value={formData.private_opd_start || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData({ ...formData, private_opd_start: val });
                          setPrivateSlots([]);
                          setSlotError('');
                        }}
                        className={`${inputClass} ${
                          formData.private_opd_start && formData.private_opd_end &&
                          timeRangeOverlaps(formData.private_opd_start, formData.private_opd_end, formData.general_opd_start, formData.general_opd_end)
                            ? 'border-red-400 bg-red-50 focus:ring-red-400 focus:border-red-400'
                            : ''
                        }`}
                      >
                        <option value="">Select time</option>
                        {timeOptionsRange('09:00', '23:45', 15).map(opt => (
                          <option key={opt} value={opt} disabled={optionInSlots(opt, generalSlots)}>
                            {fmt12(opt)}{optionInSlots(opt, generalSlots) ? ' — busy' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>
                        <Clock className="inline h-3.5 w-3.5 mr-1 text-purple-500" />
                        End Time
                      </label>
                      <select
                        value={formData.private_opd_end || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (formData.private_opd_start && toMinutes(val) <= toMinutes(formData.private_opd_start)) {
                            setSlotError('End time must be after Start time.');
                            setFormData({ ...formData, private_opd_end: '' });
                            setPrivateSlots([]);
                            return;
                          }
                          if (rangeOverlapsSlots(formData.private_opd_start || '', val, generalSlots)) {
                            setSlotError('Private OPD range would overlap General OPD. Choose a different end time.');
                            setFormData({ ...formData, private_opd_end: '' });
                            setPrivateSlots([]);
                            return;
                          }
                          setFormData({ ...formData, private_opd_end: val });
                          setPrivateSlots([]);
                          setSlotError('');
                        }}
                        className={`${inputClass} ${
                          formData.private_opd_start && formData.private_opd_end &&
                          timeRangeOverlaps(formData.private_opd_start, formData.private_opd_end, formData.general_opd_start, formData.general_opd_end)
                            ? 'border-red-400 bg-red-50 focus:ring-red-400 focus:border-red-400'
                            : ''
                        }`}
                      >
                        <option value="">Select time</option>
                        {timeOptionsRange('09:00', '23:45', 15).map(opt => (
                          <option key={opt} value={opt} disabled={!formData.private_opd_start || toMinutes(opt) <= toMinutes(formData.private_opd_start) || optionInSlots(opt, generalSlots) || rangeOverlapsSlots(formData.private_opd_start || '', opt, generalSlots)}>
                            {fmt12(opt)}{optionInSlots(opt, generalSlots) ? ' — busy' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Inline overlap warning on time range level */}
                  {formData.private_opd_start && formData.private_opd_end &&
                   timeRangeOverlaps(formData.private_opd_start, formData.private_opd_end, formData.general_opd_start, formData.general_opd_end) && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-red-700">Time overlap detected!</p>
                        <p className="text-xs text-red-600 mt-0.5">
                          Private OPD time <span className="font-semibold">{fmt12(formData.private_opd_start)} – {fmt12(formData.private_opd_end)}</span> overlaps with General OPD <span className="font-semibold">{fmt12(formData.general_opd_start)} – {fmt12(formData.general_opd_end)}</span>. Please choose a different time range.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Slot Duration */}
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className={labelClass}>
                        <Clock className="inline h-3.5 w-3.5 mr-1 text-purple-500" />
                        Slot Duration (minutes)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="240"
                        placeholder="e.g. 20"
                        value={formData.private_slot_duration_minutes || ''}
                        onChange={(e) => setFormData({ ...formData, private_slot_duration_minutes: e.target.value })}
                        className={inputClass}
                        disabled={
                          formData.private_opd_start && formData.private_opd_end &&
                          timeRangeOverlaps(formData.private_opd_start, formData.private_opd_end, formData.general_opd_start, formData.general_opd_end)
                        }
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleGenerateSlots('private')}
                      disabled={
                        !!(formData.private_opd_start && formData.private_opd_end &&
                        timeRangeOverlaps(formData.private_opd_start, formData.private_opd_end, formData.general_opd_start, formData.general_opd_end))
                      }
                      title={
                        formData.private_opd_start && formData.private_opd_end &&
                        timeRangeOverlaps(formData.private_opd_start, formData.private_opd_end, formData.general_opd_start, formData.general_opd_end)
                          ? 'Fix time overlap first'
                          : 'Generate slots'
                      }
                      className="px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                    >
                      Generate Slots
                    </button>
                  </div>

                  {/* Generated Slots */}
                  {privateSlots.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-purple-700 mb-1">
                        {privateSlots.length} slot{privateSlots.length !== 1 ? 's' : ''} generated — click × to remove
                      </p>
                      <SlotChips slots={privateSlots} onDelete={deletePrivateSlot} color="purple" />
                    </div>
                  )}
                </div>
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

      const generalSlotsParsed = (() => {
        try {
          const s = Array.isArray(item.general_opd_slots) ? item.general_opd_slots
            : (item.general_opd_slots ? JSON.parse(item.general_opd_slots) : []);
          return Array.isArray(s) ? s : [];
        } catch { return []; }
      })();

      const privateSlotsParsed = (() => {
        try {
          const s = Array.isArray(item.private_opd_slots) ? item.private_opd_slots
            : (item.private_opd_slots ? JSON.parse(item.private_opd_slots) : []);
          return Array.isArray(s) ? s : [];
        } catch { return []; }
      })();

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
            <div className="flex items-start gap-4 mb-4">
              {item.doctor_image_url ? (
                <img src={item.doctor_image_url} alt={displayName} className="h-20 w-20 rounded-xl object-cover border-2 border-indigo-100 shadow-sm flex-shrink-0" />
              ) : (
                <div className="h-20 w-20 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 flex-shrink-0">
                  <Stethoscope className="h-6 w-6 text-gray-300" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <h3 className="font-bold text-gray-800 text-base">{displayName}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    isOnLeave ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
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
            </div>

              {/* OPD Schedule Info */}
              {(item.general_opd_days || item.private_opd_days) && (
                <div className="mb-3 space-y-1.5">
                  {item.general_opd_days && (
                    <div className="bg-blue-50 rounded-lg px-2.5 py-1.5 flex items-start gap-2">
                      <Clock className="h-3.5 w-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-xs text-blue-700 font-semibold">General OPD</span>
                        <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                          <span className="text-xs text-blue-600">{item.general_opd_days}</span>
                          {item.general_opd_start && item.general_opd_end && (
                            <span className="text-xs text-blue-500 font-medium">{fmt12(item.general_opd_start)}–{fmt12(item.general_opd_end)}</span>
                          )}
                          {generalSlotsParsed.length > 0 && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-1.5 rounded-full">{generalSlotsParsed.length} slots</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {item.private_opd_days && (
                    <div className="bg-purple-50 rounded-lg px-2.5 py-1.5 flex items-start gap-2">
                      <Clock className="h-3.5 w-3.5 text-purple-500 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-xs text-purple-700 font-semibold">Private OPD</span>
                        <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                          <span className="text-xs text-purple-600">{item.private_opd_days}</span>
                          {item.private_opd_start && item.private_opd_end && (
                            <span className="text-xs text-purple-500 font-medium">{fmt12(item.private_opd_start)}–{fmt12(item.private_opd_end)}</span>
                          )}
                          {privateSlotsParsed.length > 0 && (
                            <span className="text-xs bg-purple-100 text-purple-600 px-1.5 rounded-full">{privateSlotsParsed.length} slots</span>
                          )}
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
                          ({Math.ceil((new Date(item.leave_end_date) - new Date(item.leave_start_date)) / (1000*60*60*24)) + 1}d)
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
                className={`flex-1 px-3 py-2 rounded-lg font-medium flex items-center justify-center gap-1.5 text-sm transition-colors ${
                  isOnLeave
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
              <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${
                doc.is_available !== false ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
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
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    availabilityData.is_available
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
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    !availabilityData.is_available
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
              onClick={() => onNavigate('main')}
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