
import React from 'react';
import { User } from '../types';

interface SearchResultsProps {
  results: User[];
  query: string;
  onQueryChange: (query: string) => void;
  onUserSelect: (user: User) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, query, onQueryChange, onUserSelect }) => {
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-100 bg-gray-50/50">
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input 
            type="text" 
            placeholder="আড্ডাসঙ্গীদের খুঁজুন..."
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
            <h3 className="text-gray-400 font-bold mb-2">Search for new friends</h3>
            <p className="text-gray-300 text-xs">Type a name to start searching on AddaSangi</p>
          </div>
        )}

        {query && results.length === 0 && (
          <div className="p-10 text-center">
            <p className="text-gray-400 font-medium">No results found for "{query}"</p>
          </div>
        )}

        <div className="divide-y divide-gray-50">
          {results.map(user => (
            <button 
              key={user.id}
              onClick={() => onUserSelect(user)}
              className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
            >
              <img src={user.avatar} className="w-14 h-14 rounded-full object-cover border border-gray-100" alt="" />
              <div className="text-left flex-1">
                <h4 className="font-bold text-gray-900">{user.full_name}</h4>
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">@{user.username}</span>
                </div>
                <p className="text-xs text-gray-500 truncate max-w-[200px]">{user.bio || 'AddaSangi Member'}</p>
              </div>
              <i className="fa-solid fa-plus text-[#1b5e20] bg-green-50 w-8 h-8 rounded-full flex items-center justify-center"></i>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
