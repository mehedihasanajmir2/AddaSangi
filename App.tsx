
import React, { useState, useEffect } from 'react';
import { AppTab, Post, User, Story, ReactionType } from './types';
import Feed from './components/Feed';
import Messaging from './components/Messaging';
import Notifications from './components/Notifications';
import BottomNav from './components/BottomNav';
import Profile from './components/Profile';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import ContactsSidebar from './components/ContactsSidebar';
import VideoFeed from './components/VideoFeed';
import Menu from './components/Menu';
import { generateFeed } from './services/geminiService';
import { supabase } from './services/supabaseClient';

const LOGO_URL = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjbaxCAakhVQOly5IhXfPkpbunmcsxREDf2xali0fkLp9gK5qNdh2KL-UhEmDICRaX6_HtDBQTKM6jgtCJuTzrjpKUynSLe6NCzCvRpCs8C6dBgy2wGzEmcV-EIdxh5r73ExANoAyfIufc5JdfXfY1Xal6BSK0fdnqwK0VCkOZTfEdb_GMAiBB-aB9wedf0/s1600/Gemini_Generated_Image_pnxgvipnxgvipnxg.png";

const DEFAULT_USER: User = {
  id: 'me',
  username: 'Adda Sangi User',
  avatar: 'https://picsum.photos/seed/me/200',
  bio: 'Welcome to AddaSangi! Start sharing your stories.'
};

const MOCK_STORIES: Story[] = Array.from({ length: 6 }).map((_, i) => ({
  id: `story-${i}`,
  user: {
    id: `user-${i}`,
    username: i === 0 ? 'Create Story' : `Sangi ${i}`,
    avatar: `https://picsum.photos/seed/member_${i}/200`,
  },
  imageUrl: `https://picsum.photos/seed/story-content-${i}/400/700`,
}));

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.FEED);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewingUser, setViewingUser] = useState<User>(DEFAULT_USER);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession) {
        setSession(currentSession);
        await fetchAndSetUser(currentSession);
      }
      setLoadingSession(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        await fetchAndSetUser(session);
      } else {
        setCurrentUser(DEFAULT_USER);
        setViewingUser(DEFAULT_USER);
      }
      setLoadingSession(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAndSetUser = async (session: any) => {
    if (!session?.user) return;
    
    // ১. প্রোফাইল থেকে রিয়েল ডাটা ফেচ করা
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profile && !error) {
      const dbUser: User = {
        id: profile.id,
        username: profile.full_name || 'User',
        avatar: profile.avatar_url || `https://picsum.photos/seed/${profile.id}/200`,
        coverUrl: profile.cover_url,
        bio: profile.bio,
        dob: profile.dob,
        gender: profile.gender,
        email: session.user.email,
        location: profile.location || 'Dhaka, Bangladesh',
        lastNameChangeDate: profile.last_name_change_at
      };
      setCurrentUser(dbUser);
      setViewingUser(dbUser);
    } else {
      // প্রোফাইল না থাকলে নতুন প্রোফাইল তৈরি (First time login)
      const metadata = session.user.user_metadata || {};
      const newUser: User = {
        id: session.user.id,
        username: metadata.full_name || session.user.email.split('@')[0],
        avatar: metadata.avatar_url || `https://picsum.photos/seed/${session.user.id}/200`,
        bio: 'AddaSangi Member 🇧🇩',
        email: session.user.email,
        location: 'Dhaka, Bangladesh'
      };
      setCurrentUser(newUser);
      setViewingUser(newUser);
      
      await supabase.from('profiles').upsert({
        id: newUser.id,
        full_name: newUser.username,
        avatar_url: newUser.avatar,
        bio: newUser.bio,
        location: newUser.location
      });
    }
  };

  useEffect(() => {
    if (session) {
      loadFeed();
    }
  }, [session]);

  const loadFeed = async () => {
    setLoading(true);
    try {
      // ১. ডাটাবেস থেকে রিয়েল পোস্ট লোড করা
      const { data: dbPosts, error } = await supabase
        .from('posts')
        .select('*, profiles(id, full_name, avatar_url)')
        .order('created_at', { ascending: false });

      let formattedRealPosts: Post[] = [];
      if (dbPosts && !error) {
        formattedRealPosts = dbPosts.map((p: any) => ({
          id: p.id,
          user: {
            id: p.profiles?.id,
            username: p.profiles?.full_name || 'User',
            avatar: p.profiles?.avatar_url || `https://picsum.photos/seed/${p.profiles?.id}/200`,
          },
          caption: p.caption,
          imageUrl: p.image_url,
          likes: p.likes || 0,
          comments: [],
          timestamp: new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        }));
      }

      // ২. কিছু AI পোস্ট ও সাথে রাখা
      const aiPosts = await generateFeed();
      setPosts([...formattedRealPosts, ...aiPosts]);
    } catch (err) {
      console.error("Feed loading failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreate = async (caption: string) => {
    const tempImageUrl = `https://picsum.photos/seed/post-${Date.now()}/800/800`;
    
    try {
      // সুপাবেসে পারমানেন্টলি সেভ করা
      const { error } = await supabase.from('posts').insert({
        user_id: currentUser.id,
        caption: caption,
        image_url: tempImageUrl,
        likes: 0
      });

      if (!error) {
        await loadFeed(); // রিলোড ফিড
      }
    } catch (err) {
      console.error("Post creation failed:", err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', currentUser.id);

      if (!error) {
        setPosts(prev => prev.filter(p => p.id !== postId));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleUpdateProfile = async (updates: Partial<User>) => {
    const updatedUser = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);
    
    try {
      await supabase.from('profiles').upsert({
        id: currentUser.id,
        full_name: updates.username || currentUser.username,
        bio: updates.bio || currentUser.bio,
        avatar_url: updates.avatar || currentUser.avatar,
        cover_url: updates.coverUrl || currentUser.coverUrl,
        location: updates.location || currentUser.location,
        gender: updates.gender || currentUser.gender,
        dob: updates.dob || currentUser.dob,
        last_name_change_at: updates.lastNameChangeDate || currentUser.lastNameChangeDate
      });
    } catch (err) {
      console.error("Profile sync error:", err);
    }
  };

  const handleLike = (postId: string, reaction: ReactionType = 'like') => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const isRemoving = reaction === null;
      const wasLiked = !!p.userReaction;
      let newLikes = p.likes;
      if (wasLiked && isRemoving) newLikes--;
      if (!wasLiked && !isRemoving) newLikes++;
      return { ...p, userReaction: reaction, likes: newLikes };
    }));
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex flex-col items-center justify-center">
        <img src={LOGO_URL} alt="AddaSangi" className="w-20 h-20 animate-pulse mb-4" />
        <h1 className="text-3xl font-black"><span className="text-[#b71c1c]">Adda</span><span className="text-[#1b5e20]">Sangi</span></h1>
      </div>
    );
  }

  if (!session) return <Login onLogin={() => {}} />;

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f2f5] font-sans text-gray-900 overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm w-full h-14 md:h-16 flex items-center">
        <div className="max-w-[1920px] mx-auto px-4 flex items-center w-full h-full relative">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab(AppTab.FEED)}>
              <img src={LOGO_URL} alt="Logo" className="w-8 h-8 md:w-10 md:h-10 rounded-xl shadow-sm" />
              <h1 className="text-lg md:text-2xl font-black tracking-tighter">
                <span className="text-[#b71c1c]">Adda</span><span className="text-[#1b5e20]">Sangi</span>
              </h1>
            </div>
          </div>
          <div className="flex-1 flex justify-end">
            <button onClick={async () => { await supabase.auth.signOut(); setSession(null); }} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:text-red-600 transition-all">
              <i className="fa-solid fa-right-from-bracket"></i>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex w-full max-w-[1400px] mx-auto relative h-full pt-14 md:pt-16">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} user={currentUser} onProfileClick={() => setActiveTab(AppTab.PROFILE)} />
        <main className="flex-1 flex flex-col min-w-0">
          <div className={`${activeTab === AppTab.PROFILE ? 'w-full' : 'max-w-[680px]'} w-full mx-auto pb-24 md:pb-8 pt-4`}>
            {activeTab === AppTab.FEED && (
              <Feed 
                posts={posts} 
                stories={MOCK_STORIES} 
                loading={loading} 
                currentUser={currentUser}
                onLike={handleLike} 
                onRefresh={loadFeed} 
                onPostCreate={handlePostCreate} 
                onPostDelete={handleDeletePost}
                onProfileClick={() => setActiveTab(AppTab.PROFILE)} 
              />
            )}
            {activeTab === AppTab.PROFILE && (
              <Profile 
                user={currentUser} 
                posts={posts.filter(p => p.user.id === currentUser.id)} 
                isOwnProfile={true}
                onUpdateProfile={handleUpdateProfile}
                onPostCreate={handlePostCreate}
                onPostDelete={handleDeletePost}
                onLike={handleLike}
                currentUser={currentUser}
              />
            )}
            {activeTab === AppTab.VIDEOS && <VideoFeed posts={posts} loading={loading} onLike={handleLike} />}
            {activeTab === AppTab.MENU && <Menu user={currentUser} onLogout={async () => { await supabase.auth.signOut(); setSession(null); }} onProfileClick={() => setActiveTab(AppTab.PROFILE)} />}
          </div>
        </main>
        <ContactsSidebar onContactClick={(u) => { setViewingUser(u); setActiveTab(AppTab.PROFILE); }} />
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} onProfileClick={() => setActiveTab(AppTab.PROFILE)} />
    </div>
  );
};

export default App;
