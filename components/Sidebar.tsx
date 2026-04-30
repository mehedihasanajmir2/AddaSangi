
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
    { id: AppTab.MESSAGES, icon: 'fa-message', label: 'Chats', color: 'text-[#b71c1c]' },
    { id: AppTab.SEARCH, icon: 'fa-users', label: 'Find People', color: 'text-green-600' },
    { id: AppTab.NOTIFICATIONS, icon: 'fa-bell', label: 'Notifications', color: 'text-orange-600' },
    { id: AppTab.PROFILE, icon: 'fa-user', label: 'Profile', color: 'text-purple-600' },
    { id: AppTab.MENU, icon: 'fa-bars', label: 'Settings', color: 'text-gray-700' },
  ];

  const handleItemClick = (tabId: AppTab) => {
    if (tabId === AppTab.PROFILE) {
      onProfileClick();
    } else {
      onTabChange(tabId);
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-[280px] p-4 h-full overflow-y-auto bg-[#e8f5e9] border-r border-gray-200">
      {/* Profile Header Shortcut */}
      <button 
        onClick={onProfileClick}
        className={`flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 hover:shadow-sm transition-all mb-4 w-full text-left ${activeTab === AppTab.PROFILE ? 'bg-white shadow-sm ring-1 ring-red-200' : ''}`}
      >
        <img src={user.avatar} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" alt="" />
        <div className="flex flex-col">
          <span className="font-black text-gray-900 leading-tight">{user.username}</span>
          <span className="text-[10px] text-red-700 font-bold uppercase">View Profile</span>
        </div>
      </button>

      <div className="space-y-1">
        <h3 className="px-3 text-[10px] font-black text-red-800/40 uppercase tracking-widest mb-2">Navigation</h3>
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item.id)}
            className={`flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 hover:shadow-sm transition-all w-full text-left group ${activeTab === item.id ? 'bg-white shadow-md ring-1 ring-red-100 scale-[1.02]' : ''}`}
          >
            <div className={`w-8 flex justify-center text-xl relative ${activeTab === item.id ? item.color : 'text-gray-500 group-hover:scale-110'}`}>
              <i className={`fa-solid ${item.icon}`}></i>
              {item.id === AppTab.MESSAGES && unreadMessagesCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-[#25d366] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white animate-pulse">
                  {unreadMessagesCount}
                </div>
              )}
            </div>
            <span className={`font-bold ${activeTab === item.id ? 'text-gray-900' : 'text-gray-600'}`}>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-8 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-x-2 gap-y-1 px-3">
          <span className="text-[10px] text-gray-400 font-bold hover:underline cursor-pointer">Privacy</span>
          <span className="text-[10px] text-gray-400 font-bold hover:underline cursor-pointer">Terms</span>
          <span className="text-[10px] text-gray-400 font-bold hover:underline cursor-pointer">Cookies</span>
          <span className="text-[10px] text-gray-400 font-bold hover:underline cursor-pointer">More</span>
        </div>
        <footer className="px-3 mt-4 text-[10px] text-gray-400 font-black uppercase tracking-tighter">
          <p>AddaSangi © 2026</p>
          <p className="text-[#1b5e20]">Made for Community</p>
        </footer>
      </div>
    </aside>
  );
};

export default Sidebar;
