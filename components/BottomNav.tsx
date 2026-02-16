
import React from 'react';
import { AppTab } from '../types';

interface BottomNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onProfileClick: () => void;
  unreadMessagesCount?: number;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, onProfileClick, unreadMessagesCount = 0 }) => {
  const tabs = [
    { id: AppTab.FEED, icon: 'fa-house', label: 'Home' },
    { id: AppTab.VIDEOS, icon: 'fa-video', label: 'Video' },
    { id: AppTab.SEARCH, icon: 'fa-users', label: 'Friends' },
    { id: AppTab.PROFILE, icon: 'fa-user', label: 'Profile' },
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-center items-stretch z-40 h-14 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
      <div className="flex w-full max-w-md">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center transition-all relative ${isActive ? 'text-[#b71c1c]' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <div className="relative">
                <i className={`fa-solid ${tab.icon} text-lg ${isActive ? 'scale-110' : ''}`}></i>
                {tab.id === AppTab.MESSAGES && unreadMessagesCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white">
                    {unreadMessagesCount}
                  </span>
                )}
              </div>
              <span className={`text-[9px] font-bold mt-0.5`}>{tab.label}</span>
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#b71c1c] rounded-b-full"></div>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
