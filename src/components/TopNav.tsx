
import React from 'react';
import { AppTab } from '../types';

interface TopNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onProfileClick: () => void;
  unreadMessagesCount: number;
}

const TopNav: React.FC<TopNavProps> = ({ activeTab, onTabChange, onProfileClick, unreadMessagesCount }) => {
  const tabs = [
    { id: AppTab.MESSAGES, label: 'CHATS', badge: unreadMessagesCount },
    { id: AppTab.STATUS, label: 'STATUS', badge: 0 },
    { id: AppTab.CALLS, label: 'CALLS', badge: 0 },
  ];

  return (
    <nav className="bg-[#b71c1c] text-white/50 border-t border-white/5">
      <div className="flex w-full">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 py-3 text-sm font-black transition-all border-b-[3px] relative ${
              activeTab === tab.id ? 'border-[#ffeb3b] text-white' : 'border-transparent'
            }`}
          >
            {tab.label}
            {tab.badge > 0 && (
              <span className="ml-2 bg-[#ffeb3b] text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-flex items-center justify-center">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default TopNav;
