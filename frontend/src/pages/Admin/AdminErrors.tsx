import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { AlertTriangle, CheckCircle, Clock, Search, ExternalLink, X } from 'lucide-react';
import { SearchInput } from '../../components/ui/SearchInput';

const AdminErrors = () => {
  const [errors, setErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedError, setSelectedError] = useState<any | null>(null);

  const fetchErrors = async () => {
    const { data, error } = await supabase
      .from('error_logs')
      .select(`
        *,
        user:user_id ( full_name, email, avatar_url )
      `)
      .order('created_at', { ascending: false });

    if (data) {
      setErrors(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchErrors();

    const channel = supabase.channel('error_logs_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'error_logs' }, () => {
        fetchErrors();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const toggleResolved = async (id: string, currentStatus: boolean) => {
    await supabase.from('error_logs').update({ resolved: !currentStatus }).eq('id', id);
    if (selectedError?.id === id) {
      setSelectedError({ ...selectedError, resolved: !currentStatus });
    }
  };

  const filteredErrors = errors.filter(e => 
    e.error_message?.toLowerCase().includes(search.toLowerCase()) || 
    e.route?.toLowerCase().includes(search.toLowerCase()) ||
    e.user?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#FFFFFF]">
      <div className="flex-1 overflow-hidden flex flex-col p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-500" /> System Errors
            </h1>
            <p className="text-gray-500 text-sm mt-1">Review and resolve client-side application crashes.</p>
          </div>
          <div>
            <SearchInput 
              variant="admin"
              placeholder="Search errors..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 border border-[#E5E5EA] rounded-xl overflow-hidden bg-white flex flex-col shadow-sm">
          <div className="overflow-x-auto flex-1 hide-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#F8F9FA] border-b border-[#E5E5EA] text-[#8A8A8E] sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 font-semibold">Message</th>
                  <th className="px-6 py-4 font-semibold">Route</th>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Time</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5EA]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Loading errors...
                    </td>
                  </tr>
                ) : filteredErrors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No errors found.
                    </td>
                  </tr>
                ) : (
                  filteredErrors.map((err) => (
                    <tr key={err.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="max-w-[300px] truncate font-medium text-gray-900" title={err.error_message}>
                          {err.error_message}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                          {err.route || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {err.user ? (
                          <div className="flex items-center gap-3">
                            {err.user.avatar_url ? (
                              <img 
                                src={err.user.avatar_url} 
                                alt="" 
                                loading="lazy"
                                onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(err.user?.full_name || 'User')}&background=random`; }}
                                className="w-8 h-8 rounded-full border border-gray-200 object-cover" 
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500 text-xs">
                                {err.user.full_name?.charAt(0) || 'U'}
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-gray-900">{err.user.full_name || 'Unknown User'}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500 italic">Guest / System</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(err.created_at).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full flex items-center w-max gap-1.5 ${
                          err.resolved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {err.resolved ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                          {err.resolved ? 'Resolved' : 'Open'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setSelectedError(err)}
                          className="text-[#ef4523] font-semibold text-sm hover:underline"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Error Details Modal */}
      {selectedError && (
        <div className="fixed inset-0 bg-[#273a5a]/50 flex justify-end z-[100] animate-in fade-in duration-200">
          <div className="w-[500px] h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-5 border-b border-[#E5E5EA] flex items-center justify-between bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" /> Error Details
              </h2>
              <button 
                onClick={() => setSelectedError(null)}
                className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-6 flex items-center justify-between">
                <span className={`px-3 py-1.5 text-sm font-semibold rounded-full flex items-center w-max gap-1.5 ${
                  selectedError.resolved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {selectedError.resolved ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  {selectedError.resolved ? 'Resolved' : 'Open'}
                </span>

                <button 
                  onClick={() => toggleResolved(selectedError.id, selectedError.resolved)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${
                    selectedError.resolved 
                      ? 'border-gray-200 text-gray-700 hover:bg-gray-50' 
                      : 'border-green-600 bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {selectedError.resolved ? 'Mark as Open' : 'Mark as Resolved'}
                </button>
              </div>

              <div className="mb-6">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Error Message</p>
                <div className="p-4 bg-red-50 text-red-900 border border-red-100 rounded-lg font-medium">
                  {selectedError.error_message}
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Route Occurred</p>
                <div className="flex items-center gap-2 text-gray-900 bg-gray-100 px-3 py-2 rounded-md font-mono text-sm w-max border border-gray-200">
                  <ExternalLink className="w-4 h-4 text-gray-500" />
                  {selectedError.route || 'Unknown'}
                </div>
              </div>

              {selectedError.user && (
                <div className="mb-6">
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Affected User</p>
                  <div className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl bg-gray-50">
                    {selectedError.user.avatar_url ? (
                      <img 
                        src={selectedError.user.avatar_url} 
                        alt="" 
                        loading="lazy"
                        onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedError.user?.full_name || 'User')}&background=random`; }}
                        className="w-10 h-10 rounded-full border border-gray-200 shadow-sm object-cover" 
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500">
                        {selectedError.user.full_name?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-gray-900">{selectedError.user.full_name}</div>
                      <div className="text-sm text-gray-500">{selectedError.user.email}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Timestamp</p>
                <p className="text-gray-900 font-medium">{new Date(selectedError.created_at).toLocaleString()}</p>
              </div>

              {selectedError.error_stack && (
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Component Stack Trace</p>
                  <pre className="p-4 bg-gray-900 text-green-400 text-xs rounded-lg overflow-x-auto border border-gray-800 shadow-inner whitespace-pre-wrap">
                    {selectedError.error_stack}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminErrors;
