
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
  const scrollRef = useRef<HTMLDivElement>(null);

  // ১. ইনবক্স লিস্ট লোড করা
  const fetchInbox = async () => {
    const { data: msgs } = await supabase
      .from('messages')
      .select('sender_id, receiver_id, created_at')
      .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
      .order('created_at', { ascending: false });

    if (msgs) {
      const uids = Array.from(new Set(msgs.flatMap(m => [m.sender_id, m.receiver_id])))
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
  };

  // ২. রিয়েল-টাইম লিসেনার সেটআপ (গ্লোবাল লিসেনার - ইনবক্স এবং চ্যাট সবার জন্য)
  useEffect(() => {
    fetchInbox();

    // এটি আপনার আইডির ওপর হওয়া সমস্ত মেসেজ চেঞ্জ ট্র্যাক করবে
    const globalChannel = supabase.channel('realtime_messaging_all')
      .on(
        'postgres_changes', 
        { event: 'INSERT', table: 'messages' }, 
        (payload) => {
          const newMsg = payload.new;
          
          // যদি মেসেজটি আমার জন্য হয় অথবা আমি পাঠিয়ে থাকি
          if (newMsg.receiver_id === currentUser.id || newMsg.sender_id === currentUser.id) {
            // ইনবক্স লিস্ট আপডেট করুন
            fetchInbox();

            // যদি এটি কারেন্ট ওপেন চ্যাটের মেসেজ হয়, তবে মেসেজ লিস্টে পুশ করুন
            if (
              (activeChat && newMsg.sender_id === activeChat.id) || 
              (activeChat && newMsg.sender_id === currentUser.id)
            ) {
              setMessages(prev => {
                // ডুপ্লিকেট মেসেজ চেক (আইডি দিয়ে)
                const exists = prev.find(m => m.id === newMsg.id);
                if (exists) return prev;
                return [...prev, newMsg];
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(globalChannel);
    };
  }, [currentUser.id, activeChat]);

  // ৩. স্পেসিফিক ইউজারের সাথে চ্যাট হিস্ট্রি লোড
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
  }, [activeChat, currentUser.id]);

  // ৪. অটো স্ক্রল লজিক
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  // ৫. মেসেজ পাঠানো (Optimistic UI লজিক সহ)
  const sendMessage = async () => {
    if (!msgInput.trim() || !activeChat || isSending) return;

    const content = msgInput;
    const tempId = 'temp-' + Date.now();
    setMsgInput('');
    setIsSending(true);

    // অপ্টিমিস্টিক আপডেট: ডাটাবেসে যাওয়ার আগেই স্ক্রিনে মেসেজ যোগ করুন
    const tempMsg = {
      id: tempId,
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
    }).select().single();

    setIsSending(false);

    if (error) {
      // এরর হলে টেম্পোরারি মেসেজটি রিমুভ করুন
      setMessages(prev => prev.filter(m => m.id !== tempId));
      alert("Message not sent. Check connection.");
    } else if (data) {
      // আসল ডাটা দিয়ে টেম্পোরারি মেসেজ রিপ্লেস করুন
      setMessages(prev => prev.map(m => m.id === tempId ? data : m));
    }
  };

  return (
    <div className="flex h-[calc(100vh-56px)] md:h-[calc(100vh-100px)] bg-white md:rounded-xl md:shadow-xl md:border overflow-hidden">
      {/* Inbox / Contacts List */}
      <div className={`w-full md:w-80 border-r flex flex-col bg-gray-50 ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b bg-white flex justify-between items-center">
          <h2 className="font-black text-2xl text-gray-900 tracking-tighter">Messenger</h2>
          <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors">
            <i className="fa-solid fa-pen-to-square"></i>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {inboxUsers.map(user => (
            <button 
              key={user.id} 
              onClick={() => setActiveChat(user)} 
              className={`w-full flex items-center gap-3 p-4 hover:bg-white transition-all border-l-4 ${activeChat?.id === user.id ? 'bg-white border-red-600' : 'border-transparent'}`}
            >
               <div className="relative shrink-0">
                 <img src={user.avatar} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" alt="" />
                 <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
               </div>
               <div className="text-left flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 truncate">{user.username}</h4>
                  <p className="text-xs text-gray-400 truncate font-medium">New interaction available</p>
               </div>
            </button>
          ))}
          {inboxUsers.length === 0 && (
            <div className="p-12 text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-300">
                <i className="fa-solid fa-comments text-2xl"></i>
              </div>
              <p className="text-sm text-gray-400 font-bold">Search friends to start a chat</p>
            </div>
          )}
        </div>
      </div>

      {/* Actual Chat Window */}
      <div className={`flex-1 flex flex-col bg-white ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {activeChat ? (
          <>
            <header className="p-3 border-b flex items-center justify-between bg-white/95 backdrop-blur-sm z-10 shadow-sm">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveChat(null)} className="md:hidden text-red-600 p-2 hover:bg-red-50 rounded-full">
                  <i className="fa-solid fa-arrow-left text-xl"></i>
                </button>
                <div className="relative">
                  <img src={activeChat.avatar} className="w-10 h-10 rounded-full object-cover border shadow-sm" alt="" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <h3 className="font-black text-gray-900 leading-tight">{activeChat.username}</h3>
                  <span className="text-[10px] text-green-600 font-bold uppercase tracking-widest">Active Now</span>
                </div>
              </div>
              <div className="flex gap-4 text-red-600 mr-2">
                 <button className="hover:bg-red-50 p-2 rounded-full transition-colors"><i className="fa-solid fa-phone"></i></button>
                 <button className="hover:bg-red-50 p-2 rounded-full transition-colors"><i className="fa-solid fa-video"></i></button>
                 <button className="hover:bg-red-50 p-2 rounded-full transition-colors"><i className="fa-solid fa-circle-info"></i></button>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto bg-[#f0f2f5] flex flex-col gap-3">
              <div className="flex flex-col items-center mb-8 mt-4 animate-in fade-in zoom-in duration-500">
                 <img src={activeChat.avatar} className="w-24 h-24 rounded-full border-4 border-white shadow-lg mb-3" alt="" />
                 <h4 className="font-black text-2xl text-gray-900">{activeChat.username}</h4>
                 <p className="text-xs text-gray-500 font-bold bg-white px-3 py-1 rounded-full shadow-sm">Friends on AddaSangi</p>
              </div>
              
              {messages.map((m) => {
                const isMe = m.sender_id === currentUser.id;
                return (
                  <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-1 duration-300`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm font-bold shadow-sm ${
                      isMe 
                      ? 'bg-red-600 text-white rounded-br-none' 
                      : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                    } ${m.is_sending ? 'opacity-70 animate-pulse' : 'opacity-100'}`}>
                      {m.content}
                      <div className={`text-[9px] mt-1 text-right ${isMe ? 'text-red-100' : 'text-gray-400'}`}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t bg-white flex items-center gap-3 pb-8 md:pb-4">
              <div className="flex gap-3 text-red-600 text-lg">
                 <button className="hover:bg-red-50 p-2 rounded-full"><i className="fa-solid fa-camera"></i></button>
                 <button className="hover:bg-red-50 p-2 rounded-full"><i className="fa-solid fa-image"></i></button>
              </div>
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  placeholder="Aa" 
                  className="w-full bg-gray-100 rounded-full px-5 py-2.5 outline-none font-bold text-sm focus:bg-gray-200 transition-all border border-transparent focus:border-red-100"
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
              </div>
              <button 
                onClick={sendMessage} 
                disabled={!msgInput.trim() || isSending}
                className={`transition-all ${msgInput.trim() ? 'text-red-600 scale-125' : 'text-gray-300 cursor-not-allowed'}`}
              >
                <i className="fa-solid fa-paper-plane text-xl"></i>
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-inner mb-4">
               <i className="fa-solid fa-bolt text-5xl text-red-500 animate-pulse"></i>
            </div>
            <h3 className="text-xl font-black text-gray-900">AddaSangi Messaging</h3>
            <p className="font-bold text-sm max-w-[250px] text-center mt-2">Connect with your friends in real-time. Fast, secure, and personal.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messaging;
