export type MuscleGroup =
  | 'peito'
  | 'costas'
  | 'lats'
  | 'ombros'
  | 'biceps'
  | 'triceps'
  | 'antebraco'
  | 'quadriceps'
  | 'isquiotibiais'
  | 'panturrilha'
  | 'gluteos'
  | 'abdomen'
  | 'cardio'
  | 'corpo_inteiro'
  | 'outro';

export type EquipmentCategory =
  | 'barra'
  | 'halteres'
  | 'maquina'
  | 'polia'
  | 'peso_corporal'
  | 'kettlebell'
  | 'elastico'
  | 'outro';

export type ExerciseType =
  | 'weight_reps'
  | 'reps_only'
  | 'bodyweight_reps'
  | 'duration'
  | 'distance_duration';

export type SetType = 'normal' | 'warmup' | 'dropset' | 'failure';

export interface ExerciseTemplate {
  id: string;
  title: string;
  primary_muscle_group: MuscleGroup;
  secondary_muscle_groups?: MuscleGroup[];
  equipment: EquipmentCategory;
  type: ExerciseType;
  is_custom?: boolean;
  instructions?: string;
  steps?: string[];
  tips?: string[];
  muscles_pt?: string;
  animation_type?: string;
  gif_id?: string;
  gif_url?: string;
}

export interface WorkoutSet {
  id: string;
  index: number;
  type: SetType;
  weight_kg: number | null;
  reps: number | null;
  distance_meters?: number | null;
  duration_seconds?: number | null;
  rpe?: number | null;
  completed: boolean;
  previousGhost?: string;
}

export interface WorkoutExercise {
  id: string;
  exercise_template_id: string;
  title: string;
  notes?: string;
  superset_id?: number | null;
  rest_seconds?: number | null;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  title: string;
  routine_id?: string | null;
  description?: string;
  start_time: string;
  end_time?: string;
  exercises: WorkoutExercise[];
  total_volume_kg: number;
  total_sets: number;
  prs_hit?: number;
}

export interface Routine {
  id: string;
  title: string;
  folder_id: number | null;
  notes?: string;
  exercises: WorkoutExercise[];
  created_at: string;
  updated_at: string;
  order?: number;
}

export interface RoutineFolder {
  id: number;
  title: string;
  index: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  password?: string;
  is_admin?: boolean;
  totp_enabled?: boolean;
  totp_secret?: string | null;
  avatar_color: string;
  created_at: string;
}

export interface WaterLogEntry {
  id: string;
  amount_ml: number;
  timestamp: string;
  date: string; // YYYY-MM-DD
}

export interface WaterTrackerConfig {
  daily_goal_ml: number;
  quick_amounts: number[];
  reminders_enabled: boolean;
  reminder_interval_minutes: number;
  reminder_start_time: string;
  reminder_end_time: string;
}

export interface UserSettings {
  weight_unit: 'kg' | 'lbs';
  distance_unit: 'quilometros' | 'milhas';
  default_rest_seconds: number;
  sound_enabled: boolean;
  haptics_enabled: boolean;
  wake_lock_enabled: boolean;
  theme: 'dark' | 'light';
  user_name: string;
  height_cm?: number | null;
  body_weight_kg?: number | null;
  water_tracker?: WaterTrackerConfig;
  machine_adjustments?: Record<string, string>;
}

export interface PersonalRecord {
  exercise_template_id: string;
  exercise_title: string;
  max_weight_kg: number;
  max_reps: number;
  best_1rm_kg: number;
  date: string;
}

export interface BodyMeasurement {
  date: string;
  weight_kg?: number | null;
  fat_percent?: number | null;
  chest_cm?: number | null;
  waist_cm?: number | null;
  arms_cm?: number | null;
  thighs_cm?: number | null;
  calves_cm?: number | null;
  notes?: string;
}

export type CompetitionMetric = 'score' | 'weekly' | 'workouts' | 'volume';

export interface ChangeCompetition {
  id: string;
  invite_code: string;
  name: string;
  description?: string;
  creator_email: string;
  creator_name: string;
  metric: CompetitionMetric;
  member_emails: string[];
  created_at: string;
  updated_at: string;
}
