import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Image as ImageIcon, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { auth } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { getDeterministicUuid } from '../lib/user';
import { useToast } from '../components/ToastContext';

const SupportChat = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!ticketId) return;

    const fetchTicketAndMessages = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const uid = getDeterministicUuid(user.uid);

      // Fetch ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .eq('user_id', uid)
        .single();

      if (ticketError || !ticketData) {
        showToast('Ticket not found', 'error');
        navigate('/support');
        return;
      }

      setTicket(ticketData);

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (!messagesError && messagesData) {
        setMessages(messagesData);
      }
      setLoading(false);
    };

    fetchTicketAndMessages();

    // Setup realtime subscription
    const channel = supabase
      .channel(`support_ticket_${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${ticketId}`
        },
        async () => {
          // Re-fetch messages on change
          const { data } = await supabase
            .from('support_messages')
            .select('*')
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true });
            
          if (data) setMessages(data);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [ticketId, navigate, showToast]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showToast('Image must be less than 5MB', 'error');
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedImage) || sending) return;
    
    setSending(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      
      const uid = getDeterministicUuid(user.uid);
      let imageUrl = null;

      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${uid}_${Date.now()}.${fileExt}`;
        const filePath = `${ticketId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('support_attachments')
          .upload(filePath, selectedImage);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('support_attachments')
          .getPublicUrl(filePath);
          
        imageUrl = publicUrlData.publicUrl;
      }

      const { error } = await supabase.from('support_messages').insert({
        ticket_id: ticketId,
        sender_id: uid,
        sender_name: user.displayName || user.email?.split('@')[0] || 'User',
        content: newMessage.trim(),
        image_url: imageUrl,
        is_admin: false
      });

      if (error) throw error;

      setNewMessage('');
      removeImage();
    } catch (err: any) {
      console.error(err);
      showToast('Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="w-full h-full bg-[#F2F4F7] flex items-center justify-center">Loading...</div>;
  }

  const isClosed = ticket?.status === 'Closed' || ticket?.status === 'Resolved';

  return (
    <div className="w-full h-full bg-[#F2F4F7] flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <div className="h-[72px] px-4 bg-white border-b border-[#E5E5EA] flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/support')} className="w-10 h-10 bg-[#F2F4F7] rounded-full flex items-center justify-center text-[#273a5a] hover:bg-gray-200 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-[16px] font-bold text-[#273a5a] leading-tight flex items-center gap-2">
              {ticket?.category}
            </h1>
            <div className="flex items-center gap-2 text-[11px] text-[#8A8A8E] mt-0.5">
              <span className="font-mono">#{ticket?.id?.slice(0,6).toUpperCase()}</span>
              <span className="w-1 h-1 bg-[#E5E5EA] rounded-full"></span>
              <span className={`font-bold ${isClosed ? 'text-green-500' : 'text-orange-500'}`}>
                {ticket?.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Initial Ticket Description */}
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 max-w-[85%] text-center">
            <p className="text-[12px] font-bold text-[#8A8A8E] uppercase tracking-wider mb-2">Ticket Created</p>
            <p className="text-[13px] text-[#273a5a] font-medium">{ticket?.description}</p>
            <p className="text-[10px] text-[#8A8A8E] mt-2">{new Date(ticket?.created_at).toLocaleString()}</p>
          </div>
        </div>

        {messages.map((msg) => {
          const isMe = !msg.is_admin;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                isMe ? 'bg-[#ef4523] text-white rounded-tr-sm' : 'bg-white border border-[#E5E5EA] text-[#273a5a] rounded-tl-sm'
              }`}>
                {!isMe && (
                  <p className="text-[11px] font-bold text-[#8A8A8E] mb-1">Support Agent</p>
                )}
                
                {msg.image_url && (
                  <img 
                    src={msg.image_url} 
                    alt="Attachment" 
                    className="w-full max-w-[250px] rounded-lg mb-2 object-cover border border-black/10"
                  />
                )}
                
                {msg.content && (
                  <p className="text-[14px] leading-relaxed break-words">{msg.content}</p>
                )}
                
                <p className={`text-[10px] mt-1.5 text-right ${isMe ? 'text-white/70' : 'text-[#8A8A8E]'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {isClosed ? (
        <div className="shrink-0 p-4 bg-white border-t border-[#E5E5EA] flex items-center justify-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <span className="text-[13px] font-bold text-[#273a5a]">This ticket has been resolved.</span>
        </div>
      ) : (
        <div className="shrink-0 bg-white border-t border-[#E5E5EA]">
          {imagePreview && (
            <div className="p-3 border-b border-[#E5E5EA] bg-gray-50 flex items-start">
              <div className="relative inline-block">
                <img src={imagePreview} alt="Preview" className="h-20 w-auto rounded-lg border border-gray-200 object-cover" />
                <button 
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
          <div className="p-3 px-4 flex items-end gap-2">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImageSelect}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full text-[#8A8A8E] hover:bg-gray-100 transition-colors"
            >
              <ImageIcon className="w-6 h-6" />
            </button>
            <div className="flex-1 bg-[#F2F4F7] rounded-2xl px-4 py-2 border border-transparent focus-within:border-[#ef4523] focus-within:bg-white transition-all">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type a message..."
                className="w-full bg-transparent text-[14px] text-[#273a5a] resize-none focus:outline-none max-h-24 min-h-[24px]"
                rows={1}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={(!newMessage.trim() && !selectedImage) || sending}
              className="w-10 h-10 shrink-0 bg-[#ef4523] text-white rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-[#ef4523]/90 transition-colors"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportChat;
