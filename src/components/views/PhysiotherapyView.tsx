import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Activity,
  Sparkles,
  Search,
  Play,
  Pause,
  RotateCcw,
  Check,
  Clock,
  ShieldCheck,
  Info,
  AlertCircle,
  Wind,
  Plus,
  X,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  PHYSIOTHERAPY_EXERCISES,
  PHYSIOTHERAPY_PROTOCOLS
} from '../../data/physiotherapyExercises';
import {
  PhysiotherapyExercise,
  PhysiotherapyProtocol,
  PhysioRegion,
  ExerciseTemplate
} from '../../types';
import {
  formatSecondsClock,
  normalizeSearchText,
  playGymTone,
  triggerHaptic
} from '../../utils/calc';

const REGION_FILTERS: { label: string; value: PhysioRegion | 'all' }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Coluna & Lombar', value: 'lombar' },
  { label: 'Quadril & Pernas', value: 'quadril' },
  { label: 'Joelhos', value: 'joelho' },
  { label: 'Ombros & Escápulas', value: 'ombro' },
  { label: 'Cervical & Postura', value: 'cervical' }
];

export const PhysiotherapyView: React.FC = () => {
  const { theme, activeWorkout, addExerciseToWorkout, setWorkoutModalOpen } = useApp();
  const isLight = theme === 'light';

  const [activeTab, setActiveTab] = useState<'protocols' | 'library'>('protocols');
  const [selectedRegion, setSelectedRegion] = useState<PhysioRegion | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExerciseForModal, setSelectedExerciseForModal] =
    useState<PhysiotherapyExercise | null>(null);

  // Estados da Sessão Terapêutica Guiada (Player Interativo)
  const [activeSession, setActiveSession] = useState<{
    protocolTitle: string;
    exercises: {
      exercise: PhysiotherapyExercise;
      targetSets: number;
      targetDuration?: number;
      targetReps?: number;
      notes?: string;
    }[];
    currentIndex: number;
    currentSet: number;
  } | null>(null);

  const [sessionTimerSeconds, setSessionTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [sessionSoundEnabled, setSessionSoundEnabled] = useState<boolean>(true);
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const timerIntervalRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Filtragem da Biblioteca de Exercícios
  const filteredExercises = useMemo(() => {
    const q = normalizeSearchText(searchQuery);
    return PHYSIOTHERAPY_EXERCISES.filter((ex) => {
      const matchRegion = selectedRegion === 'all' || ex.region === selectedRegion;
      if (!matchRegion) return false;
      if (!q) return true;
      const fullText = normalizeSearchText(
        `${ex.title} ${ex.region_label} ${ex.clinical_objective} ${ex.position} ${ex.steps.join(' ')}`
      );
      return fullText.includes(q);
    });
  }, [searchQuery, selectedRegion]);

  // Iniciar Protocolo Completo
  const handleStartProtocol = (proto: PhysiotherapyProtocol) => {
    triggerHaptic('success');
    const mapped = proto.exercises
      .map((item) => {
        const found = PHYSIOTHERAPY_EXERCISES.find((e) => e.id === item.exercise_id);
        if (!found) return null;
        return {
          exercise: found,
          targetSets: item.sets,
          targetDuration: item.duration_seconds || found.default_duration_seconds,
          targetReps: item.reps || found.default_reps,
          notes: item.notes
        };
      })
      .filter(Boolean) as {
      exercise: PhysiotherapyExercise;
      targetSets: number;
      targetDuration?: number;
      targetReps?: number;
      notes?: string;
    }[];

    if (mapped.length === 0) return;

    const first = mapped[0];
    const initialSec =
      first.exercise.execution_type === 'duration' ? first.targetDuration || 30 : 0;

    setActiveSession({
      protocolTitle: proto.title,
      exercises: mapped,
      currentIndex: 0,
      currentSet: 1
    });
    setSessionTimerSeconds(initialSec);
    setIsTimerRunning(first.exercise.execution_type === 'duration');
    setSessionCompleted(false);
  };

  // Iniciar Exercício Único no Player
  const handleStartSingleExercise = (ex: PhysiotherapyExercise) => {
    triggerHaptic('light');
    const initialSec = ex.execution_type === 'duration' ? ex.default_duration_seconds || 30 : 0;
    setActiveSession({
      protocolTitle: 'Exercício Terapêutico Guiado',
      exercises: [
        {
          exercise: ex,
          targetSets: ex.default_sets,
          targetDuration: ex.default_duration_seconds,
          targetReps: ex.default_reps,
          notes: ex.clinical_objective
        }
      ],
      currentIndex: 0,
      currentSet: 1
    });
    setSessionTimerSeconds(initialSec);
    setIsTimerRunning(ex.execution_type === 'duration');
    setSessionCompleted(false);
  };

  // Timer da Sessão
  useEffect(() => {
    if (isTimerRunning && sessionTimerSeconds > 0) {
      timerIntervalRef.current = window.setInterval(() => {
        setSessionTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            setIsTimerRunning(false);
            if (sessionSoundEnabled) playGymTone('bell');
            triggerHaptic('success');
            return 0;
          }
          if (prev === 4 && sessionSoundEnabled) {
            playGymTone('beep');
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning, sessionTimerSeconds, sessionSoundEnabled]);

  // Avançar Série ou Próximo Exercício
  const handleAdvanceSessionSet = () => {
    if (!activeSession) return;
    triggerHaptic('light');
    if (sessionSoundEnabled) playGymTone('check');

    const currentItem = activeSession.exercises[activeSession.currentIndex];

    // Se ainda há séries neste exercício
    if (activeSession.currentSet < currentItem.targetSets) {
      const nextSet = activeSession.currentSet + 1;
      const initialSec =
        currentItem.exercise.execution_type === 'duration'
          ? currentItem.targetDuration || 30
          : 0;
      setActiveSession({
        ...activeSession,
        currentSet: nextSet
      });
      setSessionTimerSeconds(initialSec);
      setIsTimerRunning(currentItem.exercise.execution_type === 'duration');
      showToast(`✓ Série ${activeSession.currentSet} concluída! Iniciando série ${nextSet}`);
      return;
    }

    // Se acabou este exercício, avança para o próximo
    if (activeSession.currentIndex < activeSession.exercises.length - 1) {
      const nextIdx = activeSession.currentIndex + 1;
      const nextItem = activeSession.exercises[nextIdx];
      const initialSec =
        nextItem.exercise.execution_type === 'duration'
          ? nextItem.targetDuration || 30
          : 0;

      setActiveSession({
        ...activeSession,
        currentIndex: nextIdx,
        currentSet: 1
      });
      setSessionTimerSeconds(initialSec);
      setIsTimerRunning(nextItem.exercise.execution_type === 'duration');
      showToast(`✓ Próximo exercício: ${nextItem.exercise.title}`);
      return;
    }

    // Sessão Finalizada com Sucesso!
    setSessionCompleted(true);
    setIsTimerRunning(false);
    triggerHaptic('success');
    try {
      import('canvas-confetti').then((m) => {
        const conf = m.default || m;
        conf({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      });
    } catch {
      // Ignore
    }
  };

  // Adicionar exercício de fisio ao treino ativo
  const handleAddPhysioToWorkout = (ex: PhysiotherapyExercise) => {
    if (!activeWorkout) {
      showToast('Inicie um treino na aba "Planos" para adicionar este exercício.');
      return;
    }

    const template: ExerciseTemplate = {
      id: `physio-${ex.id}`,
      title: ex.title,
      primary_muscle_group: 'outro',
      secondary_muscle_groups: [],
      equipment: 'peso_corporal',
      type: ex.execution_type === 'duration' ? 'duration' : 'reps_only',
      instructions: ex.steps.join(' '),
      steps: ex.steps,
      tips: [ex.feel_cue, ex.caution],
      muscles_pt: ex.region_label
    };

    addExerciseToWorkout(template);
    triggerHaptic('success');
    showToast(`✓ "${ex.title}" adicionado ao seu treino ativo!`);
    setWorkoutModalOpen(true);
  };

  return (
    <div className="w-full px-4 py-5 md:py-8 space-y-6 pb-28 animate-in fade-in duration-200">
      {/* Toast Feedback */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[130] px-4 py-2.5 rounded-2xl bg-white text-black font-black text-xs shadow-2xl border border-zinc-200 flex items-center gap-2 animate-in slide-in-from-top-4 duration-200">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Cabeçalho de Destaque da Área Restrita */}
      <div
        className={`p-5 rounded-3xl border ${
          isLight
            ? 'bg-zinc-50 border-zinc-200 text-black shadow-sm'
            : 'bg-[#121214] border-[#27272a] text-white shadow-xl'
        } relative overflow-hidden`}
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                isLight ? 'bg-black text-white' : 'bg-white text-black'
              }`}
            >
              <Activity className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    isLight ? 'bg-zinc-200 text-black' : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Área Exclusiva de Fisioterapia
                </span>
                <span className="text-[10px] text-zinc-400 font-bold">
                  {PHYSIOTHERAPY_EXERCISES.length} Exercícios Clínicos
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black mt-1 tracking-tight">
                Fisioterapia & Reabilitação
              </h1>
              <p
                className={`text-xs mt-1 leading-relaxed ${
                  isLight ? 'text-zinc-600' : 'text-zinc-400'
                }`}
              >
                Descompressão da coluna lombar, mobilidade articular a 90° em L, alívio ciático e
                reeducação postural com sessões guiadas passo a passo.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alternador de Abas: Protocolos Guiados vs Biblioteca */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#121214] border border-[#27272a]">
        <button
          type="button"
          onClick={() => setActiveTab('protocols')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
            activeTab === 'protocols'
              ? 'bg-white text-black shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Protocolos de Tratamento ({PHYSIOTHERAPY_PROTOCOLS.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('library')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
            activeTab === 'library'
              ? 'bg-white text-black shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Biblioteca de Exercícios ({PHYSIOTHERAPY_EXERCISES.length})</span>
        </button>
      </div>

      {/* ABA 1: PROTOCOLOS GUIADOS */}
      {activeTab === 'protocols' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PHYSIOTHERAPY_PROTOCOLS.map((proto) => (
              <div
                key={proto.id}
                className={`p-5 rounded-3xl border transition flex flex-col justify-between gap-4 ${
                  isLight
                    ? 'bg-white border-zinc-200 text-black hover:border-black'
                    : 'bg-[#141416] border-[#27272a] text-white hover:border-zinc-500'
                } shadow-lg`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        isLight ? 'bg-zinc-100 text-zinc-800' : 'bg-[#1c1c1f] text-zinc-300'
                      }`}
                    >
                      {proto.target_region}
                    </span>
                    <span className="text-[11px] font-black text-zinc-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      ~{proto.estimated_minutes} min
                    </span>
                  </div>

                  <h3 className="text-base font-black mt-2 leading-tight">{proto.title}</h3>
                  <p
                    className={`text-xs mt-1 line-clamp-2 ${
                      isLight ? 'text-zinc-600' : 'text-zinc-400'
                    }`}
                  >
                    {proto.subtitle}
                  </p>

                  {/* Lista Resumida dos Exercícios da Sequência */}
                  <div className="mt-3.5 pt-3 border-t border-[#27272a]/60 space-y-1.5">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block">
                      Exercícios na sequência:
                    </span>
                    <div className="space-y-1">
                      {proto.exercises.map((item, idx) => {
                        const ex = PHYSIOTHERAPY_EXERCISES.find((e) => e.id === item.exercise_id);
                        if (!ex) return null;
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-[11px] font-semibold text-zinc-300"
                          >
                            <span className="truncate pr-2">
                              {idx + 1}. {ex.title}
                            </span>
                            <span className="text-[10px] text-zinc-500 shrink-0">
                              {item.duration_seconds
                                ? `${item.duration_seconds}s`
                                : `${item.reps || 10} reps`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartProtocol(proto)}
                  className="w-full py-3 bg-white hover:bg-zinc-200 text-black font-black text-xs rounded-2xl transition active:scale-95 shadow-md flex items-center justify-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Iniciar Sessão Guiada</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA 2: BIBLIOTECA DE EXERCÍCIOS DE FISIOTERAPIA */}
      {activeTab === 'library' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Barra de Busca */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar exercício terapêutico (ex: perna em L, ciático, ombro, joelho)..."
              className={`w-full pl-10 pr-4 py-3 rounded-2xl text-xs font-semibold focus:outline-none transition border ${
                isLight
                  ? 'bg-zinc-100 border-zinc-200 text-black placeholder-zinc-500 focus:border-black'
                  : 'bg-[#141416] border-[#27272a] text-white placeholder-zinc-500 focus:border-white'
              }`}
            />
          </div>

          {/* Filtros por Região */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {REGION_FILTERS.map((f) => {
              const isSelected = selectedRegion === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setSelectedRegion(f.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition active:scale-95 border ${
                    isSelected
                      ? 'bg-white text-black border-white shadow-sm'
                      : 'bg-[#141416] text-zinc-400 border-[#27272a] hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Lista de Cards de Exercícios */}
          <div className="space-y-3">
            {filteredExercises.map((ex) => (
              <div
                key={ex.id}
                className={`p-4 rounded-3xl border transition ${
                  isLight
                    ? 'bg-white border-zinc-200 text-black'
                    : 'bg-[#141416] border-[#27272a] text-white'
                } space-y-3`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-zinc-300">
                        {ex.region_label}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-400">
                        {ex.execution_type === 'duration'
                          ? `⏱ ${ex.default_duration_seconds} seg • ${ex.default_sets} séries`
                          : `🔁 ${ex.default_reps} reps • ${ex.default_sets} séries`}
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-white mt-1 leading-snug">{ex.title}</h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                      {ex.clinical_objective}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-[#18181b] rounded-2xl border border-[#27272a] space-y-2 text-xs">
                  <div className="flex items-start gap-2 text-zinc-300">
                    <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] leading-relaxed">
                      <strong>Posição:</strong> {ex.position}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-emerald-300">
                    <Wind className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] leading-relaxed">
                      <strong>O que sentir:</strong> {ex.feel_cue}
                    </span>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleStartSingleExercise(ex)}
                    className="flex-1 py-2.5 bg-white hover:bg-zinc-200 text-black font-black text-xs rounded-xl transition active:scale-95 shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3 h-3 fill-black" />
                    <span>Praticar com Timer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedExerciseForModal(ex)}
                    className="px-3 py-2.5 bg-[#18181b] hover:bg-[#222226] border border-[#27272a] text-zinc-300 font-bold text-xs rounded-xl transition"
                    title="Ver instruções completas e cuidados"
                  >
                    Instruções
                  </button>

                  {activeWorkout && (
                    <button
                      type="button"
                      onClick={() => handleAddPhysioToWorkout(ex)}
                      className="px-3 py-2.5 bg-[#18181b] hover:bg-[#222226] border border-[#27272a] text-white font-bold text-xs rounded-xl transition flex items-center gap-1"
                      title="Adicionar ao treino ativo"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Ao Treino</span>
                    </button>
                  )}
                </div>
              </div>
            ))}

            {filteredExercises.length === 0 && (
              <div className="p-8 text-center bg-[#121214] border border-[#27272a] rounded-3xl">
                <p className="text-xs text-zinc-400">Nenhum exercício encontrado para essa busca.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DETALHADO DO EXERCÍCIO */}
      {selectedExerciseForModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#121214] border border-[#27272a] rounded-3xl p-5 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden text-white">
            <div className="flex items-start justify-between pb-3 border-b border-[#27272a]">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                  {selectedExerciseForModal.region_label}
                </span>
                <h3 className="text-base font-black text-white mt-0.5">
                  {selectedExerciseForModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedExerciseForModal(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {/* Objetivo Clínico */}
              <div className="p-3 bg-[#18181b] rounded-2xl border border-[#27272a]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                  🎯 Objetivo Clínico
                </span>
                <p className="text-xs text-zinc-200 leading-relaxed font-semibold">
                  {selectedExerciseForModal.clinical_objective}
                </p>
              </div>

              {/* Passo a Passo */}
              <div className="space-y-2">
                <span className="text-xs font-black text-white uppercase tracking-wider block">
                  Instruções de Execução:
                </span>
                <div className="space-y-1.5">
                  {selectedExerciseForModal.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-[#18181b] rounded-xl border border-[#27272a] text-xs flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-white text-black font-black text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-zinc-300 leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Respiração & Sensação */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 bg-[#18181b] rounded-2xl border border-[#27272a] space-y-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <Wind className="w-3.5 h-3.5" /> Como Respirar
                  </span>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    {selectedExerciseForModal.breathing}
                  </p>
                </div>

                <div className="p-3 bg-[#18181b] rounded-2xl border border-[#27272a] space-y-1">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Atenção & Cuidados
                  </span>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    {selectedExerciseForModal.caution}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#27272a] flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const ex = selectedExerciseForModal;
                  setSelectedExerciseForModal(null);
                  handleStartSingleExercise(ex);
                }}
                className="flex-1 py-3 bg-white hover:bg-zinc-200 text-black font-black text-xs rounded-xl transition flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>Iniciar este Exercício Agora</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PLAYER DA SESSÃO TERAPÊUTICA GUIADA (MODAL TELA CHEIA) */}
      {activeSession && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-0 sm:p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-200 text-white">
          <div className="w-full sm:max-w-lg h-full sm:h-auto sm:max-h-[92vh] bg-[#0c0d12] border-0 sm:border border-[#27272a] rounded-none sm:rounded-3xl p-5 shadow-2xl flex flex-col justify-between overflow-hidden">
            {/* Topo do Player */}
            <div className="flex items-center justify-between pb-3 border-b border-[#27272a] shrink-0">
              <div className="min-w-0 pr-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                  {activeSession.protocolTitle}
                </span>
                <h3 className="text-xs font-bold text-zinc-400 truncate">
                  Exercício {activeSession.currentIndex + 1} de {activeSession.exercises.length}
                </h3>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setSessionSoundEnabled(!sessionSoundEnabled)}
                  className="p-2 text-zinc-400 hover:text-white rounded-xl transition"
                  title="Ligar/Desligar sons"
                >
                  {sessionSoundEnabled ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsTimerRunning(false);
                    setActiveSession(null);
                  }}
                  className="p-2 text-zinc-400 hover:text-white rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Conteúdo Central do Exercício Ativo */}
            {!sessionCompleted ? (
              <div className="flex-1 overflow-y-auto py-5 space-y-5 text-center flex flex-col justify-center">
                {(() => {
                  const currentItem = activeSession.exercises[activeSession.currentIndex];
                  const ex = currentItem.exercise;
                  const isDuration = ex.execution_type === 'duration';

                  return (
                    <div className="space-y-4 max-w-sm mx-auto">
                      <div>
                        <span className="px-2.5 py-1 rounded-full bg-white/10 text-[10px] font-black text-zinc-300 uppercase">
                          Série {activeSession.currentSet} de {currentItem.targetSets}
                        </span>
                        <h2 className="text-xl font-black text-white mt-2 leading-tight">
                          {ex.title}
                        </h2>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                          {currentItem.notes || ex.clinical_objective}
                        </p>
                      </div>

                      {/* Display do Cronômetro / Contagem */}
                      {isDuration ? (
                        <div className="p-6 rounded-3xl bg-[#141416] border border-[#27272a] shadow-inner space-y-2">
                          <span className="text-5xl font-black tracking-tighter text-white tabular-nums">
                            {formatSecondsClock(sessionTimerSeconds)}
                          </span>
                          <span className="text-[11px] font-bold text-zinc-400 block uppercase tracking-wider">
                            {sessionTimerSeconds === 0 ? 'Concluído! Toque Avançar' : 'Sustente com respiração suave'}
                          </span>

                          <div className="flex items-center justify-center gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setIsTimerRunning(!isTimerRunning)}
                              className="px-4 py-2 rounded-xl bg-white text-black font-black text-xs flex items-center gap-1.5 active:scale-95 transition"
                            >
                              {isTimerRunning ? (
                                <>
                                  <Pause className="w-3.5 h-3.5 fill-black" /> Pausar
                                </>
                              ) : (
                                <>
                                  <Play className="w-3.5 h-3.5 fill-black" /> Retomar
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSessionTimerSeconds((prev) => prev + 15);
                                setIsTimerRunning(true);
                              }}
                              className="px-3 py-2 rounded-xl bg-[#222226] text-zinc-300 font-bold text-xs hover:text-white"
                            >
                              +15s
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSessionTimerSeconds(currentItem.targetDuration || 30);
                                setIsTimerRunning(false);
                              }}
                              className="p-2 rounded-xl bg-[#222226] text-zinc-400 hover:text-white"
                              title="Reiniciar"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 rounded-3xl bg-[#141416] border border-[#27272a] space-y-2">
                          <span className="text-4xl font-black text-white">
                            {currentItem.targetReps || 12} reps
                          </span>
                          <span className="text-xs font-bold text-zinc-400 block">
                            Execute os movimentos de forma lenta e controlada
                          </span>
                        </div>
                      )}

                      {/* Cue de Foco */}
                      <div className="p-3 bg-[#18181b] rounded-2xl border border-[#27272a] text-left text-xs space-y-1">
                        <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                          Dica do Fisioterapeuta:
                        </span>
                        <p className="text-[11px] text-zinc-300 leading-relaxed">
                          {ex.feel_cue}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* Tela de Parabéns pós-sessão */
              <div className="py-8 space-y-4 text-center max-w-sm mx-auto animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-3xl bg-white text-black flex items-center justify-center mx-auto shadow-2xl">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <h2 className="text-2xl font-black text-white">Sessão Concluída!</h2>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Excelente! Você completou todos os exercícios deste protocolo. Sua coluna e
                  articulações agradecem o cuidado e a descompressão.
                </p>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSession(null);
                      setSessionCompleted(false);
                    }}
                    className="w-full py-3.5 bg-white text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl active:scale-95 transition"
                  >
                    Fechar e Voltar
                  </button>
                </div>
              </div>
            )}

            {/* Rodapé de Ação */}
            {!sessionCompleted && (
              <div className="pt-3 border-t border-[#27272a] shrink-0">
                <button
                  type="button"
                  onClick={handleAdvanceSessionSet}
                  className="w-full py-3.5 bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl active:scale-95 transition flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Concluir Série / Avançar</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
