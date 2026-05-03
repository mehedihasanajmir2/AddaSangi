
import React from 'react';
import { User } from '../types';

interface ContactsSidebarProps {
  contacts: User[];
  onContactSelect: (user: User) => void;
  onlineUsers: string[];
}

const ContactsSidebar: React.FC<ContactsSidebarProps> = ({ contacts, onContactSelect, onlineUsers }) => {
  return (
    <aside className="hidden lg:flex w-80 flex-col bg-white border-l border-gray-200 h-full overflow-hidden shrink-0">
      <div className="p-4 border-b border-gray-50 flex items-center justify-between">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Contacts</h3>
        <div className="flex gap-4 text-gray-400 text-sm">
          <i className="fa-solid fa-video cursor-pointer hover:text-gray-600"></i>
          <i className="fa-solid fa-magnifying-glass cursor-pointer hover:text-gray-600"></i>
          <i className="fa-solid fa-ellipsis cursor-pointer hover:text-gray-600"></i>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-2">
        {contacts.map((contact) => (
          <button
            key={contact.id}
            onClick={() => onContactSelect(contact)}
            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors group"
          >
            <div className="relative">
              <img 
                src={contact.avatar} 
                className="w-9 h-9 rounded-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all shadow-sm" 
                alt="" 
              />
              {onlineUsers.includes(contact.id) && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#25d366] border-2 border-white rounded-full"></span>
              )}
            </div>
            <span className="text-sm font-bold text-gray-700 flex-1 text-left truncate">{contact.username}</span>
          </button>
        ))}
        
        {contacts.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-xs text-gray-400 font-medium italic">No active contacts</p>
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-gray-50">
        <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#1b5e20] shadow-sm">
            <i className="fa-solid fa-plus"></i>
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900">Create New Group</h4>
            <p className="text-[10px] text-gray-500">Connect with more people</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default ContactsSidebar;
