import React, { useState, useEffect, useRef } from 'react';
import { Search, Users, MessageSquare, Plus, ArrowLeft, Check, X, Send, Lock, Globe, MapPin, Clock, Copy, AlertTriangle, Flag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useToast } from '../components/ToastContext';
import { SearchInput } from '../components/ui/SearchInput';
import { useConfirm } from '../components/ConfirmDialog';
import { getDeterministicUuid } from '../lib/user';

const Groups = () => {
    const confirm = useConfirm();

  const navigate = useNavigate();
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [groups, setGroups] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [activeGroup, setActiveGroup] = useState<any | null>(null);
  const [memberStatus, setMemberStatus] = useState<string | null>(null);
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [showChatSearch, setShowChatSearch] = useState(false);
  
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [showRequests, setShowRequests] = useState(false);
  
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showAlerts, setShowAlerts] = useState(false);
  const [groupAlerts, setGroupAlerts] = useState<any[]>([]);
  const [viewedAlerts, setViewedAlerts] = useState<Map<string, number>>(new Map());

  // Create Group Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupParams, setNewGroupParams] = useState({
    name: '',
    radius: 10,
    isPrivate: false,
    passcode: ''
  });

  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchGroups(currentUser);
      } else {
        navigate('/login');
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (activeGroup) {
      checkMembership();
      fetchMessages();
      fetchRequests();
      fetchMembers();
      fetchGroupAlerts();

      // Subscribe to messages (realtime might be disabled on DB)
      const channel = supabase.channel('messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `group_id=eq.${activeGroup.id}` }, (payload) => {
          setMessages(prev => [...prev, payload.new]);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        })
        .subscribe();

      // Fallback polling for live chat every 2 seconds
      const interval = setInterval(() => {
        fetchMessages();
      }, 2000);

      return () => { 
        supabase.removeChannel(channel); 
        clearInterval(interval);
      };
    }
  }, [activeGroup]);

  const handleSetup = () => {}; // deprecated

  const fetchGroups = async (currentUser?: any) => {
    const activeUser = currentUser || auth.currentUser || user;
    try {
      let query = supabase.from('groups').select('*, group_members(count)').order('created_at', { ascending: false });
      
      if (activeUser) {
        const { data: memberData } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', activeUser.uid);
          
        if (memberData && memberData.length > 0) {
          const groupIds = memberData.map(m => m.group_id);
          query = query.or(`is_private.eq.false,id.in.(${groupIds.join(',')})`);
        } else {
          query = query.eq('is_private', false);
        }
      } else {
        query = query.eq('is_private', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (data) setGroups(data);
    } catch (e) {
      showToast('Failed to fetch groups', 'error');
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length === 5) {
      try {
        const { data, error } = await supabase.from('groups')
          .select('*, group_members(count)')
          .ilike('id', `${query.trim()}%`);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setGroups(prev => {
            const newGroups = [...prev];
            data.forEach(g => {
              if (!newGroups.some(existing => existing.id === g.id)) newGroups.push(g);
            });
            return newGroups;
          });
        }
      } catch (e) {
        showToast('Failed to search groups', 'error');
      }
    }
  };

  const checkMembership = async () => {
    if (!activeGroup || !user) return;
    try {
      const { data, error } = await supabase.from('group_members').select('status').eq('group_id', activeGroup.id).eq('user_id', user.uid).single();
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is not found
      if (data) setMemberStatus(data.status);
      else setMemberStatus(null);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMessages = async () => {
    if (!activeGroup) return;
    try {
      const { data, error } = await supabase.from('messages')
        .select('*')
        .eq('group_id', activeGroup.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      if (data) {
        const sortedData = data.reverse();
        setMessages(prev => {
          if (prev.length !== sortedData.length) {
            setTimeout(() => messagesEndRef.current?.scrollIntoView(), 100);
          }
          return sortedData;
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRequests = async () => {
    if (!activeGroup || !user || activeGroup.admin_id !== user.uid) return;
    try {
      const { data, error } = await supabase.from('group_members').select('*').eq('group_id', activeGroup.id).eq('status', 'pending');
      if (error) throw error;
      if (data) setPendingRequests(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMembers = async () => {
    if (!activeGroup) return;
    try {
      const { data, error } = await supabase.from('group_members').select('*').eq('group_id', activeGroup.id).in('status', ['accepted', 'admin']);
      if (error) throw error;
      if (data) setGroupMembers(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchGroupAlerts = async () => {
    if (!activeGroup) return;
    try {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase.from('pins').select('*').eq('status', 'active').eq('group_id', activeGroup.id).gte('created_at', twoHoursAgo).order('created_at', { ascending: false });
      if (error) throw error;
      
      if (user) {
        const { data: views } = await supabase.from('alert_views').select('*').eq('user_id', user.uid);
        if (views) {
          const map = new Map<string, number>();
          views.forEach(v => map.set(v.pin_id, Number(v.viewed_at)));
          setViewedAlerts(map);
        }
      }

      if (data) setGroupAlerts(data);
    } catch (e) {
      console.error(e);
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const { error } = await supabase.from('group_members').delete().eq('id', memberId);
      if (error) throw error;
      fetchMembers();
      showToast('Member removed successfully', 'success');
    } catch (e) {
      showToast('Failed to remove member', 'error');
    }
  };

  const isAdmin = activeGroup && user ? (activeGroup.admin_id === user.uid || memberStatus === 'admin') : false;
  const groupAdminsCount = 1 + groupMembers.filter(m => m.status === 'admin' && m.user_id !== activeGroup?.admin_id).length;

  const toggleAdmin = async (member: any) => {
    if (member.user_id === activeGroup.admin_id) return;
    const isCurrentlyAdmin = member.status === 'admin';
    
    try {
      if (isCurrentlyAdmin) {
        const { error } = await supabase.from('group_members').update({ status: 'accepted' }).eq('id', member.id);
        if (error) throw error;
        showToast('Admin role removed', 'success');
      } else {
        if (groupAdminsCount >= 3) {
          showToast("Maximum of 3 admins allowed per group.", 'error');
          return;
        }
        const { error } = await supabase.from('group_members').update({ status: 'admin' }).eq('id', member.id);
        if (error) throw error;
        showToast('User promoted to Admin', 'success');
      }
      fetchMembers();
      setSelectedMember(null);
    } catch (e) {
      showToast('Failed to update admin role', 'error');
    }
  };

  const copyGroupInvite = () => {
    if (!activeGroup) return;
    const inviteText = `Join my group on Ride Club!\nGroup Name: ${activeGroup.name}\nGroup ID: ${activeGroup.id}${activeGroup.is_private ? `\nPasscode: ${activeGroup.passcode}` : ''}`;
    navigator.clipboard.writeText(inviteText);
    showToast('Invite details copied to clipboard!', 'success');
  };

  const deleteGroup = async () => {
    if (!activeGroup || !isAdmin) return;
    const ok = await confirm({ title: 'Delete Group', message: `"${activeGroup.name}" and all its messages will be permanently removed.`, confirmLabel: 'Delete', variant: 'danger' });
    if (!ok) return;
    try {
      const { error } = await supabase.from('groups').delete().eq('id', activeGroup.id);
      if (error) throw error;
      setActiveGroup(null);
      setShowMembers(false);
      fetchGroups();
      showToast('Group deleted successfully', 'success');
    } catch (e) {
      showToast('Failed to delete group', 'error');
    }
  };

  const createGroup = async () => {
    if (!newGroupParams.name.trim() || !user) return;
    setIsCreating(true);
    
    try {
      const { data, error } = await supabase.from('groups').insert({ 
        name: newGroupParams.name, 
        admin_id: user.uid,
        radius: newGroupParams.radius,
        is_private: newGroupParams.isPrivate,
        passcode: newGroupParams.isPrivate ? newGroupParams.passcode : null
      }).select().single();
      
      if (error) throw error;
      
      if (data) {
        const uName = user.displayName || user.email?.split('@')[0] || 'Unknown';
        await supabase.from('group_members').insert({ group_id: data.id, user_id: user.uid, username: uName, status: 'accepted' });
        setShowCreateModal(false);
        setNewGroupParams({ name: '', radius: 10, isPrivate: false, passcode: '' });
        fetchGroups();
        setActiveGroup(data);
        showToast('Group created successfully', 'success');
      }
    } catch (e) {
      showToast('Failed to create group', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const joinGroup = async () => {
    if (!activeGroup || !user) return;
    
    if (activeGroup.is_private) {
      const code = prompt("This is a private group. Enter Passcode:");
      if (code !== activeGroup.passcode) {
        showToast("Incorrect passcode!", 'error');
        return;
      }
    }
    
    setIsJoining(true);
    try {
      const uName = user.displayName || user.email?.split('@')[0] || 'Unknown';
      const { error } = await supabase.from('group_members').insert({ group_id: activeGroup.id, user_id: user.uid, username: uName, status: 'pending' });
      if (error) throw error;
      checkMembership();
      showToast('Join request sent', 'success');
    } catch (e) {
      showToast('Failed to join group', 'error');
    } finally {
      setIsJoining(false);
    }
  };

  const handleRequest = async (reqId: string, accept: boolean) => {
    try {
      if (accept) {
        await supabase.from('group_members').update({ status: 'accepted' }).eq('id', reqId);
        showToast('Request accepted', 'success');
      } else {
        await supabase.from('group_members').delete().eq('id', reqId);
        showToast('Request rejected', 'info');
      }
      fetchRequests();
    } catch (e) {
      showToast('Action failed', 'error');
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeGroup || !user) return;
    const content = newMessage;
    setNewMessage('');
    try {
      const uName = user.displayName || user.email?.split('@')[0] || 'Unknown';
      const { error } = await supabase.from('messages').insert({ group_id: activeGroup.id, user_id: getDeterministicUuid(user.uid), username: uName, content });
      if (error) throw error;
    } catch (e) {
      showToast('Failed to send message', 'error');
    }
  };

  if (loadingAuth || !user) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (activeGroup) {
    const isAccepted = memberStatus === 'accepted' || isAdmin;
    
    if (showMembers) {
      return (
        <div className="w-full h-full bg-[#F2F4F7] flex flex-col font-sans relative">
          {/* Header Buttons */}
          <div className="flex items-center justify-between p-2 shrink-0 pt-8">
            <button onClick={() => setShowMembers(false)} className="w-[44px] h-[44px] bg-[#E5E5EA] flex items-center justify-center rounded-full hover:bg-[#D1D1D6] transition-colors">
              <ArrowLeft className="w-5 h-5 text-[#273a5a]" strokeWidth={2.5} />
            </button>
            <div className="flex items-center gap-3">
              <button onClick={copyGroupInvite} className="w-[44px] h-[44px] bg-[#E5E5EA] flex items-center justify-center rounded-full hover:bg-[#D1D1D6] transition-colors" title="Invite User">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg>
              </button>
              <button className="w-[44px] h-[44px] bg-[#E5E5EA] flex items-center justify-center rounded-full hover:bg-[#D1D1D6] transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-5 pb-6 hide-scrollbar">
            {/* Group Info */}
            <div className="flex items-center gap-4 mb-6 mt-2">
              <div className="relative w-[72px] h-[72px] bg-[#FFF0E6] rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-[#ef4523] font-bold text-[24px]">
                  {activeGroup.name.split(' ').map((n:string)=>n[0]).join('').substring(0,2).toUpperCase()}
                </span>
                <div className="absolute top-0 right-0 w-[16px] h-[16px] bg-[#ef4523] rounded-full border-[3px] border-[#F2F4F7] translate-x-1.5 -translate-y-1.5"></div>
              </div>
              <div>
                <h1 className="font-bold text-[22px] text-[#273a5a] leading-tight mb-2">{activeGroup.name}</h1>
                <div className="flex items-center gap-2">
                  <span className="bg-[#E5E5EA] text-[#8A8A8E] px-2.5 py-1 rounded-full text-[11px] font-bold uppercase flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line></svg>
                    GRP-{activeGroup.id.substring(0, 4)}
                  </span>
                  <span className="bg-[#E5E5EA] text-[#8A8A8E] px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {activeGroup.radius} km
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Boxes */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              <div className="bg-[#FFF0E6] rounded-lg py-3 flex flex-col items-center justify-center shadow-sm">
                <span className="text-[#ef4523] font-bold text-[20px] leading-tight mb-0.5">{groupMembers.length}</span>
                <span className="text-[#8A8A8E] font-medium text-[11px]">Members</span>
              </div>
              <div className="bg-[#E5E5EA] rounded-lg py-3 flex flex-col items-center justify-center shadow-sm">
                <span className="text-[#273a5a] font-bold text-[20px] leading-tight mb-0.5">{Math.max(0, groupMembers.length - 1)}</span>
                <span className="text-[#8A8A8E] font-medium text-[11px]">Active</span>
              </div>
              <div onClick={() => setShowAlerts(true)} className="bg-[#E5E5EA] rounded-lg py-3 flex flex-col items-center justify-center shadow-sm cursor-pointer hover:bg-[#D1D1D6] transition-colors">
                <span className="text-[#273a5a] font-bold text-[20px] leading-tight mb-0.5">
                  {groupAlerts.filter(a => !(viewedAlerts.has(a.id) && Date.now() - viewedAlerts.get(a.id)! > 12 * 60 * 60 * 1000)).length}
                </span>
                <span className="text-[#8A8A8E] font-medium text-[11px]">Alerts</span>
              </div>
              <div className="bg-[#E5E5EA] rounded-lg py-3 flex flex-col items-center justify-center shadow-sm">
                <span className="text-[#273a5a] font-bold text-[20px] leading-tight mb-0.5">{1 + groupMembers.filter(m => m.status === 'admin' && m.user_id !== activeGroup.admin_id).length}</span>
                <span className="text-[#8A8A8E] font-medium text-[11px]">Admin</span>
              </div>
            </div>

            {/* Search */}
            <div className="mb-6">
              <SearchInput 
                variant="app"
                placeholder="Search members..." 
              />
            </div>

            {/* Member List Header */}
            <div className="flex justify-between items-center mb-4 px-1">
              <span className="text-[12px] font-bold text-[#8A8A8E] tracking-wider uppercase">All Members</span>
              <span className="text-[12px] font-bold text-[#ef4523]">{groupMembers.length} of {groupMembers.length}</span>
            </div>

            {/* Member List */}
            <div className="flex flex-col gap-3">
              {groupMembers.map(member => (
                <div key={member.id} className="bg-white p-4 rounded-lg shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between cursor-pointer border border-transparent active:border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="relative w-[52px] h-[52px] bg-[#E5E5EA] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-[#8A8A8E] font-bold text-[18px]">{member.username.substring(0,2).toUpperCase()}</span>
                      <div className={`absolute bottom-0 right-0 w-[14px] h-[14px] rounded-full border-[2px] border-white ${member.user_id === activeGroup.admin_id ? 'bg-[#34C759]' : 'bg-[#FF3B30]'}`}></div>
                    </div>
                    <div className="flex flex-col justify-center">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#273a5a] text-[16px]">{member.username}</span>
                        {member.user_id === activeGroup.admin_id && (
                          <span className="bg-[#FFF0E6] text-[#ef4523] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Admin</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isAdmin && (
                      <button onClick={(e) => { e.stopPropagation(); setSelectedMember(member); }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8A8A8E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                      </button>
                    )}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8A8A8E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                  </div>
                </div>
              ))}
            </div>
            {/* Delete Group Button for Admins */}
            {isAdmin && (
              <div className="mt-8 mb-4">
                <button onClick={deleteGroup} className="w-full py-4 bg-[#FFEBEE] rounded-lg font-bold text-[#FF3B30] text-center border border-transparent active:border-[#FF3B30] transition-colors">
                  Delete Group
                </button>
              </div>
            )}
          </div>

          {/* User Options Bottom Sheet */}
          {selectedMember && (
            <div className="absolute inset-0 bg-[#273a5a]/50 z-50 flex items-end">
              <div className="w-full bg-white rounded-t-lg p-6 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-[18px] text-[#273a5a]">Manage {selectedMember.username}</h3>
                  <button onClick={() => setSelectedMember(null)} className="w-8 h-8 bg-[#F2F2F7] rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                    <X className="w-4 h-4 text-[#273a5a]" strokeWidth={2.5}/>
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  {isAdmin && selectedMember.user_id !== activeGroup.admin_id && (
                    <button onClick={() => toggleAdmin(selectedMember)} className="w-full py-4 bg-[#F2F2F7] rounded-lg font-bold text-[#273a5a] text-center hover:bg-[#E5E5EA] transition-colors">
                      {selectedMember.status === 'admin' ? 'Remove Admin' : 'Make Admin'}
                    </button>
                  )}
                  {isAdmin && selectedMember.user_id !== user.uid && selectedMember.user_id !== activeGroup.admin_id && (
                    <button onClick={() => { removeMember(selectedMember.id); setSelectedMember(null); }} className="w-full py-4 bg-[#FFEBEE] rounded-lg font-bold text-[#FF3B30] text-center hover:bg-[#FFD1D6] transition-colors">
                      Remove User
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Alerts View */}
          {showAlerts && (
            <div className="absolute inset-0 bg-white z-40 flex flex-col pb-[100px] animate-in fade-in slide-in-from-bottom-10 duration-300">
              <div className="flex items-center p-2 pt-8 border-b border-[#E5E5EA]">
                <button onClick={() => setShowAlerts(false)} className="w-[44px] h-[44px] bg-[#E5E5EA] flex items-center justify-center rounded-full hover:bg-[#D1D1D6] transition-colors mr-4">
                  <ArrowLeft className="w-5 h-5 text-[#273a5a]" strokeWidth={2.5} />
                </button>
                <h2 className="font-bold text-[20px] text-[#273a5a]">Group Alerts</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-5 bg-[#F2F4F7]">
                {groupAlerts.filter(a => !(viewedAlerts.has(a.id) && Date.now() - viewedAlerts.get(a.id)! > 12 * 60 * 60 * 1000)).length === 0 ? (
                  <p className="text-[#8A8A8E] text-center mt-10 font-medium">No alerts created in this group yet.</p>
                ) : (
                  groupAlerts.filter(a => !(viewedAlerts.has(a.id) && Date.now() - viewedAlerts.get(a.id)! > 12 * 60 * 60 * 1000)).map(alert => (
                    <div key={alert.id} className="bg-white p-4 rounded-lg mb-3 shadow-sm border border-gray-100">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-[#273a5a] text-[16px]">{alert.title}</span>
                        <span className="bg-[#FFF0E6] text-[#ef4523] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">{alert.category}</span>
                      </div>
                      <p className="text-[#8A8A8E] text-[12px] font-medium">Created by: {groupMembers.find(m => m.user_id === alert.user_id)?.username || (alert.user_id === user?.uid ? 'You' : 'Unknown')}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="w-full h-full bg-[#F2F4F7] flex flex-col font-sans relative">
        {/* Chat Header */}
        <div className="h-[76px] bg-white border-b border-[#E5E5EA] flex items-center justify-between px-4 shrink-0 shadow-sm z-10 pt-2">
          <div className="flex items-center gap-3">
            <button aria-label="Go back" onClick={() => { setActiveGroup(null); setShowRequests(false); }} className="w-[40px] h-[40px] bg-[#F2F2F7] flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors">
              <ArrowLeft className="w-5 h-5 text-[#273a5a]" strokeWidth={2.5} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-[44px] h-[44px] bg-[#FFF0E6] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-[#ef4523] font-bold text-[14px]">
                  {activeGroup.name.split(' ').map((n:string)=>n[0]).join('').substring(0,2).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="font-bold text-[16px] text-[#273a5a] leading-tight">{activeGroup.name}</h2>
                <p className="text-[12px] font-medium text-[#8A8A8E]">{groupMembers.length} members</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button aria-label="Search" onClick={() => { setShowChatSearch(!showChatSearch); setChatSearchQuery(''); }} className={`w-[40px] h-[40px] flex items-center justify-center rounded-full transition-colors ${showChatSearch ? 'bg-[#273a5a] text-white' : 'bg-[#F2F2F7] text-[#273a5a] hover:bg-gray-200'}`}>
              <Search className="w-5 h-5" />
            </button>
            <button aria-label="Toggle group members" onClick={() => { setShowMembers(!showMembers); setShowRequests(false); }} className={`w-[40px] h-[40px] flex items-center justify-center rounded-full transition-colors ${showMembers ? 'bg-[#273a5a] text-white' : 'bg-[#F2F2F7] text-[#273a5a] hover:bg-gray-200'}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative flex flex-col bg-[#F2F4F7]">
          {showRequests ? (
            <div className="p-4 h-full overflow-y-auto">
              <h3 className="text-[14px] font-bold text-[#8A8A8E] mb-4 uppercase tracking-wider">Pending Join Requests</h3>
              {pendingRequests.length === 0 ? <p className="text-[#8A8A8E] font-medium text-center mt-10">No pending requests.</p> : null}
              {pendingRequests.map(req => (
                <div key={req.id} className="bg-white p-4 rounded-lg shadow-[0_2px_10px_rgba(0,0,0,0.02)] mb-3 flex items-center justify-between border border-gray-100">
                  <span className="font-bold text-[#273a5a] text-[15px]">{req.username}</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleRequest(req.id, false)} className="w-9 h-9 rounded-full bg-[#FFEBEE] text-[#FF3B30] flex items-center justify-center transition-colors hover:opacity-80"><X className="w-4 h-4" strokeWidth={2.5} /></button>
                    <button onClick={() => handleRequest(req.id, true)} className="w-9 h-9 rounded-full bg-[#E5F9ED] text-[#34C759] flex items-center justify-center transition-colors hover:opacity-80"><Check className="w-4 h-4" strokeWidth={2.5} /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : isAccepted ? (
            <>
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto px-4 pt-4 pb-[80px] flex flex-col gap-4">
                <div className="flex items-center justify-center mb-2 mt-2">
                   <div className="h-[1px] flex-1 bg-[#E5E5EA]"></div>
                   <span className="px-3 text-[11px] font-bold text-[#8A8A8E] uppercase tracking-wider">Today</span>
                   <div className="h-[1px] flex-1 bg-[#E5E5EA]"></div>
                </div>

                {showChatSearch && (
                  <div className="px-4 py-2 bg-white border-b border-[#E5E5EA]">
                    <div className="relative">
                      <Search className="w-5 h-5 text-[#8A8A8E] absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input 
                        type="text" 
                        placeholder="Search messages..." 
                        value={chatSearchQuery}
                        onChange={(e) => setChatSearchQuery(e.target.value)}
                        className="w-full bg-[#F2F2F7] rounded-full py-2 pl-10 pr-4 text-[#273a5a] font-medium outline-none placeholder:text-[#8A8A8E]"
                      />
                    </div>
                  </div>
                )}
                
                {messages.filter(m => m.content.toLowerCase().includes(chatSearchQuery.toLowerCase())).map(msg => {
                  const isMe = msg.user_id === user.uid;
                  return (
                    <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {!isMe && (
                        <div className="w-[32px] h-[32px] bg-[#E5E5EA] rounded-full flex items-center justify-center mr-2 flex-shrink-0 self-end mb-4">
                          <span className="text-[12px] font-bold text-[#8A8A8E]">{msg.username.substring(0,1).toUpperCase()}</span>
                        </div>
                      )}
                      <div className={`flex flex-col ${msg.content.startsWith('🚨 New Report:') ? 'max-w-[95%]' : 'max-w-[75%]'} ${isMe ? 'items-end' : 'items-start'}`}>
                        {!isMe && <span className="text-[11px] font-bold text-[#8A8A8E] mb-1 ml-1">{msg.username}</span>}
                        <div className={`px-4 py-3 text-[15px] shadow-[0_2px_10px_rgba(0,0,0,0.04)] leading-snug ${msg.content.startsWith('🚨 New Report:') ? 'bg-white text-[#273a5a] rounded-2xl border border-gray-100 w-full' : isMe ? 'bg-[#ef4523] text-white rounded-t-2xl rounded-bl-2xl rounded-br-sm font-medium' : 'bg-white text-[#273a5a] rounded-t-2xl rounded-br-2xl rounded-bl-sm font-medium'}`}>
                          {(() => {
                            if (msg.content.startsWith('🚨 New Report:')) {
                              let textPart = msg.content;
                              let photoUrl = '';
                              let incidentId = '';
                              
                              if (textPart.includes('|||ID=')) {
                                const parts = textPart.split('|||ID=');
                                textPart = parts[0];
                                incidentId = parts[1];
                              }

                              if (textPart.includes('|||IMG=')) {
                                const parts = textPart.split('|||IMG=');
                                textPart = parts[0];
                                photoUrl = parts[1];
                              }
                              
                              let incidentCategory = 'Alert';
                              let incidentDescription = 'Reported by community';
                              const colonIndex = textPart.indexOf(': ');
                              if (colonIndex !== -1) {
                                const detailPart = textPart.substring(colonIndex + 2);
                                const dashIndex = detailPart.indexOf(' - ');
                                if (dashIndex !== -1) {
                                  incidentCategory = detailPart.substring(0, dashIndex).trim();
                                  incidentDescription = detailPart.substring(dashIndex + 3).trim();
                                } else {
                                  incidentCategory = detailPart.trim();
                                }
                              }
                              
                              let IconComp = AlertTriangle;
                              let tagText = "Alert";
                              let tagColor = "text-[#ef4523] bg-[#FFF0E6]";
                              
                              if (incidentCategory === 'Accident') {
                                tagText = "Accident";
                              } else if (incidentCategory === 'Police' || incidentCategory === 'Vibe Check') {
                                IconComp = Flag;
                                tagText = "Check";
                              } else if (incidentCategory === 'Road Closed') {
                                tagText = "Closed";
                              }
                              
                              const minAgo = Math.round((Date.now() - new Date(msg.created_at).getTime()) / 60000);
                              const timeText = minAgo < 60 ? `${minAgo} min ago` : `${Math.floor(minAgo/60)} hr ago`;

                              return (
                                <div className="flex flex-col gap-3 w-full" onClick={() => incidentId ? navigate(`/incident/${incidentId}`) : null} style={{ cursor: incidentId ? 'pointer' : 'default' }}>
                                  <div className="flex items-start justify-between gap-3 w-full">
                                    <div className="flex items-start gap-3">
                                      <div className={`w-[40px] h-[40px] sm:w-[48px] sm:h-[48px] rounded-[12px] sm:rounded-[16px] bg-[#FFF0E6] flex items-center justify-center shrink-0`}>
                                        <IconComp className="w-5 h-5 text-[#ef4523]" />
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                          <h4 className="font-bold text-[14px] sm:text-[15px] text-[#273a5a]">{incidentCategory || 'Road Alert'}</h4>
                                          <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold ${tagColor}`}>{tagText}</span>
                                        </div>
                                        <p className="text-[12px] sm:text-[13px] text-[#273a5a] font-medium mt-0.5 line-clamp-2">{incidentDescription}</p>
                                        <p className="text-[10px] sm:text-[11px] text-gray-400 font-medium mt-1 sm:mt-1.5 flex items-center gap-1.5">
                                          <MapPin className="w-3 h-3" /> Nearby • {timeText}
                                        </p>
                                      </div>
                                    </div>
                                    <button className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-[#FFF0E6] text-[#ef4523] rounded-[10px] sm:rounded-[12px] text-[10px] sm:text-[11px] font-bold hover:bg-orange-100 transition-colors shrink-0">
                                      View
                                    </button>
                                  </div>
                                  {photoUrl && (
                                    <img src={photoUrl} alt="Attached" className="w-full rounded-lg max-h-48 object-cover mt-1 border border-black/5" />
                                  )}
                                </div>
                              );
                            }
                            
                            return msg.content.includes('|||IMG=') ? (
                              <div className="flex flex-col gap-2">
                                <span>{msg.content.split('|||IMG=')[0]}</span>
                                <img src={msg.content.split('|||IMG=')[1]} alt="Attached" className="w-full rounded-lg max-h-48 object-cover" />
                              </div>
                            ) : (
                              msg.content
                            );
                          })()}
                        </div>
                        <span className={`text-[10px] font-medium text-[#8A8A8E] mt-1 ${isMe ? 'mr-1 flex items-center gap-1' : 'ml-1'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          {isMe && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Input Area */}
              <div className="absolute bottom-4 left-4 right-4">
                <form onSubmit={sendMessage} className="bg-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-2 flex items-center gap-2 border border-gray-100">
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Message the group..." 
                    className="flex-1 h-[40px] bg-transparent px-4 outline-none font-medium text-[#273a5a] placeholder-[#8A8A8E]"
                  />
                  <button type="submit" disabled={!newMessage.trim()} aria-label="Send message" className="w-[40px] h-[40px] bg-[#ef4523] rounded-full flex items-center justify-center text-white shrink-0 disabled:opacity-50 transition-transform active:scale-95 shadow-sm">
                    <Send className="w-5 h-5 ml-0.5" strokeWidth={2.5} />
                  </button>
                </form>
              </div>
            </>
          ) : memberStatus === 'pending' ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 bg-[#FFF0E6] rounded-full flex items-center justify-center mb-6">
                <Clock className="w-10 h-10 text-[#ef4523]" strokeWidth={2} />
              </div>
              <h3 className="text-[22px] font-bold text-[#273a5a] mb-2">Request Pending</h3>
              <p className="text-[15px] text-[#8A8A8E]">Waiting for the group admin to accept your request.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 bg-[#FFF0E6] rounded-full flex items-center justify-center mb-6">
                <Users className="w-10 h-10 text-[#ef4523]" strokeWidth={2} />
              </div>
              <h3 className="text-[22px] font-bold text-[#273a5a] mb-2">Join {activeGroup.name}</h3>
              <p className="text-[15px] text-[#8A8A8E] mb-4">You need to join this group to see the chat.</p>
              <button disabled={isJoining} onClick={joinGroup} className="w-full h-14 bg-[#ef4523] text-white font-bold text-[16px] rounded-lg active:scale-95 shadow-lg shadow-[#ef4523]/30 transition-transform flex items-center justify-center disabled:opacity-70">
                {isJoining ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  "Request to Join"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    g.id.toLowerCase().startsWith(searchQuery.trim().toLowerCase())
  );

  return (
    <div className="w-full h-full bg-[#F2F4F7] flex flex-col overflow-hidden pb-[100px]">
      <div className="px-5 pt-4 pb-4 shrink-0 bg-white border-b border-gray-100 shadow-sm z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[13px] font-bold text-[#8A8A8E] tracking-wider mb-0.5 uppercase">Community</p>
            <h1 className="text-[22px] font-bold text-[#273a5a] leading-none tracking-tight">Groups</h1>
          </div>
          <button aria-label="Create new group" onClick={() => setShowCreateModal(true)} className="w-[48px] h-[48px] bg-[#ef4523] text-white rounded-full flex items-center justify-center hover:bg-[#ef4523] active:scale-95 transition-all shadow-md">
            <Plus className="w-6 h-6" strokeWidth={2.5} />
          </button>
        </div>
        
        <div className="mt-2">
          <SearchInput 
            variant="app"
            placeholder="Search groups..." 
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="px-5 my-2 flex justify-between items-center shrink-0">
        <h2 className="text-[12px] font-bold text-[#8A8A8E] uppercase tracking-wider">Your Groups</h2>
        <span className="text-[12px] font-bold text-[#ef4523]">{filteredGroups.length} total</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-3 hide-scrollbar">
        {filteredGroups.length === 0 ? (
          <div className="text-center text-[#8A8A8E] mt-10 font-medium">No groups found. Create one!</div>
        ) : (
          filteredGroups.map(group => {
            const initials = group.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
            return (
              <div key={group.id} onClick={() => setActiveGroup(group)} className="bg-white p-4 rounded-lg shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-transform">
                <div className="w-[60px] h-[60px] bg-[#FFF0E6] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-[#ef4523] font-bold text-[18px]">{initials}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-[#273a5a] text-[16px] leading-tight mb-1">{group.name}</h3>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="bg-[#F2F2F7] text-[#8A8A8E] px-2.5 py-0.5 rounded-full text-[11px] font-bold">{group.radius} km</span>
                    <span className="bg-[#F2F2F7] text-[#8A8A8E] px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase">GRP-{group.id.substring(0, 4)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#8A8A8E]" />
                    <span className="text-[12px] font-medium text-[#8A8A8E]">
                      {group.is_private ? 'Private' : `${group.group_members?.[0]?.count || 0} members`}
                    </span>
                  </div>
                </div>
                <div className="w-8 h-8 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8A8A8E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="absolute inset-0 z-50 bg-[#273a5a]/40 flex items-end">
          <div className="w-full bg-white rounded-t-lg p-6 pb-12 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-dark">Create New Group</h2>
              <button aria-label="Close modal" onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6 text-dark" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">Group Name</label>
                <input 
                  type="text" 
                  value={newGroupParams.name}
                  onChange={e => setNewGroupParams({...newGroupParams, name: e.target.value})}
                  className="w-full h-12 bg-gray-50 border border-gray-200 rounded-lg px-4 outline-none focus:border-blue-500 transition-colors"
                  placeholder="E.g., Night Riders Hyderabad"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block flex justify-between">
                  <span>Coverage Radius</span>
                  <span className="text-blue-500">{newGroupParams.radius} km</span>
                </label>
                <input 
                  type="range" 
                  min="1" max="100" 
                  value={newGroupParams.radius}
                  onChange={e => setNewGroupParams({...newGroupParams, radius: parseInt(e.target.value)})}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1 km</span>
                  <span>100 km</span>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button 
                  onClick={() => setNewGroupParams({...newGroupParams, isPrivate: false})}
                  className={`flex-1 p-3 rounded-lg border-2 flex items-center justify-center gap-2 font-bold transition-all ${!newGroupParams.isPrivate ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-100 text-gray-500 bg-white'}`}
                >
                  <Globe className="w-5 h-5" /> Public
                </button>
                <button 
                  onClick={() => setNewGroupParams({...newGroupParams, isPrivate: true})}
                  className={`flex-1 p-3 rounded-lg border-2 flex items-center justify-center gap-2 font-bold transition-all ${newGroupParams.isPrivate ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-100 text-gray-500 bg-white'}`}
                >
                  <Lock className="w-5 h-5" /> Private
                </button>
              </div>

              {newGroupParams.isPrivate && (
                <div className="animate-in fade-in zoom-in-95 duration-200 pt-2">
                  <label className="text-sm font-bold text-gray-700 mb-1 block">Passcode to Join</label>
                  <input 
                    type="text" 
                    value={newGroupParams.passcode}
                    onChange={e => setNewGroupParams({...newGroupParams, passcode: e.target.value})}
                    className="w-full h-12 bg-gray-50 border border-gray-200 rounded-lg px-4 outline-none focus:border-blue-500 transition-colors"
                    placeholder="Enter a secret code"
                  />
                </div>
              )}

              <button 
                onClick={createGroup}
                disabled={isCreating || !newGroupParams.name.trim() || (newGroupParams.isPrivate && !newGroupParams.passcode.trim())}
                className="w-full h-14 bg-blue-500 text-white font-bold rounded-lg mt-6 disabled:opacity-50 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center"
              >
                {isCreating ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  "Create Group"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
