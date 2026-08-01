import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { DataTable, type ColumnDef } from '../../components/admin/DataTable';
import { Activity, Search, Filter } from 'lucide-react';

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    // Fetch logs and manually join with profiles to avoid missing foreign key errors
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500); // Limit to last 500 for performance

    if (error) {
      setErrorMsg(error.message);
    } else if (data) {
      const userIds = Array.from(new Set(data.map((log: any) => log.actor_id).filter(Boolean)));
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', userIds);
        if (profiles) {
          const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));
          data.forEach((log: any) => {
            if (log.actor_id && profileMap[log.actor_id]) {
              log.profiles = profileMap[log.actor_id];
            }
          });
        }
      }
      setLogs(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const columns: ColumnDef<any>[] = [
    {
      header: 'Time',
      accessorKey: 'created_at',
      cell: (row) => (
        <div className="text-[11px] text-[#8A8A8E]">
          <div className="font-bold text-[#273a5a]">{new Date(row.created_at).toLocaleDateString()}</div>
          <div>{new Date(row.created_at).toLocaleTimeString()}</div>
        </div>
      )
    },
    {
      header: 'Actor',
      cell: (row) => (
        <div className="text-[12px]">
          {row.profiles ? (
            <span className="font-bold text-[#273a5a]">{row.profiles.full_name || row.profiles.email}</span>
          ) : (
            <span className="font-mono text-[#8A8A8E]">{row.actor_id || 'System'}</span>
          )}
        </div>
      )
    },
    {
      header: 'Action',
      accessorKey: 'action',
      cell: (row) => {
        let color = 'bg-[#F2F2F7] text-[#8A8A8E]';
        if (row.action.startsWith('CREATE')) color = 'bg-[#E5F9ED] text-[#34C759]';
        if (row.action.startsWith('UPDATE')) color = 'bg-[#FFF0E6] text-[#ef4523]';
        if (row.action.startsWith('DELETE')) color = 'bg-[#FFEBEE] text-[#FF3B30]';
        
        return (
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${color}`}>
            {row.action}
          </span>
        );
      }
    },
    {
      header: 'Target ID',
      accessorKey: 'target_id',
      cell: (row) => <span className="font-mono text-[10px] text-[#8A8A8E]">{row.target_id.substring(0, 8)}...</span>
    },
    {
      header: 'Details',
      cell: (row) => (
        <div className="max-w-[200px] truncate text-[11px] text-[#8A8A8E] font-mono">
          {row.details ? JSON.stringify(row.details) : '-'}
        </div>
      )
    }
  ];

  return (
    <div className="flex w-full h-full relative overflow-hidden bg-white">
      <div className="flex-1 w-full p-6 flex flex-col bg-[#Ffffff] text-[#273a5a] overflow-hidden">
        <div className="mb-6 flex justify-between items-end shrink-0">
          <div>
            <h1 className="text-[18px] font-bold tracking-tight leading-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Audit Logs
            </h1>
            <p className="text-[12px] text-[#8A8A8E] mt-1">Track every action across the platform to ensure 100% visibility.</p>
          </div>
          <button onClick={fetchLogs} className="h-8 px-3 bg-[#F2F2F7] hover:bg-[#E5E5EA] rounded text-[12px] font-bold transition-colors">
            Refresh
          </button>
        </div>
        
        {errorMsg && (
          <div className="mb-4 p-3 bg-[#FFEBEE] text-[#FF3B30] text-[12px] rounded border border-[#FF3B30]/20 font-semibold">
            {errorMsg}
          </div>
        )}

        <div className="flex-1 min-h-0 border border-[#E5E5EA] rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full text-[12px] text-[#8A8A8E] font-semibold">Loading audit logs...</div>
          ) : (
            <DataTable 
              data={logs} 
              columns={columns} 
              searchPlaceholder="Search actions or actors..."
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAuditLogs;
