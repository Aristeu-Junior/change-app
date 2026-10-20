import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart3,
  Trophy,
  Scale,
  Flame,
  Dumbbell,
  Plus,
  TrendingUp,
  Shield,
  Crown,
  Users,
  RefreshCw,
  Award,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { displayWeight } from '../../utils/calc';
import { BodyMeasurement, PersonalRecord, Workout } from '../../types';
import {
  calculateAthleteOverallRank,
  calculateMuscleGroupRanks,
  calculateExerciseRank,
  RankInfo
} from '../../utils/hevyRank';
import { fetchCloudLeaderboard, LeaderboardEntry } from '../../services/cloudSync';

// Emblema Hexagonal Geométrico no estilo Hevy Rank
const HevyRankEmblem: React.FC<{ rank: RankInfo; size?: 'sm' | 'md' | 'lg' }> = ({
  rank,
  size = 'md'
}) => {
  const dims =
    size === 'lg' ? 'w-16 h-16' : size === 'md' ? 'w-11 h-11' : 'w-8 h-8';
  const textSize =
    size === 'lg' ? 'text-xs' : size === 'md' ? 'text-[10px]' : 'text-[8px]';

  const isInverted = rank.tierId === 'diamond' || rank.tierId === 'titan';

  return (
    <div
      className={`${dims} rounded-2xl ${rank.badgeStyle.bg} border-2 ${rank.badgeStyle.border} flex flex-col items-center justify-center shrink-0 shadow-lg relative overflow-hidden`}
    >
      <Shield
        className={`${
          size === 'lg' ? 'w-7 h-7' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4'
        } ${isInverted ? 'text-black fill-black/15' : 'text-white fill-white/10'}`}
      />
      {rank.subTier && (
        <span
          className={`${textSize} font-black tracking-tighter leading-none mt-0.5 ${
            isInverted ? 'text-black' : 'text-white'
          }`}
        >
          {rank.subTier}
        </span>
      )}
    </div>
  );
};

export const AnalyticsView: React.FC = () => {
  const {
    workouts,
    personalRecords,
    measurements,
    saveMeasurement,
    settings,
    exercises,
    currentUser
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'my_rank' | 'leaderboard' | 'stats'>('my_rank');
  const [leaderboardFilter, setLeaderboardFilter] = useState<'score' | 'workouts' | 'exercise'>(
    'score'
  );
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('bench-press-barbell');
  const [cloudEntries, setCloudEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  const [isAddingMeasurement, setIsAddingMeasurement] = useState(false);
  const [measWeight, setMeasWeight] = useState<string>('');
  const [measFat, setMeasFat] = useState<string>('');
  const [measWaist, setMeasWaist] = useState<string>('');
  const [measArms, setMeasArms] = useState<string>('');

  // Carrega dados do Ranking de Amigos da nuvem
  const loadLeaderboard = async () => {
    setIsLoadingLeaderboard(true);
    const data = await fetchCloudLeaderboard();
    setCloudEntries(data);
    setIsLoadingLeaderboard(false);
  };

  useEffect(() => {
    loadLeaderboard();
  }, [workouts.length, currentUser.email]);

  // Calcula Rank Geral e por Músculo do Usuário Atual
  const overallRank = useMemo(
    () => calculateAthleteOverallRank(workouts, personalRecords),
    [workouts, personalRecords]
  );

  const muscleRanks = useMemo(
    () => calculateMuscleGroupRanks(workouts, personalRecords, exercises),
    [workouts, personalRecords, exercises]
  );

  const exerciseRanksList = useMemo(() => {
    return Object.values(personalRecords)
      .map((pr) => ({
        pr,
        rank: calculateExerciseRank(pr.exercise_title, pr.max_weight_kg)
      }))
      .sort((a, b) => b.rank.score - a.rank.score);
  }, [personalRecords]);

  // Processa a lista consolidada do Ranking de Amigos (Aristeu, Vitória e Amigos)
  const rankedAthletes = useMemo(() => {
    const byEmail = new Map<
      string,
      {
        name: string;
        email: string;
        workouts: Workout[];
        prs: Record<string, PersonalRecord>;
      }
    >();

    cloudEntries.forEach((entry) => {
      const wList = Array.isArray(entry.workouts) ? entry.workouts : [];
      const prMap = entry.personal_records || {};
      byEmail.set(entry.email.toLowerCase(), {
        name: entry.name,
        email: entry.email.toLowerCase(),
        workouts: wList,
        prs: prMap
      });
    });

    // Garante que os dados locais em tempo real do usuário logado estejam atualizados no ranking
    byEmail.set(currentUser.email.toLowerCase(), {
      name: currentUser.name,
      email: currentUser.email.toLowerCase(),
      workouts,
      prs: personalRecords
    });

    const list = Array.from(byEmail.values()).map((item) => {
      const rankInfo = calculateAthleteOverallRank(item.workouts, item.prs);
      const totalSetsCount = item.workouts.reduce((acc, w) => acc + (w.total_sets || 0), 0);
      const exPr = item.prs[selectedExerciseId];
      const exerciseWeight = exPr ? exPr.max_weight_kg : 0;
      const exerciseReps = exPr ? exPr.max_reps : 0;

      return {
        ...item,
        rankInfo,
        workoutsCount: item.workouts.length,
        totalSetsCount,
        exerciseWeight,
        exerciseReps
      };
    });

    if (leaderboardFilter === 'workouts') {
      return list.sort(
        (a, b) => b.workoutsCount - a.workoutsCount || b.rankInfo.score - a.rankInfo.score
      );
    }
    if (leaderboardFilter === 'exercise') {
      return list.sort(
        (a, b) => b.exerciseWeight - a.exerciseWeight || b.exerciseReps - a.exerciseReps
      );
    }
    return list.sort((a, b) => b.rankInfo.score - a.rankInfo.score);
  }, [cloudEntries, currentUser, workouts, personalRecords, leaderboardFilter, selectedExerciseId]);

  const totalVolume = useMemo(() => {
    return workouts.reduce((acc, w) => acc + (w.total_volume_kg || 0), 0);
  }, [workouts]);

  const totalSets = useMemo(() => {
    return workouts.reduce((acc, w) => acc + (w.total_sets || 0), 0);
  }, [workouts]);

  const muscleDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;

    workouts.forEach((w) => {
      w.exercises.forEach((ex) => {
        const completedCount = ex.sets.filter((s) => s.completed).length;
        if (completedCount > 0) {
          const muscle = ex.title.toLowerCase();
          let cat = 'Outros';
          if (
            muscle.includes('supino') ||
            muscle.includes('peito') ||
            muscle.includes('crucifixo') ||
            muscle.includes('flexão')
          ) {
            cat = 'Peito';
          } else if (
            muscle.includes('terra') ||
            muscle.includes('puxada') ||
            muscle.includes('remada') ||
            muscle.includes('barra fixa')
          ) {
            cat = 'Costas';
          } else if (
            muscle.includes('desenvolvimento') ||
            muscle.includes('elevação') ||
            muscle.includes('ombro')
          ) {
            cat = 'Ombros';
          } else if (
            muscle.includes('rosca') ||
            muscle.includes('tríceps') ||
            muscle.includes('bíceps')
          ) {
            cat = 'Braços';
          } else if (
            muscle.includes('agachamento') ||
            muscle.includes('leg') ||
            muscle.includes('extensora') ||
            muscle.includes('stiff') ||
            muscle.includes('panturrilha')
          ) {
            cat = 'Pernas';
          } else if (muscle.includes('prancha') || muscle.includes('abdominal')) {
            cat = 'Abdômen';
          }

          counts[cat] = (counts[cat] || 0) + completedCount;
          total += completedCount;
        }
      });
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [workouts]);

  const handleSaveMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];
    const m: BodyMeasurement = {
      date: today,
      weight_kg: measWeight ? parseFloat(measWeight) : null,
      fat_percent: measFat ? parseFloat(measFat) : null,
      waist_cm: measWaist ? parseFloat(measWaist) : null,
      arms_cm: measArms ? parseFloat(measArms) : null
    };

    saveMeasurement(m);
    setIsAddingMeasurement(false);
    setMeasWeight('');
    setMeasFat('');
    setMeasWaist('');
    setMeasArms('');
  };

  const prList = Object.values(personalRecords);

  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-28 space-y-4 text-white">
      {/* Topo */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Rank & Evolução</h1>
          <p className="text-xs text-zinc-400">
            Patentes de força estilo Hevy, Ranking de Amigos & PRs
          </p>
        </div>
        <HevyRankEmblem rank={overallRank} size="sm" />
      </div>

      {/* Seletor de Sub-Abas: Meu Rank | Ranking Amigos | Estatísticas */}
      <div className="grid grid-cols-3 gap-1.5 bg-[#141416] p-1 rounded-2xl border border-[#27272a]">
        <button
          onClick={() => setActiveSubTab('my_rank')}
          className={`py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'my_rank'
              ? 'bg-white text-black shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Meu Rank</span>
        </button>

        <button
          onClick={() => setActiveSubTab('leaderboard')}
          className={`py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'leaderboard'
              ? 'bg-white text-black shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Crown className="w-3.5 h-3.5" />
          <span>Ranking</span>
        </button>

        <button
          onClick={() => setActiveSubTab('stats')}
          className={`py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'stats'
              ? 'bg-white text-black shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Métricas</span>
        </button>
      </div>

      {/* =========================================================
          ABA 1: MEU RANK (SISTEMA DE PATENTES ESTILO HEVY)
         ========================================================= */}
      {activeSubTab === 'my_rank' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Card Hero da Patente Geral do Atleta */}
          <div className="bg-[#141416] border border-[#27272a] rounded-2xl p-4 shadow-xl space-y-4">
            <div className="flex items-center gap-4">
              <HevyRankEmblem rank={overallRank} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    Patente Geral • {currentUser.name}
                  </span>
                  <span className="text-xs font-black text-white">{overallRank.score} PTS</span>
                </div>
                <h2 className="text-xl font-black text-white mt-0.5">{overallRank.fullLabel}</h2>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {overallRank.nextTierLabel
                    ? `Faltam ${Math.max(0, (overallRank.nextTargetValue || 0) - overallRank.score)} pts para ${overallRank.nextTierLabel}`
                    : 'Você atingiu a patente máxima da academia!'}
                </p>
              </div>
            </div>

            {/* Barra de Progresso do Rank */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold text-zinc-400">
                <span>Progresso da Patente</span>
                <span className="text-white">{overallRank.progressPercent}%</span>
              </div>
              <div className="w-full h-2.5 bg-[#1c1c1f] border border-[#27272a] rounded-full overflow-hidden">
                <div
                  style={{ width: `${overallRank.progressPercent}%` }}
                  className="h-full bg-white rounded-full transition-all duration-500"
                />
              </div>
            </div>

            {/* Escala de Patentes Hevy */}
            <div className="pt-2 border-t border-[#27272a] flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-zinc-500 overflow-x-auto gap-1 no-scrollbar">
              {['Ferro', 'Bronze', 'Prata', 'Ouro', 'Platina', 'Diamante', 'Titã'].map((tName) => {
                const isActive = overallRank.tierName === tName;
                return (
                  <span
                    key={tName}
                    className={`px-2 py-1 rounded-lg whitespace-nowrap ${
                      isActive ? 'bg-white text-black font-black' : 'bg-[#18181b] text-zinc-500'
                    }`}
                  >
                    {tName}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Rank por Grupo Muscular (8 Grupos Estilo Hevy) */}
          <div className="bg-[#141416] border border-[#27272a] rounded-2xl p-4 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-300">
                Rank por Grupo Muscular
              </span>
              <span className="text-[10px] text-zinc-500 font-bold">8 grupos</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {muscleRanks.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-xl bg-[#18181b] border border-[#27272a] flex items-center gap-3"
                >
                  <HevyRankEmblem rank={m.rank} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white truncate">{m.label}</span>
                      <span className="text-[11px] font-black text-white">{m.rank.fullLabel}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-0.5">
                      <span className="truncate">
                        {m.bestWeightKg > 0
                          ? `Melhor: ${m.bestWeightKg} kg (${m.bestExerciseTitle})`
                          : `${m.setsCompleted} séries concluídas`}
                      </span>
                      <span className="shrink-0 ml-2">{m.setsCompleted} séries</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#121214] rounded-full overflow-hidden mt-1.5">
                      <div
                        style={{ width: `${m.rank.progressPercent}%` }}
                        className="h-full bg-white rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rank por Exercício & Próxima Meta de Carga */}
          <div className="bg-[#141416] border border-[#27272a] rounded-2xl p-4 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-300">
                Rank nos Exercícios & Próxima Meta
              </span>
              <span className="text-[10px] text-zinc-500 font-bold">
                {exerciseRanksList.length} exercícios
              </span>
            </div>

            {exerciseRanksList.length === 0 ? (
              <p className="text-xs text-zinc-500 italic py-2">
                Conclua um treino registrando o peso (ex: 20 kg) para desbloquear suas patentes por exercício!
              </p>
            ) : (
              <div className="space-y-2">
                {exerciseRanksList.map(({ pr, rank }) => (
                  <div
                    key={pr.exercise_template_id}
                    className="p-3 rounded-xl bg-[#18181b] border border-[#27272a] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <HevyRankEmblem rank={rank} size="sm" />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">
                          {pr.exercise_title}
                        </h4>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">
                          Carga Atual: <strong className="text-white">{pr.max_weight_kg} kg</strong> ({pr.max_reps} reps)
                        </span>
                        {rank.nextTierLabel && rank.nextTargetValue && (
                          <span className="text-[10px] text-zinc-500 block">
                            Próximo Rank ({rank.nextTierLabel}):{' '}
                            <strong className="text-zinc-300">{rank.nextTargetValue} kg</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="px-2 py-1 rounded-lg bg-[#121214] border border-[#27272a] text-[10px] font-black text-white block">
                        {rank.fullLabel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          ABA 2: RANKING DE AMIGOS (LEADERBOARD NA NUVEM)
         ========================================================= */}
      {activeSubTab === 'leaderboard' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Filtro do Ranking */}
          <div className="bg-[#141416] border border-[#27272a] rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-white" />
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  Ranking Geral (Nuvem)
                </span>
              </div>
              <button
                onClick={loadLeaderboard}
                disabled={isLoadingLeaderboard}
                className="px-2.5 py-1 rounded-lg bg-[#18181b] hover:bg-zinc-800 border border-[#27272a] text-[10px] font-bold text-zinc-300 flex items-center gap-1 transition"
              >
                <RefreshCw
                  className={`w-3 h-3 ${isLoadingLeaderboard ? 'animate-spin' : ''}`}
                />
                <span>Atualizar</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => setLeaderboardFilter('score')}
                className={`py-2 px-2 rounded-xl text-[11px] font-black transition ${
                  leaderboardFilter === 'score'
                    ? 'bg-white text-black'
                    : 'bg-[#18181b] text-zinc-400 border border-[#27272a]'
                }`}
              >
                Por Patente (PTS)
              </button>
              <button
                onClick={() => setLeaderboardFilter('workouts')}
                className={`py-2 px-2 rounded-xl text-[11px] font-black transition ${
                  leaderboardFilter === 'workouts'
                    ? 'bg-white text-black'
                    : 'bg-[#18181b] text-zinc-400 border border-[#27272a]'
                }`}
              >
                Mais Treinos
              </button>
              <button
                onClick={() => setLeaderboardFilter('exercise')}
                className={`py-2 px-2 rounded-xl text-[11px] font-black transition ${
                  leaderboardFilter === 'exercise'
                    ? 'bg-white text-black'
                    : 'bg-[#18181b] text-zinc-400 border border-[#27272a]'
                }`}
              >
                Por Exercício
              </button>
            </div>

            {/* Seletor de Exercício quando no modo "Por Exercício" */}
            {leaderboardFilter === 'exercise' && (
              <div className="pt-1">
                <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                  Comparar Carga Real (kg) no Exercício:
                </label>
                <select
                  value={selectedExerciseId}
                  onChange={(e) => setSelectedExerciseId(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-white"
                >
                  {exercises.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Lista Classificada dos Atletas (Aristeu, Vitória e Amigos) */}
          <div className="space-y-2">
            {rankedAthletes.map((athlete, idx) => {
              const position = idx + 1;
              const isMe = athlete.email.toLowerCase() === currentUser.email.toLowerCase();

              return (
                <div
                  key={athlete.email}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition ${
                    isMe
                      ? 'bg-[#1c1c1f] border-white shadow-md'
                      : 'bg-[#141416] border-[#27272a]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Posição no Ranking */}
                    <div
                      className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                        position === 1
                          ? 'bg-white text-black shadow-sm'
                          : position === 2
                          ? 'bg-zinc-300 text-black'
                          : position === 3
                          ? 'bg-zinc-600 text-white'
                          : 'bg-[#18181b] text-zinc-400 border border-[#27272a]'
                      }`}
                    >
                      {position}º
                    </div>

                    <HevyRankEmblem rank={athlete.rankInfo} size="sm" />

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-white truncate">
                          {athlete.name}
                        </span>
                        {isMe && (
                          <span className="px-1.5 py-0.2 rounded bg-white text-black text-[9px] font-black uppercase">
                            Você
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-400 block">
                        Patente: <strong className="text-zinc-200">{athlete.rankInfo.fullLabel}</strong> •{' '}
                        {athlete.workoutsCount} treinos
                      </span>
                    </div>
                  </div>

                  {/* Valor de Destaque conforme o filtro */}
                  <div className="text-right shrink-0">
                    {leaderboardFilter === 'score' && (
                      <>
                        <span className="text-sm font-black text-white block">
                          {athlete.rankInfo.score} PTS
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {athlete.totalSetsCount} séries
                        </span>
                      </>
                    )}
                    {leaderboardFilter === 'workouts' && (
                      <>
                        <span className="text-sm font-black text-white block">
                          {athlete.workoutsCount} treinos
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {athlete.totalSetsCount} séries
                        </span>
                      </>
                    )}
                    {leaderboardFilter === 'exercise' && (
                      <>
                        <span className="text-sm font-black text-white block">
                          {athlete.exerciseWeight > 0 ? `${athlete.exerciseWeight} kg` : '—'}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {athlete.exerciseReps > 0 ? `${athlete.exerciseReps} reps` : 'Sem registro'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================
          ABA 3: ESTATÍSTICAS & MEDIDAS CORPORAIS
         ========================================================= */}
      {activeSubTab === 'stats' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Cards de Resumo */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-[#141416] border border-[#27272a] p-3.5 rounded-2xl flex flex-col items-center text-center">
              <Flame className="w-5 h-5 text-white mb-1" />
              <span className="text-[10px] uppercase font-bold text-zinc-400">Treinos</span>
              <span className="text-base font-black text-white">{workouts.length}</span>
            </div>

            <div className="bg-[#141416] border border-[#27272a] p-3.5 rounded-2xl flex flex-col items-center text-center">
              <Dumbbell className="w-5 h-5 text-white mb-1" />
              <span className="text-[10px] uppercase font-bold text-zinc-400">Carga</span>
              <span className="text-base font-black text-white">
                {displayWeight(totalVolume, settings.weight_unit)}
              </span>
            </div>

            <div className="bg-[#141416] border border-[#27272a] p-3.5 rounded-2xl flex flex-col items-center text-center">
              <TrendingUp className="w-5 h-5 text-white mb-1" />
              <span className="text-[10px] uppercase font-bold text-zinc-400">Séries</span>
              <span className="text-base font-black text-white">{totalSets}</span>
            </div>
          </div>

          {/* Gráfico de Distribuição Muscular */}
          <div className="bg-[#141416] border border-[#27272a] rounded-2xl p-4 shadow-md space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
              <div className="flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-white" />
                <span>Foco Muscular Treinado</span>
              </div>
              <span className="text-zinc-500 text-[11px] font-semibold">
                {totalSets} séries totais
              </span>
            </div>

            {muscleDistribution.length === 0 ? (
              <p className="text-xs text-zinc-500 italic py-2">
                Complete seus treinos para visualizar o equilíbrio da sua divisão
              </p>
            ) : (
              <div className="space-y-2 pt-1">
                {muscleDistribution.map((m) => (
                  <div key={m.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-300">{m.name}</span>
                      <span className="text-white font-black">
                        {m.percent}% ({m.count} séries)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${m.percent}%` }}
                        className="h-full bg-white rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Vitrine de Recordes Pessoais (PRs) */}
          <div className="bg-[#141416] border border-[#27272a] rounded-2xl p-4 shadow-md space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-white" />
                <span>Recordes Pessoais (PR)</span>
              </div>
              <span className="text-white text-xs font-black">{prList.length} PRs</span>
            </div>

            {prList.length === 0 ? (
              <p className="text-xs text-zinc-500 italic py-2">
                Seus recordes de carga e repetições máximas aparecerão aqui automaticamente!
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                {prList.map((pr) => (
                  <div
                    key={pr.exercise_template_id}
                    className="bg-[#18181b] p-3 rounded-xl border border-[#27272a] flex flex-col justify-between"
                  >
                    <span className="text-xs font-bold text-white line-clamp-1">
                      {pr.exercise_title}
                    </span>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-sm font-black text-white">
                        {displayWeight(pr.max_weight_kg, settings.weight_unit)}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-bold">
                        {pr.max_reps} reps
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Registro de Medidas Corporais */}
          <div className="bg-[#141416] border border-[#27272a] rounded-2xl p-4 shadow-md space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
              <div className="flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-white" />
                <span>Medidas Corporais & Peso</span>
              </div>
              <button
                onClick={() => setIsAddingMeasurement(!isAddingMeasurement)}
                className="text-xs text-white hover:underline flex items-center gap-1 font-bold"
              >
                <Plus className="w-3.5 h-3.5" /> Registrar Hoje
              </button>
            </div>

            {isAddingMeasurement && (
              <form
                onSubmit={handleSaveMeasurement}
                className="bg-[#18181b] p-3 rounded-xl border border-[#27272a] space-y-3 animate-in fade-in duration-100"
              >
                <span className="text-xs font-bold text-white block">Adicionar Nova Medição</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Peso Corporal (kg)"
                    value={measWeight}
                    onChange={(e) => setMeasWeight(e.target.value)}
                    className="bg-[#121214] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Gordura Corporal (%)"
                    value={measFat}
                    onChange={(e) => setMeasFat(e.target.value)}
                    className="bg-[#121214] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Cintura (cm)"
                    value={measWaist}
                    onChange={(e) => setMeasWaist(e.target.value)}
                    className="bg-[#121214] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Braço Contraído (cm)"
                    value={measArms}
                    onChange={(e) => setMeasArms(e.target.value)}
                    className="bg-[#121214] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsAddingMeasurement(false)}
                    className="px-3 py-1 bg-[#121214] text-zinc-400 text-xs rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-white text-black font-black text-xs rounded-lg"
                  >
                    Salvar Medida
                  </button>
                </div>
              </form>
            )}

            {measurements.length === 0 ? (
              <p className="text-xs text-zinc-500 italic py-1">
                Acompanhe seu peso e evolução física ao longo dos meses
              </p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {measurements.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-[#18181b] rounded-xl border border-[#27272a] flex justify-between items-center text-xs"
                  >
                    <span className="font-semibold text-zinc-400">{m.date}</span>
                    <div className="flex gap-3 text-white font-bold">
                      {m.weight_kg && <span>{m.weight_kg} kg</span>}
                      {m.fat_percent && <span className="text-zinc-300">{m.fat_percent}% fat</span>}
                      {m.waist_cm && <span className="text-zinc-400">{m.waist_cm}cm cintura</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
