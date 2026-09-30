import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { auth } from '../lib/firebase';
import { getAppUser, getDeterministicUuid } from '../lib/user';
import { appInBackground, notify, onNotificationTap } from '../lib/notify';

const REFRESH_MS = 3 * 60 * 1000;
const preview = (s: string, n = 80) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

// Turns existing realtime rows (group messages, ride events, ride status) into notifications for the signed-in rider
export default function AppNotifier() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathRef = useRef(location.pathname);
  pathRef.current = location.pathname;

  useEffect(() => onNotificationTap((route) => navigate(route)), [navigate]);

  useEffect(() => {
    const user = getAppUser(auth.currentUser);
    if (!user) return;
    const me = user.uid.length === 36 ? user.uid : getDeterministicUuid(user.uid);
    const myIds = new Set([user.uid, me]);
    let channels: ReturnType<typeof supabase.channel>[] = [];
    let groupNames: Record<string, string> = {};
    let rideNames: Record<string, string> = {};
    let key = '';

    const onRideScreen = (rideId: string) => !appInBackground() && pathRef.current.includes(rideId);

    const subscribe = async () => {
      const [{ data: gm }, { data: rm }, { data: owned }] = await Promise.all([
        supabase.from('group_members').select('group_id').in('user_id', [...myIds]).eq('status', 'accepted'),
        supabase.from('ride_members').select('ride_id').eq('user_id', me),
        supabase.from('rides').select('id').eq('owner_id', user.uid),
      ]);
      const groupIds = [...new Set((gm || []).map((g: any) => g.group_id))].slice(0, 100);
      const rideIdsAll = [...new Set([...(rm || []).map((r: any) => r.ride_id), ...(owned || []).map((r: any) => r.id)])];
      const { data: rides } = rideIdsAll.length
        ? await supabase.from('rides').select('id, name, status').in('id', rideIdsAll).in('status', ['live', 'scheduled'])
        : { data: [] as any[] };
      const rideIds = (rides || []).map((r: any) => r.id).slice(0, 100);
      const nextKey = `${groupIds.sort().join(',')}|${rideIds.sort().join(',')}`;
      if (nextKey === key) return;
      key = nextKey;

      if (groupIds.length) {
        const { data: groups } = await supabase.from('groups').select('id, name').in('id', groupIds);
        groupNames = Object.fromEntries((groups || []).map((g: any) => [g.id, g.name]));
      }
      rideNames = Object.fromEntries((rides || []).map((r: any) => [r.id, r.name || 'Your ride']));

      channels.forEach((c) => supabase.removeChannel(c));
      channels = [];

      if (groupIds.length) {
        channels.push(supabase.channel(`notify-groups-${me}`)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `group_id=in.(${groupIds.join(',')})` }, (p) => {
            const m: any = p.new;
            if (myIds.has(m.user_id) || !groupNames[m.group_id]) return;
            if (!appInBackground() && pathRef.current.startsWith('/groups')) return;
            const body = m.message_type === 'image' ? 'Sent a photo' : m.message_type === 'location' ? 'Shared a location' : preview(String(m.content || ''));
            notify({ title: groupNames[m.group_id], body: `${String(m.username || 'Rider').split(' ')[0]}: ${body}`, route: '/groups', tag: `group-${m.group_id}` });
          })
          .subscribe());
      }

      if (rideIds.length) {
        const filter = `ride_id=in.(${rideIds.join(',')})`;
        channels.push(supabase.channel(`notify-rides-${me}`)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ride_events', filter }, (p) => {
            const e: any = p.new;
            if (myIds.has(e.user_id) || onRideScreen(e.ride_id)) return;
            const ride = rideNames[e.ride_id] || 'Your ride';
            const route = `/ride-plus/live/${e.ride_id}`;
            const who = e.payload?.editor_name || e.payload?.riderName || 'A rider';
            if (e.event_type === 'SOS') notify({ title: `SOS in ${ride}`, body: `${who} needs help. Open the ride to see where.`, route, tag: `sos-${e.ride_id}` });
            else if (e.event_type === 'SOS_REVOKED') notify({ title: ride, body: `${who} is OK. The SOS was cancelled.`, route, tag: `sos-${e.ride_id}` });
            else if (e.event_type === 'RIDE_UPDATED') notify({ title: ride, body: e.description ? preview(e.description) : `${who} updated the ride.`, route, tag: `ride-${e.ride_id}` });
          })
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rides', filter: `id=in.(${rideIds.join(',')})` }, (p) => {
            const r: any = p.new;
            const old: any = p.old;
            if (!r || r.status === old?.status || onRideScreen(r.id)) return;
            const name = r.name || rideNames[r.id] || 'Your ride';
            if (r.status === 'live') notify({ title: `${name} has started`, body: 'Open the ride to join the group on the road.', route: `/ride-plus/live/${r.id}`, tag: `ride-${r.id}` });
            else if (r.status === 'cancelled') notify({ title: `${name} was cancelled`, body: 'The ride leader cancelled this ride.', route: `/ride-plus/view/${r.id}`, tag: `ride-${r.id}` });
            else if (r.status === 'ended' || r.status === 'completed') notify({ title: `${name} has ended`, body: 'Thanks for riding safe.', route: `/ride-plus/view/${r.id}`, tag: `ride-${r.id}` });
          })
          .subscribe());
      }
    };

    subscribe().catch(() => {});
    const t = setInterval(() => subscribe().catch(() => {}), REFRESH_MS);
    const onVisible = () => { if (!appInBackground()) subscribe().catch(() => {}); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', onVisible);
      channels.forEach((c) => supabase.removeChannel(c));
    };
  }, []);

  return null;
}
