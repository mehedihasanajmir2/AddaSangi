
import React from 'react';
import { AppTab } from '../types';

interface TopNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onProfileClick: () => void;
  unreadMessagesCount?: number;
}

const TopNav: React.FC<TopNavProps> = ({ activeTab, onTabChange, onProfileClick, unreadMessagesCount = 0 }) => {
  const tabs = [
    { id: AppTab.MESSAGES, icon: 'fa-message', label: 'Chats' },
    { id: AppTab.SEARCH, icon: 'fa-users', label: 'People' },
    { id: AppTab.NOTIFICATIONS, icon: 'fa-bell', label: 'Alerts' },
    { id: AppTab.MENU, icon: 'fa-bars', label: 'Settings' },
  ];

  const handleTabClick = (tabId: AppTab) => {
    if (tabId === AppTab.PROFILE) {
      onProfileClick();
    } else {
      onTabChange(tabId);
    }
  };

  return (
    <nav className="fixed top-14 left-0 right-0 bg-[#b71c1c] border-b border-white/10 flex justify-center items-stretch z-40 h-14 shadow-md">
      <div className="flex w-full max-w-2xl px-2">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center transition-all relative ${isActive ? 'text-white' : 'text-white/60 hover:bg-white/5'}`}
            >
              <div className="relative">
                <i className={`fa-solid ${tab.icon} text-lg md:text-xl ${isActive ? 'scale-110' : ''}`}></i>
                {(tab.id === AppTab.MESSAGES || tab.id === AppTab.NOTIFICATIONS) && unreadMessagesCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#25d366] text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-[#b71c1c] animate-pulse">
                    {unreadMessagesCount}
                  </span>
                )}
              </div>
              <span className={`text-[9px] md:text-[10px] font-bold mt-0.5 hidden sm:block uppercase tracking-tighter`}>{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#25d366] rounded-t-full"></div>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default TopNav;
