export const getDeterministicUuid = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hex = Math.abs(hash).toString(16).padStart(12, '0');
  return `00000000-0000-0000-0000-${hex}`;
};

export const formatRelativeTime = (createdAt: string) => {
  const diffMinutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
  return `${Math.floor(diffMinutes / 1440)}d ago`;
};

export const isWithinHours = (createdAt: string, hours: number) => {
  if (!createdAt) return false;
  const diffMs = Date.now() - new Date(createdAt).getTime();
  return diffMs < hours * 60 * 60 * 1000;
};
