import { Workout, PersonalRecord, ExerciseTemplate } from '../types';

export type RankTierId =
  | 'unranked'
  | 'iron'
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'titan';

export interface RankInfo {
  tierId: RankTierId;
  tierName: string;
  subTier: string;
  fullLabel: string;
  score: number;
  progressPercent: number;
  nextTierLabel: string | null;
  nextTargetValue: number | null;
  badgeStyle: {
    bg: string;
    border: string;
    text: string;
    accent: string;
  };
}

export interface MuscleRankItem {
  id: string;
  label: string;
  setsCompleted: number;
  bestWeightKg: number;
  bestExerciseTitle: string;
  rank: RankInfo;
}

export interface RankTierShowcase {
  id: RankTierId;
  name: string;
  subTiers: string;
  minXp: number;
  maxXp: number | null;
  approxWorkouts: string;
  description: string;
  badgeStyle: {
    bg: string;
    border: string;
    text: string;
    accent: string;
  };
  examples: {
    supino: string;
    agachamento: string;
    legPress: string;
    rosca: string;
  };
}

const TIER_STYLES: Record<
  RankTierId,
  { bg: string; border: string; text: string; accent: string }
> = {
  unranked: {
    bg: 'bg-[#18181b]',
    border: 'border-zinc-800',
    text: 'text-zinc-500',
    accent: '#52525b'
  },
  iron: {
    bg: 'bg-zinc-900',
    border: 'border-zinc-600',
    text: 'text-zinc-300',
    accent: '#a1a1aa'
  },
  bronze: {
    bg: 'bg-zinc-900',
    border: 'border-zinc-500',
    text: 'text-zinc-200',
    accent: '#d4d4d8'
  },
  silver: {
    bg: 'bg-zinc-800',
    border: 'border-zinc-400',
    text: 'text-white',
    accent: '#e4e4e7'
  },
  gold: {
    bg: 'bg-zinc-800',
    border: 'border-white',
    text: 'text-white',
    accent: '#ffffff'
  },
  platinum: {
    bg: 'bg-white/10',
    border: 'border-white',
    text: 'text-white',
    accent: '#ffffff'
  },
  diamond: {
    bg: 'bg-white',
    border: 'border-white',
    text: 'text-black',
    accent: '#000000'
  },
  titan: {
    bg: 'bg-white',
    border: 'border-white',
    text: 'text-black',
    accent: '#000000'
  }
};

/**
 * Define as metas de carga real (kg) de acordo com a categoria biomecânica do exercício (estilo Hevy)
 * Baseado nos padrões mundiais de força (Strength Standards) para atletas naturais.
 */
const getExerciseWeightThresholds = (title: string): number[] => {
  const t = title.toLowerCase();
  // [Ferro, Bronze, Prata, Ouro, Platina, Diamante, Titã]

  // Leg Press (Máquinas pesadas de perna)
  if (t.includes('leg press')) {
    return [40, 80, 140, 200, 280, 360, 440];
  }

  // Agachamento, Terra, Elevação Pélvica, Stiff, RDL (Grandes compostos de cadeia posterior/membros inferiores)
  if (
    t.includes('agachamento') ||
    t.includes('terra') ||
    t.includes('hip thrust') ||
    t.includes('elevação pélvica') ||
    t.includes('elevacao pelvica') ||
    t.includes('stiff') ||
    t.includes('rdl')
  ) {
    return [25, 50, 80, 110, 145, 180, 220];
  }

  // Supino, Remadas, Puxadas, Desenvolvimento (Compostos principais superiores)
  if (
    t.includes('supino') ||
    t.includes('puxada') ||
    t.includes('remada') ||
    t.includes('desenvolvimento') ||
    t.includes('extensora') ||
    t.includes('flexora')
  ) {
    return [15, 35, 55, 75, 95, 115, 135];
  }

  // Isoladores, halteres, roscas, tríceps, elevações laterais, panturrilha
  return [6, 12, 18, 26, 34, 42, 50];
};

const TIER_DEFINITIONS: { id: RankTierId; name: string }[] = [
  { id: 'iron', name: 'Ferro' },
  { id: 'bronze', name: 'Bronze' },
  { id: 'silver', name: 'Prata' },
  { id: 'gold', name: 'Ouro' },
  { id: 'platinum', name: 'Platina' },
  { id: 'diamond', name: 'Diamante' },
  { id: 'titan', name: 'Titã' }
];

export const ALL_RANKS_SHOWCASE: RankTierShowcase[] = [
  {
    id: 'unranked',
    name: 'Sem Rank',
    subTiers: 'Iniciante',
    minXp: 0,
    maxXp: 199,
    approxWorkouts: 'Primeiro treino',
    description: 'Início da jornada de treinos. Primeiros passos para construir disciplina física e hábito.',
    badgeStyle: TIER_STYLES.unranked,
    examples: {
      supino: '< 15 kg',
      agachamento: '< 25 kg',
      legPress: '< 40 kg',
      rosca: '< 6 kg'
    }
  },
  {
    id: 'iron',
    name: 'Ferro',
    subTiers: 'I • II • III',
    minXp: 200,
    maxXp: 999,
    approxWorkouts: '1 a 5 treinos',
    description: 'Fase de adaptação neural e aprendizado motor. Regularidade inicial e postura sendo consolidadas.',
    badgeStyle: TIER_STYLES.iron,
    examples: {
      supino: '15 - 34 kg',
      agachamento: '25 - 49 kg',
      legPress: '40 - 79 kg',
      rosca: '6 - 11 kg'
    }
  },
  {
    id: 'bronze',
    name: 'Bronze',
    subTiers: 'I • II • III',
    minXp: 1000,
    maxXp: 2999,
    approxWorkouts: '5 a 15 treinos (~1 mês)',
    description: 'Primeiro grande marco de consistência. As cargas aumentam e o corpo responde ao esforço regular.',
    badgeStyle: TIER_STYLES.bronze,
    examples: {
      supino: '35 - 54 kg',
      agachamento: '50 - 79 kg',
      legPress: '80 - 139 kg',
      rosca: '12 - 17 kg'
    }
  },
  {
    id: 'silver',
    name: 'Prata',
    subTiers: 'I • II • III',
    minXp: 3000,
    maxXp: 6999,
    approxWorkouts: '15 a 35 treinos (~2 a 3 meses)',
    description: 'Nível intermediário sólido. Mudanças visíveis na composição corporal e boa técnica nos exercícios.',
    badgeStyle: TIER_STYLES.silver,
    examples: {
      supino: '55 - 74 kg',
      agachamento: '80 - 109 kg',
      legPress: '140 - 199 kg',
      rosca: '18 - 25 kg'
    }
  },
  {
    id: 'gold',
    name: 'Ouro',
    subTiers: 'I • II • III',
    minXp: 7000,
    maxXp: 14999,
    approxWorkouts: '35 a 75 treinos (~6 meses)',
    description: 'Intermediário avançado. Domínio técnico expressivo, recuperação eficiente e disciplina inabalável.',
    badgeStyle: TIER_STYLES.gold,
    examples: {
      supino: '75 - 94 kg',
      agachamento: '110 - 144 kg',
      legPress: '200 - 279 kg',
      rosca: '26 - 33 kg'
    }
  },
  {
    id: 'platinum',
    name: 'Platina',
    subTiers: 'I • II • III',
    minXp: 15000,
    maxXp: 29999,
    approxWorkouts: '75 a 150 treinos (~1 ano)',
    description: 'Atleta dedicado de elite da academia. Cargas de respeito e físico atlético lapidado.',
    badgeStyle: TIER_STYLES.platinum,
    examples: {
      supino: '95 - 114 kg',
      agachamento: '145 - 179 kg',
      legPress: '280 - 359 kg',
      rosca: '34 - 41 kg'
    }
  },
  {
    id: 'diamond',
    name: 'Diamante',
    subTiers: 'I • II • III',
    minXp: 30000,
    maxXp: 59999,
    approxWorkouts: '150 a 300 treinos (~1.5 a 2 anos)',
    description: 'Super avançado de alta performance. Nível de força e maturidade muscular raro na maioria das academias.',
    badgeStyle: TIER_STYLES.diamond,
    examples: {
      supino: '115 - 134 kg',
      agachamento: '180 - 219 kg',
      legPress: '360 - 439 kg',
      rosca: '42 - 49 kg'
    }
  },
  {
    id: 'titan',
    name: 'Titã Elite',
    subTiers: 'Patente Máxima',
    minXp: 60000,
    maxXp: null,
    approxWorkouts: '300+ treinos (Veterano)',
    description: 'Patente lendária máxima da plataforma. Nível de atleta veterano, recordista e referência absoluta.',
    badgeStyle: TIER_STYLES.titan,
    examples: {
      supino: '135+ kg',
      agachamento: '220+ kg',
      legPress: '440+ kg',
      rosca: '50+ kg'
    }
  }
];

/**
 * Calcula o Rank Hevy de um exercício específico baseado na carga real máxima (kg)
 */
export const calculateExerciseRank = (
  exerciseTitle: string,
  maxWeightKg: number
): RankInfo => {
  const thresholds = getExerciseWeightThresholds(exerciseTitle);

  if (!maxWeightKg || maxWeightKg <= 0) {
    return {
      tierId: 'unranked',
      tierName: 'Sem Rank',
      subTier: '',
      fullLabel: 'Sem Rank',
      score: 0,
      progressPercent: 0,
      nextTierLabel: 'Ferro I',
      nextTargetValue: thresholds[0],
      badgeStyle: TIER_STYLES.unranked
    };
  }

  let tierIdx = -1;
  for (let i = 0; i < thresholds.length; i++) {
    if (maxWeightKg >= thresholds[i]) {
      tierIdx = i;
    } else {
      break;
    }
  }

  if (tierIdx === -1) {
    // Abaixo do primeiro limiar (Ferro)
    const progress = Math.min(99, Math.round((maxWeightKg / thresholds[0]) * 100));
    return {
      tierId: 'unranked',
      tierName: 'Sem Rank',
      subTier: '',
      fullLabel: 'Sem Rank',
      score: Math.round(progress * 0.5),
      progressPercent: progress,
      nextTierLabel: 'Ferro I',
      nextTargetValue: thresholds[0],
      badgeStyle: TIER_STYLES.unranked
    };
  }

  const currentTier = TIER_DEFINITIONS[tierIdx];
  const currentMin = thresholds[tierIdx];
  const nextMin = tierIdx < thresholds.length - 1 ? thresholds[tierIdx + 1] : null;
  const nextTier = tierIdx < thresholds.length - 1 ? TIER_DEFINITIONS[tierIdx + 1] : null;

  let progress = 100;
  let subTier = 'III';

  if (nextMin !== null) {
    const span = Math.max(1, nextMin - currentMin);
    const gained = Math.max(0, maxWeightKg - currentMin);
    progress = Math.min(99, Math.round((gained / span) * 100));
    if (progress < 34) subTier = 'I';
    else if (progress < 67) subTier = 'II';
    else subTier = 'III';
  } else {
    subTier = 'Elite';
  }

  const score = (tierIdx + 1) * 100 + Math.round(progress * 0.9);

  return {
    tierId: currentTier.id,
    tierName: currentTier.name,
    subTier,
    fullLabel: subTier === 'Elite' ? 'Titã Elite' : `${currentTier.name} ${subTier}`,
    score,
    progressPercent: progress,
    nextTierLabel: nextTier ? `${nextTier.name} I` : null,
    nextTargetValue: nextMin,
    badgeStyle: TIER_STYLES[currentTier.id]
  };
};

/**
 * Calcula a Patente Geral do Atleta (Hevy Overall Rank) combinando treinos, séries, volume e recordes
 * Balanceamento idêntico ao modelo de prestígio Hevy e RPG de progressão contínua a longo prazo.
 */
export const calculateAthleteOverallRank = (
  workouts: Workout[],
  personalRecords: Record<string, PersonalRecord>
): RankInfo => {
  const completedWorkouts = workouts.length;
  const totalSets = workouts.reduce((acc, w) => acc + (w.total_sets || 0), 0);
  const totalVolumeKg = workouts.reduce((acc, w) => acc + (w.total_volume_kg || 0), 0);

  // Pontos por PR atingido graduados pelo nível da carga
  const prScore = Object.values(personalRecords).reduce((acc, pr) => {
    const exRank = calculateExerciseRank(pr.exercise_title, pr.max_weight_kg);
    let pts = 0;
    switch (exRank.tierId) {
      case 'iron':
        pts = 15;
        break;
      case 'bronze':
        pts = 35;
        break;
      case 'silver':
        pts = 70;
        break;
      case 'gold':
        pts = 120;
        break;
      case 'platinum':
        pts = 180;
        break;
      case 'diamond':
        pts = 260;
        break;
      case 'titan':
        pts = 360;
        break;
      default:
        pts = 5;
    }
    return acc + pts;
  }, 0);

  // Bônus de consistência semanal (GymRats Streak): +50 pts se treinou 3x ou mais nos últimos 7 dias
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const weeklyWorkoutsCount = workouts.filter((w) => {
    const t = new Date(w.end_time || w.start_time).getTime();
    return now - t <= sevenDaysMs;
  }).length;
  const weeklyStreakBonus = weeklyWorkoutsCount >= 3 ? 50 : 0;

  // Pontuação Hevy calibrada:
  // - 80 pts por treino concluído
  // - 4 pts por série válida finalizada
  // - 1 pt a cada 250 kg de volume levantado
  // - Pontos de conquista por cada PR
  // - Bônus de consistência ativa
  const volumeBonus = Math.floor(totalVolumeKg / 250);
  const totalScore =
    completedWorkouts * 80 +
    totalSets * 4 +
    volumeBonus +
    prScore +
    weeklyStreakBonus;

  // Limiares de pontuação para cada patente geral (Curva progressiva sólida)
  // [Ferro, Bronze, Prata, Ouro, Platina, Diamante, Titã]
  const scoreThresholds = [200, 1000, 3000, 7000, 15000, 30000, 60000];

  if (totalScore < scoreThresholds[0]) {
    const prog = Math.min(99, Math.round((totalScore / scoreThresholds[0]) * 100));
    return {
      tierId: 'unranked',
      tierName: 'Sem Rank',
      subTier: '',
      fullLabel: 'Sem Rank',
      score: totalScore,
      progressPercent: prog,
      nextTierLabel: 'Ferro I',
      nextTargetValue: scoreThresholds[0],
      badgeStyle: TIER_STYLES.unranked
    };
  }

  let tierIdx = 0;
  for (let i = 0; i < scoreThresholds.length; i++) {
    if (totalScore >= scoreThresholds[i]) {
      tierIdx = i;
    } else {
      break;
    }
  }

  const currentTier = TIER_DEFINITIONS[tierIdx];
  const currentMin = scoreThresholds[tierIdx];
  const nextMin = tierIdx < scoreThresholds.length - 1 ? scoreThresholds[tierIdx + 1] : null;
  const nextTier = tierIdx < scoreThresholds.length - 1 ? TIER_DEFINITIONS[tierIdx + 1] : null;

  let progress = 100;
  let subTier = 'III';

  if (nextMin !== null) {
    const span = Math.max(1, nextMin - currentMin);
    const gained = Math.max(0, totalScore - currentMin);
    progress = Math.min(99, Math.round((gained / span) * 100));
    if (progress < 34) subTier = 'I';
    else if (progress < 67) subTier = 'II';
    else subTier = 'III';
  } else {
    subTier = 'Elite';
  }

  return {
    tierId: currentTier.id,
    tierName: currentTier.name,
    subTier,
    fullLabel: subTier === 'Elite' ? 'Titã Elite' : `${currentTier.name} ${subTier}`,
    score: totalScore,
    progressPercent: progress,
    nextTierLabel: nextTier ? `${nextTier.name} I` : null,
    nextTargetValue: nextMin,
    badgeStyle: TIER_STYLES[currentTier.id]
  };
};

/**
 * Calcula o Rank individual de cada um dos 8 grupos musculares principais (Estilo Hevy Body Rank)
 */
export const calculateMuscleGroupRanks = (
  workouts: Workout[],
  personalRecords: Record<string, PersonalRecord>,
  exercises: ExerciseTemplate[]
): MuscleRankItem[] => {
  const groups = [
    { id: 'peito', label: 'Peitoral', match: ['peito'] },
    { id: 'costas', label: 'Costas & Dorsal', match: ['costas', 'lats'] },
    { id: 'ombros', label: 'Ombros (Deltoides)', match: ['ombros'] },
    { id: 'biceps', label: 'Bíceps & Antebraço', match: ['biceps', 'antebraco'] },
    { id: 'triceps', label: 'Tríceps', match: ['triceps'] },
    { id: 'quadriceps', label: 'Quadríceps & Pernas', match: ['quadriceps', 'panturrilha'] },
    { id: 'gluteos', label: 'Glúteos & Posterior', match: ['gluteos', 'isquiotibiais'] },
    { id: 'abdomen', label: 'Abdômen & Core', match: ['abdomen'] }
  ];

  const exMap = new Map<string, ExerciseTemplate>();
  exercises.forEach((e) => exMap.set(e.id, e));

  return groups.map((g) => {
    let setsCompleted = 0;
    let bestWeightKg = 0;
    let bestExerciseTitle = 'Nenhum exercício concluído';

    workouts.forEach((w) => {
      w.exercises.forEach((we) => {
        const tpl = exMap.get(we.exercise_template_id);
        const primary = tpl?.primary_muscle_group || '';
        if (g.match.includes(primary)) {
          const validSets = we.sets.filter((s) => s.completed);
          setsCompleted += validSets.length;
        }
      });
    });

    Object.values(personalRecords).forEach((pr) => {
      const tpl = exMap.get(pr.exercise_template_id);
      const primary = tpl?.primary_muscle_group || '';
      if (g.match.includes(primary) && pr.max_weight_kg > bestWeightKg) {
        bestWeightKg = pr.max_weight_kg;
        bestExerciseTitle = pr.exercise_title;
      }
    });

    let rank = calculateExerciseRank(bestExerciseTitle, bestWeightKg);
    // Se fez séries de peso corporal/abdômen sem carga externa, calcula pelo volume de séries
    if (bestWeightKg === 0 && setsCompleted > 0) {
      rank = calculateExerciseRank('abdominal', setsCompleted * 2);
    }

    return {
      id: g.id,
      label: g.label,
      setsCompleted,
      bestWeightKg,
      bestExerciseTitle,
      rank
    };
  });
};
