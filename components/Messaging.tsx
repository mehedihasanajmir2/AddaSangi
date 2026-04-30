
import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';

interface MessagePreview extends User {
  lastMessage?: string;
  lastMessageTime?: string;
  isMe?: boolean;
  isSeen?: boolean;
}

interface MessagingProps {
  currentUser: User;
  targetUser?: User | null;
  onStartCall?: (type: 'audio' | 'video', target: User) => void;
}

const Messaging: React.FC<MessagingProps> = ({ currentUser, targetUser, onStartCall }) => {
  const [activeChat, setActiveChat] = useState<User | null>(targetUser || null);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [inboxUsers, setInboxUsers] = useState<MessagePreview[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'online' | 'error'>('connecting');
  const [inboxError, setInboxError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (targetUser) {
      setActiveChat(targetUser);
    }
  }, [targetUser]);

  const fetchInbox = async () => {
    try {
      setInboxError(null);
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
              isMe: String(m.sender_id) === String(currentUser.id),
              isSeen: m.is_seen
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
                isMe: meta.isMe,
                isSeen: meta.isSeen
              };
            }).sort((a, b) => new Date(b.lastMessageTime!).getTime() - new Date(a.lastMessageTime!).getTime());
            setInboxUsers(formattedInbox);
          }
        } else {
          setInboxUsers([]);
        }
      }
    } catch (err: any) { 
      console.error("Inbox Fetch Error:", err.message);
      setInboxError(err.message);
    }
  };

  useEffect(() => {
    fetchInbox();
    const channelName = `messages_realtime_${currentUser.id}_${Date.now()}`;
    const channel = supabase.channel(channelName)
      .on('postgres_changes' as any, { 
        event: '*', 
        table: 'messages',
        schema: 'public'
      }, async (payload: any) => {
        const msg = payload.new || payload.old;
        if (!msg) return;

        const myId = String(currentUser.id);
        const senderId = String(msg.sender_id);
        const receiverId = String(msg.receiver_id);

        if (senderId === myId || receiverId === myId) {
          if (payload.eventType === 'INSERT') {
            await handleIncomingMessage(msg);
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => prev.map(m => m.id === msg.id ? msg : m));
            fetchInbox();
          }
        }
      })
      .subscribe((status) => {
        setRealtimeStatus(status === 'SUBSCRIBED' ? 'online' : 'connecting');
      });

    return () => { supabase.removeChannel(channel); };
  }, [currentUser.id]);

  const handleIncomingMessage = async (newMsg: any) => {
    const myId = String(currentUser.id);
    const senderId = String(newMsg.sender_id);
    const receiverId = String(newMsg.receiver_id);
    
    if (senderId === myId || receiverId === myId) {
      await fetchInbox();
      if (activeChat) {
        const activeId = String(activeChat.id);
        if (senderId === activeId || receiverId === activeId) {
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          if (receiverId === myId && senderId === activeId) {
            markAsSeen();
          }
        }
      }
    }
  };

  const markAsSeen = async () => {
    if (!activeChat) return;
    try {
      await supabase
        .from('messages')
        .update({ is_seen: true })
        .eq('sender_id', activeChat.id)
        .eq('receiver_id', currentUser.id);
    } catch (err) {
      console.error("Error marking as seen:", err);
    }
  };

  useEffect(() => {
    const handleFocus = () => {
      if (activeChat) markAsSeen();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [activeChat?.id]);

  useEffect(() => {
    if (!activeChat) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${activeChat.id}),and(sender_id.eq.${activeChat.id},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true });
      if (data) {
        setMessages(data);
        markAsSeen();
      }
    };
    fetchMessages();
  }, [activeChat?.id, currentUser.id]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const sendMessage = async () => {
    if (!msgInput.trim() || !activeChat || isSending) return;
    
    const content = msgInput;
    const receiverId = activeChat.id;
    const senderId = currentUser.id;
    
    setMsgInput('');
    setIsSending(true);
    
    const tempId = 'temp-' + Date.now();
    const tempMsg = { 
      id: tempId, 
      sender_id: senderId, 
      receiver_id: receiverId, 
      content: content, 
      created_at: new Date().toISOString(), 
      is_sending: true,
      is_seen: false 
    };
    
    setMessages(prev => [...prev, tempMsg]);
    
    try {
      const { error, data } = await supabase.from('messages').insert({ 
        sender_id: senderId, 
        receiver_id: receiverId, 
        content: content
      }).select();
      
      if (error) throw error;
      
      if (data) {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...data[0], is_sending: false } : m));
        fetchInbox();
      }
    } catch (err: any) {
      console.error("Message Send Failed:", err);
      // Give feedback in the temp message instead of just deleting it
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, is_sending: false, error: true } : m));
      // Optionally remove after a delay
      setTimeout(() => {
        setMessages(prev => prev.filter(m => m.id !== tempId || m.error));
      }, 3000);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-full bg-white overflow-hidden">
      {/* Inbox / Chat List */}
      <div className={`w-full md:w-[400px] border-r flex flex-col bg-white ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        {/* WhatsApp Web Left Header */}
        <div className="h-16 bg-[#1b5e20] flex items-center justify-between px-4 shrink-0 border-b border-white/10">
          <img src={currentUser.avatar} className="w-10 h-10 rounded-full object-cover cursor-pointer border border-white/20" alt="profile" />
          <div className="flex items-center gap-5 text-white/70 text-xl">
            <button className="hover:text-white"><i className="fa-solid fa-circle-notch"></i></button>
            <button className="hover:text-white"><i className="fa-solid fa-message"></i></button>
            <button className="hover:text-white"><i className="fa-solid fa-ellipsis-vertical"></i></button>
          </div>
        </div>
        
        {/* Search in Chats */}
        <div className="p-2 bg-[#e8f5e9] border-b border-green-100">
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-green-600 text-sm"></i>
            <input 
              type="text" 
              placeholder="Search or start new chat" 
              className="w-full bg-white rounded-lg py-2 pl-12 pr-4 outline-none text-sm placeholder:text-green-800/50 text-green-900 border border-green-200" 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {inboxUsers.length > 0 ? (
            inboxUsers.map(user => (
              <button key={user.id} onClick={() => setActiveChat(user)} className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-all ${activeChat?.id === user.id ? 'bg-gray-100' : ''}`}>
                 <div className="relative shrink-0">
                   <img src={user.avatar} className="w-12 h-12 rounded-full object-cover border shadow-sm" alt="" />
                   <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                 </div>
                 <div className="text-left flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h4 className="font-bold text-gray-900 truncate text-sm">{user.username}</h4>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {user.lastMessageTime ? new Date(user.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${(user.isMe === false && user.isSeen !== true) ? 'font-bold text-gray-800' : 'text-gray-500'}`}>
                      {user.isMe && (
                        user.isSeen === true ? 
                        <span className="text-[10px] mr-1 text-blue-500 font-medium">Seen</span> :
                        <i className="fa-solid fa-check text-[10px] mr-1 text-gray-400"></i>
                      )}
                      {user.lastMessage}
                    </p>
                 </div>
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center text-gray-400">
              <i className="fa-solid fa-comments text-4xl mb-3 opacity-20"></i>
              <p className="text-xs font-bold">No chats yet. Start a conversation!</p>
            </div>
          )}
        </div>
      </div>

      {/* Active Chat Window */}
      <div className={`flex-1 flex flex-col bg-[#e8f5e9] relative ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {activeChat ? (
          <>
            <header className="h-16 border-b flex items-center justify-between bg-[#b71c1c] px-4 shadow-sm z-10 text-white">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveChat(null)} className="md:hidden text-white p-2 -ml-2"><i className="fa-solid fa-arrow-left text-lg"></i></button>
                <img src={activeChat.avatar} className="w-10 h-10 rounded-full object-cover border border-white/20 shadow-sm" alt="" />
                <div>
                  <h3 className="font-bold text-white leading-tight text-sm">{activeChat.username}</h3>
                  <p className="text-[10px] text-white/70 font-medium">online</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => onStartCall?.('video', activeChat)} className="text-white/80 hover:text-white transition-all"><i className="fa-solid fa-video"></i></button>
                <button onClick={() => onStartCall?.('audio', activeChat)} className="text-white/80 hover:text-white transition-all"><i className="fa-solid fa-phone"></i></button>
                <button className="text-white/80 hover:text-white transition-all"><i className="fa-solid fa-ellipsis-vertical"></i></button>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto flex flex-col gap-1.5 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat">
              {messages.map((m, idx) => {
                const isMe = String(m.sender_id) === String(currentUser.id);
                const prevMsg = idx > 0 ? messages[idx-1] : null;
                const isSameSender = prevMsg && String(prevMsg.sender_id) === String(m.sender_id);
                
                return (
                  <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${!isSameSender ? 'mt-2' : 'mt-0.5'}`}>
                    <div className={`max-w-[85%] md:max-w-[70%] p-2 px-3 rounded-lg text-[13px] shadow-sm relative ${isMe ? 'bg-[#dcf8c6] text-gray-800 rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'}`}>
                      {!isMe && !isSameSender && <span className="block text-[10px] font-bold text-red-600 mb-0.5">{activeChat.username}</span>}
                      <p className="leading-relaxed">{m.content}</p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-[9px] text-gray-400 font-medium">
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && (
                          m.error ? (
                            <i className="fa-solid fa-circle-exclamation text-red-500 ml-1 text-[10px]" title="Failed to send"></i>
                          ) : m.is_seen === true ? (
                            <span className="text-[9px] text-blue-500 font-bold ml-1">Seen</span>
                          ) : (
                            <i className="fa-solid fa-check text-[10px] text-gray-400 ml-1"></i>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-2 bg-[#1b5e20] flex items-center gap-2">
              <div className="flex items-center gap-1">
                <button className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-white"><i className="fa-regular fa-face-smile text-xl"></i></button>
                <button className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-white"><i className="fa-solid fa-paperclip text-lg"></i></button>
              </div>
              <input 
                type="text" 
                placeholder="Type a message" 
                className="flex-1 bg-white rounded-lg px-4 py-2.5 outline-none text-sm shadow-sm text-green-900 placeholder:text-green-800/50" 
                value={msgInput} 
                onChange={(e) => setMsgInput(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()} 
              />
              <button 
                onClick={sendMessage} 
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${msgInput.trim() ? 'bg-[#b71c1c] text-white shadow-md' : 'text-white/50'}`}
              >
                <i className={`fa-solid ${msgInput.trim() ? 'fa-paper-plane' : 'fa-microphone'} text-lg`}></i>
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-[#f8f9fa] text-center p-10">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <i className="fa-solid fa-laptop text-5xl text-gray-200"></i>
            </div>
            <h3 className="text-2xl font-light text-gray-600">AddaSangi Web</h3>
            <p className="max-w-xs text-sm text-gray-500 mt-4 leading-relaxed">
              Send and receive messages without keeping your phone online.<br/>
              Use AddaSangi on up to 4 linked devices and 1 phone at the same time.
            </p>
            <div className="mt-auto flex items-center gap-2 text-xs text-gray-400">
              <i className="fa-solid fa-lock"></i>
              <span>End-to-end encrypted</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messaging;
