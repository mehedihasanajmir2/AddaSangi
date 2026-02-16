
import React, { useState } from 'react';
import { Post, Story, User, ReactionType } from '../types';
import PostCard from './PostCard';

interface FeedProps {
  posts: Post[];
  stories: Story[];
  loading: boolean;
  currentUser: User;
  onLike: (id: string, reaction?: ReactionType) => void;
  onRefresh: () => void;
  onPostCreate: (caption: string) => void;
  onPostDelete: (id: string) => void;
  onProfileClick: () => void;
}

const Feed: React.FC<FeedProps> = ({ posts, stories, loading, currentUser, onLike, onRefresh, onPostCreate, onPostDelete, onProfileClick }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPostText, setNewPostText] = useState('');

  const handlePostSubmit = () => {
    if (newPostText.trim()) {
      onPostCreate(newPostText);
      setNewPostText('');
      setIsModalOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* What's on your mind? Section */}
      <div className="bg-white p-4 shadow-sm md:rounded-xl">
        <div className="flex gap-3 mb-3">
          <img 
            src={currentUser.avatar} 
            className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity" 
            alt="me" 
            onClick={onProfileClick}
          />
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 bg-gray-100 hover:bg-gray-200 transition-colors rounded-full text-left px-4 py-2 text-gray-500 text-sm md:text-base font-medium"
          >
            What's on your mind, {currentUser.username.split(' ')[0]}?
          </button>
        </div>
        <div className="border-t border-gray-100 pt-3 flex justify-between">
          <button className="flex items-center gap-2 text-gray-600 font-bold text-xs md:text-sm flex-1 justify-center py-2 hover:bg-gray-50 rounded">
            <i className="fa-solid fa-image text-green-500"></i> Photo
          </button>
          <button className="flex items-center gap-2 text-gray-600 font-bold text-xs md:text-sm flex-1 justify-center py-2 hover:bg-gray-50 rounded border-l border-gray-100">
            <i className="fa-solid fa-face-smile text-yellow-500"></i> Feeling
          </button>
        </div>
      </div>

      {/* Stories Section */}
      <div className="bg-white md:bg-transparent p-4 md:p-0 shadow-sm md:shadow-none overflow-x-auto hide-scrollbar flex gap-2">
        {stories.map((story, i) => (
          <div key={story.id} className="relative w-28 h-48 md:w-32 md:h-52 rounded-xl overflow-hidden flex-shrink-0 shadow-sm border border-gray-100 cursor-pointer group">
            <img src={story.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="story" />
            <div className="absolute inset-0 bg-black/20"></div>
            
            {i === 0 ? (
               <div className="absolute inset-0 flex flex-col">
                  <div className="h-2/3 bg-gray-100 overflow-hidden">
                    <img src={currentUser.avatar} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="h-1/3 bg-white flex flex-col items-center justify-center relative">
                    <div className="absolute -top-4 bg-[#1b5e20] text-white w-8 h-8 rounded-full flex items-center justify-center border-4 border-white group-hover:scale-110 transition-transform">
                      <i className="fa-solid fa-plus text-xs"></i>
                    </div>
                    <span className="text-[10px] md:text-xs font-bold text-gray-900 mt-2">Create Story</span>
                  </div>
               </div>
            ) : (
              <>
                <div className="absolute top-2 left-2 w-8 h-8 md:w-9 md:h-9 rounded-full border-4 border-[#1b5e20] p-0.5 overflow-hidden z-10">
                  <img src={story.user.avatar} className="w-full h-full rounded-full object-cover" alt="" />
                </div>
                <div className="absolute bottom-2 left-2 right-2 z-10">
                  <span className="text-[10px] md:text-xs font-bold text-white leading-tight block truncate drop-shadow-md">{story.user.username}</span>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Posts Section */}
      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-white p-4 animate-pulse shadow-sm md:rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="w-32 h-3 bg-gray-200 rounded"></div>
                    <div className="w-20 h-2 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="h-64 bg-gray-100 rounded mb-3"></div>
              </div>
            ))}
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="md:rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
              <PostCard 
                post={post} 
                currentUser={currentUser}
                onLike={(reaction) => onLike(post.id, reaction)} 
                onDelete={() => onPostDelete(post.id)}
              />
            </div>
          ))
        )}
        
        {!loading && posts.length > 0 && (
          <button 
            onClick={onRefresh}
            className="mx-4 md:mx-0 my-2 py-3 rounded-lg bg-white shadow-sm text-gray-600 font-bold text-sm active:bg-gray-50 border border-gray-200 transition-colors hover:bg-gray-50"
          >
            Refresh Feed
          </button>
        )}
      </div>

      {/* Create Post Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-[500px] rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <header className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="w-8"></div>
              <h2 className="text-lg font-bold text-gray-900">Create Post</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </header>
            
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <img src={currentUser.avatar} className="w-10 h-10 rounded-full" alt="" />
                <div>
                  <h4 className="font-bold text-sm text-gray-900">{currentUser.username}</h4>
                  <div className="bg-gray-100 px-2 py-0.5 rounded flex items-center gap-1 text-[10px] font-bold text-gray-600 w-fit">
                    <i className="fa-solid fa-users"></i> Friends <i className="fa-solid fa-caret-down"></i>
                  </div>
                </div>
              </div>

              <textarea
                placeholder={`What's on your mind, ${currentUser.username.split(' ')[0]}?`}
                className="w-full min-h-[150px] resize-none border-none outline-none text-xl placeholder-gray-400 font-medium"
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                autoFocus
              ></textarea>

              <div className="mt-4 p-3 border border-gray-200 rounded-lg flex items-center justify-between">
                <span className="text-sm font-bold text-gray-600">Add to your post</span>
                <div className="flex gap-4">
                  <i className="fa-solid fa-image text-green-500 cursor-pointer text-lg hover:scale-110 transition-transform"></i>
                  <i className="fa-solid fa-user-tag text-blue-500 cursor-pointer text-lg hover:scale-110 transition-transform"></i>
                  <i className="fa-solid fa-face-smile text-yellow-500 cursor-pointer text-lg hover:scale-110 transition-transform"></i>
                  <i className="fa-solid fa-location-dot text-red-500 cursor-pointer text-lg hover:scale-110 transition-transform"></i>
                </div>
              </div>

              <button
                onClick={handlePostSubmit}
                disabled={!newPostText.trim()}
                className={`w-full py-2.5 rounded-lg mt-4 font-bold transition-all shadow-md ${newPostText.trim() ? 'bg-[#1b5e20] text-white hover:bg-[#144d18]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                Post Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feed;
