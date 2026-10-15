import { Routine, RoutineFolder } from '../types';

export const DEFAULT_FOLDERS: RoutineFolder[] = [
  { id: 1, title: 'Divisão ABC (Push Pull Legs)', index: 0 },
  { id: 2, title: 'Divisão Superior / Inferior (Upper Lower)', index: 1 }
];

export const DEFAULT_ROUTINES: Routine[] = [
  {
    id: 'routine-push-a',
    title: 'Treino A: Peito, Ombros e Tríceps (Push)',
    folder_id: 1,
    notes: 'Foco em progressão de carga no Supino Reto. Descanso de 90s a 120s nas séries pesadas.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    exercises: [
      {
        id: 'e-1',
        exercise_template_id: 'bench-press-barbell',
        title: 'Supino Reto (Barra)',
        rest_seconds: 120,
        sets: [
          { id: 's-1', index: 0, type: 'warmup', weight_kg: 40, reps: 10, completed: false },
          { id: 's-2', index: 1, type: 'normal', weight_kg: 80, reps: 8, completed: false, previousGhost: '80 kg x 8' },
          { id: 's-3', index: 2, type: 'normal', weight_kg: 80, reps: 8, completed: false, previousGhost: '80 kg x 8' },
          { id: 's-4', index: 3, type: 'normal', weight_kg: 80, reps: 6, completed: false, previousGhost: '80 kg x 6' }
        ]
      },
      {
        id: 'e-2',
        exercise_template_id: 'incline-dumbbell-press',
        title: 'Supino Inclinado (Halteres)',
        rest_seconds: 90,
        sets: [
          { id: 's-5', index: 0, type: 'normal', weight_kg: 28, reps: 10, completed: false, previousGhost: '28 kg x 10' },
          { id: 's-6', index: 1, type: 'normal', weight_kg: 28, reps: 9, completed: false, previousGhost: '28 kg x 9' },
          { id: 's-7', index: 2, type: 'normal', weight_kg: 28, reps: 8, completed: false, previousGhost: '28 kg x 8' }
        ]
      },
      {
        id: 'e-3',
        exercise_template_id: 'overhead-press-barbell',
        title: 'Desenvolvimento Militar (Barra)',
        rest_seconds: 90,
        sets: [
          { id: 's-8', index: 0, type: 'normal', weight_kg: 50, reps: 8, completed: false, previousGhost: '50 kg x 8' },
          { id: 's-9', index: 1, type: 'normal', weight_kg: 50, reps: 7, completed: false, previousGhost: '50 kg x 7' }
        ]
      },
      {
        id: 'e-4',
        exercise_template_id: 'lateral-raise-dumbbell',
        title: 'Elevação Lateral (Halteres)',
        rest_seconds: 60,
        sets: [
          { id: 's-10', index: 0, type: 'normal', weight_kg: 12, reps: 15, completed: false },
          { id: 's-11', index: 1, type: 'normal', weight_kg: 12, reps: 14, completed: false },
          { id: 's-12', index: 2, type: 'dropset', weight_kg: 8, reps: 12, completed: false }
        ]
      },
      {
        id: 'e-5',
        exercise_template_id: 'triceps-rope-pushdown',
        title: 'Tríceps Corda (Polia Alta)',
        rest_seconds: 60,
        sets: [
          { id: 's-13', index: 0, type: 'normal', weight_kg: 25, reps: 12, completed: false },
          { id: 's-14', index: 1, type: 'normal', weight_kg: 25, reps: 12, completed: false },
          { id: 's-15', index: 2, type: 'failure', weight_kg: 25, reps: 10, completed: false }
        ]
      }
    ]
  },
  {
    id: 'routine-pull-a',
    title: 'Treino B: Costas, Bíceps e Trapézio (Pull)',
    folder_id: 1,
    notes: 'Terra com carga progressiva seguido de puxadas verticais e horizontais.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    exercises: [
      {
        id: 'e-6',
        exercise_template_id: 'deadlift-barbell',
        title: 'Levantamento Terra (Barra)',
        rest_seconds: 150,
        sets: [
          { id: 's-16', index: 0, type: 'warmup', weight_kg: 60, reps: 8, completed: false },
          { id: 's-17', index: 1, type: 'normal', weight_kg: 120, reps: 5, completed: false, previousGhost: '120 kg x 5' },
          { id: 's-18', index: 2, type: 'normal', weight_kg: 120, reps: 5, completed: false, previousGhost: '120 kg x 5' }
        ]
      },
      {
        id: 'e-7',
        exercise_template_id: 'lat-pulldown',
        title: 'Puxada Alta (Polia / Frente)',
        rest_seconds: 90,
        sets: [
          { id: 's-19', index: 0, type: 'normal', weight_kg: 65, reps: 10, completed: false },
          { id: 's-20', index: 1, type: 'normal', weight_kg: 65, reps: 10, completed: false },
          { id: 's-21', index: 2, type: 'normal', weight_kg: 65, reps: 8, completed: false }
        ]
      },
      {
        id: 'e-8',
        exercise_template_id: 'barbell-row',
        title: 'Remada Curvada (Barra)',
        rest_seconds: 90,
        sets: [
          { id: 's-22', index: 0, type: 'normal', weight_kg: 70, reps: 8, completed: false },
          { id: 's-23', index: 1, type: 'normal', weight_kg: 70, reps: 8, completed: false }
        ]
      },
      {
        id: 'e-9',
        exercise_template_id: 'barbell-curl',
        title: 'Rosca Direta (Barra W ou Reta)',
        rest_seconds: 60,
        sets: [
          { id: 's-24', index: 0, type: 'normal', weight_kg: 30, reps: 10, completed: false },
          { id: 's-25', index: 1, type: 'normal', weight_kg: 30, reps: 10, completed: false }
        ]
      }
    ]
  },
  {
    id: 'routine-legs-a',
    title: 'Treino C: Pernas Completo (Legs)',
    folder_id: 1,
    notes: 'Agachamento pesado com amplitude total abaixo do paralelo.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    exercises: [
      {
        id: 'e-10',
        exercise_template_id: 'squat-barbell',
        title: 'Agachamento Livre (Barra)',
        rest_seconds: 150,
        sets: [
          { id: 's-26', index: 0, type: 'warmup', weight_kg: 50, reps: 10, completed: false },
          { id: 's-27', index: 1, type: 'normal', weight_kg: 100, reps: 6, completed: false, previousGhost: '100 kg x 6' },
          { id: 's-28', index: 2, type: 'normal', weight_kg: 100, reps: 6, completed: false, previousGhost: '100 kg x 6' }
        ]
      },
      {
        id: 'e-11',
        exercise_template_id: 'romanian-deadlift',
        title: 'Stiff / RDL (Barra ou Halteres)',
        rest_seconds: 90,
        sets: [
          { id: 's-29', index: 0, type: 'normal', weight_kg: 80, reps: 10, completed: false },
          { id: 's-30', index: 1, type: 'normal', weight_kg: 80, reps: 10, completed: false }
        ]
      },
      {
        id: 'e-12',
        exercise_template_id: 'leg-extension',
        title: 'Cadeira Extensora',
        rest_seconds: 60,
        sets: [
          { id: 's-31', index: 0, type: 'normal', weight_kg: 60, reps: 12, completed: false },
          { id: 's-32', index: 1, type: 'failure', weight_kg: 60, reps: 12, completed: false }
        ]
      },
      {
        id: 'e-13',
        exercise_template_id: 'standing-calf-raise',
        title: 'Panturrilha em Pé (Máquina)',
        rest_seconds: 60,
        sets: [
          { id: 's-33', index: 0, type: 'normal', weight_kg: 50, reps: 15, completed: false },
          { id: 's-34', index: 1, type: 'normal', weight_kg: 50, reps: 15, completed: false }
        ]
      }
    ]
  }
];

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
    title: 'Push (Peito, Ombros e Tríceps)',
    subtitle: 'Hipertrofia & Força de Empurrar',
    tag: 'Mais Usado',
    description: 'Combinação clássica para desenvolver peitoral volumoso, deltoides destacados e tríceps densos.',
    exercises: [
      { exercise_template_id: 'bench-press-barbell', title: 'Supino Reto com Barra', setsCount: 4, reps: 8, weightKg: 60 },
      { exercise_template_id: 'incline-dumbbell-press', title: 'Supino Inclinado com Halteres', setsCount: 3, reps: 10, weightKg: 22 },
      { exercise_template_id: 'overhead-press-barbell', title: 'Desenvolvimento Militar Overhead Press (OHP)', setsCount: 3, reps: 8, weightKg: 40 },
      { exercise_template_id: 'lateral-raise-dumbbell', title: 'Elevação Lateral com Halteres', setsCount: 4, reps: 12, weightKg: 10 },
      { exercise_template_id: 'triceps-pushdown-rope', title: 'Tríceps Pulley com Corda', setsCount: 3, reps: 12, weightKg: 25 },
      { exercise_template_id: 'triceps-skullcrusher-ez-bar', title: 'Tríceps Testa com Barra W (Skullcrusher)', setsCount: 3, reps: 10, weightKg: 24 }
    ]
  },
  {
    id: 'preset-pull-classic',
    title: 'Pull (Costas, Dorsal e Bíceps)',
    subtitle: 'V-Taper & Puxadas Pesadas',
    tag: 'Costas em V',
    description: 'Foco na expansão das asas, densidade de escápulas e pico de bíceps com remadas e puxadas.',
    exercises: [
      { exercise_template_id: 'deadlift-barbell', title: 'Levantamento Terra Convencional com Barra', setsCount: 3, reps: 6, weightKg: 100 },
      { exercise_template_id: 'lat-pulldown', title: 'Puxada Frontal na Polia (Lat Pulldown)', setsCount: 4, reps: 10, weightKg: 55 },
      { exercise_template_id: 'barbell-row', title: 'Remada Curvada com Barra', setsCount: 4, reps: 8, weightKg: 50 },
      { exercise_template_id: 'one-arm-dumbbell-row-saw', title: 'Remada Unilateral com Halter (Serrote)', setsCount: 3, reps: 10, weightKg: 24 },
      { exercise_template_id: 'biceps-curl-barbell-ez', title: 'Rosca Direta (Barra W / EZ)', setsCount: 3, reps: 10, weightKg: 26 },
      { exercise_template_id: 'biceps-hammer-curl-dumbbell', title: 'Rosca Martelo com Halteres', setsCount: 3, reps: 12, weightKg: 14 }
    ]
  },
  {
    id: 'preset-legs-complete',
    title: 'Legs (Pernas Completo e Panturrilhas)',
    subtitle: 'Quadríceps, Isquiotibiais e Gêmeos',
    tag: 'Treino de Pernas',
    description: 'Treino completo com agachamento pesado, leg press, flexão de joelhos e panturrilhas.',
    exercises: [
      { exercise_template_id: 'squat-barbell', title: 'Agachamento Livre com Barra (Back Squat)', setsCount: 4, reps: 8, weightKg: 80 },
      { exercise_template_id: 'leg-press', title: 'Leg Press 45º', setsCount: 4, reps: 10, weightKg: 160 },
      { exercise_template_id: 'stiff-deadlift-barbell', title: 'Stiff com Barra (Stiff-Legged Deadlift)', setsCount: 3, reps: 10, weightKg: 60 },
      { exercise_template_id: 'leg-extension', title: 'Cadeira Extensora', setsCount: 3, reps: 12, weightKg: 50 },
      { exercise_template_id: 'lying-leg-curl-machine', title: 'Mesa Flexora / Flexor Deitado', setsCount: 3, reps: 12, weightKg: 40 },
      { exercise_template_id: 'standing-calf-raise', title: 'Gêmeos em Pé (Elevação de Calcanhares)', setsCount: 4, reps: 15, weightKg: 50 }
    ]
  },
  {
    id: 'preset-upper-body',
    title: 'Upper (Membros Superiores Completo)',
    subtitle: 'Divisão Superior / Inferior (AB)',
    tag: 'Alta Eficiência',
    description: 'Trabalha todos os grupos musculares da cintura para cima com estímulo balanceado em uma única sessão.',
    exercises: [
      { exercise_template_id: 'bench-press-barbell', title: 'Supino Reto com Barra', setsCount: 3, reps: 8, weightKg: 60 },
      { exercise_template_id: 'barbell-row', title: 'Remada Curvada com Barra', setsCount: 3, reps: 8, weightKg: 50 },
      { exercise_template_id: 'seated-dumbbell-shoulder-press', title: 'Desenvolvimento com Halteres Sentado', setsCount: 3, reps: 10, weightKg: 18 },
      { exercise_template_id: 'lat-pulldown', title: 'Puxada Frontal na Polia (Lat Pulldown)', setsCount: 3, reps: 10, weightKg: 55 },
      { exercise_template_id: 'triceps-pushdown-rope', title: 'Tríceps Pulley com Corda', setsCount: 3, reps: 12, weightKg: 25 },
      { exercise_template_id: 'biceps-curl-barbell-straight', title: 'Rosca Direta (Barra Reta)', setsCount: 3, reps: 10, weightKg: 24 }
    ]
  },
  {
    id: 'preset-lower-glutes',
    title: 'Lower & Glúteos (Membros Inferiores)',
    subtitle: 'Foco em Glúteo, Quadríceps e Posterior',
    tag: 'Inferiores & Glúteo',
    description: 'Combinação potente de elevação pélvica pesada, agachamento búlgaro e cadeira abdutora.',
    exercises: [
      { exercise_template_id: 'hip-thrust-barbell', title: 'Elevação Pélvica com Barra (Hip Thrust)', setsCount: 4, reps: 10, weightKg: 90 },
      { exercise_template_id: 'bulgarian-split-squat', title: 'Agachamento Búlgaro com Halteres', setsCount: 3, reps: 10, weightKg: 14 },
      { exercise_template_id: 'leg-press', title: 'Leg Press 45º', setsCount: 3, reps: 12, weightKg: 140 },
      { exercise_template_id: 'lying-leg-curl-machine', title: 'Mesa Flexora / Flexor Deitado', setsCount: 3, reps: 12, weightKg: 35 },
      { exercise_template_id: 'abductor-machine', title: 'Cadeira Abdutora', setsCount: 3, reps: 15, weightKg: 45 },
      { exercise_template_id: 'seated-calf-raise-machine', title: 'Gêmeos Sentado na Máquina (Seated Calf Raise)', setsCount: 4, reps: 15, weightKg: 35 }
    ]
  },
  {
    id: 'preset-arms-focus',
    title: 'Braços & Antebraço Completo (Arm Day)',
    subtitle: 'Bíceps, Tríceps e Pegada',
    tag: 'Braços Máximos',
    description: 'Supersets e isoladores para estourar o pump nos braços e desenvolver densidade nos antebraços.',
    exercises: [
      { exercise_template_id: 'biceps-curl-barbell-straight', title: 'Rosca Direta (Barra Reta)', setsCount: 4, reps: 10, weightKg: 26 },
      { exercise_template_id: 'triceps-skullcrusher-ez-bar', title: 'Tríceps Testa com Barra W (Skullcrusher)', setsCount: 4, reps: 10, weightKg: 26 },
      { exercise_template_id: 'biceps-preacher-curl-ez-bar', title: 'Rosca Scott com Barra W (Preacher Curl)', setsCount: 3, reps: 10, weightKg: 22 },
      { exercise_template_id: 'triceps-pushdown-rope', title: 'Tríceps Pulley com Corda', setsCount: 3, reps: 12, weightKg: 25 },
      { exercise_template_id: 'biceps-reverse-curl-barbell', title: 'Rosca Inversa com Barra', setsCount: 3, reps: 12, weightKg: 18 },
      { exercise_template_id: 'forearm-wrist-curl-barbell', title: 'Rosca Punho no Banco (Flexão de Punho)', setsCount: 3, reps: 15, weightKg: 16 }
    ]
  }
];
