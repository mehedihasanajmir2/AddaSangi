
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';

interface ContactsSidebarProps {
  onContactClick?: (user: User) => void;
  currentUserId?: string;
}

const ContactsSidebar: React.FC<ContactsSidebarProps> = ({ onContactClick, currentUserId }) => {
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUserId) return;

    const fetchFriends = async () => {
      // friendships টেবিল থেকে আপনার বন্ধুদের আইডি খুঁজুন
      const { data: friendshipData } = await supabase
        .from('friendships')
        .select('friend_id, profiles!friendships_friend_id_fkey(*)')
        .eq('user_id', currentUserId);

      if (friendshipData) {
        const formattedFriends = friendshipData.map((f: any) => ({
          id: f.profiles.id,
          username: f.profiles.full_name || 'User',
          avatar: f.profiles.avatar_url || `https://picsum.photos/seed/${f.profiles.id}/200`,
          bio: f.profiles.bio
        }));
        setFriends(formattedFriends);
      }
      setLoading(false);
    };

    fetchFriends();
    
    // রিয়েল টাইম আপডেটের জন্য লিসেনার
    const channel = supabase
      .channel('friendship_updates')
      .on('postgres_changes', { event: '*', table: 'friendships' }, () => fetchFriends())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId]);

  return (
    <aside className="hidden lg:flex flex-col w-[280px] p-4 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
      <div className="flex justify-between items-center mb-4 px-2">
        <h3 className="font-bold text-gray-500 uppercase text-xs tracking-widest">Your Friends</h3>
        <div className="flex gap-4 text-gray-500">
           <i className="fa-solid fa-video cursor-pointer hover:text-gray-800"></i>
           <i className="fa-solid fa-magnifying-glass cursor-pointer hover:text-gray-800"></i>
        </div>
      </div>

      <div className="space-y-1">
        {loading ? (
          <div className="p-4 text-center text-gray-400 text-xs">Loading...</div>
        ) : friends.length > 0 ? (
          friends.map(contact => (
            <button 
              key={contact.id} 
              onClick={() => onContactClick?.(contact)}
              className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-200 transition-colors relative text-left group"
            >
              <div className="relative">
                <img src={contact.avatar} className="w-9 h-9 rounded-full object-cover border" alt="" />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <span className="text-sm font-semibold text-gray-800 group-hover:text-red-600 truncate">{contact.username}</span>
            </button>
          ))
        ) : (
          <div className="p-4 text-center border-2 border-dashed rounded-xl bg-gray-50">
            <p className="text-[10px] text-gray-400 font-bold">Search and add friends to see them here.</p>
          </div>
        )}
      </div>

      <div className="mt-8 px-2 border-t border-gray-200 pt-4">
        <h3 className="font-bold text-gray-500 uppercase text-xs tracking-widest mb-4">Groups</h3>
        <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-200 text-gray-600">
           <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
             <i className="fa-solid fa-plus text-xs"></i>
           </div>
           <span className="text-sm font-semibold">New Group</span>
        </button>
      </div>
    </aside>
  );
};

export default ContactsSidebar;
