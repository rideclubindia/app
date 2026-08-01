import React, { useState } from 'react';
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { SearchInput } from '../ui/SearchInput';

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchPlaceholder?: string;
  onRowClick?: (row: T) => void;
  actions?: (row: T) => React.ReactNode;
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  searchPlaceholder = 'Search...',
  onRowClick,
  actions
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Extremely basic filter (just checks all string values)
  const filteredData = data.filter(row => {
    if (!search) return true;
    return Object.values(row).some(val => 
      String(val).toLowerCase().includes(search.toLowerCase())
    );
  });

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize);

  const exportCSV = () => {
    // Simple CSV export
    const headers = columns.map(c => c.header).join(',');
    const rows = filteredData.map(row => 
      columns.map(col => {
        if (col.accessorKey) {
          const val = row[col.accessorKey];
          return `"${String(val).replace(/"/g, '""')}"`;
        }
        return '""';
      }).join(',')
    ).join('\n');
    
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl border border-[#E5E5EA] shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col w-full h-full overflow-hidden text-[#273a5a]">
      
      {/* Toolbar */}
      <div className="px-5 py-4 border-b border-[#E5E5EA] flex justify-between items-center bg-white z-10 shrink-0">
        <div className="w-[260px]">
          <SearchInput 
            variant="admin"
            placeholder={searchPlaceholder}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="h-8 px-3 bg-[#ef4523] text-white rounded text-[12px] font-semibold flex items-center gap-1.5 shadow-sm shadow-[#ef4523]/20 hover:bg-[#ef4523] transition-colors">
            Export
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Table Container (Scrollable) */}
      <div className="flex-1 overflow-x-auto px-5 hide-scrollbar">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="sticky top-0 bg-white z-10 pt-4">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className="pb-2 pt-4 text-[10px] font-semibold text-[#8A8A8E] uppercase tracking-wider border-b border-[#E5E5EA]">
                  {col.header}
                </th>
              ))}
              {actions && <th className="pb-2 pt-4 border-b border-[#E5E5EA]"></th>}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row) => (
              <tr 
                key={row.id} 
                onClick={() => onRowClick?.(row)}
                className={`border-b border-[#F2F4F7] last:border-0 ${onRowClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}`}
              >
                {columns.map((col, i) => (
                  <td key={i} className="py-3 text-[12px] text-[#273a5a] pr-4">
                    {col.cell ? col.cell(row) : (col.accessorKey ? String(row[col.accessorKey] || '') : '')}
                  </td>
                ))}
                {actions && (
                  <td className="py-3 text-right">
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))}
            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="py-8 text-center text-[#8A8A8E] text-[12px]">
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Pagination */}
      <div className="px-5 py-3 border-t border-[#E5E5EA] flex items-center justify-between bg-white shrink-0">
        <span className="text-[11px] font-semibold text-[#8A8A8E]">
          Showing {Math.min(filteredData.length, (page - 1) * pageSize + 1)} to {Math.min(filteredData.length, page * pageSize)} of {filteredData.length} entries
        </span>
        <div className="flex gap-1.5">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="w-7 h-7 flex items-center justify-center rounded border border-[#E5E5EA] disabled:opacity-50 hover:bg-gray-50 text-[#8A8A8E]"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button 
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            className="w-7 h-7 flex items-center justify-center rounded border border-[#E5E5EA] disabled:opacity-50 hover:bg-gray-50 text-[#8A8A8E]"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
}
