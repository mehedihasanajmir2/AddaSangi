
import React, { useState, useRef, useEffect } from 'react';
import { Post, Comment, ReactionType, User } from '../types';

interface PostCardProps {
  post: Post;
  currentUser?: User;
  onLike: (reaction?: ReactionType) => void;
  onDelete?: () => void;
}

const REACTION_CONFIG = [
  { type: 'like' as const, icon: 'fa-thumbs-up', color: 'text-blue-500', label: 'Like', bg: 'bg-blue-500' },
  { type: 'love' as const, icon: 'fa-heart', color: 'text-red-500', label: 'Love', bg: 'bg-red-500' },
  { type: 'haha' as const, icon: 'fa-face-laugh-squint', color: 'text-yellow-500', label: 'Haha', bg: 'bg-yellow-500' },
  { type: 'wow' as const, icon: 'fa-face-surprise', color: 'text-yellow-500', label: 'Wow', bg: 'bg-yellow-500' },
  { type: 'sad' as const, icon: 'fa-face-sad-tear', color: 'text-yellow-500', label: 'Sad', bg: 'bg-yellow-500' },
  { type: 'angry' as const, icon: 'fa-face-angry', color: 'text-orange-600', label: 'Angry', bg: 'bg-orange-600' },
];

const QUICK_EMOJIS = ['❤️', '😂', '😮', '😢', '😡', '👍', '🔥', '🙌'];

const PostCard: React.FC<PostCardProps> = ({ post, currentUser, onLike, onDelete }) => {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const reactionTimeoutRef = useRef<number | null>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  const [localComments, setLocalComments] = useState<Comment[]>([
    { id: 'c1', username: 'rahim_adda', text: 'Kopp bhai! 🔥', timestamp: '2m' },
    { id: 'c2', username: 'sumaiya_sangi', text: 'Beautiful view! ❤️', timestamp: '1m' }
  ]);

  const isOwner = currentUser && post.user.id === currentUser.id;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLikeClick = () => {
    if (post.userReaction) {
      onLike(null); // Toggle off
    } else {
      onLike('like');
    }
    setShowReactions(false);
  };

  const handleReactionSelect = (type: ReactionType) => {
    onLike(type);
    setShowReactions(false);
  };

  const handleMouseEnter = () => {
    reactionTimeoutRef.current = window.setTimeout(() => {
      setShowReactions(true);
    }, 500);
  };

  const handleMouseLeave = () => {
    if (reactionTimeoutRef.current) {
      clearTimeout(reactionTimeoutRef.current);
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      const newComment: Comment = {
        id: Date.now().toString(),
        username: currentUser?.username || 'Guest',
        text: commentText,
        timestamp: 'Just now'
      };
      setLocalComments([...localComments, newComment]);
      setCommentText('');
      setShowEmojiPicker(false);
    }
  };

  const addEmoji = (emoji: string) => {
    setCommentText(prev => prev + emoji);
  };

  const activeReaction = REACTION_CONFIG.find(r => r.type === post.userReaction);

  return (
    <article className="bg-white shadow-sm overflow-hidden border border-gray-100">
      {/* Post Header */}
      <div className="flex items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2">
          <img src={post.user.avatar} className="w-10 h-10 rounded-full object-cover border border-gray-100" alt={post.user.username} />
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="font-bold text-[15px] text-gray-900 leading-tight hover:underline cursor-pointer">{post.user.username}</span>
              {post.user.isVerified && <i className="fa-solid fa-circle-check text-blue-500 text-[10px]"></i>}
            </div>
            <div className="flex items-center gap-1 text-[12px] text-gray-500 leading-tight">
              <span>{post.timestamp}</span>
              <span>•</span>
              <i className="fa-solid fa-earth-americas text-[10px]"></i>
            </div>
          </div>
        </div>
        
        <div className="relative" ref={optionsRef}>
          <button 
            onClick={() => setShowOptions(!showOptions)}
            className="text-gray-500 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <i className="fa-solid fa-ellipsis text-lg"></i>
          </button>
          
          {showOptions && (
            <div className="absolute right-0 top-10 w-48 bg-white shadow-xl rounded-xl border border-gray-100 z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
              <button className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                <i className="fa-regular fa-bookmark w-4"></i> Save Post
              </button>
              {isOwner && (
                <button 
                  onClick={() => { onDelete?.(); setShowOptions(false); }}
                  className="w-full text-left px-4 py-3 text-sm font-black text-red-600 hover:bg-red-50 flex items-center gap-3 border-t border-gray-50"
                >
                  <i className="fa-solid fa-trash-can w-4"></i> Delete Post
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Caption */}
      <div className="px-3 pb-3 text-[15px] text-gray-900 font-normal leading-normal">
        {post.caption}
      </div>

      {/* Post Image */}
      <div 
        className="bg-gray-100 w-full overflow-hidden border-t border-b border-gray-50 cursor-pointer relative"
        onDoubleClick={() => handleReactionSelect('love')}
      >
        <img src={post.imageUrl} className="w-full h-auto object-cover max-h-[600px]" alt="Post content" loading="lazy" />
      </div>

      {/* Interaction Stats */}
      <div className="px-3 py-2.5 flex justify-between items-center text-[13px] text-gray-500 border-b border-gray-100 mx-3">
        <div className="flex items-center gap-1">
          <div className="flex -space-x-1.5">
             <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white border-2 border-white shadow-sm">
                <i className="fa-solid fa-thumbs-up text-[9px]"></i>
             </div>
             <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white border-2 border-white shadow-sm">
                <i className="fa-solid fa-heart text-[9px]"></i>
             </div>
             <div className="w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center text-white border-2 border-white shadow-sm">
                <i className="fa-solid fa-face-laugh-squint text-[9px]"></i>
             </div>
          </div>
          <span className="hover:underline cursor-pointer ml-1.5 font-semibold text-gray-600">{(post.likes + (post.userReaction ? 1 : 0)).toLocaleString()}</span>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowComments(!showComments)} className="hover:underline cursor-pointer font-medium">
            {localComments.length} comments
          </button>
          <span className="hover:underline cursor-pointer font-medium">12 shares</span>
        </div>
      </div>

      {/* Action Buttons with Reactions Bar */}
      <div className="flex justify-between items-center px-4 py-1 mx-1 relative">
        {/* Reactions Picker */}
        {showReactions && (
          <div 
            className="absolute -top-14 left-4 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] rounded-full px-2 py-1.5 flex gap-2 animate-in slide-in-from-bottom-2 fade-in duration-200 z-30 border border-gray-100"
            onMouseLeave={() => setShowReactions(false)}
          >
            {REACTION_CONFIG.map((react) => (
              <button
                key={react.type}
                onClick={() => handleReactionSelect(react.type)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:scale-125 hover:-translate-y-1 transition-all duration-200 group relative"
              >
                <div className={`${react.bg} w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm`}>
                   <i className={`fa-solid ${react.icon} text-sm`}></i>
                </div>
                <span className="absolute -top-8 bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity font-bold">
                  {react.label}
                </span>
              </button>
            ))}
          </div>
        )}

        <button 
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleLikeClick} 
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg hover:bg-gray-100 transition-all active:scale-90 ${activeReaction ? activeReaction.color : 'text-gray-600'}`}
        >
          <i className={`${activeReaction ? 'fa-solid ' + activeReaction.icon : 'fa-regular fa-thumbs-up'} text-xl transition-all`}></i>
          <span className="font-bold text-sm">{activeReaction ? activeReaction.label : 'Like'}</span>
        </button>
        
        <button 
          onClick={() => setShowComments(!showComments)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg hover:bg-gray-100 transition-colors ${showComments ? 'text-[#1b5e20]' : 'text-gray-600'}`}
        >
          <i className="fa-regular fa-message text-xl"></i>
          <span className="font-bold text-sm">Comment</span>
        </button>
        
        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
          <i className="fa-solid fa-share text-xl"></i>
          <span className="font-bold text-sm">Share</span>
        </button>
      </div>

      {/* Comments List */}
      {showComments && (
        <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-50 animate-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col gap-4">
            {localComments.map((comment) => (
              <div key={comment.id} className="flex gap-2 items-start group">
                <img src={`https://picsum.photos/seed/${comment.username}/100`} className="w-8 h-8 rounded-full shadow-sm" alt="" />
                <div className="flex-1 max-w-[85%]">
                  <div className="bg-white rounded-2xl px-3.5 py-2 inline-block shadow-sm border border-gray-100">
                    <h5 className="font-bold text-[13px] text-gray-900 leading-tight mb-0.5">{comment.username}</h5>
                    <p className="text-[14px] text-gray-800 leading-normal">{comment.text}</p>
                  </div>
                  <div className="flex gap-4 mt-1 ml-2 text-[11px] font-bold text-gray-500">
                    <button className="hover:underline hover:text-gray-700">Like</button>
                    <button className="hover:underline hover:text-gray-700">Reply</button>
                    <span className="font-medium text-gray-400">{comment.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Comment Input with Emoji Integration */}
      <div className="p-3 border-t border-gray-100 flex flex-col gap-2 bg-white relative">
        {showEmojiPicker && (
          <div className="absolute bottom-full left-4 bg-white shadow-lg border border-gray-100 p-2 rounded-xl flex gap-1 animate-in zoom-in-95 duration-200 z-20 mb-2">
            {QUICK_EMOJIS.map(emoji => (
              <button 
                key={emoji} 
                onClick={() => addEmoji(emoji)}
                className="text-xl hover:scale-125 transition-transform p-1"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <img src={currentUser?.avatar || 'https://picsum.photos/seed/me/100'} className="w-8 h-8 rounded-full border border-gray-100" alt="me" />
          <form onSubmit={handleAddComment} className="flex-1 bg-gray-100 rounded-2xl flex items-center px-3.5 py-1.5 transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-gray-100 group">
            <input 
              type="text" 
              placeholder="Write a comment..."
              className="flex-1 text-[14px] bg-transparent border-none outline-none text-gray-900 font-medium py-1"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <div className="flex gap-3 text-gray-400 text-lg">
              <button 
                type="button" 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`hover:text-yellow-500 transition-colors ${showEmojiPicker ? 'text-yellow-500' : ''}`}
              >
                <i className="fa-regular fa-face-smile"></i>
              </button>
              <i className="fa-solid fa-camera cursor-pointer hover:text-gray-600 transition-colors"></i>
              <i className="fa-solid fa-gift cursor-pointer hover:text-gray-600 transition-colors"></i>
            </div>
            {commentText.trim() && (
              <button type="submit" className="ml-3 text-blue-600 font-bold text-lg hover:scale-110 active:scale-95 transition-all">
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            )}
          </form>
        </div>
      </div>
    </article>
  );
};

export default PostCard;
