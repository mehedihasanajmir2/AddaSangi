
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
    const inboxChannel = supabase.channel('global_inbox_updates')
      .on('postgres_changes', { event: 'INSERT', table: 'messages' }, () => fetchInbox())
      .subscribe();
    return () => { supabase.removeChannel(inboxChannel); };
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

    const chatChannel = supabase.channel(`chat_${currentUser.id}_${activeChat.id}`)
      .on('postgres_changes', { event: 'INSERT', table: 'messages', filter: `sender_id=eq.${activeChat.id}` }, (p) => {
          if (p.new.receiver_id === currentUser.id) setMessages(prev => [...prev, p.new]);
      })
      .on('postgres_changes', { event: 'INSERT', table: 'messages', filter: `sender_id=eq.${currentUser.id}` }, (p) => {
          setMessages(prev => [...prev, p.new]);
      })
      .subscribe();
    return () => { supabase.removeChannel(chatChannel); };
  }, [activeChat, currentUser.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!msgInput.trim() || !activeChat || isSending) return;
    const content = msgInput;
    setMsgInput('');
    setIsSending(true);
    const { error } = await supabase.from('messages').insert({ sender_id: currentUser.id, receiver_id: activeChat.id, content });
    setIsSending(false);
    if (error) alert("Failed to send message.");
  };

  return (
    <div className="flex h-[calc(100vh-56px)] md:h-[calc(100vh-100px)] bg-white md:rounded-xl md:shadow-lg md:border overflow-hidden">
      {/* Inbox List */}
      <div className={`w-full md:w-80 border-r flex flex-col bg-gray-50 ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b bg-white flex justify-between items-center">
          <h2 className="font-black text-2xl text-gray-900">Chats</h2>
          <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600"><i className="fa-solid fa-pen-to-square"></i></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {inboxUsers.map(user => (
            <button key={user.id} onClick={() => setActiveChat(user)} className={`w-full flex items-center gap-3 p-4 hover:bg-white border-l-4 ${activeChat?.id === user.id ? 'bg-white border-red-600' : 'border-transparent'}`}>
               <img src={user.avatar} className="w-12 h-12 rounded-full object-cover border" alt="" />
               <div className="text-left flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 truncate">{user.username}</h4>
                  <p className="text-xs text-gray-500 truncate">Open conversation</p>
               </div>
            </button>
          ))}
          {inboxUsers.length === 0 && <div className="p-10 text-center text-gray-400 font-bold">No chats yet</div>}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col bg-white ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {activeChat ? (
          <>
            <header className="p-3 border-b flex items-center justify-between bg-white z-10 shadow-sm">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveChat(null)} className="md:hidden text-red-600 p-2"><i className="fa-solid fa-arrow-left text-xl"></i></button>
                <img src={activeChat.avatar} className="w-10 h-10 rounded-full object-cover border" alt="" />
                <h3 className="font-black text-gray-900 leading-none">{activeChat.username}</h3>
              </div>
              <div className="flex gap-4 text-red-600 mr-2">
                 <i className="fa-solid fa-phone"></i>
                 <i className="fa-solid fa-video"></i>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto bg-[#f0f2f5] flex flex-col gap-3">
              {messages.map((m, i) => {
                const isMe = m.sender_id === currentUser.id;
                return (
                  <div key={m.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] p-3 rounded-2xl text-sm font-bold shadow-sm ${isMe ? 'bg-red-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border'}`}>
                      {m.content}
                      <div className={`text-[9px] mt-1 text-right ${isMe ? 'text-red-100' : 'text-gray-400'}`}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t bg-white flex items-center gap-3 pb-6 md:pb-4">
              <div className="flex gap-3 text-red-600 text-lg hidden sm:flex">
                 <i className="fa-solid fa-camera"></i>
                 <i className="fa-solid fa-image"></i>
              </div>
              <input 
                type="text" 
                placeholder="Aa" 
                className="flex-1 bg-gray-100 rounded-full px-5 py-2.5 outline-none font-bold text-sm"
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button onClick={sendMessage} disabled={!msgInput.trim() || isSending} className="text-red-600"><i className="fa-solid fa-paper-plane text-xl"></i></button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <i className="fa-solid fa-bolt text-5xl mb-4 opacity-20"></i>
            <h3 className="text-xl font-black text-gray-900">Your Messages</h3>
            <p className="font-bold text-sm mt-2">Select a friend to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messaging;
