
import React, { useState, useEffect } from 'react';
import { User, Post } from '../types';
import PostCard from './PostCard';
import { supabase } from '../services/supabaseClient';

interface ProfileProps {
  user: User;
  posts: Post[];
  isOwnProfile: boolean;
  currentUser: User;
  onPostDelete: () => void;
  onLike: () => void;
  onUpdateProfile?: (data: Partial<User>) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, posts, isOwnProfile, currentUser, onPostDelete, onLike, onUpdateProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);

  const checkUsername = async (username: string) => {
    if (!username || username === user.username) {
      setIsUsernameAvailable(null);
      return;
    }
    if (username.length < 3) {
      setIsUsernameAvailable(false);
      return;
    }
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.toLowerCase())
        .maybeSingle();
      
      setIsUsernameAvailable(!data);
    } catch (err) {
      setIsUsernameAvailable(null);
    }
  };

  const handleSave = async () => {
    if (editedUser.username !== user.username && isUsernameAvailable === false) {
      setError('This username is already taken!');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: editedUser.username.toLowerCase(),
          full_name: editedUser.full_name,
          bio: editedUser.bio,
          avatar_url: editedUser.avatar,
          cover_url: editedUser.coverUrl,
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;
      
      onUpdateProfile?.(editedUser);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <div className="bg-white shadow-sm overflow-hidden md:rounded-b-2xl">
        <div className="relative h-48 md:h-64 bg-gray-200">
          <img src={user.coverUrl || 'https://images.unsplash.com/photo-1557683316-973673baf926'} className="w-full h-full object-cover" alt="cover" />
          <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-black/60 to-transparent"></div>
        </div>
        
        <div className="px-4 pb-4">
          <div className="relative -mt-16 mb-4 flex items-end justify-between px-2">
            <div className="relative">
              <img src={user.avatar} className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white object-cover bg-white shadow-lg" alt="avatar" />
              {isOwnProfile && (
                <button className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 hover:bg-gray-200 shadow-sm">
                  <i className="fa-solid fa-camera text-gray-700"></i>
                </button>
              )}
            </div>
            {isOwnProfile && (
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-6 py-2 rounded-lg font-bold text-sm mb-2 transition-colors flex items-center gap-2"
              >
                <i className={`fa-solid ${isEditing ? 'fa-xmark' : 'fa-pen'}`}></i>
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-4 p-2 animate-in fade-in slide-in-from-top-4 duration-300">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
                <input 
                  type="text" 
                  value={editedUser.full_name} 
                  onChange={e => setEditedUser({...editedUser, full_name: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#1b5e20]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Username (Unique Search ID)</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={editedUser.username} 
                    onChange={e => {
                      const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
                      setEditedUser({...editedUser, username: val});
                      checkUsername(val);
                    }}
                    className={`w-full p-3 bg-gray-50 border rounded-lg outline-none focus:border-[#1b5e20] transition-all font-bold ${
                      isUsernameAvailable === false ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isUsernameAvailable === true && <i className="fa-solid fa-circle-check text-green-500"></i>}
                    {isUsernameAvailable === false && <i className="fa-solid fa-circle-xmark text-red-500"></i>}
                  </div>
                </div>
                {isUsernameAvailable === false && <p className="text-red-500 text-[10px] mt-1 font-bold">This username is already taken!</p>}
              </div>
              {error && <p className="text-red-500 text-xs font-bold bg-red-50 p-2 rounded">{error}</p>}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Bio</label>
                <textarea 
                  value={editedUser.bio || ''} 
                  onChange={e => setEditedUser({...editedUser, bio: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#1b5e20] min-h-[100px] resize-none"
                />
              </div>
              <button 
                onClick={handleSave}
                disabled={loading || (editedUser.username !== user.username && isUsernameAvailable === false)}
                className="w-full bg-[#1b5e20] text-white py-3 rounded-xl font-bold shadow-md hover:bg-[#144d18] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          ) : (
            <div className="px-2">
              <h1 className="text-2xl md:text-3xl font-black text-gray-900">{user.full_name}</h1>
              <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">@{user.username}</span>
              {user.bio && <p className="text-gray-600 mt-2 whitespace-pre-wrap">{user.bio}</p>}
              
              <div className="flex gap-4 mt-4 border-t border-gray-100 pt-4">
                <div className="flex flex-col items-center">
                  <span className="font-black text-lg text-gray-900">{posts.length}</span>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Posts</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-black text-lg text-gray-900">1.2k</span>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Followers</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-black text-lg text-gray-900">850</span>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Following</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 px-2">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Post Gallery</h3>
        <div className="flex flex-col gap-4">
          {posts.length > 0 ? (
            posts.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                currentUser={currentUser} 
                onLike={onLike} 
                onDelete={onPostDelete} 
              />
            ))
          ) : (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
              <i className="fa-solid fa-camera text-4xl text-gray-200 mb-4 block"></i>
              <p className="text-gray-400 font-medium">No posts yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
