import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Story, User } from '../types';
import { getSupabase } from '../services/supabaseClient';

interface StoryBarProps {
  currentUser: User;
}

const StoryBar: React.FC<StoryBarProps> = ({ currentUser }) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    // In a real app, you'd filter for last 24h
    const { data, error } = await getSupabase()
      .from('stories')
      .select('*, user:profiles(id, full_name, avatar_url)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const formattedStories = data.map((s: any) => ({
        ...s,
        user: {
          id: s.user.id,
          username: s.user.full_name,
          avatar: s.user.avatar_url
        }
      }));
      setStories(formattedStories);
    }
  };

  return (
    <div className="bg-white border-b overflow-x-auto no-scrollbar py-4 px-2">
      <div className="flex gap-4">
        {/* Create Story Button */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <button 
            onClick={() => setIsCreatorOpen(true)}
            className="w-16 h-16 rounded-full border-2 border-dashed border-red-500 flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
          >
            <i className="fa-solid fa-plus text-xl"></i>
          </button>
          <span className="text-[10px] font-bold text-gray-500">Your Story</span>
        </div>

        {/* Story List */}
        {stories.map((story, idx) => (
          <div 
            key={story.id} 
            className="flex flex-col items-center gap-1 shrink-0 cursor-pointer"
            onClick={() => setSelectedStoryIndex(idx)}
          >
            <div className="w-16 h-16 rounded-full p-0.5 border-2 border-red-500 overflow-hidden">
              <img 
                src={story.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${story.user_id}`} 
                alt={story.user?.username} 
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <span className="text-[10px] font-medium text-gray-600 truncate w-16 text-center">
              {story.user?.username || 'User'}
            </span>
          </div>
        ))}
      </div>

      {/* Story Creator Modal */}
      <AnimatePresence>
        {isCreatorOpen && (
          <StoryCreator 
            onClose={() => setIsCreatorOpen(false)} 
            currentUser={currentUser}
            onSuccess={() => {
              setIsCreatorOpen(false);
              fetchStories();
            }}
          />
        )}
      </AnimatePresence>

      {/* Story Viewer Modal */}
      <AnimatePresence>
        {selectedStoryIndex !== null && (
          <StoryViewer 
            stories={stories} 
            initialIndex={selectedStoryIndex} 
            onClose={() => setSelectedStoryIndex(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Story Creator Component ---
const StoryCreator: React.FC<{ onClose: () => void, currentUser: User, onSuccess: () => void }> = ({ onClose, currentUser, onSuccess }) => {
  const [type, setType] = useState<'text' | 'image'>('text');
  const [content, setContent] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<{ title: string, url: string } | null>(null);

  // Expanded Song List (Bangla, Hindi, English, Arabic, K-Pop)
  const MUSIC_LIBRARY = {
    Bangla: [
      { title: "Noya Daman", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
      { title: "Bondhu Amar", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
      { title: "Hridoy Kinarai", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
      { title: "Loke Bole", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
      { title: "Pran Sakhi Re", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
      { title: "Tumi Kar Posha", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" },
      { title: "Milon Hobe Koto Dine", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
      { title: "Bhalobasha Mor", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" }
    ],
    Hindi: [
      { title: "Kesariya", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3" },
      { title: "Tum Hi Ho", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
      { title: "Chaleya", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3" },
      { title: "Heeriye", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3" },
      { title: "Dil Jhoom", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
      { title: "Kaise Hua", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
      { title: "Raatan Lambiyan", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" }
    ],
    English: [
      { title: "Stay With Me", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
      { title: "Sunflower", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
      { title: "Blinding Lights", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
      { title: "Shape of You", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
      { title: "Perfect", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" },
      { title: "As It Was", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3" },
      { title: "Levitating", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" }
    ],
    Arabic: [
      { title: "Ya Habibi", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3" },
      { title: "C'est La Vie", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" }
    ],
    KPop: [
      { title: "Dynamite", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3" },
      { title: "How You Like That", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3" }
    ]
  };

  const [activeCategory, setActiveCategory] = useState<keyof typeof MUSIC_LIBRARY>('Bangla');
  const [musicSearch, setMusicSearch] = useState('');
  const previewAudioRef = React.useRef<HTMLAudioElement | null>(null);

  const filteredMusic = MUSIC_LIBRARY[activeCategory].filter(s => 
    s.title.toLowerCase().includes(musicSearch.toLowerCase())
  );

  useEffect(() => {
    if (selectedMusic && previewAudioRef.current) {
      previewAudioRef.current.play().catch(console.warn);
    }
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
    };
  }, [selectedMusic]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        setType('image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePost = async () => {
    if (!content && !previewUrl) return;
    setIsUploading(true);

    try {
      let finalContent = content;
      if (type === 'image' && previewUrl) {
        // Upload image to Supabase
        const blob = await (await fetch(previewUrl)).blob();
        const fileName = `story_${currentUser.id}_${Date.now()}.png`;
        const { error: uploadError } = await getSupabase().storage
          .from('messages')
          .upload(`stories/${fileName}`, blob);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = getSupabase().storage
          .from('messages')
          .getPublicUrl(`stories/${fileName}`);
        
        finalContent = publicUrl;
      }

      const { error } = await getSupabase()
        .from('stories')
        .insert({
          user_id: currentUser.id,
          type,
          content: finalContent,
          music_url: selectedMusic?.url,
          music_title: selectedMusic?.title
        });

      if (error) throw error;
      onSuccess();
    } catch (err: any) {
      alert("Failed to post story: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed inset-0 z-[110] bg-white flex flex-col"
    >
      <div className="p-4 flex justify-between items-center border-b">
        <button onClick={onClose} className="text-gray-500"><i className="fa-solid fa-xmark text-xl"></i></button>
        <h2 className="font-bold">Create Story</h2>
        <button 
          onClick={handlePost} 
          disabled={isUploading}
          className="bg-red-600 text-white px-4 py-1.5 rounded-full font-bold text-sm disabled:opacity-50"
        >
          {isUploading ? 'Posting...' : 'Post'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {type === 'text' ? (
          <textarea 
            className="w-full h-48 p-6 bg-white rounded-2xl shadow-sm border-none focus:ring-2 focus:ring-red-100 text-2xl font-bold text-center flex items-center justify-center italic"
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        ) : (
          <div className="relative aspect-[9/16] bg-black rounded-2xl overflow-hidden shadow-2xl mx-auto max-w-[300px]">
            {previewUrl && <img src={previewUrl} className="w-full h-full object-cover" />}
            <button 
              onClick={() => { setPreviewUrl(null); setType('text'); }}
              className="absolute top-2 right-2 bg-black/50 text-white w-8 h-8 rounded-full flex items-center justify-center"
            >
              <i className="fa-solid fa-trash-can text-sm"></i>
            </button>
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div className="flex gap-4">
            <button 
              onClick={() => document.getElementById('story-img-input')?.click()}
              className="flex-1 bg-white p-4 rounded-xl shadow-sm border flex flex-col items-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <i className="fa-solid fa-image text-2xl text-blue-500"></i>
              <span className="text-xs font-bold">Photo</span>
            </button>
            <input id="story-img-input" type="file" className="hidden" accept="image/*" onChange={handleImageSelect} />
            
            <button 
              onClick={() => setType('text')}
              className="flex-1 bg-white p-4 rounded-xl shadow-sm border flex flex-col items-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <i className="fa-solid fa-font text-2xl text-purple-500"></i>
              <span className="text-xs font-bold">Text</span>
            </button>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <i className="fa-solid fa-music text-red-500 text-lg"></i>
              Add Music (Global Hits)
            </h3>
            
            <div className="relative mb-3">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
              <input 
                type="text" 
                placeholder="Search 100k+ songs..." 
                value={musicSearch}
                onChange={(e) => setMusicSearch(e.target.value)}
                className="w-full pl-8 pr-4 py-2 bg-gray-50 rounded-lg text-[10px] focus:ring-1 focus:ring-red-200 border-none outline-none"
              />
            </div>
            
            <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
              {Object.keys(MUSIC_LIBRARY).map(cat => (
                <button 
                  key={cat}
                  onClick={() => { setActiveCategory(cat as any); setMusicSearch(''); }}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all shrink-0 ${activeCategory === cat ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
              {filteredMusic.map(song => (
                <button 
                  key={song.title}
                  onClick={() => setSelectedMusic(selectedMusic?.title === song.title ? null : song)}
                  className={`p-2 text-[10px] text-left font-bold border rounded-lg transition-all truncate ${selectedMusic?.title === song.title ? 'bg-red-600 text-white border-red-600' : 'bg-gray-50 text-gray-600'}`}
                >
                  <i className="fa-solid fa-play mr-1 opacity-50"></i> {song.title}
                </button>
              ))}
              {filteredMusic.length === 0 && (
                <p className="col-span-2 text-center py-4 text-[10px] text-gray-400 italic">No songs found in this category.</p>
              )}
            </div>
            {selectedMusic && (
              <div className="mt-3 p-2 bg-red-50 rounded-lg flex items-center justify-between">
                <span className="text-[10px] text-red-600 font-bold italic">Selected: {selectedMusic.title}</span>
                <i className="fa-solid fa-volume-high animate-pulse text-red-500"></i>
                <audio ref={previewAudioRef} src={selectedMusic.url} loop className="hidden" />
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- Story Viewer Component ---
const StoryViewer: React.FC<{ stories: Story[], initialIndex: number, onClose: () => void }> = ({ stories, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const story = stories[currentIndex];
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentIndex < stories.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setHasStartedPlaying(false);
      } else {
        onClose();
      }
    }, 15000); // 15 seconds per story

    return () => clearTimeout(timer);
  }, [currentIndex, stories.length, onClose]);

  useEffect(() => {
    if (story.music_url && audioRef.current) {
      audioRef.current.volume = 1.0;
      audioRef.current.play().then(() => {
        setHasStartedPlaying(true);
        setIsMuted(false);
      }).catch(err => {
        console.warn("Autoplay blocked:", err);
        setIsMuted(true);
      });
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [story.music_url, story.id]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(audioRef.current.muted);
      if (!audioRef.current.muted) {
        audioRef.current.play().then(() => setHasStartedPlaying(true));
      }
    }
  };

  const handleInteraction = () => {
    if (story.music_url && audioRef.current && !hasStartedPlaying) {
      audioRef.current.play().then(() => {
        setHasStartedPlaying(true);
        setIsMuted(false);
      });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[120] bg-black flex flex-col items-center justify-center p-2"
      onClick={handleInteraction}
    >
      {/* Progress Bars */}
      <div className="absolute top-4 left-4 right-4 flex gap-1 z-40">
        {stories.map((_, i) => (
          <div key={i} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: i === currentIndex ? "100%" : i < currentIndex ? "100%" : "0%" }}
              transition={{ duration: i === currentIndex ? 15 : 0, ease: "linear" }}
              className="h-full bg-red-500"
            />
          </div>
        ))}
      </div>

      {/* Top Bar */}
      <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-3">
          <img src={story.user?.avatar} className="w-10 h-10 rounded-full border-2 border-white object-cover" />
          <div>
            <p className="text-white font-bold text-sm leading-none">{story.user?.username}</p>
            <p className="text-white/60 text-[10px] mt-1">{new Date(story.created_at).toLocaleTimeString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {story.music_url && (
            <button onClick={toggleMute} className="text-white w-10 h-10 flex items-center justify-center bg-black/20 rounded-full border border-white/10 backdrop-blur-sm">
              <i className={`fa-solid ${isMuted ? 'fa-volume-xmark text-red-500' : 'fa-volume-high'}`}></i>
            </button>
          )}
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <i className="fa-solid fa-xmark text-2xl"></i>
          </button>
        </div>
      </div>

      {/* Music Indicator */}
      {story.music_url && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 scale-90">
          <i className="fa-solid fa-music text-red-500 animate-[spin_3s_linear_infinite]"></i>
          <span className="text-white text-[10px] font-bold italic truncate max-w-[120px]">{story.music_title}</span>
          <audio 
            ref={audioRef} 
            src={story.music_url} 
            loop 
            preload="auto"
            className="hidden" 
          />
        </div>
      )}

      {/* Content */}
      <div className="w-full h-full flex items-center justify-center bg-zinc-900">
        {story.type === 'image' ? (
          <img src={story.content} className="max-w-full max-h-full object-contain" />
        ) : (
          <div className="px-12 text-white text-3xl font-black text-center italic leading-tight uppercase tracking-tighter">
            {story.content}
          </div>
        )}
      </div>

      {/* Audio Blocked Hint */}
      {story.music_url && !hasStartedPlaying && (
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-black/60 backdrop-blur-md px-6 py-4 rounded-3xl flex flex-col items-center gap-3 border border-white/20 shadow-2xl"
          >
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center animate-pulse">
              <i className="fa-solid fa-volume-xmark text-2xl text-white"></i>
            </div>
            <p className="text-white font-black text-sm uppercase tracking-widest">Tap for sound</p>
          </motion.div>
        </div>
      )}

      {/* Navigation Areas */}
      <div className="absolute inset-0 flex z-10">
        <div 
          className="w-1/3 h-full cursor-pointer" 
          onClick={() => currentIndex > 0 && setCurrentIndex(prev => prev - 1)}
        />
        <div 
          className="flex-1 h-full cursor-pointer" 
          onClick={() => {
            if (currentIndex < stories.length - 1) {
              setCurrentIndex(prev => prev + 1);
            } else {
              onClose();
            }
          }}
        />
      </div>
    </motion.div>
  );
};

export default StoryBar;
