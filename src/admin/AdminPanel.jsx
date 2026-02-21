import React, { useState } from 'react';
import { Shield, Users, Home as HomeIcon, Calendar, Building2, LogOut } from 'lucide-react';
import DirectoryMain from './pages/DirectoryMain';
import CommitteeMembersPage from './pages/CommitteeMembersPage';
import TrusteeMembersPage from './pages/TrusteeMembersPage';
import PatronMembersPage from './pages/PatronMembersPage';
import ElectedMembersPage from './pages/ElectedMembersPage';
import HospitalsPage from './pages/HospitalsPage';
import DoctorsPage from './pages/DoctorsPage';
import AppointmentsPage from './pages/AppointmentsPage';
import ReferralsPage from './pages/ReferralsPage';
import SponsorsPage from './pages/SponsorsPage';
import GalleryPage from './pages/GalleryPage';

const TopNavBar = ({ onNavigate, onLogout }) => (
  <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
    <div className="flex items-center gap-2">
      <Shield className="h-5 w-5 text-indigo-600" />
      <span className="font-bold text-gray-800">Admin Panel</span>
    </div>
    <div className="flex items-center gap-4">
      <button
        onClick={() => onNavigate('home')}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-indigo-600 flex items-center gap-2"
      >
        <HomeIcon className="h-5 w-5" />
        <span className="hidden sm:inline text-sm">Home</span>
      </button>
      <button
        onClick={onLogout}
        className="p-2 rounded-lg hover:bg-red-50 transition-colors text-red-600 flex items-center gap-2"
      >
        <LogOut className="h-5 w-5" />
        <span className="hidden sm:inline text-sm">Logout</span>
      </button>
    </div>
  </div>
);

const AdminPanel = ({ onNavigate, onLogout, initialView = 'main' }) => {
  const [currentView, setCurrentView] = useState(initialView === 'referrals' ? 'referrals' : initialView);

  const handleNavigate = (view) => {
    setCurrentView(view);
  };

  const renderCurrentView = () => {
    switch(currentView) {
      case 'main':
        return <DirectoryMain onNavigate={handleNavigate} onHomeNavigate={onNavigate} />;
      case 'committee':
        return <CommitteeMembersPage onNavigate={handleNavigate} />;
      case 'trustees':
        return <TrusteeMembersPage onNavigate={handleNavigate} />;
      case 'patrons':
        return <PatronMembersPage onNavigate={handleNavigate} />;
      case 'elected':
        return <ElectedMembersPage onNavigate={handleNavigate} />;
      case 'hospitals':
        return <HospitalsPage onNavigate={handleNavigate} />;
      case 'doctors':
        return <DoctorsPage onNavigate={handleNavigate} />;
        case 'appointments':
          return <AppointmentsPage onNavigate={handleNavigate} />;
        case 'referrals':
          return <ReferralsPage onNavigate={handleNavigate} />;
        case 'sponsors':
          return <SponsorsPage />;
        case 'gallery':
          return <GalleryPage />;
        default:
        return (
          <div className="flex-1 pb-10">
            {/* Dashboard Header */}
            <div className="px-6 py-6 border-b border-gray-200 bg-white">
              <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome to the Hospital Management System</p>
            </div>
            
            {/* Quick Stats */}
            <div className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Members</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">1,248</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Hospitals</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">12</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-xl">
                      <Building2 className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>
                
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Active Services</p>
                        <p className="text-2xl font-bold text-gray-800 mt-1">1,847</p>
                      </div>
                      <div className="p-3 bg-rose-100 rounded-xl">
                        <Building2 className="h-6 w-6 text-rose-600" />
                      </div>
                    </div>
                  </div>
                
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Today's Appointments</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">156</p>
                    </div>
                    <div className="p-3 bg-amber-100 rounded-xl">
                      <Calendar className="h-6 w-6 text-amber-600" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Recent Activity */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h2>
                <div className="space-y-4">
                    {[
                      { text: 'New doctor registration approved', time: '2 mins ago', color: 'bg-emerald-500' },
                      { text: 'Appointment scheduled', time: '1 hour ago', color: 'bg-amber-500' },
                      { text: 'New hospital added', time: '3 hours ago', color: 'bg-rose-500' },
                      { text: 'Committee member updated', time: '5 hours ago', color: 'bg-purple-500' },
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
          </div>
        );
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <TopNavBar onNavigate={onNavigate} onLogout={onLogout} />
      
      <div className="flex-1 overflow-auto p-4">
        {renderCurrentView()}
      </div>
    </div>
  );
};

export default AdminPanel;
