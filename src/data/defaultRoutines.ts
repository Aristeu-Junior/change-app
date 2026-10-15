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
