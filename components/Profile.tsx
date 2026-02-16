
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
    if (!editUsername.trim()) {
      setErrorMsg('Name cannot be empty.');
      return;
    }

    const newAge = calculateAge(parseInt(birthYear), parseInt(birthMonth), parseInt(birthDay));
    if (newAge < 15) {
      setErrorMsg('You must be at least 15 years old.');
      return;
    }

    if (onUpdateProfile) {
      const dobFormatted = `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`;
      onUpdateProfile({
        bio: editBio,
        username: editUsername.trim(),
        gender: editGender,
        location: editLocation,
        dob: dobFormatted
      });
    }
    setIsEditModalOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (file && onUpdateProfile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (type === 'avatar') onUpdateProfile({ avatar: base64String });
        else onUpdateProfile({ coverUrl: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = (type: 'avatar' | 'cover') => {
    if (type === 'avatar') profileInputRef.current?.click();
    else coverInputRef.current?.click();
  };

  const formattedDob = user.dob ? new Date(user.dob).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) : null;

  const displayCover = user.coverUrl || `https://picsum.photos/seed/cover-${user.id}/1200/400`;

  return (
    <div className="animate-in fade-in duration-300 bg-[#f0f2f5] min-h-screen pb-20">
      <input type="file" ref={profileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} />
      <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'cover')} />

      {/* Profile Header */}
      <div className="bg-white pb-4 shadow-sm">
        <div className="h-44 md:h-80 bg-gray-200 relative overflow-hidden">
          <img src={displayCover} className="w-full h-full object-cover" alt="cover" />
          {isOwnProfile && (
            <button onClick={() => triggerFileInput('cover')} className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg border border-gray-200 hover:bg-white transition-all">
              <i className="fa-solid fa-camera text-red-600"></i> Edit Cover
            </button>
          )}
        </div>
        
        <div className="px-4 -mt-16 md:-mt-24 relative flex flex-col items-center md:flex-row md:items-end gap-4 max-w-5xl mx-auto">
          <div className="relative">
            <div className="w-36 h-36 md:w-48 md:h-48 rounded-full border-4 border-white overflow-hidden shadow-2xl bg-white">
              <img src={user.avatar} className="w-full h-full object-cover" alt={user.username} />
            </div>
            {isOwnProfile && (
              <button onClick={() => triggerFileInput('avatar')} className="absolute bottom-2 right-2 bg-gray-100 p-3 rounded-full border-2 border-white shadow-lg hover:bg-gray-200 text-red-600 transition-all">
                <i className="fa-solid fa-camera text-sm"></i>
              </button>
            )}
          </div>
          
          <div className="text-center md:text-left md:pb-6 flex-1 pt-4">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter">{user.username}</h2>
              <i className="fa-solid fa-circle-check text-blue-500 text-xl"></i>
            </div>
            <p className="text-gray-500 font-bold text-sm mt-1">{posts.length} Posts · {Math.floor(Math.random() * 200) + 50} Sangi</p>
          </div>
        </div>

        <div className="px-4 mt-6 flex gap-2 max-w-5xl mx-auto">
          {isOwnProfile ? (
            <>
              <button onClick={() => setIsPostingModalOpen(true)} className="flex-1 bg-[#b71c1c] text-white py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:bg-[#a01818] transition-all">
                <i className="fa-solid fa-plus-circle"></i> Add Story
              </button>
              <button onClick={() => setIsEditModalOpen(true)} className="flex-1 bg-gray-100 text-gray-800 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all border">
                <i className="fa-solid fa-pen"></i> Edit Profile
              </button>
            </>
          ) : (
            <button className="flex-1 bg-[#1b5e20] text-white py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-md">
              <i className="fa-solid fa-user-plus"></i> Add Sangi
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-4 mt-4 px-2 md:px-4">
        {/* Intro Section */}
        <div className="w-full md:w-[360px] flex flex-col gap-4">
          <div className="bg-white p-4 shadow-sm rounded-xl border border-gray-100">
            <h3 className="text-xl font-black text-gray-900 mb-4">Intro</h3>
            <div className="space-y-4">
              <div className="text-center text-[15px] text-gray-700 font-medium py-2">
                {user.bio ? user.bio : (isOwnProfile ? <span className="text-gray-400 italic">Add a short bio to tell sangis about yourself</span> : 'No bio yet')}
              </div>
              
              <div className="border-t pt-4 flex flex-col gap-4">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <i className="fa-solid fa-cake-candles w-5 text-center text-red-600/70"></i>
                  <span>Birthday: <span className="font-bold text-gray-900">{formattedDob || (isOwnProfile ? 'Not set' : 'Private')}</span></span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <i className="fa-solid fa-location-dot w-5 text-center text-red-600/70"></i>
                  <span>Lives in <span className="font-bold text-gray-900">{user.location || (isOwnProfile ? 'Add location' : 'Dhaka, Bangladesh')}</span></span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <i className="fa-solid fa-envelope w-5 text-center text-red-600/70"></i>
                  <span className="truncate">Email: <span className="font-bold text-gray-900">{user.email || 'Private'}</span></span>
                </div>
                {user.gender && (
                   <div className="flex items-center gap-3 text-sm text-gray-600">
                     <i className={`fa-solid ${user.gender === 'Male' ? 'fa-mars' : 'fa-venus'} w-5 text-center text-red-600/70`}></i>
                     <span>Gender: <span className="font-bold text-gray-900">{user.gender}</span></span>
                   </div>
                )}
              </div>
              
              {isOwnProfile && (
                <button onClick={() => setIsEditModalOpen(true)} className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-bold border transition-colors mt-2">
                  Edit Details
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Posts Area */}
        <div className="flex-1 flex flex-col gap-4">
          {isOwnProfile && (
            <div className="bg-white p-4 shadow-sm rounded-xl border border-gray-100">
              <div className="flex gap-3">
                <img src={currentUser.avatar} className="w-10 h-10 rounded-full border" alt="" />
                <button onClick={() => setIsPostingModalOpen(true)} className="flex-1 bg-gray-100 hover:bg-gray-200 transition-colors rounded-full text-left px-4 py-2 text-gray-500 text-sm font-medium">
                  Write something on your profile...
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div className="bg-white p-4 shadow-sm rounded-xl border border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-black text-gray-900">Your Addas</h3>
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
              <div className="bg-white p-12 shadow-sm rounded-xl text-center text-gray-400 font-bold border border-dashed">
                You haven't shared anything yet.
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-[500px] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <header className="p-4 border-b flex items-center justify-between bg-gray-50">
              <h2 className="text-lg font-black text-gray-900">Edit Profile</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-gray-500 shadow-sm">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </header>
            
            <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
              {errorMsg && <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100">{errorMsg}</div>}
              
              <section>
                <h4 className="font-black text-gray-900 mb-2 text-sm uppercase tracking-wider">Full Name</h4>
                <input type="text" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:border-red-500 font-bold" />
              </section>

              <section>
                <h4 className="font-black text-gray-900 mb-2 text-sm uppercase tracking-wider">Bio</h4>
                <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:border-red-500 font-medium" rows={3} placeholder="Tell us about yourself..." />
              </section>

              <section>
                <h4 className="font-black text-gray-900 mb-2 text-sm uppercase tracking-wider">Location</h4>
                <input type="text" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:border-red-500" />
              </section>

              <section>
                <h4 className="font-black text-gray-900 mb-2 text-sm uppercase tracking-wider">Birthday</h4>
                <div className="flex gap-2">
                  <select value={birthDay} onChange={(e) => setBirthDay(e.target.value)} className="flex-1 p-3 bg-gray-50 border rounded-xl">
                    {daysInMonth.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)} className="flex-1 p-3 bg-gray-50 border rounded-xl">
                    {months.map((m, i) => <option key={m} value={(i + 1).toString()}>{m}</option>)}
                  </select>
                  <select value={birthYear} onChange={(e) => setBirthYear(e.target.value)} className="flex-1 p-3 bg-gray-50 border rounded-xl">
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </section>

              <section>
                <h4 className="font-black text-gray-900 mb-2 text-sm uppercase tracking-wider">Gender</h4>
                <div className="grid grid-cols-2 gap-3">
                  {['Female', 'Male'].map((g) => (
                    <label key={g} className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer ${editGender === g ? 'border-red-500 bg-red-50' : 'bg-gray-50'}`}>
                      <input type="radio" checked={editGender === g} onChange={() => setEditGender(g)} className="accent-red-600" />
                      <span className="font-bold text-sm">{g}</span>
                    </label>
                  ))}
                </div>
              </section>
            </div>

            <footer className="p-4 border-t bg-gray-50">
              <button onClick={handleSaveProfile} className="w-full bg-[#b71c1c] text-white py-3.5 rounded-xl font-black shadow-lg hover:bg-[#a01818] transition-all">
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
