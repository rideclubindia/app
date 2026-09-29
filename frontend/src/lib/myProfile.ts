import { apiClient } from './apiClient';

export type MyProfile = Record<string, any> & { id: string; full_name: string | null; email: string | null; is_admin?: boolean };

let cached: Promise<MyProfile | null> | null = null;
let cachedFor: string | null = null;

// Own profile (including private fields) comes from the backend; the public key can't read it
export const getMyProfile = (fresh = false): Promise<MyProfile | null> => {
  const token = localStorage.getItem('rie_token');
  if (!token) return Promise.resolve(null);
  if (!cached || fresh || cachedFor !== token) {
    cachedFor = token;
    cached = apiClient.get('/api/v1/me/profile').then((r) => r.data as MyProfile).catch(() => { cached = null; return null; });
  }
  return cached;
};

export const updateMyProfile = async (patch: Record<string, any>): Promise<MyProfile> => {
  try {
    const { data } = await apiClient.patch('/api/v1/me/profile', patch);
    cached = Promise.resolve(data);
    return data;
  } catch (e: any) {
    throw new Error(e?.response?.data?.detail || 'Could not save. Check your connection and try again.');
  }
};

export const clearMyProfileCache = () => { cached = null; };

export const searchRiders = (q: string) =>
  apiClient.get('/api/v1/profiles/search', { params: { q } }).then((r) => r.data as { id: string; full_name: string; avatar_url: string | null }[]).catch(() => []);

export const adminProfiles = {
  list: (params: { ids?: string[]; email?: string; limit?: number } = {}) =>
    apiClient.get('/api/v1/admin/profiles', { params: { ...params, ids: params.ids?.join(',') || undefined } })
      .then((r) => ({ data: r.data as any[], error: null }))
      .catch((e) => ({ data: null as any[] | null, error: { message: e?.response?.data?.detail || e.message } })),
  update: (id: string, patch: Record<string, any>) =>
    apiClient.patch(`/api/v1/admin/profiles/${id}`, patch).then(() => ({ error: null }))
      .catch((e) => ({ error: { message: e?.response?.data?.detail || e.message } })),
  remove: (id: string) =>
    apiClient.delete(`/api/v1/admin/profiles/${id}`).then(() => ({ error: null }))
      .catch((e) => ({ error: { message: e?.response?.data?.detail || e.message } })),
};
