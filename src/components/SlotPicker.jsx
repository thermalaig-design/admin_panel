/**
 * SlotPicker.jsx
 * User-facing slot selector that shows live availability.
 * Green = available, Amber = limited (1 left), Red = full (disabled).
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Loader, RefreshCw, AlertCircle, Users, CheckCircle } from 'lucide-react';
import { getSlotAvailability } from '../services/slotService';

function fmt12(time24) {
    if (!time24) return '';
    const [h, m] = time24.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

const SlotPicker = ({
    doctor,
    date,
    opdType = 'general', // 'general' | 'private'
    selectedSlot,
    onSlotSelect,
    className = '',
}) => {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchSlots = useCallback(async () => {
        if (!doctor || !date) {
            setSlots([]);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const result = await getSlotAvailability(doctor, date, opdType);
            setSlots(result);
        } catch (err) {
            setError('Could not load slots. Please try again.');
            console.error('SlotPicker error:', err);
        } finally {
            setLoading(false);
        }
    }, [doctor?.id, date, opdType]);

    useEffect(() => {
        fetchSlots();
    }, [fetchSlots]);

    if (!doctor || !date) {
        return (
            <div className={`flex items-center gap-2 text-gray-400 text-sm p-4 ${className}`}>
                <Clock className="h-4 w-4" />
                <span>Select a doctor and date to see available slots.</span>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={`flex items-center gap-2 text-indigo-500 text-sm p-4 ${className}`}>
                <Loader className="h-4 w-4 animate-spin" />
                <span>Loading slots...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`flex items-center gap-2 text-red-500 text-sm p-3 bg-red-50 rounded-xl ${className}`}>
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
                <button onClick={fetchSlots} className="ml-auto text-red-400 hover:text-red-600">
                    <RefreshCw className="h-4 w-4" />
                </button>
            </div>
        );
    }

    if (slots.length === 0) {
        return (
            <div className={`flex items-center gap-2 text-gray-400 text-sm p-4 bg-gray-50 rounded-xl ${className}`}>
                <AlertCircle className="h-4 w-4" />
                <span>No slots available for this day. The doctor may not have OPD scheduled.</span>
            </div>
        );
    }

    const availableCount = slots.filter(s => !s.isFull).length;
    const totalCount = slots.length;

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Header stats */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4 text-indigo-500" />
                    <span>
                        <span className="font-semibold text-indigo-700">{availableCount}</span> of {totalCount} slots available
                    </span>
                </div>
                <button
                    type="button"
                    onClick={fetchSlots}
                    className="text-gray-400 hover:text-indigo-500 transition-colors"
                    title="Refresh"
                >
                    <RefreshCw className="h-4 w-4" />
                </button>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
                    Available
                </span>
                <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400 inline-block" />
                    Almost Full
                </span>
                <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400 inline-block" />
                    Full
                </span>
            </div>

            {/* Slot Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {slots.map(slot => {
                    const isSelected = selectedSlot === slot.start;

                    let baseClass, dotColor, badgeClass;
                    if (slot.isFull) {
                        baseClass = 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-70';
                        dotColor = 'bg-red-400';
                        badgeClass = 'bg-red-100 text-red-600';
                    } else if (slot.status === 'limited') {
                        baseClass = isSelected
                            ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-100'
                            : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100 hover:border-amber-400 cursor-pointer';
                        dotColor = 'bg-amber-400';
                        badgeClass = isSelected ? 'bg-amber-400 text-white' : 'bg-amber-100 text-amber-700';
                    } else {
                        baseClass = isSelected
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100'
                            : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-400 cursor-pointer';
                        dotColor = 'bg-emerald-500';
                        badgeClass = isSelected ? 'bg-indigo-500 text-white' : 'bg-emerald-100 text-emerald-700';
                    }

                    return (
                        <button
                            key={slot.start}
                            type="button"
                            disabled={slot.isFull}
                            onClick={() => !slot.isFull && onSlotSelect?.(slot.start)}
                            className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-150 ${baseClass}`}
                        >
                            {/* Selected indicator */}
                            {isSelected && (
                                <CheckCircle className="absolute top-1.5 right-1.5 h-3.5 w-3.5 text-white opacity-80" />
                            )}

                            {/* Dot */}
                            <span className={`h-2 w-2 rounded-full ${dotColor} mb-1.5`} />

                            {/* Time */}
                            <span className="text-sm font-bold leading-tight">{fmt12(slot.start)}</span>

                            {/* Availability badge */}
                            <span className={`mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${badgeClass}`}>
                                {slot.isFull
                                    ? 'Slots Full'
                                    : slot.status === 'limited'
                                        ? `${slot.available} left`
                                        : `${slot.available} free`
                                }
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Selected slot summary */}
            {selectedSlot && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-sm">
                    <Clock className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                    <span className="text-indigo-800 font-medium">
                        Selected: <strong>{fmt12(selectedSlot)}</strong>
                    </span>
                </div>
            )}
        </div>
    );
};

export default SlotPicker;
