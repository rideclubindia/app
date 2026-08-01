import React from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BannedScreen = () => {
  const navigate = useNavigate();
  return (
    <div className="w-full h-full bg-[#FFF5F5] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#FFE3E3] shadow-lg p-8 text-center">
        <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-[#FFF0F0] flex items-center justify-center text-[#D92D20]">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-[24px] font-bold text-[#273a5a] mb-3">Account Permanently Banned</h1>
        <p className="text-[15px] text-[#6B7280] leading-relaxed mb-6">
          Your account has been permanently banned due to repeated policy violations. You cannot access app features or submit reports.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 rounded-full bg-[#EF4444] text-white font-semibold hover:bg-[#DC2626] transition-colors"
          >
            Return to Login
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 rounded-full border border-[#D1D5DB] text-[#374151] font-semibold hover:bg-[#F3F4F6] transition-colors"
          >
            Refresh Status
          </button>
        </div>
      </div>
    </div>
  );
};

export default BannedScreen;
