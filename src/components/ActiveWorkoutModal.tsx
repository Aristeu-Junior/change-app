import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  Check,
  Plus,
  Trash2,
  Clock,
  Disc
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { WorkoutSet, SetType } from '../types';
import { formatDuration } from '../utils/calc';
import { ExerciseSearchModal } from './ExerciseSearchModal';
import { PlateCalculatorModal } from './PlateCalculatorModal';

export const ActiveWorkoutModal: React.FC = () => {
  const {
    activeWorkout,
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
          <span className="w-6 h-6 rounded-md bg-zinc-800 text-white border border-zinc-600 font-extrabold text-[11px] flex items-center justify-center">
            A
          </span>
        );
      case 'dropset':
        return (
          <span className="w-6 h-6 rounded-md bg-zinc-800 text-white border border-zinc-600 font-extrabold text-[11px] flex items-center justify-center">
            D
          </span>
        );
      case 'failure':
        return (
          <span className="w-6 h-6 rounded-md bg-zinc-800 text-white border border-zinc-600 font-extrabold text-[11px] flex items-center justify-center">
            F
          </span>
        );
      default:
        return (
          <span className="w-6 h-6 rounded-md bg-zinc-900 text-zinc-300 font-bold text-xs flex items-center justify-center">
            {idx + 1}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-black md:bg-black/85 md:backdrop-blur-sm flex flex-col md:items-center md:justify-center md:p-6 overflow-hidden animate-in slide-in-from-bottom duration-200 text-white">
      <div className="w-full md:max-w-2xl flex-1 md:flex-initial md:h-[88dvh] bg-black md:bg-[#0d0d0f] md:border md:border-[#27272a] md:rounded-3xl md:shadow-2xl flex flex-col overflow-hidden relative">
        {/* Barra de Topo (protegida por pt-safe no modo Web App celular e limpa no PC) */}
        <div className="flex items-center justify-between px-4 pb-3 pt-safe md:!pt-3.5 bg-[#121214] border-b border-[#27272a] shrink-0">
          <button
            onClick={() => setWorkoutModalOpen(false)}
            className="flex items-center gap-1 p-1.5 -ml-1 text-zinc-400 hover:text-white rounded-lg active:scale-95 transition"
          >
            <ChevronDown className="w-6 h-6" />
          </button>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-xs font-black text-white">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatDuration(elapsedSeconds)}</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
              Treino em Andamento
            </span>
          </div>

          <button
            onClick={() => finishWorkout()}
            className="px-4 py-1.5 bg-white text-black hover:bg-zinc-200 font-black text-xs uppercase tracking-wider rounded-lg active:scale-95 transition shadow-md"
          >
            Finalizar
          </button>
        </div>

        {/* Área de Exercícios e Séries */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4 pb-36">
          {/* Título do Treino */}
          <div>
            <input
              type="text"
              value={activeWorkout.title}
              onChange={(e) => updateWorkoutTitle(e.target.value)}
              placeholder="Nome do Treino"
              className="w-full bg-transparent text-xl font-black text-white placeholder-zinc-600 focus:outline-none border-b border-transparent focus:border-white pb-1"
            />
          </div>

          {/* Cards de Exercícios */}
          {activeWorkout.exercises.map((exercise, exIdx) => (
            <div
              key={exercise.id}
              className="bg-[#141416] border border-[#27272a] rounded-2xl p-4 shadow-lg flex flex-col gap-3"
            >
              {/* Topo do Exercício */}
              <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
                <div>
                  <h3 className="text-sm font-black text-white">{exercise.title}</h3>
                  <span className="text-[11px] text-zinc-400">
                    Descanso: {exercise.rest_seconds || settings.default_rest_seconds}s
                  </span>
                </div>
                <button
                  onClick={() => removeExerciseFromWorkout(exIdx)}
                  className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition"
                  title="Remover Exercício"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Cabeçalho da Tabela de Séries */}
              <div className="grid grid-cols-12 gap-1.5 text-[10px] font-black text-zinc-400 uppercase tracking-wider text-center">
                <span className="col-span-2">Série</span>
                <span className="col-span-3">Anterior</span>
                <span className="col-span-3">{settings.weight_unit.toUpperCase()}</span>
                <span className="col-span-2">Reps</span>
                <span className="col-span-2">Check</span>
              </div>

              {/* Linhas das Séries */}
              <div className="space-y-2">
                {exercise.sets.map((set, setIdx) => (
                  <div
                    key={set.id}
                    className={`grid grid-cols-12 gap-1.5 items-center p-1.5 rounded-xl transition ${
                      set.completed
                        ? 'bg-zinc-900 border border-white/40'
                        : 'bg-[#18181b] border border-transparent'
                    }`}
                  >
                    {/* Badge da Série */}
                    <div className="col-span-2 flex justify-center">
                      <button
                        type="button"
                        onClick={() => cycleSetType(exIdx, setIdx, set.type)}
                        title="Toque para alternar: Normal / Aquecimento / Drop / Falha"
                        className="active:scale-90 transition"
                      >
                        {renderSetBadge(set, setIdx)}
                      </button>
                    </div>

                    {/* Valor Fantasma Anterior */}
                    <div className="col-span-3 text-center text-xs text-zinc-500 font-medium truncate">
                      {set.previousGhost || '—'}
                    </div>

                    {/* Campo de Carga */}
                    <div className="col-span-3 relative flex items-center">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={set.weight_kg ?? ''}
                        onChange={(e) =>
                          updateSet(exIdx, setIdx, {
                            weight_kg: e.target.value === '' ? null : parseFloat(e.target.value)
                          })
                        }
                        placeholder="0"
                        className="w-full bg-[#121214] border border-[#27272a] rounded-lg py-1.5 px-2 text-center text-xs font-black text-white focus:outline-none focus:border-white"
                      />
                      {set.weight_kg && set.weight_kg >= 20 ? (
                        <button
                          type="button"
                          onClick={() => setPlateCalcWeight(set.weight_kg)}
                          className="absolute right-1 text-zinc-500 hover:text-white"
                          title="Calculadora de Anilhas"
                        >
                          <Disc className="w-3.5 h-3.5" />
                        </button>
                      ) : null}
                    </div>

                    {/* Campo de Repetições */}
                    <div className="col-span-2">
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
                        className="w-full bg-[#121214] border border-[#27272a] rounded-lg py-1.5 px-1 text-center text-xs font-black text-white focus:outline-none focus:border-white"
                      />
                    </div>

                    {/* Botão de Concluir Série (Check) */}
                    <div className="col-span-2 flex justify-center">
                      <button
                        type="button"
                        onClick={() => toggleSetCompleted(exIdx, setIdx)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold transition active:scale-90 ${
                          set.completed
                            ? 'bg-white text-black shadow-md'
                            : 'bg-[#27272a] text-zinc-500 hover:text-white'
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Ações da Tabela */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => addSet(exIdx)}
                  className="py-1.5 px-3 bg-[#18181b] hover:bg-[#222226] text-xs font-bold text-white rounded-lg flex items-center gap-1.5 transition active:scale-95 border border-[#27272a]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Série
                </button>

                {exercise.sets.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSet(exIdx, exercise.sets.length - 1)}
                    className="text-xs text-zinc-500 hover:text-red-400 transition"
                  >
                    Excluir Última
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Botão Adicionar Exercício */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full py-4 bg-[#141416] hover:bg-[#1c1c1f] border border-dashed border-[#3f3f46] text-white font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition active:scale-98"
          >
            <Plus className="w-4 h-4" />
            Adicionar Exercício
          </button>

          {/* Botão Cancelar Treino */}
          <div className="pt-4 flex justify-center">
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
        onSelectExercise={(template) => addExerciseToWorkout(template)}
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
