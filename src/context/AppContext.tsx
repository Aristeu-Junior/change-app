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
import { LEGACY_DEFAULT_ROUTINE_IDS } from '../data/defaultRoutines';
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
  pullAllUserProfilesFromCloud,
  pullUserFromCloudByEmail,
  pushUserToCloud,
  createCloudUserByAdmin,
  updateCloudUserPassword,
  deleteCloudUserByAdmin
} from '../services/cloudSync';

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
  loginUser: (identifier: string, password?: string) => Promise<boolean>;
  logoutUser: () => void;
  adminCreateUser: (
    name: string,
    emailOrUsername: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  adminDeleteUser: (email: string) => Promise<boolean>;
  changeMyPassword: (newPassword: string) => Promise<boolean>;

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
    email: 'aristeu@change.app',
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
  // Estado de Autenticação: exige login para impedir que pessoas transitem nos treinos de outras
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('change_auth_session_active') === 'true';
    } catch {
      return false;
    }
  });

  // Gerenciamento de Usuários
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('change_all_users');
      if (saved) {
        const parsed: UserProfile[] = JSON.parse(saved);
        const updated = parsed.map((u) => {
          if (u.id === 'user-default' && u.name === 'Atleta') {
            return {
              ...u,
              id: 'user-aristeu',
              name: 'Aristeu',
              email: 'aristeu@change.app',
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
        const hasVitoria = updated.some((u) => u.email.toLowerCase() === 'vitoria@change.app');
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
      const saved = localStorage.getItem('change_current_user');
      if (saved) {
        const parsed: UserProfile = JSON.parse(saved);
        if (parsed.id === 'user-default' && parsed.name === 'Atleta') {
          return INITIAL_USERS[0];
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

    syncTimeoutRef.current = window.setTimeout(() => {
      syncNowWithCloud();
    }, 800);

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
      const cloudData = await pullUserFromCloudByEmail(user.email);
      if (cloudData) {
        const cloudWorkouts = normalizeSavedWorkouts(cloudData.workouts || []);
        const cloudRoutines = sanitizeUserRoutines(cloudData.routines || []);
        const cloudFolders = sanitizeUserFolders(cloudData.folders || [], cloudRoutines);

        const localWorkoutsRaw = localStorage.getItem(`change_${user.id}_workouts`);
        const localRoutinesRaw = localStorage.getItem(`change_${user.id}_routines`);
        const localWorkouts = localWorkoutsRaw ? normalizeSavedWorkouts(JSON.parse(localWorkoutsRaw)) : [];
        const localRoutines = localRoutinesRaw ? sanitizeUserRoutines(JSON.parse(localRoutinesRaw)) : [];

        if (
          cloudWorkouts.length === 0 &&
          cloudRoutines.length === 0 &&
          (localWorkouts.length > 0 || localRoutines.length > 0)
        ) {
          await pushUserToCloud(user, {
            workouts: localWorkouts,
            routines: localRoutines,
            folders,
            exercises,
            personalRecords: rebuildPersonalRecords(localWorkouts),
            measurements,
            settings
          });
          setCloudStatus('synced');
        } else {
          const cloudExercises = syncExercisesWithDefaults(cloudData.custom_exercises || []);
          const cloudPrs = rebuildPersonalRecords(cloudWorkouts);
          const cloudMeas = cloudData.measurements || [];
          const cloudSettings = { ...DEFAULT_SETTINGS, ...(cloudData.settings || {}) };

          setWorkouts(cloudWorkouts);
          setRoutines(cloudRoutines);
          setFolders(cloudFolders);
          setExercises(cloudExercises);
          setPersonalRecords(cloudPrs);
          setMeasurements(cloudMeas);
          setSettings(cloudSettings);

          localStorage.setItem(`change_${user.id}_workouts`, JSON.stringify(cloudWorkouts));
          localStorage.setItem(`change_${user.id}_routines`, JSON.stringify(cloudRoutines));
          localStorage.setItem(`change_${user.id}_folders`, JSON.stringify(cloudFolders));
          localStorage.setItem(`change_${user.id}_exercises`, JSON.stringify(cloudExercises));
          localStorage.setItem(`change_${user.id}_prs`, JSON.stringify(cloudPrs));
          localStorage.setItem(`change_${user.id}_measurements`, JSON.stringify(cloudMeas));
          localStorage.setItem(`change_${user.id}_settings`, JSON.stringify(cloudSettings));
          setCloudStatus('synced');
        }
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

  useEffect(() => {
    if (isCloudConfigured() && isAuthenticated) {
      if (isAdminProfile(currentUser)) {
        pullAllUserProfilesFromCloud().then((cloudUsers) => {
          if (cloudUsers.length > 0) {
            setUsers((prev) => {
              const byEmail = new Map<string, UserProfile>();
              prev.forEach((u) => byEmail.set(u.email.toLowerCase(), u));
              cloudUsers.forEach((cu) => {
                const existing = byEmail.get(cu.email.toLowerCase());
                byEmail.set(cu.email.toLowerCase(), existing ? { ...existing, ...cu } : cu);
              });
              return Array.from(byEmail.values());
            });
          }
        });
      }
      pullCloudDataForUser(currentUser);
    }
  }, [currentUser.id, isAuthenticated]);

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

  // Exclusivo para Aristeu e Vitória: Revoga o acesso de um convidado
  const adminDeleteUser = async (email: string): Promise<boolean> => {
    if (!isAdminProfile(currentUser)) return false;
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === 'aristeu@change.app' || cleanEmail === 'vitoria@change.app') return false;

    if (isCloudConfigured()) {
      await deleteCloudUserByAdmin(cleanEmail);
    }

    setUsers((prev) => prev.filter((u) => u.email.toLowerCase() !== cleanEmail));
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
      prev.map((u) => (u.email.toLowerCase() === currentUser.email.toLowerCase() ? updatedUser : u))
    );
    return true;
  };

  // Login com verificação na nuvem (Supabase) e fallback local
  const loginUser = async (identifier: string, password?: string): Promise<boolean> => {
    const normalized = normalizeLoginIdentifier(identifier);
    const inputPass = (password || '').trim();

    // 1. Verifica primeiro na nuvem (Supabase) para validar qualquer usuário cadastrado em qualquer aparelho
    if (isCloudConfigured()) {
      const cloudAccount = await pullUserFromCloudByEmail(identifier);
      if (cloudAccount) {
        const expectedPass = cloudAccount.password_hash || '123456';
        if (expectedPass === inputPass) {
          const restoredUser: UserProfile = {
            id: cloudAccount.user_id || `user-${Date.now()}`,
            name: cloudAccount.name,
            email: cloudAccount.email,
            password: expectedPass,
            is_admin: isAdminProfile({
              id: cloudAccount.user_id,
              name: cloudAccount.name,
              email: cloudAccount.email,
              avatar_color: '#ffffff',
              created_at: ''
            }),
            avatar_color: cloudAccount.avatar_color || '#ffffff',
            created_at: cloudAccount.updated_at || new Date().toISOString()
          };

          setUsers((prev) => {
            const filtered = prev.filter(
              (u) => u.email.toLowerCase() !== restoredUser.email.toLowerCase()
            );
            return [...filtered, restoredUser];
          });
          setCurrentUser(restoredUser);
          reloadUserData(restoredUser.id, restoredUser.name);
          localStorage.setItem('change_auth_session_active', 'true');
          setIsAuthenticated(true);
          await pullCloudDataForUser(restoredUser);
          return true;
        }
        return false;
      }
    }

    // 2. Fallback local (caso sem internet no momento)
    const foundLocal = users.find((u) => {
      const emailMatch =
        u.email.toLowerCase() === normalized ||
        u.email.toLowerCase() === `${normalized}@change.app`;
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
      return (emailMatch || nameMatch) && expectedLocalPass === inputPass;
    });

    if (foundLocal) {
      setCurrentUser(foundLocal);
      reloadUserData(foundLocal.id, foundLocal.name);
      localStorage.setItem('change_auth_session_active', 'true');
      setIsAuthenticated(true);
      return true;
    }

    return false;
  };

  const logoutUser = () => {
    localStorage.removeItem('change_auth_session_active');
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

    setWorkouts((prev) => [finished, ...prev]);
    setPersonalRecords(updatedPrs);
    setActiveWorkout(null);
    setWorkoutModalOpen(false);
    setCompletedWorkoutSummary(finished);

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
    setWorkouts((prev) => {
      const next = prev.filter((w) => w.id !== workoutId);
      setPersonalRecords(rebuildPersonalRecords(next));
      return next;
    });
  };

  const clearWorkouts = () => {
    setWorkouts([]);
    setPersonalRecords({});
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
    setRoutines((prev) => {
      const idx = prev.findIndex((r) => r.id === routine.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = { ...routine, updated_at: new Date().toISOString() };
        return next;
      }
      return [routine, ...prev];
    });
  };

  const deleteRoutine = (routineId: string) => {
    setRoutines((prev) => prev.filter((r) => r.id !== routineId));
  };

  const createFolder = (title: string) => {
    const newFolder: RoutineFolder = {
      id: Date.now(),
      title,
      index: folders.length
    };
    setFolders((prev) => [...prev, newFolder]);
  };

  const deleteFolder = (folderId: number) => {
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    setRoutines((prev) =>
      prev.map((r) => (r.folder_id === folderId ? { ...r, folder_id: null } : r))
    );
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
      loginUser,
      logoutUser,
      adminCreateUser,
      adminDeleteUser,
      changeMyPassword,
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
      completedWorkoutSummary
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
