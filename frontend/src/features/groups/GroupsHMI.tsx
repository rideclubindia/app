import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Users, Plus, ArrowLeft, X, Send, Lock, Globe, Copy, Clock, Loader2, MessageSquare, Shield, MoreVertical, ShieldAlert, LogOut,
  UserPlus, Bell, BellOff, Image as ImageIcon, MapPin as LocationIcon, Pin as PinIcon, Calendar, Camera, Navigation2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useToast } from '../../components/ToastContext';
import { useConfirm } from '../../components/ConfirmDialog';
import { getDeterministicUuid, getAppUser } from '../../lib/user';
import { useLocationStore } from '../../store/useLocationStore';
import { searchRiders } from '../../lib/myProfile';

const GroupsHMI = () => {
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

  const [infoTab, setInfoTab] = useState<'chat' | 'incidents' | 'members'>('chat');
  const [listFilter, setListFilter] = useState<'all' | 'public' | 'private'>('all');
  const [lastMessages, setLastMessages] = useState<Record<string, any>>({});
  const [lastSeen, setLastSeen] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem('rc_group_seen') || '{}'); } catch { return {}; }
  });

  // Group Info sub-screens (Group Media / Shared Locations / Ride Plans / Pinned / Add Members)
  const [groupInfoView, setGroupInfoView] = useState<'main' | 'media' | 'locations' | 'ridePlans' | 'pinned' | 'addMembers'>('main');
  const [isMuted, setIsMuted] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberSearchResults, setMemberSearchResults] = useState<any[]>([]);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [ridePlans, setRidePlans] = useState<any[]>([]);
  const [pendingLocationShare, setPendingLocationShare] = useState(false);
  const chatImageInputRef = useRef<HTMLInputElement>(null);

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
      let activeUid = currentUser?.uid;
      const rieToken = localStorage.getItem('rie_token');
      if (!activeUid && rieToken) {
        try {
          const payload = JSON.parse(atob(rieToken.split('.')[1]));
          if (payload.uid) activeUid = payload.uid;
        } catch (e) {}
      }

      if (activeUid) {
        const mockUser = currentUser || { uid: activeUid };
        setUser(mockUser);
        fetchGroups(mockUser);
      } else {
        navigate('/login', { replace: true });
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
      fetchRidePlans();

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
      let query = supabase.from('groups').select('id, name, admin_id, radius, is_private, pinned_message_id, created_at, group_members(count)').order('created_at', { ascending: false });
      
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
      if (data) {
        setGroups(data);
        const ids = data.map((g: any) => g.id);
        if (ids.length) {
          const { data: recent } = await supabase.from('messages')
            .select('group_id, user_id, username, content, message_type, created_at')
            .in('group_id', ids)
            .order('created_at', { ascending: false })
            .limit(Math.min(500, ids.length * 20));
          const latest: Record<string, any> = {};
          (recent || []).forEach((m: any) => { if (!latest[m.group_id]) latest[m.group_id] = m; });
          setLastMessages(latest);
        }
      }
    } catch (e) {
      showToast('Failed to fetch groups', 'error');
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    const exact = query.trim();
    if (/^[0-9a-f-]{36}$/i.test(exact)) {
      // Private groups are only findable by exact id, through a function that never returns the passcode
      const { data } = await supabase.rpc('rc_find_group', { p_group: exact });
      const g = (data as any[] | null)?.[0];
      if (g) {
        const found = { ...g, group_members: [{ count: Number(g.member_count) || 0 }] };
        setGroups(prev => (prev.some(x => x.id === found.id) ? prev : [...prev, found]));
      }
      return;
    }
    if (query.trim().length === 5) {
      try {
        const { data, error } = await supabase.from('groups')
          .select('id, name, admin_id, radius, is_private, pinned_message_id, created_at, group_members(count)')
          .eq('is_private', false)
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
      const { data, error } = await supabase.from('group_members').select('status, muted').eq('group_id', activeGroup.id).eq('user_id', user.uid).single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setMemberStatus(data.status);
        setIsMuted(!!data.muted);
      } else {
        setMemberStatus(null);
        setIsMuted(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRidePlans = async () => {
    if (!activeGroup) return;
    try {
      const { data, error } = await supabase
        .from('rides')
        .select('id, name, ride_date, image_url, start_location, destination, max_riders, status')
        .eq('group_id', activeGroup.id)
        .order('ride_date', { ascending: true });
      if (error) throw error;
      if (data) setRidePlans(data);
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

  const copyGroupInvite = async () => {
    if (!activeGroup) return;
    const passcode = activeGroup.is_private ? (await supabase.rpc('rc_group_passcode', { p_group: activeGroup.id })).data : null;
    const inviteText = `Join my group on Ride Club!\nGroup Name: ${activeGroup.name}\nGroup ID: ${activeGroup.id}${passcode ? `\nPasscode: ${passcode}` : ''}`;
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

  const leaveGroup = async () => {
    if (!activeGroup || !user || isAdmin) return;
    const ok = await confirm({ title: 'Leave Group', message: `You'll stop receiving messages and alerts from "${activeGroup.name}".`, confirmLabel: 'Leave', variant: 'danger' });
    if (!ok) return;
    try {
      const { error } = await supabase.from('group_members').delete().eq('group_id', activeGroup.id).eq('user_id', user.uid);
      if (error) throw error;
      setActiveGroup(null);
      setShowMembers(false);
      fetchGroups();
      showToast('You left the group', 'success');
    } catch (e) {
      showToast('Failed to leave group', 'error');
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
      }).select('id, name, admin_id, radius, is_private, pinned_message_id, created_at').single();
      
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
    
    const code = activeGroup.is_private ? prompt("This is a private group. Enter Passcode:") : null;
    if (activeGroup.is_private && code === null) return;
    
    setIsJoining(true);
    try {
      const uName = user.displayName || user.email?.split('@')[0] || 'Unknown';
      if (activeGroup.is_private) {
        // The passcode is checked in the database; it is never sent to the phone
        const { data: ok, error } = await supabase.rpc('rc_join_group', { p_group: activeGroup.id, p_passcode: code, p_username: uName });
        if (error) throw error;
        if (!ok) { showToast("Incorrect passcode!", 'error'); return; }
        checkMembership();
        showToast('Joined group', 'success');
        return;
      }
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
      const { error } = await supabase.from('messages').insert({ group_id: activeGroup.id, user_id: getDeterministicUuid(user.uid), username: uName, content, message_type: 'text' });
      if (error) throw error;
    } catch (e) {
      showToast('Failed to send message', 'error');
    }
  };

  const sendImageMessage = async (file: File) => {
    if (!activeGroup || !user) return;
    try {
      const uName = user.displayName || user.email?.split('@')[0] || 'Unknown';
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('incident-photos').upload(fileName, file);
      if (upErr) throw upErr;
      const imageUrl = supabase.storage.from('incident-photos').getPublicUrl(fileName).data.publicUrl;
      const { error } = await supabase.from('messages').insert({
        group_id: activeGroup.id, user_id: getDeterministicUuid(user.uid), username: uName,
        content: 'Photo', message_type: 'image', image_url: imageUrl
      });
      if (error) throw error;
    } catch (e) {
      showToast('Failed to send photo', 'error');
    }
  };

  const shareLocation = () => {
    if (!activeGroup || !user) return;
    if (!navigator.geolocation) { showToast('Location is not available on this device', 'error'); return; }
    setPendingLocationShare(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const uName = user.displayName || user.email?.split('@')[0] || 'Unknown';
        const { error } = await supabase.from('messages').insert({
          group_id: activeGroup.id, user_id: getDeterministicUuid(user.uid), username: uName,
          content: 'Shared location', message_type: 'location',
          location_lat: pos.coords.latitude, location_lng: pos.coords.longitude
        });
        if (error) throw error;
      } catch (e) {
        showToast('Failed to share location', 'error');
      } finally {
        setPendingLocationShare(false);
      }
    }, () => {
      showToast('Could not get your location', 'error');
      setPendingLocationShare(false);
    });
  };

  const togglePinMessage = async (msg: any) => {
    try {
      const { error } = await supabase.from('messages').update({ is_pinned: !msg.is_pinned }).eq('id', msg.id);
      if (error) throw error;
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_pinned: !msg.is_pinned } : m));
      showToast(msg.is_pinned ? 'Message unpinned' : 'Message pinned', 'success');
    } catch (e) {
      showToast('Failed to update pin', 'error');
    }
  };

  const toggleMute = async () => {
    if (!activeGroup || !user) return;
    try {
      const next = !isMuted;
      const { error } = await supabase.from('group_members').update({ muted: next }).eq('group_id', activeGroup.id).eq('user_id', user.uid);
      if (error) throw error;
      setIsMuted(next);
      showToast(next ? 'Notifications muted for this group' : 'Notifications unmuted', 'success');
    } catch (e) {
      showToast('Failed to update notifications', 'error');
    }
  };

  const searchProfilesToAdd = async (query: string) => {
    setMemberSearchQuery(query);
    if (query.trim().length < 2) { setMemberSearchResults([]); return; }
    try {
      const data = await searchRiders(query.trim());
      const existingIds = new Set(groupMembers.map(m => m.user_id));
      setMemberSearchResults((data || []).filter(p => !existingIds.has(p.id)));
    } catch (e) {
      setMemberSearchResults([]);
    }
  };

  const addMemberDirectly = async (profile: any) => {
    if (!activeGroup) return;
    setIsAddingMember(true);
    try {
      const { error } = await supabase.from('group_members').insert({
        group_id: activeGroup.id,
        user_id: profile.id,
        username: profile.full_name || profile.email?.split('@')[0] || 'Rider',
        status: 'accepted'
      });
      if (error) throw error;
      showToast(`${profile.full_name || 'Rider'} added to the group`, 'success');
      setMemberSearchQuery('');
      setMemberSearchResults([]);
      fetchMembers();
    } catch (e) {
      showToast('Failed to add member', 'error');
    } finally {
      setIsAddingMember(false);
    }
  };

  const filteredGroups = groups
    .filter(g => listFilter === 'all' ? true : listFilter === 'private' ? g.is_private : !g.is_private)
    .filter(g =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.id.toLowerCase().startsWith(searchQuery.trim().toLowerCase())
    );

  if (loadingAuth || !user) {
    return (
      <div className="w-full h-full bg-app-canvas flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF6B22] animate-spin" />
      </div>
    );
  }

  const myMemberId = getDeterministicUuid(user.uid);
  const unreadTotal = groups.filter(g => {
    const last = lastMessages[g.id];
    return last && new Date(last.created_at).getTime() > (lastSeen[g.id] || 0) && last.user_id !== myMemberId;
  }).length;
  const formatWhen = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const y = new Date(now); y.setDate(now.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
  };
  const openConversation = (group: any) => {
    setActiveGroup(group);
    setInfoTab('chat');
    setLastSeen(prev => {
      const next = { ...prev, [group.id]: Date.now() };
      try { localStorage.setItem('rc_group_seen', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };
  const groupInitials = (name: string) => name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
  const openGroups = !showCreateModal && !activeGroup;

  return (
    <div className="w-full h-full bg-app-canvas flex flex-col overflow-hidden font-sans">

      {/* ===== Group List — always visible in landscape; hidden behind an open chat in portrait ===== */}
      <div className={`${openGroups ? 'flex' : 'hidden'} w-full shrink-0 flex-col`}>
        <div className="flex items-center justify-between shrink-0 px-4 pt-4 pb-3">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-gray-950 leading-tight">Messages</h1>
            <p className="text-[12px] text-gray-500 font-medium">
              {groups.length} {groups.length === 1 ? 'conversation' : 'conversations'}
              {unreadTotal > 0 && <> · <span className="text-[#FF6B22] font-semibold">{unreadTotal} unread</span></>}
            </p>
          </div>
          <button
            aria-label="Create new group"
            onClick={() => setShowCreateModal(true)}
            className="h-11 pl-3 pr-4 rounded-full btn-app-primary flex items-center gap-1.5 text-white text-[13px] font-bold active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} /> New group
          </button>
        </div>

        <div className="px-4 pb-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations or paste a group ID"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full h-11 rounded-full bg-white border border-gray-200 pl-10 pr-3 text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B22]/40 transition-all"
            />
          </div>
        </div>

        <div className="px-4 pb-2 shrink-0 flex items-center gap-2">
          {([
            { id: 'all', label: 'All', count: groups.length },
            { id: 'public', label: 'Ride Groups', count: groups.filter(g => !g.is_private).length },
            { id: 'private', label: 'Private', count: groups.filter(g => g.is_private).length },
          ] as const).map(chip => (
            <button
              key={chip.id}
              onClick={() => setListFilter(chip.id)}
              className={`h-9 px-3.5 rounded-full text-[13px] font-semibold transition-colors cursor-pointer border ${
                listFilter === chip.id ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200'
              }`}
            >
              {chip.label}{chip.count > 0 && <span className={`ml-1.5 tabular-nums ${listFilter === chip.id ? 'text-white/70' : 'text-gray-400'}`}>{chip.count}</span>}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pb-[100px]">
          {filteredGroups.length === 0 ? (
            <div className="mt-10 mx-auto max-w-xs text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-orange-50 flex items-center justify-center"><MessageSquare className="w-6 h-6 text-[#FF6B22]" /></div>
              <p className="mt-3 text-[15px] font-semibold text-gray-950">{searchQuery ? 'No conversations match' : 'No conversations yet'}</p>
              <p className="mt-1 text-[13px] text-gray-500">{searchQuery ? 'Try another name, or paste the full ID from an invite.' : 'Join a Ride Group or create your own to start talking with riders.'}</p>
              {!searchQuery && (
                <button onClick={() => setShowCreateModal(true)} className="mt-4 h-11 px-5 rounded-full btn-app-primary text-white text-[13px] font-bold">Create a group</button>
              )}
            </div>
          ) : (
            <ul className="rounded-2xl bg-white border border-gray-200 divide-y divide-gray-100 overflow-hidden">
              {filteredGroups.map((group) => {
                const last = lastMessages[group.id];
                const unread = !!last && new Date(last.created_at).getTime() > (lastSeen[group.id] || 0) && last.user_id !== myMemberId;
                const preview = !last
                  ? (group.is_private ? 'Private group · no messages yet' : `${group.group_members?.[0]?.count || 0} riders · say hello`)
                  : `${last.user_id === myMemberId ? 'You' : String(last.username || 'Rider').split(' ')[0]}: ${last.message_type === 'image' ? 'Photo' : last.message_type === 'location' ? 'Shared a location' : last.content}`;
                return (
                  <li key={group.id}>
                    <button
                      onClick={() => openConversation(group)}
                      className="w-full flex items-center gap-3 px-3.5 py-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div className="relative shrink-0">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${group.is_private ? 'bg-gray-900' : 'bg-[#FFE3D1]'}`}>
                          <span className={`font-bold text-[15px] ${group.is_private ? 'text-white' : 'text-[#FF6B22]'}`}>{groupInitials(group.name)}</span>
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${group.is_private ? 'bg-gray-700' : 'bg-[#FF6B22]'}`} title={group.is_private ? 'Private Group' : 'Ride Group'}>
                          {group.is_private ? <Lock className="w-2.5 h-2.5 text-white" /> : <Navigation2 className="w-2.5 h-2.5 text-white fill-white" />}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 className={`text-[15px] truncate ${unread ? 'font-bold text-gray-950' : 'font-semibold text-gray-900'}`}>{group.name}</h3>
                          {last && <span className={`text-[11px] shrink-0 tabular-nums ${unread ? 'text-[#FF6B22] font-semibold' : 'text-gray-400'}`}>{formatWhen(last.created_at)}</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className={`flex-1 min-w-0 text-[13px] truncate ${unread ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>{preview}</p>
                          {unread && <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B22] shrink-0" aria-label="Unread" />}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">{group.is_private ? 'Private Group' : 'Ride Group'} · {group.radius} km</p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* ===== Chat / Members / Create Group / Empty ===== */}
      <div className={`${openGroups ? 'hidden' : 'flex'} flex-1 min-w-0 flex-col`}>
        {showCreateModal ? (
          /* Inline Create Group Panel (No popup) */
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between shrink-0 px-6 py-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-9 h-9 rounded-xl card-app flex items-center justify-center text-gray-800 active:scale-95 transition-all cursor-pointer"
                  title="Cancel"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-[17px] font-bold text-gray-950 leading-tight">Create New Group</h2>
                  <p className="text-[12px] text-gray-500 font-medium">Build your local rider pack</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-11 h-11 rounded-full hover:bg-white/60 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 max-w-[600px] w-full mx-auto flex flex-col gap-5 custom-scrollbar">
              <div>
                <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5 block">Group Name</label>
                <input
                  type="text"
                  value={newGroupParams.name}
                  onChange={e => setNewGroupParams({...newGroupParams, name: e.target.value})}
                  className="w-full h-11 card-app px-4 outline-none text-[14px] text-gray-950 placeholder-gray-400 font-medium focus:ring-2 focus:ring-[#FF6B22]/40 transition-all"
                  placeholder="e.g., Highway Hawks, Bengaluru Night Riders"
                  autoFocus
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block">Coverage Radius</label>
                  <span className="text-[12px] font-black text-[#FF6B22] bg-orange-100/70 px-2 py-0.5 rounded-full">{newGroupParams.radius} km</span>
                </div>
                <input
                  type="range"
                  min="1" max="100"
                  value={newGroupParams.radius}
                  onChange={e => setNewGroupParams({...newGroupParams, radius: parseInt(e.target.value)})}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#FF6B22]"
                />
                <div className="flex justify-between text-[10px] text-gray-400 font-semibold mt-1">
                  <span>1 km (Local)</span>
                  <span>50 km</span>
                  <span>100 km (Wide Region)</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5 block">Group type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewGroupParams({...newGroupParams, isPrivate: false})}
                    className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      !newGroupParams.isPrivate
                        ? 'bg-orange-100/70 text-[#FF6B22]'
                        : 'card-app text-gray-600 hover:bg-white/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Navigation2 className="w-4 h-4" />
                      <span className="font-bold text-[13px]">Ride Group</span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-medium">Public: riders can find and request to join</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewGroupParams({...newGroupParams, isPrivate: true})}
                    className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      newGroupParams.isPrivate
                        ? 'bg-orange-100/70 text-[#FF6B22]'
                        : 'card-app text-gray-600 hover:bg-white/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      <span className="font-bold text-[13px]">Private Group</span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-medium">Hidden: invite only, with passcode</span>
                  </button>
                </div>
              </div>

              {newGroupParams.isPrivate && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5 block">Secret Passcode</label>
                  <input
                    type="text"
                    value={newGroupParams.passcode}
                    onChange={e => setNewGroupParams({...newGroupParams, passcode: e.target.value})}
                    className="w-full h-11 card-app px-4 outline-none text-[14px] text-gray-950 placeholder-gray-400 font-medium focus:ring-2 focus:ring-[#FF6B22]/40 transition-all"
                    placeholder="Enter joining PIN or password"
                  />
                </div>
              )}

              <div className="pt-3">
                <button
                  onClick={createGroup}
                  disabled={isCreating || !newGroupParams.name.trim() || (newGroupParams.isPrivate && !newGroupParams.passcode.trim())}
                  className="w-full h-11 btn-app-primary hover:brightness-110 text-white font-bold rounded-2xl disabled:opacity-40 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer text-[14px]"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Shield className="w-4 h-4" /> Create Group</>}
                </button>
              </div>
            </div>
          </div>
        ) : !activeGroup ? (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 card-app rounded-2xl flex items-center justify-center mb-3">
              <MessageSquare className="w-7 h-7 text-gray-400" />
            </div>
            <h3 className="text-[16px] font-bold text-gray-950 mb-1">Select a group</h3>
            <p className="text-[12px] text-gray-500 font-medium max-w-[260px] mb-4">Pick a group from the left list to chat and view alerts, or start your own pack.</p>
            <button
              onClick={() => { setShowCreateModal(true); setActiveGroup(null); }}
              className="px-4 py-2 btn-app-primary hover:brightness-110 text-white font-bold text-[12px] rounded-2xl flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" /> Create New Group
            </button>
          </div>
        ) : showMembers ? (
          /* Group Info View */
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between shrink-0 px-4 pt-4 pb-2">
              <button onClick={() => groupInfoView === 'main' ? setShowMembers(false) : setGroupInfoView('main')} className="w-10 h-10 rounded-full card-app flex items-center justify-center text-gray-950 active:scale-95 transition-all cursor-pointer">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="font-bold text-[14px] text-gray-950 uppercase tracking-wide">
                {groupInfoView === 'main' ? 'Group Info' : groupInfoView === 'media' ? 'Group Media' : groupInfoView === 'locations' ? 'Shared Locations' : groupInfoView === 'ridePlans' ? 'Ride Plans' : groupInfoView === 'pinned' ? 'Pinned Messages' : 'Add Members'}
              </h2>
              <div className="w-10 h-10" />
            </div>

            {groupInfoView === 'main' && (
            <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pb-4 flex flex-col gap-4 max-w-[520px] w-full mx-auto">

              {/* Group Header */}
              <div className="flex flex-col items-center text-center pt-2">
                <div className="w-20 h-20 bg-[#FFE3D1] rounded-full flex items-center justify-center shrink-0">
                  <span className="text-[#FF6B22] font-black text-[24px]">{groupInitials(activeGroup.name)}</span>
                </div>
                <h1 className="font-bold text-[19px] text-gray-950 leading-tight mt-3">{activeGroup.name}</h1>
                <p className="text-[12px] text-gray-500 font-medium mt-0.5">{groupMembers.length} members &middot; {activeGroup.radius} km radius</p>
              </div>

              {/* Action row — every action here is real and wired */}
              <div className="grid grid-cols-4 gap-2">
                <button onClick={() => setGroupInfoView('addMembers')} className="card-app py-3 flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition-all">
                  <UserPlus className="w-4.5 h-4.5 text-[#FF6B22]" />
                  <span className="text-[9.5px] font-bold text-gray-700">Add Members</span>
                </button>
                <button onClick={copyGroupInvite} className="card-app py-3 flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition-all">
                  <Copy className="w-4.5 h-4.5 text-[#FF6B22]" />
                  <span className="text-[9.5px] font-bold text-gray-700">Share Invite</span>
                </button>
                <button onClick={toggleMute} className="card-app py-3 flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition-all">
                  {isMuted ? <BellOff className="w-4.5 h-4.5 text-gray-500" /> : <Bell className="w-4.5 h-4.5 text-[#FF6B22]" />}
                  <span className="text-[9.5px] font-bold text-gray-700">{isMuted ? 'Muted' : 'Notifications'}</span>
                </button>
                <button onClick={isAdmin ? deleteGroup : leaveGroup} className="card-app py-3 flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition-all">
                  <LogOut className="w-4.5 h-4.5 text-red-500" />
                  <span className="text-[9.5px] font-bold text-red-600">{isAdmin ? 'Delete Group' : 'Leave Group'}</span>
                </button>
              </div>

              {/* Upcoming Ride — real, from rides linked to this group */}
              {ridePlans.filter(r => r.status !== 'completed').length > 0 && (
                <button onClick={() => navigate(`/ride-plus/view/${ridePlans.filter(r => r.status !== 'completed')[0].id}`)} className="card-app p-3 flex items-center gap-3 text-left cursor-pointer">
                  <img src={ridePlans.filter(r => r.status !== 'completed')[0].image_url || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&q=60'} alt="" className="w-14 h-14 rounded-2xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Upcoming Ride</span>
                    <p className="text-[13px] font-bold text-gray-950 truncate">{ridePlans.filter(r => r.status !== 'completed')[0].name}</p>
                    <p className="text-[10.5px] text-gray-500 font-medium">{ridePlans.filter(r => r.status !== 'completed')[0].ride_date ? new Date(ridePlans.filter(r => r.status !== 'completed')[0].ride_date).toLocaleDateString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Date TBD'}</p>
                  </div>
                </button>
              )}

              {/* List rows — all real counts */}
              <div className="card-app flex flex-col overflow-hidden divide-y divide-gray-100">
                {[
                  { icon: ImageIcon, label: 'Group Media', count: messages.filter(m => m.message_type === 'image').length, view: 'media' as const, color: '#3B5BDB', tint: '#E4E9FB' },
                  { icon: LocationIcon, label: 'Shared Locations', count: messages.filter(m => m.message_type === 'location').length, view: 'locations' as const, color: '#1A9A5C', tint: '#DFF3E3' },
                  { icon: Calendar, label: 'Ride Plans', count: ridePlans.length, view: 'ridePlans' as const, color: '#7C4DFF', tint: '#EDE6FB' },
                  { icon: ShieldAlert, label: 'Incident Reports', count: groupAlerts.length, view: null, color: '#E85D67', tint: '#FBE4E4', onClick: () => { setShowMembers(false); setInfoTab('incidents'); } },
                  { icon: PinIcon, label: 'Pinned Messages', count: messages.filter(m => m.is_pinned).length, view: 'pinned' as const, color: '#C99A1A', tint: '#FFF3D1' },
                ].map(row => (
                  <button key={row.label} onClick={row.onClick || (() => setGroupInfoView(row.view!))} className="p-3.5 flex items-center justify-between cursor-pointer text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 icon-badge shrink-0" style={{ backgroundColor: row.tint }}>
                        <row.icon className="w-4 h-4" style={{ color: row.color }} />
                      </div>
                      <span className="text-[13px] font-bold text-gray-950">{row.label}</span>
                    </div>
                    <span className="bg-gray-100 text-gray-600 text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center">{row.count}</span>
                  </button>
                ))}
              </div>

              {/* Members List */}
              <div>
                <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Members</span>
                <div className="mt-2 card-app flex flex-col overflow-hidden divide-y divide-gray-100">
                  {groupMembers.map(member => (
                    <div key={member.id} role="button" tabIndex={0} onClick={() => navigate(`/rider/${member.user_id}`)} className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="relative w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-gray-500 font-semibold text-[13px]">{member.username.substring(0,2).toUpperCase()}</span>
                          {member.user_id === activeGroup.admin_id && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white bg-green-500"></div>
                          )}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-950 text-[14px]">{member.username}</span>
                          {member.user_id === activeGroup.admin_id && (
                            <span className="ml-2 bg-[#FFE3D1] text-[#FF6B22] text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wider">Admin</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Report an Incident — full-width, matches the reference */}
              <button onClick={() => navigate('/map', { state: { reportMode: true, presetGroupId: activeGroup?.id } })} className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-[14px] rounded-2xl cursor-pointer flex flex-col items-center justify-center gap-0.5 mb-2">
                <span className="flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Report an Incident</span>
                <span className="text-[10px] font-medium text-white/80">Visible only to this group</span>
              </button>
            </div>
            )}

            {groupInfoView === 'media' && (
              <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pb-4 max-w-[520px] w-full mx-auto">
                {messages.filter(m => m.message_type === 'image').length === 0 ? (
                  <div className="card-app p-6 text-center mt-4"><ImageIcon className="w-6 h-6 text-gray-300 mx-auto mb-2" /><p className="text-[12px] font-semibold text-gray-500">No photos shared in this group yet.</p></div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {messages.filter(m => m.message_type === 'image').map(m => (
                      <img key={m.id} src={m.image_url} alt="" className="w-full aspect-square object-cover rounded-xl" />
                    ))}
                  </div>
                )}
              </div>
            )}

            {groupInfoView === 'locations' && (
              <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pb-4 flex flex-col gap-2.5 max-w-[520px] w-full mx-auto">
                {messages.filter(m => m.message_type === 'location').length === 0 ? (
                  <div className="card-app p-6 text-center mt-4"><LocationIcon className="w-6 h-6 text-gray-300 mx-auto mb-2" /><p className="text-[12px] font-semibold text-gray-500">No one has shared a location here yet.</p></div>
                ) : messages.filter(m => m.message_type === 'location').map(m => (
                  <a key={m.id} href={`https://www.google.com/maps?q=${m.location_lat},${m.location_lng}`} target="_blank" rel="noreferrer" className="card-app p-3.5 flex items-center gap-3">
                    <div className="w-9 h-9 icon-badge bg-emerald-50 shrink-0"><LocationIcon className="w-4 h-4 text-emerald-600" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-gray-950">{m.username}</p>
                      <p className="text-[10.5px] text-gray-500 font-medium">{new Date(m.created_at).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}

            {groupInfoView === 'ridePlans' && (
              <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pb-4 flex flex-col gap-2.5 max-w-[520px] w-full mx-auto">
                {ridePlans.length === 0 ? (
                  <div className="card-app p-6 text-center mt-4"><Calendar className="w-6 h-6 text-gray-300 mx-auto mb-2" /><p className="text-[12px] font-semibold text-gray-500">No rides planned for this group yet.</p></div>
                ) : ridePlans.map(r => (
                  <button key={r.id} onClick={() => navigate(`/ride-plus/view/${r.id}`)} className="card-app p-2.5 flex items-center gap-3 text-left cursor-pointer">
                    <img src={r.image_url || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&q=60'} alt="" className="w-14 h-14 rounded-2xl object-cover shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-gray-950 truncate">{r.name}</p>
                      <p className="text-[10.5px] text-gray-500 font-medium">{r.ride_date ? new Date(r.ride_date).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }) : 'Date TBD'}</p>
                    </div>
                  </button>
                ))}
                <button onClick={() => navigate('/ride-plus/create', { state: { presetGroupId: activeGroup.id } })} className="w-full py-3 card-app text-[#FF6B22] font-bold text-[12px] rounded-full cursor-pointer flex items-center justify-center gap-1.5">
                  + Plan a Ride
                </button>
              </div>
            )}

            {groupInfoView === 'pinned' && (
              <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pb-4 flex flex-col gap-2.5 max-w-[520px] w-full mx-auto">
                {messages.filter(m => m.is_pinned).length === 0 ? (
                  <div className="card-app p-6 text-center mt-4"><PinIcon className="w-6 h-6 text-gray-300 mx-auto mb-2" /><p className="text-[12px] font-semibold text-gray-500">No pinned messages yet. Long-press a message in chat to pin it.</p></div>
                ) : messages.filter(m => m.is_pinned).map(m => (
                  <div key={m.id} className="card-app p-3.5">
                    <p className="text-[11px] font-bold text-gray-500">{m.username}</p>
                    <p className="text-[13px] font-semibold text-gray-950 mt-0.5">{m.message_type === 'image' ? '📷 Photo' : m.message_type === 'location' ? '📍 Shared location' : m.content}</p>
                  </div>
                ))}
              </div>
            )}

            {groupInfoView === 'addMembers' && (
              <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pb-4 flex flex-col gap-3 max-w-[520px] w-full mx-auto">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={memberSearchQuery}
                    onChange={e => searchProfilesToAdd(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full h-11 card-app pl-10 pr-3 text-[13px] text-gray-900 placeholder-gray-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#FF6B22]/40"
                  />
                </div>
                {memberSearchResults.map(p => (
                  <div key={p.id} className="card-app p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                      {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-gray-500 font-semibold text-[13px]">{(p.full_name || p.email || '?').substring(0, 2).toUpperCase()}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-gray-950 truncate">{p.full_name || 'Rider'}</p>
                      <p className="text-[10.5px] text-gray-500 font-medium truncate">{p.email}</p>
                    </div>
                    <button onClick={() => addMemberDirectly(p)} disabled={isAddingMember} className="px-3 py-1.5 btn-app-primary text-white text-[11px] font-bold rounded-full cursor-pointer disabled:opacity-50">Add</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Chat View */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Chat Header */}
            <div className="shrink-0 px-4 pt-3 pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <button aria-label="Go back" onClick={() => { setActiveGroup(null); setShowRequests(false); }} className="w-10 h-10 rounded-full card-app flex items-center justify-center shrink-0 cursor-pointer active:scale-95 transition-all">
                    <ArrowLeft className="w-5 h-5 text-gray-950" />
                  </button>
                  <button className="flex items-center gap-3 cursor-pointer min-w-0" onClick={() => { setGroupInfoView('main'); setShowMembers(true); }}>
                    <div className="w-10 h-10 bg-[#FFE3D1] rounded-full flex items-center justify-center shrink-0">
                      <span className="text-[#FF6B22] font-bold text-[13px]">{groupInitials(activeGroup.name)}</span>
                    </div>
                    <div className="min-w-0 text-left">
                      <h2 className="font-bold text-[15px] text-gray-950 leading-tight truncate">{activeGroup.name}</h2>
                      <p className="text-[11px] font-medium text-gray-500">{groupMembers.length} members</p>
                    </div>
                  </button>
                </div>
                <button onClick={() => { setGroupInfoView('main'); setShowMembers(true); }} className="w-10 h-10 rounded-full card-app flex items-center justify-center text-gray-700 shrink-0 cursor-pointer active:scale-95 transition-all">
                  <MoreVertical className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Chat / Incidents / Members tabs — every tab here is backed by real data */}
              <div className="flex items-center gap-5 mt-3 border-b border-gray-100">
                {([
                  { id: 'chat', label: 'Chat' },
                  { id: 'incidents', label: `Incidents${groupAlerts.length ? ` (${groupAlerts.length})` : ''}` },
                  { id: 'members', label: `Members (${groupMembers.length})` },
                ] as const).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setInfoTab(tab.id)}
                    className={`pb-2.5 text-[13px] font-bold cursor-pointer border-b-2 transition-colors ${
                      infoTab === tab.id ? 'text-[#FF6B22] border-[#FF6B22]' : 'text-gray-400 border-transparent'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {infoTab === 'incidents' ? (
              <div className="flex-1 overflow-y-auto hide-scrollbar px-4 py-4 flex flex-col gap-2.5">
                {groupAlerts.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <ShieldAlert className="w-8 h-8 text-gray-300 mb-2" />
                    <p className="text-[13px] font-semibold text-gray-500">No incidents reported here yet.</p>
                  </div>
                ) : (
                  groupAlerts.map(alert => (
                    <div key={alert.id} className="card-app p-3.5 flex items-center gap-3">
                      <div className="w-9 h-9 icon-badge bg-red-50 shrink-0">
                        <ShieldAlert className="w-4 h-4 text-red-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold text-gray-950 truncate">{alert.category || 'Incident'}</p>
                        <p className="text-[11px] text-gray-500 font-medium truncate">{alert.description || `Reported by ${alert.reporter_name || 'a member'}`}</p>
                      </div>
                      <span className="text-[10px] font-semibold text-gray-400 shrink-0">
                        {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            ) : infoTab === 'members' ? (
              <div className="flex-1 overflow-y-auto hide-scrollbar px-4 py-4">
                <div className="card-app flex flex-col overflow-hidden divide-y divide-gray-100">
                  {groupMembers.map(member => (
                    <div key={member.id} role="button" tabIndex={0} onClick={() => navigate(`/rider/${member.user_id}`)} className="p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50">
                      <div className="relative w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-gray-500 font-semibold text-[13px]">{member.username.substring(0,2).toUpperCase()}</span>
                        {member.user_id === activeGroup.admin_id && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white bg-green-500"></div>
                        )}
                      </div>
                      <span className="font-semibold text-gray-950 text-[14px]">{member.username}</span>
                      {member.user_id === activeGroup.admin_id && (
                        <span className="ml-1 bg-[#FFE3D1] text-[#FF6B22] text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wider">Admin</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
            <div className="flex-1 overflow-y-auto hide-scrollbar px-4 py-4 flex flex-col gap-3">
              {!(memberStatus === 'accepted' || isAdmin) ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  {memberStatus === 'pending' ? (
                    <>
                      <div className="w-16 h-16 bg-[#FFE3D1] rounded-full flex items-center justify-center mb-4">
                        <Clock className="w-7 h-7 text-[#FF6B22]" strokeWidth={2} />
                      </div>
                      <h3 className="text-[17px] font-semibold text-gray-950 mb-1">Request Pending</h3>
                      <p className="text-[13px] text-gray-400 font-medium">Waiting for admin approval.</p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-[#FFE3D1] rounded-full flex items-center justify-center mb-4">
                        <Users className="w-7 h-7 text-[#FF6B22]" strokeWidth={2} />
                      </div>
                      <h3 className="text-[17px] font-semibold text-gray-950 mb-1">Join {activeGroup.name}</h3>
                      <p className="text-[13px] text-gray-400 font-medium mb-5">Join to see the chat.</p>
                      <button disabled={isJoining} onClick={joinGroup} className="px-8 py-3 btn-app-primary hover:brightness-110 text-white font-semibold text-[14px] rounded-2xl transition-all disabled:opacity-50 active:scale-95">
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
                      <div key={msg.id} className={`flex w-full group ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {!isMe && (
                          <div role="button" tabIndex={0} aria-label={`View ${msg.username}`} onClick={() => navigate(`/rider/${msg.user_id}`)} className="w-7 h-7 bg-gray-200/70 rounded-full flex items-center justify-center mr-2 shrink-0 self-end mb-4 cursor-pointer">
                            <span className="text-[11px] font-semibold text-gray-500">{msg.username.substring(0,1).toUpperCase()}</span>
                          </div>
                        )}
                        <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                          {!isMe && <button type="button" onClick={() => navigate(`/rider/${msg.user_id}`)} className="text-[11px] font-semibold text-gray-500 mb-1 ml-1 hover:underline">{msg.username}</button>}
                          {msg.message_type === 'image' && msg.image_url ? (
                            <img src={msg.image_url} alt="" className="w-[180px] h-[180px] object-cover rounded-2xl" />
                          ) : msg.message_type === 'location' && msg.location_lat ? (
                            <a href={`https://www.google.com/maps?q=${msg.location_lat},${msg.location_lng}`} target="_blank" rel="noreferrer" className={`px-3.5 py-2.5 text-[13px] leading-snug flex items-center gap-2 ${isMe ? 'btn-app-primary text-white rounded-t-2xl rounded-bl-2xl rounded-br-sm' : 'card-app text-gray-950 rounded-t-2xl rounded-br-2xl rounded-bl-sm'}`}>
                              <LocationIcon className="w-4 h-4" /> Shared location
                            </a>
                          ) : (
                            <div className={`px-3.5 py-2.5 text-[13px] leading-snug ${isMe ? 'btn-app-primary text-white rounded-t-2xl rounded-bl-2xl rounded-br-sm' : 'card-app text-gray-950 rounded-t-2xl rounded-br-2xl rounded-bl-sm'}`}>
                              {msg.content}
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 mt-1">
                            {msg.is_pinned && <PinIcon className="w-2.5 h-2.5 text-[#FF6B22]" />}
                            <span className={`text-[10px] font-medium text-gray-400 ${isMe ? 'mr-1' : 'ml-1'}`}>
                              {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                            <button onClick={() => togglePinMessage(msg)} className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-bold text-gray-400 hover:text-[#FF6B22] cursor-pointer">
                              {msg.is_pinned ? 'Unpin' : 'Pin'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
            )}

            {/* Chat Input */}
            {infoTab === 'chat' && (memberStatus === 'accepted' || isAdmin) && (
              <div className="shrink-0 p-3">
                <input ref={chatImageInputRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) sendImageMessage(e.target.files[0]); }} />
                <form onSubmit={sendMessage} className="flex items-center gap-2">
                  <button type="button" onClick={() => chatImageInputRef.current?.click()} className="w-11 h-11 card-app flex items-center justify-center text-gray-600 shrink-0 cursor-pointer active:scale-95 transition-all" title="Send a photo">
                    <Camera className="w-4.5 h-4.5" />
                  </button>
                  <button type="button" onClick={shareLocation} disabled={pendingLocationShare} className="w-11 h-11 card-app flex items-center justify-center text-gray-600 shrink-0 cursor-pointer active:scale-95 transition-all disabled:opacity-50" title="Share your location">
                    {pendingLocationShare ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Navigation2 className="w-4.5 h-4.5" />}
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 h-11 card-app px-4 outline-none text-[14px] text-gray-950 placeholder-gray-400 font-medium focus:ring-2 focus:ring-[#FF6B22]/40 transition-all"
                  />
                  <button type="submit" disabled={!newMessage.trim()} className="w-11 h-11 btn-app-primary hover:brightness-110 rounded-2xl flex items-center justify-center text-white shrink-0 disabled:opacity-40 transition-all active:scale-95">
                    <Send className="w-5 h-5 ml-0.5" strokeWidth={2} />
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupsHMI;

