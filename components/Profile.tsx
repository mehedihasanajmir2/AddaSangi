
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
  const [isPostingModalOpen, setIsPostingModalOpen] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Edit form states
  const [editBio, setEditBio] = useState(user.bio || '');
  const [editUsername, setEditUsername] = useState(user.username || '');
  const [editGender, setEditGender] = useState(user.gender || '');
  const [editLocation, setEditLocation] = useState(user.location || 'Dhaka, Bangladesh');
  
  // Birthday editing state
  const userDob = user.dob ? new Date(user.dob) : new Date(2000, 0, 1);
  const [birthDay, setBirthDay] = useState(userDob.getDate().toString());
  const [birthMonth, setBirthMonth] = useState((userDob.getMonth() + 1).toString());
  const [birthYear, setBirthYear] = useState(userDob.getFullYear().toString());

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1947 + 1 }, (_, i) => (currentYear - i).toString());

  const daysInMonth = useMemo(() => {
    const d = new Date(parseInt(birthYear), parseInt(birthMonth), 0).getDate();
    return Array.from({ length: d }, (_, i) => (i + 1).toString());
  }, [birthMonth, birthYear]);

  const calculateAge = (year: number, month: number, day: number) => {
    const today = new Date();
    let age = today.getFullYear() - year;
    const m = today.getMonth() + 1 - month;
    if (m < 0 || (m === 0 && today.getDate() < day)) {
      age--;
    }
    return age;
  };

  const handleSaveProfile = () => {
    setErrorMsg('');

    // 1. Name Removal Prevention
    if (!editUsername.trim()) {
      setErrorMsg('Name cannot be removed. You must have a name on your profile.');
      return;
    }

    // 2. Name Change Logic (30 days restriction)
    if (editUsername !== user.username) {
      if (user.lastNameChangeDate) {
        const lastChange = new Date(user.lastNameChangeDate);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        if (lastChange > thirtyDaysAgo) {
          const diffTime = Math.abs(lastChange.getTime() + (30 * 24 * 60 * 60 * 1000) - new Date().getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setErrorMsg(`You cannot change your name yet. Please wait another ${diffDays} day(s). Name changes are limited to once every 30 days.`);
          return;
        }
      }
    }

    // 3. Birthday Logic (15 years restriction)
    const newAge = calculateAge(parseInt(birthYear), parseInt(birthMonth), parseInt(birthDay));
    if (newAge < 15) {
      setErrorMsg('You must be at least 15 years old.');
      return;
    }

    if (onUpdateProfile) {
      const dobFormatted = `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`;
      const updates: Partial<User> = {
        bio: editBio,
        username: editUsername.trim(),
        gender: editGender,
        location: editLocation,
        dob: dobFormatted
      };

      // If name changed, update the timestamp
      if (editUsername !== user.username) {
        updates.lastNameChangeDate = new Date().toISOString();
      }

      onUpdateProfile(updates);
    }
    setIsEditModalOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (file && onUpdateProfile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (type === 'avatar') {
          onUpdateProfile({ avatar: base64String });
        } else {
          onUpdateProfile({ coverUrl: base64String });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = (type: 'avatar' | 'cover') => {
    if (type === 'avatar') {
      profileInputRef.current?.click();
    } else {
      coverInputRef.current?.click();
    }
  };

  const handlePostSubmit = () => {
    if (newPostText.trim() && onPostCreate) {
      onPostCreate(newPostText);
      setNewPostText('');
      setIsPostingModalOpen(false);
    }
  };

  const formattedDob = user.dob ? new Date(user.dob).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) : null;

  const displayCover = user.coverUrl || `https://picsum.photos/seed/cover-${user.id}/1200/400`;

  return (
    <div className="animate-in fade-in duration-300 bg-[#f0f2f5] min-h-screen">
      {/* Hidden File Inputs */}
      <input 
        type="file" 
        ref={profileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={(e) => handleFileChange(e, 'avatar')} 
      />
      <input 
        type="file" 
        ref={coverInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={(e) => handleFileChange(e, 'cover')} 
      />

      {/* Header Section */}
      <div className="bg-white pb-4 shadow-sm">
        <div className="h-44 md:h-64 bg-gray-200 relative group overflow-hidden">
          <img src={displayCover} className="w-full h-full object-cover" alt="cover" />
          {isOwnProfile && (
            <button 
              onClick={() => triggerFileInput('cover')}
              className="absolute bottom-3 right-3 bg-white px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md hover:bg-gray-50 transition-all z-10"
            >
              <i className="fa-solid fa-camera text-[#1b5e20]"></i> <span className="hidden md:inline text-gray-800">Edit Cover Photo</span>
            </button>
          )}
        </div>
        
        <div className="px-4 -mt-12 md:-mt-16 relative flex flex-col md:flex-row items-center md:items-end gap-4 max-w-5xl mx-auto">
          <div className="relative">
            <div className="w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-white overflow-hidden shadow-xl bg-white">
              <img src={user.avatar} className="w-full h-full object-cover" alt={user.username} />
            </div>
            {isOwnProfile && (
              <button 
                onClick={() => triggerFileInput('avatar')}
                className="absolute bottom-2 right-2 bg-gray-200 p-2.5 rounded-full border-2 border-white flex items-center justify-center shadow-lg hover:bg-gray-300 transition-all z-10"
              >
                <i className="fa-solid fa-camera text-[#1b5e20] text-sm"></i>
              </button>
            )}
          </div>
          
          <div className="text-center md:text-left md:pb-3 flex-1 pt-6 md:pt-0">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <h2 className="text-2xl md:text-4xl font-black text-gray-900 leading-tight tracking-tight mt-1">{user.username}</h2>
              {user.isVerified && <i className="fa-solid fa-circle-check text-blue-500 text-xl"></i>}
            </div>
            <p className="text-gray-500 font-bold text-sm md:text-base mt-1 hover:underline cursor-pointer">
              {Math.floor(Math.random() * 2000) + 500} Friends
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 mt-6 flex gap-2 max-w-5xl mx-auto">
          {isOwnProfile ? (
            <>
              <button onClick={() => setIsPostingModalOpen(true)} className="flex-1 bg-[#1b5e20] text-white py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:bg-[#144d18] transition-all active:scale-95">
                <i className="fa-solid fa-plus-circle text-lg"></i> Add to Story
              </button>
              <button onClick={() => setIsEditModalOpen(true)} className="flex-1 bg-gray-200 text-gray-900 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-300 transition-all">
                <i className="fa-solid fa-pen"></i> Edit Profile
              </button>
            </>
          ) : (
            <>
              <button className="flex-1 bg-[#1b5e20] text-white py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:bg-[#144d18] transition-all">
                <i className="fa-solid fa-user-plus"></i> Add Friend
              </button>
              <button className="flex-1 bg-gray-200 text-gray-900 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-300 transition-all">
                <i className="fa-solid fa-message"></i> Message
              </button>
            </>
          )}
          <button className="w-12 bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300 transition-all">
             <i className="fa-solid fa-ellipsis text-lg"></i>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-4 mt-4 px-0 md:px-4">
        {/* Sidebar Info */}
        <div className="w-full md:w-[360px] flex flex-col gap-4">
          <div className="bg-white p-4 shadow-sm md:rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black text-gray-900">Intro</h3>
              {isOwnProfile && <button onClick={() => setIsEditModalOpen(true)} className="text-[#1b5e20] text-xs font-bold hover:underline">Edit</button>}
            </div>
            <div className="space-y-4">
              <div className="text-center text-[15px] text-gray-800 mb-4 px-2 font-medium">{user.bio || 'Living the AddaSangi life! 🇧🇩'}</div>
              <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
                <div className="flex items-center gap-3 text-[14px] text-gray-600">
                  <i className="fa-solid fa-envelope text-gray-400 w-5 text-center text-lg"></i>
                  <span>Email: <span className="font-bold text-gray-900">{user.email || 'Private'}</span></span>
                </div>
                {user.gender && (
                  <div className="flex items-center gap-3 text-[14px] text-gray-600">
                    <i className={`fa-solid ${user.gender === 'Male' ? 'fa-mars' : 'fa-venus'} text-gray-400 w-5 text-center text-lg`}></i>
                    <span>Gender: <span className="font-bold text-gray-900">{user.gender}</span></span>
                  </div>
                )}
                {formattedDob && (
                  <div className="flex items-center gap-3 text-[14px] text-gray-600">
                    <i className="fa-solid fa-cake-candles text-gray-400 w-5 text-center text-lg"></i>
                    <span>Birthday: <span className="font-bold text-gray-900">{formattedDob}</span></span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-[14px] text-gray-600">
                  <i className="fa-solid fa-location-dot text-gray-400 w-5 text-center text-lg"></i>
                  <span>Lives in <span className="font-bold text-gray-900">{user.location || 'Dhaka, Bangladesh'}</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Feed Area */}
        <div className="flex-1 flex flex-col gap-4">
          {isOwnProfile && (
            <div className="bg-white p-4 shadow-sm md:rounded-xl">
              <div className="flex gap-3 mb-3">
                <img src={currentUser.avatar} className="w-10 h-10 rounded-full border shadow-sm" alt="" />
                <button onClick={() => setIsPostingModalOpen(true)} className="flex-1 bg-gray-100 hover:bg-gray-200 transition-colors rounded-full text-left px-4 py-2 text-gray-500 font-medium">
                  What's on your mind, {currentUser.username.split(' ')[0]}?
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div className="bg-white p-4 shadow-sm md:rounded-xl flex justify-between items-center">
              <h3 className="text-xl font-black text-gray-900">Posts</h3>
            </div>
            {posts.length > 0 ? (
              posts.map(post => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  currentUser={currentUser}
                  onLike={(reaction) => onLike?.(post.id, reaction)} 
                  onDelete={() => onPostDelete?.(post.id)}
                />
              ))
            ) : (
              <div className="bg-white p-12 shadow-sm md:rounded-xl text-center text-gray-500 font-bold">No posts yet</div>
            )}
          </div>
        </div>
      </div>
      
      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-[500px] rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <header className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="w-8"></div>
              <h2 className="text-lg font-black text-gray-900">Edit Profile</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </header>
            
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 text-sm font-bold rounded-lg border border-red-200 flex items-center gap-2 animate-in slide-in-from-top-2">
                  <i className="fa-solid fa-circle-exclamation"></i> {errorMsg}
                </div>
              )}

              <section>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-black text-gray-900">Profile Picture</h4>
                  <button onClick={() => triggerFileInput('avatar')} className="text-[#1b5e20] text-sm font-bold hover:underline">Edit</button>
                </div>
                <div className="flex justify-center py-2">
                  <img src={user.avatar} className="w-28 h-28 rounded-full border-2 border-gray-100 object-cover" alt="" />
                </div>
              </section>

              <section>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-black text-gray-900">Cover Photo</h4>
                  <button onClick={() => triggerFileInput('cover')} className="text-[#1b5e20] text-sm font-bold hover:underline">Edit</button>
                </div>
                <div className="h-24 bg-gray-100 rounded-lg overflow-hidden">
                   <img src={displayCover} className="w-full h-full object-cover" alt="" />
                </div>
              </section>

              <section>
                <h4 className="font-black text-gray-900 mb-2">Full Name</h4>
                <input 
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#1b5e20] font-bold"
                  placeholder="Enter your name"
                />
                <p className="text-[10px] text-gray-500 mt-1 font-bold">Note: You can change your name once every 30 days.</p>
              </section>

              <section>
                <h4 className="font-black text-gray-900 mb-2">Bio</h4>
                <textarea 
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#1b5e20] font-medium"
                  rows={2}
                  placeholder="Add a bio..."
                />
              </section>

              <section>
                <h4 className="font-black text-gray-900 mb-2">Location</h4>
                <input 
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#1b5e20]"
                />
              </section>

              <section>
                <h4 className="font-black text-gray-900 mb-2">Birthday</h4>
                <div className="flex gap-2">
                  <select value={birthDay} onChange={(e) => setBirthDay(e.target.value)} className="flex-1 p-2 bg-gray-50 border rounded-lg">
                    {daysInMonth.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)} className="flex-1 p-2 bg-gray-50 border rounded-lg">
                    {months.map((m, i) => <option key={m} value={(i + 1).toString()}>{m}</option>)}
                  </select>
                  <select value={birthYear} onChange={(e) => setBirthYear(e.target.value)} className="flex-1 p-2 bg-gray-50 border rounded-lg">
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </section>

              <section>
                <h4 className="font-black text-gray-900 mb-2">Gender</h4>
                <div className="grid grid-cols-2 gap-3">
                  {['Female', 'Male'].map((g) => (
                    <label key={g} className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer ${editGender === g ? 'border-[#1b5e20] bg-green-50' : 'bg-white'}`}>
                      <input type="radio" checked={editGender === g} onChange={() => setEditGender(g)} className="accent-[#1b5e20]" />
                      <span className="font-bold">{g}</span>
                    </label>
                  ))}
                </div>
              </section>
            </div>

            <footer className="p-4 border-t border-gray-100">
               <button onClick={handleSaveProfile} className="w-full bg-[#1b5e20] text-white py-3 rounded-lg font-black shadow-lg hover:bg-[#144d18] transition-all active:scale-95">
                 Save Changes
               </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
