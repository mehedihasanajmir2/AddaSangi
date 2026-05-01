import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Story, User } from '../types';
import { supabase } from '../services/supabaseClient';

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
    const { data, error } = await supabase
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

  // Sample Bangladeshi Songs (Mock URLs for demo)
  const BANGLA_SONGS = [
    { title: "Noya Daman", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
    { title: "Tumi Kar Posha Pakhi", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
    { title: "Loke Bole Bole Re", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
    { title: "Bondhu Amar", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" }
  ];

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
        const { error: uploadError } = await supabase.storage
          .from('messages')
          .upload(`stories/${fileName}`, blob);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('messages')
          .getPublicUrl(`stories/${fileName}`);
        
        finalContent = publicUrl;
      }

      const { error } = await supabase
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
              Add Music (Bangla Hits)
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {BANGLA_SONGS.map(song => (
                <button 
                  key={song.title}
                  onClick={() => setSelectedMusic(selectedMusic?.title === song.title ? null : song)}
                  className={`p-2 text-[10px] font-bold border rounded-lg transition-all ${selectedMusic?.title === song.title ? 'bg-red-600 text-white border-red-600' : 'bg-gray-50 text-gray-600'}`}
                >
                  {song.title}
                </button>
              ))}
            </div>
            {selectedMusic && (
              <div className="mt-3 p-2 bg-red-50 rounded-lg flex items-center justify-between">
                <span className="text-[10px] text-red-600 font-bold italic">Playing: {selectedMusic.title}</span>
                <i className="fa-solid fa-volume-high animate-pulse text-red-500"></i>
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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentIndex < stories.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        onClose();
      }
    }, 5000); // 5 seconds per story

    return () => clearTimeout(timer);
  }, [currentIndex, stories.length, onClose]);

  useEffect(() => {
    if (story.music_url && audioRef.current) {
      audioRef.current.play();
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [story.music_url]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[120] bg-black flex flex-col items-center justify-center"
    >
      {/* Progress Bars */}
      <div className="absolute top-4 left-4 right-4 flex gap-1 z-30">
        {stories.map((_, i) => (
          <div key={i} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: i === currentIndex ? "100%" : i < currentIndex ? "100%" : "0%" }}
              transition={{ duration: i === currentIndex ? 5 : 0, ease: "linear" }}
              className="h-full bg-white"
            />
          </div>
        ))}
      </div>

      {/* Top Bar */}
      <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <img src={story.user?.avatar} className="w-10 h-10 rounded-full border-2 border-white" />
          <div>
            <p className="text-white font-bold text-sm">{story.user?.username}</p>
            <p className="text-white/60 text-[10px]">{new Date(story.created_at).toLocaleTimeString()}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
          <i className="fa-solid fa-xmark text-2xl"></i>
        </button>
      </div>

      {/* Music Indicator */}
      {story.music_url && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
          <i className="fa-solid fa-music text-red-500 animate-[spin_3s_linear_infinite]"></i>
          <span className="text-white text-xs font-bold italic">{story.music_title}</span>
          <audio ref={audioRef} src={story.music_url} loop className="hidden" />
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
