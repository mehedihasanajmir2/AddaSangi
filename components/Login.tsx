import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';

interface AuthProps {
  onLogin: () => void;
}

const LOGO_URL = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjbaxCAakhVQOly5IhXfPkpbunmcsxREDf2xali0fkLp9gK5qNdh2KL-UhEmDICRaX6_HtDBQTKM6jgtCJuTzrjpKUynSLe6NCzCvRpCs8C6dBgy2wGzEmcV-EIdxh5r73ExANoAyfIufc5JdfXfY1Xal6BSK0fdnqwK0VCkOZTfEdb_GMAiBB-aB9wedf0/s1600/Gemini_Generated_Image_pnxgvipnxgvipnxg.png";

const SYMBOLS = ['ক', 'খ', 'গ', 'ঘ', 'আ', 'এ', 'ও', '🇧🇩', '✊', '⭐'];
const COLORS = ['#b71c1c', '#1b5e20'];

const FallingBackground: React.FC = () => {
  const particles = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      left: Math.random() * 100,
      duration: 5 + Math.random() * 10,
      delay: Math.random() * 5,
      size: 14 + Math.random() * 20,
      opacity: 0.1 + Math.random() * 0.4,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <style>{`
        @keyframes fall {
          0% { transform: translateY(-10vh) rotate(0deg); }
          100% { transform: translateY(110vh) rotate(360deg); }
        }
      `}</style>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute font-black select-none"
          style={{
            left: `${p.left}%`,
            color: p.color,
            fontSize: `${p.size}px`,
            opacity: p.opacity,
            animation: `fall ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
            top: '-10%',
          }}
        >
          {p.symbol}
        </div>
      ))}
    </div>
  );
};

const Login: React.FC<AuthProps> = ({ onLogin }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  const [birthDay, setBirthDay] = useState('1');
  const [birthMonth, setBirthMonth] = useState('1'); 
  const [birthYear, setBirthYear] = useState('2000');
  const [gender, setGender] = useState('');

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { 
      setErrorMsg(error.message); 
      setIsLoading(false); 
    } 
    else { onLogin(); }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg('দয়া করে আপনার পুরো নাম লিখুন।');
      setIsLoading(false);
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const dobFormatted = `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`;
    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: fullName,
          dob: dobFormatted,
          gender: gender
        }
      }
    });

    if (signUpError) { 
      if (signUpError.message.toLowerCase().includes('rate limit')) {
        setErrorMsg('সুপাবেস সিকিউরিটি এলার্ট: খুব বেশি বার সাইন-আপ করার চেষ্টা করা হয়েছে। এটি ঠিক করতে আপনার Supabase Dashboard > Authentication > Rate Limits থেকে লিমিট বাড়িয়ে দিন। অথবা ৫ মিনিট পর আবার চেষ্টা করুন।');
      } else {
        setErrorMsg(signUpError.message); 
      }
      setIsLoading(false); 
      return;
    } 

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        email: cleanEmail,
        avatar_url: `https://picsum.photos/seed/${data.user.id}/200`,
        cover_url: `https://picsum.photos/seed/cover-${data.user.id}/1200/400`,
        dob: dobFormatted,
        gender: gender,
        bio: "Hey there! I'm using AddaSangi."
      });
    }

    setErrorMsg('সফল হয়েছে! এখন লগইন করুন।'); 
    setIsSignup(false);
    setIsLoading(false);
  };

  const inputClasses = "w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:border-[#b71c1c] focus:ring-1 focus:ring-red-100 placeholder-gray-400 transition-all font-medium";
  const selectClasses = "flex-1 px-2 py-2.5 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:border-[#b71c1c] text-sm font-medium transition-all appearance-none cursor-pointer";

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col items-center justify-center p-4 font-sans antialiased text-gray-900 relative">
      <FallingBackground />

      <div className="w-full max-w-[420px] flex flex-col items-center relative z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-4 p-2 ring-4 ring-[#1b5e20]/10">
            <img src={LOGO_URL} alt="AddaSangi" className="w-full h-full object-contain rounded-xl" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter mb-2">
            <span className="text-[#b71c1c]">Adda</span>
            <span className="text-[#1b5e20]">Sangi</span>
          </h1>
          <p className="text-gray-500 font-bold">আড্ডাসঙ্গী - আপনার নিজস্ব কমিউনিটি</p>
        </div>

        <div className="w-full bg-white rounded-2xl shadow-2xl p-6 border border-gray-100">
          {errorMsg && (
            <div className={`p-4 rounded-xl mb-6 text-xs font-bold border flex items-start gap-3 ${errorMsg.includes('সফল') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              <i className={`fa-solid mt-1 ${errorMsg.includes('সফল') ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
              <span className="flex-1">{errorMsg}</span>
            </div>
          )}

          {!isSignup ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <input type="email" placeholder="ইমেইল অ্যাড্রেস" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClasses} required />
              <input type="password" placeholder="পাসওয়ার্ড" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClasses} required />
              <button type="submit" disabled={isLoading} className="w-full bg-[#b71c1c] text-white py-3.5 rounded-xl font-black text-xl transition-all shadow-lg active:scale-[0.98] disabled:opacity-70 hover:bg-[#a01818]">
                {isLoading ? 'অপেক্ষা করুন...' : 'লগইন করুন'}
              </button>
              <div className="border-t border-gray-100 my-4"></div>
              <button type="button" onClick={() => { setIsSignup(true); setErrorMsg(''); }} className="bg-[#1b5e20] hover:bg-[#144d18] text-white py-3 px-8 rounded-xl font-bold text-lg mx-auto">
                নতুন অ্যাকাউন্ট খুলুন
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="নামের প্রথম অংশ" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClasses} required />
                <input type="text" placeholder="নামের শেষ অংশ" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClasses} required />
              </div>
              <input type="email" placeholder="ইমেইল" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClasses} required />
              <input type="password" placeholder="নতুন পাসওয়ার্ড" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClasses} required />
              
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">জন্ম তারিখ</label>
                <div className="flex gap-2">
                  <select value={birthDay} onChange={(e) => setBirthDay(e.target.value)} className={selectClasses}>
                    {daysInMonth.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)} className={selectClasses}>
                    {months.map((m, i) => <option key={m} value={(i + 1).toString()}>{m}</option>)}
                  </select>
                  <select value={birthYear} onChange={(e) => setBirthYear(e.target.value)} className={selectClasses}>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {['Female', 'Male'].map((g) => (
                  <label key={g} className={`flex items-center justify-center p-3 border rounded-xl cursor-pointer font-bold ${gender === g ? 'bg-red-50 border-red-200 text-red-600' : 'bg-gray-50 border-gray-100'}`}>
                    <input type="radio" name="gender" value={g} checked={gender === g} onChange={(e) => setGender(e.target.value)} className="hidden" />
                    {g === 'Male' ? 'পুরুষ' : 'মহিলা'}
                  </label>
                ))}
              </div>
              
              <button type="submit" disabled={isLoading} className="w-full bg-[#1b5e20] text-white py-3.5 rounded-xl font-black text-xl mt-2 shadow-lg hover:bg-[#144d18] transition-colors">
                {isLoading ? 'প্রসেসিং হচ্ছে...' : 'রেজিস্ট্রেশন করুন'}
              </button>
              
              <button type="button" onClick={() => { setIsSignup(false); setErrorMsg(''); }} className="text-[#b71c1c] font-bold text-sm text-center mt-2">
                আগে থেকেই অ্যাকাউন্ট আছে? লগইন করুন
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;