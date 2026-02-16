
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

interface AuthProps {
  onLogin: () => void;
}

const LOGO_URL = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjbaxCAakhVQOly5IhXfPkpbunmcsxREDf2xali0fkLp9gK5qNdh2KL-UhEmDICRaX6_HtDBQTKM6jgtCJuTzrjpKUynSLe6NCzCvRpCs8C6dBgy2wGzEmcV-EIdxh5r73ExANoAyfIufc5JdfXfY1Xal6BSK0fdnqwK0VCkOZTfEdb_GMAiBB-aB9wedf0/s1600/Gemini_Generated_Image_pnxgvipnxgvipnxg.png";

const Login: React.FC<AuthProps> = ({ onLogin }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  // New States for DOB and Gender
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setIsLoading(false);
    } else {
      onLogin();
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dob || !gender) {
      setErrorMsg('Please provide your birthday and gender.');
      return;
    }
    
    setIsLoading(true);
    setErrorMsg('');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`,
          dob: dob,
          gender: gender
        }
      }
    });

    if (error) {
      setErrorMsg(error.message);
      setIsLoading(false);
    } else {
      setErrorMsg('Check your email for the confirmation link!');
      setIsLoading(false);
    }
  };

  const inputClasses = "w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-md outline-none focus:border-[#b71c1c] focus:ring-1 focus:ring-[#b71c1c] placeholder-gray-500 transition-all font-medium";

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col items-center justify-center p-4 font-sans antialiased text-gray-900">
      <div className="w-full max-w-[400px] flex flex-col items-center">
        
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-4 p-2">
            <img src={LOGO_URL} alt="AddaSangi" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">
            <span className="text-[#b71c1c]">Adda</span>
            <span className="text-[#1b5e20]">Sangi</span>
          </h1>
        </div>

        <div className="w-full bg-white rounded-xl shadow-2xl p-6 border border-gray-100">
          {errorMsg && (
            <div className={`p-4 rounded-lg mb-6 text-sm font-bold border flex items-center gap-3 ${errorMsg.includes('Check your email') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              <i className={`fa-solid ${errorMsg.includes('Check your email') ? 'fa-circle-check text-lg' : 'fa-circle-exclamation text-lg'}`}></i>
              <span>{errorMsg}</span>
            </div>
          )}

          {!isSignup ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="text-center mb-2">
                <h2 className="text-2xl font-black tracking-tight">
                  <span className="text-[#b71c1c]">Welcome</span> <span className="text-[#1b5e20]">Back</span>
                </h2>
              </div>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClasses}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClasses}
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#b71c1c] text-white py-3.5 rounded-md font-bold text-xl transition-all shadow-md active:scale-[0.98] disabled:opacity-70 hover:bg-[#a01818]"
              >
                {isLoading ? 'Logging In...' : 'Log In'}
              </button>

              <div className="border-t border-gray-200 my-4"></div>
              
              <button
                type="button"
                onClick={() => { setIsSignup(true); setErrorMsg(''); }}
                className="bg-[#1b5e20] hover:bg-[#144d18] text-white py-3 px-8 rounded-md font-bold text-lg mx-auto transition-colors"
              >
                Create New Account
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="flex flex-col gap-4">
              <div className="text-center mb-2">
                <h2 className="text-2xl font-black tracking-tight text-gray-900">Create Account</h2>
                <p className="text-gray-500 text-sm mt-1">It's quick and easy.</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={inputClasses}
                  required
                />
                <input
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>

              {/* Birthday Section */}
              <div className="mt-1">
                <label className="text-xs font-black text-gray-700 mb-1.5 block uppercase tracking-wider">Birthday</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>

              {/* Gender Section */}
              <div className="mt-1">
                <label className="text-xs font-black text-gray-700 mb-1.5 block uppercase tracking-wider">Gender</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Female', 'Male', 'Custom'].map((g) => (
                    <label 
                      key={g} 
                      className={`flex items-center justify-between px-3 py-3 border rounded-md cursor-pointer transition-all ${gender === g ? 'border-[#1b5e20] bg-green-50 ring-1 ring-[#1b5e20]' : 'border-gray-300 bg-white hover:bg-gray-50'}`}
                    >
                      <span className="text-sm font-bold text-gray-800">{g}</span>
                      <input 
                        type="radio" 
                        name="gender" 
                        value={g} 
                        checked={gender === g}
                        onChange={(e) => setGender(e.target.value)}
                        className="accent-[#1b5e20] w-4 h-4"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClasses}
                required
              />
              <input
                type="password"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClasses}
                required
              />
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#1b5e20] text-white py-3.5 rounded-md font-bold text-xl mt-2 shadow-lg disabled:opacity-70 transition-all active:scale-[0.98] hover:bg-[#144d18]"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
              
              <button 
                type="button"
                onClick={() => { setIsSignup(false); setErrorMsg(''); }}
                className="text-blue-600 font-bold text-sm hover:underline mt-2 text-center"
              >
                Already have an account?
              </button>
            </form>
          )}
        </div>
      </div>
      <footer className="mt-12 text-gray-500 text-[11px] text-center font-bold">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-4 max-w-2xl">
          <span>English (UK)</span>
          <span>বাংলা</span>
        </div>
        <div className="border-t border-gray-200 pt-4">
          <p>AddaSangi © 1947-2005</p>
        </div>
      </footer>
    </div>
  );
};

export default Login;
