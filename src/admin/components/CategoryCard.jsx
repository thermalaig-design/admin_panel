import React from 'react';
import { Users, Star, Building2, Stethoscope, Award, HeartPulse, ChevronRight, User } from 'lucide-react';

const CategoryCard = ({ category, onClick }) => {
  const renderIcon = () => {
    switch(category.icon) {
      case 'User': return <User className={`h-5 w-5 ${category.iconColor}`} />;
      case 'Star': return <Star className={`h-5 w-5 ${category.iconColor}`} />;
      case 'Award': return <Award className={`h-5 w-5 ${category.iconColor}`} />;
      case 'Building2': return <Building2 className={`h-5 w-5 ${category.iconColor}`} />;
      case 'Stethoscope': return <Stethoscope className={`h-5 w-5 ${category.iconColor}`} />;
      case 'HeartPulse': return <HeartPulse className={`h-5 w-5 ${category.iconColor}`} />;
      default: return <Users className={`h-5 w-5 ${category.iconColor}`} />;
    }
  };

  return (
    <button
      onClick={() => onClick(category.id)}
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-200 transition-all duration-200 text-left group flex items-center gap-3"
    >
      <div className={`${category.color} p-3 rounded-lg group-hover:scale-105 transition-transform duration-200`}>
        {renderIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-800 text-sm leading-tight truncate">{category.title}</h3>
        <p className="text-gray-500 text-xs mt-0.5 truncate">{category.desc}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">
          {category.count}
        </span>
        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
      </div>
    </button>
  );
};

export default CategoryCard;