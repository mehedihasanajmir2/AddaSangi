
import React from 'react';
import { User, Post } from '../types';

interface ProfileProps {
  user: User;
  posts: Post[];
  isOwnProfile?: boolean;
}

const Profile: React.FC<ProfileProps> = ({ user, posts, isOwnProfile = false }) => {
  // Format the date to something more readable if it exists
  const formattedDob = user.dob ? new Date(user.dob).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) : null;

  return (
    <div className="animate-in fade-in duration-300 bg-[#f0f2f5] min-h-screen">
      {/* Cover Photo & Profile Info Section */}
      <div className="bg-white pb-4 shadow-sm">
        <div className="h-44 bg-gray-200 relative">
          <img src={`https://picsum.photos/seed/cover-${user.id}/800/400`} className="w-full h-full object-cover" alt="cover" />
          {isOwnProfile && (
            <button className="absolute bottom-3 right-3 bg-white px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 shadow-sm">
              <i className="fa-solid fa-camera"></i> Edit Cover Photo
            </button>
          )}
        </div>
        
        {/* Profile Info: Avatar next to Name/Friends */}
        <div className="px-4 -mt-12 relative flex flex-col md:flex-row items-center md:items-end gap-4">
          <div className="relative">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white overflow-hidden shadow-lg bg-white">
              <img src={user.avatar} className="w-full h-full object-cover" alt={user.username} />
            </div>
            {isOwnProfile && (
              <button className="absolute bottom-2 right-2 bg-gray-200 p-2 rounded-full border-2 border-white flex items-center justify-center shadow-md">
                <i className="fa-solid fa-camera text-gray-700 text-sm"></i>
              </button>
            )}
          </div>
          
          <div className="text-center md:text-left md:pb-1 flex-1">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{user.username}</h2>
              {user.isVerified && <i className="fa-solid fa-circle-check text-blue-500"></i>}
            </div>
            <p className="text-gray-500 font-bold text-sm md:text-base mt-0.5 hover:underline cursor-pointer">
              {Math.floor(Math.random() * 2000) + 100} Friends
            </p>
            <div className="flex justify-center md:justify-start -space-x-2 mt-2">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <img 
                  key={i} 
                  src={`https://picsum.photos/seed/friend-${user.id}-${i}/100`} 
                  className="w-8 h-8 rounded-full border-2 border-white" 
                  alt="friend" 
                />
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons (FB Style) */}
        <div className="px-4 mt-6 flex gap-2">
          {isOwnProfile ? (
            <>
              <button className="flex-1 bg-[#1b5e20] text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:bg-[#144d18] transition-colors">
                <i className="fa-solid fa-plus-circle"></i> Add to Story
              </button>
              <button className="flex-1 bg-gray-200 text-gray-900 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-300 transition-colors">
                <i className="fa-solid fa-pen"></i> Edit Profile
              </button>
            </>
          ) : (
            <>
              <button className="flex-1 bg-[#1b5e20] text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:bg-[#144d18] transition-colors">
                <i className="fa-solid fa-user-plus"></i> Add Friend
              </button>
              <button className="flex-1 bg-gray-200 text-gray-900 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-300 transition-colors">
                <i className="fa-solid fa-message"></i> Message
              </button>
            </>
          )}
          <button className="w-12 bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300 transition-colors">
             <i className="fa-solid fa-ellipsis"></i>
          </button>
        </div>

        <div className="border-t border-gray-100 mt-4 px-4 flex gap-6 overflow-x-auto py-1 no-scrollbar">
           <button className="text-[#b71c1c] font-bold border-b-4 border-[#b71c1c] py-3 flex-shrink-0">Posts</button>
           <button className="text-gray-500 font-bold py-3 flex-shrink-0 hover:bg-gray-100 px-2 rounded-md transition-colors">About</button>
           <button className="text-gray-500 font-bold py-3 flex-shrink-0 hover:bg-gray-100 px-2 rounded-md transition-colors">Friends</button>
           <button className="text-gray-500 font-bold py-3 flex-shrink-0 hover:bg-gray-100 px-2 rounded-md transition-colors">Photos</button>
           <button className="text-gray-500 font-bold py-3 flex-shrink-0 hover:bg-gray-100 px-2 rounded-md transition-colors">Videos</button>
        </div>
      </div>

      {/* Intro Section (FB Style) */}
      <div className="bg-white mt-3 p-4 shadow-sm md:rounded-xl mx-0 md:mx-4 lg:mx-0">
        <h3 className="text-lg font-bold text-gray-900 mb-3">Intro</h3>
        <div className="space-y-4">
          <div className="text-center text-sm text-gray-800 mb-4 px-2 italic">
            "{user.bio || 'Living the AddaSangi life! 🇧🇩'}"
          </div>
          
          <div className="border-t border-gray-100 pt-3"></div>

          {/* User Specific Data Displays */}
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <i className="fa-solid fa-envelope text-gray-400 w-5 text-center"></i>
            <span>Email: <span className="font-bold text-gray-900">{user.email || 'Private'}</span></span>
          </div>

          {user.gender && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <i className={`fa-solid ${user.gender === 'Male' ? 'fa-mars' : user.gender === 'Female' ? 'fa-venus' : 'fa-user-tag'} text-gray-400 w-5 text-center`}></i>
              <span>Gender: <span className="font-bold text-gray-900">{user.gender}</span></span>
            </div>
          )}

          {formattedDob && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <i className="fa-solid fa-cake-candles text-gray-400 w-5 text-center"></i>
              <span>Birthday: <span className="font-bold text-gray-900">{formattedDob}</span></span>
            </div>
          )}

          <div className="flex items-center gap-3 text-sm text-gray-600">
            <i className="fa-solid fa-house text-gray-400 w-5 text-center"></i>
            <span>Lives in <span className="font-bold text-gray-900">Dhaka, Bangladesh</span></span>
          </div>
        </div>
        
        {isOwnProfile && (
          <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-2 rounded-lg mt-4 text-sm transition-colors">
            Edit Public Details
          </button>
        )}
      </div>

      {/* Photos Section */}
      <div className="bg-white mt-3 p-4 shadow-sm md:rounded-xl mx-0 md:mx-4 lg:mx-0">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">Photos</h3>
          <button className="text-[#1b5e20] font-bold text-sm hover:underline">See All Photos</button>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-square rounded-lg overflow-hidden border border-gray-100 group cursor-pointer">
              <img src={`https://picsum.photos/seed/photo-${user.id}-${i}/300`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Space for bottom nav */}
      <div className="h-20"></div>
    </div>
  );
};

export default Profile;
