
import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';

interface MessagingProps {
  currentUser: User;
  targetUser?: User | null;
}

const Messaging: React.FC<MessagingProps> = ({ currentUser, targetUser }) => {
  const [activeChat, setActiveChat] = useState<User | null>(targetUser || null);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [inboxUsers, setInboxUsers] = useState<User[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ইনবক্স লোড করা (ফেসবুক স্টাইল)
  useEffect(() => {
    const fetchInbox = async () => {
      // মেসেজ টেবিল থেকে আপনার চ্যাট হিস্ট্রি বের করুন
      const { data: msgs } = await supabase
        .from('messages')
        .select('sender_id, receiver_id')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false });

      if (msgs) {
        const uids = Array.from(new Set(msgs.flatMap(m => [m.sender_id, m.receiver_id]))).filter(id => id !== currentUser.id);
        if (uids.length > 0) {
          const { data: profiles } = await supabase.from('profiles').select('*').in('id', uids);
          if (profiles) {
            setInboxUsers(profiles.map(p => ({
              id: p.id,
              username: p.full_name || 'User',
              avatar: p.avatar_url || `https://picsum.photos/seed/${p.id}/200`
            })));
          }
        }
      }
    };
    fetchInbox();
  }, [currentUser.id]);

  // চ্যাট মেসেজ লোড এবং রিয়েল-টাইম লিসেনার
  useEffect(() => {
    if (!activeChat) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${activeChat.id}),and(sender_id.eq.${activeChat.id},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    const channel = supabase.channel(`realtime_chat_${activeChat.id}`)
      .on('postgres_changes', { event: 'INSERT', table: 'messages' }, (p) => {
        const nm = p.new;
        if ((nm.sender_id === currentUser.id && nm.receiver_id === activeChat.id) || 
            (nm.sender_id === activeChat.id && nm.receiver_id === currentUser.id)) {
          setMessages(prev => [...prev, nm]);
        }
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeChat, currentUser.id]);

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [messages]);

  const sendMessage = async () => {
    if (!msgInput.trim() || !activeChat) return;
    const { error } = await supabase.from('messages').insert({
      sender_id: currentUser.id,
      receiver_id: activeChat.id,
      content: msgInput
    });
    if (!error) setMsgInput('');
  };

  return (
    <div className="flex h-[calc(100vh-100px)] bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* বাম পাশের ইনবক্স লিস্ট (Desktop) */}
      <div className={`w-full md:w-80 border-r flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b bg-gray-50 font-black text-xl">Chats</div>
        <div className="flex-1 overflow-y-auto">
          {inboxUsers.map(user => (
            <button key={user.id} onClick={() => setActiveChat(user)} className={`w-full flex items-center gap-3 p-3 hover:bg-gray-100 transition-all ${activeChat?.id === user.id ? 'bg-red-50' : ''}`}>
               <img src={user.avatar} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" alt="" />
               <div className="text-left flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 truncate">{user.username}</h4>
                  <p className="text-xs text-gray-500 truncate">Tap to message</p>
               </div>
            </button>
          ))}
          {inboxUsers.length === 0 && <div className="p-8 text-center text-gray-400 font-bold text-sm">No messages yet. Start a conversation!</div>}
        </div>
      </div>

      {/* ডান পাশের মেসেজিং এরিয়া */}
      <div className={`flex-1 flex flex-col ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {activeChat ? (
          <>
            <header className="p-3 border-b flex items-center gap-3">
              <button onClick={() => setActiveChat(null)} className="md:hidden text-red-600"><i className="fa-solid fa-arrow-left"></i></button>
              <img src={activeChat.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
              <h3 className="font-bold text-gray-900">{activeChat.username}</h3>
            </header>
            <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-2">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] p-3 rounded-2xl text-sm font-bold shadow-sm ${m.sender_id === currentUser.id ? 'bg-red-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t bg-white flex gap-2">
              <input 
                type="text" 
                placeholder="Aa" 
                className="flex-1 bg-gray-100 rounded-full px-4 py-2 outline-none font-bold text-sm"
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button onClick={sendMessage} className="text-red-600 p-2"><i className="fa-solid fa-paper-plane text-xl"></i></button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <i className="fa-solid fa-bolt text-5xl mb-4 opacity-20"></i>
            <p className="font-bold">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messaging;
