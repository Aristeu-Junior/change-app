import React, { useState, useMemo } from 'react';
import { X, Search, Plus, Dumbbell, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ExerciseTemplate, MuscleGroup, EquipmentCategory, ExerciseType } from '../types';

interface ExerciseSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: ExerciseTemplate) => void;
}

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

export const ExerciseSearchModal: React.FC<ExerciseSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectExercise
}) => {
  const { exercises, addCustomExercise } = useApp();
  const [query, setQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'all'>('all');
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);

  // Custom exercise form state
  const [customTitle, setCustomTitle] = useState('');
  const [customMuscle, setCustomMuscle] = useState<MuscleGroup>('chest');
  const [customEquipment, setCustomEquipment] = useState<EquipmentCategory>('barbell');
  const [customType, setCustomType] = useState<ExerciseType>('weight_reps');

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

  if (!isOpen) return null;

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    const newEx = {
      title: customTitle.trim(),
      primary_muscle_group: customMuscle,
      equipment: customEquipment,
      type: customType
    };

    addCustomExercise(newEx);
    setIsCreatingCustom(false);
    setCustomTitle('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#131720] border border-[#242c3d] rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl flex flex-col h-[90vh] sm:h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#242c3d]">
          <h2 className="text-lg font-bold text-white">
            {isCreatingCustom ? 'New Custom Exercise' : 'Select Exercise'}
          </h2>
          <button
            onClick={() => {
              if (isCreatingCustom) setIsCreatingCustom(false);
              else onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isCreatingCustom ? (
          /* Custom Exercise Creation Form */
          <form onSubmit={handleCreateCustom} className="flex-1 flex flex-col gap-4 py-4 overflow-y-auto">
            <div>
              <label className="text-xs uppercase text-slate-400 font-semibold mb-1 block">
                Exercise Name
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. Incline Smith Machine Press"
                className="w-full bg-[#1a202c] border border-[#242c3d] rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#008cff]"
                autoFocus
                required
              />
            </div>

            <div>
              <label className="text-xs uppercase text-slate-400 font-semibold mb-1 block">
                Primary Muscle Group
              </label>
              <select
                value={customMuscle}
                onChange={(e) => setCustomMuscle(e.target.value as MuscleGroup)}
                className="w-full bg-[#1a202c] border border-[#242c3d] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#008cff]"
              >
                {MUSCLE_FILTERS.filter((m) => m.value !== 'all').map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs uppercase text-slate-400 font-semibold mb-1 block">
                Equipment
              </label>
              <select
                value={customEquipment}
                onChange={(e) => setCustomEquipment(e.target.value as EquipmentCategory)}
                className="w-full bg-[#1a202c] border border-[#242c3d] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#008cff]"
              >
                <option value="barbell">Barbell</option>
                <option value="dumbbell">Dumbbell</option>
                <option value="machine">Machine</option>
                <option value="cable">Cable</option>
                <option value="bodyweight">Bodyweight</option>
                <option value="kettlebell">Kettlebell</option>
                <option value="resistance_band">Resistance Band</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-xs uppercase text-slate-400 font-semibold mb-1 block">
                Exercise Type
              </label>
              <select
                value={customType}
                onChange={(e) => setCustomType(e.target.value as ExerciseType)}
                className="w-full bg-[#1a202c] border border-[#242c3d] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#008cff]"
              >
                <option value="weight_reps">Weight & Reps</option>
                <option value="bodyweight_reps">Bodyweight Reps</option>
                <option value="duration">Duration (Seconds)</option>
                <option value="distance_duration">Distance & Duration</option>
              </select>
            </div>

            <div className="mt-auto flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsCreatingCustom(false)}
                className="flex-1 py-3 bg-[#1a202c] text-slate-300 font-semibold rounded-xl hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-[#008cff] text-white font-bold rounded-xl hover:bg-[#0077db] transition shadow-lg shadow-[#008cff]/20"
              >
                Create Exercise
              </button>
            </div>
          </form>
        ) : (
          /* Exercise List View */
          <>
            {/* Search Input */}
            <div className="relative my-3">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search exercise or muscle..."
                className="w-full bg-[#1a202c] border border-[#242c3d] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#008cff]"
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

            {/* Muscle Group Horizontal Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 no-scrollbar">
              {MUSCLE_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setSelectedMuscle(f.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                    selectedMuscle === f.value
                      ? 'bg-[#008cff] text-white'
                      : 'bg-[#1a202c] text-slate-400 hover:text-white border border-[#242c3d]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Exercise Items List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {filteredExercises.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400">
                  <Dumbbell className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-sm font-medium">No exercises found</p>
                  <button
                    onClick={() => {
                      setCustomTitle(query);
                      setIsCreatingCustom(true);
                    }}
                    className="mt-3 text-xs font-bold text-[#008cff] hover:underline"
                  >
                    + Create "{query || 'New Exercise'}"
                  </button>
                </div>
              ) : (
                filteredExercises.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => {
                      onSelectExercise(ex);
                      onClose();
                    }}
                    className="w-full text-left p-3 rounded-xl bg-[#1a202c] hover:bg-[#222938] border border-[#242c3d] transition flex items-center justify-between group active:scale-98"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-[#008cff] transition">
                        {ex.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-semibold text-slate-400 capitalize">
                          {ex.primary_muscle_group}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-[11px] text-slate-500 capitalize">
                          {ex.equipment}
                        </span>
                        {ex.is_custom && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-400">
                            Custom
                          </span>
                        )}
                      </div>
                    </div>
                    <Plus className="w-5 h-5 text-slate-500 group-hover:text-[#008cff] transition" />
                  </button>
                ))
              )}
            </div>

            {/* Create Custom Exercise Footer Button */}
            <div className="pt-3 border-t border-[#242c3d]">
              <button
                onClick={() => setIsCreatingCustom(true)}
                className="w-full py-3 bg-[#1a202c] hover:bg-[#222938] text-[#008cff] font-bold text-sm rounded-xl border border-[#008cff]/30 flex items-center justify-center gap-2 transition"
              >
                <Plus className="w-4 h-4" />
                Create Custom Exercise
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
