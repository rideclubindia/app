import React from 'react';
import { useNavigate } from 'react-router-dom';
import darkLogo from '../assets/Logos/Logo for Dark Backgrounds 2.svg';

const SplashScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center overflow-hidden pt-[max(20px,env(safe-area-inset-top))] pb-[env(safe-area-inset-bottom)]">
      
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-[80px]"></div>
      </div>

      <div className="z-10 flex flex-col items-center justify-center flex-grow w-full px-8 animate-fade-in">
        
        {/* Logo Container */}
        <div className="relative mb-6 flex flex-col items-center">
          <img src={darkLogo} alt="Ride Club Logo" className="w-48 h-auto object-contain" />
        </div>
        
        <p className="text-gray-400 text-center text-lg mb-16">
          Navigate Smarter.<br/>Drive Safer.
        </p>

      </div>

      <div className="z-10 w-full px-8 pb-12">
        <button 
          onClick={() => navigate('/login')}
          className="w-full bg-primary hover:bg-orange-600 text-white font-semibold py-4 rounded-lg shadow-lg shadow-primary/30 transition-all duration-300 transform hover:scale-[1.02] active:scale-95"
        >
          Get Started
        </button>
      </div>

    </div>
  );
};

export default SplashScreen;
