
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

  // ১. ইনবক্স লোড করা এবং রিয়েল-টাইম আপডেট রাখা
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

  useEffect(() => {
    fetchInbox();
    
    // ইনবক্সের জন্য রিয়েল টাইম লিসেনার (নতুন কেউ মেসেজ দিলে লিস্ট আপডেট হবে)
    const inboxChannel = supabase.channel('global_inbox_updates')
      .on('postgres_changes', { event: 'INSERT', table: 'messages' }, (payload) => {
        if (payload.new.receiver_id === currentUser.id || payload.new.sender_id === currentUser.id) {
          fetchInbox();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(inboxChannel); };
  }, [currentUser.id]);

  // ২. চ্যাট মেসেজ লোড এবং রিয়েল-টাইম লিসেনার (Active Chat)
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

    // মেইন রিয়েল টাইম লজিক
    const chatChannel = supabase.channel(`chat_${currentUser.id}_${activeChat.id}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          table: 'messages',
          filter: `sender_id=eq.${activeChat.id}` // শুধুমাত্র বিপরীত পাশের ইউজারের মেসেজ ধরবে
        }, 
        (payload) => {
          if (payload.new.receiver_id === currentUser.id) {
            setMessages(prev => {
              // ডুপ্লিকেট মেসেজ চেক
              if (prev.find(m => m.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
          }
        }
      )
      .on('postgres_changes',
        {
           event: 'INSERT',
           table: 'messages',
           filter: `sender_id=eq.${currentUser.id}` // নিজের মেসেজ কনফার্মেশন ধরবে
        },
        (payload) => {
           setMessages(prev => {
             if (prev.find(m => m.id === payload.new.id)) return prev;
             return [...prev, payload.new];
           });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(chatChannel); };
  }, [activeChat, currentUser.id]);

  // অটো স্ক্রল
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  // ৩. মেসেজ পাঠানো (Optimistic UI)
  const sendMessage = async () => {
    if (!msgInput.trim() || !activeChat || isSending) return;

    const newMessageContent = msgInput;
    setMsgInput('');
    setIsSending(true);

    // অপ্টিমিস্টিক আপডেট (সাথে সাথে স্ক্রিনে দেখাবে)
    const tempId = Date.now().toString();
    const optimisticMsg = {
      id: tempId,
      sender_id: currentUser.id,
      receiver_id: activeChat.id,
      content: newMessageContent,
      created_at: new Date().toISOString(),
      is_optimistic: true // আমরা চাইলে এটি দিয়ে হালকা স্টাইল দিতে পারি
    };
    
    setMessages(prev => [...prev, optimisticMsg]);

    const { error, data } = await supabase.from('messages').insert({
      sender_id: currentUser.id,
      receiver_id: activeChat.id,
      content: newMessageContent
    }).select().single();

    setIsSending(false);

    if (error) {
      console.error("Message send failed:", error);
      // এরর হলে অপ্টিমিস্টিক মেসেজ সরিয়ে ফেলুন
      setMessages(prev => prev.filter(m => m.id !== tempId));
      alert("Failed to send message. Please try again.");
    } else {
      // রিয়েল মেসেজ দিয়ে টেম্পোরারি মেসেজ রিপ্লেস করুন
      setMessages(prev => prev.map(m => m.id === tempId ? data : m));
    }
  };

  return (
    <div className="flex h-[calc(100vh-100px)] bg-white rounded-xl shadow-lg border overflow-hidden animate-in fade-in duration-300">
      {/* Inbox List */}
      <div className={`w-full md:w-80 border-r flex flex-col bg-gray-50 ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b bg-white flex justify-between items-center">
          <h2 className="font-black text-2xl text-gray-900 tracking-tighter">Chats</h2>
          <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200">
            <i className="fa-solid fa-pen-to-square text-sm"></i>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {inboxUsers.map(user => (
            <button 
              key={user.id} 
              onClick={() => setActiveChat(user)} 
              className={`w-full flex items-center gap-3 p-4 hover:bg-white transition-all border-l-4 ${activeChat?.id === user.id ? 'bg-white border-red-600' : 'border-transparent'}`}
            >
               <div className="relative">
                 <img src={user.avatar} className="w-12 h-12 rounded-full object-cover border shadow-sm" alt="" />
                 <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
               </div>
               <div className="text-left flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 truncate">{user.username}</h4>
                  <p className="text-xs text-gray-500 truncate font-medium">Tap to open conversation</p>
               </div>
            </button>
          ))}
          {inboxUsers.length === 0 && (
            <div className="p-10 text-center flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-400">
                 <i className="fa-solid fa-message text-2xl"></i>
              </div>
              <p className="text-sm text-gray-400 font-bold">No chats yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col bg-white ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {activeChat ? (
          <>
            <header className="p-3 border-b flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveChat(null)} className="md:hidden text-red-600 p-2"><i className="fa-solid fa-arrow-left text-xl"></i></button>
                <div className="relative">
                  <img src={activeChat.avatar} className="w-10 h-10 rounded-full object-cover border" alt="" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <h3 className="font-black text-gray-900 leading-none">{activeChat.username}</h3>
                  <span className="text-[10px] text-green-600 font-bold uppercase tracking-widest">Online</span>
                </div>
              </div>
              <div className="flex gap-4 text-red-600 mr-2">
                 <i className="fa-solid fa-phone cursor-pointer hover:scale-110 transition-transform"></i>
                 <i className="fa-solid fa-video cursor-pointer hover:scale-110 transition-transform"></i>
                 <i className="fa-solid fa-circle-info cursor-pointer hover:scale-110 transition-transform"></i>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto bg-[#f0f2f5] flex flex-col gap-3">
              <div className="flex flex-col items-center mb-6 mt-4">
                 <img src={activeChat.avatar} className="w-20 h-20 rounded-full border-4 border-white shadow-md mb-2" alt="" />
                 <h4 className="font-black text-xl text-gray-900">{activeChat.username}</h4>
                 <p className="text-xs text-gray-500 font-bold">You're friends on AddaSangi</p>
              </div>
              
              {messages.map((m, i) => {
                const isMe = m.sender_id === currentUser.id;
                return (
                  <div key={m.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`max-w-[75%] p-3 rounded-2xl text-sm font-bold shadow-sm ${
                      isMe 
                      ? 'bg-red-600 text-white rounded-br-none' 
                      : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                    } ${m.is_optimistic ? 'opacity-70' : 'opacity-100'}`}>
                      {m.content}
                      <div className={`text-[9px] mt-1 text-right ${isMe ? 'text-red-100' : 'text-gray-400'}`}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t bg-white flex items-center gap-3">
              <div className="flex gap-3 text-red-600 text-lg">
                 <i className="fa-solid fa-circle-plus cursor-pointer"></i>
                 <i className="fa-solid fa-camera cursor-pointer"></i>
                 <i className="fa-solid fa-image cursor-pointer"></i>
              </div>
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  placeholder="Type a message..." 
                  className="w-full bg-gray-100 rounded-full px-5 py-2.5 outline-none font-bold text-sm focus:bg-gray-200 transition-all"
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600">
                   <i className="fa-solid fa-face-smile cursor-pointer"></i>
                </div>
              </div>
              <button 
                onClick={sendMessage} 
                disabled={!msgInput.trim() || isSending}
                className={`transition-all ${msgInput.trim() ? 'text-red-600 scale-110' : 'text-gray-300'}`}
              >
                <i className="fa-solid fa-paper-plane text-xl"></i>
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-inner mb-4">
               <i className="fa-solid fa-bolt text-5xl text-red-100"></i>
            </div>
            <h3 className="text-xl font-black text-gray-900">Your Messages</h3>
            <p className="font-bold text-sm max-w-[250px] text-center mt-2">Select a friend to start a real-time conversation.</p>
            <button className="mt-6 bg-red-600 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg shadow-red-200 hover:scale-105 transition-transform">
               Start Chatting
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messaging;
