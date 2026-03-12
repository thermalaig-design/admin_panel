/**
 * SlotAvailabilityView.jsx
 * Admin panel component: shows real-time slot usage for a selected doctor + date.
 * Displays each slot as Full / Partial / Available with patient counts.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Loader, RefreshCw, Users, AlertCircle, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { getSlotAvailability } from '../../services/slotService';

function fmt12(time24) {
    if (!time24) return '';
    const [h, m] = time24.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

const SlotAvailabilityView = ({ doctor, date, opdType = 'general', onSlotClick }) => {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastRefreshed, setLastRefreshed] = useState(null);

    const fetchAvailability = useCallback(async () => {
        if (!doctor || !date) { setSlots([]); return; }
        setLoading(true);
        setError(null);
        try {
            const result = await getSlotAvailability(doctor, date, opdType);
            setSlots(result);
            setLastRefreshed(new Date());
        } catch (err) {
            setError('Failed to load slot data.');
        } finally {
            setLoading(false);
        }
    }, [doctor?.id, date, opdType]);

    useEffect(() => {
        fetchAvailability();
    }, [fetchAvailability]);

    if (!doctor || !date) {
        return (
            <div className="flex items-center gap-2 text-gray-400 text-sm p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <Clock className="h-5 w-5" />
                <span>Select a doctor and date to see slot availability.</span>
            </div>
        );
    }

    const totalSlots = slots.length;
    const fullSlots = slots.filter(s => s.isFull).length;
    const partialSlots = slots.filter(s => s.status === 'limited').length;
    const availableSlots = slots.filter(s => s.status === 'available').length;
    const totalBooked = slots.reduce((sum, s) => sum + s.booked, 0);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-gray-800">
                        Slot Availability — {doctor.consultant_name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        {lastRefreshed && (
                            <span className="ml-2 text-gray-400">
                                · Updated {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                    </p>
                </div>
                <button
                    onClick={fetchAvailability}
                    disabled={loading}
                    className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-3 py-1.5 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Summary Stats */}
            {totalSlots > 0 && (
                <div className="grid grid-cols-4 gap-2">
                    {[
                        { label: 'Total Slots', value: totalSlots, icon: Clock, color: 'bg-gray-50 text-gray-600 border-gray-200' },
                        { label: 'Booked', value: totalBooked, icon: Users, color: 'bg-blue-50 text-blue-600 border-blue-100' },
                        { label: 'Full Slots', value: fullSlots, icon: XCircle, color: 'bg-red-50 text-red-600 border-red-100' },
                        { label: 'Available', value: availableSlots, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                    ].map((stat, i) => (
                        <div key={i} className={`rounded-xl border p-3 text-center ${stat.color}`}>
                            <p className="text-xl font-bold">{stat.value}</p>
                            <p className="text-xs font-medium mt-0.5">{stat.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center gap-2 py-8 text-indigo-500">
                    <Loader className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Loading slots...</span>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* No Slots */}
            {!loading && !error && slots.length === 0 && (
                <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-sm">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <span>No OPD slots found for this doctor on the selected day of the week.</span>
                </div>
            )}

            {/* Slot Grid */}
            {!loading && slots.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {slots.map(slot => {
                        let cardClass, dotColor, badgeClass, statusLabel;

                        if (slot.isFull) {
                            cardClass = 'bg-red-50 border-red-200 hover:border-red-300';
                            dotColor = 'bg-red-500';
                            badgeClass = 'bg-red-100 text-red-700';
                            statusLabel = `${slot.booked}/${slot.max} Full`;
                        } else if (slot.status === 'limited') {
                            cardClass = 'bg-amber-50 border-amber-200 hover:border-amber-300';
                            dotColor = 'bg-amber-400';
                            badgeClass = 'bg-amber-100 text-amber-700';
                            statusLabel = `${slot.booked}/${slot.max} • 1 left`;
                        } else {
                            cardClass = 'bg-emerald-50 border-emerald-200 hover:border-emerald-300';
                            dotColor = 'bg-emerald-500';
                            badgeClass = 'bg-emerald-100 text-emerald-700';
                            statusLabel = `${slot.booked}/${slot.max} booked`;
                        }

                        // Capacity bar
                        const fillPct = slot.max > 0 ? Math.min(100, (slot.booked / slot.max) * 100) : 0;
                        const barColor = slot.isFull ? 'bg-red-400' : slot.status === 'limited' ? 'bg-amber-400' : 'bg-emerald-400';

                        return (
                            <div
                                key={slot.start}
                                className={`border rounded-xl p-3 cursor-pointer transition-all hover:shadow-sm ${cardClass}`}
                                onClick={() => onSlotClick?.(slot)}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`h-2 w-2 rounded-full flex-shrink-0 ${dotColor}`} />
                                    <span className="text-sm font-bold text-gray-800">{fmt12(slot.start)}</span>
                                </div>

                                {/* Capacity bar */}
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                                    <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${fillPct}%` }} />
                                </div>

                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeClass}`}>
                                    {statusLabel}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SlotAvailabilityView;
