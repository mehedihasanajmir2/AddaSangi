
import React, { useState, useEffect } from 'react';
import { AppTab, Post, User, Story, ReactionType } from './types';
import Feed from './components/Feed';
import Messaging from './components/Messaging';
import Notifications from './components/Notifications';
import BottomNav from './components/BottomNav';
import CallingOverlay from './components/CallingOverlay';
import Profile from './components/Profile';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import ContactsSidebar from './components/ContactsSidebar';
import SearchResults from './components/SearchResults';
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
  const [loadingSession, setLoadingSession] = useState(true); // New loading state
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.FEED);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [viewingUser, setViewingUser] = useState<User>(DEFAULT_USER);

  useEffect(() => {
    // Check current session on mount
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        await fetchAndSetUser(session);
      }
      setLoadingSession(false);
    };

    checkSession();

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchAndSetUser(session);
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
    const metadata = session.user.user_metadata || {};
    const email = session.user.email || "";
    const fallbackUsername = email ? email.split('@')[0] : 'Sangi Member';

    const tempUser: User = {
      id: session.user.id,
      username: metadata.full_name || fallbackUsername,
      avatar: metadata.avatar_url || `https://picsum.photos/seed/${session.user.id}/200`,
      coverUrl: metadata.cover_url || undefined,
      bio: metadata.bio || 'AddaSangi Member 🇧🇩',
      email: email,
      dob: metadata.dob,
      gender: metadata.gender,
      location: metadata.location || 'Dhaka, Bangladesh'
    };
    
    setCurrentUser(tempUser);
    setViewingUser(tempUser);

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profile && !error) {
        const dbUser: User = {
          id: profile.id,
          username: profile.full_name || profile.username || tempUser.username,
          avatar: profile.avatar_url || tempUser.avatar,
          coverUrl: profile.cover_url || tempUser.coverUrl,
          bio: profile.bio || tempUser.bio,
          dob: profile.dob || tempUser.dob,
          gender: profile.gender || tempUser.gender,
          email: email,
          location: profile.location || tempUser.location,
          lastNameChangeDate: profile.last_name_change_at
        };
        setCurrentUser(dbUser);
        setViewingUser(prev => prev.id === session.user.id ? dbUser : prev);
      }
    } catch (err) {
      console.warn("Using session metadata as profile.");
    }
  };

  useEffect(() => {
    if (session && posts.length === 0) {
      loadFeed();
    }
  }, [session, posts.length]);

  const loadFeed = async () => {
    setLoading(true);
    try {
      const aiPosts = await generateFeed();
      
      const { data: dbPosts, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (
            id,
            full_name,
            username,
            avatar_url,
            is_verified
          )
        `)
        .order('created_at', { ascending: false });

      let formattedDbPosts: Post[] = [];
      if (dbPosts && !error) {
        formattedDbPosts = dbPosts.map((p: any) => ({
          id: p.id,
          user: {
            id: p.profiles?.id,
            username: p.profiles?.full_name || p.profiles?.username || 'User',
            avatar: p.profiles?.avatar_url || `https://picsum.photos/seed/${p.profiles?.id}/200`,
            isVerified: p.profiles?.is_verified
          },
          caption: p.caption,
          imageUrl: p.image_url,
          likes: p.likes || 0,
          comments: [],
          timestamp: new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          userReaction: null
        }));
      }

      setPosts([...formattedDbPosts, ...aiPosts]);
    } catch (err) {
      console.error("Feed error:", err);
    } finally {
      setLoading(false);
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

  const handlePostCreate = async (caption: string) => {
    const tempImageUrl = `https://picsum.photos/seed/post-${Date.now()}/800/800`;
    
    const newPost: Post = {
      id: `temp-${Date.now()}`,
      user: currentUser,
      caption: caption,
      imageUrl: tempImageUrl,
      likes: 0,
      comments: [],
      timestamp: 'Just now',
      userReaction: null
    };
    setPosts([newPost, ...posts]);

    try {
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: currentUser.id,
          caption: caption,
          image_url: tempImageUrl,
          likes: 0
        });

      if (error) throw error;
      loadFeed();
    } catch (err) {
      console.error("Error saving post permanently:", err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (postId.includes('user-') || postId.includes('temp-')) {
      setPosts(prev => prev.filter(p => p.id !== postId));
      return;
    }

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
      console.error("Delete failed", err);
    }
  };

  const handleUpdateProfile = async (updates: Partial<User>) => {
    const updatedUser = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);
    if (viewingUser.id === currentUser.id) {
      setViewingUser(updatedUser);
    }

    try {
      await supabase
        .from('profiles')
        .upsert({
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
      console.error("Profile update sync failed", err);
    }
  };

  const handleUserSelect = (user: User) => {
    setViewingUser(user);
    setActiveTab(AppTab.PROFILE);
  };

  const openMyProfile = () => {
    setViewingUser(currentUser);
    setActiveTab(AppTab.PROFILE);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  // Splash/Loading Screen
  if (loadingSession) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-4 p-2 animate-pulse">
          <img src={LOGO_URL} alt="AddaSangi" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-3xl font-black tracking-tighter animate-pulse">
          <span className="text-[#b71c1c]">Adda</span>
          <span className="text-[#1b5e20]">Sangi</span>
        </h1>
      </div>
    );
  }

  if (!session) {
    return <Login onLogin={() => {}} />;
  }

  const mainTabs = [
    { id: AppTab.FEED, icon: 'fa-house', label: 'Home' },
    { id: AppTab.SEARCH, icon: 'fa-users', label: 'Friends' },
    { id: AppTab.VIDEOS, icon: 'fa-video', label: 'Videos' },
    { id: AppTab.PROFILE, icon: 'fa-user', label: 'Profile' },
    { id: AppTab.MENU, icon: 'fa-bars', label: 'Menu' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f2f5] font-sans text-gray-900 overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm w-full h-14 md:h-16 flex items-center">
        <div className="max-w-[1920px] mx-auto px-4 flex items-center w-full h-full relative">
          <div className="flex items-center gap-3 z-10 flex-1 shrink-0">
            <div className="flex items-center gap-2 shrink-0 cursor-pointer group" onClick={() => setActiveTab(AppTab.FEED)}>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl overflow-hidden shadow-sm transition-transform group-hover:scale-105">
                <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <h1 className="flex text-lg md:text-2xl font-black tracking-tighter leading-none">
                <span className="text-[#b71c1c]">Adda</span>
                <span className="text-[#1b5e20]">Sangi</span>
              </h1>
            </div>
          </div>
          
          <div className="hidden md:flex shrink-0 justify-center h-full w-[680px]">
            <div className="flex w-full h-full items-stretch justify-center">
              {mainTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                      if (tab.id === AppTab.PROFILE) openMyProfile();
                      else setActiveTab(tab.id);
                  }}
                  className={`flex-1 flex items-center justify-center relative transition-all group hover:bg-gray-100 ${activeTab === tab.id ? 'text-[#b71c1c]' : 'text-gray-500'}`}
                >
                  <i className={`fa-solid ${tab.icon} text-xl lg:text-2xl`}></i>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#b71c1c] rounded-t-full mx-1"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 items-center flex-1 justify-end z-10">
            <button 
              onClick={handleLogout}
              className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
            >
              <i className="fa-solid fa-right-from-bracket"></i>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex w-full max-w-[1400px] mx-auto relative h-full pt-14 md:pt-16">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} user={currentUser} onProfileClick={openMyProfile} />

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
                onProfileClick={openMyProfile} 
              />
            )}
            {activeTab === AppTab.VIDEOS && <VideoFeed posts={posts} loading={loading} onLike={handleLike} />}
            {activeTab === AppTab.PROFILE && (
              <Profile 
                user={viewingUser} 
                posts={posts.filter(p => p.user.id === viewingUser.id)} 
                isOwnProfile={viewingUser.id === currentUser.id}
                onUpdateProfile={handleUpdateProfile}
                onPostCreate={handlePostCreate}
                onPostDelete={handleDeletePost}
                onLike={handleLike}
                currentUser={currentUser}
              />
            )}
            {activeTab === AppTab.MENU && <Menu user={currentUser} onLogout={handleLogout} onProfileClick={openMyProfile} />}
          </div>
        </main>

        {activeTab !== AppTab.PROFILE && <ContactsSidebar onContactClick={handleUserSelect} />}
      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} onProfileClick={openMyProfile} />
    </div>
  );
};

export default App;
