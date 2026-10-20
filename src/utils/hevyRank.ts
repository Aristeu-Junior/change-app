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
 */
const getExerciseWeightThresholds = (title: string): number[] => {
  const t = title.toLowerCase();
  // [Ferro, Bronze, Prata, Ouro, Platina, Diamante, Titã]
  if (t.includes('leg press')) {
    return [20, 40, 80, 120, 160, 220, 300];
  }
  if (
    t.includes('agachamento') ||
    t.includes('terra') ||
    t.includes('hip thrust') ||
    t.includes('elevação pélvica') ||
    t.includes('stiff') ||
    t.includes('rdl')
  ) {
    return [10, 20, 40, 60, 85, 110, 140];
  }
  if (
    t.includes('supino') ||
    t.includes('puxada') ||
    t.includes('remada') ||
    t.includes('desenvolvimento') ||
    t.includes('extensora') ||
    t.includes('flexora')
  ) {
    return [8, 15, 25, 40, 60, 80, 100];
  }
  // Isoladores, halteres, roscas, tríceps, elevações laterais, panturrilha
  return [5, 10, 15, 22, 30, 40, 50];
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

/**
 * Calcula o Rank Hevy de um exercício específico baseado na carga real máxima (kg)
 */
export const calculateExerciseRank = (
  exerciseTitle: string,
  maxWeightKg: number
): RankInfo => {
  if (!maxWeightKg || maxWeightKg <= 0) {
    const thresholds = getExerciseWeightThresholds(exerciseTitle);
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

  const thresholds = getExerciseWeightThresholds(exerciseTitle);
  let tierIdx = 0;

  for (let i = 0; i < thresholds.length; i++) {
    if (maxWeightKg >= thresholds[i]) {
      tierIdx = i;
    } else {
      break;
    }
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
 * Calcula a Patente Geral do Atleta (Hevy Overall Rank) combinando treinos, séries e recordes
 */
export const calculateAthleteOverallRank = (
  workouts: Workout[],
  personalRecords: Record<string, PersonalRecord>
): RankInfo => {
  const completedWorkouts = workouts.length;
  const totalSets = workouts.reduce((acc, w) => acc + (w.total_sets || 0), 0);
  const prValues = Object.values(personalRecords);

  const prScore = prValues.reduce((acc, pr) => {
    const exRank = calculateExerciseRank(pr.exercise_title, pr.max_weight_kg);
    return acc + Math.round(exRank.score * 0.35);
  }, 0);

  // Pontuação Hevy: cada treino = 50 pts, cada série concluída = 8 pts + bônus de força nos PRs
  const totalScore = completedWorkouts * 50 + totalSets * 8 + prScore;

  // Limiares de pontuação para cada patente geral
  const scoreThresholds = [50, 200, 500, 1000, 1800, 3000, 5000];

  if (totalScore < scoreThresholds[0]) {
    const prog = Math.min(99, Math.round((totalScore / scoreThresholds[0]) * 100));
    return {
      tierId: totalScore > 0 ? 'iron' : 'unranked',
      tierName: totalScore > 0 ? 'Ferro' : 'Sem Rank',
      subTier: totalScore > 0 ? 'I' : '',
      fullLabel: totalScore > 0 ? 'Ferro I' : 'Sem Rank',
      score: totalScore,
      progressPercent: prog,
      nextTierLabel: 'Bronze I',
      nextTargetValue: scoreThresholds[0],
      badgeStyle: totalScore > 0 ? TIER_STYLES.iron : TIER_STYLES.unranked
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
