
import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface CallingOverlayProps {
  initialType: 'audio' | 'video';
  targetUser: User;
  isIncoming: boolean;
  currentUser: User;
  onClose: () => void;
}

const CallingOverlay: React.FC<CallingOverlayProps> = ({ initialType, targetUser, isIncoming, currentUser, onClose }) => {
  const [callStatus, setCallStatus] = useState(isIncoming ? 'Incoming Call' : 'Calling...');
  const [timer, setTimer] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let interval: any;
    if (!isIncoming || isConnected) {
      interval = setInterval(() => {
        setTimer(v => v + 1);
      }, 1000);
      
      // Simulate connection if outgoing
      if (!isIncoming && !isConnected) {
        setTimeout(() => {
          setIsConnected(true);
          setCallStatus('Connected');
        }, 3000);
      }
    }
    return () => clearInterval(interval);
  }, [isIncoming, isConnected]);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#1b1b1b] flex flex-col items-center justify-between py-20 px-6 animate-in fade-in duration-500">
      <div className="flex flex-col items-center">
        <div className="relative mb-6">
          <img 
            src={targetUser.avatar} 
            className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-white/10 object-cover shadow-2xl" 
            alt="avatar" 
          />
          {initialType === 'video' && isConnected && (
            <div className="absolute top-0 right-0 w-24 h-32 md:w-32 md:h-44 bg-gray-900 border-2 border-white/20 rounded-lg overflow-hidden shadow-xl animate-in zoom-in-50">
               <img src={currentUser.avatar} className="w-full h-full object-cover" alt="me" />
            </div>
          )}
        </div>
        <h2 className="text-3xl font-black text-white mb-2">{targetUser.username}</h2>
        <p className="text-white/60 font-medium tracking-wide">
          {isConnected ? formatTime(timer) : callStatus}
        </p>
      </div>

      <div className="flex flex-col items-center gap-10 w-full max-w-sm">
        <div className="flex gap-8 items-center justify-center w-full">
          {isIncoming && !isConnected ? (
            <>
              <button 
                onClick={onClose}
                className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white text-2xl shadow-lg hover:bg-red-700 transition-all active:scale-90"
              >
                <i className="fa-solid fa-phone-slash"></i>
              </button>
              <button 
                onClick={() => { setIsConnected(true); setCallStatus('Connected'); }}
                className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center text-white text-3xl shadow-lg hover:bg-green-600 transition-all active:scale-90 animate-bounce"
              >
                <i className="fa-solid fa-phone"></i>
              </button>
            </>
          ) : (
            <>
              <button className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white text-xl hover:bg-white/20">
                <i className="fa-solid fa-microphone-slash"></i>
              </button>
              <button className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white text-xl hover:bg-white/20">
                <i className="fa-solid fa-video-slash"></i>
              </button>
              <button className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white text-xl hover:bg-white/20">
                <i className="fa-solid fa-volume-high"></i>
              </button>
              <button 
                onClick={onClose}
                className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white text-2xl shadow-lg hover:bg-red-700 transition-all active:scale-90"
              >
                <i className="fa-solid fa-phone-slash"></i>
              </button>
            </>
          )}
        </div>
      </div>

      {initialType === 'video' && !isIncoming && !isConnected && (
        <div className="absolute inset-0 bg-black/40 -z-10 blur-3xl opacity-50"></div>
      )}
    </div>
  );
};

export default CallingOverlay;
