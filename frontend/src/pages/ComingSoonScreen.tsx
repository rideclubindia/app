import React, { useEffect, useState } from 'react';
import logo from '../assets/Logos/Logo for White Backgrounds 2.svg';

interface ComingSoonProps {
  title?: string;
  subtitle?: string;
  description?: string;
  launchDate?: string | null;
  imageUrl?: string | null;
  buttonText?: string;
  buttonAction?: string;
  showCountdown?: boolean;
  logoUrl?: string | null;
}

const ComingSoonScreen: React.FC<ComingSoonProps> = ({
  title = 'Something Big Is Coming',
  subtitle = "We're building something exciting for our community.",
  description = "A new experience is on the way.\n\nEnhanced features, smarter tools, better performance, and innovations that have never been seen before in our platform.\n\nWe're currently preparing everything behind the scenes to deliver a faster, more engaging, and more powerful experience.\n\nStay tuned. The wait will be worth it.",
  launchDate = null,
  imageUrl = null,
  buttonText = '',
  buttonAction = '',
  showCountdown = false,
  logoUrl = null,
}) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!showCountdown || !launchDate) return;

    const targetDate = new Date(launchDate).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(interval);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [launchDate, showCountdown]);

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700 font-sans relative overflow-hidden dark:bg-[#121212]">
      {/* Background Graphic/Image */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        {imageUrl ? (
          <img src={imageUrl} alt="Coming Soon Background" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-transparent dark:from-primary/5"></div>
        )}
      </div>

      <div className="relative z-10 max-w-lg mx-auto flex flex-col items-center">
        {/* Graphic */}
        <div className="w-24 h-24 mb-4 bg-white dark:bg-[#2A1A15] rounded-full flex items-center justify-center shadow-lg border-4 border-white overflow-hidden">
          <img src={logoUrl || logo} alt="Logo" className="w-16 h-16 object-contain" />
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold text-[#273a5a] dark:text-white mb-3 tracking-tight">
          {title}
        </h1>
        
        <h2 className="text-lg md:text-xl font-medium text-primary mb-6">
          {subtitle}
        </h2>

        <div className="text-[15px] leading-relaxed text-[#8A8A8E] dark:text-gray-400 mb-10 whitespace-pre-line text-balance">
          {description}
        </div>

        {showCountdown && launchDate && (
          <div className="flex gap-4 mb-10">
            {[
              { label: 'Days', value: timeLeft.days },
              { label: 'Hours', value: timeLeft.hours },
              { label: 'Minutes', value: timeLeft.minutes },
              { label: 'Seconds', value: timeLeft.seconds },
            ].map((item, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white dark:bg-[#1E1E1E] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-center mb-2">
                  <span className="text-2xl md:text-3xl font-bold text-[#273a5a] dark:text-white">
                    {item.value.toString().padStart(2, '0')}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-wider">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {buttonText && (
          <a
            href={buttonAction || '#'}
            className="px-8 py-4 bg-[#ef4523] text-white rounded-full font-bold text-[15px] shadow-[0_8px_20px_rgba(239,69,35,0.3)] hover:bg-[#d83c1d] hover:shadow-[0_10px_25px_rgba(239,69,35,0.4)] transition-all transform hover:-translate-y-1"
          >
            {buttonText}
          </a>
        )}
      </div>
    </div>
  );
};

export default ComingSoonScreen;
