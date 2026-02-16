
import React from 'react';
import { AppTab, User } from '../types';

interface SidebarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  user: User;
  onProfileClick: () => void;
  unreadMessagesCount?: number;
  onCallAIClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, user, onProfileClick, unreadMessagesCount = 0, onCallAIClick }) => {
  const menuItems = [
    { id: AppTab.FEED, icon: 'fa-house', label: 'Home', color: 'text-blue-600' },
    { id: AppTab.SEARCH, icon: 'fa-users', label: 'Friends', color: 'text-green-600' },
    { id: AppTab.MESSAGES, icon: 'fa-bolt', label: 'Messenger', color: 'text-[#b71c1c]' },
    { id: AppTab.NOTIFICATIONS, icon: 'fa-bell', label: 'Notifications', color: 'text-red-600' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-[280px] p-4 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
      <button 
        onClick={onProfileClick}
        className={`flex items-center gap-3 p-2 rounded-lg hover:bg-gray-200 transition-colors mb-2 w-full text-left ${activeTab === AppTab.PROFILE ? 'bg-gray-200' : ''}`}
      >
        <img src={user.avatar} className="w-9 h-9 rounded-full object-cover border" alt="" />
        <span className="font-bold text-gray-800">{user.username}</span>
      </button>

      <button 
        onClick={onCallAIClick}
        className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-100 transition-colors w-full text-left group mb-2 bg-green-50 border border-green-100"
      >
        <div className="w-8 flex justify-center text-xl text-green-600 group-hover:animate-bounce">
          <i className="fa-solid fa-phone"></i>
        </div>
        <span className="font-black text-green-700">Phone Mood (AI)</span>
      </button>

      {menuItems.map(item => (
        <button
          key={item.id}
          onClick={() => onTabChange(item.id)}
          className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 transition-colors w-full text-left group ${activeTab === item.id ? 'bg-white shadow-sm ring-1 ring-gray-100' : ''}`}
        >
          <div className={`w-8 flex justify-center text-xl relative ${activeTab === item.id ? item.color : 'text-gray-600 group-hover:scale-110'}`}>
            <i className={`fa-solid ${item.icon}`}></i>
          </div>
          <span className={`font-semibold ${activeTab === item.id ? 'text-gray-900 font-bold' : 'text-gray-700'}`}>{item.label}</span>
          
          {item.id === AppTab.MESSAGES && unreadMessagesCount > 0 && (
            <div className="ml-auto bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
              {unreadMessagesCount}
            </div>
          )}
        </button>
      ))}

      <footer className="mt-auto px-3 text-[10px] text-gray-400 font-medium">
        <p>AddaSangi © 1947-2005</p>
      </footer>
    </aside>
  );
};

export default Sidebar;
