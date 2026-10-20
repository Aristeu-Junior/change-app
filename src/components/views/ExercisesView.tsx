import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  Dumbbell,
  Trophy,
  History,
  X,
  Trash2,
  Sparkles,
  ChevronRight,
  Check,
  BookmarkPlus
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ExerciseTemplate, MuscleGroup, Routine, WorkoutExercise } from '../../types';
import { displayWeight } from '../../utils/calc';
import { ExerciseSearchModal } from '../ExerciseSearchModal';
import { ExerciseVisualDemo } from '../ExerciseVisualDemo';
import { RoutineEditorModal } from './RoutineEditorModal';

const MUSCLE_FILTERS: { label: string; value: MuscleGroup | 'all' }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Peito', value: 'peito' },
  { label: 'Costas', value: 'costas' },
  { label: 'Dorsal (Asas)', value: 'lats' },
  { label: 'Ombros', value: 'ombros' },
  { label: 'Bíceps', value: 'biceps' },
  { label: 'Tríceps', value: 'triceps' },
  { label: 'Antebraço', value: 'antebraco' },
  { label: 'Quadríceps', value: 'quadriceps' },
  { label: 'Posterior', value: 'isquiotibiais' },
  { label: 'Glúteos', value: 'gluteos' },
  { label: 'Panturrilha', value: 'panturrilha' },
  { label: 'Abdômen', value: 'abdomen' },
  { label: 'Cárdio', value: 'cardio' }
];

const getMuscleBadge = (muscle: string) => {
  const m = muscle.toLowerCase();
  if (m.includes('peito')) return 'PEITO';
  if (m.includes('costas') || m.includes('lats')) return 'COSTAS';
  if (m.includes('ombros')) return 'OMBROS';
  if (m.includes('biceps')) return 'BÍCEPS';
  if (m.includes('triceps')) return 'TRÍCEPS';
  if (m.includes('antebraco')) return 'ANTEB';
  if (m.includes('quadriceps') || m.includes('isquiotibiais') || m.includes('pernas')) return 'PERNAS';
  if (m.includes('gluteos')) return 'GLÚTEO';
  if (m.includes('panturrilha')) return 'PANTURR';
  if (m.includes('abdomen')) return 'ABS';
  if (m.includes('cardio')) return 'CARDIO';
  return 'GERAL';
};

export const ExercisesView: React.FC = () => {
  const {
    exercises,
    personalRecords,
    workouts,
    settings,
    deleteCustomExercise,
    routines,
    saveRoutine
  } = useApp();

  const [query, setQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'all'>('all');
  const [selectedDetailExercise, setSelectedDetailExercise] = useState<ExerciseTemplate | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Estados de Montagem de Treino
  const [isRoutineEditorOpen, setIsRoutineEditorOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [exerciseToAddToRoutine, setExerciseToAddToRoutine] = useState<ExerciseTemplate | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesQuery =
        ex.title.toLowerCase().includes(query.toLowerCase()) ||
        ex.primary_muscle_group.toLowerCase().includes(query.toLowerCase()) ||
        (ex.muscles_pt && ex.muscles_pt.toLowerCase().includes(query.toLowerCase()));
      const matchesMuscle =
        selectedMuscle === 'all' ||
        ex.primary_muscle_group === selectedMuscle ||
        ex.secondary_muscle_groups?.includes(selectedMuscle as MuscleGroup);
      return matchesQuery && matchesMuscle;
    });
  }, [exercises, query, selectedMuscle]);

  // Histórico de séries realizadas deste exercício
  const exerciseHistory = useMemo(() => {
    if (!selectedDetailExercise) return [];
    const list: { workoutTitle: string; date: string; sets: any[] }[] = [];

    workouts.forEach((w) => {
      const found = w.exercises.find((e) => e.exercise_template_id === selectedDetailExercise.id);
      if (found && found.sets.some((s) => s.completed)) {
        list.push({
          workoutTitle: w.title,
          date: w.start_time,
          sets: found.sets.filter((s) => s.completed)
        });
      }
    });

    return list;
  }, [selectedDetailExercise, workouts]);

  // Trava a rolagem da página de fundo para impedir que a barra lateral externa role
  useEffect(() => {
    if (selectedDetailExercise || isRoutineEditorOpen || exerciseToAddToRoutine) {
      const scrollY = window.scrollY;
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      const originalBodyPosition = document.body.style.position;
      const originalBodyTop = document.body.style.top;
      const originalBodyWidth = document.body.style.width;

      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.body.style.position = originalBodyPosition;
        document.body.style.top = originalBodyTop;
        document.body.style.width = originalBodyWidth;
        window.scrollTo(0, scrollY);
      };
    }
  }, [selectedDetailExercise, isRoutineEditorOpen, exerciseToAddToRoutine]);

  // Handler: Abrir Criador de Treino (com sugestões internas ou do zero)
  const handleCreateRoutineEmpty = () => {
    setEditingRoutine(null);
    setIsRoutineEditorOpen(true);
  };

  // Handler: Adicionar Exercício Selecionado a uma Rotina Existente
  const handleAddExerciseToExistingRoutine = (targetRoutine: Routine, exercise: ExerciseTemplate) => {
    const newEx: WorkoutExercise = {
      id: `re-${Date.now()}`,
      exercise_template_id: exercise.id,
      title: exercise.title,
      rest_seconds: 90,
      sets: [
        { id: `rs-${Date.now()}-0`, index: 0, type: 'normal', weight_kg: 20, reps: 10, completed: false },
        { id: `rs-${Date.now()}-1`, index: 1, type: 'normal', weight_kg: 20, reps: 10, completed: false },
        { id: `rs-${Date.now()}-2`, index: 2, type: 'normal', weight_kg: 20, reps: 10, completed: false }
      ]
    };

    const updatedRoutine: Routine = {
      ...targetRoutine,
      exercises: [...targetRoutine.exercises, newEx],
      updated_at: new Date().toISOString()
    };

    saveRoutine(updatedRoutine);
    setExerciseToAddToRoutine(null);
    showToast(`✓ "${exercise.title}" adicionado a "${targetRoutine.title}"!`);
  };

  // Handler: Criar Nova Rotina com esse Exercício
  const handleCreateRoutineFromExercise = (exercise: ExerciseTemplate) => {
    const newRoutine: Routine = {
      id: `routine-${Date.now()}`,
      title: `Treino de ${exercise.primary_muscle_group.toUpperCase()}`,
      notes: '',
      folder_id: null,
      exercises: [
        {
          id: `re-${Date.now()}`,
          exercise_template_id: exercise.id,
          title: exercise.title,
          rest_seconds: 90,
          sets: [
            { id: `rs-${Date.now()}-0`, index: 0, type: 'normal', weight_kg: 20, reps: 10, completed: false },
            { id: `rs-${Date.now()}-1`, index: 1, type: 'normal', weight_kg: 20, reps: 10, completed: false },
            { id: `rs-${Date.now()}-2`, index: 2, type: 'normal', weight_kg: 20, reps: 10, completed: false }
          ]
        }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setExerciseToAddToRoutine(null);
    setEditingRoutine(newRoutine);
    setIsRoutineEditorOpen(true);
  };

  return (
    <div className="flex flex-col min-h-full view-container space-y-4 text-white">
      {/* Toast Notificação */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-white text-black font-black text-xs px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200 border border-zinc-300">
          <Check className="w-4 h-4 text-black" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black text-white">Exercícios</h1>
          <p className="text-xs text-zinc-400">Guia de execução, animações 3D & PRs</p>
        </div>
        <button
          onClick={() => setIsSearchModalOpen(true)}
          className="p-2.5 bg-[#141416] hover:bg-[#1e1e24] border border-[#27272a] text-white rounded-xl flex items-center gap-1.5 text-xs font-bold transition active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Criar</span>
        </button>
      </div>

      {/* BOTÃO DIRETO PARA MONTAR PLANO DE TREINO (Sugestões aparecem apenas ao clicar) */}
      <button
        onClick={handleCreateRoutineEmpty}
        className="w-full bg-[#141416] hover:bg-[#1a1a1e] border border-[#27272a] rounded-2xl p-3.5 flex items-center justify-between gap-2 transition active:scale-98 shadow-sm group"
      >
        <div className="flex items-center gap-2.5 min-w-0 text-left">
          <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center font-black shrink-0 shadow-sm">
            <Sparkles className="w-4 h-4 text-black" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-black text-white leading-tight truncate">
              Montar Novo Plano de Treino
            </h2>
            <p className="text-[11px] text-zinc-400 truncate">
              Toque para ver sugestões de treinos conhecidos ou montar do zero
            </p>
          </div>
        </div>
        <span className="px-3 py-1.5 bg-white group-hover:bg-zinc-200 text-black rounded-xl text-xs font-black transition flex items-center gap-1 shrink-0 shadow-sm">
          <span>Montar</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </button>

      {/* Busca de Exercícios */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar entre os 112 exercícios ou músculos..."
          className="w-full bg-[#141416] border border-[#27272a] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white transition"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filtros de Músculos */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 no-scrollbar">
        {MUSCLE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setSelectedMuscle(f.value)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition ${
              selectedMuscle === f.value
                ? 'bg-white text-black'
                : 'bg-[#141416] text-zinc-400 hover:text-white border border-[#27272a]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista de Exercícios com Miniatura 3D ao lado esquerdo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {filteredExercises.map((ex) => {
          const pr = personalRecords[ex.id];
          const thumbUrl = ex.gif_id
            ? `https://cdn.jsdelivr.net/gh/omercotkd/exercises-gifs@main/assets/${ex.gif_id}.gif`
            : ex.gif_url || null;

          return (
            <div
              key={ex.id}
              onClick={() => setSelectedDetailExercise(ex)}
              className="bg-[#141416] border border-[#27272a] hover:border-zinc-500 rounded-2xl p-2.5 shadow-sm flex items-center justify-between cursor-pointer transition active:scale-98 gap-3 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Miniatura 3D em GIF animada à esquerda */}
                <div className="w-13 h-13 rounded-xl bg-white border border-[#27272a] group-hover:border-zinc-400 flex flex-col items-center justify-center shrink-0 relative overflow-hidden shadow-inner transition">
                  {thumbUrl ? (
                    <img
                      src={thumbUrl}
                      alt={ex.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover pointer-events-none select-none"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#18181b] flex flex-col items-center justify-center">
                      <Dumbbell className="w-4 h-4 text-white" />
                      <span className="text-[8px] font-black text-zinc-400 tracking-tighter mt-0.5 uppercase">
                        {getMuscleBadge(ex.primary_muscle_group)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-white truncate">{ex.title}</h4>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-semibold text-zinc-400 capitalize">
                      {ex.primary_muscle_group}
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-[10px] text-zinc-500 capitalize">{ex.equipment}</span>
                    {ex.is_custom && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-zinc-800 text-white">
                        Custom
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Recorde Exato e Botão Adicionar ao Treino (sem botão Ver 3D) */}
              <div className="flex items-center gap-2 shrink-0">
                {pr && (
                  <div className="flex flex-col items-end mr-1">
                    <div className="flex items-center gap-1 text-xs font-black text-white">
                      <Trophy className="w-3.5 h-3.5 text-zinc-300" />
                      <span>{displayWeight(pr.max_weight_kg, settings.weight_unit)}</span>
                    </div>
                    <span className="text-[10px] text-zinc-400">{pr.max_reps} reps</span>
                  </div>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExerciseToAddToRoutine(ex);
                  }}
                  className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#18181b] hover:bg-zinc-800 border border-[#27272a] text-zinc-300 hover:text-white text-[10px] font-bold flex items-center gap-1 transition active:scale-95"
                  title="Adicionar a um treino"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">+ Treino</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Completo com Vídeo / Demonstração Visual */}
      {selectedDetailExercise && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm p-0 sm:p-4 overflow-hidden animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedDetailExercise(null);
          }}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div
            className="w-full max-w-md bg-[#121214] border border-[#27272a] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col modal-safe-sheet text-white overflow-hidden animate-in slide-in-from-bottom duration-200"
            onWheel={(e) => e.stopPropagation()}
          >
            {/* Topo FIXO (Título e Fechar sempre visíveis) */}
            <div className="flex items-start justify-between p-4 pb-3 border-b border-[#27272a] shrink-0 bg-[#121214] z-10">
              <div className="pr-3">
                <h2 className="text-base font-black text-white line-clamp-1">{selectedDetailExercise.title}</h2>
                <span className="text-xs text-zinc-400 capitalize">
                  {selectedDetailExercise.primary_muscle_group} • {selectedDetailExercise.equipment}
                </span>
              </div>
              <button
                onClick={() => setSelectedDetailExercise(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition shrink-0 active:scale-95"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Área ROLÁVEL Interna Isolada (Não afeta a página de fundo) */}
            <div
              className="modal-scroll-content flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 pb-12 space-y-4 touch-pan-y"
              style={{
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
                touchAction: 'pan-y'
              }}
            >
              {/* Botão de Adicionar ao Treino */}
              <button
                onClick={() => {
                  setExerciseToAddToRoutine(selectedDetailExercise);
                }}
                className="w-full py-2.5 bg-white text-black hover:bg-zinc-200 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition shadow-sm active:scale-98"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar ao Meu Treino</span>
              </button>

              {/* PLAYER DE ANIMAÇÃO / DEMONSTRAÇÃO VISUAL */}
              <ExerciseVisualDemo exercise={selectedDetailExercise} />

              {/* Caixa de Recorde Pessoal (Valores Reais) */}
              <div className="bg-[#18181b] p-3.5 rounded-xl border border-[#27272a]">
                <span className="text-xs uppercase text-zinc-400 font-bold block mb-2 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-white" />
                  Seu Recorde Pessoal (PR)
                </span>
                {personalRecords[selectedDetailExercise.id] ? (
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-[#121214] p-2 rounded-lg border border-[#27272a]">
                      <span className="text-[10px] uppercase text-zinc-500 font-semibold block">
                        Carga Registrada
                      </span>
                      <span className="text-sm font-black text-white">
                        {displayWeight(
                          personalRecords[selectedDetailExercise.id].max_weight_kg,
                          settings.weight_unit
                        )}
                      </span>
                    </div>
                    <div className="bg-[#121214] p-2 rounded-lg border border-[#27272a]">
                      <span className="text-[10px] uppercase text-zinc-500 font-semibold block">
                        Repetições
                      </span>
                      <span className="text-sm font-black text-white">
                        {personalRecords[selectedDetailExercise.id].max_reps} reps
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic">Nenhuma série registrada ainda</p>
                )}
              </div>

              {/* Histórico Recente */}
              {exerciseHistory.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs uppercase text-zinc-400 font-bold block flex items-center gap-1.5">
                    <History className="w-4 h-4 text-white" />
                    Sessões Anteriores
                  </span>
                  <div className="space-y-1">
                    {exerciseHistory.slice(0, 3).map((h, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-[#18181b] rounded-xl border border-[#27272a] text-xs flex justify-between items-center"
                      >
                        <div>
                          <span className="font-bold text-white block">{h.workoutTitle}</span>
                          <span className="text-[10px] text-zinc-500">
                            {new Date(h.date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <div className="text-right text-zinc-300">
                          {h.sets.map((s, sIdx) => (
                            <span key={sIdx} className="font-semibold block text-[11px]">
                              {s.weight_kg}kg × {s.reps} reps
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Excluir se customizado */}
              {selectedDetailExercise.is_custom && (
                <button
                  onClick={() => {
                    deleteCustomExercise(selectedDetailExercise.id);
                    setSelectedDetailExercise(null);
                  }}
                  className="w-full py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-xl transition flex items-center justify-center gap-1.5 border border-red-500/20"
                >
                  <Trash2 className="w-4 h-4" /> Excluir Exercício Personalizado
                </button>
              )}

              {/* Botão de Fechar no rodapé do scroll */}
              <button
                onClick={() => setSelectedDetailExercise(null)}
                className="w-full py-3 bg-[#18181b] hover:bg-[#222226] border border-[#27272a] text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition active:scale-98"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Escolher a Qual Treino Adicionar Este Exercício */}
      {exerciseToAddToRoutine && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setExerciseToAddToRoutine(null);
          }}
        >
          <div className="w-full max-w-sm bg-[#121214] border border-[#27272a] rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl flex flex-col modal-safe-sheet text-white animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
              <div>
                <h3 className="text-sm font-black text-white">Adicionar a um Treino</h3>
                <p className="text-[11px] text-zinc-400 truncate max-w-[240px]">{exerciseToAddToRoutine.title}</p>
              </div>
              <button
                onClick={() => setExerciseToAddToRoutine(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              <button
                onClick={() => handleCreateRoutineFromExercise(exerciseToAddToRoutine)}
                className="w-full p-3 rounded-xl bg-white text-black font-black text-xs flex items-center justify-between hover:bg-zinc-200 transition shadow-sm active:scale-98"
              >
                <span className="flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  Criar Novo Treino com este Exercício
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="pt-2">
                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider block mb-2">
                  Ou adicione aos seus planos existentes:
                </span>
                {routines.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic py-2">Você ainda não tem treinos salvos.</p>
                ) : (
                  <div className="space-y-1.5">
                    {routines.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => handleAddExerciseToExistingRoutine(r, exerciseToAddToRoutine)}
                        className="w-full p-2.5 rounded-xl bg-[#18181b] hover:bg-[#202024] border border-[#27272a] hover:border-zinc-500 text-left flex items-center justify-between transition group"
                      >
                        <div>
                          <h4 className="text-xs font-bold text-white group-hover:text-zinc-200">{r.title}</h4>
                          <span className="text-[10px] text-zinc-400">{r.exercises.length} exercícios</span>
                        </div>
                        <span className="w-6 h-6 rounded-lg bg-zinc-800 text-white flex items-center justify-center font-bold text-xs group-hover:bg-white group-hover:text-black transition">
                          +
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editor Completo de Treinos (RoutineEditorModal) */}
      <RoutineEditorModal
        isOpen={isRoutineEditorOpen}
        routineToEdit={editingRoutine}
        onClose={() => {
          setIsRoutineEditorOpen(false);
          setEditingRoutine(null);
        }}
      />

      {/* Modal de Busca / Criação de Exercício Customizado */}
      <ExerciseSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectExercise={(ex) => setSelectedDetailExercise(ex)}
      />
    </div>
  );
};
