/**
 * slotService.js
 * Core logic for doctor slot availability.
 * Uses Supabase directly to count active bookings per slot.
 */
import supabase from './supabaseClient';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const normalizeTimeToHHMM = (value) => {
    if (!value) return null;
    const t = String(value).trim();
    const match = t.match(/^(\d{1,2}):(\d{2})/);
    if (!match) return null;
    const hours = String(Math.max(0, Math.min(23, Number(match[1]) || 0))).padStart(2, '0');
    const mins = String(Math.max(0, Math.min(59, Number(match[2]) || 0))).padStart(2, '0');
    return `${hours}:${mins}`;
};

const toMinutes = (hhmm) => {
    const normalized = normalizeTimeToHHMM(hhmm);
    if (!normalized) return null;
    const [h, m] = normalized.split(':').map(Number);
    return (h * 60) + m;
};

const getLocalDayCode = (date) => {
    // Parse YYYY-MM-DD as local date to avoid timezone day-shift.
    const [y, m, d] = String(date || '').split('-').map(Number);
    if (!y || !m || !d) return null;
    const localDate = new Date(y, m - 1, d);
    return DAY_NAMES[localDate.getDay()];
};

const parseSchedule = (value) => {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    return [];
};

const generateSlotsFromRange = (start, end, durationMinutes = 15) => {
    const startMin = toMinutes(start);
    const endMin = toMinutes(end);
    if (startMin === null || endMin === null || !durationMinutes || durationMinutes <= 0 || startMin >= endMin) {
        return [];
    }

    const slots = [];
    for (let current = startMin; current + durationMinutes <= endMin; current += durationMinutes) {
        const slotStart = `${String(Math.floor(current / 60)).padStart(2, '0')}:${String(current % 60).padStart(2, '0')}`;
        const slotEndMin = current + durationMinutes;
        const slotEnd = `${String(Math.floor(slotEndMin / 60)).padStart(2, '0')}:${String(slotEndMin % 60).padStart(2, '0')}`;
        slots.push({
            start: slotStart,
            end: slotEnd,
            label: `${slotStart} - ${slotEnd}`,
        });
    }
    return slots;
};

/**
 * Returns a map of { "HH:MM": count } for active bookings for a given doctor + date.
 * Matches appointments by doctor_id OR doctor_name.
 */
export const getBookingCountsForDate = async (doctor, date) => {
    if (!doctor || !date) return {};

    const targetDoctorId = normalizeText(doctor.id);
    const targetDoctorName = normalizeText(doctor.consultant_name);

    const { data, error } = await supabase
        .from('appointments')
        .select('doctor_id, doctor_name, appointment_time, status')
        .eq('appointment_date', date)
        .neq('status', 'Cancelled');

    if (error) {
        console.error('slotService error:', error);
        return {};
    }

    const counts = {};
    (data || []).forEach((row) => {
        const rowDoctorId = normalizeText(row.doctor_id);
        const rowDoctorName = normalizeText(row.doctor_name);
        const sameDoctor =
            (targetDoctorId && rowDoctorId && targetDoctorId === rowDoctorId) ||
            (targetDoctorName && rowDoctorName && targetDoctorName === rowDoctorName);

        if (!sameDoctor || !row.appointment_time) return;

        const timeKey = normalizeTimeToHHMM(row.appointment_time);
        if (!timeKey) return;
        counts[timeKey] = (counts[timeKey] || 0) + 1;
    });

    return counts;
};

/**
 * Get all slots for a doctor on a specific date from configured OPD schedule.
 * Returns flat list of { start, end, label }.
 */
export const getSlotsForDate = (doctor, date, opdType = 'general') => {
    if (!doctor || !date) return [];

    const dayOfWeek = getLocalDayCode(date);
    if (!dayOfWeek) return [];

    const scheduleKey = opdType === 'general' ? 'general_opd_schedule' : 'private_opd_schedule';
    const slotsKey = opdType === 'general' ? 'general_opd_slots' : 'private_opd_slots';
    const startKey = opdType === 'general' ? 'general_opd_start' : 'private_opd_start';
    const endKey = opdType === 'general' ? 'general_opd_end' : 'private_opd_end';
    const durationKey = opdType === 'general' ? 'general_slot_duration_minutes' : 'private_slot_duration_minutes';

    const schedule = parseSchedule(doctor[scheduleKey]);
    const legacySlots = parseSchedule(doctor[slotsKey]);
    const allSlots = [];

    // Preferred format: [{ days: ['Mon'], sessions: [{ start, end, slotDuration, slots: [] }] }]
    schedule.forEach((group) => {
        const days = Array.isArray(group?.days) ? group.days : [];
        if (!days.includes(dayOfWeek)) return;

        const sessions = Array.isArray(group?.sessions) ? group.sessions : [];
        sessions.forEach((session) => {
            if (Array.isArray(session?.slots) && session.slots.length > 0) {
                session.slots.forEach((slot) => {
                    const start = normalizeTimeToHHMM(slot.start);
                    const end = normalizeTimeToHHMM(slot.end);
                    if (!start || !end) return;
                    allSlots.push({
                        start,
                        end,
                        label: slot.label || `${start} - ${end}`,
                    });
                });
                return;
            }

            if (session?.start && session?.end) {
                const generated = generateSlotsFromRange(
                    session.start,
                    session.end,
                    Number(session.slotDuration) || Number(doctor[durationKey]) || Number(doctor.slot_duration_minutes) || 15
                );
                generated.forEach((slot) => allSlots.push(slot));
            }
        });
    });

    // Fallback format: general_opd_slots/private_opd_slots
    if (allSlots.length === 0 && legacySlots.length > 0) {
        legacySlots.forEach((slot) => {
            const slotDay = slot.day || slot.dayCode || slot.weekday;
            if (slotDay && slotDay !== dayOfWeek) return;

            const start = normalizeTimeToHHMM(slot.start || slot.time);
            const end = normalizeTimeToHHMM(slot.end);
            if (!start) return;

            allSlots.push({
                start,
                end: end || start,
                label: slot.label || (end ? `${start} - ${end}` : start),
            });
        });
    }

    // Last fallback from start/end + duration columns
    if (allSlots.length === 0 && doctor[startKey] && doctor[endKey]) {
        const generated = generateSlotsFromRange(
            doctor[startKey],
            doctor[endKey],
            Number(doctor[durationKey]) || Number(doctor.slot_duration_minutes) || 15
        );
        generated.forEach((slot) => allSlots.push(slot));
    }

    // Deduplicate by start time and sort
    const dedup = new Map();
    allSlots.forEach((slot) => {
        const start = normalizeTimeToHHMM(slot.start);
        if (!start) return;
        if (!dedup.has(start)) {
            dedup.set(start, {
                ...slot,
                start,
                end: normalizeTimeToHHMM(slot.end) || start,
            });
        }
    });

    return Array.from(dedup.values()).sort((a, b) => a.start.localeCompare(b.start));
};

const getDoctorMaxPerSlot = (doctor) => {
    const max = Number(doctor?.max_patients_per_slot);
    if (Number.isFinite(max) && max > 0) return max;
    return 4;
};

/**
 * Compute availability status for a single slot.
 */
export const computeSlotStatus = (bookedCount, maxPerSlot = 4) => {
    const safeBooked = Math.max(0, Number(bookedCount) || 0);
    const safeMax = Math.max(1, Number(maxPerSlot) || 4);
    const available = Math.max(0, safeMax - safeBooked);
    const isFull = available === 0;
    const status = isFull ? 'full' : available <= 1 ? 'limited' : 'available';
    return { available, isFull, status, booked: safeBooked, max: safeMax };
};

/**
 * Fetch full slot availability for a doctor on a date.
 * Returns array of { start, end, label, booked, available, max, isFull, status }.
 */
export const getSlotAvailability = async (doctor, date, opdType = 'general') => {
    const slots = getSlotsForDate(doctor, date, opdType);
    if (slots.length === 0) return [];

    const maxPerSlot = getDoctorMaxPerSlot(doctor);
    const counts = await getBookingCountsForDate(doctor, date);

    return slots.map((slot) => {
        const key = normalizeTimeToHHMM(slot.start);
        const booked = (key && counts[key]) ? counts[key] : 0;
        return {
            ...slot,
            ...computeSlotStatus(booked, maxPerSlot),
        };
    });
};
