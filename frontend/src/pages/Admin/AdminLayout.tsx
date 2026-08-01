import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import whiteLogo from '../../assets/Logos/Logo for White Backgrounds 2.svg';
import { 
  MessageSquare, TrendingUp, ShieldAlert,
  Car, ChevronLeft, Search, Bell, Download, Plus, Navigation2,
  LayoutDashboard, Users2, LogOut, AlertTriangle, FileText, Settings, Activity, HelpCircle
} from 'lucide-react';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import { supabase } from '../../lib/supabase';
import { SearchInput } from '../../components/ui/SearchInput';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const hostname = window.location.hostname;
  const isAdminDomain = hostname.startsWith('admin');
  const bp = isAdminDomain ? '' : '/admin';
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile && !collapsed) {
        setCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const NavItem = ({ to, icon: Icon, label, badge }: { to: string, icon: any, label: string, badge?: number }) => {
    const isActive = location.pathname === to || (to !== `${bp}/dashboard` && location.pathname.includes(to));
    
    return (
      <Link 
        to={to} 
        className={`flex items-center gap-2.5 px-3 py-2 my-0.5 rounded-lg transition-all relative group ${
          isActive ? 'bg-[#F2F4F7] text-[#273a5a] font-semibold' : 'text-[#8A8A8E] hover:text-[#273a5a] hover:bg-gray-50'
        }`}
      >
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] bg-[#ef4523] rounded-r-full" />
        )}
        <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-[#273a5a]' : 'text-[#8A8A8E] group-hover:text-[#273a5a]'}`} strokeWidth={isActive ? 2.5 : 2} />
        {!collapsed && (
          <span className="text-[13px] flex-1 truncate">{label}</span>
        )}
        {!collapsed && badge && (
          <span className="bg-[#F2F4F7] text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded">
            {badge}
          </span>
        )}
      </Link>
    );
  }; 

  const [counts, setCounts] = useState({ incidents: 0, groups: 0, navigations: 0 });
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchCountsAndData = async () => {
      // Fetch badge counts
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const [{ count: incidentsCount }, { count: groupsCount }, { count: navigationsCount }] = await Promise.all([
        supabase.from('pins').select('*', { count: 'exact', head: true }).eq('status', 'active').gte('created_at', twoHoursAgo),
        supabase.from('groups').select('*', { count: 'exact', head: true }),
        supabase.from('navigation_sessions').select('*', { count: 'exact', head: true }).eq('status', 'active')
      ]);
      setCounts({
        incidents: incidentsCount || 0,
        groups: groupsCount || 0,
        navigations: navigationsCount || 0
      });

      // Fetch admin profile — try by UID first, then by email as fallback
      if (auth.currentUser) {
        let profile: any = null;
        const { data: byUid } = await supabase.from('profiles').select('*').eq('id', auth.currentUser.uid).maybeSingle();
        if (byUid) {
          profile = byUid;
        } else if (auth.currentUser.email) {
          const { data: byEmail } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', auth.currentUser.email)
            .maybeSingle();
          profile = byEmail;
        }
        setAdminProfile(profile || {
          id: auth.currentUser.uid,
          full_name: auth.currentUser.displayName || 'Admin',
          email: auth.currentUser.email,
          avatar_url: auth.currentUser.photoURL,
          role: 'admin'
        });
      }

      // Fetch 3 recent users for header avatars
      const { data: users } = await supabase.from('profiles').select('avatar_url, full_name, id').order('created_at', { ascending: false }).limit(3);
      if (users) setRecentUsers(users);
    };

    fetchCountsAndData();

    // Subscribe to auth state changes to ensure we have the user
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) fetchCountsAndData();
    });

    const channel = supabase.channel('layout_counts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pins' }, fetchCountsAndData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, fetchCountsAndData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchCountsAndData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'navigation_sessions' }, fetchCountsAndData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      sessionStorage.clear();
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('ride_club_permissions_accepted_')) {
          localStorage.removeItem(key);
        }
      });
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="flex w-full h-[100dvh] bg-[#FFFFFF] font-sans text-[#273a5a] overflow-hidden">
      
      {/* Mobile Overlay */}
      {!collapsed && isMobile && (
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed md:relative inset-y-0 left-0 ${collapsed ? '-translate-x-full md:translate-x-0 md:w-[70px]' : 'translate-x-0 w-[230px] shadow-2xl md:shadow-none'} bg-white h-full flex flex-col border-r border-[#E5E5EA] flex-shrink-0 z-50 transition-all duration-300`}>
        
        {/* Logo Area */}
        <div className="h-[64px] px-4 flex items-center justify-between border-b border-[#E5E5EA] shrink-0">
          <div className={`flex items-center gap-2.5 overflow-hidden ${collapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
            <img src={whiteLogo} alt="Ride Club Logo" className="h-24 w-auto object-contain" />
          </div>
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className={`w-7 h-7 rounded border border-[#E5E5EA] flex items-center justify-center text-[#8A8A8E] hover:bg-gray-50 shrink-0 ${collapsed ? 'mx-auto' : ''}`}
          >
            <ChevronLeft className={`w-3.5 h-3.5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Scrollable Nav */}
        <div className="flex-1 overflow-y-auto py-5 px-3 flex flex-col hide-scrollbar">
          
          <div className="mb-5">
            {!collapsed && <p className="text-[10px] font-bold text-[#8A8A8E] tracking-wider mb-1.5 px-3 uppercase">Main Menu</p>}
            <NavItem to={`${bp}/dashboard`} icon={LayoutDashboard} label="Dashboard" />
            <NavItem to={`${bp}/incidents`} icon={ShieldAlert} label="Incidents" badge={counts.incidents > 0 ? counts.incidents : undefined} />
            <NavItem to={`${bp}/rides`} icon={Car} label="Active Rides" />
            <NavItem to={`${bp}/navigations`} icon={Navigation2} label="Navigations" badge={counts.navigations > 0 ? counts.navigations : undefined} />
            <NavItem to={`${bp}/users`} icon={Users2} label="Customers" />
            <NavItem to={`${bp}/groups`} icon={MessageSquare} label="Groups Chat" badge={counts.groups > 0 ? counts.groups : undefined} />
          </div>

          <div className="flex flex-col gap-0.5 mt-4">
            {!collapsed && <p className="text-[10px] font-bold text-[#8A8A8E] tracking-wider mb-1.5 px-3 uppercase">Other</p>}
            <NavItem to={`${bp}/cms`} icon={FileText} label="Content (CMS)" />
          </div>

          <div className="mb-5 mt-5">
            {!collapsed && <p className="text-[10px] font-bold text-[#8A8A8E] tracking-wider mb-1.5 px-3 uppercase">Account & System</p>}
            <NavItem to={`${bp}/audit`} icon={Activity} label="Audit Logs" />
            <NavItem to={`${bp}/errors`} icon={AlertTriangle} label="System Errors" />
            <NavItem to={`${bp}/settings`} icon={Settings} label="Global Settings" />
          </div>
        </div>

        {/* Profile Footer */}
        <div className="p-3 border-t border-[#E5E5EA] shrink-0">
          <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
            {adminProfile?.avatar_url ? (
              <img 
                src={adminProfile.avatar_url} 
                alt="Admin" 
                loading="lazy"
                onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(adminProfile.full_name || 'Admin')}&background=random`; }}
                className="w-8 h-8 rounded-full border border-gray-200 object-cover" 
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500 text-[12px]">
                {adminProfile?.full_name?.charAt(0) || 'A'}
              </div>
            )}
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold truncate">{adminProfile?.full_name || 'Admin User'}</p>
                <p className="text-[11px] text-[#8A8A8E] truncate">{adminProfile?.email || auth.currentUser?.email || 'admin@app.com'}</p>
              </div>
            )}
            {!collapsed && (
              <button onClick={handleLogout} className="text-[#8A8A8E] hover:text-[#273a5a]">
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
        
        {/* Topbar */}
        <div className="h-[64px] bg-white border-b border-[#E5E5EA] px-4 md:px-6 flex items-center justify-between shrink-0 z-10 w-full overflow-hidden">
          
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              className="md:hidden w-8 h-8 rounded flex items-center justify-center text-[#8A8A8E] hover:bg-gray-50 shrink-0"
              onClick={() => setCollapsed(!collapsed)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </button>
            {/* Search */}
            <div className="w-[140px] md:w-[260px] relative hidden sm:block">
              <SearchInput 
                variant="admin"
                placeholder="Search" 
                rightElement={
                  <div className="flex gap-1 pr-1">
                    <span className="bg-[#F2F4F7] text-[#8A8A8E] text-[9px] font-bold px-1.5 py-[1px] rounded">F</span>
                    <span className="bg-[#F2F4F7] text-[#8A8A8E] text-[9px] font-bold px-1.5 py-[1px] rounded">⌘</span>
                  </div>
                }
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Avatars */}
            <div className="flex items-center">
              {recentUsers.map((u, i) => (
                <div key={u.id} className={`w-7 h-7 rounded-full border-2 border-white relative z-${30 - (i * 10)} ${i > 0 ? '-ml-2' : ''} bg-gray-200 overflow-hidden flex items-center justify-center`} title={u.full_name}>
                  {u.avatar_url ? (
                    <img 
                      src={u.avatar_url} 
                      loading="lazy"
                      onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name || 'Admin')}&background=random`; }}
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span className="text-[10px] font-bold text-gray-500">{u.full_name?.charAt(0) || 'U'}</span>
                  )}
                </div>
              ))}
              <button className="w-7 h-7 rounded-full border border-dashed border-[#E5E5EA] -ml-2 relative z-0 flex items-center justify-center bg-white text-[#8A8A8E] hover:border-gray-400" title="View all users" onClick={() => navigate('/admin/users')}>
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <div className="hidden md:flex w-[1px] h-5 bg-[#E5E5EA]"></div>

            <button className="w-8 h-8 rounded border border-[#E5E5EA] flex items-center justify-center text-[#273a5a] hover:bg-gray-50 relative shrink-0">
              <Bell className="w-4 h-4" />
              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#ef4523] rounded-full border border-white"></div>
            </button>

            <button className="hidden md:flex h-8 px-3 bg-[#ef4523] text-white rounded items-center gap-1.5 text-[13px] font-semibold hover:bg-[#ef4523] transition-colors shadow-sm shadow-[#ef4523]/20 shrink-0">
              Export
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="flex-1 relative flex flex-col min-h-0 bg-white">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
