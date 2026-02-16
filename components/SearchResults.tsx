
import React from 'react';
import { User } from '../types';

interface SearchResultsProps {
  results: User[];
  query: string;
  onUserSelect: (user: User) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, query, onUserSelect }) => {
  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-500 px-4 md:px-0">
      <div className="bg-white p-4 shadow-sm md:rounded-xl">
        <h2 className="text-xl font-bold text-gray-900">
          {query ? `Search results for "${query}"` : 'Friends you may know'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">Found {results.length} friends</p>
      </div>

      <div className="flex flex-col gap-2">
        {results.length > 0 ? (
          results.map((user) => (
            <div 
              key={user.id} 
              className="bg-white p-4 shadow-sm md:rounded-xl flex items-center justify-between hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="relative cursor-pointer" onClick={() => onUserSelect(user)}>
                  <img 
                    src={user.avatar} 
                    className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-white shadow-sm hover:opacity-90" 
                    alt={user.username} 
                  />
                  <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <h3 
                      className="text-lg font-bold text-gray-900 group-hover:underline cursor-pointer"
                      onClick={() => onUserSelect(user)}
                    >
                      {user.username}
                    </h3>
                    {user.isVerified && <i className="fa-solid fa-circle-check text-blue-500 text-xs"></i>}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-1">{user.bio}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="flex -space-x-1">
                      {[1, 2, 3].map(i => (
                        <img 
                          key={i} 
                          src={`https://picsum.photos/seed/mutual-${user.id}-${i}/50`} 
                          className="w-5 h-5 rounded-full border border-white" 
                          alt="mutual" 
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 ml-1">12 mutual friends</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button className="bg-[#1b5e20] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#144d18] transition-colors shadow-sm">
                  <i className="fa-solid fa-user-plus"></i> Add Friend
                </button>
                <button className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-300 transition-colors">
                  <i className="fa-solid fa-message"></i> Message
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-12 shadow-sm md:rounded-xl text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <i className="fa-solid fa-magnifying-glass text-3xl text-gray-300"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900">No results found</h3>
            <p className="text-gray-500 mt-2">Try searching for a different name or checking your spelling.</p>
            <button className="mt-6 text-[#b71c1c] font-bold hover:underline">
              View friends you may know instead
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
