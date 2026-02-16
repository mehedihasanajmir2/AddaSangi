
import React, { useState, useMemo, useRef } from 'react';
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

  const handleSaveProfile = () => {
    if (onUpdateProfile) {
      onUpdateProfile({
        bio: editBio,
        username: editUsername,
        location: editLocation
      });
    }
    setIsEditModalOpen(false);
  };

  const displayCover = user.coverUrl || `https://picsum.photos/seed/cover-${user.id}/1200/400`;

  return (
    <div className="animate-in fade-in duration-300 bg-[#f0f2f5] min-h-screen pb-20">
      {/* Cover and Avatar */}
      <div className="bg-white pb-4 shadow-sm">
        <div className="h-44 md:h-80 bg-gray-200 relative">
          <img src={displayCover} className="w-full h-full object-cover" alt="cover" />
        </div>
        <div className="px-4 -mt-16 md:-mt-24 relative flex flex-col items-center md:flex-row md:items-end gap-4 max-w-5xl mx-auto">
          <div className="w-36 h-36 md:w-48 md:h-48 rounded-full border-4 border-white overflow-hidden shadow-2xl bg-white">
            <img src={user.avatar} className="w-full h-full object-cover" alt={user.username} />
          </div>
          <div className="text-center md:text-left md:pb-6 flex-1 pt-4">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter">{user.username}</h2>
            <p className="text-gray-500 font-bold text-sm">{posts.length} Posts · Profile Info</p>
          </div>
          {isOwnProfile && (
            <button onClick={() => setIsEditModalOpen(true)} className="bg-gray-100 text-gray-800 px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-200 border">
              <i className="fa-solid fa-pen"></i> Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-4 mt-4 px-2">
        <div className="w-full md:w-[360px]">
          <div className="bg-white p-4 shadow-sm rounded-xl border">
            <h3 className="text-xl font-black text-gray-900 mb-4">Intro</h3>
            <div className="space-y-4">
              <p className="text-gray-700 font-medium text-center">{user.bio || "No bio added yet."}</p>
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center gap-3 text-sm font-bold text-gray-600">
                  <i className="fa-solid fa-location-dot text-red-600"></i>
                  <span>Lives in <span className="text-gray-900">{user.location || "Add Location"}</span></span>
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-gray-600">
                  <i className="fa-solid fa-cake-candles text-red-600"></i>
                  <span>Birthday: <span className="text-gray-900">{user.dob || "Not set"}</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <h3 className="text-lg font-black mb-4">Your Addas</h3>
            {posts.map(post => (
              <PostCard key={post.id} post={post} currentUser={currentUser} onLike={(r) => onLike?.(post.id, r)} onDelete={() => onPostDelete?.(post.id)} />
            ))}
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-[500px] rounded-2xl shadow-2xl flex flex-col">
            <header className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-black">Edit Profile Info</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500"><i className="fa-solid fa-xmark text-xl"></i></button>
            </header>
            <div className="p-6 space-y-5">
              <section>
                <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wide">Your Full Name</label>
                <input 
                  type="text" 
                  value={editUsername} 
                  onChange={(e) => setEditUsername(e.target.value)} 
                  className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-red-500 font-bold text-lg" 
                  placeholder="Enter your name"
                />
              </section>
              <section>
                <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wide">Bio</label>
                <textarea 
                  value={editBio} 
                  onChange={(e) => setEditBio(e.target.value)} 
                  className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-red-500 min-h-[100px]" 
                  placeholder="Write something about yourself"
                />
              </section>
              <section>
                <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wide">Location</label>
                <input 
                  type="text" 
                  value={editLocation} 
                  onChange={(e) => setEditLocation(e.target.value)} 
                  className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-red-500" 
                  placeholder="City, Country"
                />
              </section>
            </div>
            <footer className="p-4 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={handleSaveProfile} className="w-full bg-[#b71c1c] text-white py-4 rounded-xl font-black text-lg shadow-lg">Save All Changes</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
