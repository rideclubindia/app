import React, { useCallback, useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { auth } from '../../lib/firebase';
import { HelpCircle, X, Send, Pin, Trash2, Image as ImageIcon, Search, CheckCircle2, User, Clock, AlertTriangle, Shield, CreditCard, Navigation, Smartphone } from 'lucide-react';
import { useToast } from '../../components/ToastContext';
import { getDeterministicUuid } from '../../lib/user';
import { SearchInput } from '../../components/ui/SearchInput';

const SupportAppContact = () => {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Open' | 'In Progress' | 'Resolved' | 'Closed'>('All');
  
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [adminMessage, setAdminMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchTickets = useCallback(async () => {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load tickets:', error);
      return;
    }
    setTickets(data || []);
    setLoading(false);
  }, []);

  const fetchMessages = async (ticketId: string) => {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (!error && data) setMessages(data);
  };

  useEffect(() => {
    fetchTickets();

    const ticketsChannel = supabase
      .channel('support-tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => {
        fetchTickets();
      })
      .subscribe();

    return () => { ticketsChannel.unsubscribe(); };
  }, [fetchTickets]);

  useEffect(() => {
    if (!selectedTicket?.id) return;
    fetchMessages(selectedTicket.id);

    const messagesChannel = supabase
      .channel(`support-messages-${selectedTicket.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages', filter: `ticket_id=eq.${selectedTicket.id}` }, () => {
        fetchMessages(selectedTicket.id);
      })
      .subscribe();

    return () => { messagesChannel.unsubscribe(); };
  }, [selectedTicket?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendAdminMessage = async () => {
    if (!adminMessage.trim() || !selectedTicket) return;
    setSendingMsg(true);
    
    try {
      const adminUser = auth.currentUser;
      const adminUserId = adminUser?.uid ? getDeterministicUuid(adminUser.uid) : null;
      if (!adminUserId) throw new Error('Not logged in');

      const { error } = await supabase.from('support_messages').insert([{
        ticket_id: selectedTicket.id,
        sender_id: adminUserId,
        sender_name: `Support Team`,
        content: adminMessage.trim(),
        is_admin: true,
      }]);

      if (error) throw error;
      
      // Auto-update status to In Progress if it was Open
      if (selectedTicket.status === 'Open') {
        await handleStatusChange(selectedTicket.id, 'In Progress');
      }

      setAdminMessage('');
    } catch (err) {
      showToast('Failed to send message', 'error');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      if (error) throw error;
      showToast(`Ticket status changed to ${newStatus}`, 'success');
      
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.user_name?.toLowerCase().includes(search.toLowerCase()) || 
      t.category?.toLowerCase().includes(search.toLowerCase()) ||
      t.id?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterStatus === 'All' || t.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getCategoryIcon = (category: string) => {
    if (category.includes('Ride')) return <AlertTriangle className="w-4 h-4" />;
    if (category.includes('Navigation')) return <Navigation className="w-4 h-4" />;
    if (category.includes('Account')) return <Shield className="w-4 h-4" />;
    if (category.includes('Payment')) return <CreditCard className="w-4 h-4" />;
    if (category.includes('Bug')) return <Smartphone className="w-4 h-4" />;
    return <HelpCircle className="w-4 h-4" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-rose-100 text-rose-700';
      case 'In Progress': return 'bg-orange-100 text-orange-700';
      case 'Resolved': return 'bg-emerald-100 text-emerald-700';
      case 'Closed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="flex w-full h-full text-[#273a5a] bg-[#FFFFFF] overflow-hidden font-sans">
      
      {/* Left Sidebar - List */}
      <div className="w-[30%] flex flex-col h-full bg-white relative z-10 border-r border-[#E5E5EA]">
        
        {/* Header */}
        <div className="px-6 pt-3 pb-4 border-b border-[#E5E5EA] shrink-0">
          <div className="flex flex-col gap-2 mb-2">
            <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg self-start">
              {['All', 'Open', 'In Progress', 'Resolved', 'Closed'].map(status => (
                <button 
                  key={status}
                  onClick={() => setFilterStatus(status as any)} 
                  className={`px-2 py-1 text-[10px] font-bold rounded ${filterStatus === status ? 'bg-white shadow text-[#273a5a]' : 'text-gray-500 hover:bg-gray-200'}`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-1 mt-3">
            <div className="flex items-center gap-2 text-blue-500">
              <HelpCircle className="w-5 h-5" />
              <h1 className="text-[20px] font-bold text-[#273a5a]">{tickets.length} Tickets</h1>
            </div>
          </div>
          <p className="text-[12px] text-[#8A8A8E] mb-3">Manage user support and help requests</p>

          <div className="flex gap-2">
            <div className="flex-1">
              <SearchInput 
                variant="admin"
                placeholder="Search user or ticket ID..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto hide-scrollbar bg-[#FFFFFF]">
          <div className="flex flex-col">
            {filteredTickets.length > 0 ? (
              filteredTickets.map(ticket => (
                <div 
                  key={ticket.id} 
                  onClick={() => setSelectedTicket(ticket)}
                  className={`bg-white border-b p-3 flex gap-3 hover:bg-gray-50 transition-colors cursor-pointer group ${selectedTicket?.id === ticket.id ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : 'border-l-4 border-l-transparent border-b-[#E5E5EA]'}`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${getStatusColor(ticket.status)} bg-opacity-20`}>
                    {getCategoryIcon(ticket.category)}
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-[13px] font-bold truncate max-w-[150px]">{ticket.user_name || 'User'}</h3>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </div>
                    
                    <p className="text-[11px] text-[#8A8A8E] truncate mb-1">{ticket.category}</p>
                    
                    <div className="flex items-center gap-1.5 text-[9px] font-medium text-[#8A8A8E]">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(ticket.updated_at).toLocaleDateString()} {new Date(ticket.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-[#8A8A8E] text-[12px] bg-white border-b border-[#E5E5EA]">
                No support tickets found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Ticket Chat & Details */}
      <div className="flex-1 flex flex-col h-full relative z-0 bg-[#F8F9FA]">
        {selectedTicket ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="h-[72px] px-6 bg-white border-b border-[#E5E5EA] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-[16px] font-bold text-[#273a5a] leading-tight">{selectedTicket.user_name || 'User Support'}</h2>
                  <div className="flex items-center gap-2 text-[11px] text-[#8A8A8E] mt-0.5">
                    <span className="font-mono">ID: {selectedTicket.id.slice(0,6).toUpperCase()}</span>
                    <span className="w-1 h-1 bg-[#E5E5EA] rounded-full"></span>
                    <span className="font-semibold text-[#273a5a]">{selectedTicket.category}</span>
                    <span className="w-1 h-1 bg-[#E5E5EA] rounded-full"></span>
                    <span>Created: {new Date(selectedTicket.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select 
                  value={selectedTicket.status}
                  onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                  className={`text-[12px] font-bold px-3 py-1.5 rounded border focus:outline-none ${getStatusColor(selectedTicket.status)}`}
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
                <button
                  onClick={() => { setSelectedTicket(null); setMessages([]); }}
                  className="w-8 h-8 rounded border border-[#E5E5EA] flex items-center justify-center text-[#8A8A8E] hover:bg-gray-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative bg-[#F8F9FA]">
               {/* Chat Area */}
               <div className="flex-1 flex flex-col overflow-hidden relative">
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    
                    {/* Initial Description */}
                    <div className="flex justify-center mb-6">
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 max-w-[85%] text-center">
                        <p className="text-[12px] font-bold text-[#8A8A8E] uppercase tracking-wider mb-2">Issue Description</p>
                        <p className="text-[13px] text-[#273a5a] font-medium">{selectedTicket.description}</p>
                      </div>
                    </div>

                    {messages.length ? (
                      messages.map((message) => {
                        const isAdmin = message.is_admin;
                        return (
                          <div key={message.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-xl px-4 py-3 shadow-sm ${
                              isAdmin ? 'bg-blue-500 text-white rounded-tr-sm' : 'bg-white border border-[#E5E5EA] text-[#273a5a] rounded-tl-sm'
                            }`}>
                              {!isAdmin && (
                                <p className="text-[11px] font-bold text-blue-500 mb-1">{message.sender_name}</p>
                              )}
                              
                              {message.image_url && (
                                <a href={message.image_url} target="_blank" rel="noreferrer">
                                  <img 
                                    src={message.image_url} 
                                    alt="Attachment" 
                                    className="w-full max-w-[300px] rounded-lg mb-2 object-cover border border-black/10 hover:opacity-90 transition-opacity cursor-pointer"
                                  />
                                </a>
                              )}
                              
                              {message.content && (
                                <p className="text-[14px] leading-relaxed break-words">{message.content}</p>
                              )}
                              
                              <p className={`text-[10px] mt-1.5 text-right ${isAdmin ? 'text-white/70' : 'text-[#8A8A8E]'}`}>
                                {new Date(message.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center h-40 text-center text-[#8A8A8E]">
                         <HelpCircle className="w-8 h-8 mb-2 opacity-50" />
                         <p className="text-[13px] font-semibold">No messages yet.</p>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Admin send message bar */}
                  <div className="shrink-0 px-6 pb-6 pt-4 border-t border-[#E5E5EA] bg-white">
                    <div className="flex gap-2">
                      <input
                        value={adminMessage}
                        onChange={e => setAdminMessage(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendAdminMessage()}
                        placeholder={['Resolved', 'Closed'].includes(selectedTicket.status) ? "Ticket closed. Re-open to send message." : "Type your reply..."}
                        disabled={['Resolved', 'Closed'].includes(selectedTicket.status) || sendingMsg}
                        className="flex-1 h-11 px-4 text-[13px] border border-[#E5E5EA] rounded-xl focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                      />
                      <button
                        onClick={handleSendAdminMessage}
                        disabled={['Resolved', 'Closed'].includes(selectedTicket.status) || sendingMsg || !adminMessage.trim()}
                        className="w-11 h-11 rounded-xl bg-blue-500 text-white flex items-center justify-center disabled:opacity-50 hover:bg-blue-600 transition-colors"
                      >
                        <Send className="w-5 h-5 ml-0.5" />
                      </button>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-white shadow-sm border border-[#E5E5EA] flex items-center justify-center mb-4">
              <HelpCircle className="w-8 h-8 text-[#8A8A8E]" />
            </div>
            <h3 className="text-[18px] font-bold text-[#273a5a] mb-2">Support Center</h3>
            <p className="text-[13px] text-[#8A8A8E] max-w-[250px]">Select a support ticket from the list to view its details and reply to the user.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportAppContact;
