import React, { useEffect, useState } from 'react';
import { ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';
import permissionsBackground from '../assets/permissions.png';

const fallbackPrivacyText = `RIDE CLUB PRIVACY POLICY

Last Updated: June 2026

1. INTRODUCTION
Welcome to Ride Club. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our application and tell you about your privacy rights and how the law protects you. Ride Club operates as a real-time community-driven navigation and alert application designed to improve safety, coordinate group rides, and provide crowdsourced incident reports. By using our Services, you consent to the data practices described in this policy.

2. THE DATA WE COLLECT ABOUT YOU
Personal data, or personal information, means any information about an individual from which that person can be identified. We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:
- Identity Data: includes first name, last name, username or similar identifier, and profile picture.
- Contact Data: includes email address and telephone numbers.
- Location Data: includes real-time geographic location (GPS tracking), route history, typical driving patterns, and speeds. This is crucial for providing real-time alerts and coordinating "Live Rides".
- Device & Technical Data: includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, mobile device IDs, and other technology on the devices you use to access this app.
- Usage Data: includes information about how you use our app, the alerts you post, the groups you join, and the rides you participate in.
- Multimedia Data: includes photos, videos, or audio you voluntarily upload when reporting an incident or communicating in a group.

3. HOW IS YOUR PERSONAL DATA COLLECTED?
We use different methods to collect data from and about you including through:
- Direct interactions: You may give us your Identity and Contact data by creating an account.
- Automated technologies or interactions: As you interact with our app, we will automatically collect Technical, Usage, and Location Data. We collect Location Data in the background (even when the app is closed) if you have granted explicit permission for background location access, which is necessary for certain safety alerts.
- Community interactions: When you post a pin, report an incident, or join a Live Ride, your actions generate data that is logged to your profile.

4. HOW WE USE YOUR PERSONAL DATA
We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
- To provide and maintain our Service, including to monitor the usage of our Service.
- To manage your Account: to manage your registration as a user of the Service. 
- For the performance of a contract: the development, compliance and undertaking of the purchase contract for the products, items or services you have purchased or of any other contract with us through the Service.
- To provide real-time hazard alerts to the community based on crowdsourced reports.
- To enable Live Ride functionality, allowing group members to see each other's locations on a shared map.
- To enforce our terms, conditions, and policies for business purposes, to comply with legal and regulatory requirements, or in connection with our contract.

5. DATA SECURITY
We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors, and other third parties who have a business need to know.

6. DATA RETENTION
We will only retain your personal data for as long as reasonably necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, regulatory, tax, accounting, or reporting requirements. We may retain your personal data for a longer period in the event of a complaint or if we reasonably believe there is a prospect of litigation in respect to our relationship with you.

7. YOUR LEGAL RIGHTS
Under certain circumstances, you have rights under data protection laws in relation to your personal data. These include the right to:
- Request access to your personal data.
- Request correction of your personal data.
- Request erasure of your personal data.
- Object to processing of your personal data.
- Request restriction of processing your personal data.
- Request transfer of your personal data.
- Right to withdraw consent.

8. THIRD-PARTY LINKS AND INTEGRATIONS
Our application may include links to third-party websites, plug-ins, and applications. Clicking on those links or enabling those connections may allow third parties to collect or share data about you. We do not control these third-party websites and are not responsible for their privacy statements. When you leave our application, we encourage you to read the privacy notice of every website you visit.

9. COOKIES AND TRACKING TECHNOLOGIES
We use cookies, web beacons, and similar tracking technologies to track the activity on our Service and hold certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier. You can instruct your browser or device to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service. We use tracking technologies to remember your preferences and improve the user experience.

10. INTERNATIONAL DATA TRANSFERS
Your information, including Personal Data, may be processed and maintained on servers located within India in compliance with the Digital Personal Data Protection Act, 2023. If data is transferred outside India, we ensure it is done in accordance with applicable Indian laws and only to jurisdictions that offer an adequate level of data protection. Your consent to this Privacy Policy followed by your submission of such information represents your agreement to that transfer.

11. CHILDREN'S PRIVACY
Our Service does not address anyone under the age of 18 ("Children"). We do not knowingly collect personally identifiable information from anyone under the age of 18. If you are a parent or guardian and you are aware that your Children has provided us with Personal Data, please contact us. If we become aware that we have collected Personal Data from children without verification of parental consent, we take steps to remove that information from our servers.

12. INDIAN PRIVACY RIGHTS (DPDP ACT, 2023)
In accordance with the Digital Personal Data Protection Act, 2023, you have the right to access, correct, update, and erase your personal data. You may also withdraw your consent for data processing at any time. We process your Personal Data because: we need to perform a contract with you, you have given us permission to do so, the processing is in our legitimate interests and it's not overridden by your rights, or to comply with the law. To exercise these rights, please contact our Data Protection Officer through the app.

14. CHANGES TO THIS PRIVACY POLICY
We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.

14. CONTACT US
If you have any questions about this Privacy Policy, the practices of this application, or your dealings with this application, please contact us via email at [EMAIL_ADDRESS] or by mail at Ride Club Privacy Team, Hitech City, Hyderabad, Telangana, India.`;

const PrivacyPolicy = () => {
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
    <div className="fixed inset-0 z-[9999] flex flex-col bg-[#273a5a] text-white overflow-hidden font-sans">
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
            <Shield className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-[20px] font-bold text-white tracking-tight">Privacy Policy</h1>
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

export default PrivacyPolicy;
