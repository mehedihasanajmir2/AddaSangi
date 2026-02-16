import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';

interface MessagePreview extends User {
  lastMessage?: string;
  lastMessageTime?: string;
  isMe?: boolean;
}

interface MessagingProps {
  currentUser: User;
  targetUser?: User | null;
}

const NOTIFICATION_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3";

const Messaging: React.FC<MessagingProps> = ({ currentUser, targetUser }) => {
  const [activeChat, setActiveChat] = useState<User | null>(targetUser || null);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [inboxUsers, setInboxUsers] = useState<MessagePreview[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'online' | 'error'>('connecting');
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
  }, []);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log("Audio play blocked by browser. User must interact first."));
    }
  };

  // ইনবক্স লিস্ট এবং শেষ মেসেজ লোড করা
  const fetchInbox = async () => {
    try {
      const { data: msgs, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (msgs) {
        const contactMap = new Map<string, any>();
        
        msgs.forEach((m: any) => {
          const otherId = String(m.sender_id) === String(currentUser.id) ? String(m.receiver_id) : String(m.sender_id);
          if (!contactMap.has(otherId)) {
            contactMap.set(otherId, {
              lastMessage: m.content,
              lastMessageTime: m.created_at,
              isMe: String(m.sender_id) === String(currentUser.id)
            });
          }
        });

        const uids = Array.from(contactMap.keys());
        
        if (uids.length > 0) {
          const { data: profiles } = await supabase.from('profiles').select('*').in('id', uids);
          if (profiles) {
            const formattedInbox = profiles.map(p => {
              const meta = contactMap.get(String(p.id));
              return {
                id: p.id,
                username: p.full_name || 'User',
                avatar: p.avatar_url || `https://picsum.photos/seed/${p.id}/200`,
                lastMessage: meta.lastMessage,
                lastMessageTime: meta.lastMessageTime,
                isMe: meta.isMe
              };
            }).sort((a, b) => new Date(b.lastMessageTime!).getTime() - new Date(a.lastMessageTime!).getTime());
            
            setInboxUsers(formattedInbox);
          }
        }
      }
    } catch (err: any) {
      console.error("Inbox Fetch Error:", err.message);
    }
  };

  useEffect(() => {
    fetchInbox();
    
    const channel = supabase.channel('global_chat_channel')
      .on('postgres_changes', 
        { event: 'INSERT', table: 'messages' }, 
        (payload) => {
          const newMsg = payload.new;
          const myId = String(currentUser.id);
          const senderId = String(newMsg.sender_id);
          const receiverId = String(newMsg.receiver_id);

          if (senderId === myId || receiverId === myId) {
            // যদি মেসেজটি আপনার নিজের না হয়, তবে সাউন্ড বাজান
            if (senderId !== myId) {
              playNotificationSound();
            }

            fetchInbox();
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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff/60)}m`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const sendMessage = async () => {
    if (!msgInput.trim() || !activeChat || isSending) return;
    const content = msgInput;
    setMsgInput('');
    setIsSending(true);

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
      {/* Sidebar - Inbox List */}
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
                  <div className="flex justify-between items-baseline gap-2">
                    <h4 className="font-bold text-gray-900 truncate">{user.username}</h4>
                    {user.lastMessageTime && (
                      <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap">{formatTime(user.lastMessageTime)}</span>
                    )}
                  </div>
                  <p className={`text-xs truncate ${!user.isMe ? 'font-black text-gray-900' : 'text-gray-500'}`}>
                    {user.isMe ? `You: ${user.lastMessage}` : user.lastMessage}
                  </p>
               </div>
            </button>
          ))}
          {inboxUsers.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              <p className="text-sm font-bold">কোন চ্যাট নেই। বন্ধু খুঁজুন!</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
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
                      <div className={`text-[8px] mt-1 text-right ${isMe ? 'text-red-100' : 'text-gray-400'}`}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t bg-white flex items-center gap-3 pb-8 md:pb-4">
              <input 
                type="text" 
                placeholder="Aa" 
                className="flex-1 bg-gray-100 rounded-full px-5 py-2.5 outline-none font-bold text-sm focus:bg-gray-200"
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
            <p className="font-bold text-sm text-gray-500 mt-1">কারো সাথে আড্ডা শুরু করতে তাকে সিলেক্ট করুন।</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messaging;