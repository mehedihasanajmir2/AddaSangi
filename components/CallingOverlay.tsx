
import React, { useState, useEffect, useRef } from 'react';

interface CallingOverlayProps {
  onClose: () => void;
}

const CallingOverlay: React.FC<CallingOverlayProps> = ({ onClose }) => {
  const [isConnecting, setIsConnecting] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [callTime, setCallTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let timer: any;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsConnecting(false);
        timer = setInterval(() => setCallTime(prev => prev + 1), 1000);
      } catch (err) {
        console.error("Error accessing media:", err);
        setIsConnecting(false);
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      clearInterval(timer);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 text-white flex flex-col animate-in fade-in zoom-in duration-300 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-red-900/40 to-transparent z-10"></div>
      <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-green-500">
                <img src="https://picsum.photos/seed/sangi-bot/400" className="w-full h-full object-cover" alt="AddaSangi Bot" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full flex items-center justify-center border-4 border-gray-900">
                <i className="fa-solid fa-bolt text-white text-xs"></i>
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-black mb-1">Sangi AI</h2>
            {isConnecting ? (
              <span className="text-red-500 font-bold uppercase tracking-widest text-xs">Connecting...</span>
            ) : (
              <span className="text-green-500 font-mono text-lg font-bold">{formatTime(callTime)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Local Video Preview */}
      <div className="absolute top-12 right-6 w-32 aspect-[3/4] rounded-2xl bg-black overflow-hidden border-2 border-white/20 shadow-2xl z-20 transition-all hover:scale-105">
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          playsInline 
          className="w-full h-full object-cover mirror transform -scale-x-100"
        />
      </div>

      {/* Controls Bar */}
      <div className="absolute bottom-12 inset-x-0 flex justify-center items-center gap-6 z-30">
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 backdrop-blur-md text-white border border-white/20'}`}
        >
          <i className={`fa-solid ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'} text-xl`}></i>
        </button>
        
        <button 
          onClick={onClose}
          className="w-20 h-20 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center shadow-xl shadow-red-600/30 transition-transform active:scale-90"
        >
          <i className="fa-solid fa-phone-slash text-3xl text-white"></i>
        </button>

        <button className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20">
          <i className="fa-solid fa-volume-high text-xl"></i>
        </button>
      </div>
    </div>
  );
};

export default CallingOverlay;
