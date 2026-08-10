import React, { useState, useEffect, useRef } from 'react';
import { Search, Users, MessageSquare, Plus, ArrowLeft, Check, X, Send, Lock, Globe, MapPin, Clock, Copy, AlertTriangle, Flag, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useToast } from '../components/ToastContext';
import { SearchInput } from '../components/ui/SearchInput';
import { useConfirm } from '../components/ConfirmDialog';
import { getDeterministicUuid } from '../lib/user';
import { CockpitLayout } from '../components/spatial/CockpitLayout';
import { SpatialMembrane } from '../components/spatial/SpatialMembrane';

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
      <div className="w-full h-full bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <CockpitLayout
      mapChildren={
        <div className="w-full h-full bg-[#0a0a0a] relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
          <div className="absolute w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] -top-[300px] -right-[200px]"></div>
          <div className="absolute w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] -bottom-[300px] -left-[100px]"></div>
        </div>
      }
    >
      {!activeGroup ? (
        // Groups List View
        <SpatialMembrane position="left" className="w-[420px] p-5 flex flex-col gap-6 max-h-[100dvh]">
          <div className="flex items-center justify-between shrink-0 mb-2">
            <div>
              <h1 className="text-[28px] font-bold text-white tracking-tight leading-none">Groups</h1>
              <p className="text-[14px] text-white/50 mt-1">Join the community</p>
            </div>
            <button aria-label="Create new group" onClick={() => setShowCreateModal(true)} className="w-10 h-10 bg-primary hover:bg-primary/90 text-white rounded-full flex items-center justify-center transition-all shadow-lg shadow-primary/30 active:scale-95">
              <Plus className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>

          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
             <input 
               type="text" 
               placeholder="Search groups..." 
               value={searchQuery}
               onChange={(e) => handleSearch(e.target.value)}
               className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-[14px] text-white placeholder-white/40 focus:outline-none focus:border-primary/50 transition-all backdrop-blur-md"
             />
          </div>

          <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col gap-3 pb-8">
            {filteredGroups.length === 0 ? (
              <div className="text-center text-white/40 mt-10 text-[14px]">No groups found. Create one!</div>
            ) : (
              filteredGroups.map(group => {
                const initials = group.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
                return (
                  <div key={group.id} onClick={() => setActiveGroup(group)} className="bg-white/5 border border-white/10 p-4 rounded-[20px] flex items-center gap-4 cursor-pointer hover:bg-white/10 transition-all backdrop-blur-md">
                    <div className="w-[52px] h-[52px] bg-primary/20 border border-primary/30 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-primary font-black text-[18px]">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-[16px] leading-tight truncate">{group.name}</h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="bg-white/10 text-white/60 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider">{group.radius} km</span>
                        {group.is_private && <Lock className="w-3 h-3 text-white/40" />}
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-center shrink-0">
                      <div className="flex items-center gap-1.5 text-white/40 mb-1">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[12px] font-bold text-white/60">
                        {group.is_private ? 'Private' : group.group_members?.[0]?.count || 0}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </SpatialMembrane>
      ) : showMembers ? (
        // Group Members & Settings View
        <SpatialMembrane position="left" className="w-[420px] p-5 flex flex-col gap-6 max-h-[100dvh]">
          <div className="flex items-center justify-between shrink-0 mb-2">
            <button onClick={() => setShowMembers(false)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all active:scale-95">
              <ArrowLeft className="w-5 h-5 text-white/80" strokeWidth={1.5} />
            </button>
            <div className="flex gap-2">
              <button onClick={copyGroupInvite} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all active:scale-95">
                <Copy className="w-5 h-5 text-white/80" strokeWidth={1.5} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col gap-5 pb-8">
            {/* Group Header Info */}
            <div className="flex items-center gap-4">
              <div className="w-[72px] h-[72px] bg-primary/20 border border-primary/30 rounded-full flex items-center justify-center shrink-0">
                <span className="text-primary font-black text-[24px]">
                  {activeGroup.name.split(' ').map((n:string)=>n[0]).join('').substring(0,2).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="font-bold text-[22px] text-white leading-tight mb-2">{activeGroup.name}</h1>
                <div className="flex items-center gap-2">
                  <span className="bg-white/10 text-white/60 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase">GRP-{activeGroup.id.substring(0, 4)}</span>
                  <span className="bg-white/10 text-white/60 px-2.5 py-1 rounded-full text-[11px] font-bold">
                    {activeGroup.radius} km
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-white/5 border border-white/10 rounded-lg py-3 flex flex-col items-center justify-center">
                <span className="text-primary font-bold text-[20px]">{groupMembers.length}</span>
                <span className="text-white/40 text-[11px] font-medium">Members</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg py-3 flex flex-col items-center justify-center">
                <span className="text-white font-bold text-[20px]">{Math.max(0, groupMembers.length - 1)}</span>
                <span className="text-white/40 text-[11px] font-medium">Active</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg py-3 flex flex-col items-center justify-center">
                <span className="text-white font-bold text-[20px]">
                  {groupAlerts.filter(a => !(viewedAlerts.has(a.id) && Date.now() - viewedAlerts.get(a.id)! > 12 * 60 * 60 * 1000)).length}
                </span>
                <span className="text-white/40 text-[11px] font-medium">Alerts</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg py-3 flex flex-col items-center justify-center">
                <span className="text-white font-bold text-[20px]">{1 + groupMembers.filter(m => m.status === 'admin' && m.user_id !== activeGroup.admin_id).length}</span>
                <span className="text-white/40 text-[11px] font-medium">Admin</span>
              </div>
            </div>

            {/* Members List */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[12px] font-bold text-white/40 uppercase tracking-wider">Members</span>
              </div>
              <div className="flex flex-col gap-2">
                {groupMembers.map(member => (
                  <div key={member.id} className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-white/60 font-bold">{member.username.substring(0,2).toUpperCase()}</span>
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1a1a1a] ${member.user_id === activeGroup.admin_id ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      </div>
                      <div>
                        <span className="font-bold text-white text-[15px]">{member.username}</span>
                        {member.user_id === activeGroup.admin_id && (
                          <span className="block text-primary text-[10px] font-bold uppercase mt-0.5">Admin</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {isAdmin && (
              <div className="mt-4">
                <button onClick={deleteGroup} className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 rounded-xl font-bold text-red-400 transition-colors">
                  Delete Group
                </button>
              </div>
            )}
          </div>
        </SpatialMembrane>
      ) : (
        // Chat View
        <SpatialMembrane position="left" className="w-full max-w-[500px] sm:w-[500px] h-full flex flex-col border-r border-white/10">
          {/* Chat Header */}
          <div className="h-[76px] shrink-0 border-b border-white/10 flex items-center justify-between px-5 backdrop-blur-md bg-black/40">
            <div className="flex items-center gap-3">
              <button aria-label="Go back" onClick={() => { setActiveGroup(null); setShowRequests(false); }} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowMembers(true)}>
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center shrink-0 border border-primary/30">
                  <span className="text-primary font-bold text-[14px]">
                    {activeGroup.name.split(' ').map((n:string)=>n[0]).join('').substring(0,2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="font-bold text-[16px] text-white leading-tight">{activeGroup.name}</h2>
                  <p className="text-[12px] font-medium text-white/50">{groupMembers.length} members</p>
                </div>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 pt-4 pb-20 flex flex-col gap-4 bg-black/20 hide-scrollbar">
            {!(memberStatus === 'accepted' || isAdmin) ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                {memberStatus === 'pending' ? (
                  <>
                    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6">
                      <Clock className="w-10 h-10 text-primary" strokeWidth={2} />
                    </div>
                    <h3 className="text-[22px] font-bold text-white mb-2">Request Pending</h3>
                    <p className="text-[15px] text-white/50">Waiting for admin approval.</p>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6">
                      <Users className="w-10 h-10 text-primary" strokeWidth={2} />
                    </div>
                    <h3 className="text-[22px] font-bold text-white mb-2">Join {activeGroup.name}</h3>
                    <p className="text-[15px] text-white/50 mb-6">Join to see the chat.</p>
                    <button disabled={isJoining} onClick={joinGroup} className="w-full py-4 bg-primary text-white font-bold text-[16px] rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50">
                      {isJoining ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Request to Join"}
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
                        <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center mr-2 shrink-0 self-end mb-4">
                          <span className="text-[12px] font-bold text-white/60">{msg.username.substring(0,1).toUpperCase()}</span>
                        </div>
                      )}
                      <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                        {!isMe && <span className="text-[11px] font-bold text-white/40 mb-1 ml-1">{msg.username}</span>}
                        <div className={`px-4 py-3 text-[14px] leading-snug backdrop-blur-md ${isMe ? 'bg-primary/90 text-white rounded-t-2xl rounded-bl-2xl rounded-br-sm' : 'bg-white/10 text-white border border-white/10 rounded-t-2xl rounded-br-2xl rounded-bl-sm'}`}>
                          {msg.content}
                        </div>
                        <span className={`text-[10px] font-medium text-white/30 mt-1 ${isMe ? 'mr-1' : 'ml-1'}`}>
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
            <div className="absolute bottom-4 left-4 right-4">
              <form onSubmit={sendMessage} className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex items-center gap-2">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Message..." 
                  className="flex-1 h-10 bg-transparent px-4 outline-none text-[15px] text-white placeholder-white/40"
                />
                <button type="submit" disabled={!newMessage.trim()} className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shrink-0 disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-primary/20">
                  <Send className="w-5 h-5 ml-0.5" strokeWidth={2} />
                </button>
              </form>
            </div>
          )}
        </SpatialMembrane>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-[400px] bg-[#1a1a1a] border border-white/10 rounded-[24px] p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Create Group</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-white/60 mb-1 block">Group Name</label>
                <input 
                  type="text" 
                  value={newGroupParams.name}
                  onChange={e => setNewGroupParams({...newGroupParams, name: e.target.value})}
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none text-white focus:border-primary/50 transition-colors"
                  placeholder="Night Riders"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-white/60 mb-1 flex justify-between">
                  <span>Coverage Radius</span>
                  <span className="text-primary">{newGroupParams.radius} km</span>
                </label>
                <input 
                  type="range" 
                  min="1" max="100" 
                  value={newGroupParams.radius}
                  onChange={e => setNewGroupParams({...newGroupParams, radius: parseInt(e.target.value)})}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button 
                  onClick={() => setNewGroupParams({...newGroupParams, isPrivate: false})}
                  className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${!newGroupParams.isPrivate ? 'border-primary bg-primary/20 text-primary' : 'border-white/10 text-white/40 hover:bg-white/5'}`}
                >
                  <Globe className="w-5 h-5" /> Public
                </button>
                <button 
                  onClick={() => setNewGroupParams({...newGroupParams, isPrivate: true})}
                  className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${newGroupParams.isPrivate ? 'border-primary bg-primary/20 text-primary' : 'border-white/10 text-white/40 hover:bg-white/5'}`}
                >
                  <Lock className="w-5 h-5" /> Private
                </button>
              </div>

              {newGroupParams.isPrivate && (
                <div className="pt-2">
                  <label className="text-sm font-bold text-white/60 mb-1 block">Passcode</label>
                  <input 
                    type="text" 
                    value={newGroupParams.passcode}
                    onChange={e => setNewGroupParams({...newGroupParams, passcode: e.target.value})}
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none text-white focus:border-primary/50 transition-colors"
                    placeholder="Enter secret code"
                  />
                </div>
              )}

              <button 
                onClick={createGroup}
                disabled={isCreating || !newGroupParams.name.trim() || (newGroupParams.isPrivate && !newGroupParams.passcode.trim())}
                className="w-full h-14 bg-primary text-white font-bold rounded-xl mt-6 disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center"
              >
                {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Group"}
              </button>
            </div>
          </div>
        </div>
      )}
    </CockpitLayout>
  );
};

export default Groups;
