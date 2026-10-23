import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronDown,
  Check,
  Plus,
  Trash2,
  Clock,
  Disc,
  Dumbbell,
  Eye,
  EyeOff,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { WorkoutSet, SetType, ExerciseTemplate } from '../types';
import { formatDuration } from '../utils/calc';
import { ExerciseSearchModal } from './ExerciseSearchModal';
import { PlateCalculatorModal } from './PlateCalculatorModal';
import { ExerciseVisualDemo } from './ExerciseVisualDemo';

export const ActiveWorkoutModal: React.FC = () => {
  const {
    activeWorkout,
    exercises: allTemplates,
    isWorkoutModalOpen,
    setWorkoutModalOpen,
    finishWorkout,
    discardWorkout,
    updateWorkoutTitle,
    addExerciseToWorkout,
    removeExerciseFromWorkout,
    addSet,
    removeSet,
    updateSet,
    toggleSetCompleted,
    settings,
    restTimer,
    adjustRestTimer,
    skipRestTimer
  } = useApp();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [plateCalcWeight, setPlateCalcWeight] = useState<number | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [focusedExIdx, setFocusedExIdx] = useState<number>(0);
  const [showLive3D, setShowLive3D] = useState<boolean>(true);

  useEffect(() => {
    if (!activeWorkout) return;

    const startTime = new Date(activeWorkout.start_time).getTime();
    const updateElapsed = () => {
      const now = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((now - startTime) / 1000)));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeWorkout]);

  // Mantém o índice focado válido quando exercícios são adicionados ou removidos
  useEffect(() => {
    if (!activeWorkout) return;
    if (focusedExIdx >= activeWorkout.exercises.length) {
      setFocusedExIdx(Math.max(0, activeWorkout.exercises.length - 1));
    }
  }, [activeWorkout?.exercises.length, focusedExIdx]);

  // Mapeia cada exercício do treino para seu ExerciseTemplate completo (com gif_id e dados 3D)
  const templateByExerciseId = useMemo(() => {
    const map: Record<string, ExerciseTemplate> = {};
    if (!activeWorkout) return map;
    activeWorkout.exercises.forEach((wEx) => {
      const found =
        allTemplates.find((t) => t.id === wEx.exercise_template_id) ||
        allTemplates.find((t) => t.title.toLowerCase() === wEx.title.toLowerCase());
      if (found) {
        map[wEx.id] = found;
      } else {
        map[wEx.id] = {
          id: wEx.exercise_template_id,
          title: wEx.title,
          type: 'weight_reps',
          primary_muscle_group: 'peito',
          secondary_muscle_groups: [],
          equipment: 'halter',
          is_custom: false
        };
      }
    });
    return map;
  }, [activeWorkout, allTemplates]);

  if (!activeWorkout || !isWorkoutModalOpen) return null;

  const cycleSetType = (exerciseIndex: number, setIndex: number, currentType: SetType) => {
    const sequence: SetType[] = ['normal', 'warmup', 'dropset', 'failure'];
    const nextIdx = (sequence.indexOf(currentType) + 1) % sequence.length;
    updateSet(exerciseIndex, setIndex, { type: sequence[nextIdx] });
  };

  const renderSetBadge = (set: WorkoutSet, idx: number) => {
    switch (set.type) {
      case 'warmup':
        return (
          <span className="w-6 h-6 rounded-lg bg-zinc-800 text-white border border-zinc-600 font-black text-[10px] flex items-center justify-center">
            A
          </span>
        );
      case 'dropset':
        return (
          <span className="w-6 h-6 rounded-lg bg-zinc-800 text-white border border-zinc-600 font-black text-[10px] flex items-center justify-center">
            D
          </span>
        );
      case 'failure':
        return (
          <span className="w-6 h-6 rounded-lg bg-zinc-800 text-white border border-zinc-600 font-black text-[10px] flex items-center justify-center">
            F
          </span>
        );
      default:
        return (
          <span className="w-6 h-6 rounded-lg bg-[#121214] border border-[#27272a] text-zinc-300 font-black text-[11px] flex items-center justify-center">
            {idx + 1}ª
          </span>
        );
    }
  };

  // Ao marcar uma série, se todas as séries do exercício atual foram concluídas, avança automaticamente o 3D para o próximo exercício!
  const handleToggleSetAndAutoAdvance = (exIdx: number, setIdx: number) => {
    const ex = activeWorkout.exercises[exIdx];
    const targetSet = ex?.sets[setIdx];
    const willBeCompleted = targetSet ? !targetSet.completed : false;

    toggleSetCompleted(exIdx, setIdx);

    if (willBeCompleted && ex) {
      const allOthersCompleted = ex.sets.every((s, idx) => (idx === setIdx ? true : s.completed));
      if (allOthersCompleted) {
        const nextIncompleteIdx = activeWorkout.exercises.findIndex(
          (otherEx, oIdx) => oIdx > exIdx && otherEx.sets.some((s) => !s.completed)
        );
        if (nextIncompleteIdx !== -1) {
          setTimeout(() => {
            setFocusedExIdx(nextIncompleteIdx);
          }, 420);
        }
      }
    }
  };

  const totalSetsCount = activeWorkout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedSetsCount = activeWorkout.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0
  );
  const progressPct = totalSetsCount > 0 ? Math.round((completedSetsCount / totalSetsCount) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[90] bg-black md:bg-black/85 md:backdrop-blur-sm flex flex-col md:items-center md:justify-center md:p-6 overflow-hidden animate-in slide-in-from-bottom duration-200 text-white">
      <div className="w-full md:max-w-2xl flex-1 md:flex-initial md:h-[90dvh] bg-black md:bg-[#0d0d0f] md:border md:border-[#27272a] md:rounded-3xl md:shadow-2xl flex flex-col overflow-hidden relative">
        {/* Barra de Topo Minimalista (protegida por pt-safe no Web App celular e limpa no PC) */}
        <div className="flex items-center justify-between px-4 pb-2.5 pt-safe md:!pt-3.5 bg-[#121214] border-b border-[#27272a] shrink-0">
          <button
            onClick={() => setWorkoutModalOpen(false)}
            className="flex items-center gap-1 p-1.5 -ml-1 text-zinc-400 hover:text-white rounded-lg active:scale-95 transition"
            title="Minimizar treino"
          >
            <ChevronDown className="w-6 h-6" />
          </button>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-xs font-black text-white">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatDuration(elapsedSeconds)}</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-300">{progressPct}%</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-semibold truncate max-w-[180px]">
              {activeWorkout.title}
            </span>
          </div>

          <button
            onClick={() => finishWorkout()}
            className="px-4 py-1.5 bg-white text-black hover:bg-zinc-200 font-black text-xs uppercase tracking-wider rounded-xl active:scale-95 transition shadow-md"
          >
            Finalizar
          </button>
        </div>

        {/* Barra de Progresso Fina */}
        <div className="w-full h-1 bg-[#18181b] shrink-0">
          <div
            className="h-full bg-white transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Seletor Rápido Horizontal de Exercícios do Treino (Guia em Tempo Real) */}
        {activeWorkout.exercises.length > 0 && (
          <div className="px-4 py-2.5 bg-[#0d0d0f] border-b border-[#27272a] flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            {activeWorkout.exercises.map((ex, idx) => {
              const isFocused = idx === focusedExIdx;
              const doneSets = ex.sets.filter((s) => s.completed).length;
              const allDone = ex.sets.length > 0 && doneSets === ex.sets.length;

              return (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => setFocusedExIdx(idx)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap flex items-center gap-1.5 transition shrink-0 border ${
                    isFocused
                      ? 'bg-white text-black border-white shadow-sm font-black'
                      : allDone
                      ? 'bg-zinc-900 text-zinc-300 border-white/30'
                      : 'bg-[#141416] text-zinc-400 border-[#27272a] hover:text-white'
                  }`}
                >
                  <span>{idx + 1}.</span>
                  <span className="max-w-[120px] truncate">{ex.title}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                      isFocused
                        ? 'bg-black/15 text-black'
                        : allDone
                        ? 'bg-white text-black'
                        : 'bg-[#27272a] text-zinc-400'
                    }`}
                  >
                    {allDone ? '✓' : `${doneSets}/${ex.sets.length}`}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Área Principal do Treino */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3.5 space-y-3 pb-36">
          {/* Título Editável Compacto + Botão Ocultar/Mostrar 3D */}
          <div className="flex items-center justify-between gap-2">
            <input
              type="text"
              value={activeWorkout.title}
              onChange={(e) => updateWorkoutTitle(e.target.value)}
              placeholder="Nome do Treino"
              className="flex-1 bg-transparent text-base font-black text-white placeholder-zinc-600 focus:outline-none border-b border-transparent focus:border-white pb-0.5 truncate"
            />
            <button
              type="button"
              onClick={() => setShowLive3D(!showLive3D)}
              className="px-2.5 py-1 rounded-xl bg-[#141416] hover:bg-[#1c1c1f] border border-[#27272a] text-[10px] font-black text-zinc-300 flex items-center gap-1.5 shrink-0 transition"
            >
              {showLive3D ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showLive3D ? '3D Ativo' : 'Mostrar 3D'}</span>
            </button>
          </div>

          {/* Lista de Exercícios: O Exercício Atual abre em Modo Guiado 3D Minimalista; os demais ficam compactos */}
          {activeWorkout.exercises.map((exercise, exIdx) => {
            const isFocused = exIdx === focusedExIdx;
            const template = templateByExerciseId[exercise.id];
            const thumbUrl = template?.gif_id
              ? `https://cdn.jsdelivr.net/gh/omercotkd/exercises-gifs@main/assets/${template.gif_id}.gif`
              : template?.gif_url || null;
            const doneCount = exercise.sets.filter((s) => s.completed).length;
            const isAllCompleted = exercise.sets.length > 0 && doneCount === exercise.sets.length;

            // VISÃO COMPACTA E MINIMALISTA para exercícios que não estão em foco no momento
            if (!isFocused) {
              const lastWeight = exercise.sets[0]?.weight_kg ?? 0;
              const lastReps = exercise.sets[0]?.reps ?? 0;

              return (
                <div
                  key={exercise.id}
                  onClick={() => setFocusedExIdx(exIdx)}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition active:scale-98 ${
                    isAllCompleted
                      ? 'bg-[#121214]/90 border-white/30'
                      : 'bg-[#141416] border-[#27272a] hover:border-zinc-500'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Miniatura 3D em tempo real ao lado esquerdo */}
                    <div className="w-12 h-12 rounded-xl bg-white border border-[#27272a] overflow-hidden shrink-0 flex items-center justify-center">
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt={exercise.title}
                          loading="lazy"
                          className="w-full h-full object-cover pointer-events-none"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#18181b] flex items-center justify-center">
                          <Dumbbell className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-zinc-500">#{exIdx + 1}</span>
                        <h3 className="text-xs font-black text-white truncate">{exercise.title}</h3>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {exercise.sets.length} {exercise.sets.length === 1 ? 'série' : 'séries'} •{' '}
                        {lastWeight} {settings.weight_unit} × {lastReps} reps
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-black ${
                        isAllCompleted
                          ? 'bg-white text-black'
                          : 'bg-[#18181b] border border-[#27272a] text-zinc-300'
                      }`}
                    >
                      {isAllCompleted ? 'Concluído ✓' : `${doneCount}/${exercise.sets.length}`}
                    </span>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </div>
                </div>
              );
            }

            // VISÃO EM FOCO COM DEMONSTRAÇÃO 3D EM TEMPO REAL E SÉRIES MINIMALISTAS
            return (
              <div
                key={exercise.id}
                className="bg-[#141416] border border-white/40 rounded-3xl p-4 shadow-2xl flex flex-col gap-3.5 animate-in fade-in duration-150"
              >
                {/* Cabeçalho do Exercício em Foco */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-white text-black text-[10px] font-black uppercase">
                        Exercício {exIdx + 1} de {activeWorkout.exercises.length}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-bold capitalize">
                        • {template?.primary_muscle_group}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-white mt-1 leading-snug">
                      {exercise.title}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeExerciseFromWorkout(exIdx)}
                    className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition shrink-0"
                    title="Remover Exercício"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* DEMONSTRAÇÃO 3D EM TEMPO REAL DO EXERCÍCIO ATUAL */}
                {showLive3D && template && <ExerciseVisualDemo exercise={template} />}

                {/* Lista Minimalista de Séries (Sem poluição visual) */}
                <div className="space-y-2">
                  {exercise.sets.map((set, setIdx) => (
                    <div
                      key={set.id}
                      className={`flex items-center justify-between gap-2 p-2 rounded-2xl transition ${
                        set.completed
                          ? 'bg-zinc-900/90 border border-white/50 shadow-sm'
                          : 'bg-[#18181b] border border-[#27272a]'
                      }`}
                    >
                      {/* Número da Série (Toque para Aquecimento / Drop / Falha) */}
                      <button
                        type="button"
                        onClick={() => cycleSetType(exIdx, setIdx, set.type)}
                        title="Toque para alternar: Normal / Aquecimento / Drop / Falha"
                        className="shrink-0 active:scale-90 transition"
                      >
                        {renderSetBadge(set, setIdx)}
                      </button>

                      {/* Inputs Minimalistas: Carga (kg) × Repetições */}
                      <div className="flex items-center gap-1.5 flex-1 justify-center">
                        <div className="relative flex items-center">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={set.weight_kg ?? ''}
                            onChange={(e) =>
                              updateSet(exIdx, setIdx, {
                                weight_kg:
                                  e.target.value === '' ? null : parseFloat(e.target.value)
                              })
                            }
                            placeholder="0"
                            className="w-16 sm:w-20 bg-[#121214] border border-[#27272a] focus:border-white rounded-xl py-1.5 px-2 text-center text-xs font-black text-white focus:outline-none"
                          />
                          {set.weight_kg && set.weight_kg >= 20 ? (
                            <button
                              type="button"
                              onClick={() => setPlateCalcWeight(set.weight_kg)}
                              className=" -ml-5 mr-1.5 text-zinc-500 hover:text-white"
                              title="Calculadora de Anilhas"
                            >
                              <Disc className="w-3 h-3" />
                            </button>
                          ) : null}
                        </div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">
                          {settings.weight_unit}
                        </span>

                        <span className="text-zinc-600 font-bold px-0.5">×</span>

                        <input
                          type="number"
                          min="0"
                          value={set.reps ?? ''}
                          onChange={(e) =>
                            updateSet(exIdx, setIdx, {
                              reps: e.target.value === '' ? null : parseInt(e.target.value, 10)
                            })
                          }
                          placeholder="0"
                          className="w-14 sm:w-16 bg-[#121214] border border-[#27272a] focus:border-white rounded-xl py-1.5 px-1.5 text-center text-xs font-black text-white focus:outline-none"
                        />
                        <span className="text-[10px] font-bold text-zinc-400">reps</span>
                      </div>

                      {/* Botão Minimalista de Check */}
                      <button
                        type="button"
                        onClick={() => handleToggleSetAndAutoAdvance(exIdx, setIdx)}
                        className={`px-3 h-8 rounded-xl flex items-center justify-center gap-1 font-black text-[11px] transition active:scale-90 shrink-0 ${
                          set.completed
                            ? 'bg-white text-black shadow-md'
                            : 'bg-[#27272a] text-zinc-300 hover:text-white'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span className="hidden xs:inline">{set.completed ? 'Feito' : 'OK'}</span>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Ações Rápidas da Série */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => addSet(exIdx)}
                    className="py-1.5 px-3 bg-[#18181b] hover:bg-[#222226] text-[11px] font-bold text-white rounded-xl flex items-center gap-1.5 transition active:scale-95 border border-[#27272a]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Série</span>
                  </button>

                  <div className="flex items-center gap-3">
                    {exercise.sets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSet(exIdx, exercise.sets.length - 1)}
                        className="text-[11px] text-zinc-500 hover:text-red-400 transition font-semibold"
                      >
                        - Série
                      </button>
                    )}

                    {exIdx < activeWorkout.exercises.length - 1 && (
                      <button
                        type="button"
                        onClick={() => setFocusedExIdx(exIdx + 1)}
                        className="py-1.5 px-3 bg-white/10 hover:bg-white/20 text-[11px] font-black text-white rounded-xl flex items-center gap-1 transition"
                      >
                        <span>Próximo Exercício</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Botão Adicionar Exercício */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full py-3.5 bg-[#141416] hover:bg-[#1c1c1f] border border-dashed border-[#3f3f46] text-white font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition active:scale-98"
          >
            <Plus className="w-4 h-4" />
            Adicionar Exercício
          </button>

          {/* Botão Cancelar Treino */}
          <div className="pt-3 flex justify-center">
            {showDiscardConfirm ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-red-400 font-bold">Descartar treino?</span>
                <button
                  onClick={() => {
                    discardWorkout();
                    setShowDiscardConfirm(false);
                  }}
                  className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg"
                >
                  Sim, Descartar
                </button>
                <button
                  onClick={() => setShowDiscardConfirm(false)}
                  className="px-3 py-1.5 bg-[#18181b] text-zinc-300 text-xs font-semibold rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDiscardConfirm(true)}
                className="text-xs text-red-400/80 hover:text-red-400 font-semibold hover:underline"
              >
                Descartar Este Treino
              </button>
            )}
          </div>
        </div>

        {/* Barra de Descanso Flutuante */}
        {restTimer.isActive && (
          <div className="absolute bottom-0 left-0 right-0 z-50 p-4 bg-[#121214]/95 backdrop-blur-md border-t border-[#27272a] flex items-center justify-between pb-safe shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 flex items-center justify-center">
                <svg className="w-10 h-10 -rotate-90">
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    stroke="#27272a"
                    strokeWidth="3"
                    fill="transparent"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    stroke="#ffffff"
                    strokeWidth="3"
                    strokeDasharray={100}
                    strokeDashoffset={
                      100 - (restTimer.remainingSeconds / (restTimer.totalSeconds || 1)) * 100
                    }
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <span className="absolute font-black text-xs text-white">
                  {restTimer.remainingSeconds}
                </span>
              </div>
              <div>
                <span className="text-xs font-black text-white block">Descanso</span>
                <span className="text-[10px] text-zinc-400 truncate max-w-[140px] block">
                  {restTimer.exerciseTitle || 'Próxima Série'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => adjustRestTimer(30)}
                className="px-2.5 py-1.5 rounded-lg bg-[#27272a] text-white font-bold text-xs hover:bg-zinc-700 active:scale-95 transition"
              >
                +30s
              </button>
              <button
                onClick={skipRestTimer}
                className="px-3 py-1.5 rounded-lg bg-white text-black font-black text-xs hover:bg-zinc-200 active:scale-95 transition"
              >
                Pular
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Busca */}
      <ExerciseSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectExercise={(template) => {
          addExerciseToWorkout(template);
          setFocusedExIdx(activeWorkout.exercises.length);
        }}
      />

      {/* Modal Calculadora de Anilhas */}
      {plateCalcWeight !== null && (
        <PlateCalculatorModal
          initialWeight={plateCalcWeight}
          isOpen={plateCalcWeight !== null}
          onClose={() => setPlateCalcWeight(null)}
          weightUnit={settings.weight_unit}
        />
      )}
    </div>
  );
};
