import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Bell, Plus, ArrowUpDown, AlertTriangle, MessageCircle, Calendar as CalendarIcon, MapPin, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { auth } from '../lib/firebase';
import { getDeterministicUuid } from '../lib/user';
import { useIncidentCategories, resolvePinIcon } from '../hooks/useIncidentCategories';

type Tab = 'all' | 'mine' | 'groups';
type SortOrder = 'newest' | 'oldest';

interface PinRow {
  id: string;
  category: string;
  title: string | null;
  description: string | null;
  status: string | null;
  created_at: string;
  ride_id: string | null;
  group_id: string | null;
  reporter_id: string | null;
  reporter_name: string | null;
  photo_url: string | null;
  photo_urls: string[] | null;
  icon_name?: string | null;
}

const MyIncidents = () => {
  const navigate = useNavigate();
  const { categories: reportTypes } = useIncidentCategories();

  const [myUid, setMyUid] = useState<string | null>(null);
  const [pins, setPins] = useState<PinRow[]>([]);
  const [rideNames, setRideNames] = useState<Record<string, string>>({});
  const [groupNames, setGroupNames] = useState<Record<string, string>>({});
  const [responseCounts, setResponseCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<Tab>('all');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Open' | 'Resolved'>('All');
  const [rideFilter, setRideFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const [myRawUid, setMyRawUid] = useState<string | null>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      // Firebase's onAuthStateChanged only reflects a real Firebase session —
      // most riders here are actually signed in via a separate "rie_token"
      // (decoded client-side), which Firebase never sees. Without this
      // fallback, `user` is null for those sessions and they get bounced
      // straight to /login despite RequireAuth having already let them in.
      let activeUid = user?.uid;
      if (!activeUid) {
        const rieToken = localStorage.getItem('rie_token');
        if (rieToken) {
          try {
            const payload = JSON.parse(atob(rieToken.split('.')[1]));
            if (payload.uid) activeUid = payload.uid;
          } catch (e) { /* ignore malformed token */ }
        }
      }
      if (!activeUid) { navigate('/login'); return; }
      setMyUid(getDeterministicUuid(activeUid));
      setMyRawUid(activeUid);
    });
    return unsub;
  }, [navigate]);

  useEffect(() => {
    if (!myUid) return;
    const load = async () => {
      setLoading(true);
      try {
        // group_members.user_id is inconsistent across the app — most paths
        // store the raw Firebase uid, but at least one (adding a member by
        // profile search) stores the deterministic profile uuid instead.
        // Match both so a real membership never silently disappears.
        const groupUidCandidates = [myUid, myRawUid].filter(Boolean) as string[];
        const [{ data: rideMemberships }, { data: groupMemberships }] = await Promise.all([
          supabase.from('ride_members').select('ride_id').eq('user_id', myUid),
          supabase.from('group_members').select('group_id').in('user_id', groupUidCandidates).in('status', ['accepted', 'admin']),
        ]);

        const rideIds = (rideMemberships || []).map(r => r.ride_id);
        const groupIds = (groupMemberships || []).map(g => g.group_id);

        const clauses: string[] = [`reporter_id.eq.${myUid}`];
        if (rideIds.length) clauses.push(`ride_id.in.(${rideIds.join(',')})`);
        if (groupIds.length) clauses.push(`group_id.in.(${groupIds.join(',')})`);

        const { data: pinRows } = await supabase
          .from('pins')
          .select('*')
          .or(clauses.join(','))
          .order('created_at', { ascending: false })
          .limit(100);

        const list = pinRows || [];
        setPins(list);

        const [rideIdsForNames, groupIdsForNames] = [
          Array.from(new Set(list.map(p => p.ride_id).filter(Boolean))),
          Array.from(new Set(list.map(p => p.group_id).filter(Boolean))),
        ];

        if (rideIdsForNames.length) {
          const { data } = await supabase.from('rides').select('id, name').in('id', rideIdsForNames);
          setRideNames(Object.fromEntries((data || []).map(r => [r.id, r.name])));
        }
        if (groupIdsForNames.length) {
          const { data } = await supabase.from('groups').select('id, name').in('id', groupIdsForNames);
          setGroupNames(Object.fromEntries((data || []).map(g => [g.id, g.name])));
        }

        const pinIds = list.map(p => p.id);
        if (pinIds.length) {
          const { data: confs } = await supabase.from('confirmations').select('pin_id').in('pin_id', pinIds);
          const counts: Record<string, number> = {};
          (confs || []).forEach(c => { counts[c.pin_id] = (counts[c.pin_id] || 0) + 1; });
          setResponseCounts(counts);
        }
      } catch (e) {
        console.error('Failed to load incidents', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [myUid]);

  const rideOptions = useMemo(() => {
    const names = new Set<string>();
    pins.forEach(p => { if (p.ride_id && rideNames[p.ride_id]) names.add(rideNames[p.ride_id]); });
    return ['All', ...Array.from(names)];
  }, [pins, rideNames]);

  const filtered = useMemo(() => {
    let list = pins.filter(p => {
      if (tab === 'mine' && p.reporter_id !== myUid) return false;
      if (tab === 'groups' && !p.group_id) return false;
      if (typeFilter !== 'All' && p.category !== typeFilter) return false;
      const isOpen = p.status === 'active';
      if (statusFilter === 'Open' && !isOpen) return false;
      if (statusFilter === 'Resolved' && isOpen) return false;
      if (rideFilter !== 'All' && (!p.ride_id || rideNames[p.ride_id] !== rideFilter)) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return sortOrder === 'newest' ? diff : -diff;
    });
    return list;
  }, [pins, tab, typeFilter, statusFilter, rideFilter, sortOrder, myUid, rideNames]);

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short' }) + ' • ' + new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <React.Fragment>
      <Helmet><title>Incidents | RideClub</title></Helmet>
      <div className="w-full h-full bg-app-canvas flex flex-col overflow-hidden font-sans">

        <div className="shrink-0 px-4 pt-4 pb-2 flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-black tracking-tight leading-tight">
              <span className="text-gray-950">Ride</span><span className="text-[#FF6B22]">Club</span>
            </h1>
            <p className="text-[11px] text-gray-500 font-semibold">Ride Together. Go Further.</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button onClick={() => navigate('/alerts')} aria-label="Alerts" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-700 active:scale-95 transition-all cursor-pointer">
              <Bell className="w-4.5 h-4.5" />
            </button>
            <button onClick={() => navigate('/profile')} className="w-10 h-10 rounded-full bg-[#FF6B22]/10 flex items-center justify-center text-[#FF6B22] font-black text-[13px] active:scale-95 transition-all cursor-pointer">RC</button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar px-4 pb-[100px] max-w-[560px] w-full mx-auto flex flex-col gap-3">

          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[22px] font-black text-gray-950">Incidents</h2>
              <p className="text-[12px] text-gray-500 font-medium">Reports from your rides and groups.</p>
            </div>
            <button onClick={() => navigate('/map', { state: { reportMode: true } })} className="shrink-0 px-4 py-2.5 btn-app-primary text-white text-[13px] font-bold rounded-full cursor-pointer flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Report
            </button>
          </div>

          <div className="flex items-center gap-5 border-b border-gray-100">
            {([['all', 'All'], ['mine', 'My Reports'], ['groups', 'My Groups']] as const).map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} className={`pb-2.5 text-[13px] font-bold cursor-pointer border-b-2 transition-colors ${tab === key ? 'text-[#FF6B22] border-[#FF6B22]' : 'text-gray-400 border-transparent'}`}>
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="shrink-0 card-app px-3 py-2 text-[11px] font-bold text-gray-700 outline-none cursor-pointer">
              <option value="All">All Types</option>
              {reportTypes.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="shrink-0 card-app px-3 py-2 text-[11px] font-bold text-gray-700 outline-none cursor-pointer">
              <option value="All">All Status</option>
              <option value="Open">Open</option>
              <option value="Resolved">Resolved</option>
            </select>
            <select value={rideFilter} onChange={e => setRideFilter(e.target.value)} className="shrink-0 card-app px-3 py-2 text-[11px] font-bold text-gray-700 outline-none cursor-pointer">
              {rideOptions.map(r => <option key={r} value={r}>{r === 'All' ? 'All Rides' : r}</option>)}
            </select>
            <button onClick={() => setSortOrder(o => o === 'newest' ? 'oldest' : 'newest')} aria-label="Toggle sort order" className="shrink-0 w-9 h-9 card-app flex items-center justify-center text-gray-600 cursor-pointer">
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-2.5 pb-2">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="card-app p-3 flex gap-3 animate-pulse">
                  <div className="w-16 h-16 rounded-2xl bg-gray-200 shrink-0" />
                  <div className="flex-1 flex flex-col gap-2 py-1">
                    <div className="h-3.5 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : filtered.length > 0 ? (
              filtered.map(pin => {
                const Icon = resolvePinIcon(pin, reportTypes);
                const isOpen = pin.status === 'active';
                const thumb = pin.photo_url?.split(',')[0] || pin.photo_urls?.[0];
                return (
                  <button key={pin.id} onClick={() => navigate(`/incident/${pin.id}`)} className="card-app p-3 flex gap-3 cursor-pointer text-left">
                    {thumb ? (
                      <img src={thumb} alt="" className="w-16 h-16 rounded-2xl object-cover shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl shrink-0 flex items-center justify-center bg-gray-100">
                        <Icon className="w-6 h-6 text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-[13px] font-bold text-gray-950 leading-tight">{pin.title || pin.category}</h3>
                        <span className={`shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${isOpen ? 'bg-[#FF6B22]/10 text-[#FF6B22]' : 'bg-emerald-50 text-emerald-600'}`}>
                          {isOpen ? 'Open' : 'Resolved'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 font-medium leading-snug line-clamp-2">{pin.description || 'No description provided.'}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {(pin.ride_id || pin.group_id) && (
                          <span className="flex items-center gap-1 text-[10px] text-gray-400 font-semibold">
                            {pin.group_id ? <Users className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                            {pin.ride_id ? (rideNames[pin.ride_id] || 'Ride') : (groupNames[pin.group_id!] || 'Group')}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[10px] text-gray-400 font-semibold">
                          <CalendarIcon className="w-3 h-3" /> {formatDate(pin.created_at)}
                        </span>
                        {!!responseCounts[pin.id] && (
                          <span className="flex items-center gap-1 text-[10px] text-gray-400 font-semibold">
                            <MessageCircle className="w-3 h-3" /> {responseCounts[pin.id]}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-16 text-gray-400 font-medium text-[13px] flex flex-col items-center gap-2">
                <AlertTriangle className="w-8 h-8 opacity-40" />
                No incidents match these filters.
              </div>
            )}
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default MyIncidents;
