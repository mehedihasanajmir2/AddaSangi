
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { motion } from 'motion/react';

const LOGO_URL = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjbaxCAakhVQOly5IhXfPkpbunmcsxREDf2xali0fkLp9gK5qNdh2KL-UhEmDICRaX6_HtDBQTKM6jgtCJuTzrjpKUynSLe6NCzCvRpCs8C6dBgy2wGzEmcV-EIdxh5r73ExANoAyfIufc5JdfXfY1Xal6BSK0fdnqwK0VCkOZTfEdb_GMAiBB-aB9wedf0/s1600/Gemini_Generated_Image_pnxgvipnxgvipnxg.png";

interface LoginProps {
  onLogin: () => void;
}

const FallingParticle = () => {
  const [props, setProps] = useState({ left: 0, delay: 0, duration: 0, size: 0, icon: '' });

  useEffect(() => {
    const icons = ['fa-comment', 'fa-heart', 'fa-paper-plane', 'fa-message', 'fa-smile'];
    setProps({
      left: Math.random() * 100,
      delay: Math.random() * 20,
      duration: 15 + Math.random() * 10,
      size: 10 + Math.random() * 20,
      icon: icons[Math.floor(Math.random() * icons.length)]
    });
  }, []);

  if (!props.icon) return null;

  return (
    <motion.div
      initial={{ y: -100, opacity: 0, rotate: 0 }}
      animate={{ 
        y: '110vh', 
        opacity: [0, 0.4, 0.4, 0],
        rotate: 360 
      }}
      transition={{ 
        duration: props.duration, 
        repeat: Infinity, 
        delay: props.delay,
        ease: "linear"
      }}
      className="absolute text-green-300 pointer-events-none"
      style={{ left: `${props.left}%`, fontSize: `${props.size}px` }}
    >
      <i className={`fa-solid ${props.icon}`}></i>
    </motion.div>
  );
};

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [gender, setGender] = useState('');
  const [error, setError] = useState<string | null>(null);

  const getDaysInMonth = (m: string, y: string) => {
    if (!m) return 31;
    const monthNum = parseInt(m);
    const yearNum = y ? parseInt(y) : new Date().getFullYear();
    return new Date(yearNum, monthNum, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(month, year);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1947 + 1 }, (_, i) => currentYear - i);

  useEffect(() => {
    if (day && parseInt(day) > daysInMonth) {
      setDay('');
    }
  }, [month, year, day, daysInMonth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Password validation for Sign Up
    if (isSignUp) {
      // Age validation (Minimum 15 years)
      if (year && month && day) {
        const birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        if (age < 15) {
          setError('You must be at least 15 years old to create an account.');
          setLoading(false);
          return;
        }
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        setLoading(false);
        return;
      }
      
      const hasLetter = /[a-zA-Z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      if (!hasLetter || !hasNumber) {
        setError('Please use a stronger password (include both letters and numbers)');
        setLoading(false);
        return;
      }
    }

    try {
      if (isSignUp) {
        const fullName = `${firstName} ${lastName}`.trim();
        const dobArr = [year, month.padStart(2, '0'), day.padStart(2, '0')];
        const dob = dobArr.join('-');
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              first_name: firstName,
              last_name: lastName,
              dob: dob,
              gender: gender,
              avatar_url: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(fullName)}`
            }
          }
        });

        if (error) throw error;

        // Check if user was actually created or already exists
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          setError('Already account created. Please login.');
          setLoading(false);
          return;
        }
        
        // Success: Show verification screen
        setIsVerifyingEmail(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLogin();
      }
    } catch (err: any) {
      let msg = err.message || (isSignUp ? 'Registration failed' : 'Login failed');
      if (msg.includes('Email rate limit exceeded')) {
        msg = 'Too many requests! Email rate limit exceeded. Please wait for an hour and try again.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (isVerifyingEmail) {
    return (
      <div className="min-h-screen bg-[#e8f5e9] flex items-center justify-center p-4 relative overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <FallingParticle key={i} />
        ))}
        <div className="bg-white/80 backdrop-blur-md w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-8 flex flex-col items-center text-center relative z-10 border border-white">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
            <i className="fa-solid fa-envelope-circle-check text-4xl text-[#1b5e20]"></i>
          </div>
          <h1 className="text-2xl font-black text-[#1b5e20] mb-4">Check Your Email!</h1>
          <p className="text-gray-600 mb-8">
            Amra apnar email address (<span className="font-bold text-black">{email}</span>) e ekta confirmation link pathiyechi. 
            Account activate korar jonno oi link e click korun.
          </p>
          <button 
            onClick={() => {
              setIsVerifyingEmail(false);
              setIsSignUp(false);
              setError(null);
            }}
            className="w-full bg-[#1b5e20] text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            Login Now
          </button>
          <p className="mt-6 text-xs text-gray-400">
            Email na pele apnar Spam folder check korun.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e8f5e9] via-white to-[#e8f5e9] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Falling Background Elements */}
      {Array.from({ length: 30 }).map((_, i) => (
        <FallingParticle key={i} />
      ))}
      
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/90 backdrop-blur-sm w-full max-w-md rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/50 overflow-hidden p-8 flex flex-col items-center relative z-10"
      >
        <div className="mb-6 bg-green-50 p-4 rounded-3xl shadow-inner">
          <img src={LOGO_URL} className="w-20 h-20" alt="AddaSangi" />
        </div>
        <h1 className="text-3xl font-black mb-2">
          <span className="text-red-600">Adda</span><span className="text-green-600">Sangi</span>
        </h1>
        <p className="text-gray-500 text-sm mb-8 font-medium">Welcome to AddaSangi</p>
        
        {error && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="w-full mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded-r-lg"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          {isSignUp && (
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="text" 
                placeholder="First Name" 
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="w-full p-4 bg-white/50 border border-gray-100 rounded-xl outline-none focus:border-[#1b5e20] transition-all shadow-sm"
                required
              />
              <input 
                type="text" 
                placeholder="Last Name" 
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="w-full p-4 bg-white/50 border border-gray-100 rounded-xl outline-none focus:border-[#1b5e20] transition-all shadow-sm"
                required
              />
            </div>
          )}
          <div>
            <input 
              type="email" 
              placeholder="Your Email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-4 bg-white/50 border border-gray-100 rounded-xl outline-none focus:border-[#1b5e20] transition-all shadow-sm"
              required
            />
          </div>
          {isSignUp && (
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-2">Date of Birth</label>
              <div className="grid grid-cols-3 gap-2">
                <select 
                  value={day}
                  onChange={e => setDay(e.target.value)}
                  className="p-4 bg-white/50 border border-gray-100 rounded-xl outline-none focus:border-[#1b5e20] transition-all appearance-none text-sm shadow-sm"
                  required={isSignUp}
                >
                  <option value="">Day</option>
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d.toString()}>{d}</option>
                  ))}
                </select>
                <select 
                  value={month}
                  onChange={e => setMonth(e.target.value)}
                  className="p-4 bg-white/50 border border-gray-100 rounded-xl outline-none focus:border-[#1b5e20] transition-all appearance-none text-sm shadow-sm"
                  required={isSignUp}
                >
                  <option value="">Month</option>
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, idx) => (
                    <option key={m} value={(idx + 1).toString()}>{m}</option>
                  ))}
                </select>
                <select 
                  value={year}
                  onChange={e => setYear(e.target.value)}
                  className="p-4 bg-white/50 border border-gray-100 rounded-xl outline-none focus:border-[#1b5e20] transition-all appearance-none text-sm shadow-sm"
                  required={isSignUp}
                >
                  <option value="">Year</option>
                  {years.map(y => (
                    <option key={y} value={y.toString()}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-4 bg-white/50 border border-gray-100 rounded-xl outline-none focus:border-[#1b5e20] transition-all pr-12 shadow-sm"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1b5e20] transition-colors"
            >
              <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
          {isSignUp && (
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 ml-2">Gender</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`p-4 rounded-xl border font-medium transition-all ${
                    gender === 'male' 
                      ? 'bg-[#1b5e20] text-white border-[#1b5e20] shadow-md' 
                      : 'bg-white/50 text-gray-500 border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <i className="fa-solid fa-mars mr-2"></i>
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`p-4 rounded-xl border font-medium transition-all ${
                    gender === 'female' 
                      ? 'bg-[#1b5e20] text-white border-[#1b5e20] shadow-md' 
                      : 'bg-white/50 text-gray-500 border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <i className="fa-solid fa-venus mr-2"></i>
                  Female
                </button>
              </div>
            </div>
          )}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#1b5e20] text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Please wait...' : (isSignUp ? 'Create My Account' : 'Login Now')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 font-medium">
            {isSignUp ? 'Already have an account?' : ''}
            <button 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="ml-2 font-black text-[#1b5e20] hover:underline transition-all"
            >
              {isSignUp ? 'Login Now' : 'Create A New Account'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
