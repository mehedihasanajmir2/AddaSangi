
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
      <div className="bg-white p-4 shadow-sm md:rounded-xl border border-red-50">
        <h2 className="text-xl font-black text-gray-900">
          {query ? (
             <>Searching for "<span className="text-red-600">{query}</span>"</>
          ) : 'People You May Know'}
        </h2>
        <p className="text-sm text-gray-500 font-bold mt-1">Found {results.length} people matching your request</p>
      </div>

      <div className="flex flex-col gap-3">
        {results.length > 0 ? (
          results.map((user) => (
            <div 
              key={user.id} 
              className="bg-white p-4 shadow-sm md:rounded-xl flex flex-col sm:flex-row items-center justify-between hover:border-red-100 border border-transparent transition-all group gap-4"
            >
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="relative cursor-pointer shrink-0" onClick={() => onUserSelect(user)}>
                  <img 
                    src={user.avatar} 
                    className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-4 border-gray-50 shadow-md group-hover:scale-105 transition-transform" 
                    alt={user.username} 
                  />
                  <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-4 border-white"></div>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1">
                    <h3 
                      className="text-lg font-black text-gray-900 group-hover:text-red-600 cursor-pointer truncate"
                      onClick={() => onUserSelect(user)}
                    >
                      {user.username}
                    </h3>
                    {user.isVerified && <i className="fa-solid fa-circle-check text-blue-500 text-xs"></i>}
                  </div>
                  <p className="text-sm text-gray-500 font-medium line-clamp-1">{user.bio || 'AddaSangi Member'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-black uppercase text-gray-400 bg-gray-50 px-2 py-0.5 rounded border tracking-wider">
                      {user.location || 'Dhaka'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-row sm:flex-col lg:flex-row gap-2 w-full sm:w-auto">
                <button className="flex-1 sm:w-32 bg-[#1b5e20] text-white px-4 py-2.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 hover:bg-[#144d18] transition-all shadow-md active:scale-95">
                  <i className="fa-solid fa-user-plus"></i> Add
                </button>
                <button 
                  onClick={() => onUserSelect(user)}
                  className="flex-1 sm:w-32 bg-gray-100 text-gray-900 px-4 py-2.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 hover:bg-gray-200 transition-all active:scale-95"
                >
                  <i className="fa-solid fa-message text-red-600"></i> Chat
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-16 shadow-sm md:rounded-xl text-center flex flex-col items-center border border-dashed border-gray-200">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
              <i className="fa-solid fa-user-slash text-4xl text-red-200"></i>
            </div>
            <h3 className="text-2xl font-black text-gray-900">No Sangis Found</h3>
            <p className="text-gray-500 mt-2 font-medium max-w-xs mx-auto">We couldn't find anyone with that name. Try searching by their full name or email address.</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-8 bg-gray-900 text-white px-8 py-3 rounded-full font-black hover:bg-black transition-all shadow-lg"
            >
              Refresh Results
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
