import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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
import { DEFAULT_ROUTINES, DEFAULT_FOLDERS } from '../data/defaultRoutines';
import {
  calculate1RM,
  playGymTone,
  triggerHaptic,
  requestWakeLock,
  releaseWakeLock
} from '../utils/calc';

interface RestTimerState {
  isActive: boolean;
  remainingSeconds: number;
  totalSeconds: number;
  exerciseTitle: string;
}

interface AppContextType {
  // Usuários e Autenticação
  users: UserProfile[];
  currentUser: UserProfile;
  registerUser: (name: string, email: string, password?: string) => boolean;
  loginUser: (email: string, password?: string) => boolean;
  switchUser: (userId: string) => void;
  logoutUser: () => void;

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
  user_name: 'Atleta'
};

const DEFAULT_USER: UserProfile = {
  id: 'user-default',
  name: 'Atleta',
  email: 'atleta@change.app',
  avatar_color: '#ffffff',
  created_at: new Date().toISOString()
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Gerenciamento de Usuários
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('change_all_users');
      return saved ? JSON.parse(saved) : [DEFAULT_USER];
    } catch {
      return [DEFAULT_USER];
    }
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('change_current_user');
      return saved ? JSON.parse(saved) : DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  });

  // Tema Preto & Branco
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('change_theme');
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  // Aplica classe no elemento HTML para modo escuro / claro
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

  // Chaves prefixadas com o ID do usuário para garantir isolamento de dados
  const userKey = (key: string) => `change_${currentUser.id}_${key}`;

  // Estados com carregamento isolado por usuário
  const [workouts, setWorkouts] = useState<Workout[]>(() => {
    try {
      const saved = localStorage.getItem(`change_${currentUser.id}_workouts`);
      return saved ? JSON.parse(saved) : [];
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
      return saved ? JSON.parse(saved) : DEFAULT_ROUTINES;
    } catch {
      return DEFAULT_ROUTINES;
    }
  });

  const [folders, setFolders] = useState<RoutineFolder[]>(() => {
    try {
      const saved = localStorage.getItem(`change_${currentUser.id}_folders`);
      return saved ? JSON.parse(saved) : DEFAULT_FOLDERS;
    } catch {
      return DEFAULT_FOLDERS;
    }
  });

  const [exercises, setExercises] = useState<ExerciseTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(`change_${currentUser.id}_exercises`);
      return saved ? JSON.parse(saved) : DEFAULT_EXERCISES;
    } catch {
      return DEFAULT_EXERCISES;
    }
  });

  const [personalRecords, setPersonalRecords] = useState<Record<string, PersonalRecord>>(() => {
    try {
      const saved = localStorage.getItem(`change_${currentUser.id}_prs`);
      return saved ? JSON.parse(saved) : {};
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
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
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

  // Recarrega os dados ao trocar de usuário
  const reloadUserData = (userId: string) => {
    try {
      const savedWorkouts = localStorage.getItem(`change_${userId}_workouts`);
      setWorkouts(savedWorkouts ? JSON.parse(savedWorkouts) : []);

      const savedActive = localStorage.getItem(`change_${userId}_active_workout`);
      setActiveWorkout(savedActive ? JSON.parse(savedActive) : null);
      setWorkoutModalOpen(!!savedActive);

      const savedRoutines = localStorage.getItem(`change_${userId}_routines`);
      setRoutines(savedRoutines ? JSON.parse(savedRoutines) : DEFAULT_ROUTINES);

      const savedFolders = localStorage.getItem(`change_${userId}_folders`);
      setFolders(savedFolders ? JSON.parse(savedFolders) : DEFAULT_FOLDERS);

      const savedExercises = localStorage.getItem(`change_${userId}_exercises`);
      setExercises(savedExercises ? JSON.parse(savedExercises) : DEFAULT_EXERCISES);

      const savedPrs = localStorage.getItem(`change_${userId}_prs`);
      setPersonalRecords(savedPrs ? JSON.parse(savedPrs) : {});

      const savedMeas = localStorage.getItem(`change_${userId}_measurements`);
      setMeasurements(savedMeas ? JSON.parse(savedMeas) : []);

      const savedSettings = localStorage.getItem(`change_${userId}_settings`);
      setSettings(savedSettings ? { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) } : DEFAULT_SETTINGS);
    } catch {
      // Fallback
    }
  };

  // Funções de Autenticação & Usuários
  const registerUser = (name: string, email: string, password?: string): boolean => {
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) return false;

    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      avatar_color: '#ffffff',
      created_at: new Date().toISOString()
    };

    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    reloadUserData(newUser.id);
    return true;
  };

  const loginUser = (email: string, password?: string): boolean => {
    const found = users.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        (!u.password || u.password === password)
    );
    if (!found) return false;

    setCurrentUser(found);
    reloadUserData(found.id);
    return true;
  };

  const switchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
      reloadUserData(target.id);
    }
  };

  const logoutUser = () => {
    if (users.length > 0) {
      setCurrentUser(users[0]);
      reloadUserData(users[0].id);
    }
  };

  // Contagem regressiva do descanso otimizada (não recria o timer a cada segundo)
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
    let totalVol = 0;
    let completedSetsCount = 0;
    let prsHit = 0;
    const updatedPrs = { ...personalRecords };

    activeWorkout.exercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        if (s.completed && s.weight_kg && s.reps) {
          completedSetsCount++;
          totalVol += s.weight_kg * s.reps;

          const est1RM = calculate1RM(s.weight_kg, s.reps);
          const currentPr = updatedPrs[ex.exercise_template_id];

          if (!currentPr || est1RM > currentPr.best_1rm_kg || s.weight_kg > currentPr.max_weight_kg) {
            prsHit++;
            updatedPrs[ex.exercise_template_id] = {
              exercise_template_id: ex.exercise_template_id,
              exercise_title: ex.title,
              max_weight_kg: Math.max(s.weight_kg, currentPr ? currentPr.max_weight_kg : 0),
              max_reps: s.reps,
              best_1rm_kg: Math.max(est1RM, currentPr ? currentPr.best_1rm_kg : 0),
              date: endTime
            };
          }
        }
      });
    });

    const finished: Workout = {
      ...activeWorkout,
      end_time: endTime,
      description: notes || activeWorkout.description,
      total_volume_kg: totalVol,
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
          weight_kg: prevExercise?.sets[0]?.weight_kg || (template.type === 'bodyweight_reps' ? 0 : 20),
          reps: prevExercise?.sets[0]?.reps || 10,
          completed: false,
          previousGhost: prevExercise?.sets[0]?.weight_kg
            ? `${prevExercise.sets[0].weight_kg} kg × ${prevExercise.sets[0].reps}`
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
      version: '2.0.0',
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
      if (data.workouts) setWorkouts(data.workouts);
      if (data.routines) setRoutines(data.routines);
      if (data.folders) setFolders(data.folders);
      if (data.exercises) setExercises(data.exercises);
      if (data.personalRecords) setPersonalRecords(data.personalRecords);
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
    theme,
    toggleTheme,
    workouts,
    activeWorkout,
    isWorkoutModalOpen,
    setWorkoutModalOpen,
    startWorkout,
    finishWorkout,
    discardWorkout,
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
