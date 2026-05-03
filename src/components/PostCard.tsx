
import React, { useState } from 'react';
import { Post, User, ReactionType } from '../types';

interface PostCardProps {
  post: Post;
  currentUser: User;
  onLike: (reaction?: ReactionType) => void;
  onDelete: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, currentUser, onLike, onDelete }) => {
  const [showReactions, setShowReactions] = useState(false);
  const [commentText, setCommentText] = useState('');

  const reactions: { type: ReactionType, icon: string, color: string }[] = [
    { type: 'like', icon: 'fa-thumbs-up', color: 'text-blue-500' },
    { type: 'love', icon: 'fa-heart', color: 'text-red-500' },
    { type: 'haha', icon: 'fa-face-laugh', color: 'text-yellow-500' },
    { type: 'wow', icon: 'fa-face-surprise', color: 'text-yellow-500' },
    { type: 'sad', icon: 'fa-face-sad-tear', color: 'text-yellow-500' },
    { type: 'angry', icon: 'fa-face-angry', color: 'text-orange-500' },
  ];

  return (
    <div className="bg-white border border-gray-100 mb-4 shadow-sm">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={post.user.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
          <div>
            <h4 className="font-bold text-sm text-gray-900">{post.user.full_name}</h4>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500">{post.timestamp}</span>
            </div>
          </div>
        </div>
        {post.user.id === currentUser.id && (
          <button onClick={onDelete} className="text-gray-400 hover:text-red-500">
            <i className="fa-solid fa-trash-can"></i>
          </button>
        )}
      </div>

      <div className="px-4 pb-3">
        <p className="text-sm text-gray-800 leading-relaxed">{post.caption}</p>
      </div>

      {post.imageUrl && (
        <div className="w-full bg-gray-50">
          <img src={post.imageUrl} className="w-full h-auto max-h-[600px] object-contain" alt="" />
        </div>
      )}

      <div className="p-2 border-t border-gray-50 flex items-center justify-around relative">
        <div 
          className="flex-1 py-2 flex items-center justify-center gap-2 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer group"
          onMouseEnter={() => setShowReactions(true)}
          onMouseLeave={() => setShowReactions(false)}
          onClick={() => onLike('like')}
        >
          <i className="fa-regular fa-thumbs-up"></i>
          <span className="text-sm font-bold">Like</span>
          
          {showReactions && (
            <div className="absolute bottom-full left-0 mb-2 bg-white shadow-xl rounded-full p-1 flex gap-2 border border-gray-100 animate-in fade-in slide-in-from-bottom-2">
              {reactions.map((r) => (
                <button 
                  key={r.type} 
                  onClick={(e) => { e.stopPropagation(); onLike(r.type); setShowReactions(false); }}
                  className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-transform hover:scale-125"
                >
                  <i className={`fa-solid ${r.icon} ${r.color} text-xl`}></i>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <button className="flex-1 py-2 flex items-center justify-center gap-2 text-gray-600 hover:bg-gray-50 transition-colors">
          <i className="fa-regular fa-message"></i>
          <span className="text-sm font-bold">Comment</span>
        </button>
        
        <button className="flex-1 py-2 flex items-center justify-center gap-2 text-gray-600 hover:bg-gray-50 transition-colors">
          <i className="fa-solid fa-share"></i>
          <span className="text-sm font-bold">Share</span>
        </button>
      </div>
      
      {post.comments && post.comments.length > 0 && (
        <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-50">
          {post.comments.map(comment => (
            <div key={comment.id} className="flex gap-2 mb-2">
              <span className="font-bold text-xs text-gray-900">{comment.full_name}</span>
              <span className="text-xs text-gray-700">{comment.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PostCard;
