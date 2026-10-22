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
  Share2,
  CheckCircle2,
  Folder,
  FolderPlus,
  KeyRound,
  Copy,
  Check,
  LogOut,
  Trash2,
  ExternalLink,
  Link2,
  MessageSquare
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { displayWeight } from '../../utils/calc';
import {
  BodyMeasurement,
  PersonalRecord,
  Workout,
  ChangeCompetition,
  CompetitionMetric
} from '../../types';
import {
  calculateAthleteOverallRank,
  calculateMuscleGroupRanks,
  calculateExerciseRank,
  RankInfo
} from '../../utils/hevyRank';
import {
  fetchUserCompetitions,
  fetchCompetitionLeaderboard,
  createCloudCompetition,
  joinCloudCompetition,
  leaveCloudCompetition,
  deleteCloudCompetition,
  getCompetitionByCodeOrId,
  LeaderboardEntry
} from '../../services/cloudSync';
import { ShareRankModal } from '../ShareRankModal';

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

// Conta treinos concluídos nos últimos 7 dias (Check-ins semanais estilo GymRats)
const countWeeklyWorkouts = (wList: Workout[]): number => {
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  return wList.filter((w) => {
    const t = new Date(w.end_time || w.start_time).getTime();
    return now - t <= sevenDaysMs;
  }).length;
};

// Extrai código de convite da URL (#comp=... ou ?comp=...)
const extractInviteCodeFromUrl = (): string | null => {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash || '';
  const hashMatch = hash.match(/#(?:comp|join-comp)=([A-Za-z0-9_-]+)/i);
  if (hashMatch) return hashMatch[1];

  const params = new URLSearchParams(window.location.search);
  const q = params.get('comp') || params.get('join-comp');
  if (q) return q;

  return null;
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

  const [activeSubTab, setActiveSubTab] = useState<'my_rank' | 'competitions' | 'stats'>('my_rank');
  const [leaderboardFilter, setLeaderboardFilter] = useState<
    'score' | 'weekly' | 'workouts' | 'volume' | 'exercise'
  >('score');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('bench-press-barbell');

  // Estado das Competições do Usuário (inicialmente zeradas)
  const [competitions, setCompetitions] = useState<ChangeCompetition[]>([]);
  const [selectedCompId, setSelectedCompId] = useState<string | null>(null);
  const [competitionEntries, setCompetitionEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoadingComps, setIsLoadingComps] = useState(false);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  // Modais de Competição
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Estados dos Formulários
  const [newCompName, setNewCompName] = useState('');
  const [newCompDesc, setNewCompDesc] = useState('');
  const [newCompMetric, setNewCompMetric] = useState<CompetitionMetric>('score');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [compActionError, setCompActionError] = useState<string | null>(null);
  const [compActionSuccess, setCompActionSuccess] = useState<string | null>(null);
  const [isSubmittingComp, setIsSubmittingComp] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Convite detectado na URL
  const [pendingInviteComp, setPendingInviteComp] = useState<ChangeCompetition | null>(null);

  // Medidas Corporais
  const [isAddingMeasurement, setIsAddingMeasurement] = useState(false);
  const [measWeight, setMeasWeight] = useState<string>('');
  const [measFat, setMeasFat] = useState<string>('');
  const [measWaist, setMeasWaist] = useState<string>('');
  const [measArms, setMeasArms] = useState<string>('');

  // 1. Carrega as competições privadas do usuário atual
  const loadUserCompetitions = async () => {
    if (!currentUser.email) return;
    setIsLoadingComps(true);
    const comps = await fetchUserCompetitions(currentUser.email);
    setCompetitions(comps);
    setIsLoadingComps(false);

    // Seleciona a primeira competição ou mantém a selecionada
    if (comps.length > 0) {
      if (!selectedCompId || !comps.some((c) => c.id === selectedCompId)) {
        setSelectedCompId(comps[0].id);
      }
    } else {
      setSelectedCompId(null);
      setCompetitionEntries([]);
    }
  };

  useEffect(() => {
    loadUserCompetitions();
  }, [currentUser.email]);

  // 2. Carrega a tabela de classificação da competição selecionada (apenas seus membros!)
  const loadSelectedCompLeaderboard = async () => {
    if (!selectedCompId) {
      setCompetitionEntries([]);
      return;
    }
    setIsLoadingLeaderboard(true);
    const entries = await fetchCompetitionLeaderboard(selectedCompId);
    setCompetitionEntries(entries);
    setIsLoadingLeaderboard(false);
  };

  useEffect(() => {
    if (selectedCompId) {
      loadSelectedCompLeaderboard();
    }
  }, [selectedCompId, workouts.length]);

  // 3. Checa convite na URL ao iniciar
  useEffect(() => {
    const code = extractInviteCodeFromUrl();
    if (code) {
      getCompetitionByCodeOrId(code).then((found) => {
        if (found) {
          setPendingInviteComp(found);
        }
      });
    }
  }, []);

  const selectedComp = useMemo(() => {
    return competitions.find((c) => c.id === selectedCompId) || null;
  }, [competitions, selectedCompId]);

  // Calcula Rank Geral e por Músculo do Usuário Atual (modelo Hevy aprimorado)
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

  // Processa a lista consolidada de atletas da competição ATUAL
  // Se não houver competição selecionada, a lista é vazia (ninguém vê ninguém globalmente)
  const rankedAthletes = useMemo(() => {
    if (!selectedComp) return [];

    const byEmail = new Map<
      string,
      {
        name: string;
        email: string;
        workouts: Workout[];
        prs: Record<string, PersonalRecord>;
      }
    >();

    competitionEntries.forEach((entry) => {
      const wList = Array.isArray(entry.workouts) ? entry.workouts : [];
      const prMap = entry.personal_records || {};
      byEmail.set(entry.email.toLowerCase(), {
        name: entry.name,
        email: entry.email.toLowerCase(),
        workouts: wList,
        prs: prMap
      });
    });

    // Garante que os dados mais recentes do próprio usuário estejam sincronizados no placar
    byEmail.set(currentUser.email.toLowerCase(), {
      name: currentUser.name,
      email: currentUser.email.toLowerCase(),
      workouts,
      prs: personalRecords
    });

    const list = Array.from(byEmail.values()).map((item) => {
      const rankInfo = calculateAthleteOverallRank(item.workouts, item.prs);
      const totalSetsCount = item.workouts.reduce((acc, w) => acc + (w.total_sets || 0), 0);
      const totalVolumeKg = item.workouts.reduce((acc, w) => acc + (w.total_volume_kg || 0), 0);
      const weeklyWorkouts = countWeeklyWorkouts(item.workouts);
      const exPr = item.prs[selectedExerciseId];
      const exerciseWeight = exPr ? exPr.max_weight_kg : 0;
      const exerciseReps = exPr ? exPr.max_reps : 0;

      return {
        ...item,
        rankInfo,
        workoutsCount: item.workouts.length,
        weeklyWorkouts,
        totalSetsCount,
        totalVolumeKg,
        exerciseWeight,
        exerciseReps
      };
    });

    if (leaderboardFilter === 'weekly') {
      return list.sort(
        (a, b) => b.weeklyWorkouts - a.weeklyWorkouts || b.rankInfo.score - a.rankInfo.score
      );
    }
    if (leaderboardFilter === 'workouts') {
      return list.sort(
        (a, b) => b.workoutsCount - a.workoutsCount || b.rankInfo.score - a.rankInfo.score
      );
    }
    if (leaderboardFilter === 'volume') {
      return list.sort(
        (a, b) => b.totalVolumeKg - a.totalVolumeKg || b.rankInfo.score - a.rankInfo.score
      );
    }
    if (leaderboardFilter === 'exercise') {
      return list.sort(
        (a, b) => b.exerciseWeight - a.exerciseWeight || b.exerciseReps - a.exerciseReps
      );
    }
    return list.sort((a, b) => b.rankInfo.score - a.rankInfo.score);
  }, [
    selectedComp,
    competitionEntries,
    currentUser,
    workouts,
    personalRecords,
    leaderboardFilter,
    selectedExerciseId
  ]);

  // Feed de Check-ins Recentes da Competição Selecionada
  const compFeed = useMemo(() => {
    if (!selectedComp) return [];
    const events: {
      athleteName: string;
      workoutTitle: string;
      date: string;
      loadKg: number;
      sets: number;
    }[] = [];

    rankedAthletes.forEach((ath) => {
      ath.workouts.slice(0, 5).forEach((w) => {
        events.push({
          athleteName: ath.name,
          workoutTitle: w.title,
          date: w.end_time || w.start_time,
          loadKg: w.total_volume_kg || 0,
          sets: w.total_sets || 0
        });
      });
    });

    return events
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
  }, [selectedComp, rankedAthletes]);

  const myPosition = useMemo(() => {
    const idx = rankedAthletes.findIndex(
      (a) => a.email.toLowerCase() === currentUser.email.toLowerCase()
    );
    return idx !== -1 ? idx + 1 : 1;
  }, [rankedAthletes, currentUser.email]);

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

  // Ações de Competições
  const handleCreateCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompName.trim()) return;

    setCompActionError(null);
    setIsSubmittingComp(true);

    const created = await createCloudCompetition({
      name: newCompName.trim(),
      description: newCompDesc.trim(),
      metric: newCompMetric,
      creatorEmail: currentUser.email,
      creatorName: currentUser.name
    });

    setIsSubmittingComp(false);

    if (created) {
      setNewCompName('');
      setNewCompDesc('');
      setIsCreateModalOpen(false);
      await loadUserCompetitions();
      setSelectedCompId(created.id);
      setIsInviteModalOpen(true);
    } else {
      setCompActionError('Erro ao criar competição na nuvem. Verifique sua conexão.');
    }
  };

  const handleJoinCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;

    setCompActionError(null);
    setIsSubmittingComp(true);

    // Extrai código se o usuário colou um link inteiro
    let cleanCode = joinCodeInput.trim();
    const linkMatch = cleanCode.match(/(?:comp|join-comp)=([A-Za-z0-9_-]+)/i);
    if (linkMatch) {
      cleanCode = linkMatch[1];
    }

    const joined = await joinCloudCompetition(cleanCode, currentUser.email);
    setIsSubmittingComp(false);

    if (joined) {
      setJoinCodeInput('');
      setIsJoinModalOpen(false);
      setCompActionSuccess(`Você entrou na competição "${joined.name}"!`);
      setTimeout(() => setCompActionSuccess(null), 3000);
      await loadUserCompetitions();
      setSelectedCompId(joined.id);
      setActiveSubTab('competitions');
    } else {
      setCompActionError('Código de convite não encontrado ou inválido.');
    }
  };

  const handleConfirmPendingInvite = async () => {
    if (!pendingInviteComp) return;
    setIsSubmittingComp(true);
    const joined = await joinCloudCompetition(pendingInviteComp.invite_code, currentUser.email);
    setIsSubmittingComp(false);

    if (joined) {
      setPendingInviteComp(null);
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', window.location.pathname);
      }
      await loadUserCompetitions();
      setSelectedCompId(joined.id);
      setActiveSubTab('competitions');
    } else {
      setCompActionError('Não foi possível entrar na competição convidada.');
    }
  };

  const handleLeaveCompetition = async (compId: string) => {
    if (!confirm('Deseja realmente sair desta competição?')) return;
    const ok = await leaveCloudCompetition(compId, currentUser.email);
    if (ok) {
      await loadUserCompetitions();
    }
  };

  const handleDeleteCompetition = async (compId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta competição para todos os participantes?')) return;
    const ok = await deleteCloudCompetition(compId);
    if (ok) {
      await loadUserCompetitions();
    }
  };

  const getShareLink = (code: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://aristeu-junior.github.io';
    const path = typeof window !== 'undefined' ? window.location.pathname : '/change-app/';
    return `${origin}${path}#comp=${code}`;
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
    } catch {
      // Ignore
    }
  };

  const handleCopyLink = async (code: string) => {
    try {
      await navigator.clipboard.writeText(getShareLink(code));
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Ignore
    }
  };

  const handleShareWhatsApp = (comp: ChangeCompetition) => {
    const link = getShareLink(comp.invite_code);
    const text = `🔥 *Bora competir comigo no CHANGE!* 🔥\n\nParticipe da minha competição privada: *${comp.name}*\n\nClique no link para entrar no grupo de treino:\n${link}\n\nOu use o código no app: *${comp.invite_code}*`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

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
    <div className="flex flex-col min-h-full view-container space-y-4 text-white">
      {/* Topo com Botão de Compartilhar Rank Estilo Hevy */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-black text-white leading-tight truncate">
            Rank & Competição
          </h1>
          <p className="text-[11px] sm:text-xs text-zinc-400 truncate">
            Patentes Hevy, Pastas de Competições Privadas & Links
          </p>
        </div>
        <button
          onClick={() => setIsShareModalOpen(true)}
          className="px-3 py-2 bg-white hover:bg-zinc-200 text-black rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition active:scale-95 shrink-0"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Compartilhar Rank</span>
        </button>
      </div>

      {compActionSuccess && (
        <div className="p-3 rounded-xl bg-zinc-900 border border-white/40 text-xs font-bold text-white flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-white" />
          <span>{compActionSuccess}</span>
        </div>
      )}

      {/* Seletor de Sub-Abas: Meu Rank | Competições Privadas | Métricas */}
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
          onClick={() => setActiveSubTab('competitions')}
          className={`py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'competitions'
              ? 'bg-white text-black shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Competições</span>
          {competitions.length > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                activeSubTab === 'competitions'
                  ? 'bg-black text-white'
                  : 'bg-zinc-800 text-zinc-300'
              }`}
            >
              {competitions.length}
            </span>
          )}
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
          ABA 1: MEU RANK (SISTEMA DE PATENTES PROGRESSIVO HEVY)
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
                    Patente Geral Hevy
                  </span>
                  <span className="text-xs font-black text-white">{overallRank.score} PTS</span>
                </div>
                <h2 className="text-xl font-black text-white mt-0.5">{overallRank.fullLabel}</h2>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {overallRank.nextTierLabel
                    ? `Faltam ${Math.max(
                        0,
                        (overallRank.nextTargetValue || 0) - overallRank.score
                      )} pts de treino para ${overallRank.nextTierLabel}`
                    : 'Você atingiu o nível de força máxima no aplicativo!'}
                </p>
              </div>
            </div>

            {/* Barra de Progresso do Rank */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold text-zinc-400">
                <span>Progresso para a próxima patente</span>
                <span className="text-white">{overallRank.progressPercent}%</span>
              </div>
              <div className="w-full h-2.5 bg-[#1c1c1f] border border-[#27272a] rounded-full overflow-hidden">
                <div
                  style={{ width: `${overallRank.progressPercent}%` }}
                  className="h-full bg-white rounded-full transition-all duration-500"
                />
              </div>
            </div>

            {/* Botão Rápido: Gerar Card de Rank para Desafiar Amigos */}
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="w-full py-2.5 bg-[#18181b] hover:bg-[#222226] border border-[#27272a] rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition active:scale-98"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Gerar Card do Meu Rank para WhatsApp / Stories</span>
            </button>
          </div>

          {/* Rank por Grupo Muscular (8 Grupos Estilo Hevy) */}
          <div className="bg-[#141416] border border-[#27272a] rounded-2xl p-4 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-300">
                Rank por Grupo Muscular
              </span>
              <span className="text-[10px] text-zinc-500 font-bold">8 Grupos</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {muscleRanks.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-xl bg-[#18181b] border border-[#27272a] flex items-center gap-3"
                >
                  <HevyRankEmblem rank={m.rank} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-200 truncate">{m.label}</span>
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
          ABA 2: PASTAS DE COMPETIÇÕES PRIVADAS & LINKS DE CONVITE
         ========================================================= */}
      {activeSubTab === 'competitions' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Seção das Pastas / Ligas Privadas */}
          <div className="bg-[#141416] border border-[#27272a] rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-white" />
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  Pastas de Competição
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setCompActionError(null);
                    setIsCreateModalOpen(true);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-[11px] font-black flex items-center gap-1 transition active:scale-95 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nova Competição</span>
                </button>

                <button
                  onClick={() => {
                    setCompActionError(null);
                    setIsJoinModalOpen(true);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-[#18181b] hover:bg-zinc-800 border border-[#27272a] text-zinc-300 text-[11px] font-bold flex items-center gap-1 transition active:scale-95"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Entrar com Código</span>
                </button>
              </div>
            </div>

            {/* Barra de Pastas Horizontais (quando o usuário tem competições) */}
            {competitions.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
                {competitions.map((comp) => {
                  const isSelected = comp.id === selectedCompId;
                  const memberCount = Array.isArray(comp.member_emails)
                    ? comp.member_emails.length
                    : 1;

                  return (
                    <button
                      key={comp.id}
                      onClick={() => setSelectedCompId(comp.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition shrink-0 border ${
                        isSelected
                          ? 'bg-white text-black border-white shadow-md'
                          : 'bg-[#18181b] text-zinc-300 border-[#27272a] hover:bg-zinc-800'
                      }`}
                    >
                      <Folder className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate max-w-[140px]">{comp.name}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                          isSelected ? 'bg-black text-white' : 'bg-[#121214] text-zinc-400'
                        }`}
                      >
                        {memberCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* CASO 1: Usuário não possui NENHUMA competição (vem 100% zerada por padrão) */}
          {competitions.length === 0 && !isLoadingComps && (
            <div className="bg-[#141416] border border-[#27272a] rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-xl">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#18181b] border border-[#27272a] flex items-center justify-center">
                <Trophy className="w-7 h-7 text-white" />
              </div>

              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Nenhuma competição ativa
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  No <strong>Change</strong>, as competições são 100% privadas entre amigos com afinidade.
                  Nenhum usuário fora das suas competições consegue te ver, mantendo seu treino totalmente exclusivo.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2 max-w-sm mx-auto">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white hover:bg-zinc-200 text-black font-black text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-md"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>Criar Nova Competição</span>
                </button>

                <button
                  onClick={() => setIsJoinModalOpen(true)}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#18181b] hover:bg-zinc-800 border border-[#27272a] text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95"
                >
                  <Link2 className="w-4 h-4" />
                  <span>Entrar com Link ou Código</span>
                </button>
              </div>
            </div>
          )}

          {/* CASO 2: Visualização da Competição Selecionada */}
          {selectedComp && (
            <div className="space-y-4">
              {/* Card de Apresentação e Ações da Competição */}
              <div className="bg-[#141416] border border-[#27272a] rounded-2xl p-4 space-y-3 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black text-white truncate">
                        {selectedComp.name}
                      </h2>
                      <span className="px-2 py-0.5 rounded-lg bg-[#18181b] border border-[#27272a] text-[10px] font-bold text-zinc-400 shrink-0">
                        {selectedComp.invite_code}
                      </span>
                    </div>
                    {selectedComp.description && (
                      <p className="text-xs text-zinc-400 mt-0.5">{selectedComp.description}</p>
                    )}
                    <span className="text-[10px] text-zinc-500 block mt-1">
                      Criada por <strong>{selectedComp.creator_name}</strong> • {rankedAthletes.length}{' '}
                      participantes
                    </span>
                  </div>

                  {/* Botão de Destaque: Convidar Amigos */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setIsInviteModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black font-black text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Convidar Amigos</span>
                    </button>

                    <button
                      onClick={loadSelectedCompLeaderboard}
                      disabled={isLoadingLeaderboard}
                      className="p-2 rounded-xl bg-[#18181b] hover:bg-zinc-800 border border-[#27272a] text-zinc-300 transition"
                      title="Atualizar placar"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${isLoadingLeaderboard ? 'animate-spin' : ''}`}
                      />
                    </button>
                  </div>
                </div>

                {/* Filtros da Competição */}
                <div className="pt-2 border-t border-[#27272a]/60">
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      onClick={() => setLeaderboardFilter('score')}
                      className={`py-2 px-1.5 rounded-xl text-[10px] font-black transition ${
                        leaderboardFilter === 'score'
                          ? 'bg-white text-black'
                          : 'bg-[#18181b] text-zinc-400 border border-[#27272a]'
                      }`}
                    >
                      Patente (XP)
                    </button>
                    <button
                      onClick={() => setLeaderboardFilter('weekly')}
                      className={`py-2 px-1.5 rounded-xl text-[10px] font-black transition ${
                        leaderboardFilter === 'weekly'
                          ? 'bg-white text-black'
                          : 'bg-[#18181b] text-zinc-400 border border-[#27272a]'
                      }`}
                    >
                      Na Semana
                    </button>
                    <button
                      onClick={() => setLeaderboardFilter('workouts')}
                      className={`py-2 px-1.5 rounded-xl text-[10px] font-black transition ${
                        leaderboardFilter === 'workouts'
                          ? 'bg-white text-black'
                          : 'bg-[#18181b] text-zinc-400 border border-[#27272a]'
                      }`}
                    >
                      Total Treinos
                    </button>
                    <button
                      onClick={() => setLeaderboardFilter('volume')}
                      className={`py-2 px-1.5 rounded-xl text-[10px] font-black transition ${
                        leaderboardFilter === 'volume'
                          ? 'bg-white text-black'
                          : 'bg-[#18181b] text-zinc-400 border border-[#27272a]'
                      }`}
                    >
                      Volume (kg)
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabela de Classificação dos Participantes da Competição */}
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
                          <span className="text-[10px] text-zinc-400 block truncate">
                            Patente: <strong className="text-zinc-200">{athlete.rankInfo.fullLabel}</strong> •{' '}
                            {athlete.weeklyWorkouts}x na semana
                          </span>
                        </div>
                      </div>

                      {/* Métrica em destaque conforme o filtro */}
                      <div className="text-right shrink-0">
                        {leaderboardFilter === 'score' && (
                          <>
                            <span className="text-sm font-black text-white block">
                              {athlete.rankInfo.score} PTS
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              {athlete.workoutsCount} treinos
                            </span>
                          </>
                        )}
                        {leaderboardFilter === 'weekly' && (
                          <>
                            <span className="text-sm font-black text-white block">
                              {athlete.weeklyWorkouts} check-ins
                            </span>
                            <span className="text-[10px] text-zinc-400">Últimos 7 dias</span>
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
                        {leaderboardFilter === 'volume' && (
                          <>
                            <span className="text-sm font-black text-white block">
                              {displayWeight(athlete.totalVolumeKg, settings.weight_unit)}
                            </span>
                            <span className="text-[10px] text-zinc-400">Tonelagem</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mural de Check-ins Recentes (apenas membros da competição) */}
              <div className="bg-[#141416] border border-[#27272a] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-white" />
                    <span className="text-xs font-black uppercase tracking-wider text-white">
                      Mural de Check-ins da Competição
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-bold">Ao vivo</span>
                </div>

                {compFeed.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic py-2">
                    Nenhum check-in registrado pelos participantes ainda. Conclua um treino para liderar o mural!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {compFeed.map((ev, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-[#18181b] border border-[#27272a] flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                          <div className="min-w-0">
                            <span className="text-white font-bold block truncate">
                              <strong>{ev.athleteName}</strong> concluiu{' '}
                              <span className="text-zinc-300">{ev.workoutTitle}</span>
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              {new Date(ev.date).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-white block">
                            {displayWeight(ev.loadKg, settings.weight_unit)}
                          </span>
                          <span className="text-[10px] text-zinc-400">{ev.sets} séries</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Opções da Competição (Sair ou Excluir) */}
              <div className="flex items-center justify-end gap-2 pt-2">
                {selectedComp.creator_email.toLowerCase() === currentUser.email.toLowerCase() ? (
                  <button
                    onClick={() => handleDeleteCompetition(selectedComp.id)}
                    className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-950/80 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir Competição</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleLeaveCompetition(selectedComp.id)}
                    className="px-3 py-1.5 rounded-xl bg-[#18181b] hover:bg-zinc-800 border border-[#27272a] text-zinc-400 text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sair da Competição</span>
                  </button>
                )}
              </div>
            </div>
          )}
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
              <p className="text-xs text-zinc-500 italic py-2">
                Nenhum registro de medida ainda. Acompanhe sua evolução física aqui!
              </p>
            ) : (
              <div className="space-y-2 pt-1 max-h-48 overflow-y-auto">
                {measurements.map((m, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center text-xs bg-[#18181b] p-2.5 rounded-lg border border-[#27272a]"
                  >
                    <span className="text-zinc-400">
                      {new Date(m.date).toLocaleDateString('pt-BR')}
                    </span>
                    <div className="flex gap-3 font-semibold text-white">
                      {m.weight_kg && <span>{m.weight_kg} kg</span>}
                      {m.fat_percent && <span>{m.fat_percent}% BF</span>}
                      {m.waist_cm && <span>Cintura: {m.waist_cm}cm</span>}
                      {m.arms_cm && <span>Braço: {m.arms_cm}cm</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 1: CRIAR NOVA COMPETIÇÃO PRIVADA
         ========================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#121214] border border-[#27272a] rounded-3xl p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-white" />
                <h3 className="text-base font-black text-white">Criar Nova Competição</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-full"
              >
                ✕
              </button>
            </div>

            {compActionError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 font-semibold">
                {compActionError}
              </div>
            )}

            <form onSubmit={handleCreateCompetition} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">
                  Nome da Competição *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Turma do Supino, Desafio Casal..."
                  value={newCompName}
                  onChange={(e) => setNewCompName(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">
                  Descrição ou Regras (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Mínimo 4 treinos por semana"
                  value={newCompDesc}
                  onChange={(e) => setNewCompDesc(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">
                  Métrica Principal de Disputa
                </label>
                <select
                  value={newCompMetric}
                  onChange={(e) => setNewCompMetric(e.target.value as CompetitionMetric)}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-white"
                >
                  <option value="score">⭐ Patente & XP Hevy (Treinos + Séries + PRs)</option>
                  <option value="weekly">🔥 Check-ins na Semana (Frequência ativa)</option>
                  <option value="workouts">📈 Total de Treinos Concluídos</option>
                  <option value="volume">🏋️ Volume Total Levantado (kg)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#18181b] text-zinc-300 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingComp || !newCompName.trim()}
                  className="px-4 py-2.5 rounded-xl bg-white text-black font-black text-xs flex items-center gap-1.5 hover:bg-zinc-200 transition active:scale-95 disabled:opacity-50"
                >
                  {isSubmittingComp ? 'Criando...' : 'Criar & Gerar Convite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 2: ENTRAR EM UMA COMPETIÇÃO COM CÓDIGO OU LINK
         ========================================================= */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#121214] border border-[#27272a] rounded-3xl p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
              <div className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-white" />
                <h3 className="text-base font-black text-white">Entrar na Competição</h3>
              </div>
              <button
                onClick={() => setIsJoinModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-full"
              >
                ✕
              </button>
            </div>

            {compActionError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 font-semibold">
                {compActionError}
              </div>
            )}

            <form onSubmit={handleJoinCompetition} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">
                  Código de Convite ou Link
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: CHG-7X9P ou cole o link recebido"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white uppercase"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Você passará a ver apenas a classificação e check-ins dessa competição específica.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsJoinModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#18181b] text-zinc-300 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingComp || !joinCodeInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-white text-black font-black text-xs flex items-center gap-1.5 hover:bg-zinc-200 transition active:scale-95 disabled:opacity-50"
                >
                  {isSubmittingComp ? 'Entrando...' : 'Entrar na Competição'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 3: CONVIDAR AMIGOS (CÓDIGO, LINK & WHATSAPP)
         ========================================================= */}
      {isInviteModalOpen && selectedComp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#121214] border border-[#27272a] rounded-3xl p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-white" />
                <h3 className="text-base font-black text-white">Convidar para Competição</h3>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-full"
              >
                ✕
              </button>
            </div>

            <div className="text-center py-2 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                Competição
              </span>
              <h4 className="text-lg font-black text-white">{selectedComp.name}</h4>
              <p className="text-xs text-zinc-400">
                Envie o link para amigos que já são usuários entrarem no seu grupo!
              </p>
            </div>

            {/* Código de Convite em Destaque */}
            <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-4 text-center space-y-2">
              <span className="text-[10px] uppercase font-bold text-zinc-400">
                Código de Acesso
              </span>
              <div className="text-2xl font-black text-white tracking-widest">
                {selectedComp.invite_code}
              </div>
              <button
                onClick={() => handleCopyCode(selectedComp.invite_code)}
                className="px-3 py-1.5 bg-[#121214] hover:bg-zinc-800 border border-[#27272a] rounded-xl text-xs font-bold text-zinc-300 mx-auto flex items-center gap-1.5 transition"
              >
                {copiedInvite ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Código</span>
                  </>
                )}
              </button>
            </div>

            {/* Botões de Ação Direta */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => handleShareWhatsApp(selectedComp)}
                className="w-full py-3 rounded-2xl bg-white hover:bg-zinc-200 text-black font-black text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-md"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Enviar Convite pelo WhatsApp</span>
              </button>

              <button
                onClick={() => handleCopyLink(selectedComp.invite_code)}
                className="w-full py-3 rounded-2xl bg-[#18181b] hover:bg-zinc-800 border border-[#27272a] text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Link Direto Copiado!</span>
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    <span>Copiar Link de Compartilhamento</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 4: DETECÇÃO AUTOMÁTICA DE CONVITE VIA LINK DA URL
         ========================================================= */}
      {pendingInviteComp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#121214] border border-white/40 rounded-3xl p-6 shadow-2xl space-y-4 text-white">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-white text-black flex items-center justify-center shadow-md">
              <Trophy className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Convite de Competição Recebido
              </span>
              <h3 className="text-lg font-black text-white">{pendingInviteComp.name}</h3>
              <p className="text-xs text-zinc-300">
                Criada por <strong>{pendingInviteComp.creator_name}</strong>. Deseja entrar e disputar o ranking com eles?
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setPendingInviteComp(null);
                  if (typeof window !== 'undefined') {
                    window.history.replaceState(null, '', window.location.pathname);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#18181b] hover:bg-zinc-800 border border-[#27272a] text-xs font-bold text-zinc-400"
              >
                Agora Não
              </button>
              <button
                onClick={handleConfirmPendingInvite}
                disabled={isSubmittingComp}
                className="flex-1 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-black transition active:scale-95 shadow-md"
              >
                {isSubmittingComp ? 'Entrando...' : 'Entrar na Competição'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Compartilhamento do Card de Rank */}
      <ShareRankModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        athleteName={currentUser.name}
        rankInfo={overallRank}
        position={myPosition}
        totalAthletes={rankedAthletes.length || 1}
        workoutsCount={workouts.length}
        weeklyWorkouts={countWeeklyWorkouts(workouts)}
        totalSets={totalSets}
        bestPrText={
          exerciseRanksList.length > 0
            ? `${exerciseRanksList[0].pr.exercise_title}: ${exerciseRanksList[0].pr.max_weight_kg} kg`
            : 'Em busca do primeiro PR'
        }
        competitors={rankedAthletes.map((a) => ({
          name: a.name,
          rankLabel: a.rankInfo.fullLabel,
          score: a.rankInfo.score,
          workoutsCount: a.workoutsCount,
          weeklyWorkouts: a.weeklyWorkouts
        }))}
      />
    </div>
  );
};
