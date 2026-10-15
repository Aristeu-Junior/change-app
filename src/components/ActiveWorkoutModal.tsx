import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  Check,
  Plus,
  Trash2,
  Clock,
  Disc,
  MoreVertical,
  X,
  Play,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { WorkoutExercise, WorkoutSet, SetType } from '../types';
import { formatDuration, formatSecondsClock, displayWeight } from '../utils/calc';
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

  // Live workout timer
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
          <span className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center">
            W
          </span>
        );
      case 'dropset':
        return (
          <span className="w-6 h-6 rounded-md bg-purple-500/20 text-purple-400 font-bold text-xs flex items-center justify-center">
            D
          </span>
        );
      case 'failure':
        return (
          <span className="w-6 h-6 rounded-md bg-red-500/20 text-red-400 font-bold text-xs flex items-center justify-center">
            F
          </span>
        );
      default:
        return (
          <span className="w-6 h-6 rounded-md bg-[#242c3d] text-slate-300 font-bold text-xs flex items-center justify-center">
            {idx + 1}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-[#0b0e14] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#131720] border-b border-[#242c3d] shrink-0">
        <button
          onClick={() => setWorkoutModalOpen(false)}
          className="flex items-center gap-1 p-1.5 -ml-1 text-slate-400 hover:text-white rounded-lg active:scale-95 transition"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#008cff]">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatDuration(elapsedSeconds)}</span>
          </div>
          <span className="text-[11px] text-slate-400">Workout in Progress</span>
        </div>

        <button
          onClick={() => finishWorkout()}
          className="px-4 py-1.5 bg-[#008cff] hover:bg-[#0077db] text-white font-bold text-xs uppercase tracking-wider rounded-lg active:scale-95 transition shadow-md shadow-[#008cff]/20"
        >
          Finish
        </button>
      </div>

      {/* Main Scrollable Workout Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-36">
        {/* Workout Title Input */}
        <div>
          <input
            type="text"
            value={activeWorkout.title}
            onChange={(e) => updateWorkoutTitle(e.target.value)}
            placeholder="Workout Title"
            className="w-full bg-transparent text-xl font-black text-white placeholder-slate-600 focus:outline-none border-b border-transparent focus:border-[#008cff] pb-1"
          />
        </div>

        {/* Exercises List */}
        {activeWorkout.exercises.map((exercise, exIdx) => (
          <div
            key={exercise.id}
            className="bg-[#131720] border border-[#242c3d] rounded-2xl p-4 shadow-lg flex flex-col gap-3"
          >
            {/* Exercise Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#242c3d]">
              <div>
                <h3 className="text-base font-bold text-[#008cff]">{exercise.title}</h3>
                <span className="text-[11px] text-slate-400">
                  Rest: {exercise.rest_seconds || settings.default_rest_seconds}s
                </span>
              </div>
              <button
                onClick={() => removeExerciseFromWorkout(exIdx)}
                className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition"
                title="Remove Exercise"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Set Table Headers */}
            <div className="grid grid-cols-12 gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
              <span className="col-span-2">Set</span>
              <span className="col-span-3">Previous</span>
              <span className="col-span-3">{settings.weight_unit.toUpperCase()}</span>
              <span className="col-span-2">Reps</span>
              <span className="col-span-2">Done</span>
            </div>

            {/* Sets Rows */}
            <div className="space-y-2">
              {exercise.sets.map((set, setIdx) => (
                <div
                  key={set.id}
                  className={`grid grid-cols-12 gap-1.5 items-center p-1.5 rounded-xl transition ${
                    set.completed
                      ? 'bg-emerald-950/20 border border-emerald-500/20'
                      : 'bg-[#1a202c] border border-transparent'
                  }`}
                >
                  {/* Set Type Badge (click to change) */}
                  <div className="col-span-2 flex justify-center">
                    <button
                      type="button"
                      onClick={() => cycleSetType(exIdx, setIdx, set.type)}
                      title="Tap to toggle Warmup / Dropset / Failure"
                      className="active:scale-90 transition"
                    >
                      {renderSetBadge(set, setIdx)}
                    </button>
                  </div>

                  {/* Previous Performance Ghost */}
                  <div className="col-span-3 text-center text-xs text-slate-500 font-medium truncate">
                    {set.previousGhost || '—'}
                  </div>

                  {/* Weight Input + Plate Calculator Trigger */}
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
                      className="w-full bg-[#131720] border border-[#242c3d] rounded-lg py-1.5 px-2 text-center text-sm font-bold text-white focus:outline-none focus:border-[#008cff]"
                    />
                    {set.weight_kg && set.weight_kg >= 20 ? (
                      <button
                        type="button"
                        onClick={() => setPlateCalcWeight(set.weight_kg)}
                        className="absolute right-1 text-slate-500 hover:text-[#008cff]"
                        title="Plate Calculator"
                      >
                        <Disc className="w-3.5 h-3.5" />
                      </button>
                    ) : null}
                  </div>

                  {/* Reps Input */}
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
                      className="w-full bg-[#131720] border border-[#242c3d] rounded-lg py-1.5 px-1 text-center text-sm font-bold text-white focus:outline-none focus:border-[#008cff]"
                    />
                  </div>

                  {/* Completed Checkbox Button */}
                  <div className="col-span-2 flex justify-center">
                    <button
                      type="button"
                      onClick={() => toggleSetCompleted(exIdx, setIdx)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold transition active:scale-90 ${
                        set.completed
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                          : 'bg-[#242c3d] text-slate-400 hover:text-white'
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Set Table Actions */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => addSet(exIdx)}
                className="py-1.5 px-3 bg-[#1a202c] hover:bg-[#222938] text-xs font-bold text-[#008cff] rounded-lg flex items-center gap-1.5 transition active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Set
              </button>

              {exercise.sets.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSet(exIdx, exercise.sets.length - 1)}
                  className="text-xs text-slate-500 hover:text-red-400 transition"
                >
                  Delete Last Set
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Add Exercise Button */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="w-full py-4 bg-[#131720] hover:bg-[#1a202c] border border-dashed border-[#242c3d] hover:border-[#008cff] text-[#008cff] font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition active:scale-98"
        >
          <Plus className="w-5 h-5" />
          Add Exercise
        </button>

        {/* Discard Workout Button */}
        <div className="pt-4 flex justify-center">
          {showDiscardConfirm ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-red-400 font-semibold">Discard workout?</span>
              <button
                onClick={() => {
                  discardWorkout();
                  setShowDiscardConfirm(false);
                }}
                className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg"
              >
                Yes, Discard
              </button>
              <button
                onClick={() => setShowDiscardConfirm(false)}
                className="px-3 py-1.5 bg-[#1a202c] text-slate-300 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDiscardConfirm(true)}
              className="text-xs text-red-400/80 hover:text-red-400 font-semibold hover:underline"
            >
              Discard Workout
            </button>
          )}
        </div>
      </div>

      {/* Floating Active Rest Timer Bar (if active) */}
      {restTimer.isActive && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-[#131720]/95 backdrop-blur-md border-t border-[#242c3d] flex items-center justify-between pb-safe shadow-2xl animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <svg className="w-10 h-10 -rotate-90">
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  stroke="#242c3d"
                  strokeWidth="3"
                  fill="transparent"
                />
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  stroke="#008cff"
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
              <span className="text-xs font-bold text-white block">Rest Timer</span>
              <span className="text-[10px] text-slate-400 truncate max-w-[120px] block">
                {restTimer.exerciseTitle || 'Next Set'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => adjustRestTimer(30)}
              className="px-2.5 py-1.5 rounded-lg bg-[#242c3d] text-slate-200 font-bold text-xs hover:bg-slate-700 active:scale-95 transition"
            >
              +30s
            </button>
            <button
              onClick={skipRestTimer}
              className="px-3 py-1.5 rounded-lg bg-[#008cff] text-white font-bold text-xs hover:bg-[#0077db] active:scale-95 transition"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Exercise Search Modal */}
      <ExerciseSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectExercise={(template) => addExerciseToWorkout(template)}
      />

      {/* Plate Calculator Modal */}
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
