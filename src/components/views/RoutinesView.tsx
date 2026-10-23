import React, { useState, useMemo } from 'react';
import {
  Play,
  Plus,
  Folder,
  ChevronRight,
  MoreVertical,
  Dumbbell,
  Trash2,
  Edit2,
  Copy,
  AlertTriangle,
  Sun,
  Moon,
  Users,
  FolderPlus,
  Cloud,
  Flame,
  CheckCircle2,
  Clock,
  X,
  Sparkles,
  Droplets,
  Droplet
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Routine, ExerciseTemplate } from '../../types';
import { RoutineEditorModal } from './RoutineEditorModal';
import { UserAccountModal } from '../UserAccountModal';
import { WaterTrackerModal } from '../WaterTrackerModal';
import { ExerciseVisualDemo } from '../ExerciseVisualDemo';
import { SymmetryBodyMap } from '../SymmetryBodyMap';
import { POPULAR_FOLDER_PRESETS, FolderPreset } from '../../data/defaultRoutines';

interface RoutineQueueMeta {
  routine: Routine;
  lastDoneTime: number;
  lastDoneDateStr: string | null;
  doneThisWeek: boolean;
  isDoneInCurrentCycle: boolean;
  isTopRecommended: boolean;
  isNextInQueue: boolean;
}

export const RoutinesView: React.FC = () => {
  const {
    routines,
    folders,
    workouts,
    exercises: allTemplates,
    startWorkout,
    deleteRoutine,
    saveRoutine,
    deleteFolder,
    createFolder,
    addFolderWithPreset,
    currentUser,
    isCurrentUserAdmin,
    cloudStatus,
    theme,
    toggleTheme,
    todayWaterIntake,
    todayWaterProgressPercent,
    waterTrackerConfig,
    addWaterLog,
    isWaterModalOpen,
    setWaterModalOpen
  } = useApp();

  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [selectedFolderForNewRoutine, setSelectedFolderForNewRoutine] = useState<number | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeMenuRoutineId, setActiveMenuRoutineId] = useState<string | null>(null);
  const [routineToDelete, setRoutineToDelete] = useState<Routine | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<{ id: number; title: string; count: number } | null>(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderTitle, setNewFolderTitle] = useState('');
  const [showSuggestedFolders, setShowSuggestedFolders] = useState(false);

  // Modal de Confirmação ao tentar repetir um treino já realizado na semana / ciclo
  const [repeatConfirmRoutine, setRepeatConfirmRoutine] = useState<{
    routine: Routine;
    lastDoneDateStr: string;
    recommendedAlternative?: Routine | null;
  } | null>(null);

  // Modal rápido para visualizar a execução 3D de um exercício direto do card do plano
  const [previewExercise3D, setPreviewExercise3D] = useState<ExerciseTemplate | null>(null);

  // Toast flutuante de sucesso ao salvar plano de treino
  const [toastFeedback, setToastFeedback] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastFeedback(msg);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([30, 20, 30]);
    }
    setTimeout(() => {
      setToastFeedback(null);
    }, 3800);
  };

  const isLight = theme === 'light';

  // Mapa rápido de ExerciseTemplate para exibir miniaturas 3D dentro dos planos de treino
  const templateMap = useMemo(() => {
    const map: Record<string, ExerciseTemplate> = {};
    allTemplates.forEach((t) => {
      map[t.id] = t;
      map[t.title.toLowerCase()] = t;
    });
    return map;
  }, [allTemplates]);

  // Normaliza texto (sem acentos e minúsculo) para comparar nomes de treinos personalizados
  const normalizeText = (str: string): string =>
    (str || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  // Extrai grupos musculares principais a partir do nome personalizado ("Peito", "Costas", "Bíceps"...) e dos exercícios
  const extractTargetMuscles = (title: string, exList: { exercise_template_id: string; title: string }[]): Set<string> => {
    const muscles = new Set<string>();
    const normTitle = normalizeText(title);

    const keywordMap: [string[], string][] = [
      [['peito', 'peitoral', 'supino', 'push'], 'peito'],
      [['costa', 'costas', 'dorsal', 'remada', 'puxada', 'pull'], 'costas'],
      [['biceps', 'rosca', 'braco'], 'biceps'],
      [['triceps', 'testa', 'pulley'], 'triceps'],
      [['ombro', 'ombros', 'deltoide', 'elevacao'], 'ombros'],
      [['perna', 'pernas', 'quadriceps', 'agachamento', 'leg', 'inferior'], 'quadriceps'],
      [['posterior', 'isquiotibiais', 'mesa flexora', 'stiff'], 'isquiotibiais'],
      [['gluteo', 'gluteos', 'elevacao pelvica'], 'gluteos'],
      [['panturrilha', 'gemeos'], 'panturrilha'],
      [['abdomen', 'abdominal', 'core'], 'abdomen']
    ];

    keywordMap.forEach(([keywords, group]) => {
      if (keywords.some((kw) => normTitle.includes(kw))) {
        muscles.add(group);
      }
    });

    // Conta os grupos musculares dos exercícios que compõem o treino criado pelo usuário
    const muscleCounts: Record<string, number> = {};
    exList.forEach((ex) => {
      const tpl =
        templateMap[ex.exercise_template_id] ||
        templateMap[ex.title.toLowerCase()];
      const pGroup = tpl?.primary_muscle_group?.toLowerCase();
      if (pGroup) {
        const normalizedGroup = pGroup === 'lats' ? 'costas' : pGroup;
        muscleCounts[normalizedGroup] = (muscleCounts[normalizedGroup] || 0) + 1;
      }
    });

    const totalEx = exList.length;
    if (totalEx > 0) {
      Object.entries(muscleCounts).forEach(([group, count]) => {
        // Se pelo menos 2 exercícios ou >= 40% do treino foca naquele músculo, marca como músculo-alvo do treino
        if (count >= 2 || count / totalEx >= 0.4) {
          muscles.add(group);
        }
      });
    }

    return muscles;
  };

  // Descobre o último treino realizado que corresponde a esta rotina personalizada (por ID, nome, exercícios em comum ou grupo muscular)
  const findLatestMatchingWorkoutForRoutine = (r: Routine) => {
    const normRoutineTitle = normalizeText(r.title);
    const routineExIds = new Set(
      r.exercises.map((e) => e.exercise_template_id || normalizeText(e.title))
    );
    const routineMuscles = extractTargetMuscles(r.title, r.exercises);

    for (const w of workouts) {
      // 1. Match direto por ID da rotina ou Nome do treino
      const normWTitle = normalizeText(w.title);
      if (
        w.routine_id === r.id ||
        (normRoutineTitle && normWTitle === normRoutineTitle)
      ) {
        return w;
      }

      // 2. Match inteligente por exercícios em comum (treinos personalizados criados pelo usuário)
      const completedExercises = w.exercises.filter((ex) =>
        ex.sets.some((s) => s.completed)
      );
      const effectiveWExercises =
        completedExercises.length > 0 ? completedExercises : w.exercises;

      if (routineExIds.size > 0 && effectiveWExercises.length > 0) {
        let sharedCount = 0;
        effectiveWExercises.forEach((wEx) => {
          const keyId = wEx.exercise_template_id;
          const keyTitle = normalizeText(wEx.title);
          if (routineExIds.has(keyId) || routineExIds.has(keyTitle)) {
            sharedCount++;
          }
        });

        const minRequired = routineExIds.size === 1 ? 1 : Math.max(2, Math.ceil(routineExIds.size * 0.5));
        if (sharedCount >= minRequired) {
          return w;
        }
      }

      // 3. Match inteligente por grupo muscular / nome customizado (Ex: "Peito", "Costas", "Bíceps")
      if (routineMuscles.size > 0 && effectiveWExercises.length > 0) {
        const wMuscles = extractTargetMuscles(w.title, effectiveWExercises);
        if (wMuscles.size > 0) {
          let matchedMuscles = 0;
          routineMuscles.forEach((m) => {
            if (wMuscles.has(m)) matchedMuscles++;
          });
          // Se todos os grupos principais do treino (ex: Peito, ou Peito + Bíceps) foram treinados nesse workout
          if (
            matchedMuscles === routineMuscles.size ||
            (routineMuscles.size >= 2 && matchedMuscles >= 2)
          ) {
            return w;
          }
        }
      }
    }

    return undefined;
  };

  // Calcula metadados de fila de prioridade para uma lista/categoria de treinos (incluindo treinos criados pelo próprio usuário)
  const buildPriorityQueueForList = (list: Routine[]): RoutineQueueMeta[] => {
    if (list.length === 0) return [];

    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    // 1. Descobre quando cada rotina (ou seus exercícios/músculos) foi treinada pela última vez
    const withLastTime = list.map((r, originalIdx) => {
      const matchedWorkout = findLatestMatchingWorkoutForRoutine(r);
      const lastTime = matchedWorkout
        ? new Date(matchedWorkout.end_time || matchedWorkout.start_time).getTime()
        : 0;
      const doneThisWeek = lastTime > 0 && now - lastTime <= sevenDaysMs;

      let lastDoneDateStr: string | null = null;
      if (lastTime > 0) {
        const diffDays = Math.floor((now - lastTime) / (24 * 60 * 60 * 1000));
        if (diffDays === 0) lastDoneDateStr = 'Hoje';
        else if (diffDays === 1) lastDoneDateStr = 'Ontem';
        else lastDoneDateStr = `Há ${diffDays} dias`;
      }

      return {
        routine: r,
        originalIdx,
        lastDoneTime: lastTime,
        lastDoneDateStr,
        doneThisWeek
      };
    });

    // 2. Se houver apenas 1 treino na lista, ainda marca se já foi treinado recentemente
    if (withLastTime.length === 1) {
      const item = withLastTime[0];
      return [
        {
          routine: item.routine,
          lastDoneTime: item.lastDoneTime,
          lastDoneDateStr: item.lastDoneDateStr,
          doneThisWeek: item.doneThisWeek,
          isDoneInCurrentCycle: item.doneThisWeek,
          isTopRecommended: !item.doneThisWeek,
          isNextInQueue: false
        }
      ];
    }

    // 3. Ordena a fila de prioridade:
    // Quem NUNCA foi feito (lastDoneTime === 0) ou foi feito HÁ MAIS TEMPO fica no TOPO (Recomendado).
    // Quem acabou de ser feito (maior lastDoneTime) vai para o FINAL da fila!
    const sorted = [...withLastTime].sort((a, b) => {
      if (a.lastDoneTime === 0 && b.lastDoneTime === 0) {
        return a.originalIdx - b.originalIdx;
      }
      if (a.lastDoneTime === 0) return -1;
      if (b.lastDoneTime === 0) return 1;
      return a.lastDoneTime - b.lastDoneTime;
    });

    const anyDoneThisWeek = sorted.some((item) => item.doneThisWeek);
    const allDoneThisWeek = sorted.every((item) => item.doneThisWeek);

    return sorted.map((item, idx) => {
      const isDoneInCurrentCycle = allDoneThisWeek
        ? idx > 0 && item.doneThisWeek
        : item.doneThisWeek;

      return {
        routine: item.routine,
        lastDoneTime: item.lastDoneTime,
        lastDoneDateStr: item.lastDoneDateStr,
        doneThisWeek: item.doneThisWeek,
        isDoneInCurrentCycle,
        isTopRecommended: idx === 0 && (!allDoneThisWeek || anyDoneThisWeek),
        isNextInQueue: idx === 1 && sorted.length >= 2 && !isDoneInCurrentCycle
      };
    });
  };

  // Fila global de todos os treinos do usuário (para sugerir o próximo treino mesmo entre pastas diferentes)
  const globalQueue = useMemo(
    () => buildPriorityQueueForList(routines),
    [routines, workouts, templateMap]
  );

  // Ao clicar em Iniciar: verifica se já treinou este plano/músculo recentemente para exibir o aviso de confirmação
  const handleStartRoutineClick = (
    meta: RoutineQueueMeta,
    groupQueue: RoutineQueueMeta[]
  ) => {
    if (meta.doneThisWeek) {
      const topAlt =
        groupQueue.find(
          (m) => m.routine.id !== meta.routine.id && !m.isDoneInCurrentCycle
        ) ||
        globalQueue.find(
          (m) => m.routine.id !== meta.routine.id && !m.isDoneInCurrentCycle
        );
      setRepeatConfirmRoutine({
        routine: meta.routine,
        lastDoneDateStr: meta.lastDoneDateStr || 'recentemente nesta semana',
        recommendedAlternative: topAlt ? topAlt.routine : null
      });
      return;
    }
    startWorkout(meta.routine.id);
  };

  const handleDuplicateRoutine = (routine: Routine) => {
    const dup: Routine = {
      ...routine,
      id: `routine-${Date.now()}`,
      title: `${routine.title} (Cópia)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    saveRoutine(dup);
    setActiveMenuRoutineId(null);
  };

  const confirmDeleteRoutine = () => {
    if (routineToDelete) {
      deleteRoutine(routineToDelete.id);
      setRoutineToDelete(null);
    }
  };

  const confirmDeleteFolder = () => {
    if (folderToDelete) {
      deleteFolder(folderToDelete.id);
      setFolderToDelete(null);
    }
  };

  const handleCreateNewFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderTitle.trim()) return;
    createFolder(newFolderTitle.trim());
    setNewFolderTitle('');
    setIsCreatingFolder(false);
  };

  const handleAddFolderPreset = (fPreset: FolderPreset) => {
    addFolderWithPreset(fPreset.title, fPreset.routines);
    setShowSuggestedFolders(false);
  };

  // Agrupamento por pasta com proteção contra pastas órfãs
  const routinesByFolder: Record<string, Routine[]> = {};
  const uncategorized: Routine[] = [];
  const existingFolderIds = new Set(folders.map((f) => f.id));

  routines.forEach((r) => {
    if (r.folder_id && existingFolderIds.has(r.folder_id)) {
      if (!routinesByFolder[r.folder_id]) routinesByFolder[r.folder_id] = [];
      routinesByFolder[r.folder_id].push(r);
    } else {
      uncategorized.push(r);
    }
  });

  const uncategorizedQueue = useMemo(
    () => buildPriorityQueueForList(uncategorized),
    [uncategorized, workouts]
  );

  const renderRoutineCard = (meta: RoutineQueueMeta, groupQueue: RoutineQueueMeta[]) => {
    const r = meta.routine;
    const targetMuscles = Array.from(extractTargetMuscles(r.title, r.exercises));
    const totalSets = r.exercises.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0);
    const isBackRoutine = targetMuscles.some((m) =>
      ['costas', 'trapezio', 'lombar', 'dorsal', 'isquiotibiais', 'gluteos'].includes(m)
    );

    return (
      <div
        key={r.id}
        className={`rounded-2xl p-4 shadow-md flex flex-col gap-3 relative transition text-white border ${
          meta.isTopRecommended
            ? 'bg-[#141416] border-white shadow-xl'
            : meta.isDoneInCurrentCycle
            ? 'bg-[#111113] border-[#222225] opacity-80 hover:opacity-100'
            : 'bg-[#141416] border-[#27272a] hover:border-zinc-500'
        }`}
      >
        {/* Badges da Fila de Prioridade (Recomendado / Próximo / Já Treinado na Semana) */}
        {(meta.isTopRecommended || meta.isNextInQueue || meta.doneThisWeek) && (
          <div className="flex items-center justify-between gap-2 flex-wrap -mb-1">
            {meta.isTopRecommended ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-wider shadow-sm">
                <Flame className="w-3 h-3 fill-black" />
                <span>Recomendado Agora • 1º da Fila</span>
              </span>
            ) : meta.isNextInQueue ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-600 text-zinc-200 text-[10px] font-bold uppercase tracking-wider">
                <Clock className="w-3 h-3" />
                <span>Próximo na Fila</span>
              </span>
            ) : (
              <span />
            )}

            {meta.doneThisWeek && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 text-[10px] font-bold">
                <CheckCircle2 className="w-3 h-3 text-zinc-300" />
                <span>Já treinado ({meta.lastDoneDateStr})</span>
              </span>
            )}
          </div>
        )}

        {/* Cabeçalho do Card estilo Symmetry com Boneco Anatômico na Direita */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-sky-400 mb-1">
              <span>{r.exercises.length} {r.exercises.length === 1 ? 'exercício' : 'exercícios'}</span>
              <span>•</span>
              <span>{totalSets} séries</span>
            </div>
            <h3 className="text-base font-black text-white hover:text-zinc-300 transition truncate">
              {r.title}
            </h3>
            {r.notes ? (
              <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">{r.notes}</p>
            ) : (
              <div className="text-[11px] text-zinc-400 mt-1.5 space-y-0.5">
                {r.exercises.slice(0, 3).map((ex, i) => (
                  <span key={i} className="block truncate text-zinc-300">• {ex.title}</span>
                ))}
                {r.exercises.length > 3 && (
                  <span className="text-[10px] text-zinc-500 font-bold block">+ {r.exercises.length - 3} outros</span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-start gap-1.5 shrink-0">
            {/* Boneco do Symmetry no Card */}
            <div
              className="p-1 rounded-xl bg-black/60 border border-zinc-800/80 shadow-inner flex items-center justify-center cursor-pointer hover:border-sky-500/50 transition"
              title="Músculos trabalhados neste treino (Symmetry)"
            >
              <SymmetryBodyMap
                primaryMuscles={targetMuscles.length > 0 ? targetMuscles : ['peito']}
                view={isBackRoutine ? 'posterior' : 'anterior'}
                size="mini"
              />
            </div>

            {/* Menu de Opções (Editar, Duplicar, Excluir) */}
            <div className="relative">
              <button
                onClick={() =>
                  setActiveMenuRoutineId(activeMenuRoutineId === r.id ? null : r.id)
                }
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
                title="Mais opções do plano"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

            {activeMenuRoutineId === r.id && (
              <div className="absolute right-0 top-8 z-30 w-44 bg-[#1c1c1f] border border-[#3f3f46] rounded-xl shadow-2xl py-1 text-xs text-zinc-200 animate-in fade-in duration-100">
                <button
                  onClick={() => {
                    setEditingRoutine(r);
                    setIsEditorOpen(true);
                    setActiveMenuRoutineId(null);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-zinc-800 flex items-center gap-2"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Editar Plano
                </button>
                <button
                  onClick={() => handleDuplicateRoutine(r)}
                  className="w-full px-3 py-2 text-left hover:bg-zinc-800 flex items-center gap-2"
                >
                  <Copy className="w-3.5 h-3.5" /> Duplicar Plano
                </button>
                <div className="h-px bg-[#27272a] my-1" />
                <button
                  onClick={() => {
                    setRoutineToDelete(r);
                    setActiveMenuRoutineId(null);
                  }}
                  className="w-full px-3 py-2 text-left text-red-400 hover:bg-red-950/40 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Excluir Plano
                </button>
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Visualização 3D dos Exercícios dentro do próprio Plano de Treino */}
        {r.exercises.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto py-1 no-scrollbar -mx-1 px-1">
            {r.exercises.map((ex, idx) => {
              const tpl =
                templateMap[ex.exercise_template_id] ||
                templateMap[ex.title.toLowerCase()];
              const thumbUrl = tpl?.gif_id
                ? `https://cdn.jsdelivr.net/gh/omercotkd/exercises-gifs@main/assets/${tpl.gif_id}.gif`
                : tpl?.gif_url || null;

              return (
                <button
                  key={`${r.id}-${ex.id}-${idx}`}
                  type="button"
                  onClick={() => {
                    if (tpl) setPreviewExercise3D(tpl);
                  }}
                  className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-[#18181b] hover:bg-[#222226] border border-[#27272a] shrink-0 text-left transition active:scale-95 max-w-[195px]"
                  title="Toque para ver a execução 3D deste exercício"
                >
                  <div className="w-9 h-9 rounded-lg bg-white border border-[#27272a] overflow-hidden shrink-0 flex items-center justify-center">
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt={ex.title}
                        loading="lazy"
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#121214] flex items-center justify-center">
                        <Dumbbell className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-white truncate block">
                      {ex.title}
                    </span>
                    <span className="text-[9px] text-zinc-400 font-semibold block">
                      {ex.sets.length} {ex.sets.length === 1 ? 'série' : 'séries'} • Ver 3D
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-zinc-500 italic">Nenhum exercício adicionado</p>
        )}

        {/* Rodapé do Card com Botão Iniciar e Editar Rápido */}
        <div className="flex items-center justify-between pt-2 border-t border-[#27272a]">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-500 font-semibold">
              {r.exercises.length} {r.exercises.length === 1 ? 'Exercício' : 'Exercícios'}
            </span>
            <button
              onClick={() => {
                setEditingRoutine(r);
                setIsEditorOpen(true);
              }}
              className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 font-semibold underline"
            >
              <Edit2 className="w-3 h-3" /> Editar
            </button>
          </div>

          <button
            onClick={() => handleStartRoutineClick(meta, groupQueue)}
            className={`px-4 py-2 font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition ${
              meta.isDoneInCurrentCycle
                ? 'bg-[#222226] hover:bg-zinc-700 text-zinc-200 border border-[#3f3f46]'
                : 'bg-white hover:bg-zinc-200 text-black'
            }`}
          >
            <Play
              className={`w-3 h-3 ${
                meta.isDoneInCurrentCycle ? 'fill-zinc-200' : 'fill-black'
              }`}
            />
            <span>{meta.isDoneInCurrentCycle ? 'Repetir' : 'Iniciar'}</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-full view-container space-y-4 text-white">
      {/* Topo Superior: Marca CHANGE, Perfil Ativo e Botão Modo Claro/Escuro */}
      <div className="flex items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-white text-black font-black flex items-center justify-center text-xs shadow-md shrink-0 relative">
            <Dumbbell className="w-4 h-4 stroke-[2.5] text-black" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg md:text-2xl font-black tracking-wider text-white">CHANGE</h1>
              {cloudStatus === 'synced' && (
                <span
                  title="Sincronizado na nuvem"
                  className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 shrink-0"
                >
                  <Cloud className="w-2.5 h-2.5" /> Nuvem
                </span>
              )}
            </div>
            <button
              onClick={() => setIsAccountModalOpen(true)}
              className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition max-w-full"
            >
              <span className="truncate">
                Conta: <strong>{currentUser.name}</strong>{' '}
                {isCurrentUserAdmin ? '(Admin • Cadastrar)' : '(Minha Conta)'}
              </span>
              <Users className="w-3 h-3 shrink-0" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleTheme}
            className="p-2 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] rounded-xl text-white transition active:scale-95 flex items-center gap-1.5 text-xs font-bold"
            title="Alternar entre Modo Escuro e Claro"
          >
            {isLight ? (
              <>
                <Moon className="w-4 h-4 fill-white" />
                <span className="text-[11px]">Escuro</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 fill-white text-white" />
                <span className="text-[11px]">Claro</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* WIDGET HERO: HIDRATAÇÃO & ÁGUA DIÁRIA */}
      <div
        className={`p-3 rounded-2xl border transition-all ${
          isLight
            ? 'bg-white border-zinc-200/90 shadow-sm text-zinc-900'
            : 'bg-[#121318] border-zinc-800/90 shadow-lg text-white'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setWaterModalOpen(true)}
            className="flex items-center gap-3 min-w-0 text-left active:scale-[0.98] transition flex-1"
          >
            {/* Ícone com identidade visual Change (igual ao halter do canto) */}
            <div
              className={`w-9 h-9 rounded-xl font-black flex items-center justify-center shadow-md border shrink-0 ${
                isLight ? 'bg-black text-white border-black' : 'bg-white text-black border-zinc-300'
              }`}
            >
              <Droplet className={`w-5 h-5 stroke-[2.4] ${isLight ? 'text-white' : 'text-black'}`} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs font-black tracking-tight ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                  Hidratação Hoje
                </span>
                <span className={`text-xs font-black ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                  {todayWaterIntake.toLocaleString('pt-BR')} ml
                </span>
              </div>

              {/* Barra de Progresso Fluida */}
              <div className="mt-1.5 w-full h-1.5 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    isLight ? 'bg-black' : 'bg-white'
                  }`}
                  style={{ width: `${Math.min(100, todayWaterProgressPercent)}%` }}
                />
              </div>

              {/* Pequeno embaixo da barrinha: 'faltam tanto tanto' */}
              <div className="mt-1 flex items-center justify-between text-[10px]">
                <span className={`font-semibold ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {todayWaterIntake >= (waterTrackerConfig.daily_goal_ml || 2500)
                    ? 'Meta batida! 🏆'
                    : `Faltam ${Math.max(0, (waterTrackerConfig.daily_goal_ml || 2500) - todayWaterIntake).toLocaleString('pt-BR')} ml`}
                </span>
                <span className={`font-bold ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {todayWaterProgressPercent}%
                </span>
              </div>
            </div>
          </button>

          {/* Ações Rápidas de Ingestão: +250ml e +500ml reduzidos */}
          <div className="flex items-center gap-1 shrink-0 pl-1.5 border-l border-zinc-200 dark:border-zinc-800">
            <button
              onClick={(e) => {
                e.stopPropagation();
                addWaterLog(250);
              }}
              className={`px-2 py-1 rounded-lg text-[10px] font-black border transition active:scale-95 flex flex-col items-center justify-center ${
                isLight
                  ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-zinc-200 shadow-sm'
                  : 'bg-[#181a20] hover:bg-zinc-800 text-zinc-200 border-zinc-700/80 shadow-sm'
              }`}
              title="Registrar +250 ml de água"
            >
              <span>+250</span>
              <span className="text-[7px] opacity-60 leading-none">ml</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                addWaterLog(500);
              }}
              className={`px-2 py-1 rounded-lg text-[10px] font-black border transition active:scale-95 flex flex-col items-center justify-center ${
                isLight
                  ? 'bg-black text-white hover:bg-zinc-800 border-black shadow-sm'
                  : 'bg-white text-black hover:bg-zinc-200 border-white shadow-sm'
              }`}
              title="Registrar +500 ml de água"
            >
              <span>+500</span>
              <span className="text-[7px] opacity-60 leading-none">ml</span>
            </button>
          </div>
        </div>
      </div>

      {/* BOTÃO HERO: MONTAR NOVO PLANO DE TREINO */}
      <div className="grid grid-cols-1 gap-2.5">
        <button
          onClick={() => {
            setEditingRoutine(null);
            setIsEditorOpen(true);
          }}
          className="w-full p-4 bg-white text-black rounded-2xl shadow-xl flex items-center justify-between active:scale-98 transition group border border-zinc-200"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shadow-md">
              <Plus className="w-6 h-6 stroke-[3] text-white" />
            </div>
            <div className="text-left">
              <span className="text-sm font-black block">Montar Novo Plano de Treino</span>
              <span className="text-xs text-zinc-700">
                Use uma sugestão conhecida ou monte seu treino do zero
              </span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-zinc-800 group-hover:translate-x-1 transition" />
        </button>

        {/* Treino Livre Rápido (Secundário) */}
        <button
          onClick={() => startWorkout(undefined, 'Treino Livre')}
          className="w-full py-2.5 px-3.5 bg-[#141416] hover:bg-[#1a1a1d] border border-[#27272a] rounded-xl flex items-center justify-between text-xs font-bold transition active:scale-98"
        >
          <div className="flex items-center gap-2 text-zinc-300">
            <Dumbbell className="w-4 h-4 text-white" />
            <span>Iniciar Treino Vazio Rápido</span>
          </div>
          <span className="text-[11px] text-zinc-500">Sem plano prévio →</span>
        </button>
      </div>

      {/* Divisões e Planos do Usuário com Fila de Prioridade Inteligente */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-zinc-400 block">
              Seus Planos de Treino ({routines.length})
            </span>
            {routines.length > 1 && (
              <span className="text-[10px] text-zinc-500">
                Ordenados automaticamente por fila de prioridade (próximo treino no topo)
              </span>
            )}
          </div>
          <button
            onClick={() => setIsCreatingFolder(!isCreatingFolder)}
            className="text-xs font-bold text-white hover:underline flex items-center gap-1 shrink-0"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>+ Nova Pasta</span>
          </button>
        </div>

        {/* Formulário de Nova Pasta */}
        {isCreatingFolder && (
          <form
            onSubmit={handleCreateNewFolder}
            className="p-3 bg-[#18181b] border border-[#27272a] rounded-xl flex items-center gap-2 animate-in fade-in duration-100"
          >
            <input
              type="text"
              value={newFolderTitle}
              onChange={(e) => setNewFolderTitle(e.target.value)}
              placeholder="Nome da pasta (Ex: Divisão ABC)"
              className="flex-1 bg-[#121214] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
              autoFocus
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-white text-black font-bold text-xs rounded-lg active:scale-95 transition"
            >
              Criar
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingFolder(false)}
              className="px-2 py-1.5 text-zinc-400 text-xs hover:text-white"
            >
              Cancelar
            </button>
          </form>
        )}

        {/* Seção Compacta e Recolhível de Pastas de Treino Sugeridas (ABC, Upper/Lower, ABCD...) */}
        <div className="bg-[#141416] border border-[#27272a] rounded-xl overflow-hidden transition">
          <button
            type="button"
            onClick={() => setShowSuggestedFolders(!showSuggestedFolders)}
            className="w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-[#18181b] transition"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-3.5 h-3.5 text-white shrink-0" />
              <span className="text-xs font-black text-white truncate">
                Sugestões de Divisões Prontas (Pastas com Treinos)
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-400 shrink-0">
              <span>{showSuggestedFolders ? 'Recolher' : 'Ver divisões'}</span>
              <ChevronRight
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  showSuggestedFolders ? 'rotate-90' : ''
                }`}
              />
            </div>
          </button>

          {showSuggestedFolders && (
            <div className="p-3 border-t border-[#27272a] space-y-2 bg-[#0d0d0f] animate-in fade-in duration-150">
              <p className="text-[11px] text-zinc-400">
                Toque para adicionar a pasta completa com todos os treinos da divisão já organizados dentro dela:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {POPULAR_FOLDER_PRESETS.map((fPreset) => (
                  <div
                    key={fPreset.id}
                    className="p-3 rounded-xl bg-[#141416] border border-[#27272a] hover:border-zinc-500 transition flex flex-col justify-between gap-2.5"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-white text-black">
                          {fPreset.tag}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-bold">
                          {fPreset.routines.map((r) => r.title.split('—')[0].trim()).join(' • ')}
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-white">{fPreset.title}</h4>
                      <p className="text-[10px] text-zinc-400 line-clamp-2 mt-0.5">
                        {fPreset.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddFolderPreset(fPreset)}
                      className="w-full py-2 bg-[#222226] hover:bg-white text-white hover:text-black rounded-lg text-[11px] font-black transition active:scale-95 flex items-center justify-center gap-1.5 border border-[#2e2e34]"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span>Adicionar Pasta Completa</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Estado Vazio Limpo na Primeira Tela */}
        {routines.length === 0 && folders.length === 0 && (
          <div className="bg-[#141416] border border-dashed border-[#27272a] rounded-2xl p-6 text-center space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-[#18181b] border border-[#27272a] flex items-center justify-center mx-auto text-zinc-300">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-white">
                Nenhum plano de treino definido ainda
              </h3>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                Sua tela inicial está limpa para você definir exatamente quais treinos vai começar a fazer.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  setEditingRoutine(null);
                  setIsEditorOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white text-black rounded-xl text-xs font-black transition active:scale-95 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Montar Meu Primeiro Treino</span>
              </button>
              <button
                onClick={() => setShowSuggestedFolders(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#1e1e22] hover:bg-[#27272c] border border-[#2e2e34] text-white rounded-xl text-xs font-bold transition active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ver Pastas Prontas (ABC, Upper/Lower)</span>
              </button>
            </div>
          </div>
        )}

        {/* Pastas (Com Fila de Prioridade interna para A, B, C...) */}
        {folders.map((f) => {
          const rawList = routinesByFolder[f.id] || [];
          const folderQueue = buildPriorityQueueForList(rawList);
          return (
            <div key={f.id} className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-white" />
                  <span className="text-sm font-bold text-white">{f.title}</span>
                  <span className="text-xs text-zinc-500 font-normal">({folderQueue.length})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setFolderToDelete({ id: f.id, title: f.title, count: folderQueue.length })}
                    className="text-zinc-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-zinc-800 transition"
                    title="Excluir Pasta e Planos"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {folderQueue.length === 0 ? (
                  <div className="col-span-full p-4 rounded-2xl border border-dashed border-[#27272a] bg-[#141416]/50 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-zinc-300 font-bold">Nenhum plano nesta pasta ainda.</p>
                      <p className="text-[11px] text-zinc-500">Adicione seu primeiro treino para esta divisão</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFolderForNewRoutine(f.id);
                        setEditingRoutine(null);
                        setIsEditorOpen(true);
                      }}
                      className="px-3 py-1.5 bg-white text-black font-black text-xs rounded-xl shadow active:scale-95 transition flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Criar Treino</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {folderQueue.map((meta) => renderRoutineCard(meta, folderQueue))}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFolderForNewRoutine(f.id);
                        setEditingRoutine(null);
                        setIsEditorOpen(true);
                      }}
                      className="col-span-full py-2.5 rounded-xl border border-dashed border-[#27272a] hover:border-zinc-500 text-zinc-400 hover:text-white flex items-center justify-center gap-1.5 text-xs font-bold transition active:scale-98"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar Treino em {f.title}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {/* Planos Soltos (Com Fila de Prioridade automática) */}
        {uncategorizedQueue.length > 0 && (
          <div className="space-y-2.5">
            {folders.length > 0 && (
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Dumbbell className="w-4 h-4 text-white" />
                <span>Planos Principais</span>
                <span className="text-xs text-zinc-500 font-normal">
                  ({uncategorizedQueue.length})
                </span>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {uncategorizedQueue.map((meta) => renderRoutineCard(meta, uncategorizedQueue))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Confirmação quando o usuário tenta repetir um treino já realizado na semana */}
      {repeatConfirmRoutine && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#141416] border border-[#27272a] rounded-3xl p-6 shadow-2xl text-center space-y-4 text-white">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 text-white flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-white">
                Repetir este treino novamente?
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Você realmente quer fazer o treino{' '}
                <strong className="text-white">"{repeatConfirmRoutine.routine.title}"</strong> de
                novo? Você já treinou isso essa semana (
                <strong>{repeatConfirmRoutine.lastDoneDateStr.toLowerCase()}</strong>).
              </p>
              {repeatConfirmRoutine.recommendedAlternative && (
                <p className="text-[11px] text-zinc-400 pt-1">
                  Próximo recomendado na sua fila:{' '}
                  <strong className="text-white">
                    {repeatConfirmRoutine.recommendedAlternative.title}
                  </strong>
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-1">
              {repeatConfirmRoutine.recommendedAlternative && (
                <button
                  type="button"
                  onClick={() => {
                    const altId = repeatConfirmRoutine.recommendedAlternative!.id;
                    setRepeatConfirmRoutine(null);
                    startWorkout(altId);
                  }}
                  className="w-full py-3 bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition active:scale-95"
                >
                  Iniciar Recomendado: {repeatConfirmRoutine.recommendedAlternative.title}
                </button>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRepeatConfirmRoutine(null)}
                  className="flex-1 py-2.5 bg-[#27272a] hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl transition"
                >
                  Não, Voltar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const id = repeatConfirmRoutine.routine.id;
                    setRepeatConfirmRoutine(null);
                    startWorkout(id);
                  }}
                  className={`flex-1 py-2.5 font-black text-xs rounded-xl transition ${
                    repeatConfirmRoutine.recommendedAlternative
                      ? 'bg-[#18181b] hover:bg-zinc-800 border border-white/30 text-white'
                      : 'bg-white hover:bg-zinc-200 text-black'
                  }`}
                >
                  Sim, Fazer de Novo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rápido de Demonstração 3D de Exercício dentro do Plano */}
      {previewExercise3D && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewExercise3D(null);
          }}
        >
          <div className="w-full max-w-md bg-[#121214] border border-[#27272a] rounded-t-3xl sm:rounded-2xl p-4 shadow-2xl space-y-3 text-white modal-safe-sheet">
            <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
              <div>
                <h3 className="text-sm font-black text-white">{previewExercise3D.title}</h3>
                <span className="text-[11px] text-zinc-400 capitalize">
                  {previewExercise3D.primary_muscle_group} • {previewExercise3D.equipment}
                </span>
              </div>
              <button
                onClick={() => setPreviewExercise3D(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ExerciseVisualDemo exercise={previewExercise3D} />
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Plano */}
      {routineToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-xs bg-[#18181b] border border-[#27272a] rounded-2xl p-5 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Excluir Plano de Treino?</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Tem certeza que deseja apagar o plano <strong>"{routineToDelete.title}"</strong>? Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setRoutineToDelete(null)}
                className="flex-1 py-2 bg-[#27272a] text-zinc-300 font-bold text-xs rounded-xl hover:bg-zinc-700 transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteRoutine}
                className="flex-1 py-2 bg-red-600 text-white font-bold text-xs rounded-xl hover:bg-red-700 transition shadow-md"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Pasta e seus Treinos */}
      {folderToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-xs bg-[#18181b] border border-[#27272a] rounded-2xl p-5 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Excluir Pasta e Conteúdo?</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Tem certeza que deseja apagar a pasta <strong>"{folderToDelete.title}"</strong>
                {folderToDelete.count > 0 ? (
                  <> e todos os <strong>{folderToDelete.count} {folderToDelete.count === 1 ? 'treino' : 'treinos'}</strong> contidos nela?</>
                ) : (
                  <>?</>
                )} Esta ação apagará a pasta e seus exercícios permanentemente.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFolderToDelete(null)}
                className="flex-1 py-2 bg-[#27272a] text-zinc-300 font-bold text-xs rounded-xl hover:bg-zinc-700 transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteFolder}
                className="flex-1 py-2 bg-red-600 text-white font-bold text-xs rounded-xl hover:bg-red-700 transition shadow-md"
              >
                Sim, Excluir Tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editor / Criador de Plano */}
      <RoutineEditorModal
        routineToEdit={editingRoutine}
        defaultFolderId={selectedFolderForNewRoutine}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingRoutine(null);
          setSelectedFolderForNewRoutine(null);
        }}
        onSaved={(routine) => {
          showToast(`✓ Plano "${routine.title}" salvo com sucesso!`);
        }}
      />

      {/* Toast Flutuante de Sucesso / Confirmação */}
      {toastFeedback && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[120] max-w-sm w-[90%] px-4 py-3 bg-white text-black border border-zinc-200 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-black truncate flex-1">{toastFeedback}</span>
          <button
            type="button"
            onClick={() => setToastFeedback(null)}
            className="p-1 text-zinc-500 hover:text-black rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Modal de Troca / Cadastro de Usuários */}
      <UserAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
      />

      {/* Modal de Hidratação & Água Diária */}
      <WaterTrackerModal
        isOpen={isWaterModalOpen}
        onClose={() => setWaterModalOpen(false)}
      />
    </div>
  );
};
