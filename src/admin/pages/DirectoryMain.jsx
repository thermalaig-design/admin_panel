import React, { useState, useEffect } from 'react';
import { Users, Star, Building2, Stethoscope, Award, Search, Loader, ChevronLeft } from 'lucide-react';
import CategoryCard from '../components/CategoryCard';
import supabase from '../../services/supabaseClient';

const DirectoryMain = ({ onNavigate, onHomeNavigate }) => {
    const [categories, setCategories] = useState([
      { 
        id: 'trustees', 
        title: 'Trustee Members', 
        desc: 'Manage Trustee Members', 
        icon: 'Star', 
        color: 'bg-yellow-100', 
        iconColor: 'text-yellow-600',
        count: 0 
      },
      { 
        id: 'patrons', 
        title: 'Patron Members', 
        desc: 'Manage Patron Members', 
        icon: 'Award', 
        color: 'bg-purple-100', 
        iconColor: 'text-purple-600',
        count: 0 
      },
      
      { 
        id: 'elected', 
        title: 'Elected Members', 
        desc: 'Manage Elected Members', 
        icon: 'Award', 
        color: 'bg-orange-100', 
        iconColor: 'text-orange-600',
        count: 0 
      },
      { 
        id: 'committee', 
        title: 'Committee Members', 
        desc: 'Manage Committee Members', 
        icon: 'Users', 
        color: 'bg-blue-100', 
        iconColor: 'text-blue-600',
        count: 0 
      },
      { 
        id: 'hospitals', 
        title: 'Hospitals', 
        desc: 'Manage Hospitals', 
        icon: 'Building2', 
        color: 'bg-green-100', 
        iconColor: 'text-green-600',
        count: 0 
      },
      { 
        id: 'doctors', 
        title: 'Doctors', 
        desc: 'Manage Doctors', 
        icon: 'Stethoscope', 
        color: 'bg-red-100', 
        iconColor: 'text-red-600',
        count: 0 
      }
    ]);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCounts();
  }, []);

    const loadCounts = async () => {
      try {
        const [
          trusteeRes,
          patronRes,
          electedRes,
          committeeRes,
          hospitalsRes,
          doctorsRes
        ] = await Promise.allSettled([
          supabase
            .from('Members Table')
            .select('*', { count: 'exact', head: true })
            .ilike('type', '%trustee%'),
          supabase
            .from('Members Table')
            .select('*', { count: 'exact', head: true })
            .ilike('type', '%patron%'),
          supabase
            .from('elected_members')
            .select('*', { count: 'exact', head: true }),
          supabase
            .from('committee_members')
            .select('*', { count: 'exact', head: true }),
          supabase
            .from('hospitals')
            .select('*', { count: 'exact', head: true }),
          supabase
            .from('opd_schedule')
            .select('*', { count: 'exact', head: true }),
        ]);

        const trusteeCount = trusteeRes.status === 'fulfilled' ? (trusteeRes.value.count ?? 0) : 0;
        const patronCount = patronRes.status === 'fulfilled' ? (patronRes.value.count ?? 0) : 0;
        const electedCount = electedRes.status === 'fulfilled' ? (electedRes.value.count ?? 0) : 0;
        const committeeCount = committeeRes.status === 'fulfilled' ? (committeeRes.value.count ?? 0) : 0;
        const hospitalsCount = hospitalsRes.status === 'fulfilled' ? (hospitalsRes.value.count ?? 0) : 0;
        const doctorsCount = doctorsRes.status === 'fulfilled' ? (doctorsRes.value.count ?? 0) : 0;

        setCategories(prev => prev.map(category => {
          switch(category.id) {
            case 'trustees':
              return { ...category, count: trusteeCount };
            case 'patrons':
              return { ...category, count: patronCount };
            case 'elected':
              return { ...category, count: electedCount };
            case 'committee':
              return { ...category, count: committeeCount };
            case 'hospitals':
              return { ...category, count: hospitalsCount };
            case 'doctors':
              return { ...category, count: doctorsCount };
            default:
              return category;
          }
        }));
      } catch (error) {
        console.error('Error loading counts:', error);
      } finally {
        setLoading(false);
      }
    };

  const filteredCategories = categories.filter(category =>
    category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCategoryClick = (categoryId) => {
    onNavigate(categoryId);
  };

  return (
    <div className="flex-1 pb-10">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="px-4 sm:px-6 mt-6">
          <div className="flex items-center gap-3 mb-4">
            <button 
              onClick={() => onHomeNavigate('home')}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600"
              title="Go back to Home"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Directory Categories</h2>
              <p className="text-gray-600 text-sm mt-1">Select a category to manage</p>
            </div>
          </div>
        </div>

          {/* Search Section */}
          <div className="px-4 sm:px-6 mt-4">
          <div className="bg-gray-50 rounded-xl p-2 flex items-center gap-3 border border-gray-200 focus-within:border-indigo-300 transition-all">
            <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 ml-1">
              <Search className="h-4 w-4 text-indigo-600" />
            </div>
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 placeholder-gray-400 font-medium text-sm py-1"
            />
          </div>
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="px-4 sm:px-6 mt-8 text-center py-16">
            <Loader className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
            <p className="text-gray-600 mt-2">Loading categories...</p>
          </div>
        ) : (
          <div className="px-4 sm:px-6 mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onClick={handleCategoryClick}
              />
            ))}
          </div>
        )}

        {filteredCategories.length === 0 && !loading && (
          <div className="px-4 sm:px-6 mt-8 text-center py-16">
            <div className="bg-gray-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-300">
              <Search className="h-6 w-6 text-gray-300" />
            </div>
            <h3 className="text-gray-800 font-bold">No categories found</h3>
            <p className="text-gray-500 text-sm mt-1">Try searching with different keywords</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectoryMain;