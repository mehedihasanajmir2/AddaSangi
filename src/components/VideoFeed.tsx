
import React from 'react';

const VideoFeed: React.FC = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-black text-white p-6">
      <i className="fa-solid fa-video-slash text-4xl mb-4 opacity-50"></i>
      <h3 className="text-xl font-bold">ভিডিও ফিড শীঘ্রই আসছে</h3>
      <p className="text-sm text-gray-400 mt-2">আমরা এই ফিচারটি নিয়ে কাজ করছি।</p>
    </div>
  );
};

export default VideoFeed;
