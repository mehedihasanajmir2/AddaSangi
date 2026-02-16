
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

  useEffect(() => {
    if (targetUser) setActiveChat(targetUser);
  }, [targetUser]);

  // ইনবক্সে শুধু তাদেরই দেখাবে যাদের সাথে আপনি মেসেজ চালাচালি করেছেন
  useEffect(() => {
    const fetchInbox = async () => {
      // নিজের আইডি বাদে বাকিদের মেসেজ থেকে বের করুন
      const { data: msgs } = await supabase
        .from('messages')
        .select('sender_id, receiver_id')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false });

      if (msgs) {
        // ইউনিক ইউজার আইডি বের করা
        const userIds = Array.from(new Set(
          msgs.flatMap(m => [m.sender_id, m.receiver_id])
        )).filter(id => id !== currentUser.id);

        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .in('id', userIds);
          
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

    const channel = supabase
      .channel(`chat_${activeChat.id}`)
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
    
    const { error } = await supabase.from('messages').insert({
      sender_id: currentUser.id,
      receiver_id: activeChat.id,
      content: content
    });

    if (error) {
      console.error("Error sending message:", error.message);
      alert("Message sending failed. Try again.");
    }
  };

  if (activeChat) {
    return (
      <div className="flex flex-col h-[calc(100vh-120px)] bg-white rounded-xl shadow-lg overflow-hidden animate-in slide-in-from-right duration-300">
        <header className="flex items-center gap-3 p-3 border-b bg-white">
          <button onClick={() => setActiveChat(null)} className="text-gray-500 hover:text-red-600 md:hidden">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <img src={activeChat.avatar} className="w-9 h-9 rounded-full border object-cover" alt="" />
          <div className="flex-1">
            <h3 className="font-bold text-sm text-gray-900">{activeChat.username}</h3>
            <span className="text-[10px] text-green-600 font-bold uppercase tracking-tighter">Connected</span>
          </div>
          <div className="flex gap-4 text-red-600 px-2">
            <i className="fa-solid fa-phone"></i>
            <i className="fa-solid fa-video"></i>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-2">
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 opacity-50">
              <i className="fa-solid fa-comment-dots text-4xl mb-2"></i>
              <p className="text-xs font-bold">Start your conversation</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm font-medium shadow-sm ${
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
            className="flex-1 bg-gray-100 rounded-full px-4 py-2 outline-none focus:bg-white border focus:border-red-100 text-sm font-bold"
            value={msgInput}
            onChange={(e) => setMsgInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button onClick={sendMessage} className={`text-red-600 p-2 transition-all ${!msgInput.trim() ? 'opacity-30' : 'hover:scale-110 active:scale-90'}`}>
            <i className="fa-solid fa-paper-plane text-xl"></i>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 border-b bg-gray-50/50">
        <h2 className="text-2xl font-black text-gray-900 tracking-tighter">Messages</h2>
      </div>
      <div className="flex-1 overflow-y-auto bg-white">
        {inboxUsers.length > 0 ? (
          inboxUsers.map(user => (
            <button key={user.id} onClick={() => setActiveChat(user)} className="w-full flex items-center gap-3 p-4 hover:bg-red-50/30 transition-all border-b border-gray-50 group">
              <div className="relative">
                <img src={user.avatar} className="w-14 h-14 rounded-full border-2 border-white shadow-sm object-cover" alt="" />
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="text-left flex-1 min-w-0">
                <h4 className="font-black text-gray-900 group-hover:text-red-600 transition-colors">{user.username}</h4>
                <p className="text-xs text-gray-500 font-bold truncate">Tap to see messages</p>
              </div>
              <i className="fa-solid fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-300"></i>
            </button>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-10 text-center opacity-40">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
               <i className="fa-solid fa-inbox text-3xl"></i>
            </div>
            <h3 className="text-lg font-black">No conversations yet</h3>
            <p className="text-xs font-bold">Search for friends to start a chat</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messaging;
