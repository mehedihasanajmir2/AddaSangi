
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppTab, Post, User, Story, ReactionType } from './types';
import Feed from './components/Feed';
import Profile from './components/Profile';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import ContactsSidebar from './components/ContactsSidebar';
import Menu from './components/Menu';
import BottomNav from './components/BottomNav';
import SearchResults from './components/SearchResults';
import Messaging from './components/Messaging';
import CallingOverlay from './components/CallingOverlay';
import { supabase } from './services/supabaseClient';

const LOGO_URL = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjbaxCAakhVQOly5IhXfPkpbunmcsxREDf2xali0fkLp9gK5qNdh2KL-UhEmDICRaX6_HtDBQTKM6jgtCJuTzrjpKUynSLe6NCzCvRpCs8C6dBgy2wGzEmcV-EIdxh5r73ExANoAyfIufc5JdfXfY1Xal6BSK0fdnqwK0VCkOZTfEdb_GMAiBB-aB9wedf0/s1600/Gemini_Generated_Image_pnxgvipnxgvipnxg.png";
const NOTIFICATION_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"; 

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.FEED);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedChatUser, setSelectedChatUser] = useState<User | null>(null);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [isCalling, setIsCalling] = useState(false);
  
  // মেসেজ টোস্ট স্টেট (কল চলাকালীন মেসেজ দেখার জন্য)
  const [activeNotification, setActiveNotification] = useState<{senderName: string, text: string} | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
    audioRef.current.load();
  }, []);

  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log("Audio play blocked: interaction needed"));
    }
  }, []);

  const fetchProfile = useCallback(async (userAuth: any) => {
    if (!userAuth) return;
    try {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', userAuth.id).maybeSingle();
      if (profile) {
        setCurrentUser({
          id: profile.id,
          username: profile.full_name || userAuth.user_metadata?.full_name || 'AddaSangi User',
          avatar: profile.avatar_url || `https://picsum.photos/seed/${profile.id}/200`,
          coverUrl: profile.cover_url || `https://picsum.photos/seed/cover-${profile.id}/1200/400`,
          bio: profile.bio,
          email: profile.email || userAuth.email,
          location: profile.location
        });
      }
    } catch (err) { console.error("Profile Fetch Error:", err); }
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

  // গ্লোবাল মেসেজ নোটিফিকেশন - এটি কল চালু থাকলেও বাজবে (যেমন কম্পিউটারে হয়)
  useEffect(() => {
    if (!currentUser) return;
    const channel = supabase.channel('app_global_realtime')
      .on('postgres_changes', { event: 'INSERT', table: 'messages' }, async (payload) => {
        const msg = payload.new;
        if (String(msg.receiver_id) === String(currentUser.id) && String(msg.sender_id) !== String(currentUser.id)) {
          // ১. সাউন্ড বাজানো (যেকোনো মোডে)
          playNotificationSound();
          
          // ২. মেসেজ কাউন্ট আপডেট
          if (activeTab !== AppTab.MESSAGES) {
            setUnreadMessagesCount(prev => prev + 1);
          }

          // ৩. পপ-আপ টোস্ট দেখানো (যদি কলিং বা ফিডে থাকে)
          const { data: sender } = await supabase.from('profiles').select('full_name').eq('id', msg.sender_id).maybeSingle();
          setActiveNotification({
            senderName: sender?.full_name || 'কেউ একজন',
            text: msg.content
          });
          
          // ৫ সেকেন্ড পর অটো রিমুভ
          setTimeout(() => setActiveNotification(null), 5000);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUser, activeTab, playNotificationSound]);

  useEffect(() => {
    if (activeTab === AppTab.MESSAGES) setUnreadMessagesCount(0);
  }, [activeTab]);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) { setSearchResults([]); return; }
    try {
      const { data } = await supabase.from('profiles').select('*').ilike('full_name', `%${query}%`).limit(10);
      if (data) {
        setSearchResults(data.map(p => ({
          id: p.id,
          username: p.full_name || 'User',
          avatar: p.avatar_url || `https://picsum.photos/seed/${p.id}/200`
        })));
      }
    } catch (err) { console.error("Search Error:", err); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => handleSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery, handleSearch]);

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

  if (loadingSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <img src={LOGO_URL} className="w-20 h-20 animate-bounce mb-4" alt="" />
        <p className="text-[#1b5e20] font-black animate-pulse text-lg">আড্ডাসঙ্গী লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!session) return <Login onLogin={() => {}} />;
  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col font-sans relative">
      {/* গ্লোবাল মেসেজ টোস্ট (জ-ইনডেক্স কলিং এর ওপরে) */}
      {activeNotification && (
        <div 
          onClick={() => { setActiveTab(AppTab.MESSAGES); setActiveNotification(null); }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[300] bg-white border-2 border-red-500 shadow-2xl p-4 rounded-2xl flex items-center gap-4 w-[90%] max-w-[400px] animate-in slide-in-from-top-10 duration-500 cursor-pointer hover:scale-105 transition-transform"
        >
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
             <i className="fa-solid fa-message text-red-600"></i>
          </div>
          <div className="flex-1 min-w-0">
             <h4 className="font-black text-gray-900 text-sm truncate">{activeNotification.senderName}</h4>
             <p className="text-xs text-gray-600 truncate">{activeNotification.text}</p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); setActiveNotification(null); }} className="p-2 text-gray-400">
             <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      <header className="fixed top-0 inset-x-0 h-14 bg-white border-b z-50 flex items-center px-4 shadow-sm">
        <div className="flex items-center gap-2 flex-1">
          <div className="cursor-pointer" onClick={() => setActiveTab(AppTab.FEED)}>
            <img src={LOGO_URL} className="w-9 h-9" alt="logo" />
          </div>
          <div className="ml-2 relative hidden md:block w-64">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input 
              type="text" 
              placeholder="Search AddaSangi" 
              className="w-full bg-gray-100 rounded-full py-2 pl-9 pr-4 outline-none text-sm font-bold"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setActiveTab(AppTab.SEARCH); }}
            />
          </div>
        </div>
        
        <div className="flex-1 flex justify-end gap-2 items-center">
          <button 
            onClick={() => setIsCalling(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-green-50 text-green-600 border border-green-100 animate-pulse hover:animate-none transition-all"
          >
            <i className="fa-solid fa-phone"></i>
          </button>

          <button onClick={() => setActiveTab(AppTab.MESSAGES)} className={`w-10 h-10 rounded-full flex items-center justify-center relative ${activeTab === AppTab.MESSAGES ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-700'}`}>
            <i className="fa-solid fa-bolt"></i>
            {unreadMessagesCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                {unreadMessagesCount}
              </span>
            )}
          </button>
          <button onClick={() => setActiveTab(AppTab.PROFILE)} className="flex items-center gap-2 bg-gray-100 px-1 py-1 rounded-full border">
             <img src={currentUser.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex max-w-[1400px] mx-auto w-full pt-14">
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          user={currentUser} 
          onProfileClick={() => setActiveTab(AppTab.PROFILE)} 
          unreadMessagesCount={unreadMessagesCount}
          onCallAIClick={() => setIsCalling(true)}
        />
        <main className={`flex-1 min-w-0 ${activeTab === AppTab.MESSAGES ? 'p-0' : 'px-2 py-4'} overflow-x-hidden`}>
          <div className={`${activeTab === AppTab.MESSAGES ? 'max-w-full' : 'max-w-[700px]'} mx-auto h-full`}>
            {activeTab === AppTab.FEED && <Feed posts={posts} stories={[]} loading={loading} currentUser={currentUser} onLike={loadFeed} onRefresh={loadFeed} onPostCreate={loadFeed} onPostDelete={loadFeed} onProfileClick={() => setActiveTab(AppTab.PROFILE)} />}
            {activeTab === AppTab.SEARCH && <SearchResults results={searchResults} query={searchQuery} onQueryChange={setSearchQuery} onUserSelect={(u) => {setSelectedChatUser(u); setActiveTab(AppTab.MESSAGES);}} />}
            {activeTab === AppTab.MESSAGES && <Messaging currentUser={currentUser} targetUser={selectedChatUser} />}
            {activeTab === AppTab.PROFILE && <Profile user={currentUser} posts={posts.filter(p => p.user.id === currentUser.id)} isOwnProfile={true} currentUser={currentUser} onPostDelete={loadFeed} onLike={loadFeed} onUpdateProfile={() => {}} />}
            {activeTab === AppTab.MENU && <Menu user={currentUser} onLogout={() => supabase.auth.signOut()} onProfileClick={() => setActiveTab(AppTab.PROFILE)} />}
          </div>
        </main>
        <ContactsSidebar currentUserId={currentUser.id} onContactClick={(u) => {setSelectedChatUser(u); setActiveTab(AppTab.MESSAGES);}} />
      </div>

      {isCalling && <CallingOverlay onClose={() => setIsCalling(false)} />}

      {activeTab !== AppTab.MESSAGES && (
        <BottomNav 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          onProfileClick={() => setActiveTab(AppTab.PROFILE)} 
          unreadMessagesCount={unreadMessagesCount}
        />
      )}
    </div>
  );
};

export default App;
