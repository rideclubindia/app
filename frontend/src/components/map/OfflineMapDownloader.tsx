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
      
      // Radius of 5km = ~10x10km bounding box
      await downloadMapRegion(
        currentLat, 
        currentLng, 
        5, 
        10, 
        15, 
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
    <div className="bg-[#19273f]/90 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-2xl">
      <div className="flex items-center gap-4 mb-3">
        <div className="w-10 h-10 rounded-xl bg-[#ef4523]/20 flex items-center justify-center shrink-0">
          <Download className="w-5 h-5 text-[#ef4523]" />
        </div>
        <div>
          <h3 className="text-white font-semibold tracking-wide">Offline Region</h3>
          <p className="text-white/60 text-sm">Download 10km x 10km area</p>
        </div>
      </div>

      {status === 'idle' && (
        <button
          onClick={handleDownload}
          className="w-full mt-4 bg-white/10 hover:bg-white/15 text-white py-3 rounded-xl font-medium transition-all duration-200 active:scale-95"
        >
          Start Download
        </button>
      )}

      {status === 'downloading' && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-white/80 mb-2">
            <span>Downloading...</span>
            <span>{Math.round((progress / Math.max(total, 1)) * 100)}% ({progress}/{total})</span>
          </div>
          <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#ef4523] transition-all duration-300"
              style={{ width: `${Math.max(5, (progress / Math.max(total, 1)) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="mt-4 bg-green-500/20 text-green-400 p-3 rounded-xl flex items-center gap-3 text-sm font-medium">
          <CheckCircle className="w-5 h-5" />
          Map saved for offline use!
        </div>
      )}

      {status === 'error' && (
        <div className="mt-4">
          <div className="bg-red-500/20 text-red-400 p-3 rounded-xl flex items-center gap-3 text-sm font-medium mb-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="truncate">{errorMsg}</span>
          </div>
          <button
            onClick={handleDownload}
            className="w-full bg-white/10 hover:bg-white/15 text-white py-2 rounded-xl font-medium transition-all duration-200"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};
