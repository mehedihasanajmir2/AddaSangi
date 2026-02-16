
import React, { useState } from 'react';
import { Chat } from '../types';

interface MessagingProps {
  isPopover?: boolean;
  onChatSelect?: () => void;
}

const MOCK_CHATS: Chat[] = [
  { id: '1', user: { id: 'u1', username: 'Rahim Adda', avatar: 'https://picsum.photos/seed/rahim/200' }, lastMessage: 'Kire mama, adda hobe naki?', unreadCount: 2 },
  { id: '2', user: { id: 'u2', username: 'Sumaiya Sangi', avatar: 'https://picsum.photos/seed/sumaiya/200' }, lastMessage: 'The new story looks great!', unreadCount: 0 },
  { id: '3', user: { id: 'u3', username: 'Green Tiger', avatar: 'https://picsum.photos/seed/tiger/200' }, lastMessage: 'AddaSangi is blowing up 🇧🇩', unreadCount: 0 },
  { id: '4', user: { id: 'u4', username: 'Anika Baby', avatar: 'https://picsum.photos/seed/anika/200' }, lastMessage: 'Sent a photo', unreadCount: 1 },
];

const Messaging: React.FC<MessagingProps> = ({ isPopover = false, onChatSelect }) => {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [msgInput, setMsgInput] = useState('');

  const handleChatOpen = (chat: Chat) => {
    setSelectedChat(chat);
  };

  if (selectedChat) {
    return (
      <div className={`flex flex-col h-full bg-white animate-in slide-in-from-right duration-300 ${isPopover ? 'absolute inset-0 z-50' : ''}`}>
        <header className="flex items-center gap-3 p-3 border-b border-gray-100 bg-white">
          <button onClick={() => setSelectedChat(null)} className="text-gray-500 hover:text-[#b71c1c] p-1">
            <i className="fa-solid fa-arrow-left text-lg"></i>
          </button>
          <img src={selectedChat.user.avatar} className="w-9 h-9 rounded-full border border-gray-100" alt="" />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm text-gray-900 truncate">{selectedChat.user.username}</h3>
            <span className="text-[10px] text-green-600 font-bold uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Active
            </span>
          </div>
          <div className="flex gap-4 px-2">
            <button className="text-[#b71c1c] hover:scale-110 transition-transform"><i className="fa-solid fa-phone"></i></button>
            <button className="text-[#b71c1c] hover:scale-110 transition-transform"><i className="fa-solid fa-video"></i></button>
          </div>
        </header>

        <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto bg-gray-50/50">
          <div className="self-center my-2">
            <span className="bg-gray-200/50 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">Today, 10:45 AM</span>
          </div>
          
          {/* Incoming Bubble (SMS Style) */}
          <div className="flex items-end gap-2 max-w-[85%]">
            <img src={selectedChat.user.avatar} className="w-6 h-6 rounded-full mb-1" alt="" />
            <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 text-[14px] text-gray-800 font-medium relative">
              {selectedChat.lastMessage}
              <div className="absolute -left-1 bottom-0 w-2 h-2 bg-white border-l border-b border-gray-100 transform rotate-45"></div>
            </div>
          </div>

          {/* Outgoing Bubble (SMS Style) */}
          <div className="flex flex-col items-end gap-1 self-end max-w-[85%]">
            <div className="bg-[#b71c1c] text-white p-3 rounded-2xl rounded-br-none shadow-md text-[14px] font-medium relative">
              Hobe hobe! Shamne bar hobe. Ekhon kaj korchi.
              <div className="absolute -right-1 bottom-0 w-2 h-2 bg-[#b71c1c] transform rotate-45"></div>
            </div>
            <div className="flex items-center gap-1 mr-1">
                <span className="text-[10px] text-gray-400 font-bold">11:02 AM</span>
                <i className="fa-solid fa-circle-check text-[10px] text-blue-500"></i>
            </div>
          </div>
        </div>

        <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
          <button className="text-gray-400 hover:text-green-600 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:bg-gray-100">
            <i className="fa-solid fa-circle-plus text-xl"></i>
          </button>
          <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-1.5 focus-within:bg-white focus-within:ring-1 focus-within:ring-red-100 transition-all">
            <input 
              type="text" 
              placeholder="iMessage style..."
              className="flex-1 bg-transparent border-none outline-none text-sm py-1 font-medium"
              value={msgInput}
              onChange={(e) => setMsgInput(e.target.value)}
            />
            <button className="text-gray-400 hover:text-yellow-500"><i className="fa-regular fa-face-smile"></i></button>
          </div>
          <button 
            disabled={!msgInput.trim()}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${msgInput.trim() ? 'bg-[#b71c1c] text-white shadow-lg shadow-red-500/20' : 'text-gray-300'}`}
          >
            <i className="fa-solid fa-arrow-up text-lg"></i>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white animate-in fade-in duration-300 ${isPopover ? 'shadow-2xl' : ''}`}>
      {/* Facebook Style Header */}
      <div className="p-4 bg-white flex justify-between items-center shrink-0">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Chats</h2>
        <div className="flex gap-2">
           <button className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors" title="Options">
             <i className="fa-solid fa-ellipsis"></i>
           </button>
           <button className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors" title="See all in Messenger">
             <i className="fa-solid fa-expand"></i>
           </button>
           <button className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors" title="New Message">
             <i className="fa-solid fa-pen-to-square"></i>
           </button>
        </div>
      </div>
      
      {/* Clean Search Bar */}
      <div className="px-4 pb-2 shrink-0">
        <div className="relative group">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[11px] group-focus-within:text-[#b71c1c]"></i>
          <input 
            type="text" 
            placeholder="Search Messenger" 
            className="w-full bg-gray-100 rounded-full py-1.5 pl-9 pr-4 text-[13px] outline-none border border-transparent focus:bg-white focus:border-red-100 transition-all font-medium"
          />
        </div>
      </div>
      
      {/* Chat List with Facebook Styling */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        <div className="flex flex-col mt-1">
          {MOCK_CHATS.map(chat => (
            <button 
              key={chat.id} 
              onClick={() => handleChatOpen(chat)}
              className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-xl transition-all text-left group mx-1"
            >
              <div className="relative shrink-0">
                <img src={chat.user.avatar} className="w-14 h-14 rounded-full border border-gray-100 shadow-sm object-cover" alt="" />
                <div className="absolute bottom-0.5 right-0.5 bg-green-500 w-3.5 h-3.5 rounded-full border-[3px] border-white"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <h4 className={`truncate text-[15px] ${chat.unreadCount > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                    {chat.user.username}
                  </h4>
                </div>
                <div className="flex items-center justify-between gap-1">
                  <p className={`text-[13px] truncate flex-1 ${chat.unreadCount > 0 ? 'text-gray-950 font-bold' : 'text-gray-500 font-normal'}`}>
                    {chat.unreadCount > 0 ? 'Replied to your story' : chat.lastMessage}
                  </p>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[11px] text-gray-400 font-medium">10:30 AM</span>
                    {chat.unreadCount > 0 && (
                      <div className="w-3 h-3 bg-blue-600 rounded-full ml-1"></div>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Footer link style like FB */}
      {isPopover && (
        <div className="py-3 border-t border-gray-100 text-center bg-white">
           <button onClick={onChatSelect} className="text-blue-600 text-[14px] font-bold hover:underline">See all in Messenger</button>
        </div>
      )}
    </div>
  );
};

export default Messaging;
