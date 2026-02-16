
import React, { useState, useEffect, useCallback } from 'react';
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
import { supabase } from './services/supabaseClient';

const LOGO_URL = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjbaxCAakhVQOly5IhXfPkpbunmcsxREDf2xali0fkLp9gK5qNdh2KL-UhEmDICRaX6_HtDBQTKM6jgtCJuTzrjpKUynSLe6NCzCvRpCs8C6dBgy2wGzEmcV-EIdxh5r73ExANoAyfIufc5JdfXfY1Xal6BSK0fdnqwK0VCkOZTfEdb_GMAiBB-aB9wedf0/s1600/Gemini_Generated_Image_pnxgvipnxgvipnxg.png";

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

  const fetchProfile = useCallback(async (userAuth: any) => {
    if (!userAuth) return;
    
    console.log("Fetching profile for:", userAuth.email);
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userAuth.id)
      .maybeSingle();
    
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
    } else {
      // যদি প্রোফাইল না থাকে, তবে একটি ডিফল্ট প্রোফাইল তৈরি করুন
      console.log("Profile missing. Creating a fallback profile...");
      const fallbackUser: User = {
        id: userAuth.id,
        username: userAuth.user_metadata?.full_name || userAuth.email.split('@')[0],
        avatar: `https://picsum.photos/seed/${userAuth.id}/200`,
        email: userAuth.email
      };
      
      // ডাটাবেসে সেভ করার চেষ্টা করুন
      await supabase.from('profiles').upsert({
        id: userAuth.id,
        full_name: fallbackUser.username,
        email: userAuth.email,
        avatar_url: fallbackUser.avatar
      });
      
      setCurrentUser(fallbackUser);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        setSession(s);
        if (s) await fetchProfile(s.user);
      } catch (err) {
        console.error("Init Error:", err);
      } finally {
        setLoadingSession(false);
      }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) fetchProfile(s.user);
      else setCurrentUser(null);
    });
    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) { setSearchResults([]); return; }
    const { data } = await supabase.from('profiles').select('*').ilike('full_name', `%${query}%`).limit(10);
    if (data) {
      setSearchResults(data.map(p => ({
        id: p.id,
        username: p.full_name || 'User',
        avatar: p.avatar_url || `https://picsum.photos/seed/${p.id}/200`,
        isVerified: !!p.is_verified
      })));
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => handleSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery, handleSearch]);

  const handleAddFriend = async (targetId: string) => {
    if (!currentUser) return;
    const { error } = await supabase.from('friendships').upsert({
      sender_id: currentUser.id,
      receiver_id: targetId,
      status: 'accepted'
    });
    
    await supabase.from('friendships').upsert({
      sender_id: targetId,
      receiver_id: currentUser.id,
      status: 'accepted'
    });

    if (!error) alert("Friend Added! Check your contact list.");
  };

  const loadFeed = async () => {
    if (!session) return;
    setLoading(true);
    const { data: dbPosts } = await supabase.from('posts').select(`*, profiles(*), reactions(*), comments(*, profiles(full_name))`).order('created_at', { ascending: false });
    if (dbPosts) {
      const formatted: Post[] = dbPosts.map((p: any) => ({
        id: p.id,
        user: { id: p.profiles?.id, username: p.profiles?.full_name, avatar: p.profiles?.avatar_url },
        caption: p.caption,
        imageUrl: p.image_url,
        likes: p.reactions?.length || 0,
        comments: p.comments?.map((c: any) => ({ id: c.id, username: c.profiles?.full_name, text: c.content, timestamp: 'Now' })) || [],
        timestamp: new Date(p.created_at).toLocaleDateString()
      }));
      setPosts(formatted);
    }
    setLoading(false);
  };

  useEffect(() => { if (session && currentUser) loadFeed(); }, [session, currentUser]);

  const openChat = (user: User) => {
    setSelectedChatUser(user);
    setActiveTab(AppTab.MESSAGES);
  };

  // লোডিং স্টেটে সাদা স্ক্রিন এড়াতে
  if (loadingSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <img src={LOGO_URL} className="w-20 h-20 animate-bounce mb-4" />
        <p className="text-[#1b5e20] font-black animate-pulse">আড্ডাসঙ্গী লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!session) return <Login onLogin={() => {}} />;

  // যদি সেশন থাকে কিন্তু প্রোফাইল সিঙ্ক হচ্ছে
  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-bold">আপনার প্রোফাইল সিঙ্ক করা হচ্ছে...</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-red-600 font-bold underline">কাজ না করলে রিলোড দিন</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col font-sans">
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
        <nav className="hidden lg:flex flex-1 justify-center gap-4 h-full">
           {[ { id: AppTab.FEED, icon: 'fa-house' }, { id: AppTab.VIDEOS, icon: 'fa-video' }, { id: AppTab.SEARCH, icon: 'fa-users' } ].map(t => (
             <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-8 h-full border-b-4 transition-all ${activeTab === t.id ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500'}`}>
               <i className={`fa-solid ${t.icon} text-xl`}></i>
             </button>
           ))}
        </nav>
        <div className="flex-1 flex justify-end gap-2">
          <button onClick={() => setActiveTab(AppTab.MESSAGES)} className={`w-10 h-10 rounded-full flex items-center justify-center ${activeTab === AppTab.MESSAGES ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-700'}`}>
            <i className="fa-solid fa-bolt"></i>
          </button>
          <button onClick={() => setActiveTab(AppTab.PROFILE)} className="flex items-center gap-2 bg-gray-100 px-1 py-1 rounded-full border">
             <img src={currentUser.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex max-w-[1400px] mx-auto w-full pt-14">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} user={currentUser} onProfileClick={() => setActiveTab(AppTab.PROFILE)} />
        <main className={`flex-1 min-w-0 ${activeTab === AppTab.MESSAGES ? 'p-0 md:px-2 md:py-4' : 'px-2 py-4'} overflow-x-hidden`}>
          <div className={`${activeTab === AppTab.MESSAGES ? 'max-w-full' : 'max-w-[700px]'} mx-auto h-full`}>
            {activeTab === AppTab.FEED && <Feed posts={posts} stories={[]} loading={loading} currentUser={currentUser} onLike={loadFeed} onRefresh={loadFeed} onPostCreate={loadFeed} onPostDelete={loadFeed} onProfileClick={() => setActiveTab(AppTab.PROFILE)} />}
            {activeTab === AppTab.SEARCH && <SearchResults results={searchResults} query={searchQuery} onUserSelect={openChat} onAddFriend={handleAddFriend} />}
            {activeTab === AppTab.MESSAGES && <Messaging currentUser={currentUser} targetUser={selectedChatUser} />}
            {activeTab === AppTab.PROFILE && <Profile user={currentUser} posts={posts.filter(p => p.user.id === currentUser.id)} isOwnProfile={true} currentUser={currentUser} onPostDelete={loadFeed} onLike={loadFeed} />}
            {activeTab === AppTab.MENU && <Menu user={currentUser} onLogout={() => supabase.auth.signOut()} onProfileClick={() => setActiveTab(AppTab.PROFILE)} />}
          </div>
        </main>
        <ContactsSidebar currentUserId={currentUser.id} onContactClick={openChat} />
      </div>

      {activeTab !== AppTab.MESSAGES && (
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} onProfileClick={() => setActiveTab(AppTab.PROFILE)} />
      )}
    </div>
  );
};

export default App;
