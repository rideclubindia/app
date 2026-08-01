import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, AlertTriangle, Shield, CreditCard, Navigation, Smartphone, HelpCircle, ChevronRight, X } from 'lucide-react';
import { auth } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { getDeterministicUuid } from '../lib/user';
import { useToast } from '../components/ToastContext';

const SUPPORT_CATEGORIES = [
  {
    id: 'ride-issues',
    title: 'Ride Issues',
    icon: <AlertTriangle className="w-5 h-5 text-orange-500" />,
    color: 'bg-orange-50',
    faqs: [
      { q: 'My group members are not showing up on the map.', a: 'Ensure that all group members have location permissions enabled on their devices. Also check if the group ride is active.' },
      { q: 'How do I leave a group ride?', a: 'You can leave a ride anytime by going to the Ride details page and tapping the "Leave Ride" button.' }
    ]
  },
  {
    id: 'navigation',
    title: 'Navigation Problems',
    icon: <Navigation className="w-5 h-5 text-blue-500" />,
    color: 'bg-blue-50',
    faqs: [
      { q: 'The map is not updating my location.', a: 'Check your GPS signal. Go to phone settings and set location accuracy to "High".' },
      { q: 'How do I reroute?', a: 'The app will automatically reroute if you deviate from the path. You can also manually select a new destination.' }
    ]
  },
  {
    id: 'account',
    title: 'Account & Login',
    icon: <Shield className="w-5 h-5 text-purple-500" />,
    color: 'bg-purple-50',
    faqs: [
      { q: 'How do I reset my password?', a: 'On the login screen, click "Forgot Password" to receive a password reset link via email.' },
      { q: 'Can I change my registered email?', a: 'Currently, email addresses cannot be changed for security reasons. Contact support if you need a specific change.' }
    ]
  },
  {
    id: 'payment',
    title: 'Payment & Subscriptions',
    icon: <CreditCard className="w-5 h-5 text-green-500" />,
    color: 'bg-green-50',
    faqs: [
      { q: 'How do I upgrade to a premium account?', a: 'Premium features are coming soon. Keep an eye out for updates!' },
      { q: 'Is the app free to use?', a: 'Yes, core features like group rides and basic navigation are free.' }
    ]
  },
  {
    id: 'bug',
    title: 'Report a Bug',
    icon: <Smartphone className="w-5 h-5 text-red-500" />,
    color: 'bg-red-50',
    faqs: [
      { q: 'I found a bug, how do I report it?', a: 'You can report bugs by connecting with our support team using the button below. Please include screenshots if possible.' }
    ]
  },
  {
    id: 'other',
    title: 'Other Issues',
    icon: <HelpCircle className="w-5 h-5 text-gray-500" />,
    color: 'bg-gray-100',
    faqs: [
      { q: 'I have a different question.', a: 'No problem! Tap the connect to support button below to chat with a representative.' }
    ]
  }
];

const SupportCenter = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activeCategory, setActiveCategory] = useState<any>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTickets, setActiveTickets] = useState<any[]>([]);

  useEffect(() => {
    const fetchActiveTickets = async () => {
      const user = auth.currentUser;
      if (!user) return;
      
      const uid = getDeterministicUuid(user.uid);
      const { data } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', uid)
        .in('status', ['Open', 'In Progress'])
        .order('created_at', { ascending: false });
        
      if (data) {
        setActiveTickets(data);
      }
    };
    
    fetchActiveTickets();
  }, []);

  const handleCreateTicket = async (categoryId: string, categoryTitle: string) => {
    const user = auth.currentUser;
    if (!user) {
      showToast('Please login to contact support', 'error');
      return;
    }

    setLoading(true);
    try {
      const uid = getDeterministicUuid(user.uid);
      const { data, error } = await supabase.from('support_tickets').insert({
        user_id: uid,
        user_name: user.displayName || user.email?.split('@')[0] || 'User',
        category: categoryTitle,
        status: 'Open',
        description: `User needs help with ${categoryTitle}`
      }).select().single();

      if (error) throw error;
      
      showToast('Support ticket created', 'success');
      navigate(`/support/${data.id}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to create ticket', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#F2F4F7] flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-4 pb-4 bg-white border-b border-gray-100 flex-shrink-0 flex items-center gap-4 z-10 shadow-sm">
        <button 
          onClick={() => {
            if (activeCategory) {
              setActiveCategory(null);
              setOpenFaq(null);
            } else {
              navigate(-1);
            }
          }} 
          className="w-10 h-10 bg-[#F2F4F7] rounded-full flex items-center justify-center text-[#273a5a] hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-[20px] font-bold text-[#273a5a] leading-tight">Help & Support</h1>
          <p className="text-[12px] text-[#8A8A8E]">Find answers or contact us</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        
        {/* Active Tickets Banner */}
        {activeTickets.length > 0 && !activeCategory && (
          <div className="mb-6">
            <h3 className="text-[13px] font-bold text-[#8A8A8E] uppercase tracking-wider mb-2">Active Conversations</h3>
            <div className="space-y-3">
              {activeTickets.map(ticket => (
                <div 
                  key={ticket.id}
                  onClick={() => navigate(`/support/${ticket.id}`)}
                  className="bg-white p-4 rounded-xl shadow-sm border border-orange-100 flex items-center justify-between cursor-pointer hover:bg-orange-50/30 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                      <h4 className="text-[14px] font-bold text-[#273a5a]">{ticket.category}</h4>
                    </div>
                    <p className="text-[12px] text-[#8A8A8E]">Ticket #{ticket.id.slice(0,6).toUpperCase()} • {ticket.status}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#8A8A8E]" />
                </div>
              ))}
            </div>
          </div>
        )}

        {!activeCategory ? (
          <>
            <h3 className="text-[13px] font-bold text-[#8A8A8E] uppercase tracking-wider mb-3">How can we help?</h3>
            <div className="grid grid-cols-1 gap-3">
              {SUPPORT_CATEGORIES.map(cat => (
                <div 
                  key={cat.id} 
                  onClick={() => setActiveCategory(cat)}
                  className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${cat.color} flex items-center justify-center flex-shrink-0`}>
                      {cat.icon}
                    </div>
                    <h4 className="text-[15px] font-bold text-[#273a5a]">{cat.title}</h4>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#8A8A8E]" />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-lg ${activeCategory.color} flex items-center justify-center`}>
                {activeCategory.icon}
              </div>
              <h3 className="text-[18px] font-bold text-[#273a5a]">{activeCategory.title}</h3>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
              <div className="p-4 bg-gray-50 border-b border-gray-100">
                <h4 className="text-[13px] font-bold text-[#8A8A8E] uppercase tracking-wider">Frequently Asked Questions</h4>
              </div>
              <div className="divide-y divide-gray-100">
                {activeCategory.faqs.map((faq: any, idx: number) => (
                  <div key={idx} className="p-4">
                    <button 
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      className="w-full flex items-start justify-between text-left gap-4"
                    >
                      <h5 className="text-[14px] font-bold text-[#273a5a]">{faq.q}</h5>
                      <ChevronRight className={`w-4 h-4 text-[#8A8A8E] transition-transform ${openFaq === idx ? 'rotate-90' : ''} shrink-0 mt-0.5`} />
                    </button>
                    {openFaq === idx && (
                      <p className="mt-2 text-[13px] text-[#8A8A8E] leading-relaxed pr-8">
                        {faq.a}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-orange-100 text-center">
              <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-6 h-6 text-[#ef4523]" />
              </div>
              <h4 className="text-[16px] font-bold text-[#273a5a] mb-2">Still need help?</h4>
              <p className="text-[13px] text-[#8A8A8E] mb-4">
                Can't find the answer you're looking for? Chat with our support team.
              </p>
              <button
                onClick={() => handleCreateTicket(activeCategory.id, activeCategory.title)}
                disabled={loading}
                className="w-full py-3 bg-[#ef4523] text-white rounded-xl font-bold text-[14px] shadow-sm hover:bg-[#ef4523]/90 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? 'Creating ticket...' : 'Connect to Support Team'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportCenter;
