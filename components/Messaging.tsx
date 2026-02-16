
import React, { useState, useEffect, useRef } from 'react';
import { Chat, User } from '../types';
import { supabase } from '../services/supabaseClient';

interface MessagingProps {
  currentUser: User;
  targetUser?: User | null;
  isPopover?: boolean;
}

const Messaging: React.FC<MessagingProps> = ({ currentUser, targetUser, isPopover = false }) => {
  const [activeChat, setActiveChat] = useState<User | null>(targetUser || null);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [recentChats, setRecentChats] = useState<User[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (targetUser) setActiveChat(targetUser);
  }, [targetUser]);

  // Fetch recent chats (mocked via unique profiles for now, ideally needs a 'conversations' table)
  useEffect(() => {
    const fetchRecent = async () => {
      const { data } = await supabase.from('profiles').select('*').limit(5);
      if (data) {
        setRecentChats(data.map(p => ({
          id: p.id,
          username: p.full_name,
          avatar: p.avatar_url || `https://picsum.photos/seed/${p.id}/200`
        })).filter(u => u.id !== currentUser.id));
      }
    };
    fetchRecent();
  }, [currentUser.id]);

  // Real-time messages fetch
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

    // Subscribe to new messages
    const channel = supabase
      .channel('realtime_messages')
      .on('postgres_changes', { event: 'INSERT', table: 'messages' }, (payload) => {
        const nm = payload.new;
        if ((nm.sender_id === currentUser.id && nm.receiver_id === activeChat.id) || 
            (nm.sender_id === activeChat.id && nm.receiver_id === currentUser.id)) {
          setMessages(prev => [...prev, nm]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeChat, currentUser.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const sendMessage = async () => {
    if (!msgInput.trim() || !activeChat) return;
    const content = msgInput;
    setMsgInput('');
    
    await supabase.from('messages').insert({
      sender_id: currentUser.id,
      receiver_id: activeChat.id,
      content: content
    });
  };

  if (activeChat) {
    return (
      <div className="flex flex-col h-[calc(100vh-120px)] bg-white rounded-xl shadow-lg overflow-hidden animate-in slide-in-from-right duration-300">
        <header className="flex items-center gap-3 p-3 border-b bg-white">
          <button onClick={() => setActiveChat(null)} className="text-gray-500 hover:text-red-600 md:hidden">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <img src={activeChat.avatar} className="w-9 h-9 rounded-full border" alt="" />
          <div className="flex-1">
            <h3 className="font-bold text-sm text-gray-900">{activeChat.username}</h3>
            <span className="text-[10px] text-green-600 font-bold uppercase">Active Now</span>
          </div>
          <div className="flex gap-4 text-red-600">
            <i className="fa-solid fa-phone"></i>
            <i className="fa-solid fa-video"></i>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-2">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm font-medium ${
                m.sender_id === currentUser.id ? 'bg-[#b71c1c] text-white rounded-br-none' : 'bg-white border text-gray-800 rounded-bl-none'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-white border-t flex items-center gap-2">
          <input 
            type="text" 
            placeholder="Aa" 
            className="flex-1 bg-gray-100 rounded-full px-4 py-2 outline-none focus:bg-white border focus:border-red-100"
            value={msgInput}
            onChange={(e) => setMsgInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button onClick={sendMessage} className={`text-red-600 p-2 ${!msgInput.trim() ? 'opacity-30' : ''}`}>
            <i className="fa-solid fa-paper-plane text-xl"></i>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-2xl font-black text-gray-900">Chats</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {recentChats.map(user => (
          <button key={user.id} onClick={() => setActiveChat(user)} className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 transition-all border-b border-gray-50">
            <img src={user.avatar} className="w-12 h-12 rounded-full border" alt="" />
            <div className="text-left">
              <h4 className="font-bold text-gray-900">{user.username}</h4>
              <p className="text-xs text-gray-500">Tap to start chatting</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Messaging;
