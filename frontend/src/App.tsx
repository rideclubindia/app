import React, { lazy, Suspense, useEffect, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, Outlet, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { Map as MapIcon, Bell, User, Users, Navigation2, Home as HomeIcon } from 'lucide-react';
import { ToastProvider, useToast } from './components/ToastContext';
import { useLocationStore } from './store/useLocationStore';
import { ConfirmProvider } from './components/ConfirmDialog';
import ErrorBoundary from './components/ErrorBoundary';
import { LoadingSpinner } from './components/LoadingSpinner';
import { getDeterministicUuid } from './lib/user';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { supabase } from './lib/supabase';
import type { User as FirebaseUser } from 'firebase/auth';
import BannedScreen from './pages/BannedScreen';
import { CookieConsent } from './components/CookieConsent';
import { Capacitor } from '@capacitor/core';
import { SoloRide } from './pages/SoloRide';
import ReactGA from 'react-ga4';
import { MorphingNav } from './components/MorphingNav';
import { InstallPWA } from './components/InstallPWA';
import { LeftGravityWell } from './components/spatial/LeftGravityWell';
import { CommandDock } from './components/spatial/CommandDock';
import type { CommandAction } from './components/spatial/CommandDock';
import maplibregl from 'maplibre-gl';
import { RiderCockpitLayout } from './components/spatial/RiderCockpitLayout';
import { NavigationOverlay } from './components/home/NavigationOverlay';
import { MapControls } from './components/home/MapControls';
import { LowerMapControl } from './components/home/LowerMapControl';
import { HomeMap } from './components/home/HomeMap';
import { renderRiderMarker } from './components/home/RiderMarker';
const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
if (measurementId) {
  ReactGA.initialize(measurementId);
}

const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    if (measurementId) {
      ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
    }
  }, [location]);

  return null;
};

const MapView = lazy(() => import('./pages/MapView'));
const Home = lazy(() => import('./pages/Home'));
const SplashScreen = lazy(() => import('./pages/SplashScreen'));
const LoginScreen = lazy(() => import('./pages/LoginScreen'));
const AlertsFeed = lazy(() => import('./pages/AlertsFeed'));
const Profile = lazy(() => import('./pages/Profile'));
const MyRides = lazy(() => import('./pages/MyRides'));
const IncidentDetail = lazy(() => import('./pages/IncidentDetail'));
const RoutesScreen = lazy(() => import('./pages/Routes'));
const Navigation = lazy(() => import('./pages/Navigation'));
const SavedLocationPicker = lazy(() => import('./pages/SavedLocationPicker'));
const SavedLocationsList = lazy(() => import('./pages/SavedLocationsList'));
const MyIncidents = lazy(() => import('./pages/MyIncidents'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const Groups = lazy(() => import('./pages/Groups'));
const RideDashboard = lazy(() => import('./pages/RidePlus/RideDashboard'));
const RideHistory = lazy(() => import('./pages/RideHistory'));
const CreateRide = lazy(() => import('./pages/RidePlus/CreateRide'));
const JoinRide = lazy(() => import('./pages/RidePlus/JoinRide'));
const LiveRide = lazy(() => import('./pages/RidePlus/LiveRide'));
const AdminLayout = lazy(() => import('./pages/Admin/AdminLayout'));
const AdminIncidents = lazy(() => import('./pages/Admin/AdminIncidents'));
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/Admin/AdminUsers'));
const AdminSubscribers = lazy(() => import('./pages/Admin/AdminSubscribers'));
const AdminContactMessages = lazy(() => import('./pages/Admin/AdminContactMessages'));
const AdminRides = lazy(() => import('./pages/Admin/AdminRides'));
const AdminGroups = lazy(() => import('./pages/Admin/AdminGroups'));
const AdminErrors = lazy(() => import('./pages/Admin/AdminErrors'));
const AdminAuditLogs = lazy(() => import('./pages/Admin/AdminAuditLogs'));
const AdminCMS = lazy(() => import('./pages/Admin/AdminCMS'));
const AdminSettings = lazy(() => import('./pages/Admin/AdminSettings'));
const AdminNavigations = lazy(() => import('./pages/Admin/AdminNavigations'));
const AdminLogin = lazy(() => import('./pages/Admin/AdminLogin'));
const AdminSupport = lazy(() => import('./pages/Admin/AdminSupport'));

const SupportLayout = lazy(() => import('./pages/SupportAdmin/SupportLayout'));
const SupportDashboard = lazy(() => import('./pages/SupportAdmin/SupportDashboard'));
const SupportSubscribers = lazy(() => import('./pages/SupportAdmin/SupportSubscribers'));
const SupportWebsiteContact = lazy(() => import('./pages/SupportAdmin/SupportWebsiteContact'));
const SupportAppContact = lazy(() => import('./pages/SupportAdmin/SupportAppContact'));
const RideDash404 = lazy(() => import('./pages/RideDash404'));
const GroupRideDashboard = lazy(() => import('./pages/GroupRideDashboard').then(module => ({ default: module.GroupRideDashboard })));
const PolicyAcceptance = lazy(() => import('./pages/PolicyAcceptance'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Terms = lazy(() => import('./pages/Terms'));
const ComingSoonScreen = lazy(() => import('./pages/ComingSoonScreen'));
const SupportCenter = lazy(() => import('./pages/SupportCenter'));
const SupportChat = lazy(() => import('./pages/SupportChat'));
const WebsiteHome = lazy(() => import('./pages/WebsiteHome'));
const WebsitePage = lazy(() => import('./pages/WebsitePage'));
const WebsitePolicyPage = lazy(() => import('./pages/WebsitePolicyPage'));
const WebsiteFeatures = lazy(() => import('./pages/Website/Features'));
const WebsiteCommunity = lazy(() => import('./pages/Website/Community'));
const WebsiteSafety = lazy(() => import('./pages/Website/Safety'));
const WebsiteAppInfo = lazy(() => import('./pages/Website/TheApp'));
const WebsiteAbout = lazy(() => import('./pages/Website/AboutUs'));
const WebsiteContact = lazy(() => import('./pages/Website/Contact'));
export const ADMIN_EMAIL = 'iharsharoyal@gmail.com';

const BodyStyler = ({ isWebsiteDomain }: { isWebsiteDomain: boolean }) => {
  const location = useLocation();
  useEffect(() => {
    const root = document.getElementById('root');
    if (isWebsiteDomain && location.pathname === '/') {
      document.body.style.overflow = 'auto';
      document.body.style.height = 'auto';
      document.body.style.overscrollBehaviorY = 'auto';
      document.documentElement.style.overflow = 'auto';
      document.documentElement.style.height = 'auto';
      if (root) {
        root.style.height = 'auto';
        root.style.minHeight = '100vh';
      }
    } else {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100%';
      document.body.style.overscrollBehaviorY = 'none';
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.height = '100%';
      if (root) {
        root.style.height = '100%';
        root.style.minHeight = 'auto';
      }
    }
  }, [isWebsiteDomain, location.pathname]);
  return null;
};

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [banned, setBanned] = useState(false);
  const [warning, setWarning] = useState(false);
  const [needsPolicyAcceptance, setNeedsPolicyAcceptance] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(currentUser);
      const userId = getDeterministicUuid(currentUser.uid);
      try {
        const profileRes = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();

        if (profileRes.error) {
          console.warn('Profile fetch failed', profileRes.error.message);
        }

        if (!profileRes.data) {
          await supabase.from('profiles').upsert({
            id: userId,
            full_name: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
            email: currentUser.email || '',
            avatar_url: currentUser.photoURL || undefined,
            status: 'active'
          }, { onConflict: 'id' });
        } else {
          setBanned(profileRes.data.status === 'suspended' || profileRes.data.status === 'banned');
          setWarning(profileRes.data.status === 'warning');
        }

        // Check policies from database or local storage
        const hasAcceptedPolicies = !!profileRes.data?.policy_accepted_at || localStorage.getItem(`policy_accepted_${userId}`) === 'true';

        if (!hasAcceptedPolicies) {
          setNeedsPolicyAcceptance(true);
        }
      } catch (err) {
        console.error('Failed to verify profile status', err);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [showToast]);

  useEffect(() => {
    if (warning) {
      showToast('Your account has been temporarily restricted due to repeated false incident reports.', 'error');
    }
  }, [warning, showToast]);

  useEffect(() => {
    if (user && !banned && !needsPolicyAcceptance) {
      useLocationStore.getState().startTracking();
    } else {
      useLocationStore.getState().stopTracking();
    }
  }, [user, banned, needsPolicyAcceptance]);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (banned) {
    return <BannedScreen />;
  }

  // We don't return early for needsPolicyAcceptance, we render it as an overlay below.
  
  return (
    <>
      {children}
      {needsPolicyAcceptance && <PolicyAcceptance onAccept={() => setNeedsPolicyAcceptance(false)} />}
    </>
  );
};

const RequireAdmin = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!user?.email || user.email.toLowerCase() !== ADMIN_EMAIL) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { coordinates: userLocation, locationName, isMapReporting } = useLocationStore();
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
  const riderMarkerRef = useRef<maplibregl.Marker | null>(null);
  const [currentRide, setCurrentRide] = useState<any>(null);
  const [activeNavigation, setActiveNavigation] = useState<any>(null);
  const [nearbyRiderCount, setNearbyRiderCount] = useState(0);

  // Fetch Current Ride & Active Nav
  useEffect(() => {
    const fetchRide = async () => {
      const u = auth.currentUser;
      if (!u) return;
      const userId = getDeterministicUuid(u.uid);

      const { data: ownedRides } = await supabase
        .from('rides')
        .select('*')
        .eq('owner_id', userId)
        .neq('status', 'ended')
        .order('created_at', { ascending: false });

      if (ownedRides && ownedRides.length > 0) {
        setCurrentRide(ownedRides[0]);
      } else {
        setCurrentRide(null);
      }

      const { data: navData } = await supabase
        .from('navigations')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (navData && navData.length > 0) {
        setActiveNavigation(navData[0]);
      }
    };
    fetchRide();
  }, []);

  // Update Rider Marker on map
  useEffect(() => {
    if (mapInstance && userLocation) {
      if (!riderMarkerRef.current) {
        riderMarkerRef.current = renderRiderMarker(mapInstance, userLocation.lng, userLocation.lat);
      } else {
        riderMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
      }
    }
  }, [mapInstance, userLocation]);

  const now = new Date();
  const etaStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  const isCreateRideRoute = location.pathname.startsWith('/ride-plus/create');
  const isHomeRoute = location.pathname === '/home';

  return (
    <RiderCockpitLayout
      leftPanelWidth={isHomeRoute ? '100%' : (isCreateRideRoute ? '60%' : (isMapReporting ? '50%' : '32%'))}
      mapChildren={
        <div className="relative w-full h-full">
          {(activeNavigation || currentRide) && (
            <NavigationOverlay 
              distanceToTurn={activeNavigation?.next_turn_distance || '--'}
              streetName={activeNavigation?.next_street || locationName || 'Acquiring location...'}
              turnDirection={activeNavigation?.next_turn_direction || 'straight'}
              totalDistanceRemaining={activeNavigation?.remaining_distance || (currentRide ? `${currentRide.total_distance || '--'} km` : '--')}
              timeRemaining={activeNavigation?.remaining_time || currentRide?.estimated_duration || '--'}
              ridersNearby={nearbyRiderCount}
              eta={etaStr}
            />
          )}
          <MapControls map={mapInstance} />
          <LowerMapControl />
          <HomeMap 
            userLocation={userLocation} 
            onMapLoad={(map) => setMapInstance(map)} 
          />
        </div>
      }
      leftPanel={<Outlet context={{ map: mapInstance }} />}
    />
  );
};

const MobileShell = () => (
  <div className="w-full h-full bg-white flex justify-center font-sans overflow-hidden">
    <div className="w-full h-full bg-white overflow-hidden relative">
      <Outlet />
    </div>
  </div>
);

const MaintenanceGuard = ({ children, isAdminDomain, isWebsiteDomain, isSupportDomain }: { children: React.ReactNode, isAdminDomain: boolean, isWebsiteDomain: boolean, isSupportDomain: boolean }) => {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [comingSoonConfig, setComingSoonConfig] = useState<any>(null);
  const [blockWebAccess, setBlockWebAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase.from('cms_content').select('*').eq('slug', 'app-settings').maybeSingle();
      console.log('Settings Fetch:', { data, error });
      if (data?.content) {
        setIsMaintenance(isWebsiteDomain ? data.content.websiteMaintenanceMode : data.content.maintenanceMode);
        setBlockWebAccess(!!data.content.blockWebAccess);
        if ((isWebsiteDomain && data.content.websiteComingSoonMode) || (!isWebsiteDomain && data.content.comingSoonMode)) {
           setComingSoonConfig(data.content);
        } else {
           setComingSoonConfig(null);
        }
      }
      setLoading(false);
    };
    fetchSettings();

    const channel = supabase.channel('settings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cms_content', filter: 'slug=eq.app-settings' }, (payload: any) => {
        if (payload.new?.content) {
          const newMaintenance = isWebsiteDomain ? payload.new.content.websiteMaintenanceMode : payload.new.content.maintenanceMode;
          if (newMaintenance !== undefined) {
            setIsMaintenance(newMaintenance);
          }
          if (payload.new.content.blockWebAccess !== undefined) {
            setBlockWebAccess(!!payload.new.content.blockWebAccess);
          }
          const isComingSoon = isWebsiteDomain ? payload.new.content.websiteComingSoonMode : payload.new.content.comingSoonMode;
          if (isComingSoon) {
             setComingSoonConfig(payload.new.content);
          } else {
             setComingSoonConfig(null);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) return <LoadingSpinner fullScreen />;

  const isAdminRoute = isAdminDomain || isSupportDomain || location.pathname.startsWith('/admin') || location.pathname.startsWith('/support-admin');
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const isWebBlocked = blockWebAccess && !isAdminRoute && !isWebsiteDomain && !isSupportDomain && !isLocalhost;

  if (isWebBlocked && !Capacitor.isNativePlatform()) {
     return (
       <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center p-6 text-center font-sans">
         <div className="w-24 h-24 mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
              <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/>
              <path d="M12 18h.01"/>
              <line x1="4" y1="22" x2="20" y2="22" stroke="currentColor" strokeWidth="2" />
              <line x1="2" y1="4" x2="22" y2="20" stroke="currentColor" strokeWidth="2" />
            </svg>
         </div>
         <h1 className="text-2xl font-bold mb-3 text-[#273a5a]">App Access Restricted</h1>
         <p className="text-[#8A8A8E] max-w-sm leading-relaxed mb-6">
           You are not allowed to access the Ride Club app via a web browser. Please download the official mobile app to continue.
         </p>
         <a href="/" className="px-6 py-3 bg-[#ef4523] text-white rounded-lg font-bold">Back to Website</a>
       </div>
     );
  }

  if (!isAdminRoute && !isLocalhost && comingSoonConfig) {
    return (
       <Suspense fallback={<LoadingSpinner fullScreen />}>
          <ComingSoonScreen 
             title={comingSoonConfig?.comingSoonTitle}
             subtitle={comingSoonConfig?.comingSoonSubtitle}
             description={comingSoonConfig?.comingSoonDescription}
             launchDate={comingSoonConfig?.comingSoonLaunchDate}
             imageUrl={comingSoonConfig?.comingSoonImage}
             logoUrl={comingSoonConfig?.comingSoonLogo}
             buttonText={comingSoonConfig?.comingSoonButtonText}
             buttonAction={comingSoonConfig?.comingSoonButtonAction}
             showCountdown={comingSoonConfig?.comingSoonShowCountdown ?? true}
          />
       </Suspense>
    );
  }

  if (isMaintenance && !isAdminRoute) {
    return (
      <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-24 h-24 mb-6 bg-[#FFF0E6] rounded-full flex items-center justify-center">
          <svg className="w-12 h-12" viewBox="0 0 91 91" id="Layer_1" version="1.1" xmlSpace="preserve" xmlns="http://www.w3.org/2000/svg">
            <path d="M38.841,55.666l0.682-0.676l-0.02-0.016c-0.881-0.891,4.984-6.855,4.984-6.855l-8.119-8.118L8.663,66.904 c-1.973,1.977-2.92,4.705-2.658,7.686c0.242,2.793,1.533,5.49,3.813,7.771c2.43,2.424,5.553,3.66,8.533,3.66 c2.521,0,4.938-0.889,6.746-2.691l20.258-20.26l-5.111-5.17C39.604,57.252,39.151,56.488,38.841,55.666" fill="#ef4523"/>
            <path d="M87.675,16.767l-1.621-3.891L75.616,23.317c-1.777,1.777-3.336,2.678-4.635,2.678 c-0.992,0-2.006-0.537-3.146-1.674l-0.188-0.184c-1.701-1.701-3.016-3.695,1.037-7.75L79.13,5.942l-3.893-1.621 C67.31,1.019,59.005-1.073,51.952,5.985l-6.457,6.451c-6.553,6.561-8.811,14.01-6.699,21.397l6.51,6.646l5.088-5.088 c0,0,3.248,1.688,5.568,3.182l13.875,14.061c3.398-1.033,6.664-3.059,9.732-6.129l6.441-6.452 C93.073,33.001,90.985,24.692,87.675,16.767" fill="#ef4523"/>
            <path d="M80.097,69.682L54.472,43.714c-0.84-0.855-1.898-1.527-3.148-1.996l-1.51-0.568l-4.578,4.58L21.023,21.518 l2.235-2.237c0.602-0.6,0.9-1.439,0.813-2.283c-0.086-0.846-0.547-1.607-1.258-2.074L9.72,6.321 C8.601,5.587,7.118,5.739,6.169,6.687l-4.482,4.49c-0.945,0.947-1.096,2.428-0.361,3.545l8.6,13.094 c0.465,0.711,1.227,1.174,2.072,1.26c0.096,0.01,0.191,0.014,0.287,0.014c0.746,0,1.465-0.295,1.998-0.826l2.02-2.021 l24.211,24.211l-4.588,4.59l0.572,1.512c0.459,1.207,1.119,2.25,1.965,3.105l25.645,25.984c1.688,1.688,4.006,2.617,6.527,2.617 h0.002c2.994,0,6.018-1.309,8.334-3.627l0.133-0.139c2.057-2.051,3.318-4.678,3.553-7.396 C82.907,74.219,81.993,71.582,80.097,69.682z M75.522,80.99l-0.137,0.145c-1.344,1.344-3.076,2.117-4.75,2.117 c-0.838,0-2.039-0.201-2.979-1.139L42.026,56.141c-0.02-0.02-0.039-0.039-0.059-0.059l8.893-8.895 c0.012,0.014,0.023,0.027,0.035,0.039L76.54,73.211c0.844,0.848,1.246,2.076,1.125,3.455C77.53,78.211,76.784,79.73,75.522,80.99z" fill="#ef4523"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-3 text-[#273a5a]">Under Maintenance</h1>
        <p className="text-[#8A8A8E] max-w-sm leading-relaxed">
          We are currently upgrading our systems to bring you a better experience. We'll be back online shortly.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

function App() {
  const hostname = window.location.hostname;
  const isAdminDomain = hostname.startsWith('admin');
  const isSupportDomain = hostname.startsWith('support');
  const isWebsiteDomain = hostname === 'rideclub.in' || hostname === 'www.rideclub.in';

  return (
    <ErrorBoundary>
      <ToastProvider>
        <ConfirmProvider>
        <BrowserRouter>
          <BodyStyler isWebsiteDomain={isWebsiteDomain} />
          <MaintenanceGuard isAdminDomain={isAdminDomain} isWebsiteDomain={isWebsiteDomain} isSupportDomain={isSupportDomain}>
            <AnalyticsTracker />
            <Suspense fallback={<LoadingSpinner fullScreen />}>
            <Routes>
              {/* Admin Routes (Desktop Optimized) - Mounted at root for admin domain */}
              {isAdminDomain && (
                <>
                  <Route path="/login" element={<AdminLogin />} />
                  <Route path="/" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="incidents" element={<AdminIncidents />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="subscribers" element={<AdminSubscribers />} />
                  <Route path="messages" element={<AdminContactMessages />} />
                  <Route path="rides" element={<AdminRides />} />
                  <Route path="navigations" element={<AdminNavigations />} />
                  <Route path="groups" element={<AdminGroups />} />
                  <Route path="audit" element={<AdminAuditLogs />} />
                  <Route path="cms" element={<AdminCMS />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="errors" element={<AdminErrors />} />
                  <Route path="support" element={<AdminSupport />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Route>
                </>
              )}

              {/* Support Admin Routes (Desktop Optimized) - Mounted at root for support domain */}
              {isSupportDomain && (
                <>
                  <Route path="/login" element={<AdminLogin />} />
                  <Route path="/" element={<RequireAdmin><SupportLayout /></RequireAdmin>}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<SupportDashboard />} />
                    <Route path="subscribers" element={<SupportSubscribers />} />
                    <Route path="website-contact" element={<SupportWebsiteContact />} />
                    <Route path="app-contact" element={<SupportAppContact />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Route>
                </>
              )}

              {/* Admin Routes (Localhost fallback) */}
              {!isAdminDomain && (
                <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="incidents" element={<AdminIncidents />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="subscribers" element={<AdminSubscribers />} />
                <Route path="messages" element={<AdminContactMessages />} />
                <Route path="rides" element={<AdminRides />} />
                <Route path="navigations" element={<AdminNavigations />} />
                <Route path="groups" element={<AdminGroups />} />
                <Route path="audit" element={<AdminAuditLogs />} />
                <Route path="cms" element={<AdminCMS />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="errors" element={<AdminErrors />} />
                <Route path="support" element={<AdminSupport />} />
                <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
              </Route>
              )}

              {/* Support Admin Routes (Localhost fallback) */}
              {!isSupportDomain && (
                <Route path="/support-admin" element={<RequireAdmin><SupportLayout /></RequireAdmin>}>
                  <Route index element={<Navigate to="/support-admin/dashboard" replace />} />
                  <Route path="dashboard" element={<SupportDashboard />} />
                  <Route path="subscribers" element={<SupportSubscribers />} />
                  <Route path="website-contact" element={<SupportWebsiteContact />} />
                  <Route path="app-contact" element={<SupportAppContact />} />
                  <Route path="*" element={<Navigate to="/support-admin/dashboard" replace />} />
                </Route>
              )}

              {/* Mobile App Routes */}
              {!isAdminDomain && (
                <>
                {isWebsiteDomain && (
                  <>
                    <Route path="/" element={<WebsiteHome />} />
                    <Route path="/features" element={<WebsiteFeatures />} />
                    <Route path="/community" element={<WebsiteCommunity />} />
                    <Route path="/safety" element={<WebsiteSafety />} />
                    <Route path="/app" element={<WebsiteAppInfo />} />
                    <Route path="/about" element={<WebsiteAbout />} />
                    <Route path="/contact" element={<WebsiteContact />} />
                    <Route path="/download" element={<WebsitePage title="Download" />} />
                    <Route path="/pricing" element={<WebsitePage title="Pricing" />} />
                    <Route path="/careers" element={<WebsitePage title="Careers" />} />
                    <Route path="/press" element={<WebsitePage title="Press" />} />
                    <Route path="/blog" element={<WebsitePage title="Blog" />} />
                    <Route path="/privacy" element={<WebsitePolicyPage type="privacy" />} />
                    <Route path="/terms" element={<WebsitePolicyPage type="terms" />} />
                    <Route path="/cookies" element={<WebsitePage title="Cookie Policy" />} />
                    <Route path="/guidelines" element={<WebsitePage title="Community Guidelines" />} />
                  </>
                )}
                <Route element={<MobileShell />}>
                {!isWebsiteDomain && <Route path="/" element={<SplashScreen />} />}
                {/* Auth & Setup */}
                <Route path="/login" element={<LoginScreen />} />
                <Route path="/accept-policies" element={<PolicyAcceptance />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<Terms />} />
                <Route element={<RequireAuth><Layout /></RequireAuth>}>
                  <Route path="/home" element={<Home />} />
                  <Route path="/map" element={<MapView />} />
                  <Route path="/groups" element={<Groups />} />
                  <Route path="/ride-plus" element={<RideDashboard />} />
                  <Route path="/ride-history" element={<RideHistory />} />
                  <Route path="/my-rides" element={<MyRides />} />
                  <Route path="/ride-plus/create" element={<CreateRide />} />
                  <Route path="/ride-plus/join" element={<JoinRide />} />
                  <Route path="/ride-plus/live/:id" element={<LiveRide />} />
                  <Route path="/group-ride-dashboard" element={<GroupRideDashboard />} />
                  <Route path="/alerts" element={<AlertsFeed />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/support" element={<SupportCenter />} />
                  <Route path="/support/:ticketId" element={<SupportChat />} />
                </Route>
                
                <Route path="/incident/:id" element={<RequireAuth><IncidentDetail /></RequireAuth>} />
                <Route path="/route-planner" element={<RequireAuth><RoutesScreen /></RequireAuth>} />
                <Route path="/navigation" element={<RequireAuth><Navigation /></RequireAuth>} />
                <Route path="/solo-ride" element={<RequireAuth><SoloRide /></RequireAuth>} />
                <Route path="/saved-locations" element={<RequireAuth><SavedLocationsList /></RequireAuth>} />
                <Route path="/my-incidents" element={<RequireAuth><MyIncidents /></RequireAuth>} />
                <Route path="/edit-profile" element={<RequireAuth><EditProfile /></RequireAuth>} />
                <Route path="/saved-location-picker" element={<RequireAuth><SavedLocationPicker /></RequireAuth>} />
              </Route>
              </>
              )}
              
              {/* Catch-all 404 Route */}
              {!isAdminDomain && <Route path="*" element={<RideDash404 />} />}
            </Routes>
            <CookieConsent />
          </Suspense>
          </MaintenanceGuard>
        </BrowserRouter>
        </ConfirmProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
