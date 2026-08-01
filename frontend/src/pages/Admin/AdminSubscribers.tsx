import React, { useEffect, useState } from 'react';
import { Mail, Trash2, Search, Download } from 'lucide-react';
import { DataTable, type ColumnDef } from '../../components/admin/DataTable';
import { useConfirm } from '../../components/ConfirmDialog';
import { useToast } from '../../components/ToastContext';
import type { Subscriber } from '../../services/apiClient';
import { getSubscribers, deleteSubscriber } from '../../services/apiClient';

const AdminSubscribers = () => {
  const confirm = useConfirm();
  const { showToast } = useToast();

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Unsubscribed'>('All');

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const data = await getSubscribers();
      setSubscribers(data);
    } catch (err: any) {
      console.error('Error fetching subscribers:', err);
      setErrorMsg(err.message || 'Failed to load subscribers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!await confirm({
      title: 'Delete Subscriber',
      message: 'Are you sure you want to delete this subscriber? This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger'
    })) return;

    try {
      await deleteSubscriber(id);
      showToast('Subscriber deleted successfully', 'success');
      setSubscribers(subscribers.filter(s => s.id !== id));
    } catch (err: any) {
      console.error('Error deleting subscriber:', err);
      showToast(err.message || 'Failed to delete subscriber', 'error');
    }
  };

  const exportToCSV = () => {
    if (filteredSubscribers.length === 0) return;
    
    const headers = ['ID', 'Email', 'Status', 'Source', 'Subscribed At'];
    const csvContent = [
      headers.join(','),
      ...filteredSubscribers.map(sub => [
        sub.id,
        sub.email,
        sub.status,
        sub.source,
        new Date(sub.created_at).toLocaleString()
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `early_access_subscribers_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSubscribers = subscribers.filter(sub => {
    const matchesSearch = sub.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns: ColumnDef<Subscriber>[] = [
    {
      header: 'Email',
      accessorKey: 'email',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <Mail size={16} className="text-blue-600 dark:text-blue-400" />
          </div>
          <span className="font-medium text-dark">{row.email}</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.status === 'Active' 
            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
        }`}>
          {row.status}
        </span>
      )
    },
    {
      header: 'Source',
      accessorKey: 'source',
      cell: (row) => <span className="text-muted">{row.source}</span>
    },
    {
      header: 'Subscribed At',
      accessorKey: 'created_at',
      cell: (row) => <span className="text-muted">{new Date(row.created_at).toLocaleString()}</span>
    },
    {
      header: 'Actions',
      accessorKey: 'id',
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <button 
            onClick={() => handleDelete(row.id)}
            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Delete Subscriber"
          >
            <Trash2 size={18} />
          </button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-dark mb-6">Early Access Subscribers</h1>
        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted">Loading subscribers...</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-dark mb-6">Early Access Subscribers</h1>
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl">
          {errorMsg}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">Early Access Subscribers</h1>
          <p className="text-muted mt-1">Manage users who subscribed for early access.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted">
            Total: <span className="font-bold text-dark">{filteredSubscribers.length}</span>
          </div>
          <button 
            onClick={exportToCSV}
            disabled={filteredSubscribers.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl text-dark hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-dark"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-dark appearance-none"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Unsubscribed">Unsubscribed</option>
        </select>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden">
        {filteredSubscribers.length > 0 ? (
          <DataTable data={filteredSubscribers} columns={columns} />
        ) : (
          <div className="p-8 text-center">
            <Mail size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-bold text-dark mb-2">No subscribers found</h3>
            <p className="text-muted">
              {searchQuery ? "Try adjusting your search filters." : "No one has subscribed yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSubscribers;
