import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { auth } from '../../lib/firebase';
import { DataTable, type ColumnDef } from '../../components/admin/DataTable';
import { Shield, ShieldAlert, Edit, Trash2, X, Users, Car, MapPin, RotateCcw, UserX, AlertCircle } from 'lucide-react';
import { useConfirm } from '../../components/ConfirmDialog';
import { useToast } from '../../components/ToastContext';
import { getDeterministicUuid } from '../../lib/user';

const RESTORE_DAYS = 30;

const AdminUsers = () => {
  const confirm = useConfirm();
  const { showToast } = useToast();

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');
  
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userDetails, setUserDetails] = useState<any>({ createdRides: [], joinedRides: [], groups: [], savedLocations: [] });
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', role: '', status: '' });

  const logAudit = async (action: string, targetId: string, details: any) => {
    try {
      const actorId = auth.currentUser?.uid ? getDeterministicUuid(auth.currentUser.uid) : null;
      if (!actorId) return;
      await supabase.from('audit_logs').insert([{ actor_id: actorId, action, target_id: targetId, details }]);
    } catch { /* non-critical */ }
  };

  const fetchUsers = async () => {
    setLoading(true);
    let { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
      
    // Auto-backfill if profiles is empty!
    if (!error && (!data || data.length === 0)) {
      const { data: rideMembers } = await supabase.from('ride_members').select('user_id, display_name, avatar_url');
      if (rideMembers && rideMembers.length > 0) {
        const uniqueUsers = new Map();
        rideMembers.forEach((m: any) => {
          if (!uniqueUsers.has(m.user_id)) {
            uniqueUsers.set(m.user_id, {
              id: m.user_id,
              full_name: m.display_name,
              email: 'firebase.user@app.com', // placeholder
              avatar_url: m.avatar_url,
              role: 'user',
              status: 'active'
            });
          }
        });
        
        const usersToInsert = Array.from(uniqueUsers.values());
        if (usersToInsert.length > 0) {
          await supabase.from('profiles').upsert(usersToInsert, { onConflict: 'id' });
          // Fetch again after backfill
          const res = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
          data = res.data;
          error = res.error;
        }
      }
    }

    if (error) {
      setErrorMsg(error.message);
    } else if (data) {
      // Deduplicate by email: keep the one with role='admin' if there's a conflict
      const dedupedMap = new Map();
      data.forEach((user: any) => {
        const key = user.email ? user.email.toLowerCase() : user.id;
        if (dedupedMap.has(key)) {
          const existing = dedupedMap.get(key);
          if (user.role === 'admin' && existing.role !== 'admin') {
            dedupedMap.set(key, user);
          }
        } else {
          dedupedMap.set(key, user);
        }
      });
      const allUsers = Array.from(dedupedMap.values());
      // Split by soft-delete state
      if (activeTab === 'deleted') {
        setUsers(allUsers.filter((u: any) => !!u.deleted_at));
      } else {
        setUsers(allUsers.filter((u: any) => !u.deleted_at));
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

  useEffect(() => {
    const subscription = supabase
      .channel('admin_users_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchUsers();
      })
      .subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, []);

  const handleViewUser = async (user: any) => {
    setSelectedUser(user);
    setEditForm({ full_name: user.full_name || '', role: user.role || 'user', status: user.status || 'active' });
    setIsEditing(false);
    setLoadingDetails(true);

    try {
      const [ridesRes, membersRes, groupsRes, locationsRes] = await Promise.all([
        supabase.from('rides').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
        supabase.from('ride_members').select('*, rides(*)').eq('user_id', user.id),
        supabase.from('group_members').select('*, groups(*)').eq('user_id', user.id),
        supabase.from('saved_locations').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      ]);

      setUserDetails({
        createdRides: ridesRes.data || [],
        joinedRides: membersRes.data || [],
        groups: groupsRes.data || [],
        savedLocations: locationsRes.data || []
      });
    } catch (err) {
      console.error(err);
    }
    setLoadingDetails(false);
  };

  const handleAction = async (action: 'suspend' | 'delete' | 'activate', row: any) => {
    if (action === 'delete') {
      const ok = await confirm({
        title: 'Delete User',
        message: `${row.full_name || 'This user'} will be moved to Deleted Users and can be restored within ${RESTORE_DAYS} days.`,
        confirmLabel: 'Delete',
        variant: 'danger',
      });
      if (!ok) return;
      const deletedAt = new Date().toISOString();
      const { error } = await supabase.from('profiles').update({ deleted_at: deletedAt, status: 'suspended' }).eq('id', row.id);
      if (error) { showToast('Delete failed: ' + error.message, 'error'); return; }
      await logAudit('DELETE', row.id, { name: row.full_name, email: row.email, deleted_at: deletedAt });
      showToast(`${row.full_name || 'User'} moved to Deleted Users`, 'info');
      if (selectedUser?.id === row.id) setSelectedUser(null);
      fetchUsers();
    } else {
      const newStatus = action === 'suspend' ? 'suspended' : 'active';
      const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', row.id);
      if (error) { showToast('Status update failed: ' + error.message, 'error'); return; }
      await logAudit('UPDATE', row.id, { field: 'status', old: row.status, new: newStatus });
      showToast(`Account ${newStatus === 'suspended' ? 'suspended' : 'activated'}`, 'success');
      if (selectedUser?.id === row.id) {
        setSelectedUser({ ...selectedUser, status: newStatus });
        setEditForm({ ...editForm, status: newStatus });
      }
      fetchUsers();
    }
  };

  const handleRestore = async (row: any) => {
    const ok = await confirm({ title: 'Restore Account', message: `${row.full_name || 'This user'} will regain full access to the platform.`, confirmLabel: 'Restore', variant: 'info' });
    if (!ok) return;
    const { error } = await supabase.from('profiles').update({ deleted_at: null, status: 'active' }).eq('id', row.id);
    if (error) { showToast('Restore failed: ' + error.message, 'error'); return; }
    await logAudit('UPDATE', row.id, { action: 'restore', name: row.full_name });
    showToast(`${row.full_name || 'Account'} restored`, 'success');
    if (selectedUser?.id === row.id) setSelectedUser(null);
    fetchUsers();
  };

  const handlePermanentDelete = async (row: any) => {
    const ok = await confirm({ title: 'Permanently Delete', message: `${row.full_name || 'This account'} will be erased forever with all associated data. This cannot be undone.`, confirmLabel: 'Delete Forever', variant: 'danger' });
    if (!ok) return;
    await supabase.from('profiles').delete().eq('id', row.id);
    await logAudit('DELETE', row.id, { action: 'permanent_delete', name: row.full_name });
    showToast('Account permanently deleted', 'success');
    if (selectedUser?.id === row.id) setSelectedUser(null);
    fetchUsers();
  };

  const handleSaveChanges = async () => {
    const { error } = await supabase.from('profiles').update({
      full_name: editForm.full_name,
      role: editForm.role,
      status: editForm.status
    }).eq('id', selectedUser.id);
    if (error) {
      showToast('Failed to update user: ' + error.message, 'error');
    } else {
      await logAudit('UPDATE', selectedUser.id, { fields: editForm, name: editForm.full_name });      showToast('User updated', 'success');      setSelectedUser({ ...selectedUser, ...editForm });
      setIsEditing(false);
      fetchUsers();
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      header: 'User',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex-shrink-0 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
            <img 
              src={row.avatar_url} 
              alt=""
              loading="lazy"
              onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(row.full_name || 'User')}&background=random`; }}
              className="w-full h-full object-cover" 
            />
          </div>
          <div>
            <div className="font-bold text-[12px] leading-tight text-[#273a5a]">{row.full_name || 'Anonymous'}</div>
            <div className="text-[11px] text-[#8A8A8E]">{row.email || 'No email provided'}</div>
          </div>
        </div>
      )
    },
    {
      header: 'ID',
      accessorKey: 'id',
      cell: (row) => <span className="font-mono text-[11px] text-[#8A8A8E]">{row.id.substring(0, 8)}...</span>
    },
    {
      header: 'Status',
      cell: (row) => {
        const isSuspended = row.status === 'suspended';
        return (
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isSuspended ? 'bg-[#FFEBEE] text-[#FF3B30]' : 'bg-[#E5F9ED] text-[#34C759]'}`}>
            {isSuspended ? 'Suspended' : 'Active'}
          </span>
        );
      }
    },
    {
      header: 'Role',
      cell: (row) => (
        <div className="flex items-center gap-1.5 text-gray-600">
          <Shield className="w-3.5 h-3.5" />
          <span className="text-[12px] font-semibold capitalize">{row.role || 'user'}</span>
        </div>
      )
    },
    {
      header: 'Joined',
      cell: (row) => <span className="text-[12px] font-semibold text-[#8A8A8E]">{new Date(row.created_at).toLocaleDateString()}</span>
    }
  ];

  const renderActions = (row: any) => (
    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
      {activeTab === 'active' ? (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); handleViewUser(row); setIsEditing(true); }}
            className="w-7 h-7 rounded border border-[#E5E5EA] bg-white flex items-center justify-center text-[#8A8A8E] hover:text-[#273a5a] transition-colors" title="Edit User">
            <Edit className="w-3.5 h-3.5" />
          </button>
          {row.status === 'suspended' ? (
            <button
              onClick={(e) => { e.stopPropagation(); handleAction('activate', row); }}
              className="w-7 h-7 rounded border border-[#E5E5EA] bg-white flex items-center justify-center text-[#8A8A8E] hover:text-[#34C759] transition-colors" title="Activate User">
              <Shield className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); handleAction('suspend', row); }}
              className="w-7 h-7 rounded border border-[#E5E5EA] bg-white flex items-center justify-center text-[#8A8A8E] hover:text-[#ef4523] transition-colors" title="Suspend User">
              <ShieldAlert className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); handleAction('delete', row); }}
            className="w-7 h-7 rounded border border-[#E5E5EA] bg-white flex items-center justify-center text-[#8A8A8E] hover:text-[#FF3B30] transition-colors" title="Soft Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </>
      ) : (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); handleRestore(row); }}
            className="w-7 h-7 rounded border border-[#E5E5EA] bg-white flex items-center justify-center text-[#8A8A8E] hover:text-[#34C759] transition-colors" title="Restore User">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handlePermanentDelete(row); }}
            className="w-7 h-7 rounded border border-[#E5E5EA] bg-white flex items-center justify-center text-[#8A8A8E] hover:text-[#FF3B30] transition-colors" title="Permanently Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </div>
  );

  // Days remaining before permanent deletion
  const daysRemaining = (deletedAt: string) => {
    const diff = RESTORE_DAYS - Math.floor((Date.now() - new Date(deletedAt).getTime()) / 86400000);
    return Math.max(0, diff);
  };

  return (
    <div className="flex w-full h-full relative overflow-hidden bg-white">
      <div className={`flex-1 w-full p-6 flex flex-col bg-[#Ffffff] text-[#273a5a] overflow-hidden transition-all duration-300 ${selectedUser ? 'pr-[400px]' : ''}`}>
        <div className="mb-3 flex justify-between items-end shrink-0">
          <div>
            <h1 className="text-[18px] font-bold tracking-tight leading-tight">User Management</h1>
            <p className="text-[12px] text-[#8A8A8E] mt-1">Manage all registered users across the platform.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#F2F4F7] p-1 rounded-lg self-start mb-4 shrink-0">
          <button
            onClick={() => { setActiveTab('active'); setSelectedUser(null); }}
            className={`px-4 py-1.5 text-[12px] font-bold rounded-md transition-colors ${ activeTab === 'active' ? 'bg-white shadow text-[#273a5a]' : 'text-[#8A8A8E] hover:text-[#273a5a]' }`}
          >
            Active Users
          </button>
          <button
            onClick={() => { setActiveTab('deleted'); setSelectedUser(null); }}
            className={`px-4 py-1.5 text-[12px] font-bold rounded-md transition-colors flex items-center gap-1.5 ${ activeTab === 'deleted' ? 'bg-white shadow text-[#FF3B30]' : 'text-[#8A8A8E] hover:text-[#273a5a]' }`}
          >
            <UserX className="w-3.5 h-3.5" />
            Deleted Users
          </button>
        </div>
        
        {errorMsg && (
          <div className="mb-4 p-3 bg-[#FFEBEE] text-[#FF3B30] text-[12px] rounded border border-[#FF3B30]/20 font-semibold">
            Error loading profiles: {errorMsg}
          </div>
        )}

        {activeTab === 'deleted' && (
          <div className="mb-3 p-3 bg-[#FFF8F0] border border-orange-200 rounded-lg flex items-start gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
            <p className="text-[12px] text-orange-700">
              Deleted accounts are automatically purged after <strong>{RESTORE_DAYS} days</strong>. Restore before the deadline to recover the account.
            </p>
          </div>
        )}

        <div className="flex-1 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-full text-[12px] text-[#8A8A8E] font-semibold">Loading users...</div>
          ) : (
            <DataTable
              data={users}
              columns={activeTab === 'deleted' ? [
                ...columns,
                {
                  header: 'Deleted',
                  cell: (row: any) => (
                    <div className="text-[11px]">
                      <div className="font-bold text-[#FF3B30]">{new Date(row.deleted_at).toLocaleDateString()}</div>
                      <div className={`font-semibold ${ daysRemaining(row.deleted_at) <= 7 ? 'text-[#FF3B30]' : 'text-[#8A8A8E]' }`}>
                        {daysRemaining(row.deleted_at)}d left
                      </div>
                    </div>
                  )
                }
              ] : columns}
              actions={renderActions}
              onRowClick={handleViewUser}
              searchPlaceholder="Search users by name or email..."
            />
          )}
        </div>
      </div>

      {/* DRAWER FOR SELECTED USER */}
      <div className={`fixed top-0 right-0 h-full w-[400px] bg-white shadow-[-4px_0_24px_rgba(0,0,0,0.1)] z-50 transform transition-transform duration-300 flex flex-col ${selectedUser ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedUser && (
          <>
            <div className="p-5 border-b border-[#E5E5EA] shrink-0 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-20 h-20 rounded-full overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0 shadow-sm">
                    <img 
                      src={selectedUser.avatar_url} 
                      alt=""
                      loading="lazy"
                      onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.full_name || 'User')}&background=random`; }}
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div>
                    <h2 className="text-[18px] font-bold text-dark leading-tight">{selectedUser.full_name || 'Anonymous User'}</h2>
                    <p className="text-[11px] text-[#8A8A8E]">{selectedUser.email || 'No email provided'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="w-8 h-8 rounded-full bg-[#F2F2F7] flex items-center justify-center text-[#8A8A8E] hover:bg-[#E5E5EA] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingDetails ? (
                <div className="flex items-center justify-center h-40 text-gray-500">Loading user details...</div>
              ) : (
                <div className="space-y-8">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#F8F9FB] rounded-lg p-3 text-center">
                      <div className="text-[20px] font-bold text-dark">{userDetails.createdRides.length}</div>
                      <div className="text-[10px] font-bold text-[#8A8A8E] uppercase mt-1">Rides Created</div>
                    </div>
                    <div className="bg-[#F8F9FB] rounded-lg p-3 text-center">
                      <div className="text-[20px] font-bold text-dark">{userDetails.joinedRides.length}</div>
                      <div className="text-[10px] font-bold text-[#8A8A8E] uppercase mt-1">Rides Joined</div>
                    </div>
                    <div className="bg-[#F8F9FB] rounded-lg p-3 text-center">
                      <div className="text-[20px] font-bold text-dark">{userDetails.groups.length}</div>
                      <div className="text-[10px] font-bold text-[#8A8A8E] uppercase mt-1">Groups</div>
                    </div>
                    <div className="bg-[#F8F9FB] rounded-lg p-3 text-center col-span-2">
                      <div className="text-[20px] font-bold text-dark">{userDetails.savedLocations.length}</div>
                      <div className="text-[10px] font-bold text-[#8A8A8E] uppercase mt-1">Saved Locations</div>
                    </div>
                  </div>

                  {/* Profile Editing */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-wider flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Account Settings
                      </h3>
                      {!isEditing && (
                        <button onClick={() => setIsEditing(true)} className="text-[11px] font-bold text-primary hover:underline">
                          Edit
                        </button>
                      )}
                    </div>
                    
                    {isEditing ? (
                      <div className="bg-[#F8F9FB] rounded-lg p-4 space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold text-[#8A8A8E] uppercase mb-1.5">Full Name</label>
                          <input 
                            type="text" 
                            value={editForm.full_name} 
                            onChange={e => setEditForm({...editForm, full_name: e.target.value})}
                            className="w-full h-8 px-2 text-[12px] border border-[#E5E5EA] rounded"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="hidden">
                            <label className="block text-[10px] font-bold text-[#8A8A8E] uppercase mb-1.5">Role</label>
                            <select 
                              value={editForm.role} 
                              onChange={e => setEditForm({...editForm, role: e.target.value})}
                              className="w-full h-8 px-2 text-[12px] border border-[#E5E5EA] rounded capitalize"
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                          <div className="col-span-2">
                            <label className="block text-[10px] font-bold text-[#8A8A8E] uppercase mb-1.5">Status</label>
                            <select 
                              value={editForm.status} 
                              onChange={e => setEditForm({...editForm, status: e.target.value})}
                              className="w-full h-8 px-2 text-[12px] border border-[#E5E5EA] rounded capitalize"
                            >
                              <option value="active">Active</option>
                              <option value="suspended">Suspended</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button onClick={() => setIsEditing(false)} className="flex-1 h-8 rounded border border-[#E5E5EA] text-[12px] font-bold text-dark hover:bg-gray-50">Cancel</button>
                          <button onClick={handleSaveChanges} className="flex-1 h-8 rounded bg-primary text-white text-[12px] font-bold hover:bg-primary/90">Save Changes</button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#F8F9FB] rounded-lg p-3 grid grid-cols-2 gap-y-3 gap-x-4 text-[12px]">
                        <div>
                          <span className="text-[#8A8A8E] block mb-0.5">Role</span>
                          <span className="font-bold text-dark capitalize">{selectedUser.role || 'User'}</span>
                        </div>
                        <div>
                          <span className="text-[#8A8A8E] block mb-0.5">Status</span>
                          <span className={`font-bold capitalize ${selectedUser.status === 'suspended' ? 'text-[#FF3B30]' : 'text-[#34C759]'}`}>
                            {selectedUser.status || 'Active'}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-[#8A8A8E] block mb-0.5">Joined</span>
                          <span className="font-bold text-dark">{new Date(selectedUser.created_at).toLocaleString()}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-[#8A8A8E] block mb-0.5">User ID</span>
                          <span className="font-mono text-dark text-[10px] break-all">{selectedUser.id}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Created Rides */}
                  <div>
                    <h3 className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Car className="w-4 h-4" />
                      Created Rides ({userDetails.createdRides.length})
                    </h3>
                    <div className="space-y-2">
                      {userDetails.createdRides.slice(0, 5).map((ride: any) => (
                        <div key={ride.id} className="p-3 bg-[#F8F9FB] rounded-lg flex items-center justify-between">
                          <div>
                            <div className="font-bold text-[13px] text-dark">{ride.name || 'Unnamed Ride'}</div>
                            <div className="text-[11px] text-[#8A8A8E] mt-0.5">{new Date(ride.created_at).toLocaleDateString()}</div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${ride.status === 'active' ? 'bg-[#E5F9ED] text-[#34C759]' : 'bg-[#E5E5EA] text-[#8A8A8E]'}`}>
                            {ride.status || 'ended'}
                          </span>
                        </div>
                      ))}
                      {userDetails.createdRides.length === 0 && (
                        <div className="text-[13px] text-gray-500 py-2">No rides created.</div>
                      )}
                      {userDetails.createdRides.length > 5 && (
                        <div className="text-center pt-2 text-[11px] font-bold text-primary cursor-pointer hover:underline">
                          View all {userDetails.createdRides.length} rides
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Saved Locations */}
                  <div>
                    <h3 className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Saved Locations ({userDetails.savedLocations.length})
                    </h3>
                    <div className="space-y-2">
                      {userDetails.savedLocations.map((loc: any) => (
                        <div key={loc.id} className="p-3 bg-[#F8F9FB] rounded-lg flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-[13px] text-dark truncate">{loc.name || 'Unnamed'}</div>
                            <div className="text-[11px] text-[#8A8A8E] mt-0.5">{loc.address || `${Number(loc.latitude).toFixed(5)}, ${Number(loc.longitude).toFixed(5)}`}</div>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#E5E5EA] text-[#8A8A8E] flex-shrink-0 capitalize">
                            {loc.location_type || 'custom'}
                          </span>
                        </div>
                      ))}
                      {userDetails.savedLocations.length === 0 && (
                        <div className="text-[13px] text-gray-500 py-2">No saved locations.</div>
                      )}
                    </div>
                  </div>

                  {/* Groups */}
                  <div>
                    <h3 className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Groups ({userDetails.groups.length})
                    </h3>
                    <div className="space-y-2">
                      {userDetails.groups.map((g: any) => (
                        <div key={g.id} className="p-3 bg-[#F8F9FB] rounded-lg flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-[12px]">
                            {g.groups?.name?.charAt(0) || 'G'}
                          </div>
                          <div>
                            <div className="font-bold text-[13px] text-dark">{g.groups?.name || 'Unnamed Group'}</div>
                            <div className="text-[11px] text-[#8A8A8E] capitalize mt-0.5">Role: {g.role}</div>
                          </div>
                        </div>
                      ))}
                      {userDetails.groups.length === 0 && (
                        <div className="text-[13px] text-gray-500 py-2">No groups joined.</div>
                      )}
                    </div>
                  </div>

                  {/* Deleted User Actions */}
                  {selectedUser.deleted_at && (
                    <div className="bg-[#FFF3F3] border border-[#FF3B30]/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-4 h-4 text-[#FF3B30]" />
                        <h3 className="text-[11px] font-bold text-[#FF3B30] uppercase tracking-wider">Account Deleted</h3>
                      </div>
                      <div className="text-[12px] text-[#273a5a] space-y-1 mb-4">
                        <div>Deleted on: <span className="font-bold">{new Date(selectedUser.deleted_at).toLocaleString()}</span></div>
                        <div className={`font-bold ${ daysRemaining(selectedUser.deleted_at) <= 7 ? 'text-[#FF3B30]' : 'text-[#273a5a]' }`}>
                          {daysRemaining(selectedUser.deleted_at)} days remaining to restore
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRestore(selectedUser)}
                          className="flex-1 h-8 rounded bg-[#34C759] text-white text-[12px] font-bold hover:bg-[#34C759]/90 flex items-center justify-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Restore Account
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(selectedUser)}
                          className="flex-1 h-8 rounded bg-[#FF3B30] text-white text-[12px] font-bold hover:bg-[#FF3B30]/90 flex items-center justify-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Forever
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
