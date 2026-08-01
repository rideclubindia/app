import React, { useEffect, useState, useMemo } from 'react';
import { Filter, Plus, ChevronDown, ChevronRight, MoreHorizontal, ArrowUpRight, ArrowDownRight, Info, Users, ShieldAlert, Car, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { startOfDay, startOfWeek, startOfMonth, startOfYear, subDays, subWeeks, subMonths, subYears, isAfter, isWithinInterval } from 'date-fns';

const StatBox = ({ title, value, trend, linkTo }: any) => {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-lg border border-[#E5E5EA] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col h-[140px]">
      <div className="flex items-center gap-1.5 mb-4">
        <span className="text-[11px] font-semibold text-[#8A8A8E]">{title}</span>
        <Info className="w-3 h-3 text-[#E5E5EA]" />
      </div>
      
      <div className="flex justify-between items-end mb-auto">
        <div>
          <h2 className="text-[20px] font-bold tracking-tight leading-none mb-2">{value}</h2>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium text-[#8A8A8E]">vs previous period</span>
            <span className={`text-[9px] font-bold px-1 py-0.5 rounded flex items-center gap-0.5 ${trend >= 0 ? 'bg-[#E5F9ED] text-[#34C759]' : 'bg-[#FFEBEE] text-[#FF3B30]'}`}>
              {trend >= 0 ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />} {Math.abs(trend)}%
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-2 border-t border-[#E5E5EA]">
        <button 
          onClick={() => navigate(linkTo)}
          className="text-[11px] font-bold flex items-center gap-1.5 hover:text-[#ef4523] transition-colors"
        >
          See Details <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  // Filtering states
  const [globalTimeFilter, setGlobalTimeFilter] = useState('this_month');
  const [incidentTimeFilter, setIncidentTimeFilter] = useState('this_month');
  const [analyticsTimeFilter, setAnalyticsTimeFilter] = useState('this_year');

  const [rawData, setRawData] = useState({
    profiles: [] as any[],
    pins: [] as any[],
    rides: [] as any[],
    confs: [] as any[],
    subscribers: [] as any[],
    contactMessages: [] as any[],
    activeRidesCount: 0
  });

  const fetchRawData = async () => {
    const [{ data: profiles }, { data: pins }, { data: rides }, { data: confs }, { data: rideLocs }, { data: subscribers }, { data: contactMessages }] = await Promise.all([
      supabase.from('profiles').select('created_at'),
      supabase.from('pins').select('id, category, created_at, status'),
      supabase.from('rides').select('created_at'),
      supabase.from('confirmations').select('is_false, created_at'),
      supabase.from('ride_locations').select('ride_id'),
      supabase.from('website_subscribers').select('created_at'),
      supabase.from('contact_messages').select('created_at')
    ]);

    setRawData({
      profiles: profiles || [],
      pins: pins || [],
      rides: rides || [],
      confs: confs || [],
      subscribers: subscribers || [],
      contactMessages: contactMessages || [],
      activeRidesCount: rideLocs ? new Set(rideLocs.map((l: any) => l.ride_id)).size : 0
    });
  };

  useEffect(() => {
    fetchRawData();
    
    const channel = supabase.channel('dashboard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pins' }, fetchRawData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'confirmations' }, fetchRawData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchRawData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rides' }, fetchRawData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'website_subscribers' }, fetchRawData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_messages' }, fetchRawData)
      .subscribe();
      
    return () => { channel.unsubscribe(); };
  }, []);

  // Helper to filter dates
  const getDateRange = (filterValue: string, isPrevious = false) => {
    const now = new Date();
    let start: Date;
    let end = now;

    switch (filterValue) {
      case 'today':
        start = startOfDay(now);
        if (isPrevious) {
          start = subDays(startOfDay(now), 1);
          end = subDays(now, 1);
        }
        break;
      case 'this_week':
        start = startOfWeek(now);
        if (isPrevious) {
          start = subWeeks(startOfWeek(now), 1);
          end = subWeeks(now, 1);
        }
        break;
      case 'this_month':
        start = startOfMonth(now);
        if (isPrevious) {
          start = subMonths(startOfMonth(now), 1);
          end = subMonths(now, 1);
        }
        break;
      case 'this_year':
        start = startOfYear(now);
        if (isPrevious) {
          start = subYears(startOfYear(now), 1);
          end = subYears(now, 1);
        }
        break;
      case 'all':
      default:
        start = new Date(0);
        if (isPrevious) {
          start = new Date(0);
          end = new Date(0); // For 'all', no previous period trend makes sense really
        }
        break;
    }
    return { start, end };
  };

  const getFilteredCount = (data: any[], range: { start: Date, end: Date }) => {
    return data.filter(d => {
      const date = new Date(d.created_at);
      return date >= range.start && date <= range.end;
    }).length;
  };

  const calculateTrend = (current: number, prev: number) => {
    if (prev === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - prev) / prev) * 100);
  };

  // 1. Global Stats
  const globalStats = useMemo(() => {
    const currRange = getDateRange(globalTimeFilter, false);
    const prevRange = getDateRange(globalTimeFilter, true);

    const currUsers = getFilteredCount(rawData.profiles, currRange);
    const prevUsers = getFilteredCount(rawData.profiles, prevRange);
    
    const currAlerts = getFilteredCount(rawData.pins, currRange);
    const prevAlerts = getFilteredCount(rawData.pins, prevRange);
    
    const currRides = getFilteredCount(rawData.rides, currRange);
    const prevRides = getFilteredCount(rawData.rides, prevRange);

    const currConfs = rawData.confs.filter(c => !c.is_false && isAfter(new Date(c.created_at), currRange.start)).length;
    const prevConfs = rawData.confs.filter(c => !c.is_false && isWithinInterval(new Date(c.created_at), prevRange)).length;
    
    const totalConfs = getFilteredCount(rawData.confs, currRange);
    const totalFalse = rawData.confs.filter(c => c.is_false && isAfter(new Date(c.created_at), currRange.start)).length;

    return {
      users: currUsers,
      uTrend: calculateTrend(currUsers, prevUsers),
      alerts: currAlerts,
      iTrend: calculateTrend(currAlerts, prevAlerts),
      rides: currRides,
      rTrend: calculateTrend(currRides, prevRides),
      confirmations: currConfs,
      cTrend: calculateTrend(currConfs, prevConfs),
      falseFlags: totalFalse,
      totalVotes: totalConfs,
      activeRides: rawData.activeRidesCount,
      subscribers: getFilteredCount(rawData.subscribers, currRange),
      messages: getFilteredCount(rawData.contactMessages, currRange)
    };
  }, [rawData, globalTimeFilter]);

  // 2. Incident Overview Stats
  const incidentStats = useMemo(() => {
    const range = getDateRange(incidentTimeFilter, false);
    const filteredPins = rawData.pins.filter(p => isAfter(new Date(p.created_at), range.start));
    
    let acc = 0, haz = 0;
    filteredPins.forEach(p => {
      if (p.category && p.category.toLowerCase().includes('accident')) acc++;
      else haz++;
    });

    const activeAlerts = filteredPins.filter(p => p.status === 'active').length;
    const prevRange = getDateRange(incidentTimeFilter, true);
    const prevActiveAlerts = rawData.pins.filter(p => p.status === 'active' && isWithinInterval(new Date(p.created_at), prevRange)).length;

    return {
      total: filteredPins.length,
      accidents: acc,
      hazards: haz,
      activeAlerts,
      activeTrend: calculateTrend(activeAlerts, prevActiveAlerts)
    };
  }, [rawData, incidentTimeFilter]);

  // 3. Analytics Chart Stats
  const analyticsStats = useMemo(() => {
    const range = getDateRange(analyticsTimeFilter, false);
    const filteredPins = rawData.pins.filter(p => isAfter(new Date(p.created_at), range.start));
    const filteredUsers = getFilteredCount(rawData.profiles, range);
    
    // Group by month for chart (simplistic for now, regardless of filter)
    // To make it dynamic based on filter, we group by month if year/all, group by day if week/month
    const chartData: any[] = [];
    const isGranular = analyticsTimeFilter === 'this_month' || analyticsTimeFilter === 'this_week' || analyticsTimeFilter === 'today';
    
    if (isGranular) {
      // Group by Day
      const daysMap: Record<string, number> = {};
      filteredPins.forEach(p => {
        const d = new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        daysMap[d] = (daysMap[d] || 0) + 1;
      });
      Object.keys(daysMap).forEach(k => chartData.push({ name: k, value: daysMap[k] }));
    } else {
      // Group by Month
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthsMap: Record<string, number> = {};
      filteredPins.forEach(p => {
        const m = months[new Date(p.created_at).getMonth()];
        monthsMap[m] = (monthsMap[m] || 0) + 1;
      });
      // Preserve order roughly
      months.forEach(m => {
        if (monthsMap[m] !== undefined) chartData.push({ name: m, value: monthsMap[m] });
      });
    }

    return {
      reports: filteredPins.length,
      users: filteredUsers,
      chartData
    };
  }, [rawData, analyticsTimeFilter]);

  // 4. Miscellaneous Stats (User Growth & Category Mix)
  const miscStats = useMemo(() => {
    const now = new Date();
    const last7DaysData = Array(7).fill(0);
    const dayLabels = Array(7).fill('');
    for (let i = 0; i < 7; i++) {
       const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
       dayLabels[i] = d.toLocaleDateString('en-US', { weekday: 'short' });
    }

    rawData.profiles.forEach(p => {
       const d = new Date(p.created_at);
       for (let i = 0; i < 7; i++) {
         const dayStart = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
         dayStart.setHours(0,0,0,0);
         const dayEnd = new Date(dayStart);
         dayEnd.setHours(23,59,59,999);
         if (d >= dayStart && d <= dayEnd) {
           last7DaysData[i]++;
         }
       }
    });

    const categoriesMap: Record<string, number> = {};
    let totalCatPins = 0;
    rawData.pins.forEach(p => {
      if (p.category) {
          categoriesMap[p.category] = (categoriesMap[p.category] || 0) + 1;
          totalCatPins++;
      }
    });

    const cats = Object.entries(categoriesMap).map(([label, count]) => ({
         label,
         val: totalCatPins > 0 ? Math.round((count / totalCatPins) * 100) : 0
    })).sort((a,b) => b.val - a.val).slice(0, 4);
    
    const colors = ['bg-blue-500', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500'];
    const categoryData = cats.map((c, i) => ({ ...c, color: colors[i % colors.length] }));

    return {
      userGrowth: last7DaysData,
      dayLabels,
      categoryData
    };
  }, [rawData.profiles, rawData.pins]);

  // Recent Incidents
  const recentIncidents = useMemo(() => {
    return [...rawData.pins].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 4);
  }, [rawData.pins]);

  const resolutionRate = globalStats.totalVotes === 0 ? 0 : Math.round((globalStats.confirmations / globalStats.totalVotes) * 100);
  const gaugeData = [
    { name: 'Accurate', value: resolutionRate, color: '#ef4523' },
    { name: 'Remaining', value: 100 - resolutionRate, color: '#F2F4F7' }
  ];
  const maxGrowth = Math.max(...miscStats.userGrowth, 10);

  return (
    <div className="flex-1 w-full text-[#273a5a] bg-[#FFFFFF] p-4 overflow-y-auto hide-scrollbar">
      
      {/* Header Area */}
      <div className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-[16px] font-bold tracking-tight leading-tight">Dashboard</h1>
          <p className="text-[11px] text-[#8A8A8E] mt-1">Track your incidents and performance of your strategy</p>
        </div>
        <div className="flex gap-2">
          <select 
            className="h-7 px-2 bg-white border border-[#E5E5EA] rounded text-[11px] font-semibold flex items-center gap-1.5 hover:bg-gray-50 outline-none cursor-pointer"
            value={globalTimeFilter}
            onChange={(e) => setGlobalTimeFilter(e.target.value)}
          >
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="this_year">This Year</option>
            <option value="all">All Time</option>
          </select>
          <button className="h-7 px-3 bg-[#273a5a] text-white rounded text-[11px] font-semibold flex items-center gap-1.5 hover:bg-gray-900 transition-colors shadow-sm">
            <Plus className="w-3 h-3" />
            Add Widget
          </button>
        </div>
      </div>

      {/* Analytics StatBoxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        <StatBox title="Total Users" value={globalStats.users.toLocaleString()} trend={globalStats.uTrend} linkTo="/admin/users" />
        <StatBox title="ACTIVE ALERTS" value={globalStats.alerts.toLocaleString()} trend={globalStats.iTrend} linkTo="/admin/incidents" />
        <StatBox title="CONFIRMATIONS" value={globalStats.confirmations.toLocaleString()} trend={globalStats.cTrend} linkTo="/admin/incidents" />
        <StatBox title="EARLY ACCESS" value={globalStats.subscribers.toLocaleString()} trend={0} linkTo="/admin/subscribers" />
        <StatBox title="CONTACT MESSAGES" value={globalStats.messages.toLocaleString()} trend={0} linkTo="/admin/messages" />
      </div>

      {/* Top 3 Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        
        {/* Incident Overview Card */}
        <div className="bg-white rounded-lg border border-[#E5E5EA] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-[#8A8A8E]">Incident overview</span>
              <Info className="w-3 h-3 text-[#E5E5EA]" />
            </div>
            <select 
              className="px-2 py-1 rounded border border-[#E5E5EA] text-[10px] font-semibold text-[#8A8A8E] outline-none hover:bg-gray-50 cursor-pointer"
              value={incidentTimeFilter}
              onChange={(e) => setIncidentTimeFilter(e.target.value)}
            >
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="this_year">This Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
          
          <div className="flex items-baseline gap-1.5 mb-4">
            <h2 className="text-[20px] font-bold tracking-tight">{incidentStats.total.toLocaleString()}</h2>
            <span className="text-[11px] font-medium text-[#8A8A8E]">Total incidents</span>
          </div>

          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-semibold text-[#8A8A8E]">Select by category</span>
            <div className="flex items-center gap-1 text-[10px]">
              <span className="font-semibold">New reports:</span>
              <span className="text-[#8A8A8E]">{incidentStats.total}</span>
            </div>
          </div>
          
          <div className="flex items-center rounded-md overflow-hidden h-5 w-full border border-[#E5E5EA] mt-auto">
            <div className="h-full bg-[#ef4523] flex items-center justify-center text-white text-[9px] font-bold whitespace-nowrap overflow-hidden px-1 transition-all" style={{width: `${Math.max(15, (incidentStats.accidents / Math.max(1, incidentStats.total)) * 100)}%`}}>Accidents ({incidentStats.accidents})</div>
            <div className="h-full bg-[#ef4523] flex items-center justify-center text-white text-[9px] font-bold whitespace-nowrap overflow-hidden px-1 transition-all" style={{width: `${Math.max(15, (incidentStats.hazards / Math.max(1, incidentStats.total)) * 100)}%`}}>Hazards ({incidentStats.hazards})</div>
          </div>
        </div>

        {/* Active Alerts Card */}
        <div className="bg-white rounded-lg border border-[#E5E5EA] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col">
          <div className="flex items-center gap-1.5 mb-4">
            <span className="text-[11px] font-semibold text-[#8A8A8E]">Active alerts</span>
            <Info className="w-3 h-3 text-[#E5E5EA]" />
          </div>
          
          <div className="flex justify-between items-end mb-auto">
            <div>
              <h2 className="text-[20px] font-bold tracking-tight leading-none mb-2">{incidentStats.activeAlerts.toLocaleString()}</h2>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-[#8A8A8E]">vs prev period</span>
                <span className={`text-[9px] font-bold px-1 py-0.5 rounded flex items-center gap-0.5 ${incidentStats.activeTrend >= 0 ? 'bg-[#E5F9ED] text-[#34C759]' : 'bg-[#FFEBEE] text-[#FF3B30]'}`}>
                  {incidentStats.activeTrend >= 0 ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />} {Math.abs(incidentStats.activeTrend)}%
                </span>
              </div>
            </div>
            {/* Mini Bar Chart Mock */}
            <div className="flex items-end gap-1 h-8">
              <div className="w-1.5 h-5 bg-[#ef4523] rounded-full"></div>
              <div className="w-1.5 h-3 bg-[#FFD1B3] rounded-full"></div>
              <div className="w-1.5 h-8 bg-[#ef4523] rounded-full"></div>
              <div className="w-1.5 h-2 bg-[#FFD1B3] rounded-full"></div>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-[#E5E5EA]">
            <button onClick={() => navigate('/admin/incidents')} className="text-[11px] font-bold flex items-center gap-1.5 hover:text-[#ef4523] transition-colors">
              See Details <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Community Trust Card */}
        <div className="bg-white rounded-lg border border-[#E5E5EA] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col">
          <div className="flex items-center gap-1.5 mb-4">
            <span className="text-[11px] font-semibold text-[#8A8A8E]">Community Trust</span>
            <Info className="w-3 h-3 text-[#E5E5EA]" />
          </div>
          
          <div className="flex justify-between items-end mb-auto">
            <div>
              <h2 className="text-[20px] font-bold tracking-tight leading-none mb-2">{globalStats.confirmations.toLocaleString()}</h2>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-[#8A8A8E]">vs prev period</span>
                <span className={`text-[9px] font-bold px-1 py-0.5 rounded flex items-center gap-0.5 ${globalStats.cTrend >= 0 ? 'bg-[#E5F9ED] text-[#34C759]' : 'bg-[#FFEBEE] text-[#FF3B30]'}`}>
                  {globalStats.cTrend >= 0 ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />} {Math.abs(globalStats.cTrend)}%
                </span>
              </div>
            </div>
            {/* Mini Circle Chart Mock */}
            <div className="relative w-8 h-8">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#F2F4F7" strokeWidth="4" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#ef4523" strokeWidth="4" strokeDasharray="75, 100" />
              </svg>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-[#E5E5EA]">
            <button onClick={() => navigate('/admin/users')} className="text-[11px] font-bold flex items-center gap-1.5 hover:text-[#ef4523] transition-colors">
              See Details <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Analytics & Gauge Row */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 mb-4">
        
        {/* Analytics Line Chart */}
        <div className="bg-white rounded-lg border border-[#E5E5EA] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-[#8A8A8E]">Analytics</span>
              <Info className="w-3 h-3 text-[#E5E5EA]" />
            </div>
            <div className="flex gap-2">
              <select 
                className="px-2 py-1 rounded border border-[#E5E5EA] text-[10px] font-semibold text-[#8A8A8E] outline-none hover:bg-gray-50 cursor-pointer"
                value={analyticsTimeFilter}
                onChange={(e) => setAnalyticsTimeFilter(e.target.value)}
              >
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="this_year">This Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-end mb-4">
            <div className="flex items-center gap-2.5">
              <h2 className="text-[20px] font-bold tracking-tight">{analyticsStats.reports.toLocaleString()}</h2>
              <span className="text-[11px] font-medium text-[#8A8A8E]">reports</span>
              <span className="bg-[#E5F9ED] text-[#34C759] text-[9px] font-bold px-1 py-0.5 rounded flex items-center gap-0.5">
                <ArrowUpRight className="w-2.5 h-2.5" /> Active
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-[16px] font-bold tracking-tight">{analyticsStats.users.toLocaleString()}</h2>
              <span className="text-[11px] font-medium text-[#8A8A8E]">users</span>
            </div>
          </div>

          <div className="w-full h-[180px] flex items-end gap-1 pb-4 border-b border-l border-[#F2F4F7] pt-4 pl-2 mt-4">
            {analyticsStats.chartData.length > 0 ? analyticsStats.chartData.map((d: any, i: number) => {
              const maxVal = Math.max(...analyticsStats.chartData.map((x: any) => x.value), 10);
              const heightPct = (d.value / maxVal) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col justify-end items-center h-full group relative">
                  <div className="w-full bg-[#ef4523] opacity-80 hover:opacity-100 transition-all rounded-t-sm" style={{ height: `${Math.max(5, heightPct)}%` }}></div>
                  <span className="absolute -bottom-4 text-[9px] font-bold text-[#8A8A8E]">{d.name}</span>
                  <div className="absolute -top-8 bg-gray-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                    {d.value} reports
                  </div>
                </div>
              );
            }) : <div className="w-full text-center text-[#8A8A8E] text-[11px] font-medium self-center">No data available</div>}
          </div>
        </div>
        {/* Performance Gauge */}
        <div className="bg-white rounded-lg border border-[#E5E5EA] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-[#8A8A8E]">Performance metrics</span>
              <Info className="w-3 h-3 text-[#E5E5EA]" />
            </div>
          </div>

          <div className="relative h-[140px] flex items-center justify-center">
            <div className="w-[110px] h-[110px] rounded-full border-[8px] border-[#F2F4F7] relative flex items-center justify-center">
               <svg viewBox="0 0 36 36" className="absolute inset-0 w-full h-full transform -rotate-90">
                 <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#ef4523" strokeWidth="8" strokeDasharray={`${resolutionRate}, 100`} />
               </svg>
               <div className="flex flex-col items-center justify-center z-10 bg-white w-full h-full rounded-full">
                 <h2 className="text-[20px] font-bold tracking-tight leading-none mb-1">{resolutionRate}%</h2>
                 <span className="text-[9px] font-medium text-[#8A8A8E]">Resolution</span>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#ef4523]"></div>
                <span className="text-[10px] font-medium text-[#8A8A8E]">Accurate</span>
              </div>
              <p className="text-[13px] font-bold">{globalStats.confirmations.toLocaleString()}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#F2F4F7]"></div>
                <span className="text-[10px] font-medium text-[#8A8A8E]">False / Rejected</span>
              </div>
              <p className="text-[13px] font-bold">{globalStats.falseFlags.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Extra Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-lg border border-[#E5E5EA] shadow-sm p-4">
          <h3 className="text-[12px] font-bold text-gray-900 mb-6">User Signups (Last 7 Days)</h3>
          <div className="h-48 flex items-end justify-between gap-2">
            {miscStats.userGrowth.map((val, i) => (
              <div key={i} className="w-full bg-blue-50 rounded-t-lg relative group h-full flex items-end">
                <div 
                  className="w-full bg-blue-500 rounded-t-lg transition-all"
                  style={{ height: `${(val / maxGrowth) * 100}%` }}
                ></div>
                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded font-bold z-10">
                  {val}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-[10px] font-bold text-gray-400 uppercase">
            {miscStats.dayLabels.map((lbl, i) => <span key={i} className="flex-1 text-center">{lbl}</span>)}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#E5E5EA] shadow-sm p-4">
          <h3 className="text-[12px] font-bold text-gray-900 mb-6">Traffic Alerts by Category</h3>
          <div className="space-y-4">
            {miscStats.categoryData.length > 0 ? miscStats.categoryData.map((cat, i) => (
              <div key={i}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="font-semibold text-gray-700">{cat.label}</span>
                  <span className="font-bold text-gray-900">{cat.val}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`h-2 rounded-full ${cat.color}`} style={{ width: `${cat.val}%` }}></div>
                </div>
              </div>
            )) : <div className="text-gray-500 text-[11px]">No traffic alerts recorded yet.</div>}
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Recent Incidents Table */}
        <div className="bg-white rounded-lg border border-[#E5E5EA] shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#E5E5EA] flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-bold">Recent Incidents</span>
              <span className="bg-[#F2F4F7] text-[#8A8A8E] text-[10px] font-bold px-1.5 py-0.5 rounded">{recentIncidents.length}</span>
            </div>
            <button onClick={() => navigate('/admin/incidents')} className="text-[11px] font-bold text-[#ef4523] hover:text-[#ef4523]">View all</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="px-4 py-2 border-b border-[#E5E5EA] text-[10px] font-bold text-[#8A8A8E] uppercase tracking-wider">Type</th>
                  <th className="px-4 py-2 border-b border-[#E5E5EA] text-[10px] font-bold text-[#8A8A8E] uppercase tracking-wider">Date</th>
                  <th className="px-4 py-2 border-b border-[#E5E5EA] text-[10px] font-bold text-[#8A8A8E] uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5EA]">
                {recentIncidents.map((incident: any) => (
                  <tr key={incident.id} className="hover:bg-[#F2F4F7] transition-colors group">
                    <td className="px-4 py-2 text-[12px] font-semibold flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                        {incident.category.toLowerCase().includes('accident') ? <ShieldAlert className="w-3.5 h-3.5 text-red-500" /> : <Info className="w-3.5 h-3.5 text-yellow-500" />}
                      </div>
                      <span className="truncate max-w-[120px]">{incident.category}</span>
                    </td>
                    <td className="px-4 py-2 text-[11px] text-[#8A8A8E]">
                      {new Date(incident.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${incident.status === 'active' ? 'bg-[#E5F9ED] text-[#34C759]' : 'bg-[#F2F2F7] text-[#8A8A8E]'}`}>
                        {incident.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentIncidents.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-[12px] text-[#8A8A8E]">No recent incidents</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Users Table (Mocked for now, can be wired to actual query if needed) */}
        <div className="bg-white rounded-lg border border-[#E5E5EA] shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#E5E5EA] flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-bold">Top Contributors</span>
            </div>
            <button onClick={() => navigate('/admin/users')} className="text-[11px] font-bold text-[#ef4523] hover:text-[#ef4523]">View all</button>
          </div>
          <div className="p-6 flex flex-col items-center justify-center h-full text-center">
            <Users className="w-8 h-8 text-[#E5E5EA] mb-3" />
            <p className="text-[12px] font-semibold text-[#273a5a] mb-1">Coming Soon</p>
            <p className="text-[11px] text-[#8A8A8E]">Top contributors feature is being developed.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
