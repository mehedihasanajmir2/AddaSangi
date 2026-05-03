
import React, { useState } from 'react';
import { getSupabase } from '../services/supabaseClient';

const LOGO_URL = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjbaxCAakhVQOly5IhXfPkpbunmcsxREDf2xali0fkLp9gK5qNdh2KL-UhEmDICRaX6_HtDBQTKM6jgtCJuTzrjpKUynSLe6NCzCvRpCs8C6dBgy2wGzEmcV-EIdxh5r73ExANoAyfIufc5JdfXfY1Xal6BSK0fdnqwK0VCkOZTfEdb_GMAiBB-aB9wedf0/s1600/Gemini_Generated_Image_pnxgvipnxgvipnxg.png";

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await getSupabase().auth.signInWithPassword({ email, password });
      if (error) throw error;
      onLogin();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await getSupabase().auth.signInWithOAuth({ provider: 'google' });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Google login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e8f5e9] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-8 flex flex-col items-center">
        <img src={LOGO_URL} className="w-24 h-24 mb-6" alt="AddaSangi" />
        <h1 className="text-3xl font-black text-[#1b5e20] mb-2">আড্ডাসঙ্গী</h1>
        <p className="text-gray-500 text-sm mb-8 font-medium">বাংলাদেশের আড্ডার আসল মঞ্চ</p>
        
        {error && (
          <div className="w-full mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="w-full space-y-4">
          <div>
            <input 
              type="email" 
              placeholder="Email Address" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#1b5e20] transition-colors"
              required
            />
          </div>
          <div>
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#1b5e20] transition-colors"
              required
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[#1b5e20] text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Please wait...' : 'Login Now'}
          </button>
        </form>

        <div className="w-full flex items-center gap-4 my-8">
          <div className="flex-1 h-[1px] bg-gray-100"></div>
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">or</span>
          <div className="flex-1 h-[1px] bg-gray-100"></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white border border-gray-200 text-gray-700 py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="" />
          Continue with Google
        </button>

        <p className="mt-8 text-xs text-gray-400 text-center">
          By signing up, you agree to our <span className="font-bold text-[#1b5e20]">Terms of Service</span> and <span className="font-bold text-[#1b5e20]">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
};

export default Login;
