
import React from 'react';
import { User } from '../types';

interface SearchResultsProps {
  results: User[];
  query: string;
  onUserSelect: (user: User) => void;
  onAddFriend?: (userId: string) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, query, onUserSelect, onAddFriend }) => {
  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-500 px-4 md:px-0">
      <div className="bg-white p-4 shadow-sm md:rounded-xl border border-red-50">
        <h2 className="text-xl font-black text-gray-900">
          {query ? (
             <>Searching for "<span className="text-red-600">{query}</span>"</>
          ) : 'People You May Know'}
        </h2>
        <p className="text-sm text-gray-500 font-bold mt-1">Found {results.length} people</p>
      </div>

      <div className="flex flex-col gap-3">
        {results.map((user) => (
          <div key={user.id} className="bg-white p-4 shadow-sm md:rounded-xl flex flex-col sm:flex-row items-center justify-between border border-transparent hover:border-red-100 transition-all group gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <img 
                src={user.avatar} 
                className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-4 border-gray-50 shadow-md cursor-pointer" 
                onClick={() => onUserSelect(user)} 
                alt={user.username} 
              />
              <div className="flex flex-col min-w-0">
                <h3 className="text-lg font-black text-gray-900 truncate">{user.username}</h3>
                <p className="text-sm text-gray-500 font-medium line-clamp-1">{user.bio || 'AddaSangi Member'}</p>
                <span className="text-[10px] font-black uppercase text-gray-400 bg-gray-50 px-2 py-0.5 rounded border tracking-wider w-fit mt-1">
                  {user.location || 'Bangladesh'}
                </span>
              </div>
            </div>

            <div className="flex flex-row sm:flex-col lg:flex-row gap-2 w-full sm:w-auto">
              <button 
                onClick={() => onAddFriend?.(user.id)}
                className="flex-1 sm:w-32 bg-[#1b5e20] text-white px-4 py-2.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 hover:bg-[#144d18] transition-all"
              >
                <i className="fa-solid fa-user-plus"></i> Add
              </button>
              <button 
                onClick={() => onUserSelect(user)}
                className="flex-1 sm:w-32 bg-gray-100 text-gray-900 px-4 py-2.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
              >
                <i className="fa-solid fa-message text-red-600"></i> Chat
              </button>
            </div>
          </div>
        ))}
        {results.length === 0 && query && (
          <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed">
            <i className="fa-solid fa-user-slash text-4xl text-gray-200 mb-4"></i>
            <h3 className="text-xl font-bold">No results found</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
