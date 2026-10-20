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
  pullAllUserProfilesFromCloud,
  pullUserFromCloudByEmail,
  pushUserToCloud
} from '../services/cloudSync';

interface RestTimerState {
  isActive: boolean;
  remainingSeconds: number;
  totalSeconds: number;
  exerciseTitle: string;
}

export type CloudSyncStatus = 'unconfigured' | 'idle' | 'syncing' | 'synced' | 'error';

interface AppContextType {
  // Usuários e Autenticação
  users: UserProfile[];
  currentUser: UserProfile;
  registerUser: (name: string, email: string, password?: string) => Promise<boolean>;
  loginUser: (email: string, password?: string) => Promise<boolean>;
  switchUser: (userId: string) => void;
  logoutUser: () => void;

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
    avatar_color: '#ffffff',
    created_at: new Date().toISOString()
  },
  {
    id: 'user-vitoria',
    name: 'Vitória',
    email: 'vitoria@change.app',
    avatar_color: '#ffffff',
    created_at: new Date().toISOString()
  }
];

// Sincroniza exercícios salvos mantendo customizados e atualizando todos os 112 padrões (incluindo gif_id revisado)
const syncExercisesWithDefaults = (savedList: ExerciseTemplate[] | null): ExerciseTemplate[] => {
  if (!savedList || !Array.isArray(savedList)) return DEFAULT_EXERCISES;
  const customOnly = savedList.filter((e) => e.is_custom);
  return [...customOnly, ...DEFAULT_EXERCISES];
};

// Remove apenas os treinos padrão antigos pré-carregados (routine-push-a, routine-pull-a, routine-legs-a)
// para garantir que a tela inicial venha sempre zerada até o usuário criar seu próprio treino
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

// Calcula a carga real utilizada nos exercícios concluídos (sem multiplicar por repetições ou séries)
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

// Normaliza treinos salvos para corrigir volumes antigos multiplicados (ex: 600kg -> 20kg)
const normalizeSavedWorkouts = (list: Workout[]): Workout[] => {
  if (!Array.isArray(list)) return [];
  return list.map((w) => ({
    ...w,
    total_volume_kg: calculateRealWorkoutLoadKg(w.exercises)
  }));
};

// Reconstrói os recordes pessoais (PRs) com os valores exatos de carga pegos nos treinos
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
  // Gerenciamento de Usuários (Garantindo perfis de Aristeu, Vitória e novos amigos)
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('change_all_users');
      if (saved) {
        const parsed: UserProfile[] = JSON.parse(saved);
        // Se só existia o 'user-default' genérico antigo, atualiza o nome para Aristeu e garante Vitória
        const updated = parsed.map((u) =>
          u.id === 'user-default' && u.name === 'Atleta'
            ? { ...u, name: 'Aristeu', email: 'aristeu@change.app' }
            : u
        );
        const hasVitoria = updated.some((u) => u.name.toLowerCase().includes('vit'));
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
          return { ...parsed, name: 'Aristeu', email: 'aristeu@change.app' };
        }
        return parsed;
      }
      return INITIAL_USERS[0];
    } catch {
      return INITIAL_USERS[0];
    }
  });

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

  // Rotinas começam sempre vazias ([]) para cada usuário
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
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : { ...DEFAULT_SETTINGS, user_name: currentUser.name };
    } catch {
      return { ...DEFAULT_SETTINGS, user_name: currentUser.name };
    }
  });

  const [completedWorkoutSummary, setCompletedWorkoutSummary] = useState<Workout | null>(null);

  // Temporizador de descanso
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

  // Sincronização automática em segundo plano com o Supabase (Debounced para zero travamento)
  const syncTimeoutRef = useRef<number | null>(null);
  const isPullingCloudRef = useRef<boolean>(false);

  const syncNowWithCloud = async (): Promise<boolean> => {
    if (!isCloudConfigured()) {
      setCloudStatus('unconfigured');
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
    if (!isCloudConfigured() || isPullingCloudRef.current) return;

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
  }, [workouts, routines, folders, exercises, measurements, settings, currentUser.id]);

  // Busca dados da nuvem ao iniciar ou trocar de usuário (se o conector Supabase estiver ativo)
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

        // Se a nuvem está vazia mas o aparelho já tem treinos/planos locais, sobe os locais para a nuvem
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
    if (isCloudConfigured()) {
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
      pullCloudDataForUser(currentUser);
    }
  }, [currentUser.id]);

  // Recarrega os dados locais ao trocar de usuário
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

  // Funções de Autenticação & Usuários (Local + Nuvem)
  const registerUser = async (name: string, email: string, password?: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();
    const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) return false;

    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      password,
      avatar_color: '#ffffff',
      created_at: new Date().toISOString()
    };

    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    reloadUserData(newUser.id, newUser.name);

    if (isCloudConfigured()) {
      await pushUserToCloud(newUser, {
        workouts: [],
        routines: [],
        folders: [],
        exercises: DEFAULT_EXERCISES,
        personalRecords: {},
        measurements: [],
        settings: { ...DEFAULT_SETTINGS, user_name: newUser.name }
      });
    }

    return true;
  };

  const loginUser = async (email: string, password?: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();
    const foundLocal = users.find(
      (u) =>
        u.email.toLowerCase() === cleanEmail &&
        (!u.password || u.password === password)
    );

    if (foundLocal) {
      setCurrentUser(foundLocal);
      reloadUserData(foundLocal.id, foundLocal.name);
      if (isCloudConfigured()) {
        await pullCloudDataForUser(foundLocal);
      }
      return true;
    }

    // Se não achou localmente, verifica se o usuário existe no banco em nuvem (ex.: acessando de outro celular)
    if (isCloudConfigured()) {
      const cloudAccount = await pullUserFromCloudByEmail(cleanEmail);
      if (
        cloudAccount &&
        (!cloudAccount.password_hash || cloudAccount.password_hash === (password || ''))
      ) {
        const restoredUser: UserProfile = {
          id: cloudAccount.user_id || `user-${Date.now()}`,
          name: cloudAccount.name,
          email: cloudAccount.email,
          password: cloudAccount.password_hash,
          avatar_color: cloudAccount.avatar_color || '#ffffff',
          created_at: cloudAccount.updated_at || new Date().toISOString()
        };

        setUsers((prev) => {
          if (prev.some((u) => u.email.toLowerCase() === cleanEmail)) return prev;
          return [...prev, restoredUser];
        });
        setCurrentUser(restoredUser);
        await pullCloudDataForUser(restoredUser);
        return true;
      }
    }

    return false;
  };

  const switchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
      reloadUserData(target.id, target.name);
    }
  };

  const logoutUser = () => {
    if (users.length > 0) {
      setCurrentUser(users[0]);
      reloadUserData(users[0].id, users[0].name);
    }
  };

  // Contagem regressiva do descanso otimizada
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
      // Ignora se indisponível
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

  // Temporizador de Descanso
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

  // Planos de Treino (Rotinas) & Pastas
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

  // Exercícios Customizados
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

  // Medidas
  const saveMeasurement = (m: BodyMeasurement) => {
    setMeasurements((prev) => {
      const filtered = prev.filter((item) => item.date !== m.date);
      return [m, ...filtered].sort((a, b) => b.date.localeCompare(a.date));
    });
  };

  // Configurações
  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Backup e Restauração
  const exportDataJson = (): string => {
    const data = {
      app: 'Change',
      version: '2.1.0',
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

  const contextValue = useMemo(() => ({
    users,
    currentUser,
    registerUser,
    loginUser,
    switchUser,
    logoutUser,
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
  }), [
    users,
    currentUser,
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
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
