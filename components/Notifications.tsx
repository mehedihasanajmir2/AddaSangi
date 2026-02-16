
import React from 'react';
import { Notification } from '../types';

interface NotificationsProps {
  isPopover?: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    user: { id: 'u1', username: 'Rahim Adda', avatar: 'https://picsum.photos/seed/rahim/100' },
    type: 'like',
    content: 'reacted to your photo: ❤️',
    timestamp: '2m ago',
    isRead: false
  },
  {
    id: 'n2',
    user: { id: 'u2', username: 'Sumaiya Sangi', avatar: 'https://picsum.photos/seed/sumaiya/100' },
    type: 'comment',
    content: 'commented: "Beautiful view! ❤️"',
    timestamp: '15m ago',
    isRead: false
  },
  {
    id: 'n3',
    user: { id: 'u3', username: 'Green Tiger', avatar: 'https://picsum.photos/seed/tiger/100' },
    type: 'mention',
    content: 'mentioned you in a post.',
    timestamp: '1h ago',
    isRead: true
  },
  {
    id: 'n4',
    user: { id: 'u6', username: 'Korim Boss', avatar: 'https://picsum.photos/seed/korim/100' },
    type: 'friend_request',
    content: 'sent you a friend request.',
    timestamp: '3h ago',
    isRead: true
  }
];

const Notifications: React.FC<NotificationsProps> = ({ isPopover = false }) => {
  return (
    <div className={`bg-white animate-in fade-in duration-300 ${isPopover ? '' : 'rounded-xl shadow-sm border border-gray-100 overflow-hidden'}`}>
      <div className="p-4 border-b border-gray-50 flex justify-between items-center sticky top-0 bg-white z-10">
        <h2 className={`${isPopover ? 'text-xl' : 'text-2xl'} font-black text-gray-900`}>Notifications</h2>
        <button className="text-[#b71c1c] text-xs font-bold hover:bg-red-50 px-2 py-1 rounded">Mark all read</button>
      </div>
      
      <div className="flex flex-col">
        {MOCK_NOTIFICATIONS.map((notif) => (
          <div 
            key={notif.id} 
            className={`flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 last:border-0 ${!notif.isRead ? 'bg-red-50/20' : ''}`}
          >
            <div className="relative shrink-0">
              <img src={notif.user.avatar} className="w-12 h-12 rounded-full border border-gray-100 shadow-sm" alt="" />
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${
                notif.type === 'like' ? 'bg-red-500' : 
                notif.type === 'comment' ? 'bg-blue-500' : 
                notif.type === 'friend_request' ? 'bg-green-500' : 'bg-yellow-500'
              }`}>
                <i className={`fa-solid text-[8px] text-white ${
                  notif.type === 'like' ? 'fa-heart' : 
                  notif.type === 'comment' ? 'fa-comment' : 
                  notif.type === 'friend_request' ? 'fa-user-plus' : 'fa-at'
                }`}></i>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-gray-800 leading-snug">
                <span className="font-bold text-gray-900">{notif.user.username}</span> {notif.content}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] font-bold ${!notif.isRead ? 'text-[#b71c1c]' : 'text-gray-400'}`}>{notif.timestamp}</span>
                {!notif.isRead && (
                  <div className="w-1.5 h-1.5 bg-[#b71c1c] rounded-full"></div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-3 text-center border-t border-gray-50">
        <button className="text-gray-500 font-bold text-xs hover:underline">See older activity</button>
      </div>
    </div>
  );
};

export default Notifications;
