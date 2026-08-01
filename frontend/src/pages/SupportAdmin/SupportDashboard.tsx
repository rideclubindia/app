import React, { useEffect, useState, useMemo } from 'react';
import { Filter, ChevronRight, Info, ArrowUpRight, ArrowDownRight, MessageSquare, Mail, Users, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { startOfDay, startOfWeek, startOfMonth, startOfYear, subDays, subWeeks, subMonths, subYears, isAfter } from 'date-fns';

const StatBox = ({ title, value, trend, linkTo, icon: Icon }: any) => {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-lg border border-[#E5E5EA] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col min-h-[120px] justify-between">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-[#8A8A8E]">{title}</span>
          <Info className="w-3 h-3 text-[#E5E5EA]" />
        </div>
        {Icon && <Icon className="w-4 h-4 text-[#8A8A8E]" />}
      </div>
      
      <div className="flex justify-between items-end mb-auto">
        <div>
          <h2 className="text-[18px] font-bold tracking-tight leading-none mb-1">{value}</h2>
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-medium text-[#8A8A8E]">vs prev</span>
            <span className={`text-[8px] font-bold px-1 py-0.5 rounded flex items-center gap-0.5 ${trend >= 0 ? 'bg-[#E5F9ED] text-[#34C759]' : 'bg-[#FFEBEE] text-[#FF3B30]'}`}>
              {trend >= 0 ? <ArrowUpRight className="w-2 h-2" /> : <ArrowDownRight className="w-2 h-2" />} {Math.abs(trend)}%
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

const SupportDashboard = () => {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState('this_month');
  const [rawData, setRawData] = useState({
    tickets: [] as any[],
    subscribers: [] as any[],
    contactMessages: [] as any[]
  });

  const fetchRawData = async () => {
    const [{ data: tickets }, { data: subscribers }, { data: contactMessages }] = await Promise.all([
      supabase.from('support_tickets').select('*'),
      supabase.from('website_subscribers').select('*'),
      supabase.from('contact_messages').select('*')
    ]);

    setRawData({
      tickets: tickets || [],
      subscribers: subscribers || [],
      contactMessages: contactMessages || []
    });
  };

  useEffect(() => {
    fetchRawData();
    const channel = supabase.channel('support-dashboard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, fetchRawData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'website_subscribers' }, fetchRawData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_messages' }, fetchRawData)
      .subscribe();
      
    return () => { channel.unsubscribe(); };
  }, []);

  const getDateRange = (filterValue: string, isPrevious = false) => {
    const now = new Date();
    let start: Date;
    let end = now;
    switch (filterValue) {
      case 'today':
        start = startOfDay(now);
        if (isPrevious) { start = subDays(startOfDay(now), 1); end = subDays(now, 1); }
        break;
      case 'this_week':
        start = startOfWeek(now);
        if (isPrevious) { start = subWeeks(startOfWeek(now), 1); end = subWeeks(now, 1); }
        break;
      case 'this_month':
        start = startOfMonth(now);
        if (isPrevious) { start = subMonths(startOfMonth(now), 1); end = subMonths(now, 1); }
        break;
      case 'this_year':
        start = startOfYear(now);
        if (isPrevious) { start = subYears(startOfYear(now), 1); end = subYears(now, 1); }
        break;
      case 'all':
      default:
        start = new Date(0);
        if (isPrevious) { start = new Date(0); end = new Date(0); }
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

  const stats = useMemo(() => {
    const currRange = getDateRange(timeFilter, false);
    const prevRange = getDateRange(timeFilter, true);

    const currTickets = getFilteredCount(rawData.tickets, currRange);
    const prevTickets = getFilteredCount(rawData.tickets, prevRange);
    const currSub = getFilteredCount(rawData.subscribers, currRange);
    const prevSub = getFilteredCount(rawData.subscribers, prevRange);
    const currMsg = getFilteredCount(rawData.contactMessages, currRange);
    const prevMsg = getFilteredCount(rawData.contactMessages, prevRange);

    const currResolved = getFilteredCount(rawData.tickets.filter((t: any) => t.status === 'resolved' || t.status === 'closed'), currRange);
    const prevResolved = getFilteredCount(rawData.tickets.filter((t: any) => t.status === 'resolved' || t.status === 'closed'), prevRange);
    const currPending = getFilteredCount(rawData.tickets.filter((t: any) => t.status === 'open' || t.status === 'in_progress'), currRange);
    const prevPending = getFilteredCount(rawData.tickets.filter((t: any) => t.status === 'open' || t.status === 'in_progress'), prevRange);

    return {
      tickets: currTickets, tTrend: calculateTrend(currTickets, prevTickets),
      subscribers: currSub, sTrend: calculateTrend(currSub, prevSub),
      messages: currMsg, mTrend: calculateTrend(currMsg, prevMsg),
      resolved: currResolved, rTrend: calculateTrend(currResolved, prevResolved),
      pending: currPending, pTrend: calculateTrend(currPending, prevPending),
    };
  }, [rawData, timeFilter]);

  // Chart data
  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = months.map(m => ({ name: m, tickets: 0, subscribers: 0, messages: 0 }));
    
    rawData.tickets.forEach(d => { const m = new Date(d.created_at).getMonth(); data[m].tickets++; });
    rawData.subscribers.forEach(d => { const m = new Date(d.created_at).getMonth(); data[m].subscribers++; });
    rawData.contactMessages.forEach(d => { const m = new Date(d.created_at).getMonth(); data[m].messages++; });
    
    return data;
  }, [rawData]);

  const inquiryPieData = useMemo(() => {
    const typeCount: Record<string, number> = {};
    rawData.contactMessages.forEach(m => {
      typeCount[m.inquiry_type] = (typeCount[m.inquiry_type] || 0) + 1;
    });
    return Object.keys(typeCount).map(key => ({ name: key, value: typeCount[key] }));
  }, [rawData]);

  const COLORS = ['#ef4523', '#333333', '#8A8A8E', '#E5E5EA'];

  return (
    <div className="flex-1 w-full text-[#273a5a] bg-[#F2F2F7] p-4 overflow-y-auto hide-scrollbar">
      <div className="mb-6">
        <h1 className="text-[20px] font-bold tracking-tight text-[#111]">Support Dashboard</h1>
        <p className="text-[#8A8A8E] text-[12px] mt-1">Overview of all support and subscriber metrics.</p>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <select 
          value={timeFilter} 
          onChange={(e) => setTimeFilter(e.target.value)}
          className="bg-white border border-[#E5E5EA] rounded-md px-3 py-1.5 text-sm font-medium outline-none"
        >
          <option value="today">Today</option>
          <option value="this_week">This Week</option>
          <option value="this_month">This Month</option>
          <option value="this_year">This Year</option>
          <option value="all">All Time</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatBox title="APP TICKETS" value={stats.tickets.toLocaleString()} trend={stats.tTrend} linkTo="/support-admin/app-contact" icon={MessageSquare} />
        <StatBox title="RESOLVED" value={stats.resolved.toLocaleString()} trend={stats.rTrend} linkTo="/support-admin/app-contact" icon={CheckCircle} />
        <StatBox title="PENDING" value={stats.pending.toLocaleString()} trend={stats.pTrend} linkTo="/support-admin/app-contact" icon={Clock} />
        <StatBox title="EARLY ACCESS" value={stats.subscribers.toLocaleString()} trend={stats.sTrend} linkTo="/support-admin/subscribers" icon={Users} />
        <StatBox title="WEB MESSAGES" value={stats.messages.toLocaleString()} trend={stats.mTrend} linkTo="/support-admin/website-contact" icon={Mail} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-lg border border-[#E5E5EA] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <h3 className="text-[13px] font-semibold text-[#8A8A8E] mb-6 tracking-wide">SUPPORT VOLUME (TREND)</h3>
          <div className="h-[200px] flex items-end justify-between pb-8 pt-4 gap-2 border-b border-[#f0f0f0]">
            {chartData.map((data, i) => (
              <div key={i} className="flex flex-col items-center flex-1 h-full justify-end group relative">
                <div 
                  className="w-full max-w-[40px] bg-[#ef4523] rounded-t-sm transition-all duration-300 opacity-80 group-hover:opacity-100"
                  style={{ height: `${Math.max(5, (data.tickets / (Math.max(...chartData.map(d => Math.max(d.tickets, d.subscribers))) || 1)) * 100)}%` }}
                ></div>
                <div 
                  className="w-full max-w-[40px] bg-[#333333] rounded-t-sm transition-all duration-300 opacity-80 group-hover:opacity-100 mt-1"
                  style={{ height: `${Math.max(5, (data.subscribers / (Math.max(...chartData.map(d => Math.max(d.tickets, d.subscribers))) || 1)) * 100)}%` }}
                ></div>
                <span className="text-[10px] text-[#8A8A8E] mt-3">{data.name}</span>
                
                {/* Custom Tooltip */}
                <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-[#E5E5EA] shadow-lg rounded-md p-2 z-10 pointer-events-none w-32 flex flex-col gap-1">
                  <p className="text-[10px] font-bold text-gray-500">{data.name}</p>
                  <p className="text-xs text-[#ef4523] font-semibold">Tickets: {data.tickets}</p>
                  <p className="text-xs text-[#333333] font-semibold">Subs: {data.subscribers}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#ef4523] rounded-full"></div>
              <span className="text-xs text-gray-600 font-medium">App Tickets</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#333333] rounded-full"></div>
              <span className="text-xs text-gray-600 font-medium">Subscribers</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#E5E5EA] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <h3 className="text-[13px] font-semibold text-[#8A8A8E] mb-6 tracking-wide">INQUIRY TYPES (WEBSITE)</h3>
          {inquiryPieData.length > 0 ? (
            <div className="flex flex-col gap-4 mt-2">
              {inquiryPieData.sort((a, b) => b.value - a.value).map((item, index) => {
                const total = inquiryPieData.reduce((acc, curr) => acc + curr.value, 0);
                const percent = Math.round((item.value / total) * 100);
                return (
                  <div key={index} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-gray-700">{item.name}</span>
                      <span className="text-gray-500 font-bold">{item.value} ({percent}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full" 
                        style={{ width: `${percent}%`, backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-gray-400">No inquiry data available</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
        {/* Recent Tickets Table */}
        <div className="bg-white rounded-lg border border-[#E5E5EA] shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#E5E5EA] flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-bold">Recent Tickets</span>
              <span className="bg-[#F2F4F7] text-[#8A8A8E] text-[10px] font-bold px-1.5 py-0.5 rounded">{Math.min(rawData.tickets.length, 5)}</span>
            </div>
            <button onClick={() => navigate('/support-admin/app-contact')} className="text-[11px] font-bold text-[#ef4523] hover:text-[#ef4523]">View all</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="px-4 py-2 border-b border-[#E5E5EA] text-[10px] font-bold text-[#8A8A8E] uppercase tracking-wider">Subject</th>
                  <th className="px-4 py-2 border-b border-[#E5E5EA] text-[10px] font-bold text-[#8A8A8E] uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2 border-b border-[#E5E5EA] text-[10px] font-bold text-[#8A8A8E] uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5EA]">
                {rawData.tickets.slice(0, 5).map((ticket: any) => (
                  <tr key={ticket.id} className="hover:bg-[#F2F4F7] transition-colors group">
                    <td className="px-4 py-2 text-[12px] font-semibold truncate max-w-[200px]">{ticket.category || 'Support Request'}</td>
                    <td className="px-4 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${ticket.status === 'resolved' ? 'bg-[#E5F9ED] text-[#34C759]' : 'bg-[#FFF4E5] text-[#FF9500]'}`}>
                        {ticket.status || 'open'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-[11px] text-[#8A8A8E]">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {rawData.tickets.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-[12px] text-[#8A8A8E]">No recent tickets</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Subscribers Table */}
        <div className="bg-white rounded-lg border border-[#E5E5EA] shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#E5E5EA] flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-bold">Recent Subscribers</span>
              <span className="bg-[#F2F4F7] text-[#8A8A8E] text-[10px] font-bold px-1.5 py-0.5 rounded">{Math.min(rawData.subscribers.length, 5)}</span>
            </div>
            <button onClick={() => navigate('/support-admin/subscribers')} className="text-[11px] font-bold text-[#ef4523] hover:text-[#ef4523]">View all</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="px-4 py-2 border-b border-[#E5E5EA] text-[10px] font-bold text-[#8A8A8E] uppercase tracking-wider">Email</th>
                  <th className="px-4 py-2 border-b border-[#E5E5EA] text-[10px] font-bold text-[#8A8A8E] uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5EA]">
                {rawData.subscribers.slice(0, 5).map((sub: any) => (
                  <tr key={sub.id} className="hover:bg-[#F2F4F7] transition-colors group">
                    <td className="px-4 py-2 text-[12px] font-semibold truncate max-w-[200px]">{sub.email}</td>
                    <td className="px-4 py-2 text-[11px] text-[#8A8A8E]">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {rawData.subscribers.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-center text-[12px] text-[#8A8A8E]">No recent subscribers</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportDashboard;
