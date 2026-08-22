/**
 * Safe Base64 / Unicode encoding and decoding utility
 * Prevents "The string to be encoded contains characters outside of the Latin1 range" errors.
 */

export function safeUtf8ToBase64(str: string): string {
  if (!str) return '';
  try {
    if (typeof window !== 'undefined' && typeof btoa === 'function') {
      return btoa(
        encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function toSolidBytes(match, p1) {
          return String.fromCharCode(parseInt(p1, 16));
        })
      );
    }
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(str, 'utf-8').toString('base64');
    }
  } catch (e) {
    console.warn('safeUtf8ToBase64 fallback failed:', e);
  }
  return '';
}

export function safeBase64ToUtf8(base64Str: string): string {
  if (!base64Str) return '';
  try {
    if (typeof window !== 'undefined' && typeof atob === 'function') {
      return decodeURIComponent(
        Array.prototype.map
          .call(atob(base64Str), function (c: string) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );
    }
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(base64Str, 'base64').toString('utf-8');
    }
  } catch (e) {
    console.warn('safeBase64ToUtf8 fallback failed:', e);
  }
  return '';
}
