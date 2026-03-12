import React, { useState, useEffect, useCallback } from 'react';
import {
    Clock, Search, Loader, RefreshCw, Users, CheckCircle2,
    XCircle, AlertTriangle, ChevronLeft, Stethoscope, CalendarDays,
    TrendingUp, BarChart3, AlertCircle, Zap
} from 'lucide-react';
import supabase from '../../services/supabaseClient';
import { getSlotAvailability } from '../../services/slotService';

function getTodayLocalISO() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function toLocalDateFromISO(isoDate) {
    const [y, m, d] = String(isoDate || '').split('-').map(Number);
    if (!y || !m || !d) return new Date();
    return new Date(y, m - 1, d);
}

function fmt12(time24) {
    if (!time24) return '';
    const [h, m] = time24.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return h12 + ':' + String(m).padStart(2, '0') + ' ' + ampm;
};

// ─── Mini slot card ───────────────────────────────────────────────────────────
const SlotCard = ({ slot }) => {
    let bg, dot, badgeClass, label;
    const fillPct = slot.max > 0 ? Math.min(100, (slot.booked / slot.max) * 100) : 0;

    if (slot.isFull) {
        bg = 'bg-red-50 border-red-200';
        dot = 'bg-red-500';
        badgeClass = 'bg-red-100 text-red-700';
        label = `${slot.booked}/${slot.max} Booked`;
    } else if (slot.status === 'limited') {
        bg = 'bg-amber-50 border-amber-200';
        dot = 'bg-amber-400';
        badgeClass = 'bg-amber-100 text-amber-700';
        label = `${slot.booked}/${slot.max} booked - ${slot.available} left`;
    } else {
        bg = 'bg-emerald-50 border-emerald-200';
        dot = 'bg-emerald-500';
        badgeClass = 'bg-emerald-100 text-emerald-700';
        label = `${slot.booked}/${slot.max} booked - ${slot.available} free`;
    }

    const barColor = slot.isFull ? 'bg-red-400' : slot.status === 'limited' ? 'bg-amber-400' : 'bg-emerald-400';

    return (
        <div className={`border rounded-2xl p-4 transition-all hover:shadow-md ${bg}`}>
            <div className="flex items-center gap-2 mb-3">
                <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${dot}`} />
                <span className="text-sm font-bold text-gray-800">{fmt12(slot.start)}</span>
                {slot.isFull && (
                    <span className="ml-auto">
                        <XCircle className="h-4 w-4 text-red-500" />
                    </span>
                )}
            </div>
            {/* Capacity bar */}
            <div className="h-2 bg-white rounded-full overflow-hidden mb-3 border border-black/5">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${fillPct}%` }}
                />
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeClass}`}>
                {label}
            </span>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const SlotAvailabilityPage = ({ onNavigate }) => {
    const [doctors, setDoctors] = useState([]);
    const [loadingDoctors, setLoadingDoctors] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedDate, setSelectedDate] = useState(() => getTodayLocalISO());
    const [opdType, setOpdType] = useState('general');
    const [slotFilter, setSlotFilter] = useState('all');

    const [slots, setSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [slotError, setSlotError] = useState(null);

    // Load doctors
    useEffect(() => {
        (async () => {
            setLoadingDoctors(true);
            const { data, error } = await supabase
                .from('opd_schedule')
                .select('*')
                .order('consultant_name', { ascending: true });

            if (error) {
                console.error('Failed to load doctors from opd_schedule:', error);
                setDoctors([]);
            } else {
                // Some deployments may not have is_active on opd_schedule.
                // Treat records as active unless explicitly false.
                const rows = (data || []).filter(d => d?.is_active !== false);
                setDoctors(rows);
            }
            setLoadingDoctors(false);
        })();
    }, []);

    // Auto-select first doctor
    useEffect(() => {
        if (doctors.length > 0 && !selectedDoctor) {
            setSelectedDoctor(doctors[0]);
        }
    }, [doctors]);

    // Fetch slots
    const fetchSlots = useCallback(async () => {
        if (!selectedDoctor || !selectedDate) { setSlots([]); return; }
        setLoadingSlots(true);
        setSlotError(null);
        try {
            const result = await getSlotAvailability(selectedDoctor, selectedDate, opdType);
            setSlots(result);
            setLastRefreshed(new Date());
        } catch (err) {
            setSlotError('Could not load slot data. Please try again.');
        } finally {
            setLoadingSlots(false);
        }
    }, [selectedDoctor, selectedDate, opdType]);

    useEffect(() => {
        fetchSlots();
    }, [fetchSlots]);

    // Filtered doctors list
    const filteredDoctors = doctors.filter(d =>
        !searchQuery || d.consultant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.department?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Stats
    const totalSlots = slots.length;
    const fullSlots = slots.filter(s => s.isFull).length;
    const limitedSlots = slots.filter(s => s.status === 'limited').length;
    const availableSlots = slots.filter(s => s.status === 'available').length;
    const totalBooked = slots.reduce((sum, s) => sum + (s.booked || 0), 0);
    const totalCapacity = slots.reduce((sum, s) => sum + (s.max || 0), 0);
    const utilization = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0;
    const displayedSlots = slots.filter(s => (slotFilter === 'all' ? true : s.status === slotFilter));

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-blue-50/20">

            {/* ─── Header ─── */}
            <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-gray-200 shadow-sm">
                <div className="px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => onNavigate?.('home')}
                            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md">
                            <Clock className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">Slot Availability</h1>
                            <p className="text-xs text-gray-500 hidden sm:block">Real-time OPD slot monitoring</p>
                        </div>
                    </div>

                    <button
                        onClick={fetchSlots}
                        disabled={loadingSlots}
                        className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-sm font-semibold hover:bg-indigo-100 transition-colors disabled:opacity-40"
                    >
                        <RefreshCw className={`h-4 w-4 ${loadingSlots ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-0 h-[calc(100vh-70px)]">

                {/* ─── Left: Doctor List Sidebar ─── */}
                <div className="lg:w-80 xl:w-96 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
                    {/* Search */}
                    <div className="p-4 border-b border-gray-100 flex-shrink-0">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search doctors..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 text-sm font-medium"
                            />
                        </div>
                    </div>

                    {/* Doctor List */}
                    <div className="flex-1 overflow-y-auto">
                        {loadingDoctors ? (
                            <div className="flex items-center justify-center py-12 gap-2 text-indigo-500">
                                <Loader className="h-5 w-5 animate-spin" />
                                <span className="text-sm">Loading doctors...</span>
                            </div>
                        ) : filteredDoctors.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                <Stethoscope className="h-10 w-10 mb-3 opacity-50" />
                                <p className="text-sm">No doctors found</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {filteredDoctors.map(doc => {
                                    const isSelected = selectedDoctor?.id === doc.id;
                                    const isOnLeave = doc.is_available === false;
                                    return (
                                        <button
                                            key={doc.id}
                                            onClick={() => setSelectedDoctor(doc)}
                                            className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-all hover:bg-indigo-50 ${isSelected ? 'bg-indigo-50 border-r-3 border-r-indigo-600' : ''
                                                }`}
                                        >
                                            {/* Avatar */}
                                            {doc.doctor_image_url ? (
                                                <img
                                                    src={doc.doctor_image_url}
                                                    alt={doc.consultant_name}
                                                    className="h-10 w-10 rounded-xl object-cover border border-gray-200 flex-shrink-0"
                                                />
                                            ) : (
                                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-indigo-100' : 'bg-gray-100'
                                                    }`}>
                                                    <Stethoscope className={`h-5 w-5 ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`} />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-semibold truncate ${isSelected ? 'text-indigo-700' : 'text-gray-800'}`}>
                                                    {doc.consultant_name}
                                                </p>
                                                {doc.department && (
                                                    <p className="text-xs text-gray-500 truncate">{doc.department}</p>
                                                )}
                                            </div>
                                            {isOnLeave && (
                                                <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                                                    Leave
                                                </span>
                                            )}
                                            {isSelected && (
                                                <div className="h-2 w-2 bg-indigo-600 rounded-full flex-shrink-0" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── Right: Slot View ─── */}
                <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/30 to-blue-50/20">
                    {!selectedDoctor ? (
                        <div className="flex flex-col items-center justify-center h-full py-24 text-gray-400">
                            <Stethoscope className="h-16 w-16 mb-4 opacity-30" />
                            <p className="text-lg font-semibold">Select a Doctor</p>
                            <p className="text-sm mt-1">Choose a doctor from the list to view slot availability.</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto">
                            <div className="p-4 sm:p-6 space-y-5">

                            {/* Doctor Header */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                {selectedDoctor.doctor_image_url ? (
                                    <img
                                        src={selectedDoctor.doctor_image_url}
                                        alt={selectedDoctor.consultant_name}
                                        className="h-16 w-16 rounded-2xl object-cover border-2 border-indigo-100"
                                    />
                                ) : (
                                    <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center border-2 border-indigo-100">
                                        <Stethoscope className="h-8 w-8 text-indigo-500" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold text-gray-900">{selectedDoctor.consultant_name}</h2>
                                    {selectedDoctor.department && (
                                        <p className="text-sm text-indigo-600 font-medium">{selectedDoctor.department}</p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Max {selectedDoctor.max_patients_per_slot || 4} patients per slot
                                    </p>
                                </div>
                                {lastRefreshed && (
                                    <p className="text-xs text-gray-400 flex-shrink-0">
                                        Updated {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                )}
                            </div>

                            {/* Date + Type Controls */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
                                <div className="flex-1">
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date</label>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={e => setSelectedDate(e.target.value)}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                                    />
                                </div>
                                <div className="sm:w-56">
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">OPD Type</label>
                                    <div className="flex rounded-xl overflow-hidden border border-gray-200">
                                        {['general', 'private'].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setOpdType(type)}
                                                className={`flex-1 py-2.5 text-sm font-semibold capitalize transition-all ${opdType === type
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-white text-gray-600 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Summary Stats */}
                            {totalSlots > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {[
                                        { label: 'Total Slots', value: totalSlots, icon: Clock, color: 'indigo', sub: `${totalCapacity} capacity` },
                                        { label: 'Available', value: availableSlots, icon: CheckCircle2, color: 'emerald', sub: 'slots free' },
                                        { label: 'Almost Full', value: limitedSlots, icon: AlertTriangle, color: 'amber', sub: '1 slot left' },
                                        { label: 'Full Slots', value: fullSlots, icon: XCircle, color: 'red', sub: 'no vacancy' },
                                    ].map((s, i) => {
                                        const colorMap = {
                                            indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
                                            emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                                            amber: 'bg-amber-50 text-amber-600 border-amber-100',
                                            red: 'bg-red-50 text-red-600 border-red-100',
                                        };
                                        return (
                                            <div key={i} className={`${colorMap[s.color]} rounded-2xl border p-4 shadow-sm`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <s.icon className="h-5 w-5 opacity-60" />
                                                    <span className="text-2xl font-black">{s.value}</span>
                                                </div>
                                                <p className="text-xs font-bold">{s.label}</p>
                                                <p className="text-xs opacity-70 mt-0.5">{s.sub}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Utilization bar */}
                            {totalSlots > 0 && (
                                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Zap className="h-4 w-4 text-indigo-500" />
                                            <span className="text-sm font-bold text-gray-700">Overall Utilization</span>
                                        </div>
                                        <span className={`text-sm font-black ${utilization >= 80 ? 'text-red-600' : utilization >= 50 ? 'text-amber-600' : 'text-emerald-600'
                                            }`}>{utilization}%</span>
                                    </div>
                                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ${utilization >= 80 ? 'bg-red-500' : utilization >= 50 ? 'bg-amber-400' : 'bg-emerald-500'
                                                }`}
                                            style={{ width: `${utilization}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">{totalBooked} booked out of {totalCapacity} total capacity</p>
                                </div>
                            )}

                            {/* Loading */}
                            {loadingSlots && (
                                <div className="flex items-center justify-center gap-3 py-16 text-indigo-500">
                                    <Loader className="h-7 w-7 animate-spin" />
                                    <span className="text-sm font-medium">Loading slots...</span>
                                </div>
                            )}

                            {/* Error */}
                            {slotError && (
                                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
                                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                    <span>{slotError}</span>
                                </div>
                            )}

                            {/* No slots */}
                            {!loadingSlots && !slotError && slots.length === 0 && (
                                <div className="flex flex-col items-center gap-3 py-16 text-gray-400 bg-white rounded-2xl border border-gray-200">
                                    <CalendarDays className="h-12 w-12 opacity-40" />
                                    <p className="text-base font-semibold text-gray-500">No OPD Schedule</p>
                                    <p className="text-sm text-center max-w-xs">
                                        This doctor has no {opdType} OPD slots configured for{' '}
                                        <strong>{toLocalDateFromISO(selectedDate).toLocaleDateString('en-IN', { weekday: 'long' })}</strong>.
                                        Set up the doctor's schedule in the Doctors section.
                                    </p>
                                    <button
                                        onClick={() => onNavigate?.('doctors')}
                                        className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
                                    >
                                        Go to Doctors
                                    </button>
                                </div>
                            )}

                            {/* Slot Grid */}
                            {!loadingSlots && !slotError && slots.length > 0 && (
                                <>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold text-gray-700">
                                            {toLocalDateFromISO(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        </h3>
                                        <span className="text-xs text-gray-400">{displayedSlots.length} of {slots.length} slots</span>
                                        {/* Legend */}
                                        <div className="ml-auto flex items-center gap-3 text-xs text-gray-500">
                                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />Available</span>
                                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400 inline-block" />Limited</span>
                                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500 inline-block" />Full</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { key: 'all', label: `All (${slots.length})` },
                                            { key: 'available', label: `Available (${availableSlots})` },
                                            { key: 'limited', label: `Limited (${limitedSlots})` },
                                            { key: 'full', label: `Full (${fullSlots})` },
                                        ].map((f) => (
                                            <button
                                                key={f.key}
                                                onClick={() => setSlotFilter(f.key)}
                                                className={`px-3 py-1.5 text-xs rounded-full border font-semibold transition-colors ${slotFilter === f.key
                                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {f.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                        {displayedSlots.map(slot => <SlotCard key={slot.start} slot={slot} />)}
                                    </div>
                                </>
                            )}

                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SlotAvailabilityPage;
