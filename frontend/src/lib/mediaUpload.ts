import { apiClient } from './apiClient';

export type UploadKind = 'avatar' | 'ride' | 'incident';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_INPUT_BYTES = 25 * 1024 * 1024;

export class UploadError extends Error {}

// Resize on the device before upload so phone photos (often 4-12 MB) become ~100-400 KB JPEGs
const compress = (file: File, maxSide: number, quality: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new UploadError('This device could not process the image.'));
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new UploadError('This device could not process the image.'))), 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new UploadError('That file is not a supported image.')); };
    img.src = url;
  });

// Uploads through the backend (service-role proxy), the only path the storage bucket accepts; returns the public URL
export async function uploadImage(file: File, kind: UploadKind): Promise<string> {
  if (!file.type.startsWith('image/') || (file.type && !ACCEPTED.includes(file.type) && !file.type.startsWith('image/'))) {
    throw new UploadError('Please choose a JPG, PNG or WebP image.');
  }
  if (file.size > MAX_INPUT_BYTES) throw new UploadError('That image is larger than 25 MB.');
  if (!navigator.onLine) throw new UploadError('No internet connection. Try again when you are online.');

  const blob = await compress(file, kind === 'avatar' ? 512 : 1600, kind === 'avatar' ? 0.85 : 0.82);
  const form = new FormData();
  form.append('file', new File([blob], `${kind}.jpg`, { type: 'image/jpeg' }));
  try {
    const res = await apiClient.post(`/api/pins/photo-upload?kind=${kind}`, form, { headers: { 'Content-Type': undefined }, timeout: 45000 });
    const url = res.data?.url;
    if (!url) throw new UploadError('Upload finished without a photo address.');
    return url;
  } catch (e: any) {
    if (e instanceof UploadError) throw e;
    const detail = e?.response?.data?.detail;
    if (e?.response?.status === 401) throw new UploadError('Your session expired. Please log in again.');
    throw new UploadError(detail || 'Upload failed. Check your connection and try again.');
  }
}
