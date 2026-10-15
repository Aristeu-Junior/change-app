import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Dumbbell,
  Trophy,
  Info,
  History,
  X,
  Trash2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ExerciseTemplate, MuscleGroup } from '../../types';
import { displayWeight } from '../../utils/calc';
import { ExerciseSearchModal } from '../ExerciseSearchModal';

const MUSCLE_FILTERS: { label: string; value: MuscleGroup | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Chest', value: 'chest' },
  { label: 'Back', value: 'back' },
  { label: 'Shoulders', value: 'shoulders' },
  { label: 'Biceps', value: 'biceps' },
  { label: 'Triceps', value: 'triceps' },
  { label: 'Quads', value: 'quadriceps' },
  { label: 'Hamstrings', value: 'hamstrings' },
  { label: 'Glutes', value: 'glutes' },
  { label: 'Calves', value: 'calves' },
  { label: 'Abs / Core', value: 'abdominals' },
  { label: 'Cardio', value: 'cardio' }
];

export const ExercisesView: React.FC = () => {
  const { exercises, personalRecords, workouts, settings, deleteCustomExercise } = useApp();

  const [query, setQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'all'>('all');
  const [selectedDetailExercise, setSelectedDetailExercise] = useState<ExerciseTemplate | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesQuery =
        ex.title.toLowerCase().includes(query.toLowerCase()) ||
        ex.primary_muscle_group.toLowerCase().includes(query.toLowerCase());
      const matchesMuscle =
        selectedMuscle === 'all' ||
        ex.primary_muscle_group === selectedMuscle ||
        ex.secondary_muscle_groups?.includes(selectedMuscle as MuscleGroup);
      return matchesQuery && matchesMuscle;
    });
  }, [exercises, query, selectedMuscle]);

  // Find history for the selected detail exercise
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

  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-28 space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Exercises</h1>
          <p className="text-xs text-slate-400">Library & personal bests</p>
        </div>
        <button
          onClick={() => setIsSearchModalOpen(true)}
          className="p-2.5 bg-[#131720] hover:bg-[#1a202c] border border-[#242c3d] text-[#008cff] rounded-xl flex items-center gap-1 text-xs font-bold transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search 50+ exercises..."
          className="w-full bg-[#131720] border border-[#242c3d] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#008cff]"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Muscle Filter Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {MUSCLE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setSelectedMuscle(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
              selectedMuscle === f.value
                ? 'bg-[#008cff] text-white'
                : 'bg-[#131720] text-slate-400 hover:text-white border border-[#242c3d]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Exercise Cards */}
      <div className="space-y-2">
        {filteredExercises.map((ex) => {
          const pr = personalRecords[ex.id];
          return (
            <div
              key={ex.id}
              onClick={() => setSelectedDetailExercise(ex)}
              className="bg-[#131720] border border-[#242c3d] hover:border-slate-600 rounded-2xl p-3.5 shadow-sm flex items-center justify-between cursor-pointer transition active:scale-98"
            >
              <div>
                <h4 className="text-sm font-bold text-white hover:text-[#008cff] transition">
                  {ex.title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] font-semibold text-slate-400 capitalize">
                    {ex.primary_muscle_group}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-[11px] text-slate-500 capitalize">{ex.equipment}</span>
                  {ex.is_custom && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-400">
                      Custom
                    </span>
                  )}
                </div>
              </div>

              {/* PR Badge if exists */}
              {pr ? (
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1 text-xs font-black text-amber-400">
                    <Trophy className="w-3.5 h-3.5" />
                    <span>{displayWeight(pr.max_weight_kg, settings.weight_unit)}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">1RM: {displayWeight(pr.best_1rm_kg, settings.weight_unit)}</span>
                </div>
              ) : (
                <span className="text-xs text-slate-600 font-medium">—</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Exercise Details Modal */}
      {selectedDetailExercise && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#131720] border border-[#242c3d] rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#242c3d]">
              <div>
                <h2 className="text-lg font-black text-white">{selectedDetailExercise.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-semibold text-[#008cff] capitalize">
                    {selectedDetailExercise.primary_muscle_group}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs text-slate-400 capitalize">
                    {selectedDetailExercise.equipment}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedDetailExercise(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Personal Records Box */}
            <div className="bg-[#1a202c] p-4 rounded-2xl border border-[#242c3d]">
              <span className="text-xs uppercase text-slate-400 font-bold block mb-2 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                Personal Best
              </span>
              {personalRecords[selectedDetailExercise.id] ? (
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-[#131720] p-2.5 rounded-xl border border-[#242c3d]">
                    <span className="text-[10px] uppercase text-slate-500 font-semibold block">
                      Max Weight
                    </span>
                    <span className="text-base font-black text-amber-400">
                      {displayWeight(
                        personalRecords[selectedDetailExercise.id].max_weight_kg,
                        settings.weight_unit
                      )}
                    </span>
                  </div>
                  <div className="bg-[#131720] p-2.5 rounded-xl border border-[#242c3d]">
                    <span className="text-[10px] uppercase text-slate-500 font-semibold block">
                      Est. 1RM
                    </span>
                    <span className="text-base font-black text-[#008cff]">
                      {displayWeight(
                        personalRecords[selectedDetailExercise.id].best_1rm_kg,
                        settings.weight_unit
                      )}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No logged records yet</p>
              )}
            </div>

            {/* Instructions */}
            {selectedDetailExercise.instructions && (
              <div className="bg-[#1a202c] p-4 rounded-2xl border border-[#242c3d]">
                <span className="text-xs uppercase text-slate-400 font-bold block mb-1.5 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-[#008cff]" />
                  Instructions & Form Cues
                </span>
                <p className="text-xs leading-relaxed text-slate-300">
                  {selectedDetailExercise.instructions}
                </p>
              </div>
            )}

            {/* History Feed */}
            <div className="space-y-2">
              <span className="text-xs uppercase text-slate-400 font-bold block flex items-center gap-1.5">
                <History className="w-4 h-4 text-emerald-400" />
                Recent History
              </span>
              {exerciseHistory.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No past workouts with this exercise</p>
              ) : (
                exerciseHistory.slice(0, 5).map((h, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#1a202c] rounded-xl border border-[#242c3d] text-xs flex justify-between items-center"
                  >
                    <div>
                      <span className="font-bold text-white block">{h.workoutTitle}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(h.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-right text-slate-300">
                      {h.sets.map((s, sIdx) => (
                        <span key={sIdx} className="font-semibold block">
                          {s.weight_kg}kg × {s.reps}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Delete button if custom */}
            {selectedDetailExercise.is_custom && (
              <button
                onClick={() => {
                  deleteCustomExercise(selectedDetailExercise.id);
                  setSelectedDetailExercise(null);
                }}
                className="w-full py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Delete Custom Exercise
              </button>
            )}
          </div>
        </div>
      )}

      {/* Exercise Search Modal for creating custom */}
      <ExerciseSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectExercise={(ex) => setSelectedDetailExercise(ex)}
      />
    </div>
  );
};
