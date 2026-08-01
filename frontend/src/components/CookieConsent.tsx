import React, { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the user has already consented
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie_consent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 pb-20 md:pb-6 pointer-events-none">
      <div className="max-w-4xl mx-auto bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6 pointer-events-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-start md:items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-xl flex-shrink-0">
            <Cookie className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold mb-1">We value your privacy</h3>
            <p className="text-gray-400 text-sm">
              We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
              By clicking "Accept All", you consent to our use of cookies.
            </p>
          </div>
        </div>
        <div className="flex w-full md:w-auto items-center gap-3 shrink-0">
          <button
            onClick={handleDecline}
            className="flex-1 md:flex-none px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 md:flex-none px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
          >
            Accept All
          </button>
          <button 
            onClick={handleDecline}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
