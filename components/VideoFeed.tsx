
import React from 'react';
import { Post, ReactionType } from '../types';
import PostCard from './PostCard';

interface VideoFeedProps {
  posts: Post[];
  loading: boolean;
  onLike: (id: string, reaction?: ReactionType) => void;
}

const VideoFeed: React.FC<VideoFeedProps> = ({ posts, loading, onLike }) => {
  // Filter for posts that might represent videos (mocking it for now)
  const videoPosts = posts.slice(0, 5); 

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500">
      <div className="bg-white p-4 shadow-sm md:rounded-xl">
        <h2 className="text-xl font-bold text-gray-900">AddaSangi Video</h2>
        <div className="flex gap-2 mt-3 overflow-x-auto hide-scrollbar pb-1">
          <button className="bg-gray-100 hover:bg-gray-200 px-4 py-1.5 rounded-full text-sm font-bold text-gray-700 whitespace-nowrap">For You</button>
          <button className="bg-gray-100 hover:bg-gray-200 px-4 py-1.5 rounded-full text-sm font-bold text-gray-700 whitespace-nowrap">Live</button>
          <button className="bg-gray-100 hover:bg-gray-200 px-4 py-1.5 rounded-full text-sm font-bold text-gray-700 whitespace-nowrap">Reels</button>
          <button className="bg-gray-100 hover:bg-gray-200 px-4 py-1.5 rounded-full text-sm font-bold text-gray-700 whitespace-nowrap">Following</button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="bg-white p-4 animate-pulse shadow-sm md:rounded-xl h-96"></div>
        ) : (
          videoPosts.map(post => (
            <div key={post.id} className="relative group">
              <PostCard post={post} onLike={(reaction) => onLike(post.id, reaction)} />
              {/* Mocking a Play Icon Overlay */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-16 h-16 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                  <i className="fa-solid fa-play text-white text-2xl ml-1"></i>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VideoFeed;
