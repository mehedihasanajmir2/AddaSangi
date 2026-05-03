
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppTab, Post, User, Story, ReactionType } from './types';
import Feed from './components/Feed';
import Profile from './components/Profile';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import ContactsSidebar from './components/ContactsSidebar';
import Menu from './components/Menu';
import StoryBar from './components/StoryBar';
import TopNav from './components/TopNav';
import SearchResults from './components/SearchResults';
import Messaging from './components/Messaging';
import CallingOverlay from './components/CallingOverlay';
import SetUsername from './components/SetUsername';
import { supabase } from './services/supabaseClient';

const LOGO_URL = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjbaxCAakhVQOly5IhXfPkpbunmcsxREDf2xali0fkLp9gK5qNdh2KL-UhEmDICRaX6_HtDBQTKM6jgtCJuTzrjpKUynSLe6NCzCvRpCs8C6dBgy2wGzEmcV-EIdxh5r73ExANoAyfIufc5JdfXfY1Xal6BSK0fdnqwK0VCkOZTfEdb_GMAiBB-aB9wedf0/s1600/Gemini_Generated_Image_pnxgvipnxgvipnxg.png";
const NOTIFICATION_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"; 

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.MESSAGES);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedChatUser, setSelectedChatUser] = useState<User | null>(null);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  
  const [isCalling, setIsCalling] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('video');
  const [callingUser, setCallingUser] = useState<User | null>(null);
  const [isIncoming, setIsIncoming] = useState(false);
  
  const [activeNotification, setActiveNotification] = useState<{senderName: string, text: string} | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
    audioRef.current.load();
  }, []);

  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log("Audio play blocked"));
    }
  }, []);

  const fetchProfile = useCallback(async (userAuth: any) => {
    if (!userAuth) return;
    try {
      // Set a temporary user profile quickly to avoid white screen while waiting for DB
      const fallbackUser: User = {
        id: userAuth.id,
        username: userAuth.user_metadata?.username || '', // Explicitly empty if not set
        full_name: userAuth.user_metadata?.full_name || 'User',
        avatar: userAuth.user_metadata?.avatar_url || `https://picsum.photos/seed/${userAuth.id}/200`,
        email: userAuth.email,
        location: 'Bangladesh'
      };
      setCurrentUser(fallbackUser);

      const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', userAuth.id).maybeSingle();
      
      if (profile) {
        setCurrentUser({
          id: profile.id,
          username: profile.username || '', 
          full_name: profile.full_name || fallbackUser.full_name,
          avatar: profile.avatar_url || fallbackUser.avatar,
          coverUrl: profile.cover_url || `https://picsum.photos/seed/cover-${profile.id}/1200/400`,
          bio: profile.bio,
          email: profile.email || userAuth.email,
          location: profile.location || 'Bangladesh'
        });
      }
    } catch (err) { 
      console.error("Profile Fetch Error:", err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        setSession(s);
        if (s) await fetchProfile(s.user);
      } catch (err) { console.error("Init Error:", err); }
      finally { setLoadingSession(false); }
    };
    init();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) fetchProfile(s.user);
      else setCurrentUser(null);
    });
    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  useEffect(() => {
    if (!currentUser) return;
    const signalChannel = supabase.channel(`calls:${currentUser.id}`)
      .on('broadcast', { event: 'incoming_call' }, ({ payload }) => {
        if (!isCalling) {
          setCallingUser(payload.caller);
          setCallType(payload.callType);
          setIsIncoming(true);
          setIsCalling(true);
        }
      })
      .on('broadcast', { event: 'call_ended' }, () => {
        setIsCalling(false);
        setCallingUser(null);
        setIsIncoming(false);
      })
      .subscribe();
    return () => { supabase.removeChannel(signalChannel); };
  }, [currentUser, isCalling]);

  useEffect(() => {
    if (!currentUser) return;
    const channel = supabase.channel('app_global_realtime_v3')
      .on('postgres_changes' as any, { event: 'INSERT', table: 'messages' }, async (payload: any) => {
        const msg = payload.new;
        if (String(msg.receiver_id) === String(currentUser.id) && String(msg.sender_id) !== String(currentUser.id)) {
          playNotificationSound();
          if (activeTab !== AppTab.MESSAGES) setUnreadMessagesCount(prev => prev + 1);
          const { data: sender } = await supabase.from('profiles').select('full_name').eq('id', msg.sender_id).maybeSingle();
          setActiveNotification({
            senderName: sender?.full_name || 'AddaSangi User',
            text: msg.content
          });
          setTimeout(() => setActiveNotification(null), 5000);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUser, activeTab, playNotificationSound]);

  const loadFeed = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const { data: dbPosts } = await supabase.from('posts').select(`*, profiles(*), reactions(*), comments(*, profiles(full_name))`).order('created_at', { ascending: false });
      if (dbPosts) {
        setPosts(dbPosts.map((p: any) => ({
          id: p.id,
          user: { id: p.profiles?.id, username: p.profiles?.full_name, avatar: p.profiles?.avatar_url },
          caption: p.caption,
          imageUrl: p.image_url,
          likes: p.reactions?.length || 0,
          comments: p.comments?.map((c: any) => ({ id: c.id, username: c.profiles?.full_name, text: c.content, timestamp: 'Now' })) || [],
          timestamp: new Date(p.created_at).toLocaleDateString()
        })));
      }
    } catch (err) { console.error("Feed Load Error:", err); }
    setLoading(false);
  };

  useEffect(() => { if (session && currentUser) loadFeed(); }, [session, currentUser]);

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .or(`full_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
          .limit(20);
        
        if (profiles) {
          setSearchResults(profiles.map((p: any) => ({
            id: p.id,
            username: p.username || 'user',
            full_name: p.full_name || 'AddaSangi User',
            avatar: p.avatar_url || `https://picsum.photos/seed/${p.id}/200`,
            coverUrl: p.cover_url || `https://picsum.photos/seed/cover-${p.id}/1200/400`,
            bio: p.bio,
            email: p.email,
            location: p.location
          })));
        }
      } catch (err) {
        console.error("Search Error:", err);
      }
    };

    const timer = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const startCall = (type: 'audio' | 'video' = 'video', target: User | null = null) => {
    if (!target || !currentUser) return;
    setCallType(type);
    setCallingUser(target);
    setIsIncoming(false);
    setIsCalling(true);
    const channel = supabase.channel(`calls:${target.id}`);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({ type: 'broadcast', event: 'incoming_call', payload: { caller: currentUser, callType: type } });
      }
    });
  };

  const endCall = () => {
    if (callingUser && currentUser) {
      const channel = supabase.channel(`calls:${callingUser.id}`);
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.send({ type: 'broadcast', event: 'call_ended', payload: { from: currentUser.id } });
        }
      });
    }
    setIsCalling(false);
    setCallingUser(null);
    setIsIncoming(false);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
      setCurrentUser(null);
    } catch (err) {
      console.error("Logout Error:", err);
      // Fallback: forcefully clear local session if possible
      setSession(null);
      setCurrentUser(null);
    }
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <img src={LOGO_URL} className="w-20 h-20 animate-bounce mb-4" alt="" />
        <p className="text-[#1b5e20] font-black animate-pulse text-lg">আড্ডাসঙ্গী লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!session) return <Login onLogin={() => {}} />;
  
  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <img src={LOGO_URL} className="w-20 h-20 animate-bounce mb-4" alt="" />
        <p className="text-[#1b5e20] font-black animate-pulse text-lg">প্রোফাইল লোড হচ্ছে...</p>
      </div>
    );
  }

  // FORCE USERNAME SELECTION
  if (!currentUser.username) {
    return (
      <SetUsername 
        user={currentUser} 
        onComplete={(newUsername) => {
          setCurrentUser(prev => prev ? { ...prev, username: newUsername } : null);
        }} 
      />
    );
  }

  return (
    <div className="h-screen bg-[#e8f5e9] flex flex-col font-sans overflow-hidden">
      {/* WhatsApp Style Header (Global) */}
      <header className="h-16 bg-[#b71c1c] text-white flex items-center justify-between px-4 shadow-lg z-50 shrink-0">
        <h1 className="text-xl font-bold tracking-tight">AddaSangi</h1>
        <div className="flex items-center gap-5">
          <button onClick={() => setActiveTab(AppTab.SEARCH)} className="text-xl text-white/70 hover:text-white"><i className="fa-solid fa-magnifying-glass"></i></button>
          <button onClick={() => setActiveTab(AppTab.MENU)} className="text-xl text-white/70 hover:text-white md:hidden"><i className="fa-solid fa-ellipsis-vertical"></i></button>
        </div>
      </header>

      {/* WhatsApp Style Tabs (Mobile Only) */}
      <div className="md:hidden">
        <TopNav 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          onProfileClick={() => setActiveTab(AppTab.PROFILE)} 
          unreadMessagesCount={unreadMessagesCount}
        />
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          user={currentUser} 
          onProfileClick={() => setActiveTab(AppTab.PROFILE)}
          unreadMessagesCount={unreadMessagesCount}
        />
        {/* Main Content Area - Full Screen for WhatsApp feel */}
        <main className="flex-1 h-full overflow-hidden bg-white">
          {activeTab === AppTab.SEARCH && (
            <div className="h-full bg-white overflow-y-auto">
              <SearchResults results={searchResults} query={searchQuery} onQueryChange={setSearchQuery} onUserSelect={(u) => {setSelectedChatUser(u); setActiveTab(AppTab.MESSAGES);}} />
            </div>
          )}
          {activeTab === AppTab.MESSAGES && (
            <Messaging currentUser={currentUser} targetUser={selectedChatUser} onStartCall={(type, user) => startCall(type, user)} />
          )}
          {activeTab === AppTab.STATUS && (
            <div className="h-full bg-[#f0f2f5] overflow-y-auto">
               <StoryBar currentUser={currentUser} />
               <div className="p-4">
                 <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 px-2">Social Status</h3>
                 <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
                   <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                     <i className="fa-solid fa-bolt-lightning text-2xl text-red-600"></i>
                   </div>
                   <h4 className="font-bold text-gray-800">Global Updates</h4>
                   <p className="text-xs text-gray-500 mt-2 leading-relaxed">See what everyone is sharing around Bangladesh. Statuses disappear after 24 hours.</p>
                 </div>
               </div>
            </div>
          )}
          {activeTab === AppTab.CALLS && (
            <div className="h-full bg-[#f0f2f5] flex flex-col items-center justify-center text-gray-400 p-10 text-center">
               <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                 <i className="fa-solid fa-phone-slash text-4xl opacity-20"></i>
               </div>
               <h3 className="text-xl font-bold text-gray-800">No calls</h3>
               <p className="text-sm mt-2">Recent calls will appear here</p>
            </div>
          )}
          {activeTab === AppTab.PROFILE && (
            <div className="h-full bg-[#e8f5e9] overflow-y-auto p-4">
               <Profile 
                 user={currentUser} 
                 posts={posts.filter(p => p.user.id === currentUser.id)} 
                 isOwnProfile={true} 
                 currentUser={currentUser} 
                 onPostDelete={loadFeed} 
                 onLike={loadFeed} 
                 onUpdateProfile={(updatedData) => {
                   setCurrentUser(prev => prev ? { ...prev, ...updatedData } : null);
                   loadFeed(); // Refresh feed to show updated avatar in posts
                 }} 
               />
            </div>
          )}
          {activeTab === AppTab.MENU && (
            <div className="h-full bg-[#e8f5e9] overflow-y-auto p-4">
              <Menu user={currentUser} onLogout={handleLogout} onProfileClick={() => setActiveTab(AppTab.PROFILE)} />
            </div>
          )}
        </main>
      </div>

      {isCalling && callingUser && (
        <CallingOverlay initialType={callType} targetUser={callingUser} isIncoming={isIncoming} currentUser={currentUser} onClose={endCall} />
      )}
    </div>
  );
};

export default App;
