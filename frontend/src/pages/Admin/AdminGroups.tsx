import React, { useCallback, useEffect, useState, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { supabase } from '../../lib/supabase';
import { auth } from '../../lib/firebase';
import { UsersRound, Lock, Globe, X, Trash2, Send, Pin, UserMinus } from 'lucide-react';
import { SearchInput } from '../../components/ui/SearchInput';
import { useConfirm } from '../../components/ConfirmDialog';
import { useToast } from '../../components/ToastContext';
import { getDeterministicUuid } from '../../lib/user';

const AdminGroups = () => {
  const confirm = useConfirm();
  const { showToast } = useToast();

  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all');
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [groupMessages, setGroupMessages] = useState<any[]>([]);
  const [showGroupDrawer, setShowGroupDrawer] = useState(false);
  const [isMembersDrawerOpen, setIsMembersDrawerOpen] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [pinnedMessageId, setPinnedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  const logAudit = async (action: string, targetId: string, details: any) => {
    try {
      const actorId = auth.currentUser?.uid ? getDeterministicUuid(auth.currentUser.uid) : null;
      if (!actorId) return;
      await supabase.from('audit_logs').insert([{ actor_id: actorId, action, target_id: targetId, details }]);
    } catch { /* non-critical */ }
  };

  // ── fetchGroups at component scope so handlers can call it ────────────────
  const fetchGroups = useCallback(async () => {
    const { data, error } = await supabase
      .from('groups')
      .select('*, group_members(count)')
      .order('created_at', { ascending: false });
    if (error) { console.error('Failed to load groups:', error); return; }
    if (data) {
      setGroups(data.map((g: any) => ({ ...g, members_count: g.group_members?.[0]?.count || 0 })));
    }
    setLoading(false);
  }, []);

  const handleDeleteGroup = async (group: any) => {
    const ok = await confirm({
      title: 'Delete Group',
      message: `"${group.name}" and all its messages and members will be permanently removed. This cannot be undone.`,
      confirmLabel: 'Delete Group',
      variant: 'danger',
    });
    if (!ok) return;

    // Delete messages first (may not exist — ignore error)
    await supabase.from('messages').delete().eq('group_id', group.id);
    // Delete members
    await supabase.from('group_members').delete().eq('group_id', group.id);
    // Delete the group itself
    const { error } = await supabase.from('groups').delete().eq('id', group.id);
    if (error) {
      showToast('Delete failed: ' + error.message, 'error');
      return;
    }
    await logAudit('DELETE', group.id, { action: 'delete_group', name: group.name });
    showToast(`Group "${group.name}" deleted`, 'success');
    setSelectedGroup(null);
    setGroupMembers([]);
    setGroupMessages([]);
    setIsMembersDrawerOpen(false);
    // Manually refresh list since realtime may not fire for admin-initiated deletes
    fetchGroups();
  };

  const handleDeleteMessage = async (message: any) => {
    const ok = await confirm({
      title: 'Remove Message',
      message: 'This message will be permanently removed from the group.',
      confirmLabel: 'Remove',
      variant: 'danger',
    });
    if (!ok) return;
    const { error } = await supabase.from('messages').delete().eq('id', message.id);
    if (error) { showToast('Failed to remove message', 'error'); return; }
    await logAudit('DELETE', message.id, { action: 'delete_message', group_id: message.group_id, content: message.content?.slice(0, 80) });
    showToast('Message removed', 'success');
    setGroupMessages(prev => prev.filter(m => m.id !== message.id));
  };

  const handleRemoveMember = async (member: any) => {
    const ok = await confirm({
      title: 'Remove Member',
      message: `${member.username || 'This member'} will be removed from the group.`,
      confirmLabel: 'Remove',
      variant: 'warning',
    });
    if (!ok) return;
    const { error } = await supabase.from('group_members').delete().eq('id', member.id);
    if (error) { showToast('Failed to remove member', 'error'); return; }
    await logAudit('DELETE', member.id, { action: 'remove_member', group_id: member.group_id, username: member.username });
    showToast(`${member.username || 'Member'} removed`, 'success');
    setGroupMembers(prev => prev.filter(m => m.id !== member.id));
  };

  const handleSendAdminMessage = async () => {
    if (!adminMessage.trim() || !selectedGroup) return;
    setSendingMsg(true);
    const adminUser = auth.currentUser;
    const adminUserId = adminUser?.uid ? getDeterministicUuid(adminUser.uid) : null;
    if (!adminUserId) {
      showToast('Please log in again', 'error');
      setSendingMsg(false);
      return;
    }
    const { error } = await supabase.from('messages').insert([{
      group_id: selectedGroup.id,
      user_id: adminUserId,
      username: `[Admin] ${adminUser?.displayName || adminUser?.email || 'Admin'}`,
      content: adminMessage.trim(),
    }]);
    if (error) showToast('Failed to send message', 'error');
    else {
      await logAudit('CREATE', selectedGroup.id, { action: 'admin_message', content: adminMessage.trim().slice(0, 80) });
      setAdminMessage('');
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
    setSendingMsg(false);
  };

  const handlePinMessage = async (message: any) => {
    const newPinned = pinnedMessageId === message.id ? null : message.id;
    setPinnedMessageId(newPinned);
    // Optionally persist pinned_message_id to groups table
    await supabase.from('groups').update({ pinned_message_id: newPinned }).eq('id', selectedGroup.id);
    await logAudit('UPDATE', selectedGroup.id, { action: newPinned ? 'pin_message' : 'unpin_message', message_id: message.id });
  };

  const filteredGroups = groups.filter((group) => {
    const matchesSearch = [group.name, group.description, group.admin?.full_name].some((value) =>
      String(value || '').toLowerCase().includes(search.toLowerCase())
    );

    const matchesFilter =
      filter === 'all' ||
      (filter === 'public' && !group.is_private) ||
      (filter === 'private' && group.is_private);

    return matchesSearch && matchesFilter;
  });

  const fetchGroupDetails = async (groupId: string) => {
    if (!groupId) {
      setGroupMembers([]);
      setGroupMessages([]);
      return;
    }

    const [{ data: members, error: membersError }, { data: messages, error: messagesError }] = await Promise.all([
      supabase.from('group_members').select('*').eq('group_id', groupId),
      supabase
        .from('messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true }),
    ]);

    if (membersError || messagesError) {
      console.error('Failed to load group details:', membersError || messagesError);
    }

    setGroupMembers(members ?? []);
    setGroupMessages(messages ?? []);

    setSelectedGroup((current: any | null) =>
      current && current.id === groupId
        ? { ...current, members: members ?? [], messages: messages ?? [] }
        : current
    );
  };

  useEffect(() => {
    fetchGroups();

    const groupsChannel = supabase
      .channel('groups-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, () => {
        fetchGroups();
      })
      .subscribe();

    return () => { groupsChannel.unsubscribe(); };
  }, [fetchGroups]);

  useEffect(() => {
    if (!selectedGroup?.id) return;

    fetchGroupDetails(selectedGroup.id);

    const messagesChannel = supabase
      .channel(`group-${selectedGroup.id}-messages`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${selectedGroup.id}`,
        },
        () => {
          fetchGroupDetails(selectedGroup.id);
        }
      )
      .subscribe();

    return () => {
      messagesChannel.unsubscribe();
    };
  }, [selectedGroup]);

  return (
    <div className="flex w-full h-full text-[#273a5a] bg-[#FFFFFF] overflow-hidden">
      
      {/* Left Sidebar - List */}
      <div className="w-[30%] flex flex-col h-full bg-white relative z-10 border-r border-[#E5E5EA]">
        
        {/* Header */}
        <div className="px-6 pt-3 pb-4 border-b border-[#E5E5EA] shrink-0">
          <div className="flex flex-col gap-2 mb-2">
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg self-start">
              <button onClick={() => setFilter('all')} className={`px-2 py-1 text-[10px] font-bold rounded ${filter === 'all' ? 'bg-white shadow text-[#273a5a]' : 'text-gray-500'}`}>All</button>
              <button onClick={() => setFilter('public')} className={`flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded ${filter === 'public' ? 'bg-white shadow text-[#273a5a]' : 'text-gray-500'}`}>
                <Globe className="w-3 h-3" /> Public
              </button>
              <button onClick={() => setFilter('private')} className={`flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded ${filter === 'private' ? 'bg-white shadow text-[#273a5a]' : 'text-gray-500'}`}>
                <Lock className="w-3 h-3" /> Private
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-1 mt-3">
            <div className="flex items-center gap-2 text-[#ef4523]">
              <UsersRound className="w-5 h-5" />
              <h1 className="text-[20px] font-bold text-[#273a5a]">{groups.length} Total Groups</h1>
            </div>
          </div>
          <p className="text-[12px] text-[#8A8A8E] mb-3">Overview and manage groups</p>

          <div className="flex gap-2">
            <div className="flex-1">
              <SearchInput 
                variant="admin"
                placeholder="Search groups..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto hide-scrollbar bg-[#FFFFFF]">
          <div className="flex flex-col">
            {filteredGroups.length > 0 ? (
              filteredGroups.map(group => (
                <div 
                  key={group.id} 
                  onClick={() => setSelectedGroup(group)}
                  className={`bg-white border-b p-2 flex gap-3 hover:bg-gray-50 transition-colors cursor-pointer group ${selectedGroup?.id === group.id ? 'border-l-4 border-l-[#ef4523] bg-orange-50/30' : 'border-l-4 border-l-transparent border-b-[#E5E5EA]'}`}
                >
                  <div className="w-[36px] h-[36px] rounded flex items-center justify-center flex-shrink-0 bg-gray-100 text-[#ef4523]">
                    <UsersRound className="w-4 h-4" strokeWidth={2.5} />
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between py-0">
                    <div className="flex justify-between items-start">
                      <h3 className="text-[12px] font-bold leading-none truncate max-w-[130px] pt-0.5">{group.name || 'Untitled group'}</h3>
                      <span className={`text-[8px] font-bold px-1 py-0.5 rounded uppercase ${
                        group.is_private ? 'bg-[#F2F4F7] text-[#8A8A8E]' : 'bg-[#E5F9ED] text-[#34C759]'
                      }`}>
                        {group.is_private ? 'PRIV' : 'PUB'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-end mt-1">
                      <div className="flex items-center gap-1.5 text-[9px] font-medium text-[#8A8A8E]">
                        <span className="font-mono">ID:{group.id.slice(0,5)}..</span>
                        <div className="w-0.5 h-0.5 bg-[#E5E5EA] rounded-full"></div>
                        <span className="text-[#ef4523] font-bold">{group.members_count || 0} Mem</span>
                      </div>
                      <span className="text-[8px] font-medium text-[#8A8A8E]">
                        {group.created_at ? new Date(group.created_at).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-[#8A8A8E] text-[12px] bg-white border-b border-[#E5E5EA]">
                No groups found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Group Chat & Details */}
      <div className="flex-1 flex flex-col h-full relative z-0 bg-[#F8F9FA]">
        {selectedGroup ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="h-[72px] px-6 bg-white border-b border-[#E5E5EA] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-[#ef4523]">
                  <UsersRound className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-[16px] font-bold text-[#273a5a] leading-tight">{selectedGroup.name}</h2>
                  <div className="flex items-center gap-2 text-[11px] text-[#8A8A8E] mt-0.5">
                    <span className="font-mono">ID: {selectedGroup.id.slice(0,6)}..</span>
                    <span className="w-1 h-1 bg-[#E5E5EA] rounded-full"></span>
                    <span>Admin: <span className="font-semibold text-[#273a5a]">{selectedGroup.admin?.full_name || 'Unknown'}</span></span>
                    <span className="w-1 h-1 bg-[#E5E5EA] rounded-full"></span>
                    <span className={`uppercase font-bold ${selectedGroup.is_private ? 'text-rose-500' : 'text-[#34C759]'}`}>{selectedGroup.is_private ? 'Private' : 'Public'}</span>
                    <span className="w-1 h-1 bg-[#E5E5EA] rounded-full"></span>
                    <span>Created: {new Date(selectedGroup.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsMembersDrawerOpen(!isMembersDrawerOpen)}
                  className={`px-4 h-8 rounded border flex items-center gap-2 text-[12px] font-bold transition-colors ${isMembersDrawerOpen ? 'bg-[#ef4523] text-white border-[#ef4523]' : 'bg-white text-[#273a5a] border-[#E5E5EA] hover:bg-gray-50'}`}
                >
                  <UsersRound className="w-4 h-4" />
                  {groupMembers.length} Members
                </button>
                <button
                  onClick={() => handleDeleteGroup(selectedGroup)}
                  className="w-8 h-8 rounded border border-[#E5E5EA] flex items-center justify-center text-[#8A8A8E] hover:text-[#FF3B30] hover:bg-[#FFEBEE] transition-colors"
                  title="Delete Group"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setSelectedGroup(null);
                    setGroupMembers([]);
                    setGroupMessages([]);
                    setIsMembersDrawerOpen(false);
                  }}
                  className="w-8 h-8 rounded border border-[#E5E5EA] flex items-center justify-center text-[#8A8A8E] hover:bg-gray-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative bg-[#F8F9FA]">
               {/* Chat Area */}
               <div className="flex-1 flex flex-col overflow-hidden relative">
                  {/* Pinned message banner */}
                  {pinnedMessageId && (() => {
                    const pinned = groupMessages.find(m => m.id === pinnedMessageId);
                    return pinned ? (
                      <div className="shrink-0 mx-4 mt-3 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                        <Pin className="w-3.5 h-3.5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-bold text-yellow-700 uppercase mb-0.5">Pinned by Admin</div>
                          <p className="text-[12px] text-[#273a5a] truncate">{pinned.content}</p>
                        </div>
                        <button onClick={() => handlePinMessage(pinned)} className="text-yellow-500 hover:text-yellow-700">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : null;
                  })()}

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {groupMessages.length ? (
                      groupMessages.map((message) => (
                        <div key={message.id} className={`group rounded-xl border p-3.5 bg-white shadow-sm max-w-[80%] self-start ${ message.id === pinnedMessageId ? 'border-yellow-300 bg-yellow-50/50' : 'border-[#E5E5EA]' }`}>
                          <div className="flex items-center justify-between gap-6 mb-2 border-b border-[#F2F4F7] pb-1.5">
                            <span className={`font-bold text-[12px] ${ message.username?.startsWith('[Admin]') ? 'text-[#273a5a]' : 'text-[#ef4523]' }`}>{message.username || message.user_id || 'Member'}</span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[10px] font-semibold text-[#8A8A8E]">{new Date(message.created_at).toLocaleString()}</span>
                              <button onClick={() => handlePinMessage(message)} className={`w-5 h-5 flex items-center justify-center rounded hover:bg-yellow-100 ${ message.id === pinnedMessageId ? 'text-yellow-500' : 'text-[#8A8A8E]' }`} title="Pin message">
                                <Pin className="w-3 h-3" />
                              </button>
                              <button onClick={() => handleDeleteMessage(message)} className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#FFEBEE] text-[#8A8A8E] hover:text-[#FF3B30]" title="Delete message">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="text-[13px] text-[#273a5a] leading-relaxed whitespace-pre-wrap">
                            {(() => {
                              if (message.content?.startsWith('🚨 New Report:')) {
                                let textPart = message.content;
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
  
                                return (
                                  <div className="w-full mt-1 border border-gray-100 rounded-xl p-3 bg-[#F8F9FA]">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                        <span className="text-[16px]">🚨</span>
                                      </div>
                                      <div>
                                        <div className="font-bold text-[14px] text-[#273a5a]">{incidentCategory}</div>
                                        <div className="text-[11px] text-[#8A8A8E]">Community Alert</div>
                                      </div>
                                    </div>
                                    
                                    <div className="text-[13px] font-medium text-[#273a5a] mb-2">
                                      {incidentDescription}
                                    </div>
                                    
                                    {photoUrl && (
                                      <div className="mb-2 mt-2">
                                        {photoUrl.split(',').map((url, i) => (
                                          <img key={i} src={url} alt="Incident" className="w-full h-32 object-cover rounded-xl border border-gray-100 mb-1" />
                                        ))}
                                      </div>
                                    )}
                                    
                                    {incidentId && (
                                      <div className="text-[10px] text-[#8A8A8E] mt-2 font-mono bg-white p-1.5 rounded border border-gray-100 break-all">
                                        ID: {incidentId}
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                              return message.content;
                            })()}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center text-[#8A8A8E]">
                         <div className="w-12 h-12 rounded-full bg-white border border-[#E5E5EA] shadow-sm flex items-center justify-center mb-3">
                            <UsersRound className="w-5 h-5 text-[#E5E5EA]" />
                         </div>
                         <p className="text-[13px] font-semibold">No chat messages yet.</p>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Admin send message bar */}
                  <div className="shrink-0 px-4 pb-4 pt-2 border-t border-[#E5E5EA] bg-white">
                    <div className="flex gap-2">
                      <input
                        value={adminMessage}
                        onChange={e => setAdminMessage(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendAdminMessage()}
                        placeholder="Send admin announcement..."
                        className="flex-1 h-9 px-3 text-[12px] border border-[#E5E5EA] rounded-lg focus:outline-none focus:border-[#ef4523]"
                      />
                      <button
                        onClick={handleSendAdminMessage}
                        disabled={sendingMsg || !adminMessage.trim()}
                        className="w-9 h-9 rounded-lg bg-[#ef4523] text-white flex items-center justify-center disabled:opacity-50 hover:bg-[#ef4523]/90"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
               </div>

               {/* Right Drawer Popup for Members */}
               <div className={`absolute top-0 right-0 h-full bg-white border-l border-[#E5E5EA] shadow-2xl transition-all duration-300 z-10 flex flex-col ${isMembersDrawerOpen ? 'w-[320px] translate-x-0' : 'w-[320px] translate-x-full opacity-0 pointer-events-none'}`}>
                  <div className="h-[60px] px-4 border-b border-[#E5E5EA] flex justify-between items-center bg-[#FFFFFF] shrink-0">
                    <h3 className="text-[13px] font-bold text-[#273a5a] uppercase tracking-wide">All Users ({groupMembers.length})</h3>
                    <button onClick={() => setIsMembersDrawerOpen(false)} className="w-7 h-7 rounded border border-[#E5E5EA] flex items-center justify-center text-[#8A8A8E] hover:bg-gray-50">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#F8F9FA]">
                    {groupMembers.length ? (
                      groupMembers.map((member) => (
                        <div key={member.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-[#E5E5EA] shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-[#ef4523]/30 transition-colors group">
                          <div className="w-10 h-10 rounded-full bg-[#F2F4F7] flex items-center justify-center overflow-hidden shrink-0 border border-[#E5E5EA]">
                            <span className="text-[#8A8A8E] font-bold text-[13px]">{member.username?.[0]?.toUpperCase() || 'U'}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-[13px] text-[#273a5a] truncate">{member.username || 'Unknown User'}</div>
                            <div className="text-[11px] text-[#8A8A8E] mt-0.5 truncate">Joined: {new Date(member.created_at).toLocaleDateString()}</div>
                          </div>
                          <button
                            onClick={() => handleRemoveMember(member)}
                            className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded border border-[#E5E5EA] flex items-center justify-center text-[#8A8A8E] hover:text-[#FF3B30] hover:bg-[#FFEBEE] transition-all"
                            title="Remove from group"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-[13px] text-[#8A8A8E] font-semibold text-center mt-10">No users found.</div>
                    )}
                  </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-white shadow-sm border border-[#E5E5EA] flex items-center justify-center mb-4">
              <UsersRound className="w-8 h-8 text-[#8A8A8E]" />
            </div>
            <h3 className="text-[18px] font-bold text-[#273a5a] mb-2">Select a Group</h3>
            <p className="text-[13px] text-[#8A8A8E] max-w-[250px]">Choose a group from the list to view its chat history and member details.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminGroups;
