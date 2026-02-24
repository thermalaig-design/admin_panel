// DayWiseOPDScheduler v4 – no default times, blank session always

import React, { useState } from 'react';
import { Clock, Plus, X, Trash2, ChevronDown, ChevronUp, Zap, Check, AlertCircle, Edit2 } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_FULL = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday',
  Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday'
};

function toMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function fmt12(time24) {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function timeOptionsRange(from = '06:00', to = '23:45', step = 15) {
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

function generateSlots(start, end, durationMinutes) {
  if (!start || !end || !durationMinutes || durationMinutes <= 0) return [];
  const slots = [];
  let current = toMinutes(start);
  const endMin = toMinutes(end);
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

const SLOT_DURATION_PRESETS = [10, 15, 20, 30];

// Empty session – always blank, no defaults
function newSession(afterTime = '') {
  return {
    id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    start: afterTime || '',
    end: '',
    slotDuration: 15,
    slots: [],
  };
}

// ---------- Edit Days Modal ----------
// This modal allows editing which days belong to a group (splitting or reorganizing)
function EditDaysModal({ group, usedDays, color, onSave, onClose }) {
  const isBlue = color === 'blue';
  const [selected, setSelected] = useState(group.days);

  const toggle = (day) => {
    setSelected(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSave = () => {
    if (selected.length === 0) {
      alert('At least one day must be selected');
      return;
    }
    onSave(selected);
    onClose();
  };

  const activeClass = isBlue
    ? 'bg-blue-600 border-blue-600 text-white'
    : 'bg-purple-600 border-purple-600 text-white';

  const inactiveClass = isBlue
    ? 'bg-white border-gray-200 text-gray-700 hover:border-blue-400 hover:bg-blue-50'
    : 'bg-white border-gray-200 text-gray-700 hover:border-purple-400 hover:bg-purple-50';

  const btnClass = isBlue
    ? 'bg-blue-600 hover:bg-blue-700 text-white'
    : 'bg-purple-600 hover:bg-purple-700 text-white';

  // Days not in this group but already used elsewhere
  const otherUsedDays = usedDays.filter(d => !group.days.includes(d));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-sm">Edit Days in Group</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Days grid */}
        <div className="px-5 py-4">
          <p className="text-xs text-gray-500 mb-3">
            Select which days should share this schedule.
          </p>
          <div className="grid grid-cols-4 gap-2">
            {DAYS.map(day => {
              const isOtherUsed = otherUsedDays.includes(day);
              const isSel = selected.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  disabled={isOtherUsed}
                  onClick={() => toggle(day)}
                  className={`relative flex flex-col items-center justify-center py-3 rounded-xl border text-xs font-semibold transition-all
                    ${isOtherUsed ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed' : isSel ? activeClass : inactiveClass}
                  `}
                >
                  {isSel && !isOtherUsed && (
                    <span className="absolute top-1 right-1">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                  <span className="text-sm font-bold">{day}</span>
                  <span className="text-[10px] mt-0.5 opacity-70">{DAY_FULL[day].slice(0, 3)}</span>
                  {isOtherUsed && (
                    <span className="text-[9px] mt-0.5 opacity-60">used</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={selected.length === 0}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${btnClass}`}
          >
            Update {selected.length > 0 ? `(${selected.length})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Add Day Modal ----------
function AddDayModal({ usedDays, color, onAdd, onClose }) {
  const isBlue = color === 'blue';
  const [selected, setSelected] = useState([]);

  const toggle = (day) => {
    setSelected(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleAdd = () => {
    if (selected.length === 0) return;
    onAdd(selected);
    onClose();
  };

  const activeClass = isBlue
    ? 'bg-blue-600 border-blue-600 text-white'
    : 'bg-purple-600 border-purple-600 text-white';

  const inactiveClass = isBlue
    ? 'bg-white border-gray-200 text-gray-700 hover:border-blue-400 hover:bg-blue-50'
    : 'bg-white border-gray-200 text-gray-700 hover:border-purple-400 hover:bg-purple-50';

  const btnClass = isBlue
    ? 'bg-blue-600 hover:bg-blue-700 text-white'
    : 'bg-purple-600 hover:bg-purple-700 text-white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-sm">Select Days</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Days grid */}
        <div className="px-5 py-4">
          <p className="text-xs text-gray-500 mb-3">
            Select one or more days — they will share the same schedule.
          </p>
          <div className="grid grid-cols-4 gap-2">
            {DAYS.map(day => {
              const isUsed = usedDays.includes(day);
              const isSel = selected.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  disabled={isUsed}
                  onClick={() => toggle(day)}
                  className={`relative flex flex-col items-center justify-center py-3 rounded-xl border text-xs font-semibold transition-all
                    ${isUsed ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed' : isSel ? activeClass : inactiveClass}
                  `}
                >
                  {isSel && !isUsed && (
                    <span className="absolute top-1 right-1">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                  <span className="text-sm font-bold">{day}</span>
                  <span className="text-[10px] mt-0.5 opacity-70">{DAY_FULL[day].slice(0, 3)}</span>
                  {isUsed && (
                    <span className="text-[9px] mt-0.5 opacity-60">added</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={selected.length === 0}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${btnClass}`}
          >
            Add {selected.length > 0 ? `(${selected.length})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Edit Day Time Slots Modal ----------
function EditDayTimeSlotsModal({ day, group, color, conflictingSchedule, onSave, onClose }) {
  const isBlue = color === 'blue';
  const [sessions, setSessions] = useState(() => {
    // Copy sessions from group
    return group.sessions.map(s => ({ ...s, id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }));
  });

  const timeOpts = timeOptionsRange('06:00', '23:45', 15);

  // Get conflicting times for this day from other OPD
  const getConflictingTimesForDay = () => {
    if (!Array.isArray(conflictingSchedule) || conflictingSchedule.length === 0) return [];
    const times = new Set();
    conflictingSchedule.forEach(item => {
      if (item.day === day && item.start && item.end) {
        let current = toMinutes(item.start);
        const end = toMinutes(item.end);
        while (current < end) {
          const h = Math.floor(current / 60);
          const m = current % 60;
          const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          times.add(timeStr);
          current += 15;
        }
      }
    });
    return Array.from(times);
  };

  const conflictingTimes = getConflictingTimesForDay();

  const handleSessionUpdate = (idx, updates) => {
    setSessions(prev =>
      prev.map((s, i) => i === idx ? { ...s, ...updates } : s)
    );
  };

  const handleRemoveSession = (idx) => {
    if (sessions.length === 1) {
      alert('At least one time slot is required');
      return;
    }
    setSessions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddSession = () => {
    const lastSession = sessions[sessions.length - 1];
    const afterTime = lastSession?.end || '';
    setSessions(prev => [...prev, newSession(afterTime)]);
  };

  const handleSave = () => {
    const hasValidSlots = sessions.some(s => s.start && s.end && s.slots && s.slots.length > 0);
    if (!hasValidSlots) {
      alert('At least one session must have generated slots');
      return;
    }
    onSave(sessions);
    onClose();
  };

  const btnClass = isBlue
    ? 'bg-blue-600 hover:bg-blue-700 text-white'
    : 'bg-purple-600 hover:bg-purple-700 text-white';

  const c = isBlue
    ? {
        ring: 'focus:ring-blue-300 focus:border-blue-400',
        dayHeaderBg: 'bg-blue-50',
        dayHeaderBorder: 'border-blue-100',
        chip: 'bg-blue-50 border-blue-200 text-blue-700',
        badge: 'bg-blue-100 text-blue-700',
        generateBtn: 'bg-blue-600 hover:bg-blue-700 text-white',
        presetActive: 'bg-blue-600 text-white border-blue-600',
        presetInactive: 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50',
      }
    : {
        ring: 'focus:ring-purple-300 focus:border-purple-400',
        dayHeaderBg: 'bg-purple-50',
        dayHeaderBorder: 'border-purple-100',
        chip: 'bg-purple-50 border-purple-200 text-purple-700',
        badge: 'bg-purple-100 text-purple-700',
        generateBtn: 'bg-purple-600 hover:bg-purple-700 text-white',
        presetActive: 'bg-purple-600 text-white border-purple-600',
        presetInactive: 'bg-white text-purple-600 border-purple-300 hover:bg-purple-50',
      };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-8">
        {/* Header */}
        <div className={`bg-gradient-to-r ${isBlue ? 'from-blue-600 to-blue-500' : 'from-purple-600 to-purple-500'} px-6 py-4 flex items-center justify-between`}>
          <div>
            <h3 className="font-bold text-white text-base">Edit Time Slots for {DAY_FULL[day]}</h3>
            <p className="text-white/70 text-xs mt-1">Configure time slots for this day only</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Conflict warning if exists */}
          {conflictingTimes.length > 0 && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-amber-800">⚠️ Times already used in other OPD</p>
                <p className="text-xs text-amber-700 mt-0.5">{conflictingTimes.slice(0, 5).map(t => fmt12(t)).join(', ')}{conflictingTimes.length > 5 ? '...' : ''}</p>
              </div>
            </div>
          )}

          {/* Sessions */}
          <div className="space-y-4">
            {sessions.map((session, idx) => {
              const prevSessionEnd = idx > 0 ? sessions[idx - 1]?.end : null;
              const minStartMin = prevSessionEnd ? toMinutes(prevSessionEnd) : toMinutes('06:00');

              const availableStartTimes = timeOpts.filter(t => 
                toMinutes(t) >= minStartMin && !conflictingTimes.includes(t)
              );

              const availableEndTimes = session.start
                ? timeOpts.filter(t => 
                    toMinutes(t) > toMinutes(session.start) && !conflictingTimes.includes(t)
                  )
                : [];

              const slotPreview = session.start && session.end && session.slotDuration
                ? Math.max(0, Math.floor((toMinutes(session.end) - toMinutes(session.start)) / session.slotDuration))
                : 0;

              return (
                <div key={idx} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
                  {/* Session header */}
                  {sessions.length > 1 && (
                    <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                      <span className="text-sm font-semibold text-gray-700">
                        Time Slot {idx + 1}
                        {session.start && session.end && (
                          <span className="ml-2 text-sm font-normal text-gray-500">
                            {fmt12(session.start)} – {fmt12(session.end)}
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSession(idx)}
                        className="p-1 rounded text-red-500 hover:bg-red-50"
                        title="Remove this slot"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* Time Pickers */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Start Time</label>
                      <select
                        value={session.start || ''}
                        onChange={(e) => handleSessionUpdate(idx, { start: e.target.value, end: '', slots: [] })}
                        className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium bg-white focus:ring-2 ${c.ring} outline-none transition-all`}
                      >
                        <option value="">Select time</option>
                        {availableStartTimes.map(t => (
                          <option key={t} value={t}>{fmt12(t)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">End Time</label>
                      <select
                        value={session.end || ''}
                        onChange={(e) => handleSessionUpdate(idx, { end: e.target.value, slots: [] })}
                        disabled={!session.start}
                        className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium bg-white focus:ring-2 ${c.ring} outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <option value="">Select time</option>
                        {availableEndTimes.map(t => (
                          <option key={t} value={t}>{fmt12(t)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Slot Duration */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Slot Duration</label>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {SLOT_DURATION_PRESETS.map(preset => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => handleSessionUpdate(idx, { slotDuration: preset })}
                            className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                              session.slotDuration === preset ? c.presetActive : c.presetInactive
                            }`}
                          >
                            {preset}m
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        min="1"
                        max="240"
                        placeholder="Custom"
                        value={SLOT_DURATION_PRESETS.includes(session.slotDuration) ? '' : (session.slotDuration || '')}
                        onChange={(e) => handleSessionUpdate(idx, { slotDuration: parseInt(e.target.value) || 0 })}
                        className={`w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-medium bg-white focus:ring-2 ${c.ring} outline-none transition-all`}
                      />
                    </div>
                  </div>

                  {/* Generate Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!session.start || !session.end) { alert('Select start and end time first'); return; }
                      if (!session.slotDuration || session.slotDuration <= 0) { alert('Enter valid slot duration'); return; }
                      const slots = generateSlots(session.start, session.end, parseInt(session.slotDuration));
                      handleSessionUpdate(idx, { slots });
                    }}
                    className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${c.generateBtn}`}
                  >
                    <Zap className="h-3.5 w-3.5" />
                    Generate Slots {slotPreview > 0 ? ` (${slotPreview})` : ''}
                  </button>

                  {/* Slots display */}
                  {session.slots && session.slots.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-700">
                          Slots: {session.slots.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSessionUpdate(idx, { slots: [] })}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                        {session.slots.map((slot, i) => (
                          <span key={i} className={`px-2 py-1 rounded text-xs font-medium border ${c.chip}`}>
                            {slot.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add slot button */}
          <button
            type="button"
            onClick={handleAddSession}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold border border-dashed ${isBlue ? 'border-blue-300 text-blue-600 hover:bg-blue-50' : 'border-purple-300 text-purple-600 hover:bg-purple-50'} transition-all`}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Another Time Slot
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors ${btnClass}`}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Single Session Panel ----------
function SessionPanel({ session, sessionIndex, totalSessions, allSessions, c, onUpdate, onRemove, conflictingTimes = [] }) {
  const timeOpts = timeOptionsRange('06:00', '23:45', 15);

  // Minimum start time: must be AT or AFTER the end of the previous session
  const prevSessionEnd = sessionIndex > 0 ? allSessions[sessionIndex - 1]?.end : null;
  const minStartMin = prevSessionEnd ? toMinutes(prevSessionEnd) : toMinutes('06:00');

  // Available start times: only times >= previous session's end AND not conflicting
  const availableStartTimes = timeOpts.filter(t => 
    toMinutes(t) >= minStartMin && !conflictingTimes.includes(t)
  );

  // Available end times: only times > current session's start AND not conflicting
  const availableEndTimes = session.start
    ? timeOpts.filter(t => 
        toMinutes(t) > toMinutes(session.start) && !conflictingTimes.includes(t)
      )
    : [];

  const slotPreview = session.start && session.end && session.slotDuration
    ? Math.max(0, Math.floor((toMinutes(session.end) - toMinutes(session.start)) / session.slotDuration))
    : 0;

  const handleGenerate = () => {
    if (!session.start || !session.end) { alert('Please select start and end time first.'); return; }
    if (!session.slotDuration || session.slotDuration <= 0) { alert('Please enter a valid slot duration.'); return; }
    const slots = generateSlots(session.start, session.end, parseInt(session.slotDuration));
    onUpdate({ slots });
  };

  const handleDeleteSlot = (i) => {
    onUpdate({ slots: session.slots.filter((_, idx) => idx !== i) });
  };

  return (
    <div className={`rounded-xl border ${totalSessions > 1 ? 'border-gray-200' : 'border-gray-100'} bg-white overflow-hidden`}>
      {/* Session header */}
      {totalSessions > 1 && (
        <div className={`flex items-center justify-between px-3 py-2 ${c.dayHeaderBg} border-b ${c.dayHeaderBorder}`}>
          <span className={`text-xs font-bold ${c.summaryText}`}>
            Session {sessionIndex + 1}
            {session.start && session.end && (
              <span className="ml-1.5 font-normal text-gray-500">
                {fmt12(session.start)} – {fmt12(session.end)}
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={onRemove}
            className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Remove this session"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="px-4 py-3 space-y-3">
          {/* Time Pickers */}
          <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Start Time</label>
                  <select
                    value={session.start || ''}
                    onChange={(e) => onUpdate({ start: e.target.value, end: '', slots: [] })}
                    className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium bg-gray-50 focus:bg-white focus:ring-2 ${c.ring} outline-none transition-all`}
                  >
                    <option value="">Select time</option>
                    {availableStartTimes.map(t => (
                      <option key={t} value={t}>{fmt12(t)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">End Time</label>
                  <select
                    value={session.end || ''}
                    onChange={(e) => onUpdate({ end: e.target.value, slots: [] })}
                    disabled={!session.start}
                    className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium bg-gray-50 focus:bg-white focus:ring-2 ${c.ring} outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <option value="">Select time</option>
                    {availableEndTimes.map(t => (
                      <option key={t} value={t}>{fmt12(t)}</option>
                    ))}
                  </select>
                </div>
          </div>

          {/* Conflict Warning */}
          {conflictingTimes.length > 0 && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium text-amber-800">Times already used in other OPD</p>
                <p className="text-xs text-amber-700 mt-0.5">{conflictingTimes.slice(0, 5).map(t => fmt12(t)).join(', ')}{conflictingTimes.length > 5 ? '...' : ''}</p>
              </div>
            </div>
          )}

        {/* Slot Duration */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Slot Duration</label>
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              {SLOT_DURATION_PRESETS.map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onUpdate({ slotDuration: preset })}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    session.slotDuration === preset ? c.presetActive : c.presetInactive
                  }`}
                >
                  {preset}m
                </button>
              ))}
            </div>
            <input
              type="number"
              min="1"
              max="240"
              placeholder="Custom"
              value={SLOT_DURATION_PRESETS.includes(session.slotDuration) ? '' : (session.slotDuration || '')}
              onChange={(e) => onUpdate({ slotDuration: parseInt(e.target.value) || 0 })}
              className={`w-20 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-medium bg-gray-50 focus:bg-white focus:ring-2 ${c.ring} outline-none transition-all`}
            />
          </div>
        </div>

        {/* Generate Button */}
        <button
          type="button"
          onClick={handleGenerate}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${c.generateBtn}`}
        >
          <Zap className="h-3.5 w-3.5" />
          Generate Slots
          {slotPreview > 0 ? ` (${slotPreview} slots)` : ''}
        </button>

        {/* Generated Slots */}
        {session.slots && session.slots.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-700">
                Slots
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${c.badge}`}>
                  {session.slots.length}
                </span>
              </p>
              <button
                type="button"
                onClick={() => onUpdate({ slots: [] })}
                className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
              {session.slots.map((slot, i) => (
                <div
                  key={i}
                  className={`group flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border transition-colors ${c.chip}`}
                >
                  <span>{slot.label}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteSlot(i)}
                    className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Main Component ----------
export default function DayWiseOPDScheduler({
  label = 'OPD Schedule',
  schedule = null,
  onChange = () => {},
  color = 'blue',
  conflictingSchedule = []
}) {
  const isBlue = color === 'blue';
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingDayModal, setEditingDayModal] = useState(null); // { groupId, day }

  // Helper function to get all times used in conflicting schedule for a given day
  const getConflictingTimesForDay = (day) => {
    if (!Array.isArray(conflictingSchedule) || conflictingSchedule.length === 0) return [];
    const times = new Set();
    conflictingSchedule.forEach(item => {
      if (item.day === day && item.start && item.end) {
        // Add all times between start and end (in 15-min intervals)
        let current = toMinutes(item.start);
        const end = toMinutes(item.end);
        while (current < end) {
          const h = Math.floor(current / 60);
          const m = current % 60;
          const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          times.add(timeStr);
          current += 15;
        }
      }
    });
    return Array.from(times);
  };

  // groups: [{ id, days: ['Mon','Wed'], sessions: [{ id, start, end, slotDuration, slots }] }]
  const [groups, setGroups] = useState(() => {
    if (schedule && Array.isArray(schedule) && schedule.length > 0) {
      // legacy: each item is { day, start, end, slotDuration, slots }
      // Group by days
      const map = {};
      schedule.forEach((d, i) => {
        const key = d.day;
        if (!map[key]) {
          map[key] = {
            id: `g-${i}`,
            days: [d.day],
            sessions: [],
          };
        }
          map[key].sessions.push({
            id: `s-${i}`,
            start: d.start || '',
            end: d.end || '',
            slotDuration: d.slotDuration || 15,
            slots: d.slots || [],
          });
      });
      return Object.values(map);
    }
    return [];
  });

  const usedDays = groups.flatMap(g => g.days);
  const totalSlots = groups.reduce(
    (acc, g) => acc + g.sessions.reduce((a, s) => a + (s.slots?.length || 0), 0),
    0
  );

  const c = isBlue
    ? {
        gradient: 'from-blue-600 to-blue-500',
        badge: 'bg-blue-100 text-blue-700',
        generateBtn: 'bg-blue-600 hover:bg-blue-700 text-white',
        ring: 'focus:ring-blue-300 focus:border-blue-400',
        dayHeaderBg: 'bg-blue-50',
        dayHeaderBorder: 'border-blue-100',
        chip: 'bg-blue-50 border-blue-200 text-blue-700',
        emptyIcon: 'text-blue-300',
        containerBorder: 'border-blue-200',
        presetActive: 'bg-blue-600 text-white border-blue-600',
        presetInactive: 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50',
        summaryBg: 'bg-blue-50',
        summaryText: 'text-blue-700',
        slotCount: 'bg-blue-600 text-white',
        dayBadge: 'bg-blue-100 text-blue-700',
        addSessionBtn: 'border-blue-300 text-blue-600 hover:bg-blue-50',
        addSessionDivider: 'border-blue-100',
      }
    : {
        gradient: 'from-purple-600 to-purple-500',
        badge: 'bg-purple-100 text-purple-700',
        generateBtn: 'bg-purple-600 hover:bg-purple-700 text-white',
        ring: 'focus:ring-purple-300 focus:border-purple-400',
        dayHeaderBg: 'bg-purple-50',
        dayHeaderBorder: 'border-purple-100',
        chip: 'bg-purple-50 border-purple-200 text-purple-700',
        emptyIcon: 'text-purple-300',
        containerBorder: 'border-purple-200',
        presetActive: 'bg-purple-600 text-white border-purple-600',
        presetInactive: 'bg-white text-purple-600 border-purple-300 hover:bg-purple-50',
        summaryBg: 'bg-purple-50',
        summaryText: 'text-purple-700',
        slotCount: 'bg-purple-600 text-white',
        dayBadge: 'bg-purple-100 text-purple-700',
        addSessionBtn: 'border-purple-300 text-purple-600 hover:bg-purple-50',
        addSessionDivider: 'border-purple-100',
      };

  const notify = (updated) => {
    // Flatten groups → sessions → per day
    const flat = updated.flatMap(g =>
      g.days.flatMap(day =>
        g.sessions.map(s => ({
          day,
          start: s.start,
          end: s.end,
          slotDuration: s.slotDuration,
          slots: s.slots,
        }))
      )
    );
    onChange(flat);
  };

  const handleAddDays = (selectedDays) => {
    const id = `g-${Date.now()}`;
    const newGroup = {
        id,
        days: selectedDays,
        sessions: [newSession()],
      };
    const updated = [...groups, newGroup];
    setGroups(updated);
    notify(updated);
    setExpandedGroup(id);
  };

  const handleRemoveGroup = (id) => {
    const updated = groups.filter(g => g.id !== id);
    setGroups(updated);
    notify(updated);
    if (expandedGroup === id) setExpandedGroup(null);
  };

  const handleUpdateGroup = (groupId, updater) => {
    const updated = groups.map(g => g.id === groupId ? updater(g) : g);
    setGroups(updated);
    notify(updated);
  };

  const handleUpdateSession = (groupId, sessionId, updates) => {
    handleUpdateGroup(groupId, (g) => ({
      ...g,
      sessions: g.sessions.map(s => s.id === sessionId ? { ...s, ...updates } : s),
    }));
  };

  const handleAddSession = (groupId) => {
    handleUpdateGroup(groupId, (g) => {
      const lastSession = g.sessions[g.sessions.length - 1];
      const afterTime = lastSession?.end || '';
      return {
        ...g,
        sessions: [...g.sessions, newSession(afterTime)],
      };
    });
  };

  const handleRemoveSession = (groupId, sessionId) => {
    handleUpdateGroup(groupId, (g) => ({
      ...g,
      sessions: g.sessions.filter(s => s.id !== sessionId),
    }));
  };

  // Handle updating days in a group
  const handleUpdateGroupDays = (groupId, newDays) => {
    // Find which days are being removed from this group
    const currentGroup = groups.find(g => g.id === groupId);
    if (!currentGroup) return;
    
    // Update or remove the current group
    let updated = groups.map(g => {
      if (g.id === groupId) {
        return { ...g, days: newDays };
      }
      return g;
    });

    // If days were removed, create a new group for them (optional preserve logic)
    // For now, we'll just remove those days entirely or keep a separate group
    // If user wants to keep removed days with same schedule, they could be in a new group
    // But per requirement, we only keep updated days

    // Filter out any groups with no days
    updated = updated.filter(g => g.days.length > 0);

    setGroups(updated);
    notify(updated);
    setEditingGroupId(null);
  };

  // Handle saving edited day time slots
  const handleSaveDayTimeSlots = (editedSessions) => {
    if (!editingDayModal) return;

    const { groupId, day } = editingDayModal;
    const currentGroup = groups.find(g => g.id === groupId);
    if (!currentGroup) return;

    // Create a new group for this day with edited sessions
    const newGroupId = `g-${Date.now()}`;
    const newGroup = {
      id: newGroupId,
      days: [day],
      sessions: editedSessions
    };

    // Remove this day from the original group
    let updated = groups.map(g => {
      if (g.id === groupId) {
        return { ...g, days: g.days.filter(d => d !== day) };
      }
      return g;
    });

    // Add new group for this day with custom sessions
    updated = [...updated, newGroup];

    // Filter out groups with no days
    updated = updated.filter(g => g.days.length > 0);

    setGroups(updated);
    notify(updated);
    setEditingDayModal(null);
    setExpandedGroup(newGroupId);
  };

  return (
    <>
      {showModal && (
        <AddDayModal
          usedDays={usedDays}
          color={color}
          onAdd={handleAddDays}
          onClose={() => setShowModal(false)}
        />
      )}

      {editingGroupId && (
        <EditDaysModal
          group={groups.find(g => g.id === editingGroupId)}
          usedDays={usedDays}
          color={color}
          onSave={(newDays) => handleUpdateGroupDays(editingGroupId, newDays)}
          onClose={() => setEditingGroupId(null)}
        />
      )}

      {editingDayModal && (
        <EditDayTimeSlotsModal
          day={editingDayModal.day}
          group={groups.find(g => g.id === editingDayModal.groupId)}
          color={color}
          conflictingSchedule={conflictingSchedule}
          onSave={handleSaveDayTimeSlots}
          onClose={() => setEditingDayModal(null)}
        />
      )}

      <div className={`rounded-2xl border ${c.containerBorder} overflow-hidden shadow-sm bg-white`}>
        {/* Header */}
        <div className={`bg-gradient-to-r ${c.gradient} px-4 py-3 flex items-center justify-between`}>
          <div className="flex items-center gap-2.5">
            <div className="bg-white/20 p-1.5 rounded-lg">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">{label}</h3>
              {groups.length > 0 && (
                <p className="text-white/70 text-xs">
                  {usedDays.length} day{usedDays.length !== 1 ? 's' : ''}
                  {totalSlots > 0 ? ` · ${totalSlots} slots` : ''}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            disabled={usedDays.length >= 7}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-white/20 hover:bg-white/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-white/30"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Day
          </button>
        </div>

        {/* Body */}
        <div className="p-3 space-y-2">
          {groups.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center bg-gray-50/50">
              <Clock className={`h-5 w-5 ${c.emptyIcon} mx-auto mb-1`} />
              <p className="text-gray-500 text-sm font-medium">No days added yet</p>
              <p className="text-gray-400 text-xs mt-0.5">Click "Add Day" to configure schedule</p>
            </div>
          ) : (
            groups.map(group => {
              const isOpen = expandedGroup === group.id;
              const totalGroupSlots = group.sessions.reduce((a, s) => a + (s.slots?.length || 0), 0);
                const sessionSummary = group.sessions
                  .filter(s => s.start && s.end && s.start !== s.end)
                  .map(s => `${fmt12(s.start)}–${fmt12(s.end)}`)
                  .join(', ');

              return (
                <div key={group.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Group Row - use div with role=button to avoid nested <button> elements */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setExpandedGroup(isOpen ? null : group.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setExpandedGroup(isOpen ? null : group.id);
                      }
                    }}
                    className={`w-full px-3 py-2.5 flex items-center gap-3 text-left transition-colors ${isOpen ? c.dayHeaderBg : 'hover:bg-gray-50'} cursor-pointer`}
                  >
                    {/* Day pills */}
                    <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                      {group.days.map(day => (
                        <span
                          key={day}
                          className={`px-2 py-0.5 rounded-lg text-xs font-bold ${isOpen ? c.slotCount : c.dayBadge}`}
                        >
                          {day}
                        </span>
                      ))}
                      {sessionSummary && (
                        <span className="text-xs text-gray-400 self-center ml-1 truncate">
                          {sessionSummary}
                        </span>
                      )}
                    </div>

                    {/* Slot count */}
                    {totalGroupSlots > 0 && (
                      <span className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${c.slotCount}`}>
                        {totalGroupSlots} slots
                      </span>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1 ml-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRemoveGroup(group.id); }}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <div className="p-1.5 text-gray-400">
                        {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Panel */}
                  {isOpen && (
                    <div className={`border-t ${c.dayHeaderBorder} px-4 py-4 space-y-4`}>

                      {/* Days list with full names and edit button */}
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-2.5">Days in this group:</p>
                        <div className="flex flex-wrap gap-2">
                          {group.days.map(day => (
                            <div
                              key={day}
                              className={`group relative flex items-center px-3 py-2 rounded-lg ${c.badge} transition-all`}
                            >
                              <span className="text-xs font-semibold">{DAY_FULL[day]}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setEditingDayModal({ groupId: group.id, day });
                                }}
                                className="ml-2 p-0.5 rounded transition-colors hover:bg-white/30"
                                title={`Edit time slots for ${day}`}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Sessions */}
                      <div className="space-y-3">
                          {group.sessions.map((session, idx) => {
                            // Get conflicting times for ALL days in this group and merge them
                            const allConflictingTimes = new Set();
                            group.days.forEach(day => {
                              getConflictingTimesForDay(day).forEach(time => allConflictingTimes.add(time));
                            });
                            const conflictingTimes = Array.from(allConflictingTimes);
                            return (
                              <SessionPanel
                                key={session.id}
                                session={session}
                                groupId={group.id}
                                sessionIndex={idx}
                                totalSessions={group.sessions.length}
                                allSessions={group.sessions}
                                color={color}
                                c={c}
                                onUpdate={(updates) => handleUpdateSession(group.id, session.id, updates)}
                                onRemove={() => {
                                  if (group.sessions.length === 1) return; // keep at least one
                                  handleRemoveSession(group.id, session.id);
                                }}
                                conflictingTimes={conflictingTimes}
                              />
                            );
                          })}
                      </div>

                      {/* Add Time Slot Button */}
                      <button
                        type="button"
                        onClick={() => handleAddSession(group.id)}
                        className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border border-dashed transition-all ${c.addSessionBtn}`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Another Time Slot
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer summary */}
        {groups.length > 0 && (
          <div className={`px-4 py-2.5 border-t ${c.containerBorder} ${c.summaryBg} flex items-center flex-wrap gap-1.5`}>
            {groups.map(g => (
              <span
                key={g.id}
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.summaryText} bg-white border ${c.containerBorder}`}
              >
                {g.days.join(', ')}
                {g.sessions.reduce((a, s) => a + (s.slots?.length || 0), 0) > 0 && (
                  <span className="ml-1 opacity-60">
                    ({g.sessions.reduce((a, s) => a + (s.slots?.length || 0), 0)})
                  </span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
