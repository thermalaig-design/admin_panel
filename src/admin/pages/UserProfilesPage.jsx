import React, { useState, useEffect } from 'react';
import { ChevronLeft, Search, Loader, Phone, Mail, MapPin, User, Calendar, Eye, EyeOff } from 'lucide-react';
import supabase from '../../services/supabaseClient';

const UserProfilesPage = ({ onNavigate }) => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading profiles:', error);
        setProfiles([]);
      } else {
        setProfiles(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch =
      (profile.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (profile.user_identifier?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (profile.email?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (profile.mobile?.includes(searchQuery)) ||
      (profile.member_id?.toLowerCase().includes(searchQuery.toLowerCase()));

    if (filter === 'all') return matchesSearch;
    if (filter === 'elected') return matchesSearch && profile.is_elected_member;
    if (filter === 'nodata') return matchesSearch && !profile.name;
    return matchesSearch;
  });

  const StatBox = ({ label, value, icon: Icon, color }) => (
    <div className="bg-white rounded-xl p-4 border border-gray-200 flex items-center gap-3">
      <div className={`p-3 ${color} rounded-lg`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 pb-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="px-4 sm:px-6 mt-6">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => onNavigate('home')}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600"
              title="Go back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">User Profiles</h2>
              <p className="text-gray-600 text-sm mt-1">View and manage all user profiles and their data</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatBox
            label="Total Users"
            value={profiles.length}
            icon={User}
            color="bg-blue-100"
          />
          <StatBox
            label="With Contact"
            value={profiles.filter(p => p.mobile || p.email).length}
            icon={Phone}
            color="bg-green-100"
          />
          <StatBox
            label="Elected Members"
            value={profiles.filter(p => p.is_elected_member).length}
            icon={Calendar}
            color="bg-yellow-100"
          />
          <StatBox
            label="Complete Profiles"
            value={profiles.filter(p => p.name && p.email && p.mobile).length}
            icon={Eye}
            color="bg-purple-100"
          />
        </div>

        {/* Search and Filter */}
        <div className="px-4 sm:px-6 mb-6 space-y-3">
          <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3 border border-gray-200 focus-within:border-indigo-300 transition-all">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone, member ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 placeholder-gray-400 text-sm py-2"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'elected', 'nodata'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
              >
                {f === 'all' ? 'All' : f === 'elected' ? 'Elected Members' : 'Incomplete'}
              </button>
            ))}
          </div>
        </div>

        {/* Profiles List */}
        {loading ? (
          <div className="px-4 sm:px-6 text-center py-16">
            <Loader className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
            <p className="text-gray-600 mt-2">Loading profiles...</p>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="px-4 sm:px-6 text-center py-16 bg-gray-50 rounded-xl mx-4 sm:mx-6">
            <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-gray-800 font-bold mb-1">No profiles found</h3>
            <p className="text-gray-500 text-sm">Try searching with different keywords</p>
          </div>
        ) : (
          <div className="px-4 sm:px-6 space-y-3">
            {filteredProfiles.map((profile) => (
              <div
                key={profile.id}
                onClick={() => setSelectedProfile(selectedProfile?.id === profile.id ? null : profile)}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
              >
                {/* Main Row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-800 truncate">
                        {profile.name || 'N/A'}
                      </h3>
                      {profile.is_elected_member && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-semibold">
                          Elected
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-3">
                      ID: {profile.user_identifier || profile.member_id || 'N/A'}
                    </p>

                    {/* Quick Info */}
                    <div className="flex flex-wrap gap-3 text-sm">
                      {profile.mobile && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <Phone className="h-4 w-4 text-green-600" />
                          <span>{profile.mobile}</span>
                        </div>
                      )}
                      {profile.email && (
                        <div className="flex items-center gap-1 text-gray-600 truncate">
                          <Mail className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          <span className="truncate">{profile.email}</span>
                        </div>
                      )}
                      {profile.location && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <MapPin className="h-4 w-4 text-red-600" />
                          <span>{profile.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-400">
                    {new Date(profile.created_at).toLocaleDateString('en-IN')}
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedProfile?.id === profile.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs font-semibold mb-1">PERSONAL INFO</p>
                        <div className="space-y-2">
                          <div>
                            <p className="text-gray-500 text-xs">Date of Birth</p>
                            <p className="text-gray-800 font-medium">
                              {profile.dob ? new Date(profile.dob).toLocaleDateString('en-IN') : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Gender</p>
                            <p className="text-gray-800 font-medium">{profile.gender || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Blood Group</p>
                            <p className="text-gray-800 font-medium">{profile.blood_group || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Nationality</p>
                            <p className="text-gray-800 font-medium">{profile.nationality || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-gray-500 text-xs font-semibold mb-1">CONTACT INFO</p>
                        <div className="space-y-2">
                          <div>
                            <p className="text-gray-500 text-xs">Mobile</p>
                            <p className="text-gray-800 font-medium">{profile.mobile || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Email</p>
                            <p className="text-gray-800 font-medium text-xs truncate">{profile.email || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">WhatsApp</p>
                            <p className="text-gray-800 font-medium">{profile.whatsapp || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-gray-500 text-xs font-semibold mb-1">ADDRESS</p>
                        <div className="space-y-2">
                          <div>
                            <p className="text-gray-500 text-xs">Home Address</p>
                            <p className="text-gray-800 font-medium text-xs">{profile.address_home || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Office Address</p>
                            <p className="text-gray-800 font-medium text-xs">{profile.address_office || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-gray-500 text-xs font-semibold mb-1">PROFESSIONAL</p>
                        <div className="space-y-2">
                          <div>
                            <p className="text-gray-500 text-xs">Position</p>
                            <p className="text-gray-800 font-medium">{profile.position || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Company</p>
                            <p className="text-gray-800 font-medium">{profile.company_name || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Role</p>
                            <p className="text-gray-800 font-medium">{profile.role || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-gray-500 text-xs font-semibold mb-1">EMERGENCY</p>
                        <div className="space-y-2">
                          <div>
                            <p className="text-gray-500 text-xs">Contact Name</p>
                            <p className="text-gray-800 font-medium">{profile.emergency_contact_name || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Contact Number</p>
                            <p className="text-gray-800 font-medium">{profile.emergency_contact_number || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-gray-500 text-xs font-semibold mb-1">FAMILY</p>
                        <div className="space-y-2">
                          <div>
                            <p className="text-gray-500 text-xs">Spouse Name</p>
                            <p className="text-gray-800 font-medium">{profile.spouse_name || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Children</p>
                            <p className="text-gray-800 font-medium">{profile.children_count || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-gray-500 text-xs font-semibold mb-1">SOCIAL MEDIA</p>
                        <div className="space-y-1 text-xs">
                          {profile.facebook && <p className="text-blue-600">Facebook: {profile.facebook}</p>}
                          {profile.twitter && <p className="text-sky-500">Twitter: {profile.twitter}</p>}
                          {profile.instagram && <p className="text-pink-600">Instagram: {profile.instagram}</p>}
                          {profile.linkedin && <p className="text-blue-700">LinkedIn: {profile.linkedin}</p>}
                          {!profile.facebook && !profile.twitter && !profile.instagram && !profile.linkedin && (
                            <p className="text-gray-400">No social media</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-gray-500 text-xs font-semibold mb-1">OTHER INFO</p>
                        <div className="space-y-2">
                          <div>
                            <p className="text-gray-500 text-xs">Aadhaar ID</p>
                            <p className="text-gray-800 font-medium">{profile.aadhaar_id || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Marital Status</p>
                            <p className="text-gray-800 font-medium">{profile.marital_status || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfilesPage;
