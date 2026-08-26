import React, { useState, useEffect, useRef } from 'react';
import { Search, Users, Plus, ArrowLeft, X, Send, Lock, Globe, Copy, Clock, Loader2, MessageSquare, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useToast } from '../components/ToastContext';
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

      const channel = supabase.channel('messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `group_id=eq.${activeGroup.id}` }, (payload) => {
          setMessages(prev => [...prev, payload.new]);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        })
        .subscribe();

      const interval = setInterval(() => {
        fetchMessages();
      }, 2000);

      return () => { 
        supabase.removeChannel(channel); 
        clearInterval(interval);
      };
    }
  }, [activeGroup]);

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
      if (error && error.code !== 'PGRST116') throw error;
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

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    g.id.toLowerCase().startsWith(searchQuery.trim().toLowerCase())
  );

  if (loadingAuth || !user) {
    return (
      <div className="w-full h-full bg-[#F2F4F7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF5A00] animate-spin" />
      </div>
    );
  }

  const groupInitials = (name: string) => name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <React.Fragment>
    <div className="w-full h-full bg-[#F2F4F7] flex flex-row overflow-hidden font-sans">

      {/* ===== LEFT: Group List (always visible) ===== */}
      <div className="w-[320px] min-w-[280px] max-w-[360px] shrink-0 bg-white border-r border-gray-100 flex flex-col">
        <div className="flex items-center justify-between shrink-0 px-4 pt-4 pb-2">
          <div>
            <h1 className="text-[#111111] font-semibold text-lg tracking-wide uppercase leading-tight">Groups</h1>
            <p className="text-[12px] text-gray-400 font-medium mt-0.5">Join the community</p>
          </div>
          <button aria-label="Create new group" onClick={() => setShowCreateModal(true)} className="w-9 h-9 bg-[#FF5A00] hover:bg-[#ff6a1a] text-white rounded-full flex items-center justify-center transition-all shadow-md shadow-[#FF5A00]/25 active:scale-95">
            <Plus className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>

        <div className="px-4 pb-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search groups or ID..." 
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full h-10 bg-[#F7F8FA] border border-gray-200 rounded-xl pl-9 pr-3 text-[13px] text-[#111111] placeholder-gray-400 font-medium focus:outline-none focus:border-[#FF5A00]/60 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar px-3 pb-3 flex flex-col gap-2">
          {filteredGroups.length === 0 ? (
            <div className="text-center text-gray-400 mt-10 text-[13px] font-medium px-4">No groups found.<br/>Create one or search by ID.</div>
          ) : (
            filteredGroups.map(group => (
              <div 
                key={group.id} 
                onClick={() => setActiveGroup(group)} 
                className={`p-3 rounded-[8px] flex items-center gap-3 cursor-pointer border transition-all ${
                  activeGroup?.id === group.id 
                    ? 'bg-[#FFF0E6] border-[#FF5A00]/40' 
                    : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm'
                }`}
              >
                <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${activeGroup?.id === group.id ? 'bg-[#FF5A00] text-white' : 'bg-[#FFF0E6]'}`}>
                  <span className={`font-semibold text-[15px] ${activeGroup?.id === group.id ? 'text-white' : 'text-[#FF5A00]'}`}>{groupInitials(group.name)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#111111] text-[14px] leading-tight truncate">{group.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-[10px] font-semibold">{group.radius} km</span>
                    <span className="text-[10px] font-semibold text-gray-400">
                      {group.is_private ? 'Private' : `${group.group_members?.[0]?.count || 0} members`}
                    </span>
                    {group.is_private && <Lock className="w-3 h-3 text-gray-400" />}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ===== RIGHT: Chat / Members / Empty ===== */}
      <div className="flex-1 min-w-0 flex flex-col">
        {!activeGroup ? (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 border border-gray-200 shadow-sm">
              <MessageSquare className="w-7 h-7 text-gray-300" />
            </div>
            <h3 className="text-[16px] font-semibold text-[#111111] mb-1">Select a group</h3>
            <p className="text-[13px] text-gray-400 font-medium max-w-[240px]">Pick a group from the list to open its chat, or create a new one.</p>
          </div>
        ) : showMembers ? (
          /* Members & Settings View */
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between shrink-0 px-4 pt-4 pb-2">
              <button onClick={() => setShowMembers(false)} className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[#111111] hover:bg-gray-50 active:scale-95 transition-all shadow-sm">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="font-semibold text-[15px] text-[#111111] uppercase tracking-wide">Group Info</h2>
              <button onClick={copyGroupInvite} title="Copy invite" className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[#111111] hover:bg-gray-50 active:scale-95 transition-all shadow-sm">
                <Copy className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pb-4 flex flex-col gap-4">

              {/* Group Header */}
              <div className="bg-white rounded-[8px] border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                <div className="w-14 h-14 bg-[#FFF0E6] rounded-full flex items-center justify-center shrink-0">
                  <span className="text-[#FF5A00] font-semibold text-[18px]">{groupInitials(activeGroup.name)}</span>
                </div>
                <div className="min-w-0">
                  <h1 className="font-semibold text-[18px] text-[#111111] leading-tight truncate">{activeGroup.name}</h1>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase">GRP-{activeGroup.id.substring(0, 4)}</span>
                    <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-[10px] font-semibold">{activeGroup.radius} km</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: groupMembers.length, label: 'Members' },
                  { value: Math.max(0, groupMembers.length - 1), label: 'Others' },
                  { value: groupAlerts.filter(a => !(viewedAlerts.has(a.id) && Date.now() - viewedAlerts.get(a.id)! > 12 * 60 * 60 * 1000)).length, label: 'Alerts' },
                  { value: 1 + groupMembers.filter(m => m.status === 'admin' && m.user_id !== activeGroup.admin_id).length, label: 'Admins' }
                ].map((stat, i) => (
                  <div key={i} className="bg-white border border-gray-100 rounded-[8px] py-3 flex flex-col items-center justify-center shadow-sm">
                    <span className="text-[#111111] font-semibold text-[18px] tabular-nums">{stat.value}</span>
                    <span className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider mt-0.5">{stat.label}</span>
                  </div>
                ))}
              </div>

              {/* Members List */}
              <div>
                <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Members</span>
                <div className="mt-2 bg-white border border-gray-100 rounded-[8px] shadow-sm flex flex-col overflow-hidden">
                  {groupMembers.map(member => (
                    <div key={member.id} className="p-3 flex items-center justify-between border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="relative w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-gray-500 font-semibold text-[13px]">{member.username.substring(0,2).toUpperCase()}</span>
                          {member.user_id === activeGroup.admin_id && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white bg-green-500"></div>
                          )}
                        </div>
                        <div>
                          <span className="font-semibold text-[#111111] text-[14px]">{member.username}</span>
                          {member.user_id === activeGroup.admin_id && (
                            <span className="ml-2 bg-[#FFF0E6] text-[#FF5A00] text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider">Admin</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {isAdmin && (
                <button onClick={deleteGroup} className="w-full py-3 bg-white border border-red-100 hover:bg-red-50 rounded-[8px] font-semibold text-red-500 transition-colors uppercase text-[13px] tracking-wider shadow-sm flex items-center justify-center gap-2">
                  <X className="w-4 h-4" /> Delete Group
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Chat View */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Chat Header */}
            <div className="h-[64px] shrink-0 border-b border-gray-200 bg-white flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <button aria-label="Go back" onClick={() => { setActiveGroup(null); setShowRequests(false); }} className="w-9 h-9 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors">
                  <ArrowLeft className="w-5 h-5 text-[#111111]" />
                </button>
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowMembers(true)}>
                  <div className="w-9 h-9 bg-[#FFF0E6] rounded-full flex items-center justify-center shrink-0">
                    <span className="text-[#FF5A00] font-semibold text-[13px]">{groupInitials(activeGroup.name)}</span>
                  </div>
                  <div>
                    <h2 className="font-semibold text-[15px] text-[#111111] leading-tight">{activeGroup.name}</h2>
                    <p className="text-[11px] font-medium text-gray-400">{groupMembers.length} members &middot; Tap for info</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto hide-scrollbar px-4 py-4 flex flex-col gap-3 bg-[#F2F4F7]">
              {!(memberStatus === 'accepted' || isAdmin) ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  {memberStatus === 'pending' ? (
                    <>
                      <div className="w-16 h-16 bg-[#FFF0E6] rounded-full flex items-center justify-center mb-4">
                        <Clock className="w-7 h-7 text-[#FF5A00]" strokeWidth={2} />
                      </div>
                      <h3 className="text-[17px] font-semibold text-[#111111] mb-1">Request Pending</h3>
                      <p className="text-[13px] text-gray-400 font-medium">Waiting for admin approval.</p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-[#FFF0E6] rounded-full flex items-center justify-center mb-4">
                        <Users className="w-7 h-7 text-[#FF5A00]" strokeWidth={2} />
                      </div>
                      <h3 className="text-[17px] font-semibold text-[#111111] mb-1">Join {activeGroup.name}</h3>
                      <p className="text-[13px] text-gray-400 font-medium mb-5">Join to see the chat.</p>
                      <button disabled={isJoining} onClick={joinGroup} className="px-8 py-3 bg-[#FF5A00] text-white font-semibold text-[14px] rounded-xl hover:bg-[#ff6a1a] transition-colors disabled:opacity-50 shadow-lg shadow-[#FF5A00]/25 active:scale-95">
                        {isJoining ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Join Group"}
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <>
                  {messages.map(msg => {
                    const isMe = msg.user_id === user.uid;
                    return (
                      <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {!isMe && (
                          <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center mr-2 shrink-0 self-end mb-4">
                            <span className="text-[11px] font-semibold text-gray-500">{msg.username.substring(0,1).toUpperCase()}</span>
                          </div>
                        )}
                        <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                          {!isMe && <span className="text-[11px] font-semibold text-gray-400 mb-1 ml-1">{msg.username}</span>}
                          <div className={`px-3.5 py-2.5 text-[13px] leading-snug shadow-sm ${isMe ? 'bg-[#FF5A00] text-white rounded-t-2xl rounded-bl-2xl rounded-br-sm' : 'bg-white text-[#111111] border border-gray-100 rounded-t-2xl rounded-br-2xl rounded-bl-sm'}`}>
                            {msg.content}
                          </div>
                          <span className={`text-[10px] font-medium text-gray-400 mt-1 ${isMe ? 'mr-1' : 'ml-1'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Chat Input */}
            {(memberStatus === 'accepted' || isAdmin) && (
              <div className="shrink-0 p-3 bg-white border-t border-gray-200">
                <form onSubmit={sendMessage} className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type a message..." 
                    className="flex-1 h-11 bg-[#F7F8FA] border border-gray-200 rounded-xl px-4 outline-none text-[14px] text-[#111111] placeholder-gray-400 font-medium focus:border-[#FF5A00]/60 focus:bg-white transition-all"
                  />
                  <button type="submit" disabled={!newMessage.trim()} className="w-11 h-11 bg-[#FF5A00] rounded-xl flex items-center justify-center text-white shrink-0 disabled:opacity-40 transition-all active:scale-95 shadow-md shadow-[#FF5A00]/25">
                    <Send className="w-5 h-5 ml-0.5" strokeWidth={2} />
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-[400px] bg-white rounded-[8px] p-5 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-[#111111]">Create Group</h2>
              <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Group Name</label>
                <input 
                  type="text" 
                  value={newGroupParams.name}
                  onChange={e => setNewGroupParams({...newGroupParams, name: e.target.value})}
                  className="w-full h-11 bg-[#F7F8FA] border border-gray-200 rounded-xl px-4 outline-none text-[14px] text-[#111111] placeholder-gray-400 font-medium focus:border-[#FF5A00]/60 focus:bg-white transition-all"
                  placeholder="Night Riders"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 flex justify-between">
                  <span>Coverage Radius</span>
                  <span className="text-[#FF5A00]">{newGroupParams.radius} km</span>
                </label>
                <input 
                  type="range" 
                  min="1" max="100" 
                  value={newGroupParams.radius}
                  onChange={e => setNewGroupParams({...newGroupParams, radius: parseInt(e.target.value)})}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#FF5A00]"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button 
                  onClick={() => setNewGroupParams({...newGroupParams, isPrivate: false})}
                  className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 font-semibold text-[13px] transition-all ${!newGroupParams.isPrivate ? 'border-[#FF5A00] bg-[#FFF0E6] text-[#FF5A00]' : 'border-gray-200 text-gray-400 hover:bg-gray-50'}`}
                >
                  <Globe className="w-4 h-4" /> Public
                </button>
                <button 
                  onClick={() => setNewGroupParams({...newGroupParams, isPrivate: true})}
                  className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 font-semibold text-[13px] transition-all ${newGroupParams.isPrivate ? 'border-[#FF5A00] bg-[#FFF0E6] text-[#FF5A00]' : 'border-gray-200 text-gray-400 hover:bg-gray-50'}`}
                >
                  <Lock className="w-4 h-4" /> Private
                </button>
              </div>

              {newGroupParams.isPrivate && (
                <div className="pt-1">
                  <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Passcode</label>
                  <input 
                    type="text" 
                    value={newGroupParams.passcode}
                    onChange={e => setNewGroupParams({...newGroupParams, passcode: e.target.value})}
                    className="w-full h-11 bg-[#F7F8FA] border border-gray-200 rounded-xl px-4 outline-none text-[14px] text-[#111111] placeholder-gray-400 font-medium focus:border-[#FF5A00]/60 focus:bg-white transition-all"
                    placeholder="Enter secret code"
                  />
                </div>
              )}

              <button 
                onClick={createGroup}
                disabled={isCreating || !newGroupParams.name.trim() || (newGroupParams.isPrivate && !newGroupParams.passcode.trim())}
                className="w-full h-12 bg-[#FF5A00] text-white font-semibold rounded-xl mt-2 disabled:opacity-40 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF5A00]/25"
              >
                {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Shield className="w-4 h-4" /> Create Group</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default Groups;
