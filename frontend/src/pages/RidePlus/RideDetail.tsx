import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ChevronLeft, Share2, Heart, Calendar, Users, MapPin, ShieldAlert, Camera, X, Check,
  Loader2, ChevronRight, LocateFixed
} from 'lucide-react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { supabase } from '../../lib/supabase';
import { auth } from '../../lib/firebase';
import { useToast } from '../../components/ToastContext';
import { useLocationStore } from '../../store/useLocationStore';
import { useIncidentCategories, incidentIconMap } from '../../hooks/useIncidentCategories';
import { getDeterministicUuid } from '../../lib/user';

type ReportStage = null | 'category' | 'details' | 'location' | 'success';

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

const RideDetail = () => {
  const { id: rideId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { categories } = useIncidentCategories();

  const [ride, setRide] = useState<any>(null);
  const [riderCount, setRiderCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'incidents'>('overview');
  const [incidents, setIncidents] = useState<any[]>([]);

  // Report-incident wizard state
  const [reportStage, setReportStage] = useState<ReportStage>(null);
  const [reportCategory, setReportCategory] = useState<string | null>(null);
  const [reportTitle, setReportTitle] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportPhotos, setReportPhotos] = useState<File[]>([]);
  const [reportLat, setReportLat] = useState<number | null>(null);
  const [reportLng, setReportLng] = useState<number | null>(null);
  const [reportLocationLabel, setReportLocationLabel] = useState('');
  const [reportLocationSub, setReportLocationSub] = useState('');
  const [locatingUser, setLocatingUser] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const reportMapContainer = React.useRef<HTMLDivElement>(null);
  const reportMap = React.useRef<maplibregl.Map | null>(null);
  const reportMarker = React.useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!rideId) return;
      setLoading(true);
      const { data } = await supabase.from('rides').select('*').eq('id', rideId).single();
      setRide(data);
      const { count } = await supabase.from('ride_members').select('*', { count: 'exact', head: true }).eq('ride_id', rideId);
      setRiderCount(count || 0);
      setLoading(false);
    };
    load();
  }, [rideId]);

  const loadIncidents = async () => {
    if (!rideId) return;
    const { data } = await supabase.from('pins').select('*').eq('ride_id', rideId).eq('status', 'active').order('created_at', { ascending: false });
    setIncidents(data || []);
  };

  useEffect(() => { loadIncidents(); }, [rideId]);

  const resetReport = () => {
    setReportStage(null);
    setReportCategory(null);
    setReportTitle('');
    setReportDescription('');
    setReportPhotos([]);
    setReportLat(null);
    setReportLng(null);
    setReportLocationLabel('');
    setReportLocationSub('');
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}`);
      const data = await res.json();
      const props = data.features?.[0]?.properties;
      if (props) {
        setReportLocationLabel([props.district || props.name, props.city || props.state].filter(Boolean).join(', ') || 'Selected location');
        setReportLocationSub([props.street, props.name].filter(Boolean).join(', ') || '');
      }
    } catch (e) {
      console.warn('Reverse geocode failed', e);
    }
  };

  const useMyLocation = () => {
    setLocatingUser(true);
    useLocationStore.getState().fetchLocationOnce().then((loc) => {
      setReportLat(loc.lat);
      setReportLng(loc.lng);
      reportMap.current?.flyTo({ center: [loc.lng, loc.lat], zoom: 15 });
      reportMarker.current?.setLngLat([loc.lng, loc.lat]);
      reverseGeocode(loc.lat, loc.lng);
    }).catch(() => {
      showToast('Unable to get your location', 'error');
    }).finally(() => setLocatingUser(false));
  };

  // Initialize the pick-a-location map when the location step opens
  useEffect(() => {
    if (reportStage !== 'location' || !reportMapContainer.current || reportMap.current) return;
    const lat = reportLat ?? ride?.start_location?.lat ?? 17.3850;
    const lng = reportLng ?? ride?.start_location?.lng ?? 78.4867;
    if (reportLat == null) { setReportLat(lat); setReportLng(lng); }

    reportMap.current = new maplibregl.Map({
      container: reportMapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: [lng, lat],
      zoom: 15,
      attributionControl: false,
      interactive: true,
    });
    reportMarker.current = new maplibregl.Marker({ color: '#FF6B22' }).setLngLat([lng, lat]).addTo(reportMap.current);

    reportMap.current.on('click', (e) => {
      const { lng: clickLng, lat: clickLat } = e.lngLat;
      setReportLat(clickLat);
      setReportLng(clickLng);
      reportMarker.current?.setLngLat([clickLng, clickLat]);
      reverseGeocode(clickLat, clickLng);
    });

    if (!reportLocationLabel) reverseGeocode(lat, lng);

    return () => {
      reportMap.current?.remove();
      reportMap.current = null;
    };
  }, [reportStage]);

  const submitReport = async () => {
    if (!rideId || !reportCategory) return;
    setSubmitting(true);
    try {
      const user = auth.currentUser;
      const reporterName = user?.displayName || user?.email?.split('@')[0] || 'Rider';

      const photoUrls: string[] = [];
      for (const file of reportPhotos) {
        const ext = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('incident-photos').upload(fileName, file);
        if (!upErr) {
          photoUrls.push(supabase.storage.from('incident-photos').getPublicUrl(fileName).data.publicUrl);
        }
      }

      const { error } = await supabase.from('pins').insert({
        category: reportCategory,
        title: reportTitle || reportCategory,
        description: reportDescription,
        latitude: reportLat ?? ride?.start_location?.lat ?? 0,
        longitude: reportLng ?? ride?.start_location?.lng ?? 0,
        severity: reportCategory === 'Accident' ? 3 : 1,
        status: 'active',
        reporter_name: reporterName,
        reporter_id: user ? getDeterministicUuid(user.uid) : null,
        ride_id: rideId,
        photo_url: photoUrls[0] || null,
        photo_urls: photoUrls
      });
      if (error) throw error;

      setReportStage('success');
      loadIncidents();
    } catch (e) {
      console.error(e);
      showToast('Failed to submit report', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="w-full h-full bg-app-canvas flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#FF6B22] animate-spin" /></div>;
  }

  if (!ride) {
    return (
      <div className="w-full h-full bg-app-canvas flex flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-[14px] font-bold text-gray-700">Ride not found.</p>
        <button onClick={() => navigate('/explore')} className="px-4 py-2 btn-app-primary text-white text-[12px] font-bold rounded-full cursor-pointer">Back to Explore</button>
      </div>
    );
  }

  const isLive = ride.status === 'live';
  const routeText = [ride.start_location?.name, ride.destination?.name].filter(Boolean).join(' → ') || 'Route TBD';

  // ---- Report-incident wizard screens ----
  if (reportStage) {
    return (
      <div className="w-full h-full bg-app-canvas flex flex-col overflow-hidden font-sans">
        {reportStage !== 'success' && (
          <div className="shrink-0 px-4 pt-4 pb-2 flex items-center gap-3">
            <button onClick={() => reportStage === 'category' ? resetReport() : setReportStage(reportStage === 'location' ? 'details' : 'category')} className="w-10 h-10 rounded-full card-app flex items-center justify-center text-gray-800 cursor-pointer active:scale-95 transition-all">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-[16px] font-bold text-gray-950">
              {reportStage === 'category' ? 'Report an Incident' : reportStage === 'details' ? 'Report Details' : 'Add Location & Photos'}
            </h1>
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar px-4 pb-[100px] max-w-[520px] w-full mx-auto flex flex-col gap-4">
          {reportStage === 'category' && (
            <>
              <p className="text-[12px] text-gray-500 font-medium">Let us know what happened. This helps keep our community safe.</p>
              <div className="grid grid-cols-2 gap-2.5">
                {categories.map(cat => {
                  const Icon = incidentIconMap[cat.iconName] || ShieldAlert;
                  const selected = reportCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => { setReportCategory(cat.id); setReportStage('details'); }}
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
                This report will be shared with the ride/group members and admins. It is not public.
              </div>
            </>
          )}

          {reportStage === 'details' && (
            <>
              <p className="text-[12px] text-gray-500 font-medium">Add more information to help your group.</p>
              <div className="card-app p-3.5">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Title *</span>
                <input value={reportTitle} onChange={e => setReportTitle(e.target.value.slice(0, 100))} placeholder={`${reportCategory} near...`} className="w-full bg-transparent text-[14px] font-bold text-gray-950 placeholder-gray-400 focus:outline-none" />
                <div className="text-right"><span className="text-[10px] text-gray-400 font-medium">{reportTitle.length}/100</span></div>
              </div>
              <div className="card-app p-3.5">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Description *</span>
                <textarea value={reportDescription} onChange={e => setReportDescription(e.target.value.slice(0, 500))} rows={4} placeholder="What happened? Is everyone safe?" className="w-full bg-transparent text-[13px] text-gray-800 font-medium placeholder-gray-400 focus:outline-none resize-none" />
                <div className="text-right"><span className="text-[10px] text-gray-400 font-medium">{reportDescription.length}/500</span></div>
              </div>
              <button
                onClick={() => {
                  if (!reportDescription.trim()) { showToast('Please add a description', 'error'); return; }
                  setReportStage('location');
                }}
                className="w-full py-4 btn-app-primary text-white font-bold text-[14px] rounded-full cursor-pointer mt-1"
              >
                Next
              </button>
            </>
          )}

          {reportStage === 'location' && (
            <>
              <div>
                <span className="text-[13px] font-bold text-gray-950 block mb-2">Location *</span>
                <div className="card-app overflow-hidden">
                  <div ref={reportMapContainer} className="w-full h-[160px] relative" />
                  <button onClick={useMyLocation} disabled={locatingUser} className="w-full flex items-center gap-2 px-3.5 py-2.5 border-t border-gray-100 text-[12px] font-bold text-gray-700 cursor-pointer disabled:opacity-60">
                    {locatingUser ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LocateFixed className="w-3.5 h-3.5 text-[#FF6B22]" />}
                    Use My Location
                  </button>
                  {reportLocationLabel && (
                    <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 border-t border-gray-100">
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[12px] font-bold text-gray-950 truncate">{reportLocationLabel}</p>
                          {reportLocationSub && <p className="text-[10px] text-gray-500 truncate">{reportLocationSub}</p>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <span className="text-[13px] font-bold text-gray-950 block mb-2">Add Photos (Optional)</span>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => {
                  if (e.target.files) setReportPhotos(prev => [...prev, ...Array.from(e.target.files!)].slice(0, 5));
                }} />
                <div className="flex gap-2.5 flex-wrap">
                  {reportPhotos.map((f, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                      <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => setReportPhotos(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-white cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {reportPhotos.length < 5 && (
                    <button onClick={() => fileInputRef.current?.click()} className="w-20 h-20 rounded-2xl card-app flex flex-col items-center justify-center gap-1 text-gray-500 cursor-pointer shrink-0">
                      <Camera className="w-5 h-5" />
                      <span className="text-[9px] font-bold">Add Photos{'\n'}(Up to 5)</span>
                    </button>
                  )}
                </div>
              </div>
              <button onClick={submitReport} disabled={submitting} className="w-full py-4 btn-app-primary text-white font-bold text-[14px] rounded-full cursor-pointer mt-1 flex items-center justify-center gap-2 disabled:opacity-60">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Next
              </button>
            </>
          )}

          {reportStage === 'success' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-10">
              <div className="w-20 h-20 rounded-full bg-[#FF6B22]/10 flex items-center justify-center">
                <Check className="w-10 h-10 text-[#FF6B22]" strokeWidth={3} />
              </div>
              <div>
                <h2 className="text-[19px] font-black text-gray-950">Incident Reported</h2>
                <p className="text-[12px] text-gray-500 font-medium mt-1 max-w-[260px]">Your report has been shared with the ride members.</p>
              </div>
              <div className="w-full flex flex-col gap-2.5 mt-2">
                <button onClick={() => { resetReport(); setTab('incidents'); }} className="w-full py-3.5 btn-app-primary text-white font-bold text-[14px] rounded-full cursor-pointer">View in Ride</button>
                <button onClick={resetReport} className="w-full py-3.5 card-app text-gray-700 font-bold text-[14px] rounded-full cursor-pointer">Back to Ride</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---- Main ride detail (Overview / Incidents) ----
  return (
    <React.Fragment>
      <Helmet><title>{ride.name} | RideClub</title></Helmet>
      <div className="w-full h-full bg-app-canvas flex flex-col overflow-hidden font-sans">
        <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar pb-[100px] max-w-[560px] w-full mx-auto flex flex-col">

          <div className="relative h-[220px] shrink-0">
            <img src={ride.image_url || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=60'} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <button onClick={() => navigate(-1)} className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center text-gray-800 cursor-pointer active:scale-95 transition-all">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button onClick={() => { navigator.clipboard.writeText(window.location.href); showToast('Link copied', 'success'); }} className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center text-gray-800 cursor-pointer active:scale-95 transition-all">
                <Share2 className="w-4.5 h-4.5" />
              </button>
              <button className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center text-gray-800 cursor-pointer active:scale-95 transition-all">
                <Heart className="w-4.5 h-4.5" />
              </button>
            </div>
            {isLive && (
              <span className="absolute bottom-3 left-4 text-[10px] font-bold bg-emerald-500 text-white px-2.5 py-1 rounded-full uppercase">Ongoing</span>
            )}
          </div>

          <div className="px-4 pt-4 flex flex-col gap-3">
            <div>
              <h1 className="text-[20px] font-black text-gray-950">{ride.name}</h1>
              <p className="text-[12px] text-gray-500 font-medium mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" /> {routeText}</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="card-app p-2.5 flex flex-col items-center gap-1">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-[11px] font-bold text-gray-950">{ride.ride_date ? new Date(ride.ride_date).toLocaleDateString([], { day: '2-digit', month: 'short' }) : 'TBD'}</span>
              </div>
              <div className="card-app p-2.5 flex flex-col items-center gap-1">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-[11px] font-bold text-gray-950">{riderCount}/{ride.max_riders || '--'} Riders</span>
              </div>
              <div className="card-app p-2.5 flex flex-col items-center gap-1">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-[11px] font-bold text-gray-950">{ride.destination?.name ? 'Set' : 'TBD'} Distance</span>
              </div>
            </div>

            {ride.description && <p className="text-[13px] text-gray-700 font-medium">{ride.description.replace(/^Type: .+\n?\n?/m, '')}</p>}

            <div className="flex items-center gap-5 border-b border-gray-100">
              {(['overview', 'incidents'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} className={`pb-2.5 text-[13px] font-bold cursor-pointer border-b-2 transition-colors capitalize ${tab === t ? 'text-[#FF6B22] border-[#FF6B22]' : 'text-gray-400 border-transparent'}`}>
                  {t === 'incidents' ? `Incidents${incidents.length ? ` (${incidents.length})` : ''}` : t}
                </button>
              ))}
            </div>

            {tab === 'overview' ? (
              <button
                onClick={() => setReportStage('category')}
                className="card-app p-3.5 flex items-center gap-3 text-left cursor-pointer bg-red-50/60"
              >
                <div className="w-10 h-10 icon-badge bg-red-100 shrink-0"><ShieldAlert className="w-5 h-5 text-red-600" /></div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[13px] font-bold text-gray-950">Report Incident</h4>
                  <p className="text-[11px] text-gray-500 font-medium">Visible only to this ride's members</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
              </button>
            ) : (
              <div className="flex flex-col gap-2.5">
                {incidents.length === 0 ? (
                  <div className="card-app p-6 text-center">
                    <ShieldAlert className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                    <p className="text-[12px] font-semibold text-gray-500">No incidents reported on this ride yet.</p>
                  </div>
                ) : incidents.map(inc => (
                  <div key={inc.id} className="card-app p-3.5 flex items-start gap-3">
                    <div className="w-9 h-9 icon-badge bg-red-50 shrink-0"><ShieldAlert className="w-4 h-4 text-red-500" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-gray-950">{inc.title || inc.category}</p>
                      <p className="text-[11px] text-gray-500 font-medium mt-0.5">{inc.description}</p>
                      <p className="text-[10px] text-gray-400 font-semibold mt-1">Reported by {inc.reporter_name || 'a rider'} · {new Date(inc.created_at).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))}
                <button onClick={() => setReportStage('category')} className="w-full py-3 card-app text-[#FF6B22] font-bold text-[12px] rounded-full cursor-pointer flex items-center justify-center gap-1.5">
                  + Report a New Incident
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 p-4 max-w-[560px] w-full mx-auto">
          <button onClick={() => navigate('/ride-plus/join')} className="w-full py-4 btn-app-primary text-white font-bold text-[14px] rounded-full cursor-pointer">
            Join Ride
          </button>
        </div>
      </div>
    </React.Fragment>
  );
};

export default RideDetail;
