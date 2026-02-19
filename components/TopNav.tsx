
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
    { id: AppTab.FEED, icon: 'fa-house', label: 'Home' },
    { id: AppTab.VIDEOS, icon: 'fa-video', label: 'Video' },
    { id: AppTab.SEARCH, icon: 'fa-users', label: 'Friends' },
    { id: AppTab.MESSAGES, icon: 'fa-bolt', label: 'Messenger' },
    { id: AppTab.NOTIFICATIONS, icon: 'fa-bell', label: 'Alerts' },
    { id: AppTab.MENU, icon: 'fa-bars', label: 'Menu' },
  ];

  const handleTabClick = (tabId: AppTab) => {
    if (tabId === AppTab.PROFILE) {
      onProfileClick();
    } else {
      onTabChange(tabId);
    }
  };

  return (
    <nav className="fixed top-14 left-0 right-0 bg-white border-b border-gray-200 flex justify-center items-stretch z-40 h-14 shadow-sm">
      <div className="flex w-full max-w-2xl px-2">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center transition-all relative ${isActive ? 'text-[#b71c1c]' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <div className="relative">
                <i className={`fa-solid ${tab.icon} text-lg md:text-xl ${isActive ? 'scale-110' : ''}`}></i>
                {(tab.id === AppTab.MESSAGES || tab.id === AppTab.NOTIFICATIONS) && unreadMessagesCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white animate-pulse">
                    {unreadMessagesCount}
                  </span>
                )}
              </div>
              <span className={`text-[9px] md:text-[10px] font-bold mt-0.5 hidden sm:block`}>{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#b71c1c] rounded-t-full"></div>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default TopNav;
