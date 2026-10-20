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

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

const STORAGE_CONFIG_KEY = 'change_supabase_config';

// Conexão oficial do projeto change-app (Região: sa-east-1 São Paulo) pré-configurada
const DEFAULT_SUPABASE_URL = 'https://wewjirbxwdwtighamkpt.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indld2ppcmJ4d2R3dGlnaGFta3B0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1MTEzMzksImV4cCI6MjEwODA4NzMzOX0.R1X5-kyoe1Yv6iQovXAqFterZitVSf85w8h44J3CzN8';

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
 * Busca a lista de todos os perfis cadastrados na nuvem (Aristeu, Vitória e Amigos)
 */
export const pullAllUserProfilesFromCloud = async (): Promise<UserProfile[]> => {
  const config = getSupabaseConfig();
  if (!config) return [];

  try {
    const res = await fetch(
      `${config.url}/rest/v1/change_user_data?select=user_id,email,name,password_hash,avatar_color,updated_at&order=name.asc`,
      {
        method: 'GET',
        headers: buildHeaders(config)
      }
    );

    if (!res.ok) return [];
    const rows = await res.json();
    if (!Array.isArray(rows)) return [];

    return rows.map((r: any) => ({
      id: r.user_id || `user-${r.email}`,
      name: r.name,
      email: r.email,
      password: r.password_hash || undefined,
      avatar_color: r.avatar_color || '#ffffff',
      created_at: r.updated_at || new Date().toISOString()
    }));
  } catch {
    return [];
  }
};

/**
 * Busca os dados completos de um usuário na nuvem pelo e-mail
 */
export const pullUserFromCloudByEmail = async (
  email: string
): Promise<CloudUserPayload | null> => {
  const config = getSupabaseConfig();
  if (!config) return null;

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const res = await fetch(
      `${config.url}/rest/v1/change_user_data?email=eq.${encodeURIComponent(normalizedEmail)}&select=*&limit=1`,
      {
        method: 'GET',
        headers: buildHeaders(config)
      }
    );

    if (!res.ok) return null;
    const rows = await res.json();
    if (Array.isArray(rows) && rows.length > 0) {
      return rows[0] as CloudUserPayload;
    }
    return null;
  } catch {
    return null;
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

  const payload: CloudUserPayload = {
    user_id: user.id,
    email: user.email.trim().toLowerCase(),
    name: user.name,
    password_hash: user.password || '',
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
    const res = await fetch(`${cleanUrl}/rest/v1/change_user_data?select=email&limit=1`, {
      method: 'GET',
      headers: buildHeaders({ url: cleanUrl, anonKey: config.anonKey.trim() })
    });

    if (res.ok) {
      return { ok: true, message: 'Conectado ao banco na nuvem (São Paulo sa-east-1) com sucesso!' };
    }
    return { ok: false, message: `Erro HTTP ${res.status}: Verifique a URL e a Anon Key.` };
  } catch {
    return { ok: false, message: 'Não foi possível conectar. Verifique sua conexão.' };
  }
};
