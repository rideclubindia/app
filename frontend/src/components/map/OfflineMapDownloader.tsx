import React, { useState } from 'react';
import { Download, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { downloadMapRegion } from '../../lib/offlineDownload';

interface OfflineMapDownloaderProps {
  currentLat: number;
  currentLng: number;
}

export const OfflineMapDownloader: React.FC<OfflineMapDownloaderProps> = ({ currentLat, currentLng }) => {
  const [status, setStatus] = useState<'idle' | 'downloading' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const handleDownload = async () => {
    try {
      setStatus('downloading');
      setProgress(0);
      setTotal(0);
      
      // 25 km radius = 50 × 50 km area; z14 is the style max, the map overzooms beyond it
      await downloadMapRegion(
        currentLat,
        currentLng,
        25,
        10,
        14,
        (dl, tot) => {
          setProgress(dl);
          setTotal(tot);
        }
      );
      setStatus('success');
    } catch (err: any) {
      console.error('Failed to download offline map', err);
      setStatus('error');
      setErrorMsg(err.message || 'An error occurred');
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
          <Download className="w-5 h-5 text-[#ef4523]" />
        </div>
        <div>
          <h3 className="text-gray-900 font-semibold text-[15px]">Offline map</h3>
          <p className="text-gray-500 text-[13px]">Download 50 km × 50 km around you</p>
        </div>
      </div>

      {status === 'idle' && (
        <button
          onClick={handleDownload}
          className="w-full mt-3 min-h-[48px] bg-gray-900 text-white rounded-xl font-semibold transition-all duration-200 active:scale-95"
        >
          Download
        </button>
      )}

      {status === 'downloading' && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Downloading...</span>
            <span>{Math.round((progress / Math.max(total, 1)) * 100)}% ({progress}/{total})</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#ef4523] transition-all duration-300"
              style={{ width: `${Math.max(5, (progress / Math.max(total, 1)) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="mt-4 bg-emerald-50 text-emerald-700 p-3 rounded-xl flex items-center gap-3 text-sm font-medium">
          <CheckCircle className="w-5 h-5" />
          Map saved for offline use!
        </div>
      )}

      {status === 'error' && (
        <div className="mt-4">
          <div className="bg-red-50 text-red-700 p-3 rounded-xl flex items-center gap-3 text-sm font-medium mb-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="truncate">{errorMsg}</span>
          </div>
          <button
            onClick={handleDownload}
            className="w-full min-h-[44px] bg-gray-900 text-white rounded-xl font-semibold transition-all duration-200"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};
