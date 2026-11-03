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
  VolumeX,
  Dumbbell,
  Edit2,
  Copy,
  Trash2,
  MoreVertical,
  ChevronRight,
  Eye,
  AlertTriangle,
  FolderPlus
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  PHYSIOTHERAPY_EXERCISES,
  PHYSIOTHERAPY_PROTOCOLS,
  PHYSIOTHERAPY_TEMPLATES,
  RECOMMENDED_PHYSIO_ROUTINES,
  getPhysioExerciseById,
  getPhysioTemplateById
} from '../../data/physiotherapyExercises';
import {
  PhysiotherapyExercise,
  PhysiotherapyProtocol,
  PhysioRegion,
  ExerciseTemplate,
  Routine,
  WorkoutExercise
} from '../../types';
import {
  formatSecondsClock,
  normalizeSearchText,
  playGymTone,
  triggerHaptic
} from '../../utils/calc';
import { PhysioRoutineEditorModal } from './PhysioRoutineEditorModal';
import { ExerciseVisualDemo } from '../ExerciseVisualDemo';

const REGION_FILTERS: { label: string; value: PhysioRegion | 'all' }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Coluna & Lombar', value: 'lombar' },
  { label: 'Quadril & Pernas', value: 'quadril' },
  { label: 'Joelhos', value: 'joelho' },
  { label: 'Ombros & Escápulas', value: 'ombro' },
  { label: 'Cervical & Postura', value: 'cervical' }
];

export const PhysiotherapyView: React.FC = () => {
  const {
    theme,
    activeWorkout,
    addExerciseToWorkout,
    setWorkoutModalOpen,
    routines,
    saveRoutine,
    deleteRoutine,
    startWorkout
  } = useApp();
  const isLight = theme === 'light';

  // Sub-abas: Planos de Fisioterapia vs Biblioteca de Exercícios
  const [activeTab, setActiveTab] = useState<'routines' | 'library'>('routines');
  const [selectedRegion, setSelectedRegion] = useState<PhysioRegion | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modais de Criação / Edição de Planos
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [activeMenuRoutineId, setActiveMenuRoutineId] = useState<string | null>(null);
  const [routineToDelete, setRoutineToDelete] = useState<Routine | null>(null);

  // Modal de Demonstração Visual de Execução (3D / Biomecânica / Anatomia)
  const [previewTemplate, setPreviewTemplate] = useState<ExerciseTemplate | null>(null);

  // Estados da Sessão Terapêutica Guiada Rápida (Player Interno Opcional)
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

  // Planos de fisioterapia criados pelo próprio usuário
  const myPhysioRoutines = useMemo(() => {
    return routines.filter((r) => r.is_physio);
  }, [routines]);

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

  // Iniciar Treino Ativo no Engine Geral do Change
  const handleStartPhysioRoutine = (routine: Routine) => {
    triggerHaptic('success');
    startWorkout(routine);
    showToast(`✓ Iniciando "${routine.title}"!`);
  };

  // Iniciar Sessão Livre / Treino Vazio de Fisio
  const handleStartQuickEmptyPhysio = () => {
    triggerHaptic('success');
    startWorkout(undefined, 'Sessão Livre de Fisioterapia');
    showToast('✓ Sessão de fisioterapia iniciada! Adicione os exercícios que desejar.');
  };

  // Duplicar protocolo recomendado para "Meus Planos"
  const handleCopyProtocolToMyRoutines = (protoRoutine: Routine) => {
    triggerHaptic('success');
    const cloned: Routine = {
      ...protoRoutine,
      id: `routine-physio-custom-${Date.now()}`,
      title: `${protoRoutine.title} (Personalizado)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_physio: true
    };
    saveRoutine(cloned);
    showToast(`✓ Protocolo copiado para seus planos! Você já pode editá-lo.`);
  };

  // Duplicar plano próprio
  const handleDuplicateMyRoutine = (routine: Routine) => {
    triggerHaptic('success');
    const cloned: Routine = {
      ...routine,
      id: `routine-physio-custom-${Date.now()}`,
      title: `${routine.title} (Cópia)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_physio: true
    };
    saveRoutine(cloned);
    setActiveMenuRoutineId(null);
    showToast(`✓ Plano "${cloned.title}" duplicado!`);
  };

  // Confirmar exclusão de plano próprio
  const handleConfirmDeleteRoutine = () => {
    if (!routineToDelete) return;
    triggerHaptic('medium');
    deleteRoutine(routineToDelete.id);
    showToast(`✓ Plano "${routineToDelete.title}" excluído.`);
    setRoutineToDelete(null);
  };

  // Abrir demonstração visual de um exercício da rotina
  const handleOpenExercisePreview = (exTemplateId: string) => {
    const tpl =
      PHYSIOTHERAPY_TEMPLATES.find((t) => t.id === exTemplateId) ||
      getPhysioTemplateById(exTemplateId);
    if (tpl) {
      setPreviewTemplate(tpl);
    }
  };

  // Iniciar Sessão Guiada Rápida (Player Interno)
  const handleStartProtocolQuickPlayer = (proto: PhysiotherapyProtocol) => {
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

  // Iniciar Exercício Único no Player Rápido
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

  // Timer da Sessão Rápida
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

  // Avançar Série no Player Rápido
  const handleAdvanceSessionSet = () => {
    if (!activeSession) return;
    triggerHaptic('light');
    if (sessionSoundEnabled) playGymTone('check');

    const currentItem = activeSession.exercises[activeSession.currentIndex];

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
      showToast(`✓ Próximo: ${nextItem.exercise.title}`);
      return;
    }

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

  // Adicionar exercício de fisio diretamente ao treino ativo
  const handleAddPhysioToWorkout = (ex: PhysiotherapyExercise) => {
    if (!activeWorkout) {
      showToast('Inicie um treino primeiro para adicionar este exercício.');
      return;
    }

    const tpl =
      PHYSIOTHERAPY_TEMPLATES.find((t) => t.id === `physio-${ex.id}`) ||
      getPhysioTemplateById(ex.id);

    if (tpl) {
      addExerciseToWorkout(tpl);
      triggerHaptic('success');
      showToast(`✓ "${ex.title}" adicionado ao seu treino ativo!`);
      setWorkoutModalOpen(true);
    }
  };

  return (
    <div className="w-full px-4 py-5 md:py-8 space-y-6 pb-28 animate-in fade-in duration-200">
      {/* Toast Feedback */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[150] px-4 py-2.5 rounded-2xl bg-white text-black font-black text-xs shadow-2xl border border-zinc-200 flex items-center gap-2 animate-in slide-in-from-top-4 duration-200">
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
                Crie seus próprios planos terapêuticos, execute protocolos recomendados pela clínica,
                acompanhe a execução visual dos exercícios e registre sessões completas.
              </p>
            </div>
          </div>

          {/* Botões Rápidos de Ação Superior */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleStartQuickEmptyPhysio}
              className="px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-2xl flex items-center gap-1.5 transition active:scale-95 border border-zinc-700 shadow-sm"
              title="Iniciar sessão livre de fisioterapia agora"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Sessão Livre</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingRoutine(null);
                setIsEditorOpen(true);
              }}
              className="px-4 py-2.5 bg-white text-black hover:bg-zinc-200 font-black text-xs rounded-2xl flex items-center gap-1.5 transition active:scale-95 shadow-md"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Novo Plano</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alternador de Abas: Planos de Fisioterapia vs Biblioteca de Exercícios */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#121214] border border-[#27272a]">
        <button
          type="button"
          onClick={() => setActiveTab('routines')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
            activeTab === 'routines'
              ? 'bg-white text-black shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Dumbbell className="w-3.5 h-3.5" />
          <span>
            Planos de Fisio ({myPhysioRoutines.length + RECOMMENDED_PHYSIO_ROUTINES.length})
          </span>
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

      {/* ======================================================== */}
      {/* ABA 1: PLANOS DE FISIOTERAPIA (MEUS PLANOS + RECOMENDADOS) */}
      {/* ======================================================== */}
      {activeTab === 'routines' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* SEÇÃO 1: MEUS PLANOS DE FISIOTERAPIA */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Meus Planos de Fisioterapia ({myPhysioRoutines.length})</span>
                </h2>
                <span className="text-[11px] text-zinc-400">
                  Planos clínicos personalizados criados por você
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingRoutine(null);
                  setIsEditorOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-white text-black font-black text-xs flex items-center gap-1 shadow-sm active:scale-95 transition"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Criar Plano</span>
              </button>
            </div>

            {myPhysioRoutines.length === 0 ? (
              <div className="p-6 text-center bg-[#141416] border border-dashed border-[#27272a] rounded-3xl space-y-3">
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  Você ainda não criou nenhum plano personalizado de fisioterapia. Crie o seu
                  próprio plano com os exercícios que você preferir ou duplique qualquer um dos
                  protocolos recomendados abaixo!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingRoutine(null);
                    setIsEditorOpen(true);
                  }}
                  className="px-4 py-2 bg-white text-black font-black text-xs rounded-xl shadow inline-flex items-center gap-1.5 active:scale-95 transition"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Criar Meu Primeiro Plano</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myPhysioRoutines.map((routine) => (
                  <div
                    key={routine.id}
                    className={`p-5 rounded-3xl border transition flex flex-col justify-between gap-4 relative ${
                      isLight
                        ? 'bg-white border-zinc-200 text-black shadow-sm'
                        : 'bg-[#141416] border-[#27272a] text-white shadow-xl hover:border-zinc-500'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-emerald-400">
                            Plano Personalizado
                          </span>
                          <h3 className="text-base font-black mt-1 leading-snug truncate">
                            {routine.title}
                          </h3>
                          {routine.notes && (
                            <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">
                              {routine.notes}
                            </p>
                          )}
                        </div>

                        {/* Menu de Ações do Plano */}
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveMenuRoutineId(
                                activeMenuRoutineId === routine.id ? null : routine.id
                              )
                            }
                            className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeMenuRoutineId === routine.id && (
                            <div className="absolute right-0 top-8 z-30 w-36 bg-[#18181b] border border-[#27272a] rounded-2xl p-1 shadow-2xl space-y-0.5 text-xs">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuRoutineId(null);
                                  setEditingRoutine(routine);
                                  setIsEditorOpen(true);
                                }}
                                className="w-full px-2.5 py-1.5 text-left rounded-xl hover:bg-zinc-800 text-zinc-200 flex items-center gap-2 font-bold"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Editar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDuplicateMyRoutine(routine)}
                                className="w-full px-2.5 py-1.5 text-left rounded-xl hover:bg-zinc-800 text-zinc-200 flex items-center gap-2 font-bold"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span>Duplicar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuRoutineId(null);
                                  setRoutineToDelete(routine);
                                }}
                                className="w-full px-2.5 py-1.5 text-left rounded-xl hover:bg-red-950/70 text-red-400 flex items-center gap-2 font-bold"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Excluir</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Lista de Exercícios do Plano com Miniatura 3D e Toque para Ver Demonstração */}
                      <div className="mt-3 pt-3 border-t border-[#27272a]/60 space-y-1.5">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block">
                          Exercícios ({routine.exercises.length}): Toque para ver execução 3D
                        </span>
                        <div className="space-y-1">
                          {routine.exercises.map((item, idx) => {
                            const isDuration = Boolean(
                              item.sets[0]?.duration_seconds !== null &&
                                item.sets[0]?.duration_seconds !== undefined
                            );
                            const metric = isDuration
                              ? `${item.sets[0]?.duration_seconds || 30}s`
                              : `${item.sets[0]?.reps || 12} reps`;
                            const tpl =
                              PHYSIOTHERAPY_TEMPLATES.find((t) => t.id === item.exercise_template_id) ||
                              getPhysioTemplateById(item.exercise_template_id);
                            const thumbUrl = tpl?.gif_id
                              ? `https://cdn.jsdelivr.net/gh/omercotkd/exercises-gifs@main/assets/${tpl.gif_id}.gif`
                              : tpl?.gif_url || null;

                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleOpenExercisePreview(item.exercise_template_id)}
                                className="w-full flex items-center justify-between text-[11px] font-semibold text-zinc-300 hover:text-white p-1.5 rounded-xl hover:bg-white/5 transition text-left gap-2"
                                title="Toque para ver a demonstração 3D deste exercício"
                              >
                                <span className="truncate pr-2 flex items-center gap-2 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-white border border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center">
                                    {thumbUrl ? (
                                      <img
                                        src={thumbUrl}
                                        alt={item.title}
                                        loading="lazy"
                                        decoding="async"
                                        className="w-full h-full object-cover pointer-events-none select-none"
                                      />
                                    ) : (
                                      <Eye className="w-3.5 h-3.5 text-zinc-700" />
                                    )}
                                  </div>
                                  <span className="truncate">
                                    {idx + 1}. {item.title}
                                  </span>
                                </span>
                                <span className="text-[10px] text-zinc-400 shrink-0 font-mono">
                                  {item.sets.length}× {metric}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Botão de Iniciar Treino */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => handleStartPhysioRoutine(routine)}
                        className="w-full py-3 bg-white hover:bg-zinc-200 text-black font-black text-xs rounded-2xl transition active:scale-95 shadow-md flex items-center justify-center gap-2"
                      >
                        <Play className="w-3.5 h-3.5 fill-black" />
                        <span>Iniciar Treino</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SEÇÃO 2: PLANOS RECOMENDADOS PELA CLÍNICA (PROTOCOLOS COMPLETOS) */}
          <div className="space-y-3 pt-2">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Planos Recomendados pela Clínica ({RECOMMENDED_PHYSIO_ROUTINES.length})</span>
              </h2>
              <span className="text-[11px] text-zinc-400">
                Protocolos prontos elaborados por especialistas com foco em descompressão e postura
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {RECOMMENDED_PHYSIO_ROUTINES.map((routine, protoIdx) => {
                const protoRaw = PHYSIOTHERAPY_PROTOCOLS[protoIdx];

                return (
                  <div
                    key={routine.id}
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
                          {protoRaw?.target_region || 'Reabilitação'}
                        </span>
                        <span className="text-[11px] font-black text-zinc-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          ~{protoRaw?.estimated_minutes || 12} min
                        </span>
                      </div>

                      <h3 className="text-base font-black mt-2 leading-tight">{routine.title}</h3>
                      <p
                        className={`text-xs mt-1 line-clamp-2 ${
                          isLight ? 'text-zinc-600' : 'text-zinc-400'
                        }`}
                      >
                        {protoRaw?.subtitle || routine.notes}
                      </p>

                      {/* Lista de Exercícios na Sequência com Miniatura 3D */}
                      <div className="mt-3.5 pt-3 border-t border-[#27272a]/60 space-y-1.5">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block">
                          Sequência ({routine.exercises.length}): Toque para ver execução 3D
                        </span>
                        <div className="space-y-1">
                          {routine.exercises.map((item, idx) => {
                            const isDuration = Boolean(
                              item.sets[0]?.duration_seconds !== null &&
                                item.sets[0]?.duration_seconds !== undefined
                            );
                            const metric = isDuration
                              ? `${item.sets[0]?.duration_seconds || 30}s`
                              : `${item.sets[0]?.reps || 12} reps`;
                            const tpl =
                              PHYSIOTHERAPY_TEMPLATES.find((t) => t.id === item.exercise_template_id) ||
                              getPhysioTemplateById(item.exercise_template_id);
                            const thumbUrl = tpl?.gif_id
                              ? `https://cdn.jsdelivr.net/gh/omercotkd/exercises-gifs@main/assets/${tpl.gif_id}.gif`
                              : tpl?.gif_url || null;

                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleOpenExercisePreview(item.exercise_template_id)}
                                className="w-full flex items-center justify-between text-[11px] font-semibold text-zinc-300 hover:text-white p-1.5 rounded-xl hover:bg-white/5 transition text-left gap-2"
                                title="Toque para ver a demonstração 3D deste exercício"
                              >
                                <span className="truncate pr-2 flex items-center gap-2 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-white border border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center">
                                    {thumbUrl ? (
                                      <img
                                        src={thumbUrl}
                                        alt={item.title}
                                        loading="lazy"
                                        decoding="async"
                                        className="w-full h-full object-cover pointer-events-none select-none"
                                      />
                                    ) : (
                                      <Eye className="w-3.5 h-3.5 text-zinc-700" />
                                    )}
                                  </div>
                                  <span className="truncate">
                                    {idx + 1}. {item.title}
                                  </span>
                                </span>
                                <span className="text-[10px] text-zinc-500 shrink-0 font-mono">
                                  {item.sets.length}× {metric}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Botões de Ação do Protocolo */}
                    <div className="space-y-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleStartPhysioRoutine(routine)}
                        className="w-full py-3 bg-white hover:bg-zinc-200 text-black font-black text-xs rounded-2xl transition active:scale-95 shadow-md flex items-center justify-center gap-2"
                      >
                        <Play className="w-3.5 h-3.5 fill-black" />
                        <span>Iniciar Treino</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyProtocolToMyRoutines(routine)}
                          className="flex-1 py-2 bg-[#18181b] hover:bg-[#202024] border border-[#27272a] text-zinc-300 hover:text-white font-bold text-[11px] rounded-xl transition flex items-center justify-center gap-1.5"
                          title="Copiar para Meus Planos para personalizar"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copiar p/ Meus Planos</span>
                        </button>

                        {protoRaw && (
                          <button
                            type="button"
                            onClick={() => handleStartProtocolQuickPlayer(protoRaw)}
                            className="px-3 py-2 bg-[#18181b] hover:bg-[#202024] border border-[#27272a] text-zinc-400 hover:text-white font-bold text-[11px] rounded-xl transition flex items-center gap-1"
                            title="Player guiado rápido sem salvar treino"
                          >
                            <Clock className="w-3 h-3" />
                            <span>Player Rápido</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ABA 2: BIBLIOTECA DE EXERCÍCIOS DE FISIOTERAPIA */}
      {/* ======================================================== */}
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

          {/* Lista de Cards de Exercícios com Miniatura 3D */}
          <div className="space-y-3">
            {filteredExercises.map((ex) => {
              const thumbUrl = ex.gif_id
                ? `https://cdn.jsdelivr.net/gh/omercotkd/exercises-gifs@main/assets/${ex.gif_id}.gif`
                : ex.gif_url || null;

              return (
                <div
                  key={ex.id}
                  className={`p-4 rounded-3xl border transition ${
                    isLight
                      ? 'bg-white border-zinc-200 text-black'
                      : 'bg-[#141416] border-[#27272a] text-white'
                  } space-y-3`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Miniatura 3D Animada à Esquerda */}
                    <button
                      type="button"
                      onClick={() => handleOpenExercisePreview(`physio-${ex.id}`)}
                      className="w-16 h-16 rounded-2xl bg-white border border-zinc-700 overflow-hidden shrink-0 shadow-inner relative group"
                      title="Toque para ver a demonstração 3D ampliada"
                    >
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt={ex.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover pointer-events-none select-none"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#18181b] flex items-center justify-center">
                          <Activity className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-black/80 text-[8px] font-black text-white uppercase">
                        3D
                      </span>
                    </button>

                    <div className="min-w-0 flex-1">
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
                      onClick={() => handleOpenExercisePreview(`physio-${ex.id}`)}
                      className="flex-1 py-2.5 bg-white hover:bg-zinc-200 text-black font-black text-xs rounded-xl transition active:scale-95 shadow-md flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Execução 3D</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStartSingleExercise(ex)}
                      className="px-3 py-2.5 bg-[#18181b] hover:bg-[#222226] border border-[#27272a] text-zinc-300 font-bold text-xs rounded-xl transition flex items-center gap-1"
                      title="Praticar isoladamente com cronômetro"
                    >
                      <Play className="w-3 h-3 fill-zinc-300" />
                      <span>Praticar</span>
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
              );
            })}

            {filteredExercises.length === 0 && (
              <div className="p-8 text-center bg-[#121214] border border-[#27272a] rounded-3xl">
                <p className="text-xs text-zinc-400">Nenhum exercício encontrado para essa busca.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE DEMONSTRAÇÃO VISUAL / EXECUÇÃO DO EXERCÍCIO */}
      {previewTemplate && (
        <div
          className="fixed inset-0 z-[140] flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewTemplate(null);
          }}
        >
          <div className="w-full max-w-md bg-[#121214] border border-[#27272a] rounded-t-3xl sm:rounded-2xl p-4 shadow-2xl space-y-3 text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
              <div>
                <h3 className="text-sm font-black text-white">{previewTemplate.title}</h3>
                <span className="text-[11px] text-zinc-400 capitalize">
                  {previewTemplate.muscles_pt || previewTemplate.primary_muscle_group}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ExerciseVisualDemo exercise={previewTemplate} />
          </div>
        </div>
      )}

      {/* MODAL CRIADOR / EDITOR DE PLANOS DE FISIOTERAPIA */}
      <PhysioRoutineEditorModal
        routineToEdit={editingRoutine}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingRoutine(null);
        }}
        onSaved={(r) => {
          showToast(`✓ Plano "${r.title}" salvo com sucesso!`);
        }}
      />

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE PLANO */}
      {routineToDelete && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-xs bg-[#18181b] border border-[#27272a] rounded-2xl p-5 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Excluir Plano?</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Tem certeza que deseja excluir o plano <strong>"{routineToDelete.title}"</strong>?
                Esta ação é irreversível.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRoutineToDelete(null)}
                className="flex-1 py-2 bg-[#27272a] text-zinc-300 font-bold text-xs rounded-xl hover:bg-zinc-700 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteRoutine}
                className="flex-1 py-2 bg-red-600 text-white font-bold text-xs rounded-xl hover:bg-red-700 transition shadow-md"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PLAYER DA SESSÃO TERAPÊUTICA GUIADA RÁPIDA (MODAL TELA CHEIA) */}
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
                  const playerGifUrl = ex.gif_id
                    ? `https://cdn.jsdelivr.net/gh/omercotkd/exercises-gifs@main/assets/${ex.gif_id}.gif`
                    : ex.gif_url || null;

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

                      {/* Boneco 3D Animado em Tempo Real no Player */}
                      {playerGifUrl && (
                        <div className="w-40 h-40 mx-auto rounded-3xl bg-white border border-zinc-700 overflow-hidden shadow-xl flex items-center justify-center">
                          <img
                            src={playerGifUrl}
                            alt={ex.title}
                            className="w-full h-full object-contain pointer-events-none select-none"
                          />
                        </div>
                      )}

                      {/* Display do Cronômetro / Contagem */}
                      {isDuration ? (
                        <div className="p-6 rounded-3xl bg-[#141416] border border-[#27272a] shadow-inner space-y-2">
                          <span className="text-5xl font-black tracking-tighter text-white tabular-nums">
                            {formatSecondsClock(sessionTimerSeconds)}
                          </span>
                          <span className="text-[11px] font-bold text-zinc-400 block uppercase tracking-wider">
                            {sessionTimerSeconds === 0
                              ? 'Concluído! Toque Avançar'
                              : 'Sustente com respiração suave'}
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
