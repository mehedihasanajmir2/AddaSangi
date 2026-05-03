
import React from 'react';
import { User } from '../types';

interface SearchResultsProps {
  results: User[];
  query: string;
  onQueryChange: (query: string) => void;
  onUserSelect: (user: User) => void;
  onViewProfile?: (user: User) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, query, onQueryChange, onUserSelect, onViewProfile }) => {
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-100 bg-gray-50/50">
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input 
            type="text" 
            placeholder="Search by name or @username..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#1b5e20] transition-colors shadow-sm"
            autoFocus
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!query && (
          <div className="p-10 text-center flex flex-col items-center">
            <i className="fa-solid fa-users text-5xl text-gray-100 mb-4"></i>
            <h3 className="text-gray-400 font-bold mb-2">Find your friends</h3>
            <p className="text-gray-300 text-xs">Search using their full name or unique username</p>
          </div>
        )}

        {query && results.length === 0 && (
          <div className="p-10 text-center">
            <p className="text-gray-400 font-medium">No results found for "{query}"</p>
          </div>
        )}

        <div className="divide-y divide-gray-50">
          {results.map(user => (
            <div 
              key={user.id}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
              onClick={() => onViewProfile?.(user)}
            >
              <div className="flex items-center gap-4">
                <img src={user.avatar} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" alt="" />
                <div className="text-left">
                  <h4 className="font-bold text-gray-900 group-hover:text-[#1b5e20] transition-colors">{user.full_name}</h4>
                  <p className="text-xs text-green-600 font-bold">@{user.username || 'user'}</p>
                  <p className="text-[10px] text-gray-400 truncate max-w-[150px]">{user.bio || 'AddaSangi Member'}</p>
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onUserSelect(user);
                }}
                className="bg-[#1b5e20] text-white px-4 py-2 rounded-xl text-xs font-black shadow-sm active:scale-95 transition-all"
              >
                MESSAGE
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
