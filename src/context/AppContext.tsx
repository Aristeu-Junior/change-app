import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Workout,
  WorkoutExercise,
  WorkoutSet,
  Routine,
  RoutineFolder,
  ExerciseTemplate,
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
import confetti from 'canvas-confetti';

interface RestTimerState {
  isActive: boolean;
  remainingSeconds: number;
  totalSeconds: number;
  exerciseTitle: string;
}

interface AppContextType {
  // Workouts
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

  // Rest Timer
  restTimer: RestTimerState;
  startRestTimer: (seconds: number, exerciseTitle?: string) => void;
  adjustRestTimer: (deltaSeconds: number) => void;
  skipRestTimer: () => void;

  // Routines & Folders
  routines: Routine[];
  folders: RoutineFolder[];
  saveRoutine: (routine: Routine) => void;
  deleteRoutine: (routineId: string) => void;
  createFolder: (title: string) => void;
  deleteFolder: (folderId: number) => void;

  // Exercises
  exercises: ExerciseTemplate[];
  addCustomExercise: (exercise: Omit<ExerciseTemplate, 'id' | 'is_custom'>) => void;
  deleteCustomExercise: (id: string) => void;

  // Stats & Records
  personalRecords: Record<string, PersonalRecord>;
  measurements: BodyMeasurement[];
  saveMeasurement: (m: BodyMeasurement) => void;

  // Settings
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;

  // Data management
  exportDataJson: () => string;
  importDataJson: (jsonStr: string) => boolean;

  // Active workout summary modal state
  completedWorkoutSummary: Workout | null;
  closeSummaryModal: () => void;
}

const DEFAULT_SETTINGS: UserSettings = {
  weight_unit: 'kg',
  distance_unit: 'kilometers',
  default_rest_seconds: 90,
  sound_enabled: true,
  haptics_enabled: true,
  wake_lock_enabled: true,
  theme: 'dark',
  user_name: 'Athlete'
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state from LocalStorage
  const [workouts, setWorkouts] = useState<Workout[]>(() => {
    try {
      const saved = localStorage.getItem('change_workouts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(() => {
    try {
      const saved = localStorage.getItem('change_active_workout');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isWorkoutModalOpen, setWorkoutModalOpen] = useState<boolean>(() => {
    return !!localStorage.getItem('change_active_workout');
  });

  const [routines, setRoutines] = useState<Routine[]>(() => {
    try {
      const saved = localStorage.getItem('change_routines');
      return saved ? JSON.parse(saved) : DEFAULT_ROUTINES;
    } catch {
      return DEFAULT_ROUTINES;
    }
  });

  const [folders, setFolders] = useState<RoutineFolder[]>(() => {
    try {
      const saved = localStorage.getItem('change_folders');
      return saved ? JSON.parse(saved) : DEFAULT_FOLDERS;
    } catch {
      return DEFAULT_FOLDERS;
    }
  });

  const [exercises, setExercises] = useState<ExerciseTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('change_exercises');
      return saved ? JSON.parse(saved) : DEFAULT_EXERCISES;
    } catch {
      return DEFAULT_EXERCISES;
    }
  });

  const [personalRecords, setPersonalRecords] = useState<Record<string, PersonalRecord>>(() => {
    try {
      const saved = localStorage.getItem('change_prs');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [measurements, setMeasurements] = useState<BodyMeasurement[]>(() => {
    try {
      const saved = localStorage.getItem('change_measurements');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('change_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [completedWorkoutSummary, setCompletedWorkoutSummary] = useState<Workout | null>(null);

  // Rest Timer State
  const [restTimer, setRestTimer] = useState<RestTimerState>({
    isActive: false,
    remainingSeconds: 0,
    totalSeconds: 0,
    exerciseTitle: ''
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('change_workouts', JSON.stringify(workouts));
  }, [workouts]);

  useEffect(() => {
    if (activeWorkout) {
      localStorage.setItem('change_active_workout', JSON.stringify(activeWorkout));
      if (settings.wake_lock_enabled) {
        requestWakeLock();
      }
    } else {
      localStorage.removeItem('change_active_workout');
      releaseWakeLock();
    }
  }, [activeWorkout, settings.wake_lock_enabled]);

  useEffect(() => {
    localStorage.setItem('change_routines', JSON.stringify(routines));
  }, [routines]);

  useEffect(() => {
    localStorage.setItem('change_folders', JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem('change_exercises', JSON.stringify(exercises));
  }, [exercises]);

  useEffect(() => {
    localStorage.setItem('change_prs', JSON.stringify(personalRecords));
  }, [personalRecords]);

  useEffect(() => {
    localStorage.setItem('change_measurements', JSON.stringify(measurements));
  }, [measurements]);

  useEffect(() => {
    localStorage.setItem('change_settings', JSON.stringify(settings));
  }, [settings]);

  // Rest Timer countdown interval
  useEffect(() => {
    if (!restTimer.isActive || restTimer.remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setRestTimer((prev) => {
        if (!prev.isActive) return prev;
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
  }, [restTimer.isActive, restTimer.remainingSeconds, settings.sound_enabled, settings.haptics_enabled]);

  // Workout Actions
  const startWorkout = (routineId?: string, customTitle?: string) => {
    let title = customTitle || 'Workout';
    let exercisesToStart: WorkoutExercise[] = [];

    if (routineId) {
      const routine = routines.find((r) => r.id === routineId);
      if (routine) {
        title = routine.title;
        // Deep clone exercises and reset sets to uncompleted
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

    // PR Celebration confetti
    try {
      confetti({
        particleCount: prsHit > 0 ? 120 : 60,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch {
      // Ignore if confetti canvas not ready
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

    // Check if we have previous history for ghost values
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
            ? `${prevExercise.sets[0].weight_kg} kg x ${prevExercise.sets[0].reps}`
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
    // re-index
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

      // Auto-start rest timer
      const restSec = nextExercises[exerciseIndex].rest_seconds || settings.default_rest_seconds;
      if (restSec > 0) {
        startRestTimer(restSec, nextExercises[exerciseIndex].title);
      }
    }

    setActiveWorkout({ ...activeWorkout, exercises: nextExercises });
  };

  // Rest Timer Controls
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

  // Routine & Folder actions
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
    // Reset routines belonging to this folder to uncategorized (null)
    setRoutines((prev) =>
      prev.map((r) => (r.folder_id === folderId ? { ...r, folder_id: null } : r))
    );
  };

  // Custom Exercises
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

  // Measurements
  const saveMeasurement = (m: BodyMeasurement) => {
    setMeasurements((prev) => {
      const filtered = prev.filter((item) => item.date !== m.date);
      return [m, ...filtered].sort((a, b) => b.date.localeCompare(a.date));
    });
  };

  // Settings
  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Backup & Restore
  const exportDataJson = (): string => {
    const data = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
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

  return (
    <AppContext.Provider
      value={{
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
      }}
    >
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
