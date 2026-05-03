
import React from 'react';
import { AppTab, User } from '../types';

interface SidebarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  user: User;
  onProfileClick: () => void;
  unreadMessagesCount: number;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, user, onProfileClick, unreadMessagesCount }) => {
  const tabs = [
    { id: AppTab.MESSAGES, label: 'Chats', icon: 'fa-message', badge: unreadMessagesCount },
    { id: AppTab.STATUS, label: 'Status', icon: 'fa-circle-notch' },
    { id: AppTab.CALLS, label: 'Calls', icon: 'fa-phone' },
    { id: AppTab.SEARCH, label: 'Search', icon: 'fa-magnifying-glass' },
  ];

  return (
    <aside className="hidden md:flex w-[72px] flex-col items-center bg-[#f0f2f5] border-r border-gray-200 py-4 gap-4 z-40 shrink-0">
      <div className="flex flex-col gap-4 flex-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              activeTab === tab.id ? 'bg-white shadow-sm text-[#1b5e20]' : 'text-gray-500 hover:bg-gray-200'
            }`}
            title={tab.label}
          >
            <i className={`fa-solid ${tab.icon} text-xl`}></i>
            {tab.badge > 0 && (
              <span className="absolute top-0 right-0 bg-[#25d366] text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-[#f0f2f5]">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 mt-auto">
        <button 
          onClick={onProfileClick}
          className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${
            activeTab === AppTab.PROFILE ? 'border-[#1b5e20] shadow-md scale-110' : 'border-transparent'
          }`}
        >
          <img src={user.avatar} className="w-full h-full object-cover" alt="me" />
        </button>
        <button 
          onClick={() => onTabChange(AppTab.MENU)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            activeTab === AppTab.MENU ? 'bg-white text-[#1b5e20]' : 'text-gray-500 hover:bg-gray-200'
          }`}
        >
          <i className="fa-solid fa-gear text-xl"></i>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
