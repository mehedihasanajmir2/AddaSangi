
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
      <div className="absolute bottom-0 left-0 right-0 h-32 opacity-10 flex justify-around items-end overflow-hidden">
        <div className="text-8xl text-[#1b5e20] transform translate-y-4"><i className="fa-solid fa-monument"></i></div>
        <div className="text-9xl text-[#b71c1c] transform translate-y-8"><i className="fa-solid fa-place-of-worship"></i></div>
        <div className="text-8xl text-[#1b5e20] transform translate-y-4"><i className="fa-solid fa-monument"></i></div>
      </div>
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

  useEffect(() => {
    if (parseInt(birthDay) > daysInMonth.length) {
      setBirthDay(daysInMonth.length.toString());
    }
  }, [daysInMonth]);

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

  const calculateAge = (year: number, month: number, day: number) => {
    const today = new Date();
    let age = today.getFullYear() - year;
    const m = today.getMonth() + 1 - month;
    if (m < 0 || (m === 0 && today.getDate() < day)) {
      age--;
    }
    return age;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    
    // 1. Basic Field Validations
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg('Please enter your first and last name.');
      setIsLoading(false);
      return;
    }

    if (password.length < 7) {
      setErrorMsg('Password must be at least 7 characters long.');
      setIsLoading(false);
      return;
    }

    const age = calculateAge(parseInt(birthYear), parseInt(birthMonth), parseInt(birthDay));
    if (age < 15) {
      setErrorMsg('You must be at least 15 years old to create an account.');
      setIsLoading(false);
      return;
    }

    if (!gender) {
      setErrorMsg('Please select your gender.');
      setIsLoading(false);
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // 2. Strict Uniqueness Check (Query profiles table first)
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingProfile) {
      setErrorMsg('This email is already registered. Please use another one.');
      setIsLoading(false);
      return;
    }

    const dobFormatted = `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`;

    // 3. Supabase Sign Up
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: `${firstName.trim()} ${lastName.trim()}`,
          dob: dobFormatted,
          gender: gender,
          email: cleanEmail
        }
      }
    });

    if (signUpError) { 
      setErrorMsg(signUpError.message); 
      setIsLoading(false); 
      return;
    } 

    // 4. Secondary Check: Identities array
    if (data?.user && data.user.identities && data.user.identities.length === 0) {
      setErrorMsg('This email is already registered. Please use a different email or log in.');
      setIsLoading(false);
      return;
    }

    // Success
    setErrorMsg('Success! Check your email for the confirmation link.'); 
    setIsLoading(false);
  };

  const inputClasses = "w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-md outline-none focus:border-[#b71c1c] focus:ring-1 focus:ring-[#b71c1c] placeholder-gray-500 transition-all font-medium";
  const selectClasses = "flex-1 px-2 py-2.5 bg-white text-gray-900 border border-gray-300 rounded-md outline-none focus:border-[#b71c1c] text-sm font-medium transition-all appearance-none cursor-pointer";

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col items-center justify-center p-4 font-sans antialiased text-gray-900 relative">
      <FallingBackground />

      <div className="w-full max-w-[420px] flex flex-col items-center relative z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-4 p-2 ring-4 ring-[#1b5e20]/10">
            <img src={LOGO_URL} alt="AddaSangi" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2 drop-shadow-sm">
            <span className="text-[#b71c1c]">Adda</span>
            <span className="text-[#1b5e20]">Sangi</span>
          </h1>
        </div>

        <div className="w-full bg-white/95 backdrop-blur-md rounded-xl shadow-2xl p-6 border border-gray-100 ring-1 ring-black/5">
          {errorMsg && (
            <div className={`p-4 rounded-lg mb-6 text-sm font-bold border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${errorMsg.includes('Success') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              <i className={`fa-solid ${errorMsg.includes('Success') ? 'fa-circle-check text-lg' : 'fa-circle-exclamation text-lg'}`}></i>
              <span className="flex-1">{errorMsg}</span>
            </div>
          )}

          {!isSignup ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="text-center mb-2">
                <h2 className="text-2xl font-black tracking-tight">
                  <span className="text-[#b71c1c]">Welcome</span> <span className="text-[#1b5e20]">Back</span>
                </h2>
              </div>
              <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClasses} required />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClasses} required />
              <button type="submit" disabled={isLoading} className="w-full bg-[#b71c1c] text-white py-3.5 rounded-md font-bold text-xl transition-all shadow-md active:scale-[0.98] disabled:opacity-70 hover:bg-[#a01818]">
                {isLoading ? 'Logging In...' : 'Log In'}
              </button>
              <div className="border-t border-gray-200 my-4"></div>
              <button type="button" onClick={() => { setIsSignup(true); setErrorMsg(''); }} className="bg-[#1b5e20] hover:bg-[#144d18] text-white py-3 px-8 rounded-md font-bold text-lg mx-auto transition-colors">
                Create New Account
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="flex flex-col gap-4">
              <div className="text-center mb-2">
                <h2 className="text-2xl font-black tracking-tight">
                  <span className="text-[#b71c1c]">Create</span> <span className="text-[#1b5e20]">Account</span>
                </h2>
              </div>
              
              {/* Name boxes at the TOP */}
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClasses} required />
                <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClasses} required />
              </div>

              <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClasses} required />
              
              <div className="flex flex-col gap-1">
                <input type="password" placeholder="New Password (min 7 chars)" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClasses} required />
              </div>

              {/* Birthday Selection */}
              <div className="mt-1">
                <label className="text-[11px] font-black text-gray-500 mb-1.5 block uppercase tracking-widest">Birthday (Minimum 15 years)</label>
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

              {/* Gender Selection */}
              <div className="mt-1">
                <label className="text-[11px] font-black text-gray-500 mb-1.5 block uppercase tracking-widest">Gender</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Female', 'Male'].map((g) => (
                    <label key={g} className={`flex items-center justify-between px-4 py-3 border rounded-md cursor-pointer transition-all ${gender === g ? 'border-[#1b5e20] bg-green-50 ring-1 ring-[#1b5e20]' : 'border-gray-300 bg-white hover:bg-gray-50'}`}>
                      <span className="text-sm font-bold text-gray-800">{g}</span>
                      <input type="radio" name="gender" value={g} checked={gender === g} onChange={(e) => setGender(e.target.value)} className="accent-[#1b5e20] w-4 h-4" />
                    </label>
                  ))}
                </div>
              </div>
              
              <button type="submit" disabled={isLoading} className="w-full bg-[#1b5e20] text-white py-3.5 rounded-md font-bold text-xl mt-2 shadow-lg disabled:opacity-70 transition-all active:scale-[0.98] hover:bg-[#144d18]">
                {isLoading ? 'Processing...' : 'Create Account'}
              </button>
              
              <button type="button" onClick={() => { setIsSignup(false); setErrorMsg(''); }} className="text-blue-600 font-bold text-sm hover:underline mt-2 text-center">
                Already have an account? Log In
              </button>
            </form>
          )}
        </div>
      </div>
      
      <footer className="mt-12 text-gray-600 text-[11px] text-center font-bold relative z-10">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-4 max-w-2xl">
          <span className="hover:underline cursor-pointer">English (UK)</span>
          <span className="hover:underline cursor-pointer text-[#1b5e20]">বাংলা</span>
        </div>
        <div className="border-t border-gray-300 pt-4 px-8">
          <p>AddaSangi © 1947-{currentYear}</p>
          <div className="mt-1 text-[9px] opacity-70">Made with 💚 in Bangladesh</div>
        </div>
      </footer>
    </div>
  );
};

export default Login;
