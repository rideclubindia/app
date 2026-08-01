import React, { useEffect, useState } from 'react';
import { ArrowLeft, FileCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';
import permissionsBackground from '../assets/permissions.png';

const fallbackTermsText = `RIDE CLUB TERMS OF SERVICE

Last Updated: June 2026

1. ACCEPTANCE OF TERMS
By downloading, accessing, or using the Ride Club mobile application, website, or any related services (collectively, the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, then you do not have permission to access the Service. These Terms apply to all visitors, users, and others who access or use the Service.

2. DESCRIPTION OF SERVICE
Ride Club is a community-driven navigation and incident-reporting application. It allows users to track their routes, join "Live Rides" with other users, post real-time alerts about road conditions (such as accidents, hazards, and road closures), and interact in community groups. The Service relies heavily on user-generated content and real-time GPS location sharing.

3. USER CONDUCT AND RESPONSIBILITY
You are solely responsible for your conduct while using the Service and for any data, text, information, usernames, graphics, images, photographs, profiles, audio, video, items, and links (collectively, "Content") that you submit, post, and display on Ride Club. 
You agree NOT to:
- Use the Service while operating a moving vehicle in a manner that violates local traffic laws or distracts you from safe driving. SAFETY ALWAYS COMES FIRST.
- Submit false, misleading, or malicious incident reports to deceive the community or manipulate the map.
- Use the Service for any illegal or unauthorized purpose.
- Harass, abuse, threaten, or intimidate other Ride Club users.
- Upload viruses, malware, or any other malicious code.
- Attempt to reverse-engineer, decompile, or otherwise extract the source code of the application.

4. USER-GENERATED CONTENT
By posting Content on Ride Club, you grant us a non-exclusive, royalty-free, irrevocable, sub-licensable, perpetual license to use, display, edit, modify, reproduce, distribute, store, and prepare derivative works of your Content within India. You represent and warrant that you own the Content or have the necessary rights to grant us this license. We reserve the right to remove any Content from the Service at our sole discretion, without notice, if we believe it violates these Terms.

5. LOCATION DATA AND PRIVACY
The core functionality of Ride Club requires continuous access to your device's GPS location. By using the Service, you explicitly consent to the collection, storage, and sharing of your location data as outlined in our Privacy Policy. During a "Live Ride", your exact location will be visible to other members of that ride. When idling, your location may be periodically synced to provide accurate localized alerts. You may revoke location permissions via your device settings at any time, but doing so will severely limit the app's functionality.

6. DISCLAIMER OF WARRANTIES
THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. RIDE CLUB MAKES NO REPRESENTATIONS OR WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, AS TO THE OPERATION OF THEIR SERVICES, OR THE INFORMATION, CONTENT, OR MATERIALS INCLUDED THEREIN. YOU EXPRESSLY AGREE THAT YOUR USE OF THE SERVICE IS AT YOUR SOLE RISK. WE DO NOT GUARANTEE THE ACCURACY OF COMMUNITY-REPORTED ALERTS OR ROUTING INFORMATION.

7. LIMITATION OF LIABILITY
IN NO EVENT SHALL RIDE CLUB, ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES, BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM (I) YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICE; (II) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICE; (III) ANY CONTENT OBTAINED FROM THE SERVICE; AND (IV) UNAUTHORIZED ACCESS, USE OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT, WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE) OR ANY OTHER LEGAL THEORY.

8. TERMINATION
We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you may simply discontinue using the Service and delete the application.

9. CHANGES TO TERMS
10. INDEMNIFICATION
You agree to defend, indemnify and hold harmless Ride Club and its licensee and licensors, and their employees, contractors, agents, officers and directors, from and against any and all claims, damages, obligations, losses, liabilities, costs or debt, and expenses (including but not limited to attorney's fees), resulting from or arising out of a) your use and access of the Service, by you or any person using your account and password, or b) a breach of these Terms.

11. GOVERNING LAW AND JURISDICTION
These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect. These Terms constitute the entire agreement between us regarding our Service, and supersede and replace any prior agreements we might have between us regarding the Service.

12. INTELLECTUAL PROPERTY RIGHTS
The Service and its original content (excluding Content provided by users), features and functionality are and will remain the exclusive property of Ride Club and its licensors. The Service is protected by copyright, trademark, and other laws of India and applicable international treaties. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Ride Club.

13. THIRD-PARTY SERVICES AND CONTENT
The Service may contain links to third-party web sites or services that are not owned or controlled by Ride Club. Ride Club has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third party web sites or services. You further acknowledge and agree that Ride Club shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with use of or reliance on any such content, goods or services available on or through any such web sites or services.

14. DISPUTE RESOLUTION AND ARBITRATION
Any controversy or claim arising out of or relating to these Terms, or the breach thereof, shall be settled by arbitration administered in accordance with the Arbitration and Conciliation Act, 1996, and judgment on the award rendered by the arbitrator(s) may be entered in any court having jurisdiction thereof. The arbitration shall take place in New Delhi, India. You and Ride Club agree that each may bring claims against the other only in your or its individual capacity and not as a plaintiff or class member in any purported class or representative proceeding.

15. FORCE MAJEURE
Ride Club shall not be liable for any delay or failure to perform resulting from causes outside its reasonable control, including, but not limited to, acts of God, war, terrorism, riots, embargos, acts of civil or military authorities, fire, floods, accidents, strikes or shortages of transportation facilities, fuel, energy, labor or materials.

16. SEVERABILITY
If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that these Terms will otherwise remain in full force and effect and enforceable.

17. CONTACT INFORMATION
If you have any questions about these Terms, please contact us at legal@rideclub.in.`;

const Terms = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const { data } = await supabase
          .from('cms_policies')
          .select('*')
          .eq('type', 'terms')
          .eq('is_published', true)
          .order('version', { ascending: false })
          .limit(1)
          .single();
          
        if (data && data.content) {
          setContent(data.content);
          setLastUpdated(new Date(data.updated_at).toLocaleDateString());
        } else {
          setContent(fallbackTermsText);
          setLastUpdated(new Date().toLocaleDateString());
        }
      } catch (err) {
        setContent(fallbackTermsText);
        setLastUpdated(new Date().toLocaleDateString());
      }
      setLoading(false);
    };
    
    fetchPolicy();
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-[#273a5a] text-white overflow-hidden font-sans">
      <Helmet>
        <title>Terms of Service | Ride Club</title>
        <meta name="description" content="Read the Terms of Service for using the Ride Club application." />
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

      {/* Header */}
      <div className="relative z-10 px-4 pt-4 pb-4 flex items-center shrink-0">
        <button 
          onClick={() => navigate(-1)} 
          className="w-10 h-10 flex items-center justify-center -ml-2 text-white hover:bg-white/10 rounded-full transition-colors active:scale-95"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-2 ml-2">
          <div className="w-8 h-8 rounded-lg bg-[#ef4523] flex items-center justify-center shadow-[0_0_12px_rgba(255,106,0,0.4)]">
            <FileCheck className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-[20px] font-bold text-white tracking-tight">Terms of Service</h1>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-5 pb-10 hide-scrollbar">
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-[24px] p-6 shadow-2xl">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-4 border-[#ef4523] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div>
              <p className="text-[11px] font-bold text-[#ef4523] mb-6 uppercase tracking-wider">Last updated: {lastUpdated}</p>
              <div className="text-[14px] text-gray-200 leading-relaxed whitespace-pre-wrap">
                {content}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Terms;
