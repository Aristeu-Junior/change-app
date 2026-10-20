import { Routine, RoutineFolder } from '../types';

// A tela inicial sempre vem zerada (sem pastas ou rotinas pré-cadastradas)
export const DEFAULT_FOLDERS: RoutineFolder[] = [];
export const DEFAULT_ROUTINES: Routine[] = [];

// IDs legados que vinham pré-carregados nas versões anteriores (para limpeza automática da tela inicial)
export const LEGACY_DEFAULT_ROUTINE_IDS = new Set([
  'routine-push-a',
  'routine-pull-a',
  'routine-legs-a'
]);

export interface RoutinePresetItem {
  exercise_template_id: string;
  title: string;
  setsCount: number;
  reps: number;
  weightKg: number;
}

export interface RoutinePreset {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  description: string;
  exercises: RoutinePresetItem[];
}

export const POPULAR_ROUTINE_PRESETS: RoutinePreset[] = [
  {
    id: 'preset-push-classic',
    title: 'Treino A — Push (Peito, Ombros e Tríceps)',
    subtitle: 'Hipertrofia & Força de Empurrar',
    tag: 'ABC Clássico',
    description: 'Divisão clássica focada em peitoral completo, deltoides e tríceps.',
    exercises: [
      { exercise_template_id: 'bench-press-barbell', title: 'Supino Reto com Barra', setsCount: 3, reps: 10, weightKg: 20 },
      { exercise_template_id: 'incline-dumbbell-press', title: 'Supino Inclinado com Halteres', setsCount: 3, reps: 10, weightKg: 14 },
      { exercise_template_id: 'overhead-press-barbell', title: 'Desenvolvimento Militar Overhead Press (OHP)', setsCount: 3, reps: 10, weightKg: 20 },
      { exercise_template_id: 'lateral-raise-dumbbell', title: 'Elevação Lateral com Halteres', setsCount: 3, reps: 12, weightKg: 8 },
      { exercise_template_id: 'triceps-pushdown-rope', title: 'Tríceps Pulley com Corda', setsCount: 3, reps: 12, weightKg: 15 },
      { exercise_template_id: 'triceps-skullcrusher-ez-bar', title: 'Tríceps Testa com Barra W (Skullcrusher)', setsCount: 3, reps: 10, weightKg: 15 }
    ]
  },
  {
    id: 'preset-pull-classic',
    title: 'Treino B — Pull (Costas, Dorsal e Bíceps)',
    subtitle: 'Expansão Dorsal & Bíceps',
    tag: 'ABC Clássico',
    description: 'Foco na expansão das asas, densidade de costas e pico de bíceps.',
    exercises: [
      { exercise_template_id: 'lat-pulldown', title: 'Puxada Frontal na Polia (Lat Pulldown)', setsCount: 3, reps: 10, weightKg: 20 },
      { exercise_template_id: 'barbell-row', title: 'Remada Curvada com Barra', setsCount: 3, reps: 10, weightKg: 20 },
      { exercise_template_id: 'one-arm-dumbbell-row-saw', title: 'Remada Unilateral com Halter (Serrote)', setsCount: 3, reps: 10, weightKg: 14 },
      { exercise_template_id: 'biceps-curl-barbell-ez', title: 'Rosca Direta (Barra W / EZ)', setsCount: 3, reps: 10, weightKg: 15 },
      { exercise_template_id: 'biceps-hammer-curl-dumbbell', title: 'Rosca Martelo com Halteres', setsCount: 3, reps: 12, weightKg: 10 }
    ]
  },
  {
    id: 'preset-legs-complete',
    title: 'Treino C — Legs (Pernas Completo)',
    subtitle: 'Quadríceps, Posterior e Panturrilhas',
    tag: 'ABC Clássico',
    description: 'Treino completo de membros inferiores com agachamento, leg press, cadeiras e gêmeos.',
    exercises: [
      { exercise_template_id: 'squat-barbell', title: 'Agachamento Livre com Barra (Back Squat)', setsCount: 3, reps: 10, weightKg: 20 },
      { exercise_template_id: 'leg-press', title: 'Leg Press 45º', setsCount: 3, reps: 10, weightKg: 40 },
      { exercise_template_id: 'stiff-deadlift-barbell', title: 'Stiff com Barra (Stiff-Legged Deadlift)', setsCount: 3, reps: 10, weightKg: 20 },
      { exercise_template_id: 'leg-extension', title: 'Cadeira Extensora', setsCount: 3, reps: 12, weightKg: 20 },
      { exercise_template_id: 'lying-leg-curl-machine', title: 'Mesa Flexora / Flexor Deitado', setsCount: 3, reps: 12, weightKg: 20 },
      { exercise_template_id: 'standing-calf-raise', title: 'Gêmeos em Pé (Elevação de Calcanhares)', setsCount: 3, reps: 15, weightKg: 20 }
    ]
  },
  {
    id: 'preset-upper-body',
    title: 'Upper (Membros Superiores Completo)',
    subtitle: 'Divisão Superior / Inferior (AB)',
    tag: 'Upper / Lower',
    description: 'Trabalha peito, costas, ombros, bíceps e tríceps na mesma sessão com alto rendimento.',
    exercises: [
      { exercise_template_id: 'bench-press-barbell', title: 'Supino Reto com Barra', setsCount: 3, reps: 10, weightKg: 20 },
      { exercise_template_id: 'barbell-row', title: 'Remada Curvada com Barra', setsCount: 3, reps: 10, weightKg: 20 },
      { exercise_template_id: 'seated-dumbbell-shoulder-press', title: 'Desenvolvimento com Halteres Sentado', setsCount: 3, reps: 10, weightKg: 12 },
      { exercise_template_id: 'lat-pulldown', title: 'Puxada Frontal na Polia (Lat Pulldown)', setsCount: 3, reps: 10, weightKg: 20 },
      { exercise_template_id: 'triceps-pushdown-rope', title: 'Tríceps Pulley com Corda', setsCount: 3, reps: 12, weightKg: 15 },
      { exercise_template_id: 'biceps-curl-barbell-straight', title: 'Rosca Direta (Barra Reta)', setsCount: 3, reps: 10, weightKg: 15 }
    ]
  },
  {
    id: 'preset-lower-glutes',
    title: 'Lower & Glúteos (Foco Feminino / Inferiores)',
    subtitle: 'Glúteos, Quadríceps e Posterior',
    tag: 'Glúteo & Pernas',
    description: 'Elevação pélvica, agachamento búlgaro, leg press, mesa flexora e cadeira abdutora.',
    exercises: [
      { exercise_template_id: 'hip-thrust-barbell', title: 'Elevação Pélvica com Barra (Hip Thrust)', setsCount: 3, reps: 10, weightKg: 20 },
      { exercise_template_id: 'bulgarian-split-squat', title: 'Agachamento Búlgaro com Halteres', setsCount: 3, reps: 10, weightKg: 10 },
      { exercise_template_id: 'leg-press', title: 'Leg Press 45º', setsCount: 3, reps: 12, weightKg: 40 },
      { exercise_template_id: 'lying-leg-curl-machine', title: 'Mesa Flexora / Flexor Deitado', setsCount: 3, reps: 12, weightKg: 20 },
      { exercise_template_id: 'abductor-machine', title: 'Cadeira Abdutora', setsCount: 3, reps: 15, weightKg: 20 },
      { exercise_template_id: 'seated-calf-raise-machine', title: 'Gêmeos Sentado na Máquina (Seated Calf Raise)', setsCount: 3, reps: 15, weightKg: 20 }
    ]
  },
  {
    id: 'preset-arms-focus',
    title: 'Braços & Antebraço Completo (Arm Day)',
    subtitle: 'Bíceps, Tríceps e Pegada',
    tag: 'Foco Braços',
    description: 'Isoladores de bíceps, tríceps e antebraço para máximo volume de braço.',
    exercises: [
      { exercise_template_id: 'biceps-curl-barbell-straight', title: 'Rosca Direta (Barra Reta)', setsCount: 3, reps: 10, weightKg: 15 },
      { exercise_template_id: 'triceps-skullcrusher-ez-bar', title: 'Tríceps Testa com Barra W (Skullcrusher)', setsCount: 3, reps: 10, weightKg: 15 },
      { exercise_template_id: 'biceps-preacher-curl-ez-bar', title: 'Rosca Scott com Barra W (Preacher Curl)', setsCount: 3, reps: 10, weightKg: 15 },
      { exercise_template_id: 'triceps-pushdown-rope', title: 'Tríceps Pulley com Corda', setsCount: 3, reps: 12, weightKg: 15 },
      { exercise_template_id: 'biceps-reverse-curl-barbell', title: 'Rosca Inversa com Barra', setsCount: 3, reps: 12, weightKg: 12 },
      { exercise_template_id: 'forearm-wrist-curl-barbell', title: 'Rosca Punho no Banco (Flexão de Punho)', setsCount: 3, reps: 15, weightKg: 10 }
    ]
  }
];
