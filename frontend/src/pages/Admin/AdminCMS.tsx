import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { DataTable, type ColumnDef } from '../../components/admin/DataTable';
import { FileText, Plus, Edit, Trash2 } from 'lucide-react';
import { useConfirm } from '../../components/ConfirmDialog';
import { useToast } from '../../components/ToastContext';

const AdminCMS = () => {
    const confirm = useConfirm();
    const { showToast } = useToast();

  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);

  const fetchContent = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('cms_policies').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error("Error fetching cms_policies:", error);
      showToast('Error fetching policies', 'error');
    }
    if (data) setContent(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleSave = async () => {
    if (editForm.id) {
      await supabase.from('cms_policies').update({
        type: editForm.type,
        content: editForm.content,
        version: editForm.version,
        is_published: editForm.is_published,
        updated_at: new Date().toISOString()
      }).eq('id', editForm.id);
    } else {
      await supabase.from('cms_policies').insert([{
        type: editForm.type,
        content: editForm.content,
        version: editForm.version,
        is_published: editForm.is_published
      }]);
    }
    setIsEditing(false);
    fetchContent();
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({ title: 'Delete Policy', message: 'This policy version will be permanently removed.', confirmLabel: 'Delete', variant: 'danger' });
    if (!ok) return;
    await supabase.from('cms_policies').delete().eq('id', id);
    showToast('Policy deleted', 'success');
    fetchContent();
  };

  const columns: ColumnDef<any>[] = [
    {
      header: 'Type',
      accessorKey: 'type',
      cell: (row) => <span className="font-bold text-[13px] capitalize">{row.type}</span>
    },
    {
      header: 'Version',
      accessorKey: 'version',
      cell: (row) => <span className="text-[12px] font-mono text-[#8A8A8E]">v{row.version}</span>
    },
    {
      header: 'Last Updated',
      cell: (row) => <span className="text-[12px]">{new Date(row.updated_at).toLocaleDateString()}</span>
    },
    {
      header: 'Status',
      cell: (row) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.is_published ? 'bg-[#E5F9ED] text-[#34C759]' : 'bg-[#F2F2F7] text-[#8A8A8E]'}`}>
          {row.is_published ? 'Published' : 'Draft'}
        </span>
      )
    }
  ];

  const renderActions = (row: any) => (
    <div className="flex gap-2">
      <button onClick={() => { setEditForm(row); setIsEditing(true); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
        <Edit className="w-4 h-4" />
      </button>
      <button onClick={() => handleDelete(row.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="flex w-full h-full relative overflow-hidden bg-white">
      <div className={`flex-1 w-full p-4 flex flex-col bg-[#Ffffff] text-[#273a5a] overflow-hidden transition-all ${isEditing ? 'pr-[500px]' : ''}`}>
        <div className="mb-4 flex justify-between items-end shrink-0">
          <div>
            <h1 className="text-[16px] font-bold tracking-tight leading-tight flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#ef4523]" />
              Policy Management
            </h1>
            <p className="text-[11px] text-[#8A8A8E] mt-1">Manage Privacy Policy and Terms & Conditions versions.</p>
          </div>
          <button 
            onClick={() => { 
              const nextVersion = content.filter(c => c.type === 'privacy').length + 1;
              setEditForm({ type: 'privacy', content: '', version: nextVersion, is_published: false }); 
              setIsEditing(true); 
            }}
            className="flex items-center gap-1.5 h-7 px-3 bg-[#ef4523] hover:bg-[#ef4523] text-white rounded text-[11px] font-bold"
          >
            <Plus className="w-3.5 h-3.5" /> Add Version
          </button>
        </div>

        <div className="flex-1 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-full text-[12px]">Loading...</div>
          ) : (
            <DataTable data={content} columns={columns} actions={renderActions} />
          )}
        </div>
      </div>

      {/* Edit Drawer */}
      <div className={`fixed top-0 right-0 h-full w-[500px] bg-white shadow-[-4px_0_24px_rgba(0,0,0,0.1)] z-50 transform transition-transform duration-300 flex flex-col border-l border-[#E5E5EA] ${isEditing ? 'translate-x-0' : 'translate-x-full'}`}>
        {isEditing && editForm && (
          <div className="p-5 flex flex-col h-full">
            <h2 className="text-[16px] font-bold mb-4">{editForm.id ? 'Edit Policy Version' : 'New Policy Version'}</h2>
            
            <div className="space-y-4 flex-1 overflow-y-auto pr-2">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-[#8A8A8E] uppercase mb-1">Type</label>
                  <select value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value})} className="w-full border border-[#E5E5EA] rounded p-2 text-[12px] outline-none focus:border-[#ef4523]">
                    <option value="privacy">Privacy Policy</option>
                    <option value="terms">Terms & Conditions</option>
                  </select>
                </div>
                <div className="w-24">
                  <label className="block text-[10px] font-bold text-[#8A8A8E] uppercase mb-1">Version</label>
                  <input type="number" value={editForm.version} onChange={e => setEditForm({...editForm, version: parseInt(e.target.value) || 1})} className="w-full border border-[#E5E5EA] rounded p-2 text-[12px] outline-none focus:border-[#ef4523]" />
                </div>
              </div>
              <div className="flex-1 flex flex-col h-[calc(100%-100px)]">
                <label className="block text-[10px] font-bold text-[#8A8A8E] uppercase mb-1">Content (Markdown)</label>
                <textarea 
                  value={editForm.content} 
                  onChange={e => setEditForm({...editForm, content: e.target.value})} 
                  className="w-full flex-1 border border-[#E5E5EA] rounded p-3 text-[12px] font-mono outline-none focus:border-[#ef4523] resize-none"
                  placeholder="# Enter markdown content here..."
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" checked={editForm.is_published} onChange={e => setEditForm({...editForm, is_published: e.target.checked})} id="pub" className="accent-[#ef4523]" />
                <label htmlFor="pub" className="text-[12px] font-bold">Publish this version (Users must accept)</label>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-[#E5E5EA] mt-4">
              <button onClick={() => setIsEditing(false)} className="flex-1 h-8 border border-[#E5E5EA] rounded font-bold text-[11px] hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} className="flex-1 h-8 bg-[#ef4523] hover:bg-[#ef4523] text-white rounded font-bold text-[11px]">Save Policy</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCMS;
