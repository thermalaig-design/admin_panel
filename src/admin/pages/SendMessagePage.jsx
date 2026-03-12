import React, { useState } from 'react';
import { ChevronLeft, Send, Users, Star, Award, Loader, CheckCircle, AlertCircle, X } from 'lucide-react';
import supabase from '../../services/supabaseClient';

const RECIPIENT_OPTIONS = [
    {
        id: 'trustees',
        label: 'Trustees Only',
        icon: Star,
        color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
        activeColor: 'bg-yellow-500 text-white border-yellow-500',
    },
    {
        id: 'patrons',
        label: 'Patrons Only',
        icon: Award,
        color: 'bg-purple-100 text-purple-700 border-purple-300',
        activeColor: 'bg-purple-600 text-white border-purple-600',
    },
    {
        id: 'both',
        label: 'Both (Trustees & Patrons)',
        icon: Users,
        color: 'bg-indigo-100 text-indigo-700 border-indigo-300',
        activeColor: 'bg-indigo-600 text-white border-indigo-600',
    },
];

const SendMessagePage = ({ onNavigate }) => {
    const [selectedRecipient, setSelectedRecipient] = useState(null);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState(null);

    // Normalize a mobile number: strip spaces, dashes, brackets, leading +91 or 0
    const normalizeMobile = (num) => {
        if (!num) return '';
        let n = String(num).replace(/[\s\-().+]/g, '');
        // Remove country code prefix
        if (n.startsWith('91') && n.length > 10) n = n.slice(2);
        if (n.startsWith('0') && n.length > 10) n = n.slice(1);
        return n.slice(-10); // last 10 digits
    };

    const handleSend = async () => {
        if (!selectedRecipient) {
            alert('Please select recipients (Trustees / Patrons / Both)');
            return;
        }
        if (!title.trim()) {
            alert('Title is required');
            return;
        }
        if (!message.trim()) {
            alert('Message is required');
            return;
        }

        setSending(true);
        setResult(null);

        try {
            // ── Step 1: Fetch members from "Members Table" by type ──────────────
            let typeFilter;
            if (selectedRecipient === 'trustees') {
                typeFilter = ['Trustee'];
            } else if (selectedRecipient === 'patrons') {
                typeFilter = ['Patron'];
            } else {
                typeFilter = ['Trustee', 'Patron'];
            }

            const { data: membersData, error: membersError } = await supabase
                .from('Members Table')
                .select('"Mobile", "Membership number", type')
                .in('type', typeFilter);

            if (membersError) throw membersError;

            if (!membersData || membersData.length === 0) {
                setResult({
                    success: false,
                    error: `No ${selectedRecipient === 'both' ? 'Trustee/Patron' : selectedRecipient === 'trustees' ? 'Trustee' : 'Patron'} members found in the Members Table.`,
                });
                setSending(false);
                return;
            }

            // ── Step 2: Build a set of normalized mobile numbers ─────────────────
            const memberMobileSet = new Set();
            for (const m of membersData) {
                const normalized = normalizeMobile(m['Mobile']);
                if (normalized) memberMobileSet.add(normalized);
            }

            if (memberMobileSet.size === 0) {
                setResult({
                    success: false,
                    error: 'No valid mobile numbers found for the selected members.',
                });
                setSending(false);
                return;
            }

            // ── Step 3: Fetch all user_profiles (id + mobile) ───────────────────
            let allProfiles = [];
            let from = 0;
            const batchSize = 1000;
            let hasMore = true;

            while (hasMore) {
                const { data, error } = await supabase
                    .from('user_profiles')
                    .select('id, mobile')
                    .range(from, from + batchSize - 1);

                if (error) throw error;
                if (data && data.length > 0) {
                    allProfiles = [...allProfiles, ...data];
                    hasMore = data.length === batchSize;
                    from += batchSize;
                } else {
                    hasMore = false;
                }
            }

            // ── Step 4: Match – keep only profiles whose mobile is in the set ───
            const matchedProfiles = allProfiles.filter((p) => {
                const normalized = normalizeMobile(p.mobile);
                return normalized && memberMobileSet.has(normalized);
            });

            if (matchedProfiles.length === 0) {
                setResult({
                    success: false,
                    error: `None of the selected ${selectedRecipient === 'trustees' ? 'Trustees' : selectedRecipient === 'patrons' ? 'Patrons' : 'Trustees/Patrons'} have installed the app yet. No notifications sent.`,
                });
                setSending(false);
                return;
            }

            // ── Step 5: Build & insert notification rows ─────────────────────────
            const now = new Date().toISOString();
            const notificationRows = matchedProfiles.map((profile) => ({
                user_id: profile.id,
                title: title.trim(),
                message: message.trim(),
                is_read: false,
                type: `admin_broadcast_${selectedRecipient}`,
                target_audience: selectedRecipient,
                created_at: now,
            }));

            const BATCH = 500;
            let inserted = 0;
            for (let i = 0; i < notificationRows.length; i += BATCH) {
                const batch = notificationRows.slice(i, i + BATCH);
                const { error: insertError } = await supabase
                    .from('notifications')
                    .insert(batch);
                if (insertError) throw insertError;
                inserted += batch.length;
            }

            setResult({
                success: true,
                sent: inserted,
                totalMembers: membersData.length,
            });

            // Reset form
            setTitle('');
            setMessage('');
            setSelectedRecipient(null);
        } catch (err) {
            console.error('Send error:', err);
            setResult({
                success: false,
                error: err.message || 'Something went wrong. Please try again.',
            });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex-1 pb-10">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="px-4 sm:px-6 mt-6">
                    <div className="flex items-center gap-3 mb-6">
                        <button
                            onClick={() => onNavigate('home')}
                            className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600"
                            title="Back to Home"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Send Message</h2>
                            <p className="text-gray-500 text-sm mt-0.5">
                                Send in-app notifications to Trustees or Patrons
                            </p>
                        </div>
                    </div>
                </div>

                <div className="px-4 sm:px-6 space-y-6">
                    {/* Result Banner */}
                    {result && (
                        <div
                            className={`rounded-xl p-4 flex items-start gap-3 border ${result.success
                                ? 'bg-green-50 border-green-200'
                                : 'bg-red-50 border-red-200'
                                }`}
                        >
                            {result.success ? (
                                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            ) : (
                                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                                {result.success ? (
                                    <>
                                        <p className="font-semibold text-green-800">
                                            Notification sent successfully!
                                        </p>
                                        <p className="text-green-700 text-sm mt-1">
                                            Delivered to <strong>{result.sent}</strong> app user(s) out of <strong>{result.totalMembers}</strong> total members in selected category.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="font-semibold text-red-800">Error</p>
                                        <p className="text-red-700 text-sm mt-1">{result.error}</p>
                                    </>
                                )}
                            </div>
                            <button
                                onClick={() => setResult(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    {/* Step 1: Recipient Selection */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                        <h3 className="text-base font-bold text-gray-800 mb-1">
                            1. Select Recipients
                        </h3>
                        <p className="text-xs text-gray-500 mb-4">
                            Who should receive this notification? (Sent to all registered app users)
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            {RECIPIENT_OPTIONS.map((opt) => {
                                const Icon = opt.icon;
                                const isActive = selectedRecipient === opt.id;
                                return (
                                    <button
                                        key={opt.id}
                                        onClick={() => setSelectedRecipient(opt.id)}
                                        className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all ${isActive ? opt.activeColor : opt.color
                                            }`}
                                    >
                                        <Icon className="h-4 w-4 flex-shrink-0" />
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Step 2: Compose Message */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                        <h3 className="text-base font-bold text-gray-800 mb-1">
                            2. Compose Message
                        </h3>
                        <p className="text-xs text-gray-500 mb-4">
                            Write the notification title and message body
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Important Meeting, Notice, Announcement"
                                    maxLength={100}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 placeholder-gray-400 text-sm"
                                />
                                <p className="text-xs text-gray-400 mt-1 text-right">
                                    {title.length}/100
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Message <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Write your full message here..."
                                    rows={5}
                                    maxLength={1000}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 placeholder-gray-400 text-sm resize-none"
                                />
                                <p className="text-xs text-gray-400 mt-1 text-right">
                                    {message.length}/1000
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Step 3: Send */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                        <h3 className="text-base font-bold text-gray-800 mb-4">
                            3. Send Notification
                        </h3>

                        {/* Preview */}
                        <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Recipients:</span>
                                <span className="font-medium text-gray-800">
                                    {selectedRecipient
                                        ? RECIPIENT_OPTIONS.find((o) => o.id === selectedRecipient)?.label
                                        : '—'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Title:</span>
                                <span className="font-medium text-gray-800 truncate max-w-[200px]">
                                    {title || '—'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Message:</span>
                                <span className="font-medium text-gray-800 truncate max-w-[200px]">
                                    {message
                                        ? `${message.slice(0, 40)}${message.length > 40 ? '...' : ''}`
                                        : '—'}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={handleSend}
                            disabled={sending || !selectedRecipient || !title.trim() || !message.trim()}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
                        >
                            {sending ? (
                                <>
                                    <Loader className="h-4 w-4 animate-spin" />
                                    Sending notifications...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    Send Notification
                                </>
                            )}
                        </button>

                        {(!selectedRecipient || !title.trim() || !message.trim()) && (
                            <p className="text-xs text-gray-400 text-center mt-2">
                                Please select recipients and fill in the title and message
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SendMessagePage;
