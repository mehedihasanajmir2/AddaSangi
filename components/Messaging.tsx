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
  const [isSending, setIsSending] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'online' | 'error'>('connecting');
  const scrollRef = useRef<HTMLDivElement>(null);

  // ইনবক্স লিস্ট লোড করা
  const fetchInbox = async () => {
    try {
      const { data: msgs, error } = await supabase
        .from('messages')
        .select('sender_id, receiver_id, created_at')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (msgs) {
        const uids = Array.from(new Set((msgs as any[]).flatMap(m => [String(m.sender_id), String(m.receiver_id)])))
          .filter(id => id !== currentUser.id);
        
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
    } catch (err: any) {
      console.error("Inbox Fetch Error:", err.message);
    }
  };

  // রিয়েল-টাইম সাবস্ক্রিপশন
  useEffect(() => {
    fetchInbox();
    
    // মেসেজ টেবিলের জন্য রিয়েল টাইম লিসেনার
    const channel = supabase.channel('global_chat_channel')
      .on('postgres_changes', 
        { event: 'INSERT', table: 'messages' }, 
        (payload) => {
          const newMsg = payload.new;
          const myId = String(currentUser.id);
          const senderId = String(newMsg.sender_id);
          const receiverId = String(newMsg.receiver_id);

          // চেক করা হচ্ছে মেসেজটি আমার কি না
          if (senderId === myId || receiverId === myId) {
            fetchInbox(); // ইনবক্স রিফ্রেশ

            // যদি একটি চ্যাট ওপেন থাকে এবং মেসেজটি সেই ইউজারের হয়
            if (activeChat) {
              const activeId = String(activeChat.id);
              if (senderId === activeId || receiverId === activeId) {
                setMessages(prev => {
                  if (prev.find(m => m.id === newMsg.id)) return prev;
                  return [...prev, newMsg];
                });
              }
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setRealtimeStatus('online');
        else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') setRealtimeStatus('error');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser.id, activeChat?.id]);

  // চ্যাট হিস্টোরি লোড করা
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
  }, [activeChat?.id, currentUser.id]);

  // অটো স্ক্রল ডাউন
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!msgInput.trim() || !activeChat || isSending) return;

    const content = msgInput;
    setMsgInput('');
    setIsSending(true);

    // অপ্টিমিস্টিক আপডেট (সাথে সাথে স্ক্রিনে দেখাবে)
    const tempMsg = {
      id: 'temp-' + Date.now(),
      sender_id: currentUser.id,
      receiver_id: activeChat.id,
      content: content,
      created_at: new Date().toISOString(),
      is_sending: true
    };
    setMessages(prev => [...prev, tempMsg]);

    const { error, data } = await supabase.from('messages').insert({
      sender_id: currentUser.id,
      receiver_id: activeChat.id,
      content: content
    }).select();

    setIsSending(false);

    if (error) {
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      alert("মেসেজ পাঠানো যায়নি!");
    } else if (data) {
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? data[0] : m));
    }
  };

  return (
    <div className="flex h-[calc(100vh-56px)] md:h-[calc(100vh-100px)] bg-white md:rounded-xl md:shadow-xl md:border overflow-hidden">
      {/* Sidebar */}
      <div className={`w-full md:w-80 border-r flex flex-col bg-gray-50 ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b bg-white flex justify-between items-center">
          <h2 className="font-black text-2xl text-gray-900">Chats</h2>
          <div className="flex items-center gap-2">
             <div className={`w-2 h-2 rounded-full ${realtimeStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
             <span className="text-[10px] font-black uppercase text-gray-400">{realtimeStatus}</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {inboxUsers.map(user => (
            <button key={user.id} onClick={() => setActiveChat(user)} className={`w-full flex items-center gap-3 p-4 hover:bg-white transition-all border-l-4 ${activeChat?.id === user.id ? 'bg-white border-red-600' : 'border-transparent'}`}>
               <img src={user.avatar} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" alt="" />
               <div className="text-left flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 truncate">{user.username}</h4>
                  <p className="text-xs text-gray-400 truncate">Tap to chat live</p>
               </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col bg-white ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {activeChat ? (
          <>
            <header className="p-3 border-b flex items-center justify-between bg-white/95 backdrop-blur-sm shadow-sm">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveChat(null)} className="md:hidden text-red-600 p-2"><i className="fa-solid fa-arrow-left text-xl"></i></button>
                <img src={activeChat.avatar} className="w-10 h-10 rounded-full object-cover border" alt="" />
                <div>
                  <h3 className="font-black text-gray-900 leading-tight">{activeChat.username}</h3>
                  <p className="text-[9px] text-green-600 font-bold uppercase tracking-tighter">● Instant Messaging Active</p>
                </div>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto bg-[#f8f9fa] flex flex-col gap-2">
              {messages.map((m) => {
                const isMe = String(m.sender_id) === String(currentUser.id);
                return (
                  <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm font-bold shadow-sm ${isMe ? 'bg-red-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border'}`}>
                      {m.content}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t bg-white flex items-center gap-3 pb-8 md:pb-4">
              <input 
                type="text" 
                placeholder="Type something..." 
                className="flex-1 bg-gray-100 rounded-full px-5 py-2.5 outline-none font-bold text-sm focus:ring-2 focus:ring-red-100"
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button onClick={sendMessage} className={`w-10 h-10 rounded-full flex items-center justify-center ${msgInput.trim() ? 'bg-red-600 text-white shadow-md' : 'text-gray-300'}`}>
                <i className="fa-solid fa-paper-plane text-lg"></i>
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50 text-center p-6">
            <i className="fa-solid fa-bolt-lightning text-6xl text-red-500 opacity-20 mb-4 animate-bounce"></i>
            <h3 className="text-xl font-black text-gray-900">AddaSangi Live</h3>
            <p className="font-bold text-sm text-gray-500 mt-1">Select a friend to experience Facebook-like instant chat.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messaging;