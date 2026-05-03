
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { motion } from 'motion/react';
import { User } from '../types';

interface SetUsernameProps {
  user: User;
  onComplete: (username: string) => void;
}

const LOGO_URL = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjbaxCAakhVQOly5IhXfPkpbunmcsxREDf2xali0fkLp9gK5qNdh2KL-UhEmDICRaX6_HtDBQTKM6jgtCJuTzrjpKUynSLe6NCzCvRpCs8C6dBgy2wGzEmcV-EIdxh5r73ExANoAyfIufc5JdfXfY1Xal6BSK0fdnqwK0VCkOZTfEdb_GMAiBB-aB9wedf0/s1600/Gemini_Generated_Image_pnxgvipnxgvipnxg.png";

const SetUsername: React.FC<SetUsernameProps> = ({ user, onComplete }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  const checkAvailability = async (val: string) => {
    if (val.length < 3) {
      setIsAvailable(null);
      return;
    }
    try {
      const { data } = await supabase.from('profiles').select('id').eq('username', val.toLowerCase()).maybeSingle();
      setIsAvailable(!data);
    } catch (err) {
      setIsAvailable(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAvailable) return;
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ username: username.toLowerCase() })
        .eq('id', user.id);

      if (updateError) throw updateError;
      onComplete(username.toLowerCase());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e8f5e9] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white/90 backdrop-blur-md w-full max-w-md rounded-2xl shadow-2xl p-8 flex flex-col items-center relative z-10 border border-white"
      >
        <div className="bg-green-50 p-4 rounded-3xl mb-6 shadow-inner">
          <img src={LOGO_URL} className="w-20 h-20" alt="AddaSangi" />
        </div>
        <h1 className="text-3xl font-black mb-2 text-center">
          <span className="text-red-600">Adda</span><span className="text-green-600">Sangi</span>
        </h1>
        <p className="text-gray-500 text-sm mb-8 text-center font-medium px-4">Set your unique ID. Keu apnake search dile ei ID diye khuje pabe.</p>
        
        <form onSubmit={handleSubmit} className="w-full">
          <div className="relative mb-6">
            <input 
              type="text" 
              placeholder="Username (e.g. rahim71)" 
              value={username}
              onChange={(e) => {
                const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
                setUsername(val);
                checkAvailability(val);
              }}
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#1b5e20] transition-all font-bold tracking-wide"
              required
              minLength={3}
              maxLength={20}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {isAvailable === true && <i className="fa-solid fa-circle-check text-green-500 scale-125 animate-bounce"></i>}
              {isAvailable === false && <i className="fa-solid fa-circle-xmark text-red-500 scale-125"></i>}
            </div>
          </div>

          {isAvailable === false && <p className="text-red-500 text-xs mb-4 ml-2 font-bold animate-pulse">Already used! Ar ekta pick korun.</p>}
          {error && <p className="text-red-500 text-xs mb-4 ml-2">{error}</p>}
          
          <button 
            type="submit" 
            disabled={loading || !isAvailable}
            className="w-full bg-[#1b5e20] text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait...' : 'Save & Continue'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default SetUsername;
