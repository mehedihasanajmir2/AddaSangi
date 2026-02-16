
import React from 'react';
import { User } from '../types';

interface SearchResultsProps {
  results: User[];
  query: string;
  onQueryChange: (query: string) => void;
  onUserSelect: (user: User) => void;
  onAddFriend?: (userId: string) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, query, onQueryChange, onUserSelect, onAddFriend }) => {
  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-500 px-4 md:px-0">
      {/* Mobile-friendly Search Input */}
      <div className="bg-white p-4 shadow-sm md:rounded-xl border border-red-50">
        <div className="relative mb-4">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-red-500"></i>
          <input 
            type="text" 
            placeholder="কাকে খুঁজছেন? নাম লিখুন..." 
            className="w-full bg-gray-50 border-2 border-red-50 rounded-2xl py-3 pl-11 pr-4 outline-none text-base font-bold focus:border-red-600 focus:bg-white transition-all shadow-inner"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </div>
        
        <h2 className="text-xl font-black text-gray-900 px-1">
          {query ? (
             <>Searching for "<span className="text-red-600">{query}</span>"</>
          ) : 'People You May Know'}
        </h2>
        <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest px-1">Found {results.length} people</p>
      </div>

      <div className="flex flex-col gap-3">
        {results.map((user) => (
          <div key={user.id} className="bg-white p-4 shadow-sm md:rounded-xl flex flex-col sm:flex-row items-center justify-between border border-transparent hover:border-red-100 transition-all group gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative shrink-0">
                <img 
                  src={user.avatar} 
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-4 border-white shadow-md cursor-pointer" 
                  onClick={() => onUserSelect(user)} 
                  alt={user.username} 
                />
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="text-lg font-black text-gray-900 truncate flex items-center gap-1">
                  {user.username}
                  {user.isVerified && <i className="fa-solid fa-circle-check text-blue-500 text-xs"></i>}
                </h3>
                <p className="text-sm text-gray-500 font-medium line-clamp-1">{user.bio || 'AddaSangi Member'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] font-black uppercase text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100 tracking-wider">
                    {user.location || 'Bangladesh'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-row sm:flex-col lg:flex-row gap-2 w-full sm:w-auto">
              <button 
                onClick={() => onAddFriend?.(user.id)}
                className="flex-1 sm:w-32 bg-[#1b5e20] text-white px-4 py-2.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 hover:bg-[#144d18] transition-all shadow-md active:scale-95"
              >
                <i className="fa-solid fa-user-plus"></i> Add
              </button>
              <button 
                onClick={() => onUserSelect(user)}
                className="flex-1 sm:w-32 bg-gray-100 text-gray-900 px-4 py-2.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 hover:bg-gray-200 transition-all shadow-sm active:scale-95"
              >
                <i className="fa-solid fa-message text-red-600"></i> Chat
              </button>
            </div>
          </div>
        ))}
        {results.length === 0 && query && (
          <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-user-slash text-3xl text-gray-200"></i>
            </div>
            <h3 className="text-lg font-black text-gray-400">কেউ পাওয়া যায়নি!</h3>
            <p className="text-xs text-gray-400 font-bold mt-1">অন্য কোনো নামে চেষ্টা করে দেখুন।</p>
          </div>
        )}
        {results.length === 0 && !query && (
          <div className="text-center py-20">
             <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <i className="fa-solid fa-users-viewfinder text-4xl text-red-200"></i>
             </div>
             <p className="font-black text-gray-400">আপনার বন্ধুদের খুঁজে বের করুন!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
