
import React from 'react';
import { User } from '../types';

interface MenuProps {
  user: User;
  onLogout: () => void;
  onProfileClick: () => void;
}

const Menu: React.FC<MenuProps> = ({ user, onLogout, onProfileClick }) => {
  const menuItems = [
    { id: 'profile', icon: 'fa-user', label: 'My Profile', color: 'text-blue-500', action: onProfileClick },
    { id: 'settings', icon: 'fa-gear', label: 'Settings', color: 'text-gray-600' },
    { id: 'privacy', icon: 'fa-lock', label: 'Privacy Control', color: 'text-red-500' },
    { id: 'support', icon: 'fa-headset', label: 'Help & Support', color: 'text-[#1b5e20]' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
        <img src={user.avatar} className="w-16 h-16 rounded-full border-2 border-gray-50 object-cover" alt="" />
        <div>
          <h2 className="text-xl font-bold text-gray-900">{user.full_name}</h2>
          <p className="text-xs text-green-600 font-bold">@{user.username}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {menuItems.map((item) => (
          <button 
            key={item.id} 
            onClick={item.action}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center ${item.color}`}>
                <i className={`fa-solid ${item.icon} text-lg`}></i>
              </div>
              <span className="font-bold text-gray-700">{item.label}</span>
            </div>
            <i className="fa-solid fa-chevron-right text-gray-300 text-xs"></i>
          </button>
        ))}
      </div>

      <button 
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-3 p-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-colors"
      >
        <i className="fa-solid fa-right-from-bracket"></i>
        Sign Out Securely
      </button>

      <div className="text-center">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Version 3.4.2 (Production)</p>
        <p className="text-[10px] text-gray-400 mt-1">Made with ❤️ for Bangladesh</p>
      </div>
    </div>
  );
};

export default Menu;
