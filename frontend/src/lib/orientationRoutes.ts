// Single source of truth for which screens are allowed to lay out in
// landscape. Everything else renders its portrait layout regardless of the
// actual window/device shape — locking the OS rotation isn't enough on its
// own, because CSS `landscape:` variants react to real aspect ratio (a
// resized desktop window or DevTools frame included), not to the lock.
const LANDSCAPE_ALLOWED_PREFIXES = [
  '/ride-plus/live', // Ride screen
  '/navigation',     // Turn-by-turn Navigation screen
];

export const isLandscapeAllowedRoute = (pathname: string): boolean =>
  LANDSCAPE_ALLOWED_PREFIXES.some(prefix => pathname.startsWith(prefix));
