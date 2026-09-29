import React, { useEffect, useState } from 'react';
import { ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';
import permissionsBackground from '../assets/permissions.png';
import { PRIVACY_POLICY_TEXT as fallbackPrivacyText } from '../content/legalPolicies';


const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const [isLandscape, setIsLandscape] = useState(
    () => window.matchMedia('(orientation: landscape)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(orientation: landscape)');
    const handler = (e: MediaQueryListEvent) => setIsLandscape(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const { data } = await supabase
          .from('cms_policies')
          .select('*')
          .eq('type', 'privacy')
          .eq('is_published', true)
          .order('version', { ascending: false })
          .limit(1)
          .single();
          
        if (data && data.content) {
          setContent(data.content);
          setLastUpdated(new Date(data.updated_at).toLocaleDateString());
        } else {
          setContent(fallbackPrivacyText);
          setLastUpdated(new Date().toLocaleDateString());
        }
      } catch (err) {
        setContent(fallbackPrivacyText);
        setLastUpdated(new Date().toLocaleDateString());
      }
      setLoading(false);
    };
    
    fetchPolicy();
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-[#273a5a] text-white overflow-hidden font-sans pt-[max(20px,env(safe-area-inset-top))] pb-[env(safe-area-inset-bottom)]">
      <Helmet>
        <title>Privacy Policy | Ride Club</title>
        <meta name="description" content="Read the Privacy Policy and learn how your data is protected on Ride Club." />
      </Helmet>
      
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={permissionsBackground}
          alt=""
          className="w-full h-full object-cover"
          style={{ objectPosition: 'center 35%' }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(5,5,5,1) 0%, rgba(5,5,5,0.95) 15%, rgba(5,5,5,0.7) 40%, rgba(5,5,5,0.5) 100%)' }}></div>
      </div>

      {/* ====== PORTRAIT LAYOUT ====== */}
      {!isLandscape && (
        <div className="relative z-10 flex-1 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="px-4 pt-4 pb-4 flex items-center shrink-0">
            <button 
              onClick={() => navigate(-1)} 
              className="w-10 h-10 flex items-center justify-center -ml-2 text-white hover:bg-white/10 rounded-full transition-colors active:scale-95"
              aria-label="Go back"
            >
              <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
            </button>
            <div className="flex items-center gap-2 ml-2">
              <div className="w-8 h-8 rounded-lg bg-[#ef4523] flex items-center justify-center shadow-[0_0_12px_rgba(255,106,0,0.4)]">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-[20px] font-semibold text-white tracking-tight">Privacy Policy</h1>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 pb-10 hide-scrollbar">
            <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-[8px] p-6 shadow-2xl min-h-full">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="w-8 h-8 border-4 border-[#ef4523] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div>
                  <p className="text-[11px] font-semibold text-[#ef4523] mb-6 uppercase tracking-wider">Last updated: {lastUpdated}</p>
                  <div className="text-[14px] text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {content}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====== LANDSCAPE LAYOUT ====== */}
      {isLandscape && (
        <div className="relative z-10 flex-1 flex flex-row h-full overflow-hidden items-center px-10 gap-8">
          
          {/* Left Column — Header & Info */}
          <div className="w-[40%] flex flex-col gap-6 shrink-0 justify-center">
            <button 
              onClick={() => navigate(-1)} 
              className="w-12 h-12 flex items-center justify-center -ml-3 text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors active:scale-95 border border-white/10 backdrop-blur-md"
              aria-label="Go back"
            >
              <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
            </button>
            
            <div className="flex flex-col gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#ef4523] flex items-center justify-center shadow-[0_0_16px_rgba(255,106,0,0.4)]">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-[24px] font-extrabold leading-[1.05] tracking-tight">
                Privacy <br/><span className="text-[#ef4523]">Policy</span>
              </h1>
              <p className="text-[#B7BDC8] text-[14px] leading-relaxed max-w-sm mt-2">
                Learn how your data is protected and managed on Ride Club.
              </p>
            </div>
          </div>

          {/* Right Column — Content */}
          <div className="flex-1 flex flex-col h-[85%] bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-xl p-8 shadow-2xl overflow-y-auto hide-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-[#ef4523] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div>
                <p className="text-[12px] font-semibold text-[#ef4523] mb-6 uppercase tracking-wider">Last updated: {lastUpdated}</p>
                <div className="text-[14px] text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {content}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivacyPolicy;
