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

export interface FolderPreset {
  id: string;
  title: string;
  tag: string;
  description: string;
  routines: RoutinePreset[];
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

export const POPULAR_FOLDER_PRESETS: FolderPreset[] = [
  {
    id: 'folder-abc-classic',
    title: 'Divisão ABC (Push / Pull / Legs)',
    tag: '3 Treinos',
    description: 'A divisão mais famosa do mundo: Empurrar (Peito/Ombro/Tríceps), Puxar (Costas/Bíceps) e Pernas.',
    routines: [
      POPULAR_ROUTINE_PRESETS[0], // Treino A - Push
      POPULAR_ROUTINE_PRESETS[1], // Treino B - Pull
      POPULAR_ROUTINE_PRESETS[2]  // Treino C - Legs
    ]
  },
  {
    id: 'folder-upper-lower',
    title: 'Divisão Superior / Inferior (Upper / Lower)',
    tag: '2 Treinos',
    description: 'Treino A com todos os membros superiores e Treino B focado em inferiores e glúteos.',
    routines: [
      POPULAR_ROUTINE_PRESETS[3], // Upper
      POPULAR_ROUTINE_PRESETS[4]  // Lower
    ]
  },
  {
    id: 'folder-abcd-hypertrophy',
    title: 'Divisão ABCD (Hipertrofia 4 Dias)',
    tag: '4 Treinos',
    description: 'Divisão balanceada com Peito/Tríceps, Costas/Bíceps, Pernas Completo e Ombros/Braços.',
    routines: [
      {
        id: 'preset-abcd-chest-triceps',
        title: 'Treino A — Peito & Tríceps',
        subtitle: 'Supinos e isoladores de tríceps',
        tag: 'ABCD',
        description: 'Foco total no desenvolvimento peitoral e cabeças do tríceps.',
        exercises: [
          { exercise_template_id: 'bench-press-barbell', title: 'Supino Reto com Barra', setsCount: 3, reps: 10, weightKg: 20 },
          { exercise_template_id: 'incline-dumbbell-press', title: 'Supino Inclinado com Halteres', setsCount: 3, reps: 10, weightKg: 14 },
          { exercise_template_id: 'triceps-pushdown-rope', title: 'Tríceps Pulley com Corda', setsCount: 3, reps: 12, weightKg: 15 },
          { exercise_template_id: 'triceps-skullcrusher-ez-bar', title: 'Tríceps Testa com Barra W (Skullcrusher)', setsCount: 3, reps: 10, weightKg: 15 }
        ]
      },
      {
        id: 'preset-abcd-back-biceps',
        title: 'Treino B — Costas & Bíceps',
        subtitle: 'Puxadas, remadas e roscas',
        tag: 'ABCD',
        description: 'Espessura e largura de costas combinadas com pico de bíceps.',
        exercises: [
          { exercise_template_id: 'lat-pulldown', title: 'Puxada Frontal na Polia (Lat Pulldown)', setsCount: 3, reps: 10, weightKg: 20 },
          { exercise_template_id: 'barbell-row', title: 'Remada Curvada com Barra', setsCount: 3, reps: 10, weightKg: 20 },
          { exercise_template_id: 'biceps-curl-barbell-ez', title: 'Rosca Direta (Barra W / EZ)', setsCount: 3, reps: 10, weightKg: 15 },
          { exercise_template_id: 'biceps-hammer-curl-dumbbell', title: 'Rosca Martelo com Halteres', setsCount: 3, reps: 12, weightKg: 10 }
        ]
      },
      {
        id: 'preset-abcd-legs',
        title: 'Treino C — Pernas Completo',
        subtitle: 'Quadríceps, posterior e panturrilha',
        tag: 'ABCD',
        description: 'Membros inferiores completos com agachamento livre e leg press.',
        exercises: [
          { exercise_template_id: 'squat-barbell', title: 'Agachamento Livre com Barra (Back Squat)', setsCount: 3, reps: 10, weightKg: 20 },
          { exercise_template_id: 'leg-press', title: 'Leg Press 45º', setsCount: 3, reps: 10, weightKg: 40 },
          { exercise_template_id: 'leg-extension', title: 'Cadeira Extensora', setsCount: 3, reps: 12, weightKg: 20 },
          { exercise_template_id: 'lying-leg-curl-machine', title: 'Mesa Flexora / Flexor Deitado', setsCount: 3, reps: 12, weightKg: 20 },
          { exercise_template_id: 'standing-calf-raise', title: 'Gêmeos em Pé (Elevação de Calcanhares)', setsCount: 3, reps: 15, weightKg: 20 }
        ]
      },
      {
        id: 'preset-abcd-shoulders-arms',
        title: 'Treino D — Ombros & Braços',
        subtitle: 'Deltoides, trapézio e super-série de braço',
        tag: 'ABCD',
        description: 'Desenvolvimento militar, elevação lateral e isolamento de braço.',
        exercises: [
          { exercise_template_id: 'overhead-press-barbell', title: 'Desenvolvimento Militar Overhead Press (OHP)', setsCount: 3, reps: 10, weightKg: 20 },
          { exercise_template_id: 'lateral-raise-dumbbell', title: 'Elevação Lateral com Halteres', setsCount: 3, reps: 12, weightKg: 8 },
          { exercise_template_id: 'biceps-preacher-curl-ez-bar', title: 'Rosca Scott com Barra W (Preacher Curl)', setsCount: 3, reps: 10, weightKg: 15 },
          { exercise_template_id: 'triceps-pushdown-rope', title: 'Tríceps Pulley com Corda', setsCount: 3, reps: 12, weightKg: 15 }
        ]
      }
    ]
  },
  {
    id: 'folder-female-glutes',
    title: 'Divisão Feminina (Glúteo & Pernas)',
    tag: '3 Treinos',
    description: 'Foco prioritário em glúteos, quadríceps, posterior e definição de superiores.',
    routines: [
      {
        id: 'preset-fem-glutes-hamstrings',
        title: 'Treino A — Glúteos & Posterior de Coxa',
        subtitle: 'Elevação pélvica, búlgaro e mesa flexora',
        tag: 'Feminino',
        description: 'Hipertrofia de glúteo máximo e posterior de coxa.',
        exercises: [
          { exercise_template_id: 'hip-thrust-barbell', title: 'Elevação Pélvica com Barra (Hip Thrust)', setsCount: 3, reps: 10, weightKg: 20 },
          { exercise_template_id: 'bulgarian-split-squat', title: 'Agachamento Búlgaro com Halteres', setsCount: 3, reps: 10, weightKg: 10 },
          { exercise_template_id: 'stiff-deadlift-barbell', title: 'Stiff com Barra (Stiff-Legged Deadlift)', setsCount: 3, reps: 10, weightKg: 20 },
          { exercise_template_id: 'abductor-machine', title: 'Cadeira Abdutora', setsCount: 3, reps: 15, weightKg: 20 }
        ]
      },
      {
        id: 'preset-fem-upper-core',
        title: 'Treino B — Membros Superiores & Abdômen',
        subtitle: 'Costas, ombros e postura',
        tag: 'Feminino',
        description: 'Tonificação de costas, deltoides e braços com abdômen.',
        exercises: [
          { exercise_template_id: 'lat-pulldown', title: 'Puxada Frontal na Polia (Lat Pulldown)', setsCount: 3, reps: 10, weightKg: 20 },
          { exercise_template_id: 'seated-dumbbell-shoulder-press', title: 'Desenvolvimento com Halteres Sentado', setsCount: 3, reps: 10, weightKg: 8 },
          { exercise_template_id: 'lateral-raise-dumbbell', title: 'Elevação Lateral com Halteres', setsCount: 3, reps: 12, weightKg: 5 },
          { exercise_template_id: 'triceps-pushdown-rope', title: 'Tríceps Pulley com Corda', setsCount: 3, reps: 12, weightKg: 12 }
        ]
      },
      {
        id: 'preset-fem-quads-calves',
        title: 'Treino C — Quadríceps & Panturrilhas',
        subtitle: 'Agachamento, leg press e extensora',
        tag: 'Feminino',
        description: 'Definição e volume de coxas e panturrilhas.',
        exercises: [
          { exercise_template_id: 'leg-press', title: 'Leg Press 45º', setsCount: 3, reps: 12, weightKg: 40 },
          { exercise_template_id: 'leg-extension', title: 'Cadeira Extensora', setsCount: 3, reps: 12, weightKg: 20 },
          { exercise_template_id: 'seated-calf-raise-machine', title: 'Gêmeos Sentado na Máquina (Seated Calf Raise)', setsCount: 3, reps: 15, weightKg: 20 }
        ]
      }
    ]
  }
];
