
import React from 'react';

const Notifications: React.FC = () => {
  return (
    <div className="h-full bg-[#f0f2f5] p-4">
      <h2 className="text-xl font-bold mb-4">নোটিফিকেশন</h2>
      <div className="bg-white rounded-xl p-8 text-center shadow-sm">
        <i className="fa-solid fa-bell-slash text-4xl text-gray-200 mb-4"></i>
        <p className="text-gray-500">বর্তমানে কোনো নোটিফিকেশন নেই।</p>
      </div>
    </div>
  );
};

export default Notifications;
