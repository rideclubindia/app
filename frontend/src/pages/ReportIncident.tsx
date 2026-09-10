import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ChevronLeft, X, ShieldAlert, Camera, Check, Loader2, LocateFixed, MapPin, Globe, Users
} from 'lucide-react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { supabase } from '../lib/supabase';
import { auth } from '../lib/firebase';
import { useToast } from '../components/ToastContext';
import { useLocationStore } from '../store/useLocationStore';
import { useIncidentCategories, incidentIconMap } from '../hooks/useIncidentCategories';
import { getDeterministicUuid } from '../lib/user';

type Stage = 'category' | 'location' | 'details' | 'success';

const CATEGORY_SUBTITLES: Record<string, string> = {
  'Accident': 'Collision or fall',
  'Traffic Jam': 'Heavy traffic or congestion',
  'Road Closed': 'Road blocked or closed',
  'Flood': 'Waterlogging or flooding',
  'Vibe Check': 'Harassment, unsafe behavior',
  'Construction': 'Roadwork or construction',
  'Hazard': 'Obstacle, debris, bad road',
  'Other': 'Something else',
};

interface ReportIncidentState {
  rideId?: string;
  groupId?: string;
}

const ReportIncident = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { categories } = useIncidentCategories();

  const { rideId, groupId } = (location.state as ReportIncidentState) || {};

  const [stage, setStage] = useState<Stage>('category');
  const [category, setCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locationLabel, setLocationLabel] = useState('');
  const [locationSub, setLocationSub] = useState('');
  const [locatingUser, setLocatingUser] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Visibility: shared pin (public, to nearby riders) or a specific group the
  // reporter has joined. Skipped when the report was launched already scoped
  // to a ride/group (rideId/groupId came in via navigation state).
  const [visibility, setVisibility] = useState<'public' | 'group'>('public');
  const [myGroups, setMyGroups] = useState<{ id: string; name: string }[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [loadingGroups, setLoadingGroups] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);

  const close = () => navigate(-1);

  // Firebase's auth.currentUser only reflects a real Firebase session — most
  // riders here are actually signed in via a separate "rie_token" (decoded
  // client-side), which Firebase never sees. Without this fallback,
  // auth.currentUser is null for those sessions and group lookups / the
  // reporter identity on submit silently come back empty.
  const resolveActiveUser = (): { uid: string; displayName: string | null; email: string | null } | null => {
    if (auth.currentUser) {
      return { uid: auth.currentUser.uid, displayName: auth.currentUser.displayName, email: auth.currentUser.email };
    }
    const rieToken = localStorage.getItem('rie_token');
    if (rieToken) {
      try {
        const payload = JSON.parse(atob(rieToken.split('.')[1]));
        if (payload.uid) {
          return { uid: payload.uid, displayName: payload.sub ? String(payload.sub).split('@')[0] : null, email: payload.sub || null };
        }
      } catch (e) { /* ignore malformed token */ }
    }
    return null;
  };

  const reverseGeocode = async (rLat: number, rLng: number) => {
    try {
      const res = await fetch(`https://photon.komoot.io/reverse?lon=${rLng}&lat=${rLat}`);
      const data = await res.json();
      const props = data.features?.[0]?.properties;
      if (props) {
        setLocationLabel([props.district || props.name, props.city || props.state].filter(Boolean).join(', ') || 'Selected location');
        setLocationSub([props.street, props.name].filter(Boolean).join(', ') || '');
      }
    } catch (e) {
      console.warn('Reverse geocode failed', e);
    }
  };

  const useMyLocation = () => {
    setLocatingUser(true);
    useLocationStore.getState().fetchLocationOnce().then((loc) => {
      setLat(loc.lat);
      setLng(loc.lng);
      map.current?.flyTo({ center: [loc.lng, loc.lat], zoom: 15 });
      marker.current?.setLngLat([loc.lng, loc.lat]);
      reverseGeocode(loc.lat, loc.lng);
    }).catch(() => {
      showToast('Unable to get your location', 'error');
    }).finally(() => setLocatingUser(false));
  };

  useEffect(() => {
    if (stage !== 'location' || !mapContainer.current || map.current) return;
    useLocationStore.getState().fetchLocationOnce().then((loc) => {
      const initLat = lat ?? loc.lat;
      const initLng = lng ?? loc.lng;
      if (lat == null) { setLat(initLat); setLng(initLng); }

      map.current = new maplibregl.Map({
        container: mapContainer.current!,
        style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
        center: [initLng, initLat],
        zoom: 15,
        attributionControl: false,
        interactive: true,
      });
      marker.current = new maplibregl.Marker({ color: '#FF6B22' }).setLngLat([initLng, initLat]).addTo(map.current);
      map.current.on('click', (e) => {
        const { lng: clickLng, lat: clickLat } = e.lngLat;
        setLat(clickLat);
        setLng(clickLng);
        marker.current?.setLngLat([clickLng, clickLat]);
        reverseGeocode(clickLat, clickLng);
      });
      if (!locationLabel) reverseGeocode(initLat, initLng);
    }).catch(() => {
      const fallbackLat = lat ?? 17.3850;
      const fallbackLng = lng ?? 78.4867;
      if (lat == null) { setLat(fallbackLat); setLng(fallbackLng); }
      map.current = new maplibregl.Map({
        container: mapContainer.current!,
        style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
        center: [fallbackLng, fallbackLat],
        zoom: 12,
        attributionControl: false,
      });
      marker.current = new maplibregl.Marker({ color: '#FF6B22' }).setLngLat([fallbackLng, fallbackLat]).addTo(map.current);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [stage]);

  useEffect(() => {
    if (stage !== 'details' || rideId || groupId || myGroups.length > 0 || loadingGroups) return;
    const user = resolveActiveUser();
    if (!user) return;
    setLoadingGroups(true);
    (async () => {
      try {
        // group_members.user_id is stored inconsistently across the app —
        // usually the raw Firebase uid, but occasionally the deterministic
        // profile uuid — match both so a real membership isn't missed.
        const { data: memberRows } = await supabase.from('group_members').select('group_id').in('user_id', [user.uid, getDeterministicUuid(user.uid)]).in('status', ['accepted', 'admin']);
        const groupIds = (memberRows || []).map(m => m.group_id);
        if (groupIds.length === 0) return;
        const { data: groupsData } = await supabase.from('groups').select('id, name').in('id', groupIds);
        if (groupsData) setMyGroups(groupsData);
      } catch (e) {
        console.warn('Failed to fetch groups', e);
      } finally {
        setLoadingGroups(false);
      }
    })();
  }, [stage, rideId, groupId]);

  const submitReport = async () => {
    if (!category) return;
    setSubmitting(true);
    try {
      const user = resolveActiveUser();
      const reporterName = user?.displayName || user?.email?.split('@')[0] || 'Rider';

      const photoUrls: string[] = [];
      for (const file of photos) {
        const ext = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('incident-photos').upload(fileName, file);
        if (!upErr) {
          photoUrls.push(supabase.storage.from('incident-photos').getPublicUrl(fileName).data.publicUrl);
        }
      }

      const effectiveGroupId = groupId || (visibility === 'group' ? selectedGroupId : null);

      const { error } = await supabase.from('pins').insert({
        category,
        title: category,
        description,
        latitude: lat ?? 0,
        longitude: lng ?? 0,
        severity: category === 'Accident' ? 3 : 1,
        status: 'active',
        reporter_name: reporterName,
        reporter_id: user ? getDeterministicUuid(user.uid) : null,
        ride_id: rideId || null,
        group_id: effectiveGroupId,
        photo_url: photoUrls[0] || null,
        photo_urls: photoUrls,
      });
      if (error) throw error;
      setStage('success');
    } catch (e) {
      console.error(e);
      showToast('Failed to submit report', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const back = () => {
    if (stage === 'category') close();
    else if (stage === 'location') setStage('category');
    else if (stage === 'details') setStage('location');
  };

  return (
    <React.Fragment>
      <Helmet><title>Report an Incident | RideClub</title></Helmet>
      <div className="w-full h-full bg-app-canvas flex flex-col overflow-hidden font-sans">
        {stage !== 'success' && (
          <div className="shrink-0 px-4 pt-4 pb-2 flex items-center justify-between gap-3">
            <button onClick={back} className="w-10 h-10 rounded-full card-app flex items-center justify-center text-gray-800 cursor-pointer active:scale-95 transition-all" aria-label="Back">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-[16px] font-bold text-gray-950">
              {stage === 'category' ? 'Report an Incident' : stage === 'location' ? 'Pin the Location' : 'Add Details'}
            </h1>
            <button onClick={close} className="w-10 h-10 rounded-full card-app flex items-center justify-center text-gray-800 cursor-pointer active:scale-95 transition-all" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar px-4 pb-[100px] max-w-[520px] w-full mx-auto flex flex-col gap-4">
          {stage === 'category' && (
            <>
              <p className="text-[12px] text-gray-500 font-medium">Let us know what happened. This helps keep our community safe.</p>
              <div className="grid grid-cols-2 gap-2.5">
                {categories.map(cat => {
                  const Icon = incidentIconMap[cat.iconName] || ShieldAlert;
                  const selected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => { setCategory(cat.id); setStage('location'); }}
                      className={`card-app p-3.5 flex flex-col items-start gap-2.5 cursor-pointer text-left transition-all ${selected ? 'ring-2 ring-[#FF6B22]' : ''}`}
                    >
                      <div className={`w-10 h-10 icon-badge ${cat.bg} shrink-0`}><Icon className={`w-5 h-5 ${cat.color}`} /></div>
                      <div>
                        <p className="text-[13px] font-bold text-gray-950 leading-tight">{cat.id}</p>
                        <p className="text-[10.5px] text-gray-500 font-medium mt-0.5 leading-tight">{CATEGORY_SUBTITLES[cat.id] || 'Report this issue'}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="card-app p-3.5 bg-blue-50/60 text-[11px] font-semibold text-blue-800 flex items-start gap-2 mt-1">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                {rideId || groupId ? 'This report will be shared with the ride/group members and admins. It is not public.' : 'This report will be visible to nearby riders on the map.'}
              </div>
            </>
          )}

          {stage === 'location' && (
            <>
              <p className="text-[12px] text-gray-500 font-medium">Drop a pin where it happened. Tap the map to move it.</p>
              <div>
                <span className="text-[13px] font-bold text-gray-950 block mb-2">Location *</span>
                <div className="card-app overflow-hidden">
                  <div ref={mapContainer} className="w-full h-[220px] relative" />
                  <button onClick={useMyLocation} disabled={locatingUser} className="w-full flex items-center gap-2 px-3.5 py-2.5 border-t border-gray-100 text-[12px] font-bold text-gray-700 cursor-pointer disabled:opacity-60">
                    {locatingUser ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LocateFixed className="w-3.5 h-3.5 text-[#FF6B22]" />}
                    Use My Location
                  </button>
                  {locationLabel && (
                    <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 border-t border-gray-100">
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[12px] font-bold text-gray-950 truncate">{locationLabel}</p>
                          {locationSub && <p className="text-[10px] text-gray-500 truncate">{locationSub}</p>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  if (lat == null || lng == null) { showToast('Please pin a location', 'error'); return; }
                  setStage('details');
                }}
                className="w-full py-4 btn-app-primary text-white font-bold text-[14px] rounded-full cursor-pointer mt-1"
              >
                Next
              </button>
            </>
          )}

          {stage === 'details' && (
            <>
              <p className="text-[12px] text-gray-500 font-medium">Anything else? All of this is optional.</p>
              <div className="card-app p-3.5">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Description (Optional)</span>
                <textarea value={description} onChange={e => setDescription(e.target.value.slice(0, 500))} rows={4} placeholder="What happened? Is everyone safe?" className="w-full bg-transparent text-[13px] text-gray-800 font-medium placeholder-gray-400 focus:outline-none resize-none" />
                <div className="text-right"><span className="text-[10px] text-gray-400 font-medium">{description.length}/500</span></div>
              </div>

              <div>
                <span className="text-[13px] font-bold text-gray-950 block mb-2">Add Photos (Optional)</span>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => {
                  if (e.target.files) setPhotos(prev => [...prev, ...Array.from(e.target.files!)].slice(0, 5));
                }} />
                <div className="flex gap-2.5 flex-wrap">
                  {photos.map((f, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                      <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-white cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {photos.length < 5 && (
                    <button onClick={() => fileInputRef.current?.click()} className="w-20 h-20 rounded-2xl card-app flex flex-col items-center justify-center gap-1 text-gray-500 cursor-pointer shrink-0">
                      <Camera className="w-5 h-5" />
                      <span className="text-[9px] font-bold text-center leading-tight">Add Photos (Up to 5)</span>
                    </button>
                  )}
                </div>
              </div>

              {!rideId && !groupId && (
                <div>
                  <span className="text-[13px] font-bold text-gray-950 block mb-2">Share With</span>
                  <div className="card-app flex flex-col overflow-hidden divide-y divide-gray-100">
                    <button onClick={() => setVisibility('public')} className="p-3.5 flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 icon-badge bg-emerald-50 shrink-0"><Globe className="w-4 h-4 text-emerald-600" /></div>
                        <div className="text-left">
                          <p className="text-[13px] font-bold text-gray-950">Public Pin</p>
                          <p className="text-[11px] text-gray-500 font-medium">Visible to nearby riders on the map</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${visibility === 'public' ? 'bg-[#FF6B22]' : 'bg-gray-200'}`}>
                        {visibility === 'public' && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                    <button onClick={() => setVisibility('group')} className="p-3.5 flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 icon-badge bg-indigo-50 shrink-0"><Users className="w-4 h-4 text-indigo-600" /></div>
                        <div className="text-left">
                          <p className="text-[13px] font-bold text-gray-950">Group Pin</p>
                          <p className="text-[11px] text-gray-500 font-medium">Shared with one of your groups only</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${visibility === 'group' ? 'bg-[#FF6B22]' : 'bg-gray-200'}`}>
                        {visibility === 'group' && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  </div>

                  {visibility === 'group' && (
                    <div className="mt-2.5 card-app p-3.5">
                      {loadingGroups ? (
                        <div className="flex items-center gap-2 text-[12px] text-gray-500 font-medium"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading your groups...</div>
                      ) : myGroups.length === 0 ? (
                        <p className="text-[12px] text-gray-500 font-medium">You haven't joined any groups yet.</p>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Select Group</span>
                          {myGroups.map(g => (
                            <button
                              key={g.id}
                              onClick={() => setSelectedGroupId(g.id)}
                              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer transition-all ${
                                selectedGroupId === g.id ? 'bg-[#FF6B22]/10 text-[#FF6B22] ring-2 ring-[#FF6B22]/40' : 'bg-gray-50 text-gray-700'
                              }`}
                            >
                              {g.name}
                              {selectedGroupId === g.id && <Check className="w-3.5 h-3.5" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => {
                  if (!rideId && !groupId && visibility === 'group' && !selectedGroupId) {
                    showToast('Please select a group to share with', 'error');
                    return;
                  }
                  submitReport();
                }}
                disabled={submitting}
                className="w-full py-4 btn-app-primary text-white font-bold text-[14px] rounded-full cursor-pointer mt-1 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Submit Report
              </button>
            </>
          )}

          {stage === 'success' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-10">
              <div className="w-20 h-20 rounded-full bg-[#FF6B22]/10 flex items-center justify-center">
                <Check className="w-10 h-10 text-[#FF6B22]" strokeWidth={3} />
              </div>
              <div>
                <h2 className="text-[19px] font-black text-gray-950">Incident Reported</h2>
                <p className="text-[12px] text-gray-500 font-medium mt-1 max-w-[260px]">Thank you for helping keep our community safe.</p>
              </div>
              <div className="w-full flex flex-col gap-2.5 mt-2">
                {rideId ? (
                  <button onClick={() => navigate(`/ride-plus/view/${rideId}`)} className="w-full py-3.5 btn-app-primary text-white font-bold text-[14px] rounded-full cursor-pointer">View in Ride</button>
                ) : (
                  <button onClick={() => navigate('/my-incidents')} className="w-full py-3.5 btn-app-primary text-white font-bold text-[14px] rounded-full cursor-pointer">Track this Report</button>
                )}
                <button onClick={() => navigate('/explore')} className="w-full py-3.5 card-app text-gray-700 font-bold text-[14px] rounded-full cursor-pointer">Back to Explore</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </React.Fragment>
  );
};

export default ReportIncident;
