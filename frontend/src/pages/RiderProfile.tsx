import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Bike, Calendar, Loader2, Navigation2, Route as RouteIcon, UsersRound } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { initialsImage } from '../hooks/useAvatar';

// Another rider's limited public profile; the backend returns only non-confidential fields and aggregate stats
interface PublicRider {
  id: string;
  name: string;
  avatarUrl: string | null;
  bike: string | null;
  memberSince: string | null;
  stats: { rides: number; km: number };
  groups: { id: string; name: string }[];
  badges: string[];
  isMe: boolean;
}

const fmtKm = (km: number) => (km >= 10000 ? `${(km / 1000).toFixed(1)}K` : km.toLocaleString());

export default function RiderProfile() {
  const { riderId } = useParams();
  const navigate = useNavigate();
  const [rider, setRider] = useState<PublicRider | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!riderId) return;
    let cancelled = false;
    setRider(null);
    setError(null);
    apiClient.get(`/api/v1/riders/${encodeURIComponent(riderId)}/public`)
      .then((r) => { if (!cancelled) setRider(r.data); })
      .catch((e) => { if (!cancelled) setError(e?.response?.status === 404 ? 'This rider could not be found.' : navigator.onLine ? 'Could not load this profile.' : 'No internet connection.'); });
    return () => { cancelled = true; };
  }, [riderId]);

  useEffect(() => { if (rider?.isMe) navigate('/profile', { replace: true }); }, [rider, navigate]);

  const since = rider?.memberSince ? new Date(rider.memberSince) : null;

  return (
    <div className="fixed inset-0 bg-app-canvas flex flex-col font-sans pt-[max(20px,env(safe-area-inset-top))] pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center gap-3 px-4 pt-3 pb-2 max-w-[560px] w-full mx-auto">
        <button onClick={() => navigate(-1)} aria-label="Back" className="w-11 h-11 rounded-full bg-white border border-gray-200 flex items-center justify-center active:scale-95">
          <ArrowLeft className="w-5 h-5 text-gray-900" />
        </button>
        <h1 className="text-[17px] font-bold text-gray-950">Rider</h1>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-8 max-w-[560px] w-full mx-auto">
        {!rider && !error && <div className="py-24 flex justify-center"><Loader2 className="w-7 h-7 text-[#FF6B22] animate-spin" /></div>}
        {error && <p className="py-24 text-center text-[15px] text-gray-600">{error}</p>}

        {rider && (
          <div className="flex flex-col gap-4 pt-2">
            <section className="relative overflow-hidden rounded-3xl bg-[#14161B] text-white px-5 pt-7 pb-6 text-center">
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#FF6B22]/25 blur-3xl pointer-events-none" />
              <img
                src={rider.avatarUrl || initialsImage(rider.name)}
                alt=""
                referrerPolicy="no-referrer"
                onError={(e) => { const f = initialsImage(rider.name); if (e.currentTarget.src !== f) e.currentTarget.src = f; }}
                className="relative w-24 h-24 rounded-full object-cover mx-auto ring-4 ring-white/10 bg-white/10"
              />
              <h2 className="relative mt-3 text-[22px] font-bold leading-tight">{rider.name}</h2>
              {rider.bike && <p className="relative mt-1 text-[14px] text-white/70 flex items-center justify-center gap-1.5"><Bike className="w-4 h-4" /> {rider.bike}</p>}

              <div className="relative grid grid-cols-2 mt-6 pt-5 border-t border-white/10">
                <div>
                  <p className="text-[26px] font-bold tabular-nums leading-none">{fmtKm(rider.stats.km)}</p>
                  <p className="text-[12px] text-white/55 mt-1.5">km ridden</p>
                </div>
                <div className="border-l border-white/10">
                  <p className="text-[26px] font-bold tabular-nums leading-none">{rider.stats.rides}</p>
                  <p className="text-[12px] text-white/55 mt-1.5">{rider.stats.rides === 1 ? 'ride' : 'rides'}</p>
                </div>
              </div>
            </section>

            <dl className="rounded-2xl bg-white border border-gray-200 divide-y divide-gray-100">
              <div className="flex items-center gap-3 px-4 min-h-[56px]">
                <Bike className="w-5 h-5 text-gray-500 shrink-0" />
                <dt className="flex-1 text-[14px] text-gray-500">Motorcycle</dt>
                <dd className="text-[15px] font-semibold text-gray-950 text-right">{rider.bike || 'Not shared'}</dd>
              </div>
              {since && (
                <div className="flex items-center gap-3 px-4 min-h-[56px]">
                  <Calendar className="w-5 h-5 text-gray-500 shrink-0" />
                  <dt className="flex-1 text-[14px] text-gray-500">Member since</dt>
                  <dd className="text-[15px] font-semibold text-gray-950">{since.toLocaleDateString([], { month: 'long', year: 'numeric' })}</dd>
                </div>
              )}
            </dl>

            {rider.badges.length > 0 && (
              <section>
                <h3 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">Badges</h3>
                <div className="flex flex-wrap gap-2">
                  {rider.badges.map((b) => (
                    <span key={b} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-white border border-gray-200 text-[13px] font-semibold text-gray-800">
                      {b.includes('KM') ? <RouteIcon className="w-4 h-4 text-[#FF6B22]" /> : b.includes('Leader') ? <UsersRound className="w-4 h-4 text-[#7C4DFF]" /> : <Navigation2 className="w-4 h-4 text-emerald-600" />}
                      {b}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {rider.groups.length > 0 && (
              <section>
                <h3 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">Ride Groups</h3>
                <ul className="rounded-2xl bg-white border border-gray-200 divide-y divide-gray-100">
                  {rider.groups.map((g) => (
                    <li key={g.id} className="flex items-center gap-3 px-4 min-h-[52px]">
                      <span className="w-9 h-9 rounded-full bg-[#FFE3D1] text-[#FF6B22] text-[13px] font-bold flex items-center justify-center shrink-0">{g.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</span>
                      <span className="text-[15px] font-medium text-gray-950 truncate">{g.name}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <p className="text-[12px] text-gray-400 text-center px-6">Only public riding details are shown. Contact details, location and ride history stay private.</p>
          </div>
        )}
      </div>
    </div>
  );
}
