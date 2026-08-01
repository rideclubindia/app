import React, { useEffect, useState } from 'react';
import { MessageSquare, Trash2, Search, Download, CheckCircle, Eye, Check, Mail } from 'lucide-react';
import { DataTable, type ColumnDef } from '../../components/admin/DataTable';
import { useConfirm } from '../../components/ConfirmDialog';
import { useToast } from '../../components/ToastContext';
import type { ContactMessage } from '../../services/apiClient';
import { getContactMessages, deleteContactMessage, updateContactMessageStatus } from '../../services/apiClient';

const SupportWebsiteContact = () => {
  const confirm = useConfirm();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'New' | 'Read' | 'Replied'>('All');
  
  const [viewingMessage, setViewingMessage] = useState<ContactMessage | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const data = await getContactMessages();
      setMessages(data);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setErrorMsg(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!await confirm({
      title: 'Delete Message',
      message: 'Are you sure you want to delete this message?',
      confirmLabel: 'Delete',
      variant: 'danger'
    })) return;

    try {
      await deleteContactMessage(id);
      showToast('Message deleted successfully', 'success');
      setMessages(messages.filter(m => m.id !== id));
      if (viewingMessage?.id === id) setViewingMessage(null);
    } catch (err: any) {
      console.error('Error deleting message:', err);
      showToast(err.message || 'Failed to delete message', 'error');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'New' | 'Read' | 'Replied') => {
    try {
      await updateContactMessageStatus(id, newStatus);
      setMessages(messages.map(m => m.id === id ? { ...m, status: newStatus } : m));
      if (viewingMessage?.id === id) {
        setViewingMessage({ ...viewingMessage, status: newStatus });
      }
    } catch (err: any) {
      console.error('Error updating status:', err);
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const exportToCSV = () => {
    if (filteredMessages.length === 0) return;
    
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Type', 'Message', 'Status', 'Date'];
    const csvContent = [
      headers.join(','),
      ...filteredMessages.map(m => [
        m.id,
        m.full_name,
        m.email,
        m.phone_number || '',
        m.inquiry_type,
        m.message.replace(/"/g, '""'),
        m.status,
        new Date(m.created_at).toLocaleString()
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `contact_messages_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredMessages = messages.filter(m => {
    const matchesSearch = 
      m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns: ColumnDef<ContactMessage>[] = [
    {
      header: 'Sender',
      accessorKey: 'full_name',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center font-bold text-indigo-700 dark:text-indigo-300">
            {row.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-dark">{row.full_name}</div>
            <div className="text-xs text-muted flex items-center gap-1">
              <Mail size={10} /> {row.email}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Type',
      accessorKey: 'inquiry_type',
      cell: (value) => (
        <span className="capitalize">{String(value).replace('-', ' ')}</span>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row) => {
        let badgeClass = 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
        if (row.status === 'New') badgeClass = 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
        if (row.status === 'Replied') badgeClass = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeClass}`}>{row.status}</span>;
      }
    },
    {
      header: 'Date',
      accessorKey: 'created_at',
      cell: (row) => <span className="text-muted">{new Date(row.created_at).toLocaleString()}</span>
    },
    {
      header: 'Actions',
      accessorKey: 'id',
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <button 
            onClick={() => {
              setViewingMessage(row);
              if (row.status === 'New') handleUpdateStatus(row.id, 'Read');
            }}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye size={18} />
          </button>
          <button 
            onClick={() => handleDelete(row.id)}
            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Delete Message"
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
        <h1 className="text-2xl font-bold text-dark mb-6">Contact Messages</h1>
        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">Contact Messages</h1>
          <p className="text-muted mt-1">Review and manage inquiries from the website.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={exportToCSV}
            disabled={filteredMessages.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl text-dark hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors disabled:opacity-50"
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
            placeholder="Search by name or email..."
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
          <option value="New">New</option>
          <option value="Read">Read</option>
          <option value="Replied">Replied</option>
        </select>
      </div>

      {errorMsg && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl">
          {errorMsg}
        </div>
      )}

      <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden">
        {filteredMessages.length > 0 ? (
          <DataTable data={filteredMessages} columns={columns} />
        ) : (
          <div className="p-8 text-center">
            <MessageSquare size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-bold text-dark mb-2">No messages found</h3>
            <p className="text-muted">
              {searchQuery ? "Try adjusting your search filters." : "You have no contact messages."}
            </p>
          </div>
        )}
      </div>

      {viewingMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-card w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-200 dark:border-dark-border flex justify-between items-center bg-gray-50 dark:bg-dark-hover">
              <h3 className="text-xl font-bold text-dark flex items-center gap-2">
                <MessageSquare className="text-primary" />
                Message Details
              </h3>
              <button 
                onClick={() => setViewingMessage(null)}
                className="text-gray-500 hover:text-dark transition-colors"
              >
                Close
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="text-xs text-muted uppercase tracking-wider font-semibold mb-1 block">From</label>
                  <div className="text-dark font-medium">{viewingMessage.full_name}</div>
                  <a href={`mailto:${viewingMessage.email}`} className="text-primary text-sm hover:underline">{viewingMessage.email}</a>
                </div>
                <div>
                  <label className="text-xs text-muted uppercase tracking-wider font-semibold mb-1 block">Date & Time</label>
                  <div className="text-dark">{new Date(viewingMessage.created_at).toLocaleString()}</div>
                </div>
                <div>
                  <label className="text-xs text-muted uppercase tracking-wider font-semibold mb-1 block">Phone</label>
                  <div className="text-dark">{viewingMessage.phone_number || 'N/A'}</div>
                </div>
                <div>
                  <label className="text-xs text-muted uppercase tracking-wider font-semibold mb-1 block">Inquiry Type</label>
                  <div className="text-dark capitalize">{viewingMessage.inquiry_type.replace('-', ' ')}</div>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="text-xs text-muted uppercase tracking-wider font-semibold mb-2 block">Message</label>
                <div className="bg-gray-50 dark:bg-dark-bg p-4 rounded-xl text-dark whitespace-pre-wrap border border-gray-100 dark:border-dark-border">
                  {viewingMessage.message}
                </div>
              </div>
              
              <div className="border-t border-gray-200 dark:border-dark-border pt-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold text-dark">Status:</label>
                  <select
                    value={viewingMessage.status}
                    onChange={(e) => handleUpdateStatus(viewingMessage.id, e.target.value as any)}
                    className="px-3 py-1.5 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="New">New</option>
                    <option value="Read">Read</option>
                    <option value="Replied">Replied</option>
                  </select>
                </div>
                
                <div className="flex gap-3">
                  <a 
                    href={`mailto:${viewingMessage.email}?subject=RE: Your Inquiry (${viewingMessage.inquiry_type})`}
                    onClick={() => handleUpdateStatus(viewingMessage.id, 'Replied')}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors font-medium"
                  >
                    <CheckCircle size={18} />
                    Reply via Email
                  </a>
                  <button 
                    onClick={() => handleDelete(viewingMessage.id)}
                    className="px-4 py-2 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportWebsiteContact;
