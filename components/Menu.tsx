
import React from 'react';
import { User } from '../types';

interface MenuProps {
  user: User;
  onLogout: () => void;
  onProfileClick: () => void;
}

const Menu: React.FC<MenuProps> = ({ user, onLogout, onProfileClick }) => {
  const menuSections = [
    {
      title: 'Settings & Privacy',
      icon: 'fa-gear',
      items: ['Settings', 'Privacy Checkup', 'Privacy Center', 'Activity Log']
    },
    {
      title: 'Help & Support',
      icon: 'fa-circle-question',
      items: ['Help Center', 'Support Inbox', 'Report a Problem']
    },
    {
      title: 'Display & Accessibility',
      icon: 'fa-moon',
      items: ['Dark Mode', 'Compact Mode', 'Keyboard']
    }
  ];

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300 px-4 md:px-0 pb-10">
      <div className="bg-white p-4 shadow-sm md:rounded-xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Menu</h2>
        
        {/* Profile Shortcut */}
        <button 
          onClick={onProfileClick}
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100 mb-4 shadow-sm"
        >
          <img src={user.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
          <div className="text-left">
            <h4 className="font-bold text-gray-900">{user.username}</h4>
            <p className="text-xs text-gray-500">See your profile</p>
          </div>
        </button>

        <div className="grid grid-cols-2 gap-2">
           <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
              <i className="fa-solid fa-users text-blue-500 mb-2"></i>
              <p className="text-sm font-bold text-gray-800">Groups</p>
           </div>
           <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
              <i className="fa-solid fa-bookmark text-purple-500 mb-2"></i>
              <p className="text-sm font-bold text-gray-800">Saved</p>
           </div>
           <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
              <i className="fa-solid fa-clock-rotate-left text-blue-400 mb-2"></i>
              <p className="text-sm font-bold text-gray-800">Memories</p>
           </div>
           <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
              <i className="fa-solid fa-flag text-orange-500 mb-2"></i>
              <p className="text-sm font-bold text-gray-800">Pages</p>
           </div>
        </div>
      </div>

      {/* Accordion Style Settings */}
      {menuSections.map((section, idx) => (
        <div key={idx} className="bg-white shadow-sm md:rounded-xl overflow-hidden">
          <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                <i className={`fa-solid ${section.icon}`}></i>
              </div>
              <span className="font-bold text-gray-800">{section.title}</span>
            </div>
            <i className="fa-solid fa-chevron-down text-gray-400 text-xs"></i>
          </button>
          <div className="px-4 pb-2">
            {section.items.map((item, i) => (
              <button key={i} className="w-full text-left py-3 px-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-3 transition-colors">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                {item}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Logout Button */}
      <button 
        onClick={onLogout}
        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors mx-4 md:mx-0 shadow-sm"
      >
        <i className="fa-solid fa-right-from-bracket"></i>
        Log Out
      </button>
    </div>
  );
};

export default Menu;
