
import React from 'react';
import { User } from '../types';

interface ContactsSidebarProps {
  onContactClick?: (user: User) => void;
}

const ContactsSidebar: React.FC<ContactsSidebarProps> = ({ onContactClick }) => {
  const contacts = [
    { id: 'u1', username: 'Rahim Adda', avatar: 'https://picsum.photos/seed/rahim/100', online: true, bio: 'Adda lover!' },
    { id: 'u2', username: 'Sumaiya Sangi', avatar: 'https://picsum.photos/seed/sumaiya/100', online: true, bio: 'Nature & peace.' },
    { id: 'u3', username: 'Green Tiger', avatar: 'https://picsum.photos/seed/tiger/100', online: false, bio: 'Web developer.' },
    { id: 'u6', username: 'Korim Boss', avatar: 'https://picsum.photos/seed/korim/100', online: true, bio: 'Business magnate.' },
    { id: 'u7', username: 'Anika Baby', avatar: 'https://picsum.photos/seed/anika/100', online: false, bio: 'Living the dream.' },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-[280px] p-4 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
      <div className="flex justify-between items-center mb-4 px-2">
        <h3 className="font-bold text-gray-500 uppercase text-xs tracking-widest">Contacts</h3>
        <div className="flex gap-4 text-gray-500">
           <i className="fa-solid fa-video cursor-pointer hover:text-gray-800"></i>
           <i className="fa-solid fa-magnifying-glass cursor-pointer hover:text-gray-800"></i>
           <i className="fa-solid fa-ellipsis cursor-pointer hover:text-gray-800"></i>
        </div>
      </div>

      <div className="space-y-1">
        {contacts.map(contact => (
          <button 
            key={contact.id} 
            onClick={() => onContactClick?.({ id: contact.id, username: contact.username, avatar: contact.avatar, bio: contact.bio })}
            className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-200 transition-colors relative text-left"
          >
            <div className="relative">
              <img src={contact.avatar} className="w-9 h-9 rounded-full object-cover" alt="" />
              {contact.online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </div>
            <span className="text-sm font-semibold text-gray-800">{contact.username}</span>
          </button>
        ))}
      </div>

      <div className="mt-8 px-2 border-t border-gray-200 pt-4">
        <h3 className="font-bold text-gray-500 uppercase text-xs tracking-widest mb-4">Group Conversations</h3>
        <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-200 text-gray-600">
           <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
             <i className="fa-solid fa-plus"></i>
           </div>
           <span className="text-sm font-semibold">Create New Group</span>
        </button>
      </div>
    </aside>
  );
};

export default ContactsSidebar;
