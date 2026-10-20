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
import { verifyTotpCode } from '../utils/totp';

export interface CloudUserPayload {
  user_id: string;
  email: string;
  name: string;
  password_hash?: string;
  totp_secret?: string | null;
  totp_enabled?: boolean;
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
export const ADMIN_EMAILS = new Set([
  'aristeu2304@gmail.com',
  'aristeu@change.app',
  'vitoria@change.app'
]);
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
  if (clean === 'aristeu' || clean === 'aristeu@change.app') return 'aristeu2304@gmail.com';
  if (clean === 'vitoria') return 'vitoria@change.app';
  return identifier.trim().toLowerCase();
};

export const getSupabaseConfig = (): SupabaseConfig | null => {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  try {
    localStorage.removeItem(STORAGE_CONFIG_KEY);
  } catch {
    // Ignore
  }

  if (envUrl && envKey) {
    return { url: envUrl.replace(/\/$/, ''), anonKey: envKey.trim() };
  }

  return {
    url: DEFAULT_SUPABASE_URL,
    anonKey: DEFAULT_SUPABASE_ANON_KEY
  };
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

export const getCleanAppRedirectUrl = (): string => {
  if (typeof window === 'undefined') return 'https://aristeu-junior.github.io/change-app/';
  return `${window.location.origin}${window.location.pathname}`;
};

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
 * Busca os dados completos de um usuário na nuvem pelo e-mail ou user_id
 */
export const pullUserFromCloudByEmail = async (
  identifier: string,
  userId?: string
): Promise<CloudUserPayload | null> => {
  const config = getSupabaseConfig();
  if (!config) return null;

  try {
    const normalized = normalizeLoginIdentifier(identifier);
    const filter = userId
      ? `or=(email.eq.${encodeURIComponent(normalized)},user_id.eq.${encodeURIComponent(userId)})`
      : `email=eq.${encodeURIComponent(normalized)}`;

    const res = await fetch(
      `${config.url}/rest/v1/change_user_data?${filter}&select=user_id,email,name,totp_enabled,totp_secret,avatar_color,workouts,routines,folders,custom_exercises,personal_records,measurements,settings,updated_at&limit=1`,
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
 * Atualiza Nome, E-mail (ex: Vitória cadastrar o Gmail dela) e opcionalmente a Senha do usuário logado
 */
export const updateCloudUserCredentials = async (
  userId: string,
  newName: string,
  newEmail: string,
  newPassword?: string
): Promise<{ ok: boolean; email?: string; name?: string; error?: string }> => {
  const config = getSupabaseConfig();
  if (!config) return { ok: false, error: 'Sem conexão com a nuvem.' };

  try {
    const hashedPassword =
      newPassword && newPassword.trim().length > 0
        ? await hashPasswordSha256(newPassword.trim())
        : null;

    const res = await fetch(`${config.url}/rest/v1/rpc/update_change_user_credentials`, {
      method: 'POST',
      headers: buildHeaders(config),
      body: JSON.stringify({
        p_user_id: userId,
        p_new_name: sanitizeInput(newName, 80),
        p_new_email: sanitizeInput(newEmail, 100).toLowerCase(),
        p_new_password_hash: hashedPassword
      })
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }
    return { ok: false, error: 'Não foi possível salvar os novos dados.' };
  } catch {
    return { ok: false, error: 'Erro de conexão ao atualizar dados.' };
  }
};

/**
 * Configura (ativa ou desativa) Autenticação de 2 Fatores (2FA TOTP) para o usuário
 */
export const configureCloudUserTotp = async (
  userId: string,
  totpSecret: string | null,
  enable: boolean
): Promise<boolean> => {
  const config = getSupabaseConfig();
  if (!config) return false;

  try {
    const res = await fetch(`${config.url}/rest/v1/rpc/configure_change_user_totp`, {
      method: 'POST',
      headers: buildHeaders(config),
      body: JSON.stringify({
        p_user_id: userId,
        p_totp_secret: totpSecret,
        p_enable: enable
      })
    });
    return res.ok;
  } catch {
    return false;
  }
};

/**
 * Dispara o envio de e-mail real de recuperação de senha ("Esqueci minha senha")
 */
export const requestPasswordRecoveryEmail = async (
  identifier: string
): Promise<{
  ok: boolean;
  email?: string;
  totp_enabled?: boolean;
  error?: string;
}> => {
  const config = getSupabaseConfig();
  if (!config) return { ok: false, error: 'Banco em nuvem não configurado.' };

  try {
    // 1. Verifica se a conta existe e sincroniza com auth.users
    const prepRes = await fetch(`${config.url}/rest/v1/rpc/prepare_change_password_recovery`, {
      method: 'POST',
      headers: buildHeaders(config),
      body: JSON.stringify({
        p_identifier: sanitizeInput(identifier, 100)
      })
    });

    if (!prepRes.ok) {
      return { ok: false, error: 'Erro ao verificar o cadastro informado.' };
    }

    const prepData = await prepRes.json();
    if (!prepData?.ok || !prepData?.email) {
      return {
        ok: false,
        totp_enabled: prepData?.totp_enabled,
        error: prepData?.error || 'E-mail não encontrado.'
      };
    }

    const targetEmail = prepData.email;
    const redirectUrl = getCleanAppRedirectUrl();

    // 2. Dispara o e-mail de recuperação pelo Supabase Auth
    const recoverRes = await fetch(
      `${config.url}/auth/v1/recover?redirect_to=${encodeURIComponent(redirectUrl)}`,
      {
        method: 'POST',
        headers: buildHeaders(config),
        body: JSON.stringify({
          email: targetEmail
        })
      }
    );

    if (recoverRes.ok) {
      return {
        ok: true,
        email: targetEmail,
        totp_enabled: prepData.totp_enabled
      };
    }

    // Fallback: dispara Magic Link OTP caso o endpoint recover esteja em cooldown
    const otpRes = await fetch(
      `${config.url}/auth/v1/otp?redirect_to=${encodeURIComponent(redirectUrl)}`,
      {
        method: 'POST',
        headers: buildHeaders(config),
        body: JSON.stringify({
          email: targetEmail,
          create_user: true
        })
      }
    );

    if (otpRes.ok) {
      return {
        ok: true,
        email: targetEmail,
        totp_enabled: prepData.totp_enabled
      };
    }

    return {
      ok: false,
      totp_enabled: prepData.totp_enabled,
      error:
        'Um e-mail já foi enviado recentemente. Verifique sua Caixa de Entrada/Spam ou aguarde 60 segundos.'
    };
  } catch {
    return { ok: false, error: 'Erro ao enviar e-mail de recuperação.' };
  }
};

/**
 * Conclui a redefinição de senha ou login via token do e-mail (e limpa a URL)
 */
export const completeEmailRecoveryOrMagicLogin = async (
  accessToken: string,
  newRawPassword?: string
): Promise<CloudUserPayload | null> => {
  const config = getSupabaseConfig();
  if (!config || !accessToken) return null;

  try {
    const newHash =
      newRawPassword && newRawPassword.trim().length > 0
        ? await hashPasswordSha256(newRawPassword.trim())
        : null;

    const res = await fetch(`${config.url}/rest/v1/rpc/complete_change_email_auth`, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        p_new_password_hash: newHash
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
 * Redefine a senha imediatamente usando o código de 6 dígitos do App Autenticador (2FA)
 */
export const recoverPasswordWithTotp = async (
  identifier: string,
  totpCode: string,
  newRawPassword: string
): Promise<{ ok: boolean; account?: CloudUserPayload; error?: string }> => {
  const config = getSupabaseConfig();
  if (!config) return { ok: false, error: 'Sem conexão com a nuvem.' };

  try {
    const infoRes = await fetch(`${config.url}/rest/v1/rpc/get_change_user_for_totp_recovery`, {
      method: 'POST',
      headers: buildHeaders(config),
      body: JSON.stringify({
        p_identifier: sanitizeInput(identifier, 100)
      })
    });

    if (!infoRes.ok) {
      return { ok: false, error: 'Não foi possível verificar o 2FA desta conta.' };
    }

    const info = await infoRes.json();
    if (!info?.ok || !info?.totp_secret) {
      return { ok: false, error: info?.error || 'Esta conta não possui 2FA ativo.' };
    }

    const isCodeValid = await verifyTotpCode(info.totp_secret, totpCode);
    if (!isCodeValid) {
      return { ok: false, error: 'Código 2FA de 6 dígitos inválido ou expirado.' };
    }

    const newHash = await hashPasswordSha256(newRawPassword.trim());
    const resetRes = await fetch(`${config.url}/rest/v1/rpc/reset_change_password_by_totp`, {
      method: 'POST',
      headers: buildHeaders(config),
      body: JSON.stringify({
        p_user_id: info.user_id,
        p_totp_secret: info.totp_secret,
        p_new_password_hash: newHash
      })
    });

    if (resetRes.ok) {
      const rows = await resetRes.json();
      if (Array.isArray(rows) && rows.length > 0) {
        return { ok: true, account: rows[0] as CloudUserPayload };
      }
    }
    return { ok: false, error: 'Não foi possível redefinir a senha.' };
  } catch {
    return { ok: false, error: 'Erro ao validar código de 2 fatores.' };
  }
};

/**
 * Busca ou salva o Google OAuth Client ID opcional na nuvem (para Popup Oficial do Google com URL limpa)
 */
export const fetchGoogleClientIdFromCloud = async (): Promise<string | null> => {
  const envClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
  if (envClientId) return envClientId.trim();

  const config = getSupabaseConfig();
  if (!config) return null;

  try {
    const res = await fetch(
      `${config.url}/rest/v1/change_app_settings?key=eq.google_client_id&select=value&limit=1`,
      {
        method: 'GET',
        headers: buildHeaders(config)
      }
    );
    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0 && rows[0].value) {
        return rows[0].value.trim();
      }
    }
    return null;
  } catch {
    return null;
  }
};

export const saveGoogleClientIdToCloud = async (clientId: string): Promise<boolean> => {
  const config = getSupabaseConfig();
  if (!config) return false;

  try {
    const res = await fetch(`${config.url}/rest/v1/change_app_settings?on_conflict=key`, {
      method: 'POST',
      headers: buildHeaders(config, {
        Prefer: 'resolution=merge-duplicates,return=minimal'
      }),
      body: JSON.stringify({
        key: 'google_client_id',
        value: clientId.trim(),
        updated_at: new Date().toISOString()
      })
    });
    return res.ok;
  } catch {
    return false;
  }
};

/**
 * Autentica uma conta usando o Access Token retornado pelo Popup do Google Identity Services (URL 100% limpa)
 */
export const authenticateWithGoogleAccessToken = async (
  googleAccessToken: string
): Promise<{ ok: boolean; account?: CloudUserPayload; error?: string }> => {
  const config = getSupabaseConfig();
  if (!config) return { ok: false, error: 'Sem conexão com a nuvem.' };

  try {
    // 1. Consulta o perfil verificado direto na API oficial do Google
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${googleAccessToken}`
      }
    });

    if (!googleRes.ok) {
      return { ok: false, error: 'Não foi possível validar o token da sua conta Google.' };
    }

    const googleProfile = await googleRes.json();
    const verifiedEmail = (googleProfile?.email || '').trim().toLowerCase();
    if (!verifiedEmail) {
      return { ok: false, error: 'A conta Google não retornou um endereço de e-mail válido.' };
    }

    // 2. Busca o usuário correspondente cadastrado no Change
    const rpcRes = await fetch(`${config.url}/rest/v1/rpc/authenticate_change_google_email`, {
      method: 'POST',
      headers: buildHeaders(config),
      body: JSON.stringify({
        p_email: verifiedEmail
      })
    });

    if (rpcRes.ok) {
      const rows = await rpcRes.json();
      if (Array.isArray(rows) && rows.length > 0) {
        return { ok: true, account: rows[0] as CloudUserPayload };
      }
    }

    return {
      ok: false,
      error: `O e-mail Google (${verifiedEmail}) ainda não está vinculado a uma conta do Change. Entre com sua senha e atualize seu e-mail em Minha Conta.`
    };
  } catch {
    return { ok: false, error: 'Erro ao autenticar com o Google.' };
  }
};

/**
 * Remove uma conta convidada do banco de dados na nuvem (change_user_data + auth.users), protegendo Aristeu e Vitória
 */
export const deleteCloudUserByAdmin = async (
  email: string,
  userId?: string
): Promise<boolean> => {
  const config = getSupabaseConfig();
  const cleanEmail = email.trim().toLowerCase();
  if (!config || ADMIN_EMAILS.has(cleanEmail) || (userId && ADMIN_USER_IDS.has(userId))) {
    return false;
  }

  try {
    const rpcRes = await fetch(`${config.url}/rest/v1/rpc/admin_delete_change_user`, {
      method: 'POST',
      headers: buildHeaders(config),
      body: JSON.stringify({
        p_target_email: cleanEmail,
        p_target_user_id: userId || null
      })
    });

    if (rpcRes.ok) {
      const data = await rpcRes.json();
      if (data?.ok) return true;
    }

    // Fallback direto caso necessário
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
    const res = await fetch(`${config.url}/rest/v1/change_user_data?on_conflict=user_id`, {
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
