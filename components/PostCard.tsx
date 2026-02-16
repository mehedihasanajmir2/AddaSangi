
import React, { useState } from 'react';
import { Post, ReactionType, User } from '../types';
import { supabase } from '../services/supabaseClient';

interface PostCardProps {
  post: Post;
  currentUser: User;
  onLike: (reaction: ReactionType) => void;
  onDelete?: () => void;
}

const REACTION_CONFIG = [
  { type: 'like' as const, icon: 'fa-thumbs-up', color: 'text-blue-500', label: 'Like' },
  { type: 'love' as const, icon: 'fa-heart', color: 'text-red-500', label: 'Love' },
  { type: 'haha' as const, icon: 'fa-face-laugh-squint', color: 'text-yellow-500', label: 'Haha' },
];

const PostCard: React.FC<PostCardProps> = ({ post, currentUser, onLike, onDelete }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    const { error } = await supabase.from('comments').insert({
      post_id: post.id,
      user_id: currentUser.id,
      content: commentText
    });
    
    if (!error) {
      setCommentText('');
      // আসলে App.tsx এর loadFeed কল হওয়া উচিত, এখানে জাস্ট ইউজার ফিডব্যাক
    }
  };

  const activeReaction = REACTION_CONFIG.find(r => r.type === post.userReaction);

  return (
    <div className="bg-white mb-4 border rounded-xl shadow-sm overflow-hidden">
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={post.user.avatar} className="w-10 h-10 rounded-full object-cover" />
          <div>
            <h4 className="font-bold text-sm">{post.user.username}</h4>
            <p className="text-[11px] text-gray-500">{post.timestamp}</p>
          </div>
        </div>
        {currentUser.id === post.user.id && (
          <button onClick={onDelete} className="text-gray-400 hover:text-red-500 p-2"><i className="fa-solid fa-trash-can"></i></button>
        )}
      </div>

      <div className="px-3 pb-2 text-sm">{post.caption}</div>
      <img src={post.imageUrl} className="w-full h-auto" />

      <div className="p-3 border-b flex justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <span className="bg-blue-500 text-white w-4 h-4 rounded-full flex items-center justify-center"><i className="fa-solid fa-thumbs-up text-[8px]"></i></span>
          <span>{post.likes}</span>
        </div>
        <div onClick={() => setShowComments(!showComments)} className="cursor-pointer hover:underline">
          {post.comments.length} comments
        </div>
      </div>

      <div className="flex px-2 py-1">
        <button 
          onClick={() => onLike(post.userReaction ? null : 'like')} 
          className={`flex-1 py-2 flex items-center justify-center gap-2 font-bold text-sm rounded-lg hover:bg-gray-50 ${activeReaction ? activeReaction.color : 'text-gray-500'}`}
        >
          <i className={`fa-solid ${activeReaction ? activeReaction.icon : 'fa-regular fa-thumbs-up'} text-lg`}></i>
          {activeReaction ? activeReaction.label : 'Like'}
        </button>
        <button onClick={() => setShowComments(!showComments)} className="flex-1 py-2 flex items-center justify-center gap-2 text-gray-500 font-bold text-sm rounded-lg hover:bg-gray-50">
          <i className="fa-regular fa-message text-lg"></i> Comment
        </button>
      </div>

      {showComments && (
        <div className="bg-gray-50 p-3 border-t">
          {post.comments.map(c => (
            <div key={c.id} className="flex gap-2 mb-2">
              <div className="bg-white p-2 rounded-2xl shadow-sm">
                <p className="text-xs font-bold">{c.username}</p>
                <p className="text-sm">{c.text}</p>
              </div>
            </div>
          ))}
          <form onSubmit={submitComment} className="mt-2 flex gap-2">
            <input 
              type="text" 
              placeholder="Write a comment..." 
              className="flex-1 bg-white border rounded-full px-4 py-1.5 text-sm outline-none focus:ring-1 focus:ring-red-100"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
          </form>
        </div>
      )}
    </div>
  );
};

export default PostCard;
