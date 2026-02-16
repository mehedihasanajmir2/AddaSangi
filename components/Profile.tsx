
import React, { useState } from 'react';
import { User, Post, ReactionType } from '../types';
import PostCard from './PostCard';

interface ProfileProps {
  user: User;
  posts: Post[];
  isOwnProfile?: boolean;
  onUpdateProfile?: (updatedUser: Partial<User>) => void;
  onPostCreate?: (caption: string) => void;
  onPostDelete?: (id: string) => void;
  onLike?: (id: string, reaction?: ReactionType) => void;
  currentUser: User;
}

const Profile: React.FC<ProfileProps> = ({ 
  user, 
  posts, 
  isOwnProfile = false, 
  onUpdateProfile,
  onPostCreate,
  onPostDelete,
  onLike,
  currentUser
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editBio, setEditBio] = useState(user.bio || '');
  const [editUsername, setEditUsername] = useState(user.username || '');
  const [editLocation, setEditLocation] = useState(user.location || '');
  const [editAvatar, setEditAvatar] = useState(user.avatar || '');
  const [editCover, setEditCover] = useState(user.coverUrl || '');

  const handleSaveProfile = () => {
    if (onUpdateProfile) {
      onUpdateProfile({
        bio: editBio,
        full_name: editUsername,
        location: editLocation,
        avatar_url: editAvatar,
        cover_url: editCover
      });
    }
    setIsEditModalOpen(false);
  };

  const displayCover = user.coverUrl || `https://picsum.photos/seed/cover-${user.id}/1200/400`;

  return (
    <div className="animate-in fade-in duration-300 bg-[#f0f2f5] min-h-screen pb-20">
      <div className="bg-white pb-4 shadow-sm border-b">
        <div className="h-44 md:h-80 bg-gray-200 relative overflow-hidden">
          <img src={displayCover} className="w-full h-full object-cover" alt="cover" />
          {isOwnProfile && (
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-md p-2 rounded-lg text-xs font-bold shadow-lg flex items-center gap-2"
            >
              <i className="fa-solid fa-camera"></i> Edit Cover
            </button>
          )}
        </div>
        <div className="px-4 -mt-16 md:-mt-24 relative flex flex-col items-center md:flex-row md:items-end gap-4 max-w-5xl mx-auto">
          <div className="w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-white overflow-hidden shadow-2xl bg-white group relative">
            <img src={user.avatar} className="w-full h-full object-cover" alt={user.username} />
            {isOwnProfile && (
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <i className="fa-solid fa-camera text-white text-2xl"></i>
              </button>
            )}
          </div>
          <div className="text-center md:text-left md:pb-6 flex-1 pt-4">
            <h2 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tighter flex items-center gap-2 justify-center md:justify-start">
              {user.username}
              {user.isVerified && <i className="fa-solid fa-circle-check text-blue-500 text-xl"></i>}
            </h2>
            <p className="text-gray-500 font-bold text-sm">{posts.length} Posts · Profile Summary</p>
          </div>
          {isOwnProfile && (
            <div className="flex gap-2 mb-4 md:mb-6">
              <button onClick={() => setIsEditModalOpen(true)} className="bg-[#b71c1c] text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#a01818] shadow-md">
                <i className="fa-solid fa-pen"></i> Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-4 mt-4 px-2">
        <div className="w-full md:w-[360px] flex flex-col gap-4">
          <div className="bg-white p-4 shadow-sm rounded-xl border">
            <h3 className="text-xl font-black text-gray-900 mb-4">Intro</h3>
            <div className="space-y-4">
              <div className="text-gray-800 font-bold text-center bg-gray-50 p-4 rounded-xl border-2 border-dashed border-gray-200">
                {user.bio || "Click 'Edit Profile' to add a short bio about yourself!"}
              </div>
              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center gap-4 text-sm font-bold text-gray-700">
                  <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                    <i className="fa-solid fa-location-dot"></i>
                  </div>
                  <span>Lives in <span className="text-gray-900">{user.location || "Earth"}</span></span>
                </div>
                <div className="flex items-center gap-4 text-sm font-bold text-gray-700">
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                    <i className="fa-solid fa-envelope"></i>
                  </div>
                  <span className="truncate">{user.email || "Email Hidden"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <h3 className="text-lg font-black mb-4 flex items-center justify-between">
              Timeline Posts
              <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">{posts.length} Total</span>
            </h3>
            {posts.length > 0 ? (
              posts.map(post => (
                <PostCard key={post.id} post={post} currentUser={currentUser} onLike={(r) => onLike?.(post.id, r)} onDelete={() => onPostDelete?.(post.id)} />
              ))
            ) : (
              <div className="text-center py-16 px-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fa-solid fa-images text-2xl text-gray-300"></i>
                </div>
                <p className="text-gray-500 font-black">No posts to display on your timeline.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-[500px] rounded-3xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-hidden">
            <header className="p-5 border-b flex justify-between items-center">
              <h2 className="text-2xl font-black text-gray-900">Customize Profile</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </header>
            
            <div className="p-6 space-y-6 overflow-y-auto">
              <section>
                <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-widest">Profile Picture URL</label>
                <div className="flex gap-3 items-center">
                  <img src={editAvatar} className="w-14 h-14 rounded-full border-2 border-red-500 object-cover shrink-0" alt="preview" />
                  <input 
                    type="text" 
                    value={editAvatar} 
                    onChange={(e) => setEditAvatar(e.target.value)} 
                    className="flex-1 p-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-red-500 font-bold text-gray-900 shadow-inner" 
                    placeholder="Paste image link here"
                  />
                </div>
              </section>

              <section>
                <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-widest">Cover Photo URL</label>
                <input 
                  type="text" 
                  value={editCover} 
                  onChange={(e) => setEditCover(e.target.value)} 
                  className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-red-500 font-bold text-gray-900" 
                  placeholder="Paste cover image link here"
                />
              </section>
              
              <section>
                <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-widest">Display Name</label>
                <input 
                  type="text" 
                  value={editUsername} 
                  onChange={(e) => setEditUsername(e.target.value)} 
                  className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-red-500 font-black text-gray-900 text-lg" 
                  placeholder="Your name"
                />
              </section>
              
              <section>
                <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-widest">Intro Bio</label>
                <textarea 
                  value={editBio} 
                  onChange={(e) => setEditBio(e.target.value)} 
                  className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-red-500 min-h-[80px] text-gray-900 font-bold" 
                  placeholder="A bit about you..."
                />
              </section>
              
              <section>
                <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-widest">Location</label>
                <input 
                  type="text" 
                  value={editLocation} 
                  onChange={(e) => setEditLocation(e.target.value)} 
                  className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-red-500 text-gray-900 font-bold" 
                  placeholder="City, Country"
                />
              </section>
            </div>
            
            <footer className="p-5 border-t bg-gray-50">
              <button 
                onClick={handleSaveProfile} 
                className="w-full bg-[#b71c1c] text-white py-4 rounded-2xl font-black text-lg shadow-xl hover:shadow-red-200 transition-all active:scale-[0.98]"
              >
                Update Everything
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
