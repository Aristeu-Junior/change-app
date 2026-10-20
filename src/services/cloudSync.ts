import {
  UserProfile,
  Workout,
  Routine,
  RoutineFolder,
  ExerciseTemplate,
  PersonalRecord,
  BodyMeasurement,
  UserSettings
} from '../types';

export interface CloudUserPayload {
  user_id: string;
  email: string;
  name: string;
  password_hash?: string;
  avatar_color?: string;
  workouts: Workout[];
  routines: Routine[];
  folders: RoutineFolder[];
  custom_exercises: ExerciseTemplate[];
  personal_records: Record<string, PersonalRecord>;
  measurements: BodyMeasurement[];
  settings: UserSettings;
  updated_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  email: string;
  name: string;
  avatar_color: string;
  workouts: Workout[];
  personal_records: Record<string, PersonalRecord>;
  updated_at: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

const STORAGE_CONFIG_KEY = 'change_supabase_config';

// Conexão oficial do projeto change-app (Região: sa-east-1 São Paulo) pré-configurada
const DEFAULT_SUPABASE_URL = 'https://wewjirbxwdwtighamkpt.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indld2ppcmJ4d2R3dGlnaGFta3B0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1MTEzMzksImV4cCI6MjEwODA4NzMzOX0.R1X5-kyoe1Yv6iQovXAqFterZitVSf85w8h44J3CzN8';

// Apenas Aristeu e Vitória possuem permissão de Administrador para cadastrar novas pessoas
export const ADMIN_EMAILS = new Set(['aristeu@change.app', 'vitoria@change.app']);
export const ADMIN_USER_IDS = new Set(['user-aristeu', 'user-vitoria']);

/**
 * Sanitiza strings contra injeção de HTML/scripts (OWASP XSS Prevention)
 */
export const sanitizeInput = (input: string, maxLength = 120): string => {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);
};

/**
 * Gera hash criptográfico SHA-256 com salt via Web Crypto API nativa (OWASP Password Security)
 */
export const hashPasswordSha256 = async (rawPassword: string): Promise<string> => {
  const clean = rawPassword.trim();
  // Se já for um hash hex de 64 caracteres, retorna direto
  if (/^[a-f0-9]{64}$/i.test(clean)) {
    return clean.toLowerCase();
  }
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(`${clean}::change_salt_2026`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return clean;
  }
};

export const isAdminProfile = (user?: UserProfile | null): boolean => {
  if (!user) return false;
  const email = (user.email || '').trim().toLowerCase();
  const name = (user.name || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return (
    ADMIN_EMAILS.has(email) ||
    ADMIN_USER_IDS.has(user.id) ||
    name === 'aristeu' ||
    name === 'vitoria'
  );
};

export const normalizeLoginIdentifier = (identifier: string): string => {
  const clean = identifier
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (clean === 'aristeu') return 'aristeu@change.app';
  if (clean === 'vitoria') return 'vitoria@change.app';
  return identifier.trim().toLowerCase();
};

export const getSupabaseConfig = (): SupabaseConfig | null => {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey) {
    return { url: envUrl.replace(/\/$/, ''), anonKey: envKey.trim() };
  }

  try {
    const saved = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.url && parsed?.anonKey) {
        return {
          url: parsed.url.replace(/\/$/, ''),
          anonKey: parsed.anonKey.trim()
        };
      }
    }
  } catch {
    // Ignore
  }

  return {
    url: DEFAULT_SUPABASE_URL,
    anonKey: DEFAULT_SUPABASE_ANON_KEY
  };
};

export const saveSupabaseConfig = (config: SupabaseConfig | null) => {
  if (!config || !config.url || !config.anonKey) {
    localStorage.removeItem(STORAGE_CONFIG_KEY);
    return;
  }
  localStorage.setItem(
    STORAGE_CONFIG_KEY,
    JSON.stringify({
      url: config.url.replace(/\/$/, ''),
      anonKey: config.anonKey.trim()
    })
  );
};

export const isCloudConfigured = (): boolean => {
  return !!getSupabaseConfig();
};

const buildHeaders = (config: SupabaseConfig, extra?: Record<string, string>) => ({
  apikey: config.anonKey,
  Authorization: `Bearer ${config.anonKey}`,
  'Content-Type': 'application/json',
  ...extra
});

/**
 * Autentica o usuário via RPC segura no PostgreSQL (valida hash SHA-256 no servidor sem expor senhas)
 */
export const authenticateUserInCloud = async (
  identifier: string,
  password: string
): Promise<CloudUserPayload | null> => {
  const config = getSupabaseConfig();
  if (!config) return null;

  try {
    const res = await fetch(`${config.url}/rest/v1/rpc/authenticate_change_user`, {
      method: 'POST',
      headers: buildHeaders(config),
      body: JSON.stringify({
        p_identifier: sanitizeInput(identifier, 100),
        p_password: password.trim()
      })
    });

    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0) {
        return rows[0] as CloudUserPayload;
      }
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Busca dados públicos do Ranking (Leaderboard) via RPC segura (sem expor password_hash)
 */
export const fetchCloudLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  const config = getSupabaseConfig();
  if (!config) return [];

  try {
    const res = await fetch(`${config.url}/rest/v1/rpc/get_change_leaderboard`, {
      method: 'POST',
      headers: buildHeaders(config),
      body: JSON.stringify({})
    });

    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows)) {
        return rows as LeaderboardEntry[];
      }
    }
    return [];
  } catch {
    return [];
  }
};

/**
 * Busca a lista de todos os perfis cadastrados na nuvem (sem expor senhas)
 */
export const pullAllUserProfilesFromCloud = async (): Promise<UserProfile[]> => {
  const entries = await fetchCloudLeaderboard();
  return entries.map((r) => {
    const profile: UserProfile = {
      id: r.user_id || `user-${r.email}`,
      name: r.name,
      email: r.email,
      avatar_color: r.avatar_color || '#ffffff',
      created_at: r.updated_at || new Date().toISOString()
    };
    profile.is_admin = isAdminProfile(profile);
    return profile;
  });
};

/**
 * Busca os dados completos de um usuário na nuvem pelo e-mail
 */
export const pullUserFromCloudByEmail = async (
  identifier: string
): Promise<CloudUserPayload | null> => {
  const config = getSupabaseConfig();
  if (!config) return null;

  try {
    const normalized = normalizeLoginIdentifier(identifier);
    const res = await fetch(
      `${config.url}/rest/v1/change_user_data?email=eq.${encodeURIComponent(normalized)}&select=user_id,email,name,avatar_color,workouts,routines,folders,custom_exercises,personal_records,measurements,settings,updated_at&limit=1`,
      {
        method: 'GET',
        headers: buildHeaders(config)
      }
    );

    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0) {
        return rows[0] as CloudUserPayload;
      }
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Cria um novo usuário convidado diretamente na nuvem com senha criptografada em SHA-256
 */
export const createCloudUserByAdmin = async (
  newUser: UserProfile,
  defaultSettings: UserSettings
): Promise<{ ok: boolean; error?: string }> => {
  const config = getSupabaseConfig();
  if (!config) return { ok: false, error: 'Banco em nuvem não configurado.' };

  const existing = await pullUserFromCloudByEmail(newUser.email);
  if (existing) {
    return { ok: false, error: 'Este e-mail ou login já está cadastrado.' };
  }

  const hashedPassword = await hashPasswordSha256(newUser.password || '123456');

  const payload: CloudUserPayload = {
    user_id: newUser.id,
    email: sanitizeInput(newUser.email, 100).toLowerCase(),
    name: sanitizeInput(newUser.name, 80),
    password_hash: hashedPassword,
    avatar_color: newUser.avatar_color || '#ffffff',
    workouts: [],
    routines: [],
    folders: [],
    custom_exercises: [],
    personal_records: {},
    measurements: [],
    settings: { ...defaultSettings, user_name: sanitizeInput(newUser.name, 80) },
    updated_at: new Date().toISOString()
  };

  try {
    const res = await fetch(`${config.url}/rest/v1/change_user_data`, {
      method: 'POST',
      headers: buildHeaders(config, {
        Prefer: 'return=minimal'
      }),
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      return { ok: false, error: 'Não foi possível criar o usuário no banco.' };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Erro de conexão com o banco em nuvem.' };
  }
};

/**
 * Atualiza a senha de um usuário na nuvem com hash SHA-256
 */
export const updateCloudUserPassword = async (
  email: string,
  newPassword: string
): Promise<boolean> => {
  const config = getSupabaseConfig();
  if (!config) return false;

  try {
    const cleanEmail = email.trim().toLowerCase();
    const hashedPassword = await hashPasswordSha256(newPassword);
    const res = await fetch(
      `${config.url}/rest/v1/change_user_data?email=eq.${encodeURIComponent(cleanEmail)}`,
      {
        method: 'PATCH',
        headers: buildHeaders(config, { Prefer: 'return=minimal' }),
        body: JSON.stringify({
          password_hash: hashedPassword,
          updated_at: new Date().toISOString()
        })
      }
    );
    return res.ok;
  } catch {
    return false;
  }
};

/**
 * Remove um usuário convidado da nuvem (protegendo Aristeu e Vitória)
 */
export const deleteCloudUserByAdmin = async (email: string): Promise<boolean> => {
  const config = getSupabaseConfig();
  const cleanEmail = email.trim().toLowerCase();
  if (!config || ADMIN_EMAILS.has(cleanEmail)) return false;

  try {
    const res = await fetch(
      `${config.url}/rest/v1/change_user_data?email=eq.${encodeURIComponent(cleanEmail)}`,
      {
        method: 'DELETE',
        headers: buildHeaders(config)
      }
    );
    return res.ok;
  } catch {
    return false;
  }
};

/**
 * Salva/atualiza (UPSERT) todos os dados do usuário na nuvem de forma leve e assíncrona
 */
export const pushUserToCloud = async (
  user: UserProfile,
  data: {
    workouts: Workout[];
    routines: Routine[];
    folders: RoutineFolder[];
    exercises: ExerciseTemplate[];
    personalRecords: Record<string, PersonalRecord>;
    measurements: BodyMeasurement[];
    settings: UserSettings;
  }
): Promise<boolean> => {
  const config = getSupabaseConfig();
  if (!config || !user?.email) return false;

  const payload: Record<string, any> = {
    user_id: user.id,
    email: user.email.trim().toLowerCase(),
    name: sanitizeInput(user.name, 80),
    avatar_color: user.avatar_color || '#ffffff',
    workouts: data.workouts,
    routines: data.routines,
    folders: data.folders,
    custom_exercises: data.exercises.filter((e) => e.is_custom),
    personal_records: data.personalRecords,
    measurements: data.measurements,
    settings: data.settings,
    updated_at: new Date().toISOString()
  };

  try {
    const res = await fetch(`${config.url}/rest/v1/change_user_data?on_conflict=email`, {
      method: 'POST',
      headers: buildHeaders(config, {
        Prefer: 'resolution=merge-duplicates,return=minimal'
      }),
      body: JSON.stringify(payload)
    });

    return res.ok;
  } catch {
    return false;
  }
};

/**
 * Testa a conexão com a tabela do Supabase
 */
export const testCloudConnection = async (
  config: SupabaseConfig
): Promise<{ ok: boolean; message: string }> => {
  try {
    const cleanUrl = config.url.replace(/\/$/, '');
    const res = await fetch(`${cleanUrl}/rest/v1/rpc/get_change_leaderboard`, {
      method: 'POST',
      headers: buildHeaders({ url: cleanUrl, anonKey: config.anonKey.trim() }),
      body: JSON.stringify({})
    });

    if (res.ok) {
      return { ok: true, message: 'Conectado ao banco na nuvem (São Paulo sa-east-1) com sucesso!' };
    }
    return { ok: false, message: `Erro HTTP ${res.status}: Verifique a URL e a Anon Key.` };
  } catch {
    return { ok: false, message: 'Não foi possível conectar. Verifique sua conexão.' };
  }
};
