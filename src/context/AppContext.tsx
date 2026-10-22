import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import {
  Workout,
  WorkoutExercise,
  WorkoutSet,
  Routine,
  RoutineFolder,
  ExerciseTemplate,
  UserProfile,
  UserSettings,
  PersonalRecord,
  BodyMeasurement
} from '../types';
import { DEFAULT_EXERCISES } from '../data/defaultExercises';
import { LEGACY_DEFAULT_ROUTINE_IDS, RoutinePreset } from '../data/defaultRoutines';
import {
  playGymTone,
  triggerHaptic,
  requestWakeLock,
  releaseWakeLock
} from '../utils/calc';
import {
  isCloudConfigured,
  isAdminProfile,
  normalizeLoginIdentifier,
  hashPasswordSha256,
  authenticateUserInCloud,
  pullAllUserProfilesFromCloud,
  pullUserFromCloudByEmail,
  pushUserToCloud,
  createCloudUserByAdmin,
  updateCloudUserPassword,
  updateCloudUserCredentials,
  configureCloudUserTotp,
  completeEmailRecoveryOrMagicLogin,
  deleteCloudUserByAdmin,
  fetchAccessRequestsFromCloud,
  decideAccessRequestInCloud,
  requestOrCheckGoogleAccess,
  AccessRequestEntry,
  CloudUserPayload
} from '../services/cloudSync';
import { verifyTotpCode } from '../utils/totp';
import {
  getSavedDeviceSession,
  saveDeviceSession,
  clearDeviceSession
} from '../utils/deviceSession';

interface RestTimerState {
  isActive: boolean;
  remainingSeconds: number;
  totalSeconds: number;
  exerciseTitle: string;
}

export type CloudSyncStatus = 'unconfigured' | 'idle' | 'syncing' | 'synced' | 'error';

interface AppContextType {
  // Usuários, Autenticação e Permissões de Administrador (Aristeu & Vitória)
  users: UserProfile[];
  currentUser: UserProfile;
  isAuthenticated: boolean;
  isCurrentUserAdmin: boolean;
  accessRequests: AccessRequestEntry[];
  refreshAccessRequests: () => Promise<void>;
  adminDecideAccessRequest: (email: string, decision: 'approved' | 'rejected') => Promise<boolean>;
  loginUser: (identifier: string, password?: string) => Promise<boolean>;
  loginUserWith2FA: (
    identifier: string,
    password: string,
    totpCode?: string
  ) => Promise<{
    ok: boolean;
    requires2FA?: boolean;
    accountStatus?: 'pending' | 'rejected';
    error?: string;
  }>;
  loginWithCloudPayload: (cloudAccount: CloudUserPayload) => Promise<void>;
  logoutUser: () => void;
  adminCreateUser: (
    name: string,
    emailOrUsername: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  adminDeleteUser: (email: string, userId?: string) => Promise<boolean>;
  refreshCloudUsers: () => Promise<void>;
  changeMyPassword: (newPassword: string) => Promise<boolean>;
  updateMyProfile: (
    newName: string,
    newEmail: string,
    newPassword?: string
  ) => Promise<{ ok: boolean; error?: string }>;
  configureMyTotp: (totpSecret: string | null, enable: boolean) => Promise<boolean>;
  recoveryPasswordNotice: string | null;
  clearRecoveryPasswordNotice: () => void;

  // Sincronização em Nuvem (Supabase)
  cloudStatus: CloudSyncStatus;
  syncNowWithCloud: () => Promise<boolean>;

  // Tema Preto & Branco
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // Treinos
  workouts: Workout[];
  activeWorkout: Workout | null;
  isWorkoutModalOpen: boolean;
  setWorkoutModalOpen: (open: boolean) => void;
  startWorkout: (routineId?: string, customTitle?: string) => void;
  finishWorkout: (notes?: string) => Workout | null;
  discardWorkout: () => void;
  deleteWorkout: (workoutId: string) => void;
  clearWorkouts: () => void;
  updateWorkoutTitle: (title: string) => void;
  addExerciseToWorkout: (template: ExerciseTemplate) => void;
  removeExerciseFromWorkout: (exerciseIndex: number) => void;
  addSet: (exerciseIndex: number) => void;
  removeSet: (exerciseIndex: number, setIndex: number) => void;
  updateSet: (exerciseIndex: number, setIndex: number, updates: Partial<WorkoutSet>) => void;
  toggleSetCompleted: (exerciseIndex: number, setIndex: number) => void;

  // Temporizador de Descanso
  restTimer: RestTimerState;
  startRestTimer: (seconds: number, exerciseTitle?: string) => void;
  adjustRestTimer: (deltaSeconds: number) => void;
  skipRestTimer: () => void;

  // Planos de Treino (Rotinas) & Pastas
  routines: Routine[];
  folders: RoutineFolder[];
  saveRoutine: (routine: Routine) => void;
  deleteRoutine: (routineId: string) => void;
  createFolder: (title: string) => void;
  deleteFolder: (folderId: number) => void;
  addFolderWithPreset: (folderTitle: string, routinePresets: RoutinePreset[]) => void;

  // Exercícios
  exercises: ExerciseTemplate[];
  addCustomExercise: (exercise: Omit<ExerciseTemplate, 'id' | 'is_custom'>) => void;
  deleteCustomExercise: (id: string) => void;

  // Estatísticas e Recordes Pessoais (PR)
  personalRecords: Record<string, PersonalRecord>;
  measurements: BodyMeasurement[];
  saveMeasurement: (m: BodyMeasurement) => void;

  // Configurações
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;

  // Backup e Restauração
  exportDataJson: () => string;
  importDataJson: (jsonStr: string) => boolean;

  // Modal de Resumo pós-treino
  completedWorkoutSummary: Workout | null;
  closeSummaryModal: () => void;
}

const DEFAULT_SETTINGS: UserSettings = {
  weight_unit: 'kg',
  distance_unit: 'quilometros',
  default_rest_seconds: 90,
  sound_enabled: true,
  haptics_enabled: true,
  wake_lock_enabled: true,
  theme: 'dark',
  user_name: 'Aristeu'
};

const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user-aristeu',
    name: 'Aristeu',
    email: 'aristeu2304@gmail.com',
    password: '123456',
    is_admin: true,
    avatar_color: '#ffffff',
    created_at: new Date().toISOString()
  },
  {
    id: 'user-vitoria',
    name: 'Vitória',
    email: 'vitoria@change.app',
    password: '123456',
    is_admin: true,
    avatar_color: '#ffffff',
    created_at: new Date().toISOString()
  }
];

const syncExercisesWithDefaults = (savedList: ExerciseTemplate[] | null): ExerciseTemplate[] => {
  if (!savedList || !Array.isArray(savedList)) return DEFAULT_EXERCISES;
  const customOnly = savedList.filter((e) => e.is_custom);
  return [...customOnly, ...DEFAULT_EXERCISES];
};

const sanitizeUserRoutines = (saved: Routine[] | null): Routine[] => {
  if (!saved || !Array.isArray(saved)) return [];
  return saved.filter((r) => !LEGACY_DEFAULT_ROUTINE_IDS.has(r.id));
};

const sanitizeUserFolders = (saved: RoutineFolder[] | null, validRoutines: Routine[]): RoutineFolder[] => {
  if (!saved || !Array.isArray(saved)) return [];
  const legacyTitles = new Set([
    'Divisão ABC (Push Pull Legs)',
    'Divisão Superior / Inferior (Upper Lower)'
  ]);
  return saved.filter((f) => {
    const isLegacyFolder = (f.id === 1 || f.id === 2) && legacyTitles.has(f.title);
    const hasCustomRoutines = validRoutines.some((r) => r.folder_id === f.id);
    return !isLegacyFolder || hasCustomRoutines;
  });
};

export const calculateRealWorkoutLoadKg = (exercises: WorkoutExercise[]): number => {
  if (!exercises || !Array.isArray(exercises)) return 0;
  let totalLoad = 0;
  exercises.forEach((ex) => {
    const completedWithWeight = ex.sets.filter((s) => s.completed && s.weight_kg !== null && s.weight_kg > 0);
    if (completedWithWeight.length > 0) {
      const exerciseWeight = Math.max(...completedWithWeight.map((s) => Number(s.weight_kg) || 0));
      totalLoad += exerciseWeight;
    }
  });
  return Math.round(totalLoad * 10) / 10;
};

const normalizeSavedWorkouts = (list: Workout[]): Workout[] => {
  if (!Array.isArray(list)) return [];
  return list.map((w) => ({
    ...w,
    total_volume_kg: calculateRealWorkoutLoadKg(w.exercises)
  }));
};

const rebuildPersonalRecords = (workoutsList: Workout[]): Record<string, PersonalRecord> => {
  const prs: Record<string, PersonalRecord> = {};
  const chronological = [...workoutsList].reverse();
  chronological.forEach((w) => {
    w.exercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        if (s.completed && s.weight_kg !== null && s.weight_kg > 0 && s.reps) {
          const wKg = Number(s.weight_kg);
          const current = prs[ex.exercise_template_id];
          if (!current || wKg > current.max_weight_kg || (wKg === current.max_weight_kg && s.reps > current.max_reps)) {
            prs[ex.exercise_template_id] = {
              exercise_template_id: ex.exercise_template_id,
              exercise_title: ex.title,
              max_weight_kg: wKg,
              max_reps: s.reps,
              best_1rm_kg: wKg,
              date: w.end_time || w.start_time
            };
          }
        }
      });
    });
  });
  return prs;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Estado de Autenticação: lembra permanentemente o dispositivo logado (iPhone do Aristeu, Celular da Vitória)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const savedDevice = getSavedDeviceSession();
      if (savedDevice && savedDevice.autoLogin) {
        return true;
      }
      return localStorage.getItem('change_auth_session_active') === 'true';
    } catch {
      return false;
    }
  });

  const [recoveryPasswordNotice, setRecoveryPasswordNotice] = useState<string | null>(null);
  const clearRecoveryPasswordNotice = () => setRecoveryPasswordNotice(null);

  // Gerenciamento de Usuários
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('change_all_users');
      if (saved) {
        const parsed: UserProfile[] = JSON.parse(saved);
        const updated = parsed.map((u) => {
          if (
            (u.id === 'user-default' && u.name === 'Atleta') ||
            (u.id === 'user-aristeu' && u.email === 'aristeu@change.app')
          ) {
            return {
              ...u,
              id: 'user-aristeu',
              name: 'Aristeu',
              email: 'aristeu2304@gmail.com',
              password: u.password || '123456',
              is_admin: true
            };
          }
          return {
            ...u,
            is_admin: isAdminProfile(u),
            password: u.password || (isAdminProfile(u) ? '123456' : undefined)
          };
        });
        const hasVitoria = updated.some(
          (u) => u.id === 'user-vitoria' || u.email.toLowerCase() === 'vitoria@change.app'
        );
        if (!hasVitoria) {
          updated.push(INITIAL_USERS[1]);
        }
        return updated;
      }
      return INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const savedDevice = getSavedDeviceSession();
      if (savedDevice && savedDevice.userId) {
        if (
          savedDevice.userId === 'user-aristeu' ||
          savedDevice.email.toLowerCase() === 'aristeu2304@gmail.com' ||
          savedDevice.email.toLowerCase() === 'aristeu@change.app'
        ) {
          return INITIAL_USERS[0];
        }
        if (
          savedDevice.userId === 'user-vitoria' ||
          savedDevice.email.toLowerCase() === 'vitoria@change.app'
        ) {
          return INITIAL_USERS[1];
        }
        const savedCurrent = localStorage.getItem('change_current_user');
        if (savedCurrent) {
          const parsed = JSON.parse(savedCurrent);
          if (parsed.id === savedDevice.userId) {
            return {
              ...parsed,
              is_admin: isAdminProfile(parsed)
            };
          }
        }
        return {
          id: savedDevice.userId,
          name: savedDevice.name,
          email: savedDevice.email,
          is_admin: !!savedDevice.isAdmin,
          avatar_color: savedDevice.avatarColor || '#ffffff',
          created_at: new Date().toISOString()
        };
      }

      const saved = localStorage.getItem('change_current_user');
      if (saved) {
        const parsed: UserProfile = JSON.parse(saved);
        if (parsed.id === 'user-default' && parsed.name === 'Atleta') {
          return INITIAL_USERS[0];
        }
        if (parsed.id === 'user-aristeu' && parsed.email === 'aristeu@change.app') {
          return {
            ...parsed,
            email: 'aristeu2304@gmail.com',
            is_admin: true
          };
        }
        return {
          ...parsed,
          is_admin: isAdminProfile(parsed)
        };
      }
      return INITIAL_USERS[0];
    } catch {
      return INITIAL_USERS[0];
    }
  });

  const isCurrentUserAdmin = useMemo(() => isAdminProfile(currentUser), [currentUser]);

  // Status de sincronização com a nuvem
  const [cloudStatus, setCloudStatus] = useState<CloudSyncStatus>(() =>
    isCloudConfigured() ? 'idle' : 'unconfigured'
  );

  // Tema Preto & Branco
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('change_theme');
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    localStorage.setItem('change_theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('theme-light');
      document.body.classList.add('theme-light');
    } else {
      document.documentElement.classList.remove('theme-light');
      document.body.classList.remove('theme-light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Chaves prefixadas com o ID do usuário para garantir isolamento total de dados por pessoa
  const userKey = (key: string) => `change_${currentUser.id}_${key}`;

  // Estados com carregamento isolado por usuário
  const [workouts, setWorkouts] = useState<Workout[]>(() => {
    try {
      const saved = localStorage.getItem(`change_${currentUser.id}_workouts`);
      return saved ? normalizeSavedWorkouts(JSON.parse(saved)) : [];
    } catch {
      return [];
    }
  });

  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(() => {
    try {
      const saved = localStorage.getItem(`change_${currentUser.id}_active_workout`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isWorkoutModalOpen, setWorkoutModalOpen] = useState<boolean>(() => {
    return !!localStorage.getItem(`change_${currentUser.id}_active_workout`);
  });

  const [routines, setRoutines] = useState<Routine[]>(() => {
    try {
      const saved = localStorage.getItem(`change_${currentUser.id}_routines`);
      const cleaned = sanitizeUserRoutines(saved ? JSON.parse(saved) : null);
      localStorage.setItem(`change_${currentUser.id}_routines`, JSON.stringify(cleaned));
      return cleaned;
    } catch {
      return [];
    }
  });

  const [folders, setFolders] = useState<RoutineFolder[]>(() => {
    try {
      const savedRoutines = localStorage.getItem(`change_${currentUser.id}_routines`);
      const validRoutines = sanitizeUserRoutines(savedRoutines ? JSON.parse(savedRoutines) : null);
      const savedFolders = localStorage.getItem(`change_${currentUser.id}_folders`);
      const cleanedFolders = sanitizeUserFolders(savedFolders ? JSON.parse(savedFolders) : null, validRoutines);
      localStorage.setItem(`change_${currentUser.id}_folders`, JSON.stringify(cleanedFolders));
      return cleanedFolders;
    } catch {
      return [];
    }
  });

  const [exercises, setExercises] = useState<ExerciseTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(`change_${currentUser.id}_exercises`);
      const synced = syncExercisesWithDefaults(saved ? JSON.parse(saved) : null);
      localStorage.setItem(`change_${currentUser.id}_exercises`, JSON.stringify(synced));
      return synced;
    } catch {
      return DEFAULT_EXERCISES;
    }
  });

  const [personalRecords, setPersonalRecords] = useState<Record<string, PersonalRecord>>(() => {
    try {
      const savedWorkouts = localStorage.getItem(`change_${currentUser.id}_workouts`);
      if (savedWorkouts) {
        return rebuildPersonalRecords(JSON.parse(savedWorkouts));
      }
      return {};
    } catch {
      return {};
    }
  });

  const [measurements, setMeasurements] = useState<BodyMeasurement[]>(() => {
    try {
      const saved = localStorage.getItem(`change_${currentUser.id}_measurements`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(`change_${currentUser.id}_settings`);
      return saved
        ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
        : { ...DEFAULT_SETTINGS, user_name: currentUser.name };
    } catch {
      return { ...DEFAULT_SETTINGS, user_name: currentUser.name };
    }
  });

  const [completedWorkoutSummary, setCompletedWorkoutSummary] = useState<Workout | null>(null);

  const [restTimer, setRestTimer] = useState<RestTimerState>({
    isActive: false,
    remainingSeconds: 0,
    totalSeconds: 0,
    exerciseTitle: ''
  });

  // Salva dados no LocalStorage do usuário atual
  useEffect(() => {
    localStorage.setItem('change_all_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('change_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(userKey('workouts'), JSON.stringify(workouts));
  }, [workouts, currentUser.id]);

  useEffect(() => {
    if (activeWorkout) {
      localStorage.setItem(userKey('active_workout'), JSON.stringify(activeWorkout));
      if (settings.wake_lock_enabled) {
        requestWakeLock();
      }
    } else {
      localStorage.removeItem(userKey('active_workout'));
      releaseWakeLock();
    }
  }, [activeWorkout, currentUser.id, settings.wake_lock_enabled]);

  useEffect(() => {
    localStorage.setItem(userKey('routines'), JSON.stringify(routines));
  }, [routines, currentUser.id]);

  useEffect(() => {
    localStorage.setItem(userKey('folders'), JSON.stringify(folders));
  }, [folders, currentUser.id]);

  useEffect(() => {
    localStorage.setItem(userKey('exercises'), JSON.stringify(exercises));
  }, [exercises, currentUser.id]);

  useEffect(() => {
    localStorage.setItem(userKey('prs'), JSON.stringify(personalRecords));
  }, [personalRecords, currentUser.id]);

  useEffect(() => {
    localStorage.setItem(userKey('measurements'), JSON.stringify(measurements));
  }, [measurements, currentUser.id]);

  useEffect(() => {
    localStorage.setItem(userKey('settings'), JSON.stringify(settings));
  }, [settings, currentUser.id]);

  // Sincronização automática em segundo plano com o Supabase
  const syncTimeoutRef = useRef<number | null>(null);
  const isPullingCloudRef = useRef<boolean>(false);

  const syncNowWithCloud = async (): Promise<boolean> => {
    if (!isCloudConfigured() || !isAuthenticated) {
      return false;
    }
    setCloudStatus('syncing');
    const ok = await pushUserToCloud(currentUser, {
      workouts,
      routines,
      folders,
      exercises,
      personalRecords,
      measurements,
      settings
    });
    setCloudStatus(ok ? 'synced' : 'error');
    return ok;
  };

  useEffect(() => {
    if (!isCloudConfigured() || !isAuthenticated || isPullingCloudRef.current) return;

    if (syncTimeoutRef.current) {
      window.clearTimeout(syncTimeoutRef.current);
    }

    // Sincronização rápida em 300ms para refletir alterações instantaneamente em outros navegadores
    syncTimeoutRef.current = window.setTimeout(() => {
      syncNowWithCloud();
    }, 300);

    return () => {
      if (syncTimeoutRef.current) {
        window.clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [workouts, routines, folders, exercises, measurements, settings, currentUser.id, isAuthenticated]);

  const pullCloudDataForUser = async (user: UserProfile) => {
    if (!isCloudConfigured() || !user.email) return;
    setCloudStatus('syncing');
    isPullingCloudRef.current = true;
    try {
      const cloudData = await pullUserFromCloudByEmail(user.email, user.id);
      if (cloudData) {
        // Caso o administrador tenha negado o acesso desta conta remotamente, bloqueia imediatamente no Web App
        if (cloudData.account_status === 'rejected' && !isAdminProfile(user)) {
          localStorage.setItem('change_pending_google_email', user.email);
          localStorage.removeItem('change_auth_session_active');
          setIsAuthenticated(false);
          setWorkoutModalOpen(false);
          return;
        }

        if (
          cloudData.email !== user.email ||
          cloudData.name !== user.name ||
          !!cloudData.totp_enabled !== !!user.totp_enabled
        ) {
          setCurrentUser((prev) => ({
            ...prev,
            name: cloudData.name || prev.name,
            email: cloudData.email || prev.email,
            totp_enabled: !!cloudData.totp_enabled,
            totp_secret: cloudData.totp_secret || null
          }));
        }

        const cloudWorkouts = normalizeSavedWorkouts(cloudData.workouts || []);
        const cloudRoutines = sanitizeUserRoutines(cloudData.routines || []);
        const cloudFolders = sanitizeUserFolders(cloudData.folders || [], cloudRoutines);
        const cloudExercises = syncExercisesWithDefaults(cloudData.custom_exercises || []);
        const cloudMeas = cloudData.measurements || [];
        const cloudSettings = { ...DEFAULT_SETTINGS, ...(cloudData.settings || {}) };

        // Carrega dados locais existentes neste navegador/dispositivo
        const localWorkoutsRaw = localStorage.getItem(`change_${user.id}_workouts`);
        const localRoutinesRaw = localStorage.getItem(`change_${user.id}_routines`);
        const localFoldersRaw = localStorage.getItem(`change_${user.id}_folders`);
        const localExercisesRaw = localStorage.getItem(`change_${user.id}_exercises`);
        const localMeasRaw = localStorage.getItem(`change_${user.id}_measurements`);
        const localSettingsRaw = localStorage.getItem(`change_${user.id}_settings`);

        const localWorkouts = localWorkoutsRaw ? normalizeSavedWorkouts(JSON.parse(localWorkoutsRaw)) : [];
        const localRoutines = localRoutinesRaw ? sanitizeUserRoutines(JSON.parse(localRoutinesRaw)) : [];
        const localFolders = localFoldersRaw ? JSON.parse(localFoldersRaw) : [];
        const localExercises = localExercisesRaw ? JSON.parse(localExercisesRaw) : [];
        const localMeas = localMeasRaw ? JSON.parse(localMeasRaw) : [];
        const localSettings = localSettingsRaw ? JSON.parse(localSettingsRaw) : {};

        // MESCLAGEM INTELIGENTE BIDIRECIONAL
        // 1. Workouts: combina treinos feitos em qualquer navegador ou celular sem apagar nada
        const workoutMap = new Map<string, Workout>();
        cloudWorkouts.forEach((w) => { if (w && w.id) workoutMap.set(w.id, w); });
        localWorkouts.forEach((w) => {
          if (!w || !w.id) return;
          const existing = workoutMap.get(w.id);
          if (!existing) {
            workoutMap.set(w.id, w);
          } else {
            workoutMap.set(w.id, { ...existing, ...w });
          }
        });
        const mergedWorkouts = Array.from(workoutMap.values()).sort((a, b) => {
          const tA = new Date(a.end_time || a.start_time || 0).getTime();
          const tB = new Date(b.end_time || b.start_time || 0).getTime();
          return tB - tA;
        });

        // 2. Routines: preserva todas as rotinas criadas em qualquer lugar
        const routineMap = new Map<string, Routine>();
        cloudRoutines.forEach((r) => { if (r && r.id) routineMap.set(r.id, r); });
        localRoutines.forEach((r) => {
          if (!r || !r.id) return;
          const existing = routineMap.get(r.id);
          if (!existing) {
            routineMap.set(r.id, r);
          } else {
            const timeLocal = new Date(r.updated_at || r.created_at || 0).getTime();
            const timeCloud = new Date(existing.updated_at || existing.created_at || 0).getTime();
            routineMap.set(r.id, timeLocal >= timeCloud ? r : existing);
          }
        });
        const mergedRoutines = sanitizeUserRoutines(Array.from(routineMap.values()));

        // 3. Folders: combina todas as pastas
        const folderMap = new Map<number, RoutineFolder>();
        cloudFolders.forEach((f) => { if (f && f.id) folderMap.set(f.id, f); });
        localFolders.forEach((f: RoutineFolder) => {
          if (f && f.id && !folderMap.has(f.id)) folderMap.set(f.id, f);
        });
        const mergedFolders = sanitizeUserFolders(Array.from(folderMap.values()), mergedRoutines);

        // 4. Custom Exercises: combina todos os exercícios criados
        const customExMap = new Map<string, ExerciseTemplate>();
        cloudExercises.filter((e) => e.is_custom).forEach((e) => customExMap.set(e.id, e));
        localExercises.filter((e: ExerciseTemplate) => e && e.is_custom).forEach((e: ExerciseTemplate) => {
          if (!customExMap.has(e.id)) customExMap.set(e.id, e);
        });
        const mergedExercises = [...Array.from(customExMap.values()), ...DEFAULT_EXERCISES];

        // 5. Measurements: combina registros corporais
        const measMap = new Map<string, BodyMeasurement>();
        cloudMeas.forEach((m) => measMap.set(m.date, m));
        localMeas.forEach((m: BodyMeasurement) => {
          if (m && m.date && !measMap.has(m.date)) measMap.set(m.date, m);
        });
        const mergedMeas = Array.from(measMap.values()).sort((a, b) => b.date.localeCompare(a.date));

        // 6. Settings e PRs
        const mergedSettings = { ...DEFAULT_SETTINGS, ...cloudSettings, ...localSettings };
        const mergedPrs = rebuildPersonalRecords(mergedWorkouts);

        // Aplica nos estados da aplicação
        setWorkouts(mergedWorkouts);
        setRoutines(mergedRoutines);
        setFolders(mergedFolders);
        setExercises(mergedExercises);
        setPersonalRecords(mergedPrs);
        setMeasurements(mergedMeas);
        setSettings(mergedSettings);

        // Salva no localStorage deste navegador
        localStorage.setItem(`change_${user.id}_workouts`, JSON.stringify(mergedWorkouts));
        localStorage.setItem(`change_${user.id}_routines`, JSON.stringify(mergedRoutines));
        localStorage.setItem(`change_${user.id}_folders`, JSON.stringify(mergedFolders));
        localStorage.setItem(`change_${user.id}_exercises`, JSON.stringify(mergedExercises));
        localStorage.setItem(`change_${user.id}_prs`, JSON.stringify(mergedPrs));
        localStorage.setItem(`change_${user.id}_measurements`, JSON.stringify(mergedMeas));
        localStorage.setItem(`change_${user.id}_settings`, JSON.stringify(mergedSettings));

        // Se local tinha itens que a nuvem não tinha, ou se a nuvem estava vazia, salva a união de volta na nuvem
        const localHadExtra =
          mergedWorkouts.length > cloudWorkouts.length ||
          mergedRoutines.length > cloudRoutines.length ||
          mergedFolders.length > cloudFolders.length ||
          customExMap.size > cloudExercises.filter((e) => e.is_custom).length;

        if (localHadExtra) {
          await pushUserToCloud(user, {
            workouts: mergedWorkouts,
            routines: mergedRoutines,
            folders: mergedFolders,
            exercises: mergedExercises,
            personalRecords: mergedPrs,
            measurements: mergedMeas,
            settings: mergedSettings
          });
        }

        setCloudStatus('synced');
      } else {
        setCloudStatus('idle');
      }
    } catch {
      setCloudStatus('error');
    } finally {
      setTimeout(() => {
        isPullingCloudRef.current = false;
      }, 200);
    }
  };

  const [accessRequests, setAccessRequests] = useState<AccessRequestEntry[]>([]);

  const refreshAccessRequests = async () => {
    if (!isCloudConfigured() || !isAdminProfile(currentUser)) return;
    const reqs = await fetchAccessRequestsFromCloud();
    setAccessRequests(reqs);
  };

  const adminDecideAccessRequest = async (
    email: string,
    decision: 'approved' | 'rejected'
  ): Promise<boolean> => {
    if (!isCloudConfigured() || !isAdminProfile(currentUser)) return false;
    const ok = await decideAccessRequestInCloud(email, decision);
    if (ok) {
      await refreshAccessRequests();
      await refreshCloudUsers();
    }
    return ok;
  };

  const refreshCloudUsers = async () => {
    if (!isCloudConfigured()) return;
    const cloudUsers = await pullAllUserProfilesFromCloud();
    if (cloudUsers.length > 0) {
      setUsers((prev) => {
        const byId = new Map<string, UserProfile>();
        cloudUsers.forEach((cu) => {
          const existing = prev.find(
            (p) => p.id === cu.id || p.email.toLowerCase() === cu.email.toLowerCase()
          );
          byId.set(cu.id, existing ? { ...existing, ...cu } : cu);
        });
        // Garante presença dos dois administradores principais
        INITIAL_USERS.forEach((admin) => {
          if (!byId.has(admin.id)) {
            const localAdmin = prev.find((p) => p.id === admin.id) || admin;
            byId.set(admin.id, localAdmin);
          }
        });
        return Array.from(byId.values());
      });
    }
  };

  useEffect(() => {
    if (!isCloudConfigured() || !isAuthenticated) return;

    const isAdmin = isAdminProfile(currentUser);

    let pullCounter = 0;
    const syncAllFromCloud = () => {
      if (isAdmin) {
        refreshAccessRequests();
        refreshCloudUsers();
      } else if (currentUser.email) {
        requestOrCheckGoogleAccess(currentUser.email).then((res) => {
          if (res.status === 'rejected') {
            localStorage.setItem('change_pending_google_email', currentUser.email);
            localStorage.removeItem('change_auth_session_active');
            setIsAuthenticated(false);
            setWorkoutModalOpen(false);
          }
        });
      }

      pullCounter++;
      // A cada 2 ciclos (~7 segundos) busca atualizações de treinos feitas em outros navegadores/aparelhos
      if (pullCounter % 2 === 0) {
        pullCloudDataForUser(currentUser);
      }
    };

    if (isAdmin) {
      refreshCloudUsers();
      refreshAccessRequests();
    }
    pullCloudDataForUser(currentUser);

    const interval = window.setInterval(syncAllFromCloud, 3500);

    const handleWakeUp = () => {
      if (document.visibilityState === 'visible') {
        syncAllFromCloud();
        pullCloudDataForUser(currentUser);
      }
    };

    document.addEventListener('visibilitychange', handleWakeUp);
    window.addEventListener('focus', handleWakeUp);
    window.addEventListener('pageshow', handleWakeUp);
    window.addEventListener('online', handleWakeUp);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleWakeUp);
      window.removeEventListener('focus', handleWakeUp);
      window.removeEventListener('pageshow', handleWakeUp);
      window.removeEventListener('online', handleWakeUp);
    };
  }, [currentUser.id, currentUser.email, isAuthenticated]);

  const reloadUserData = (userId: string, userName?: string) => {
    try {
      const savedWorkouts = localStorage.getItem(`change_${userId}_workouts`);
      const parsedWorkouts = savedWorkouts ? normalizeSavedWorkouts(JSON.parse(savedWorkouts)) : [];
      setWorkouts(parsedWorkouts);

      const savedActive = localStorage.getItem(`change_${userId}_active_workout`);
      setActiveWorkout(savedActive ? JSON.parse(savedActive) : null);
      setWorkoutModalOpen(!!savedActive);

      const savedRoutines = localStorage.getItem(`change_${userId}_routines`);
      const validRoutines = sanitizeUserRoutines(savedRoutines ? JSON.parse(savedRoutines) : null);
      setRoutines(validRoutines);

      const savedFolders = localStorage.getItem(`change_${userId}_folders`);
      setFolders(sanitizeUserFolders(savedFolders ? JSON.parse(savedFolders) : null, validRoutines));

      const savedExercises = localStorage.getItem(`change_${userId}_exercises`);
      setExercises(syncExercisesWithDefaults(savedExercises ? JSON.parse(savedExercises) : null));

      setPersonalRecords(rebuildPersonalRecords(parsedWorkouts));

      const savedMeas = localStorage.getItem(`change_${userId}_measurements`);
      setMeasurements(savedMeas ? JSON.parse(savedMeas) : []);

      const savedSettings = localStorage.getItem(`change_${userId}_settings`);
      setSettings(
        savedSettings
          ? { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) }
          : { ...DEFAULT_SETTINGS, user_name: userName || 'Atleta' }
      );
    } catch {
      // Fallback
    }
  };

  // Exclusivo para Aristeu e Vitória: Cria novo acesso na nuvem sem deslogar o admin
  const adminCreateUser = async (
    name: string,
    emailOrUsername: string,
    password: string
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!isAdminProfile(currentUser)) {
      return { ok: false, error: 'Apenas Aristeu e Vitória têm permissão para criar cadastros.' };
    }

    const rawIdentifier = emailOrUsername.trim().toLowerCase();
    const finalEmail = rawIdentifier.includes('@') ? rawIdentifier : `${rawIdentifier}@change.app`;

    const existingLocal = users.find((u) => u.email.toLowerCase() === finalEmail);
    if (existingLocal) {
      return { ok: false, error: 'Este usuário ou e-mail já está cadastrado.' };
    }

    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: finalEmail,
      password: password.trim(),
      is_admin: false,
      avatar_color: '#ffffff',
      created_at: new Date().toISOString()
    };

    if (isCloudConfigured()) {
      const cloudRes = await createCloudUserByAdmin(newUser, DEFAULT_SETTINGS);
      if (!cloudRes.ok) {
        return cloudRes;
      }
    }

    setUsers((prev) => [...prev, newUser]);
    return { ok: true };
  };

  // Exclusivo para Aristeu e Vitória: Remove definitivamente uma conta do sistema e do banco de dados
  const adminDeleteUser = async (email: string, userId?: string): Promise<boolean> => {
    if (!isAdminProfile(currentUser)) return false;
    const cleanEmail = email.trim().toLowerCase();
    if (
      cleanEmail === 'aristeu2304@gmail.com' ||
      cleanEmail === 'aristeu@change.app' ||
      cleanEmail === 'vitoria@change.app' ||
      userId === 'user-aristeu' ||
      userId === 'user-vitoria'
    ) {
      return false;
    }

    const targetUser = users.find(
      (u) => u.email.toLowerCase() === cleanEmail || (userId && u.id === userId)
    );
    const resolvedUserId = userId || targetUser?.id;

    if (isCloudConfigured()) {
      const deletedInCloud = await deleteCloudUserByAdmin(cleanEmail, resolvedUserId);
      if (!deletedInCloud) return false;
    }

    if (resolvedUserId) {
      try {
        localStorage.removeItem(`change_${resolvedUserId}_workouts`);
        localStorage.removeItem(`change_${resolvedUserId}_active_workout`);
        localStorage.removeItem(`change_${resolvedUserId}_routines`);
        localStorage.removeItem(`change_${resolvedUserId}_folders`);
        localStorage.removeItem(`change_${resolvedUserId}_exercises`);
        localStorage.removeItem(`change_${resolvedUserId}_prs`);
        localStorage.removeItem(`change_${resolvedUserId}_measurements`);
        localStorage.removeItem(`change_${resolvedUserId}_settings`);
      } catch {
        // Ignore
      }
    }

    setUsers((prev) =>
      prev.filter(
        (u) => u.email.toLowerCase() !== cleanEmail && (!resolvedUserId || u.id !== resolvedUserId)
      )
    );
    setAccessRequests((prev) => prev.filter((r) => r.email.toLowerCase() !== cleanEmail));
    return true;
  };

  // Altera a senha do próprio usuário logado
  const changeMyPassword = async (newPassword: string): Promise<boolean> => {
    const cleanPass = newPassword.trim();
    if (!cleanPass) return false;

    if (isCloudConfigured()) {
      const ok = await updateCloudUserPassword(currentUser.email, cleanPass);
      if (!ok) return false;
    }

    const updatedUser: UserProfile = { ...currentUser, password: cleanPass };
    setCurrentUser(updatedUser);
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? updatedUser : u))
    );
    return true;
  };

  // Atualiza Nome, E-mail (ex: Vitória colocar seu Gmail) e opcionalmente a Senha
  const updateMyProfile = async (
    newName: string,
    newEmail: string,
    newPassword?: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const cleanName = newName.trim();
    const cleanEmail = newEmail.trim().toLowerCase();
    if (!cleanName || !cleanEmail || !cleanEmail.includes('@')) {
      return { ok: false, error: 'Informe um nome e um endereço de e-mail válido.' };
    }

    if (isCloudConfigured()) {
      const res = await updateCloudUserCredentials(
        currentUser.id,
        cleanName,
        cleanEmail,
        newPassword
      );
      if (!res.ok) {
        return { ok: false, error: res.error || 'Não foi possível salvar os dados.' };
      }
    }

    const updatedUser: UserProfile = {
      ...currentUser,
      name: cleanName,
      email: cleanEmail,
      ...(newPassword && newPassword.trim() ? { password: newPassword.trim() } : {})
    };
    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    return { ok: true };
  };

  // Ativa ou desativa Autenticação de 2 Fatores (2FA TOTP)
  const configureMyTotp = async (totpSecret: string | null, enable: boolean): Promise<boolean> => {
    if (isCloudConfigured()) {
      const ok = await configureCloudUserTotp(currentUser.id, totpSecret, enable);
      if (!ok) return false;
    }

    const updatedUser: UserProfile = {
      ...currentUser,
      totp_enabled: enable,
      totp_secret: enable ? totpSecret : null
    };
    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    return true;
  };

  // Restaura sessão completa a partir de um payload autenticado da nuvem
  const loginWithCloudPayload = async (cloudAccount: CloudUserPayload): Promise<void> => {
    const restoredUser: UserProfile = {
      id: cloudAccount.user_id || `user-${Date.now()}`,
      name: cloudAccount.name,
      email: cloudAccount.email,
      is_admin: isAdminProfile({
        id: cloudAccount.user_id,
        name: cloudAccount.name,
        email: cloudAccount.email,
        avatar_color: '#ffffff',
        created_at: ''
      }),
      totp_enabled: !!cloudAccount.totp_enabled,
      totp_secret: cloudAccount.totp_secret || null,
      avatar_color: cloudAccount.avatar_color || '#ffffff',
      created_at: cloudAccount.updated_at || new Date().toISOString()
    };

    setUsers((prev) => {
      const filtered = prev.filter(
        (u) => u.id !== restoredUser.id && u.email.toLowerCase() !== restoredUser.email.toLowerCase()
      );
      return [...filtered, restoredUser];
    });
    setCurrentUser(restoredUser);
    reloadUserData(restoredUser.id, restoredUser.name);

    // Carrega instantaneamente os treinos e planos vindos da nuvem nesta nova aba/navegador
    if (cloudAccount.workouts && cloudAccount.workouts.length > 0) {
      const parsedWorkouts = normalizeSavedWorkouts(cloudAccount.workouts);
      setWorkouts(parsedWorkouts);
      localStorage.setItem(`change_${restoredUser.id}_workouts`, JSON.stringify(parsedWorkouts));
      setPersonalRecords(rebuildPersonalRecords(parsedWorkouts));
    }
    if (cloudAccount.routines && cloudAccount.routines.length > 0) {
      const parsedRoutines = sanitizeUserRoutines(cloudAccount.routines);
      setRoutines(parsedRoutines);
      localStorage.setItem(`change_${restoredUser.id}_routines`, JSON.stringify(parsedRoutines));
    }
    if (cloudAccount.folders && cloudAccount.folders.length > 0) {
      setFolders(cloudAccount.folders);
      localStorage.setItem(`change_${restoredUser.id}_folders`, JSON.stringify(cloudAccount.folders));
    }
    if (cloudAccount.custom_exercises && cloudAccount.custom_exercises.length > 0) {
      const parsedEx = syncExercisesWithDefaults(cloudAccount.custom_exercises);
      setExercises(parsedEx);
      localStorage.setItem(`change_${restoredUser.id}_exercises`, JSON.stringify(parsedEx));
    }
    if (cloudAccount.settings) {
      const parsedSettings = { ...DEFAULT_SETTINGS, ...cloudAccount.settings };
      setSettings(parsedSettings);
      localStorage.setItem(`change_${restoredUser.id}_settings`, JSON.stringify(parsedSettings));
    }

    saveDeviceSession(restoredUser, true);
    localStorage.setItem('change_auth_session_active', 'true');
    setIsAuthenticated(true);
    await pullCloudDataForUser(restoredUser);
  };

  // Intercepta links de Recuperação de Senha / Magic Link recebidos por e-mail e limpa a URL imediatamente
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || !hash.includes('access_token=')) return;

    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const accessToken = params.get('access_token');
    const authType = params.get('type');

    // Limpa a URL imediatamente para nunca deixar tokens expostos na barra de endereço
    window.history.replaceState(null, document.title, window.location.pathname + window.location.search);

    if (!accessToken) return;

    const isRecovery = authType === 'recovery' || authType === 'magiclink' || authType === 'signup';
    const generatedNewPass = isRecovery
      ? `Change-${Math.floor(100000 + Math.random() * 900000)}`
      : undefined;

    completeEmailRecoveryOrMagicLogin(accessToken, generatedNewPass).then(async (cloudAccount) => {
      if (cloudAccount) {
        await loginWithCloudPayload(cloudAccount);
        if (generatedNewPass) {
          setRecoveryPasswordNotice(generatedNewPass);
        }
      }
    });
  }, []);

  // Login com suporte a Autenticação de Dois Fatores (2FA) e verificação de aprovação
  const loginUserWith2FA = async (
    identifier: string,
    password: string,
    totpCode?: string
  ): Promise<{
    ok: boolean;
    requires2FA?: boolean;
    accountStatus?: 'pending' | 'rejected';
    error?: string;
  }> => {
    const normalized = normalizeLoginIdentifier(identifier);
    const inputPass = (password || '').trim();
    const hashedInputPass = await hashPasswordSha256(inputPass);

    if (isCloudConfigured()) {
      const cloudAccount = await authenticateUserInCloud(identifier, inputPass);
      if (cloudAccount) {
        if (cloudAccount.totp_enabled && cloudAccount.totp_secret) {
          if (!totpCode || !totpCode.trim()) {
            return { ok: false, requires2FA: true };
          }
          const valid2FA = await verifyTotpCode(cloudAccount.totp_secret, totpCode.trim());
          if (!valid2FA) {
            return {
              ok: false,
              requires2FA: true,
              error: 'Código de 2 Fatores (2FA) inválido ou expirado.'
            };
          }
        }
        await loginWithCloudPayload(cloudAccount);
        return { ok: true };
      }

      // Verifica se o e-mail está aguardando aprovação ou teve o acesso negado
      if (normalized.includes('@')) {
        const statusCheck = await requestOrCheckGoogleAccess(normalized);
        if (statusCheck.status === 'rejected') {
          return {
            ok: false,
            accountStatus: 'rejected',
            error: 'Acesso Negado. Sua solicitação não foi autorizada pelo administrador.'
          };
        }
        if (statusCheck.status === 'pending') {
          return {
            ok: false,
            accountStatus: 'pending',
            error: 'Sua conta aguarda aprovação do administrador.'
          };
        }
      }
    }

    // Fallback local
    const foundLocal = users.find((u) => {
      const emailMatch =
        u.email.toLowerCase() === normalized ||
        u.email.toLowerCase() === `${normalized}@change.app` ||
        (normalized === 'aristeu2304@gmail.com' && u.id === 'user-aristeu');
      const nameMatch =
        u.name
          .trim()
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') ===
        identifier
          .trim()
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
      const expectedLocalPass = u.password || '123456';
      return (
        (emailMatch || nameMatch) &&
        (expectedLocalPass === inputPass || expectedLocalPass === hashedInputPass)
      );
    });

    if (foundLocal) {
      if (foundLocal.totp_enabled && foundLocal.totp_secret) {
        if (!totpCode || !totpCode.trim()) {
          return { ok: false, requires2FA: true };
        }
        const valid2FA = await verifyTotpCode(foundLocal.totp_secret, totpCode.trim());
        if (!valid2FA) {
          return {
            ok: false,
            requires2FA: true,
            error: 'Código de 2 Fatores (2FA) inválido ou expirado.'
          };
        }
      }
      setCurrentUser(foundLocal);
      reloadUserData(foundLocal.id, foundLocal.name);
      saveDeviceSession(foundLocal, true);
      localStorage.setItem('change_auth_session_active', 'true');
      setIsAuthenticated(true);
      return { ok: true };
    }

    return { ok: false, error: 'E-mail ou senha incorretos. Verifique seus dados.' };
  };

  // Wrapper de compatibilidade
  const loginUser = async (identifier: string, password?: string): Promise<boolean> => {
    const res = await loginUserWith2FA(identifier, password || '');
    return res.ok;
  };

  const logoutUser = () => {
    clearDeviceSession();
    setIsAuthenticated(false);
    setWorkoutModalOpen(false);
  };

  // Contagem regressiva do descanso
  useEffect(() => {
    if (!restTimer.isActive) return;

    const interval = setInterval(() => {
      setRestTimer((prev) => {
        if (!prev.isActive || prev.remainingSeconds <= 0) return prev;
        const nextSec = prev.remainingSeconds - 1;

        if (nextSec <= 3 && nextSec > 0 && settings.sound_enabled) {
          playGymTone('countdown');
        }

        if (nextSec <= 0) {
          if (settings.sound_enabled) playGymTone('complete');
          if (settings.haptics_enabled) triggerHaptic('success');
          return { ...prev, isActive: false, remainingSeconds: 0 };
        }

        return { ...prev, remainingSeconds: nextSec };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [restTimer.isActive, settings.sound_enabled, settings.haptics_enabled]);

  // Ações de Treino
  const startWorkout = (routineId?: string, customTitle?: string) => {
    let title = customTitle || 'Treino Livre';
    let exercisesToStart: WorkoutExercise[] = [];

    if (routineId) {
      const routine = routines.find((r) => r.id === routineId);
      if (routine) {
        title = routine.title;
        exercisesToStart = routine.exercises.map((e, eIdx) => ({
          ...e,
          id: `we-${Date.now()}-${eIdx}`,
          sets: e.sets.map((s, sIdx) => ({
            ...s,
            id: `ws-${Date.now()}-${eIdx}-${sIdx}`,
            completed: false
          }))
        }));
      }
    }

    const newWorkout: Workout = {
      id: `w-${Date.now()}`,
      title,
      routine_id: routineId || null,
      start_time: new Date().toISOString(),
      exercises: exercisesToStart,
      total_volume_kg: 0,
      total_sets: 0,
      prs_hit: 0
    };

    setActiveWorkout(newWorkout);
    setWorkoutModalOpen(true);
  };

  const finishWorkout = (notes?: string): Workout | null => {
    if (!activeWorkout) return null;

    const endTime = new Date().toISOString();
    let completedSetsCount = 0;
    let prsHit = 0;
    const updatedPrs = { ...personalRecords };

    activeWorkout.exercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        if (s.completed && s.reps) {
          completedSetsCount++;
          const wKg = Number(s.weight_kg) || 0;
          if (wKg > 0) {
            const currentPr = updatedPrs[ex.exercise_template_id];
            if (!currentPr || wKg > currentPr.max_weight_kg) {
              prsHit++;
              updatedPrs[ex.exercise_template_id] = {
                exercise_template_id: ex.exercise_template_id,
                exercise_title: ex.title,
                max_weight_kg: wKg,
                max_reps: s.reps,
                best_1rm_kg: wKg,
                date: endTime
              };
            }
          }
        }
      });
    });

    const realLoadKg = calculateRealWorkoutLoadKg(activeWorkout.exercises);

    const finished: Workout = {
      ...activeWorkout,
      end_time: endTime,
      description: notes || activeWorkout.description,
      total_volume_kg: realLoadKg,
      total_sets: completedSetsCount,
      prs_hit: prsHit
    };

    const nextWorkouts = [finished, ...workouts];
    setWorkouts(nextWorkouts);
    setPersonalRecords(updatedPrs);
    setActiveWorkout(null);
    setWorkoutModalOpen(false);
    setCompletedWorkoutSummary(finished);

    localStorage.setItem(userKey('workouts'), JSON.stringify(nextWorkouts));
    localStorage.setItem(userKey('prs'), JSON.stringify(updatedPrs));
    localStorage.removeItem(userKey('active_workout'));

    if (isCloudConfigured() && isAuthenticated) {
      pushUserToCloud(currentUser, {
        workouts: nextWorkouts,
        routines,
        folders,
        exercises,
        personalRecords: updatedPrs,
        measurements,
        settings
      });
    }

    try {
      import('canvas-confetti').then((m) => {
        const conf = m.default || m;
        conf({
          particleCount: prsHit > 0 ? 100 : 50,
          spread: 70,
          origin: { y: 0.6 }
        });
      }).catch(() => {});
    } catch {
      // Ignora
    }

    return finished;
  };

  const discardWorkout = () => {
    setActiveWorkout(null);
    setWorkoutModalOpen(false);
    setRestTimer({ isActive: false, remainingSeconds: 0, totalSeconds: 0, exerciseTitle: '' });
  };

  const deleteWorkout = (workoutId: string) => {
    const next = workouts.filter((w) => w.id !== workoutId);
    const nextPrs = rebuildPersonalRecords(next);
    setWorkouts(next);
    setPersonalRecords(nextPrs);
    localStorage.setItem(userKey('workouts'), JSON.stringify(next));
    localStorage.setItem(userKey('prs'), JSON.stringify(nextPrs));

    if (isCloudConfigured() && isAuthenticated) {
      pushUserToCloud(currentUser, {
        workouts: next,
        routines,
        folders,
        exercises,
        personalRecords: nextPrs,
        measurements,
        settings
      });
    }
  };

  const clearWorkouts = () => {
    setWorkouts([]);
    setPersonalRecords({});
    localStorage.setItem(userKey('workouts'), JSON.stringify([]));
    localStorage.setItem(userKey('prs'), JSON.stringify({}));

    if (isCloudConfigured() && isAuthenticated) {
      pushUserToCloud(currentUser, {
        workouts: [],
        routines,
        folders,
        exercises,
        personalRecords: {},
        measurements,
        settings
      });
    }
  };

  const updateWorkoutTitle = (title: string) => {
    if (!activeWorkout) return;
    setActiveWorkout({ ...activeWorkout, title });
  };

  const addExerciseToWorkout = (template: ExerciseTemplate) => {
    if (!activeWorkout) return;

    const prevWorkout = workouts.find((w) =>
      w.exercises.some((e) => e.exercise_template_id === template.id)
    );
    const prevExercise = prevWorkout?.exercises.find((e) => e.exercise_template_id === template.id);
    const completedPrevSet = prevExercise?.sets.find((s) => s.completed);

    const newExercise: WorkoutExercise = {
      id: `we-${Date.now()}`,
      exercise_template_id: template.id,
      title: template.title,
      rest_seconds: settings.default_rest_seconds,
      sets: [
        {
          id: `ws-${Date.now()}-0`,
          index: 0,
          type: 'normal',
          weight_kg: completedPrevSet?.weight_kg ?? (template.type === 'bodyweight_reps' ? 0 : 20),
          reps: completedPrevSet?.reps ?? 10,
          completed: false,
          previousGhost: completedPrevSet?.weight_kg
            ? `${completedPrevSet.weight_kg} kg × ${completedPrevSet.reps}`
            : undefined
        }
      ]
    };

    setActiveWorkout({
      ...activeWorkout,
      exercises: [...activeWorkout.exercises, newExercise]
    });
  };

  const removeExerciseFromWorkout = (exerciseIndex: number) => {
    if (!activeWorkout) return;
    const nextExercises = [...activeWorkout.exercises];
    nextExercises.splice(exerciseIndex, 1);
    setActiveWorkout({ ...activeWorkout, exercises: nextExercises });
  };

  const addSet = (exerciseIndex: number) => {
    if (!activeWorkout) return;
    const nextExercises = [...activeWorkout.exercises];
    const targetExercise = nextExercises[exerciseIndex];
    const prevSet = targetExercise.sets[targetExercise.sets.length - 1];

    const newSet: WorkoutSet = {
      id: `ws-${Date.now()}-${targetExercise.sets.length}`,
      index: targetExercise.sets.length,
      type: 'normal',
      weight_kg: prevSet ? prevSet.weight_kg : 20,
      reps: prevSet ? prevSet.reps : 10,
      completed: false,
      previousGhost: prevSet?.previousGhost
    };

    targetExercise.sets.push(newSet);
    setActiveWorkout({ ...activeWorkout, exercises: nextExercises });
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    if (!activeWorkout) return;
    const nextExercises = [...activeWorkout.exercises];
    nextExercises[exerciseIndex].sets.splice(setIndex, 1);
    nextExercises[exerciseIndex].sets.forEach((s, idx) => {
      s.index = idx;
    });
    setActiveWorkout({ ...activeWorkout, exercises: nextExercises });
  };

  const updateSet = (exerciseIndex: number, setIndex: number, updates: Partial<WorkoutSet>) => {
    if (!activeWorkout) return;
    const nextExercises = [...activeWorkout.exercises];
    nextExercises[exerciseIndex].sets[setIndex] = {
      ...nextExercises[exerciseIndex].sets[setIndex],
      ...updates
    };
    setActiveWorkout({ ...activeWorkout, exercises: nextExercises });
  };

  const toggleSetCompleted = (exerciseIndex: number, setIndex: number) => {
    if (!activeWorkout) return;
    const nextExercises = [...activeWorkout.exercises];
    const set = nextExercises[exerciseIndex].sets[setIndex];
    const nextCompleted = !set.completed;
    set.completed = nextCompleted;

    if (nextCompleted) {
      if (settings.sound_enabled) playGymTone('check');
      if (settings.haptics_enabled) triggerHaptic('light');

      const restSec = nextExercises[exerciseIndex].rest_seconds || settings.default_rest_seconds;
      if (restSec > 0) {
        startRestTimer(restSec, nextExercises[exerciseIndex].title);
      }
    }

    setActiveWorkout({ ...activeWorkout, exercises: nextExercises });
  };

  const startRestTimer = (seconds: number, exerciseTitle = '') => {
    setRestTimer({
      isActive: true,
      remainingSeconds: seconds,
      totalSeconds: seconds,
      exerciseTitle
    });
  };

  const adjustRestTimer = (deltaSeconds: number) => {
    setRestTimer((prev) => {
      const nextRemaining = Math.max(0, prev.remainingSeconds + deltaSeconds);
      return {
        ...prev,
        remainingSeconds: nextRemaining,
        totalSeconds: Math.max(prev.totalSeconds, nextRemaining)
      };
    });
  };

  const skipRestTimer = () => {
    setRestTimer({
      isActive: false,
      remainingSeconds: 0,
      totalSeconds: 0,
      exerciseTitle: ''
    });
  };

  const saveRoutine = (routine: Routine) => {
    let nextRoutines: Routine[];
    const idx = routines.findIndex((r) => r.id === routine.id);
    if (idx !== -1) {
      nextRoutines = [...routines];
      nextRoutines[idx] = { ...routine, updated_at: new Date().toISOString() };
    } else {
      nextRoutines = [routine, ...routines];
    }
    setRoutines(nextRoutines);
    localStorage.setItem(userKey('routines'), JSON.stringify(nextRoutines));

    if (isCloudConfigured() && isAuthenticated) {
      pushUserToCloud(currentUser, {
        workouts,
        routines: nextRoutines,
        folders,
        exercises,
        personalRecords,
        measurements,
        settings
      });
    }
  };

  const deleteRoutine = (routineId: string) => {
    const nextRoutines = routines.filter((r) => r.id !== routineId);
    setRoutines(nextRoutines);
    localStorage.setItem(userKey('routines'), JSON.stringify(nextRoutines));

    if (isCloudConfigured() && isAuthenticated) {
      pushUserToCloud(currentUser, {
        workouts,
        routines: nextRoutines,
        folders,
        exercises,
        personalRecords,
        measurements,
        settings
      });
    }
  };

  const createFolder = (title: string) => {
    const newFolder: RoutineFolder = {
      id: Date.now(),
      title,
      index: folders.length
    };
    const nextFolders = [...folders, newFolder];
    setFolders(nextFolders);
    localStorage.setItem(userKey('folders'), JSON.stringify(nextFolders));

    if (isCloudConfigured() && isAuthenticated) {
      pushUserToCloud(currentUser, {
        workouts,
        routines,
        folders: nextFolders,
        exercises,
        personalRecords,
        measurements,
        settings
      });
    }
  };

  const deleteFolder = (folderId: number) => {
    const nextFolders = folders.filter((f) => f.id !== folderId);
    const nextRoutines = routines.map((r) =>
      r.folder_id === folderId ? { ...r, folder_id: null } : r
    );
    setFolders(nextFolders);
    setRoutines(nextRoutines);
    localStorage.setItem(userKey('folders'), JSON.stringify(nextFolders));
    localStorage.setItem(userKey('routines'), JSON.stringify(nextRoutines));

    if (isCloudConfigured() && isAuthenticated) {
      pushUserToCloud(currentUser, {
        workouts,
        routines: nextRoutines,
        folders: nextFolders,
        exercises,
        personalRecords,
        measurements,
        settings
      });
    }
  };

  const addFolderWithPreset = (folderTitle: string, routinePresets: RoutinePreset[]) => {
    const newFolderId = Date.now();
    const newFolder: RoutineFolder = {
      id: newFolderId,
      title: folderTitle,
      index: folders.length
    };

    const newRoutines: Routine[] = routinePresets.map((preset, rIdx) => {
      const mappedExercises: WorkoutExercise[] = preset.exercises.map((pEx, exIdx) => ({
        id: `re-${Date.now()}-${rIdx}-${exIdx}`,
        exercise_template_id: pEx.exercise_template_id,
        title: pEx.title,
        rest_seconds: 90,
        sets: Array.from({ length: pEx.setsCount }).map((_, sIdx) => ({
          id: `rs-${Date.now()}-${rIdx}-${exIdx}-${sIdx}`,
          index: sIdx,
          type: 'normal',
          weight_kg: pEx.weightKg,
          reps: pEx.reps,
          completed: false
        }))
      }));

      return {
        id: `routine-${Date.now()}-${rIdx}`,
        title: preset.title,
        notes: `${preset.subtitle}. ${preset.description}`,
        folder_id: newFolderId,
        exercises: mappedExercises,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });

    const nextFolders = [...folders, newFolder];
    const nextRoutines = [...newRoutines, ...routines];

    setFolders(nextFolders);
    setRoutines(nextRoutines);
    localStorage.setItem(userKey('folders'), JSON.stringify(nextFolders));
    localStorage.setItem(userKey('routines'), JSON.stringify(nextRoutines));

    if (isCloudConfigured() && isAuthenticated) {
      pushUserToCloud(currentUser, {
        workouts,
        routines: nextRoutines,
        folders: nextFolders,
        exercises,
        personalRecords,
        measurements,
        settings
      });
    }
  };

  const addCustomExercise = (ex: Omit<ExerciseTemplate, 'id' | 'is_custom'>) => {
    const newEx: ExerciseTemplate = {
      ...ex,
      id: `custom-${Date.now()}`,
      is_custom: true
    };
    setExercises((prev) => [newEx, ...prev]);
  };

  const deleteCustomExercise = (id: string) => {
    setExercises((prev) => prev.filter((e) => e.id !== id));
  };

  const saveMeasurement = (m: BodyMeasurement) => {
    setMeasurements((prev) => {
      const filtered = prev.filter((item) => item.date !== m.date);
      return [m, ...filtered].sort((a, b) => b.date.localeCompare(a.date));
    });
  };

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const exportDataJson = (): string => {
    const data = {
      app: 'Change',
      version: '2.2.0',
      exportedAt: new Date().toISOString(),
      user: currentUser,
      workouts,
      routines,
      folders,
      exercises,
      personalRecords,
      measurements,
      settings
    };
    return JSON.stringify(data, null, 2);
  };

  const importDataJson = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.workouts) {
        const normalized = normalizeSavedWorkouts(data.workouts);
        setWorkouts(normalized);
        setPersonalRecords(rebuildPersonalRecords(normalized));
      }
      if (data.routines) setRoutines(data.routines);
      if (data.folders) setFolders(data.folders);
      if (data.exercises) setExercises(syncExercisesWithDefaults(data.exercises));
      if (data.measurements) setMeasurements(data.measurements);
      if (data.settings) setSettings(data.settings);
      return true;
    } catch {
      return false;
    }
  };

  const closeSummaryModal = () => {
    setCompletedWorkoutSummary(null);
  };

  const contextValue = useMemo(
    () => ({
      users,
      currentUser,
      isAuthenticated,
      isCurrentUserAdmin,
      accessRequests,
      refreshAccessRequests,
      adminDecideAccessRequest,
      loginUser,
      loginUserWith2FA,
      loginWithCloudPayload,
      logoutUser,
      adminCreateUser,
      adminDeleteUser,
      refreshCloudUsers,
      changeMyPassword,
      updateMyProfile,
      configureMyTotp,
      recoveryPasswordNotice,
      clearRecoveryPasswordNotice,
      cloudStatus,
      syncNowWithCloud,
      theme,
      toggleTheme,
      workouts,
      activeWorkout,
      isWorkoutModalOpen,
      setWorkoutModalOpen,
      startWorkout,
      finishWorkout,
      discardWorkout,
      deleteWorkout,
      clearWorkouts,
      updateWorkoutTitle,
      addExerciseToWorkout,
      removeExerciseFromWorkout,
      addSet,
      removeSet,
      updateSet,
      toggleSetCompleted,
      restTimer,
      startRestTimer,
      adjustRestTimer,
      skipRestTimer,
      routines,
      folders,
      saveRoutine,
      deleteRoutine,
      createFolder,
      deleteFolder,
      addFolderWithPreset,
      exercises,
      addCustomExercise,
      deleteCustomExercise,
      personalRecords,
      measurements,
      saveMeasurement,
      settings,
      updateSettings,
      exportDataJson,
      importDataJson,
      completedWorkoutSummary,
      closeSummaryModal
    }),
    [
      users,
      currentUser,
      isAuthenticated,
      isCurrentUserAdmin,
      accessRequests,
      cloudStatus,
      theme,
      workouts,
      activeWorkout,
      isWorkoutModalOpen,
      restTimer,
      routines,
      folders,
      exercises,
      personalRecords,
      measurements,
      settings,
      completedWorkoutSummary,
      recoveryPasswordNotice
    ]
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
