import { UserProfile } from '../types';

export interface SavedDeviceSession {
  userId: string;
  email: string;
  name: string;
  avatarColor?: string;
  isAdmin?: boolean;
  autoLogin: boolean;
  savedAt: number;
}

const STORAGE_KEY = 'change_saved_device_session';
const COOKIE_NAME = 'change_device_session';

/**
 * Lê cookie por nome
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
    return match ? decodeURIComponent(match[3]) : null;
  } catch {
    return null;
  }
}

/**
 * Grava cookie persistente (365 dias) compatível com iOS Safari e Web App standalone
 */
export function setCookie(name: string, value: string, days = 365): void {
  if (typeof document === 'undefined') return;
  try {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = 'expires=' + d.toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; ${expires}; path=/; SameSite=Lax`;
  } catch {
    // Ignore
  }
}

/**
 * Remove cookie persistente
 */
export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  try {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
  } catch {
    // Ignore
  }
}

/**
 * Recupera a sessão do dispositivo salva no localStorage ou cookies
 */
export function getSavedDeviceSession(): SavedDeviceSession | null {
  try {
    const rawLocal = localStorage.getItem(STORAGE_KEY);
    if (rawLocal) {
      const parsed = JSON.parse(rawLocal);
      if (parsed && parsed.userId) return parsed;
    }
  } catch {
    // Fallback to cookie
  }

  try {
    const rawCookie = getCookie(COOKIE_NAME);
    if (rawCookie) {
      const parsed = JSON.parse(rawCookie);
      if (parsed && parsed.userId) {
        // Restaura no localStorage também
        try {
          localStorage.setItem(STORAGE_KEY, rawCookie);
        } catch {
          // Ignore
        }
        return parsed;
      }
    }
  } catch {
    // Ignore
  }

  return null;
}

/**
 * Salva a sessão do usuário neste dispositivo para entrada automática contínua
 */
export function saveDeviceSession(user: UserProfile, autoLogin = true): void {
  try {
    const session: SavedDeviceSession = {
      userId: user.id,
      email: user.email,
      name: user.name,
      avatarColor: user.avatar_color,
      isAdmin: user.is_admin,
      autoLogin,
      savedAt: Date.now()
    };
    const jsonStr = JSON.stringify(session);
    localStorage.setItem(STORAGE_KEY, jsonStr);
    localStorage.setItem('change_auth_session_active', autoLogin ? 'true' : 'false');
    setCookie(COOKIE_NAME, jsonStr, 365);
  } catch {
    // Ignore
  }
}

/**
 * Limpa a sessão do dispositivo quando o usuário clica explicitamente em "Sair da Conta"
 */
export function clearDeviceSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('change_auth_session_active');
    deleteCookie(COOKIE_NAME);
  } catch {
    // Ignore
  }
}
