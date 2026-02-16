
import React, { useState, useEffect, useRef } from 'react';

interface CallingOverlayProps {
  onClose: () => void;
}

const CALLING_TONE_URL = "https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3"; 

const CallingOverlay: React.FC<CallingOverlayProps> = ({ onClose }) => {
  const [isConnecting, setIsConnecting] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [callTime, setCallTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    ringtoneRef.current = new Audio(CALLING_TONE_URL);
    ringtoneRef.current.loop = true;
    
    let timer: any;
    const startCamera = async () => {
      try {
        if (ringtoneRef.current) {
          ringtoneRef.current.play().catch(e => console.log("Audio play blocked"));
        }

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        setTimeout(() => {
          setIsConnecting(false);
          if (ringtoneRef.current) {
            ringtoneRef.current.pause();
            ringtoneRef.current.currentTime = 0;
          }
          timer = setInterval(() => setCallTime(prev => prev + 1), 1000);
        }, 3000);

      } catch (err) {
        console.error("Error accessing media:", err);
        setIsConnecting(false);
        if (ringtoneRef.current) ringtoneRef.current.pause();
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current = null;
      }
      clearInterval(timer);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isMinimized) {
    return (
      <div 
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-20 right-4 z-[100] bg-gray-900 p-2 rounded-2xl shadow-2xl flex items-center gap-3 border border-red-500 animate-bounce hover:animate-none cursor-pointer"
      >
        <div className="relative">
          <img src="https://picsum.photos/seed/sangi-bot/100" className="w-12 h-12 rounded-full border-2 border-green-500" alt="" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center border-2 border-gray-900">
             <i className="fa-solid fa-phone text-[8px] text-white"></i>
          </div>
        </div>
        <div className="pr-2">
          <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">In Call</p>
          <p className="text-white font-mono font-bold leading-none">{formatTime(callTime)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-gray-950 text-white flex flex-col animate-in fade-in zoom-in duration-300 overflow-hidden">
      <div className="absolute top-6 left-6 z-50">
        <button 
          onClick={() => setIsMinimized(true)}
          className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20"
        >
          <i className="fa-solid fa-minimize"></i>
        </button>
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-red-900/40 to-transparent z-10"></div>
      
      <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className={`w-36 h-36 rounded-full overflow-hidden border-4 ${isConnecting ? 'border-red-500 animate-pulse' : 'border-green-500'}`}>
                <img src="https://picsum.photos/seed/sangi-bot/400" className="w-full h-full object-cover" alt="AddaSangi Bot" />
            </div>
            <div className={`absolute -bottom-2 -right-2 ${isConnecting ? 'bg-red-500' : 'bg-green-500'} w-8 h-8 rounded-full flex items-center justify-center border-4 border-gray-900`}>
                <i className={`fa-solid ${isConnecting ? 'fa-phone-volume animate-bounce' : 'fa-bolt'} text-white text-xs`}></i>
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-black mb-1">Sangi AI</h2>
            {isConnecting ? (
              <span className="text-red-500 font-bold uppercase tracking-widest text-xs">Connecting...</span>
            ) : (
              <span className="text-green-500 font-mono text-lg font-bold tracking-widest">{formatTime(callTime)}</span>
            )}
          </div>
        </div>
      </div>

      <div className="absolute top-12 right-6 w-32 aspect-[3/4] rounded-2xl bg-black overflow-hidden border-2 border-white/20 shadow-2xl z-20">
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover mirror transform -scale-x-100" />
      </div>

      <div className="absolute bottom-12 inset-x-0 flex justify-center items-center gap-6 z-30">
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className={`w-14 h-14 rounded-full flex items-center justify-center ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 border border-white/20'}`}
        >
          <i className={`fa-solid ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'} text-xl`}></i>
        </button>
        
        <button onClick={onClose} className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-xl shadow-red-600/30 active:scale-90">
          <i className="fa-solid fa-phone-slash text-3xl text-white"></i>
        </button>

        <button className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
          <i className="fa-solid fa-volume-high text-xl"></i>
        </button>
      </div>
    </div>
  );
};

export default CallingOverlay;
