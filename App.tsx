
import React, { useState, useEffect, useCallback } from 'react';
import { AppTab, Post, User, Story, ReactionType } from './types';
import Feed from './components/Feed';
import Profile from './components/Profile';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import ContactsSidebar from './components/ContactsSidebar';
import VideoFeed from './components/VideoFeed';
import Menu from './components/Menu';
import BottomNav from './components/BottomNav';
import SearchResults from './components/SearchResults';
import Messaging from './components/Messaging';
import Notifications from './components/Notifications';
import { generateFeed } from './services/geminiService';
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

  const fetchProfile = useCallback(async (uid: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();
      
      if (profile) {
        setCurrentUser({
          id: profile.id,
          username: profile.full_name || 'User',
          avatar: profile.avatar_url || `https://picsum.photos/seed/${profile.id}/200`,
          coverUrl: profile.cover_url || `https://picsum.photos/seed/cover-${profile.id}/1200/400`,
          bio: profile.bio,
          email: profile.email || '',
          location: profile.location,
          gender: profile.gender,
          dob: profile.dob
        });
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      setSession(s);
      if (s) {
        await fetchProfile(s.user.id);
      }
      setLoadingSession(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      if (s) {
        await fetchProfile(s.user.id);
      } else {
        setCurrentUser(null);
      }
      setLoadingSession(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    // Search by full_name or email for better results
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(20);

    if (data) {
      setSearchResults(data.map(p => ({
        id: p.id,
        username: p.full_name || 'User',
        avatar: p.avatar_url || `https://picsum.photos/seed/${p.id}/200`,
        bio: p.bio,
        location: p.location,
        isVerified: !!p.is_verified
      })));
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  useEffect(() => {
    if (session && currentUser) loadFeed();
  }, [session, currentUser]);

  const loadFeed = async () => {
    setLoading(true);
    try {
      const { data: dbPosts } = await supabase
        .from('posts')
        .select(`*, profiles (id, full_name, avatar_url), reactions (id, type, user_id), comments (id, content, created_at, profiles (full_name))`)
        .order('created_at', { ascending: false });

      if (dbPosts) {
        const formatted: Post[] = dbPosts.map((p: any) => ({
          id: p.id,
          user: {
            id: p.profiles?.id,
            username: p.profiles?.full_name || 'Anonymous',
            avatar: p.profiles?.avatar_url || `https://picsum.photos/seed/${p.profiles?.id}/200`,
          },
          caption: p.caption,
          imageUrl: p.image_url,
          likes: p.reactions?.length || 0,
          userReaction: p.reactions?.find((r: any) => r.user_id === session?.user?.id)?.type || null,
          comments: p.comments?.map((c: any) => ({
            id: c.id,
            username: c.profiles?.full_name || 'User',
            text: c.content,
            timestamp: new Date(c.created_at).toLocaleTimeString()
          })) || [],
          timestamp: new Date(p.created_at).toLocaleDateString()
        }));
        
        const aiPosts = await generateFeed();
        setPosts([...formatted, ...aiPosts]);
      }
    } catch (err) {
      console.error("Feed load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreate = async (caption: string) => {
    if (!currentUser) return;
    await supabase.from('posts').insert({
      user_id: currentUser.id,
      caption: caption,
      image_url: `https://picsum.photos/seed/post-${Date.now()}/800/800`
    });
    loadFeed();
  };

  const handleLike = async (postId: string, reaction: ReactionType) => {
    if (!currentUser) return;
    if (reaction === null) {
      await supabase.from('reactions').delete().eq('post_id', postId).eq('user_id', currentUser.id);
    } else {
      await supabase.from('reactions').upsert({ post_id: postId, user_id: currentUser.id, type: reaction });
    }
    loadFeed();
  };

  const startChatWith = (user: User) => {
    setSelectedChatUser(user);
    setActiveTab(AppTab.MESSAGES);
  };

  if (loadingSession) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <img src={LOGO_URL} className="w-20 h-20 animate-pulse rounded-2xl mb-4" alt="logo" />
      <div className="flex flex-col items-center gap-2">
         <p className="text-[#b71c1c] font-black text-lg animate-bounce">AddaSangi</p>
         <div className="w-48 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-red-600 animate-[loading_1.5s_infinite_linear]"></div>
         </div>
      </div>
      <style>{`@keyframes loading { 0% { width: 0; } 100% { width: 100%; } }`}</style>
    </div>
  );

  if (!session) return <Login onLogin={() => {}} />;
  
  if (!currentUser) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <img src={LOGO_URL} className="w-16 h-16 animate-spin rounded-2xl mb-4" alt="logo" />
      <p className="text-gray-500 font-bold">Connecting Profile...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col font-sans overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b z-50 flex items-center px-4 shadow-sm">
        <div className="flex items-center gap-2 flex-1">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab(AppTab.FEED)}>
            <img src={LOGO_URL} className="w-9 h-9 rounded-lg" alt="logo" />
            <h1 className="text-xl font-black hidden sm:block tracking-tighter">
              <span className="text-[#b71c1c]">Adda</span><span className="text-[#1b5e20]">Sangi</span>
            </h1>
          </div>
          <div className="ml-4 relative hidden md:block w-full max-w-[280px]">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input 
              type="text" 
              placeholder="Search Friends by Name" 
              className="w-full bg-gray-100 rounded-full py-2 pl-10 pr-4 outline-none focus:bg-white focus:ring-1 focus:ring-red-200 text-sm text-gray-900 font-medium"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeTab !== AppTab.SEARCH) setActiveTab(AppTab.SEARCH);
              }}
            />
          </div>
        </div>

        <nav className="hidden lg:flex flex-1 justify-center items-center h-full gap-2">
           {[ { id: AppTab.FEED, icon: 'fa-house' }, { id: AppTab.VIDEOS, icon: 'fa-video' }, { id: AppTab.SEARCH, icon: 'fa-users' } ].map(tab => (
             <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-24 h-full flex items-center justify-center border-b-4 ${activeTab === tab.id ? 'border-[#b71c1c] text-[#b71c1c]' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>
               <i className={`fa-solid ${tab.icon} text-xl`}></i>
             </button>
           ))}
        </nav>

        <div className="flex items-center justify-end flex-1 gap-1.5">
          <button onClick={() => setActiveTab(AppTab.SEARCH)} className={`w-9 h-9 md:hidden rounded-full flex items-center justify-center ${activeTab === AppTab.SEARCH ? 'bg-red-50 text-[#b71c1c]' : 'bg-gray-100'}`}>
            <i className="fa-solid fa-magnifying-glass text-sm"></i>
          </button>
          <button onClick={() => setActiveTab(AppTab.MESSAGES)} className={`w-9 h-9 rounded-full flex items-center justify-center ${activeTab === AppTab.MESSAGES ? 'bg-red-50 text-[#b71c1c]' : 'bg-gray-100 text-gray-700'}`}>
            <i className="fa-solid fa-comment"></i>
          </button>
          <button onClick={() => setActiveTab(AppTab.NOTIFICATIONS)} className={`w-9 h-9 rounded-full flex items-center justify-center ${activeTab === AppTab.NOTIFICATIONS ? 'bg-red-50 text-[#b71c1c]' : 'bg-gray-100 text-gray-700'}`}>
            <i className="fa-solid fa-bell"></i>
          </button>
          <div className="flex items-center gap-2 ml-1 cursor-pointer bg-gray-50 p-1 rounded-full border hover:bg-gray-100" onClick={() => setActiveTab(AppTab.PROFILE)}>
            <img src={currentUser.avatar} className="w-7 h-7 rounded-full object-cover" alt="me" />
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-[1400px] mx-auto w-full pt-14">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} user={currentUser} onProfileClick={() => setActiveTab(AppTab.PROFILE)} />
        
        <main className="flex-1 min-w-0 px-2 py-4">
          <div className={`${activeTab === AppTab.PROFILE ? 'max-w-none' : 'max-w-[680px]'} mx-auto`}>
            {activeTab === AppTab.FEED && <Feed posts={posts} stories={[]} loading={loading} currentUser={currentUser} onLike={handleLike} onRefresh={loadFeed} onPostCreate={handlePostCreate} onPostDelete={async (id) => { await supabase.from('posts').delete().eq('id', id); loadFeed(); }} onProfileClick={() => setActiveTab(AppTab.PROFILE)} />}
            {activeTab === AppTab.PROFILE && <Profile user={currentUser} posts={posts.filter(p => p.user.id === currentUser.id)} isOwnProfile={true} onUpdateProfile={async (u) => { await supabase.from('profiles').update(u).eq('id', currentUser.id); fetchProfile(currentUser.id); }} onPostCreate={handlePostCreate} onPostDelete={async (id) => { await supabase.from('posts').delete().eq('id', id); loadFeed(); }} onLike={handleLike} currentUser={currentUser} />}
            {activeTab === AppTab.VIDEOS && <VideoFeed posts={posts} loading={loading} onLike={handleLike} currentUser={currentUser} />}
            {activeTab === AppTab.SEARCH && (
               <div className="flex flex-col gap-4">
                 <div className="md:hidden bg-white p-3 rounded-xl shadow-sm border mb-2">
                    <input type="text" placeholder="Search Friends by Name" className="w-full bg-gray-100 rounded-full py-2 px-4 outline-none text-gray-900 font-bold" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                 </div>
                 <SearchResults results={searchResults} query={searchQuery} onUserSelect={startChatWith} />
               </div>
            )}
            {activeTab === AppTab.MESSAGES && <Messaging currentUser={currentUser} targetUser={selectedChatUser} />}
            {activeTab === AppTab.NOTIFICATIONS && <Notifications />}
            {activeTab === AppTab.MENU && <Menu user={currentUser} onLogout={() => supabase.auth.signOut()} onProfileClick={() => setActiveTab(AppTab.PROFILE)} />}
          </div>
        </main>
        <ContactsSidebar onContactClick={startChatWith} />
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} onProfileClick={() => setActiveTab(AppTab.PROFILE)} />
    </div>
  );
};

export default App;
