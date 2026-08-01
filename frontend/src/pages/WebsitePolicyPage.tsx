import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import WebsitePage from './WebsitePage';

// Fallback texts
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

interface WebsitePolicyPageProps {
  type: 'privacy' | 'terms';
}

const WebsitePolicyPage: React.FC<WebsitePolicyPageProps> = ({ type }) => {
  const [content, setContent] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const title = type === 'privacy' ? 'Privacy Policy' : 'Terms of Service';

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const { data } = await supabase
          .from('cms_policies')
          .select('*')
          .eq('type', type)
          .eq('is_published', true)
          .order('version', { ascending: false })
          .limit(1)
          .single();
          
        if (data && data.content) {
          setContent(data.content);
          setLastUpdated(new Date(data.updated_at).toLocaleDateString());
        } else {
          setContent(type === 'privacy' ? fallbackPrivacyText : fallbackTermsText);
          setLastUpdated(new Date().toLocaleDateString());
        }
      } catch (err) {
        setContent(type === 'privacy' ? fallbackPrivacyText : fallbackTermsText);
        setLastUpdated(new Date().toLocaleDateString());
      }
      setLoading(false);
    };
    
    fetchPolicy();
  }, [type]);

  const renderFormattedContent = (text: string) => {
    // Strip the redundant headers from the top if they exist
    let cleanText = text;
    cleanText = cleanText.replace(/RIDE CLUB PRIVACY POLICY/i, '');
    cleanText = cleanText.replace(/RIDE CLUB TERMS OF SERVICE/i, '');
    cleanText = cleanText.replace(/Last Updated:.*?(\n|$)/i, '');
    cleanText = cleanText.trim();

    return cleanText.split('\n\n').map((block, idx) => {
      if (!block.trim()) return null;
      
      const lines = block.split('\n');
      const isHeader = lines[0].match(/^\d+\.\s/);
      
      if (isHeader) {
        return (
          <div key={idx} style={{ marginBottom: '40px' }}>
            <h3 style={{ 
              fontSize: '22px', 
              fontWeight: '700', 
              color: '#000', 
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '1px solid #eaeaea',
              letterSpacing: '-0.5px'
            }}>
              {lines[0]}
            </h3>
            <div style={{ color: '#4a4a52', whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
              {lines.slice(1).join('\n')}
            </div>
          </div>
        );
      }

      return (
        <div key={idx} style={{ marginBottom: '24px', color: '#4a4a52', whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
          {block}
        </div>
      );
    });
  };

  return (
    <WebsitePage title={title}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#888' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid var(--orange)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }}></div>
          Loading {title}...
        </div>
      ) : (
        <div style={{ fontFamily: 'Inter, sans-serif', padding: '20px 0' }}>
          {renderFormattedContent(content)}
        </div>
      )}
    </WebsitePage>
  );
};

export default WebsitePolicyPage;
