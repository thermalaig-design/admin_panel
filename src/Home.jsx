import React, { useState, useEffect } from 'react';
import { Database, Calendar, HeartPulse, Stethoscope, Activity, Users, Building2, Clock, TrendingUp, ArrowRight, Bell, LogOut, Camera } from 'lucide-react';
import NotificationsSection from './admin/components/NotificationsSection';
import { getAllAppointmentsAdmin, getAllReferralsAdmin } from './admin/services/adminApi';
import { getAllNotifications } from './services/notificationsApi';
import PublicSponsorDisplay from './components/PublicSponsorDisplay';

const Home = ({ onNavigate, onLogout }) => {
  const [statsData, setStatsData] = useState({
    appointments: 0,
    referrals: 0,
    notifications: 0
  });

  const loadStatsData = async () => {
    try {
      const [appointmentsRes, referralsRes, notificationsRes] = await Promise.allSettled([
        getAllAppointmentsAdmin(),
        getAllReferralsAdmin(),
        getAllNotifications()
      ]);
      
      setStatsData({
        appointments: appointmentsRes.status === 'fulfilled' ? (appointmentsRes.value.data || appointmentsRes.value || []).length : 0,
        referrals: referralsRes.status === 'fulfilled' ? (referralsRes.value.data || referralsRes.value || []).length : 0,
        notifications: notificationsRes.status === 'fulfilled' ? (notificationsRes.value || []).length : 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  useEffect(() => {
    loadStatsData();
  }, []);

  const adminActions = [
    { 
      id: 'directory', 
      title: 'Directory', 
      desc: 'Manage Members, Hospitals, Doctors', 
      icon: Database, 
      gradient: 'from-blue-500 to-indigo-600',
      lightBg: 'bg-blue-50',
      screen: 'main' 
    },
    { 
      id: 'appointments', 
      title: 'Appointments', 
      desc: 'Schedule & Manage Appointments', 
      icon: Calendar, 
      gradient: 'from-emerald-500 to-teal-600',
      lightBg: 'bg-emerald-50',
      screen: 'appointments' 
    },
    { 
      id: 'referrals', 
      title: 'Patient Referrals', 
      desc: 'Refer & Track Patients', 
      icon: HeartPulse, 
      gradient: 'from-rose-500 to-pink-600',
      lightBg: 'bg-rose-500',
      screen: 'referrals' 
    },
    { 
      id: 'gallery', 
      title: 'Gallery', 
      desc: 'Upload & Manage Photos', 
      icon: Camera, 
      gradient: 'from-indigo-500 to-purple-600',
      lightBg: 'bg-indigo-50',
      screen: 'gallery' 
    },
  ];

  const quickStats = [
    { label: 'Total Appointments', value: statsData.appointments, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-100', clickable: true, screen: 'appointments' },
    { label: 'Total Referrals', value: statsData.referrals, icon: HeartPulse, color: 'text-rose-600', bg: 'bg-rose-100', clickable: true, screen: 'referrals' },
    { label: 'Total Notifications', value: statsData.notifications, icon: Bell, color: 'text-amber-600', bg: 'bg-amber-100', clickable: false },
  ];

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <header className="w-full border-b border-gray-200 bg-white/80 backdrop-blur-xl shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-800 tracking-tight">Admin Panel</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Hospital Management System</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-full hover:bg-red-100 transition-colors"
                >
                  <LogOut className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-600 font-medium">Logout</span>
                </button>
              </div>
          </div>
        </div>
      </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          <div className="grid grid-cols-3 gap-4 lg:gap-6 mb-8 lg:mb-12">
            {quickStats.map((stat, index) => (
              <div 
                key={index}
                onClick={() => stat.clickable && onNavigate(stat.screen)}
                className={`bg-white border border-gray-200 rounded-2xl p-4 lg:p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-300 ${stat.clickable ? 'cursor-pointer' : ''}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 lg:p-3 ${stat.bg} rounded-xl`}>
                    <stat.icon className={`h-4 w-4 lg:h-5 lg:w-5 ${stat.color}`} />
                  </div>
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="text-2xl lg:text-3xl font-bold text-gray-800 mb-1">{stat.value}</p>
                <p className="text-xs lg:text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>

        <div className="mb-8 lg:mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-gray-800">Quick Actions</h2>
              <p className="text-sm text-gray-500 mt-1">Access key features of the system</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {adminActions.map((action) => (
              <button
                key={action.id}
                onClick={() => onNavigate(action.screen)}
                className="group relative overflow-hidden rounded-2xl lg:rounded-3xl bg-white border border-gray-200 p-5 lg:p-6 text-left hover:shadow-xl hover:border-gray-300 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                
                <div className="relative z-10">
                  <div className={`inline-flex p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-gradient-to-br ${action.gradient} mb-4 lg:mb-5 group-hover:scale-110 transition-transform duration-500 shadow-lg`}>
                    <action.icon className="h-6 w-6 lg:h-7 lg:w-7 text-white" />
                  </div>
                  
                  <h3 className="text-lg lg:text-xl font-bold text-gray-800 mb-2 group-hover:text-gray-900 transition-colors">{action.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">{action.desc}</p>
                  
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-400 group-hover:text-gray-600 transition-colors">
                    <span>Open</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>

                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${action.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}></div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          <div className="xl:col-span-2">
            <NotificationsSection />
          </div>
          
          <div className="bg-white border border-gray-200 rounded-2xl lg:rounded-3xl p-5 lg:p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {[
                { text: 'New doctor registration approved', time: '2 mins ago', color: 'bg-emerald-500' },
                { text: 'Patient referral completed', time: '15 mins ago', color: 'bg-blue-500' },
                { text: 'Appointment scheduled', time: '1 hour ago', color: 'bg-amber-500' },
                { text: 'Medical record updated', time: '2 hours ago', color: 'bg-violet-500' },
                { text: 'New hospital added', time: '3 hours ago', color: 'bg-rose-500' },
              ].map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className={`w-2 h-2 ${activity.color} rounded-full mt-2 flex-shrink-0`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{activity.text}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sponsor Section */}
        <div className="mt-8 lg:mt-12">
          <PublicSponsorDisplay />
        </div>
      </main>
    </div>
  );
};

export default Home;