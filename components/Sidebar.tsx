
import React from 'react';
import { AppTab, User } from '../types';

interface SidebarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  user: User;
  onProfileClick: () => void;
  unreadMessagesCount?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, user, onProfileClick, unreadMessagesCount = 0 }) => {
  const menuItems = [
    { id: AppTab.FEED, icon: 'fa-house', label: 'Home', color: 'text-blue-600' },
    { id: AppTab.SEARCH, icon: 'fa-users', label: 'Friends', color: 'text-green-600' },
    { id: AppTab.MESSAGES, icon: 'fa-bolt', label: 'Messenger', color: 'text-[#b71c1c]' },
    { id: AppTab.NOTIFICATIONS, icon: 'fa-bell', label: 'Notifications', color: 'text-red-600' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-[280px] p-4 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
      {/* Profile Section */}
      <button 
        onClick={onProfileClick}
        className={`flex items-center gap-3 p-2 rounded-lg hover:bg-gray-200 transition-colors mb-2 w-full text-left ${activeTab === AppTab.PROFILE ? 'bg-gray-200' : ''}`}
      >
        <img src={user.avatar} className="w-9 h-9 rounded-full object-cover" alt="" />
        <span className="font-bold text-gray-800">{user.username}</span>
      </button>

      {/* Main Nav */}
      {menuItems.map(item => (
        <button
          key={item.id}
          onClick={() => onTabChange(item.id)}
          className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 transition-colors w-full text-left group ${activeTab === item.id ? 'bg-gray-100 shadow-sm' : ''}`}
        >
          <div className={`w-8 flex justify-center text-xl relative ${activeTab === item.id ? item.color : 'text-gray-600 group-hover:scale-110 transition-transform'}`}>
            <i className={`fa-solid ${item.icon}`}></i>
          </div>
          <span className={`font-semibold ${activeTab === item.id ? 'text-gray-900 font-bold' : 'text-gray-700'}`}>{item.label}</span>
          
          {item.id === AppTab.MESSAGES && unreadMessagesCount > 0 && (
            <div className="ml-auto bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-sm">
              {unreadMessagesCount}
            </div>
          )}

          {item.id === AppTab.NOTIFICATIONS && (
             <div className="ml-auto bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">2</div>
          )}
        </button>
      ))}

      <footer className="mt-auto px-3 text-[10px] text-gray-400 font-medium">
        <p>Privacy · Terms · Advertising · Cookies · AddaSangi © 1947-2005</p>
      </footer>
    </aside>
  );
};

export default Sidebar;
