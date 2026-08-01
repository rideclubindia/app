import React, { useState, useEffect } from 'react';
import { X, Clock, AlertTriangle, Car, Ban, Waves, Shield, Hammer, MoreHorizontal } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getDeterministicUuid, isWithinHours, formatRelativeTime } from '../lib/user';

import { useIncidentCategories, incidentIconMap } from '../hooks/useIncidentCategories';
import { useToast } from './ToastContext';

export const timeAgo = (dateStr: string) => {
  const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 60000);
  if (diff < 1) return 'just now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff/60)}h ago`;
  return `${Math.floor(diff/1440)}d ago`;
};


interface IncidentDrawerProps {
  incident: any;
  onClose: () => void;
}

export const IncidentDrawer: React.FC<IncidentDrawerProps> = ({ incident, onClose }) => {
    const { showToast } = useToast();
  const [incidentStats, setIncidentStats] = useState({ confirms: 0, falses: 0, comments: 0 });
  const [isVoting, setIsVoting] = useState(false);
  const [userVote, setUserVote] = useState<'confirm' | 'fake' | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const { categories: reportTypes } = useIncidentCategories();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setCurrentUserId(u ? u.uid : null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!incident) return;
    let isMounted = true;

    const fetchStats = async () => {
      try {
        const [{ data: confData }, { count: commentCount }] = await Promise.all([
          supabase.from('confirmations').select('is_false, user_id').eq('pin_id', incident.id),
          supabase.from('comments').select('*', { count: 'exact', head: true }).eq('pin_id', incident.id)
        ] as any);

        if (isMounted) {
          let confirms = 0;
          let falses = 0;

          if (confData) {
            confData.forEach((c: any) => {
              if (c.is_false === true) falses++;
              else if (c.is_false === false) confirms++;

              if (currentUserId && c.user_id === getDeterministicUuid(currentUserId)) {
                setUserVote(c.is_false ? 'fake' : 'confirm');
              }
            });
          }

          // reactions removed
          setIncidentStats({ confirms, falses, comments: commentCount || 0 });
        }
      } catch (e) {
        console.error('Failed to fetch stats', e);
      }
    };

    fetchStats();
    return () => { isMounted = false; };
  }, [incident, currentUserId]);

  const fetchComments = async () => {
    if (!incident) return;
    try {
      const { data } = await supabase.from('comments').select('id, user_id, content, created_at').eq('pin_id', incident.id).order('created_at', { ascending: false }).limit(20);
      if (data) setComments(data);
    } catch (error) {
      console.error('Failed to fetch comments', error);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [incident]);

  const handleAddComment = async () => {
    if (!incident || !currentUserId || !commentText.trim()) return;
    try {
      const { error, data } = await supabase.from('comments').insert({
        pin_id: incident.id,
        user_id: getDeterministicUuid(currentUserId),
        content: commentText.trim()
      }).select().single();

      if (error) throw error;
      setComments(prev => [data, ...prev]);
      setCommentText('');
      setIncidentStats(prev => ({ ...prev, comments: prev.comments + 1 }));
    } catch (err) {
      console.error('Failed to add comment', err);
      showToast('Unable to post comment. Please try again.', 'error');
    }
  };

  // reactions removed

  const handleVote = async (isFalse: boolean) => {
    if (!incident || isVoting || !currentUserId) return;
    if (userVote !== null) return;
    if (isFalse && !isWithinHours(incident.created_at, 1)) {
      showToast('Fake reporting period has expired.', 'info');
      return;
    }

    setIsVoting(true);
    try {
      const { error } = await supabase.from('confirmations').insert({
        pin_id: incident.id,
        is_false: isFalse,
        user_id: getDeterministicUuid(currentUserId)
      });
      if (error) {
        console.error('Failed to cast vote:', error);
        showToast('Could not cast vote. You may have already voted on this incident.', 'error');
      } else {
        setUserVote(isFalse ? 'fake' : 'confirm');
        setIncidentStats(prev => ({
          ...prev,
          confirms: isFalse ? prev.confirms : prev.confirms + 1,
          falses: isFalse ? prev.falses + 1 : prev.falses
        }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsVoting(false);
    }
  };

  if (!incident) return null;

  return (
    <div className="absolute bottom-0 left-0 w-full landscape:h-[100dvh] landscape:max-h-full landscape:w-[450px] landscape:left-auto landscape:right-0 landscape:rounded-t-none landscape:rounded-l-lg landscape:shadow-[-20px_0_60px_rgba(0,0,0,0.15)] bg-gradient-to-br from-orange-50 to-white rounded-t-lg shadow-[0_-20px_60px_rgba(0,0,0,0.15)] z-50 flex flex-col animate-in slide-in-from-bottom landscape:slide-in-from-right duration-300 max-h-[85%] pb-[18px]">
      <div className="w-full flex justify-center pt-3 pb-2">
        <div className="w-[40px] h-[4px] bg-gray-200 rounded-full"></div>
      </div>
      <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500">
        <X className="w-5 h-5" />
      </button>

      <div className="overflow-y-auto px-6 py-2 flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-lg flex items-center justify-center shadow-sm ${
            reportTypes.find(t => t.id === incident.category)?.bg || 'bg-gray-100'
          }`}>
            {(() => {
              const typeConfig = reportTypes.find(t => t.id === incident.category) || reportTypes[7];
              const IconComponent = typeConfig ? incidentIconMap[typeConfig.iconName] : MoreHorizontal;
              return <IconComponent className={`w-8 h-8 ${reportTypes.find(t => t.id === incident.category)?.color || 'text-gray-600'}`} />;
            })()}
          </div>
          <div className="flex-1">
            <h2 className="text-[22px] font-bold text-dark leading-tight">{incident.category}</h2>
            <div className="flex items-center gap-1.5 mt-2 text-gray-400 text-[13px] font-medium">
              <Clock className="w-4 h-4" /> Reported {timeAgo(incident.created_at)}
            </div>
          </div>
        </div>

        {incident.description && (
          <p className="text-[15px] text-dark font-medium leading-snug">
            {incident.description}
          </p>
        )}

        {incident.photo_url && (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {incident.photo_url.split(',').map((url: string, i: number) => (
              <img key={i} src={url.trim()} alt="Incident" className="w-[140px] h-[100px] rounded-lg object-cover flex-shrink-0 border border-gray-100" />
            ))}
          </div>
        )}

        <div className="mt-2 border-t border-gray-100 pt-4">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full font-bold text-[13px]">
              👍 {incidentStats.confirms} Confirms
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 rounded-full font-bold text-[13px]">
              👎 {incidentStats.falses} Fake Reports
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-bold text-[13px]">
              💬 {incidentStats.comments} Comments
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {userVote !== null ? (
              <div className={`col-span-2 h-[48px] rounded-lg flex items-center justify-center font-bold text-[15px] ${
                userVote === 'confirm'
                  ? 'bg-green-100 text-green-700 border-2 border-green-300'
                  : 'bg-red-100 text-red-700 border-2 border-red-300'
              }`}>
                ✓ You {userVote === 'confirm' ? 'confirmed' : 'reported fake'}
              </div>
            ) : (
              <>
                <button
                  onClick={() => handleVote(false)}
                  disabled={isVoting || !currentUserId}
                  className="h-[48px] rounded-lg bg-[#10B981] hover:bg-[#059669] text-white font-bold w-full shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  Confirm
                </button>
                <button
                  onClick={() => handleVote(true)}
                  disabled={isVoting || !currentUserId || !isWithinHours(incident.created_at, 1)}
                  className="h-[48px] rounded-lg bg-white border-2 border-red-500 text-red-500 font-bold w-full hover:bg-red-50 transition-all active:scale-95 disabled:opacity-50"
                >
                  Report False
                </button>
              </>
            )}
          </div>

          {!isWithinHours(incident.created_at, 1) && userVote === null && (
            <div className="mt-3 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-900 text-[13px] font-medium">
              Fake reporting period has expired.
            </div>
          )}

          {/* Reactions removed */}

          <div className="mt-4 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[15px] font-bold text-dark">Comments</h3>
              <span className="text-[12px] text-[#8A8A8E]">{comments.length} latest</span>
            </div>

            <div className="space-y-3">
              {comments.slice(0, 4).map(comment => (
                <div key={comment.id} className="bg-[#F9FAFB] rounded-2xl p-3">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="text-[12px] font-bold text-dark">{comment.user_id ? comment.user_id.substring(0, 8) : 'Anonymous'}</span>
                    <span className="text-[11px] text-[#8A8A8E]">{formatRelativeTime(comment.created_at)}</span>
                  </div>
                  <p className="text-[14px] text-[#374151] leading-snug">{comment.content}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-2">
              <textarea
                rows={3}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="w-full rounded-2xl border border-gray-200 p-3 text-[14px] resize-none focus:border-[#ef4523] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddComment}
                disabled={!currentUserId || !commentText.trim()}
                className="w-full py-3 rounded-2xl bg-[#ef4523] text-white font-bold hover:bg-[#ef4523] transition-colors disabled:opacity-50"
              >
                Post Comment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
