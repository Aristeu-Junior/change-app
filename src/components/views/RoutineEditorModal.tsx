import React, { useState } from 'react';
import { X, Plus, Trash2, FolderPlus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Routine, WorkoutExercise, ExerciseTemplate } from '../../types';
import { ExerciseSearchModal } from '../ExerciseSearchModal';

interface RoutineEditorModalProps {
  routineToEdit?: Routine | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RoutineEditorModal: React.FC<RoutineEditorModalProps> = ({
  routineToEdit,
  isOpen,
  onClose
}) => {
  const { folders, createFolder, saveRoutine } = useApp();

  const [title, setTitle] = useState(routineToEdit?.title || '');
  const [folderId, setFolderId] = useState<number | null>(routineToEdit?.folder_id ?? null);
  const [notes, setNotes] = useState(routineToEdit?.notes || '');
  const [exercises, setExercises] = useState<WorkoutExercise[]>(routineToEdit?.exercises || []);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderTitle, setNewFolderTitle] = useState('');

  if (!isOpen) return null;

  const handleAddExercise = (template: ExerciseTemplate) => {
    const newEx: WorkoutExercise = {
      id: `re-${Date.now()}`,
      exercise_template_id: template.id,
      title: template.title,
      rest_seconds: 90,
      sets: [
        { id: `rs-${Date.now()}-0`, index: 0, type: 'normal', weight_kg: 20, reps: 10, completed: false },
        { id: `rs-${Date.now()}-1`, index: 1, type: 'normal', weight_kg: 20, reps: 10, completed: false },
        { id: `rs-${Date.now()}-2`, index: 2, type: 'normal', weight_kg: 20, reps: 10, completed: false }
      ]
    };
    setExercises((prev) => [...prev, newEx]);
  };

  const handleRemoveExercise = (idx: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddSet = (exIdx: number) => {
    setExercises((prev) => {
      const next = [...prev];
      const target = next[exIdx];
      const prevSet = target.sets[target.sets.length - 1];
      target.sets.push({
        id: `rs-${Date.now()}-${target.sets.length}`,
        index: target.sets.length,
        type: 'normal',
        weight_kg: prevSet ? prevSet.weight_kg : 20,
        reps: prevSet ? prevSet.reps : 10,
        completed: false
      });
      return next;
    });
  };

  const handleRemoveSet = (exIdx: number, setIdx: number) => {
    setExercises((prev) => {
      const next = [...prev];
      next[exIdx].sets.splice(setIdx, 1);
      next[exIdx].sets.forEach((s, idx) => (s.index = idx));
      return next;
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const routine: Routine = {
      id: routineToEdit?.id || `routine-${Date.now()}`,
      title: title.trim(),
      folder_id: folderId,
      notes: notes.trim(),
      exercises,
      created_at: routineToEdit?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    saveRoutine(routine);
    onClose();
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderTitle.trim()) return;
    createFolder(newFolderTitle.trim());
    setNewFolderTitle('');
    setIsCreatingFolder(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#131720] border border-[#242c3d] rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl flex flex-col h-[92vh] sm:h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#242c3d] shrink-0">
          <h2 className="text-lg font-bold text-white">
            {routineToEdit ? 'Edit Routine' : 'New Routine'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
            {/* Title */}
            <div>
              <label className="text-xs uppercase text-slate-400 font-semibold mb-1 block">
                Routine Name
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Upper Body Strength"
                className="w-full bg-[#1a202c] border border-[#242c3d] rounded-xl px-4 py-2.5 text-white font-bold placeholder-slate-500 focus:outline-none focus:border-[#008cff]"
                required
              />
            </div>

            {/* Folder Selection */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs uppercase text-slate-400 font-semibold block">
                  Folder
                </label>
                <button
                  type="button"
                  onClick={() => setIsCreatingFolder(!isCreatingFolder)}
                  className="text-xs text-[#008cff] font-semibold hover:underline flex items-center gap-1"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  + New Folder
                </button>
              </div>

              {isCreatingFolder && (
                <div className="flex gap-2 mb-2 p-2 bg-[#1a202c] rounded-xl border border-[#242c3d]">
                  <input
                    type="text"
                    value={newFolderTitle}
                    onChange={(e) => setNewFolderTitle(e.target.value)}
                    placeholder="Folder name..."
                    className="flex-1 bg-[#131720] border border-[#242c3d] rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={handleCreateFolder}
                    className="px-3 py-1.5 bg-[#008cff] text-white text-xs font-bold rounded-lg"
                  >
                    Add
                  </button>
                </div>
              )}

              <select
                value={folderId ?? ''}
                onChange={(e) => setFolderId(e.target.value ? Number(e.target.value) : null)}
                className="w-full bg-[#1a202c] border border-[#242c3d] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#008cff]"
              >
                <option value="">No Folder (My Routines)</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs uppercase text-slate-400 font-semibold mb-1 block">
                Routine Notes / Instructions
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tips, warm-up reminders, or focus cues..."
                rows={2}
                className="w-full bg-[#1a202c] border border-[#242c3d] rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#008cff] resize-none"
              />
            </div>

            {/* Exercises List */}
            <div className="space-y-3 pt-2">
              <span className="text-xs uppercase text-slate-400 font-semibold block">
                Exercises ({exercises.length})
              </span>

              {exercises.map((ex, exIdx) => (
                <div
                  key={ex.id}
                  className="bg-[#1a202c] border border-[#242c3d] rounded-2xl p-3.5 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[#008cff]">{ex.title}</h4>
                    <button
                      type="button"
                      onClick={() => handleRemoveExercise(exIdx)}
                      className="p-1 text-slate-500 hover:text-red-400 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Sets */}
                  <div className="space-y-1.5">
                    {ex.sets.map((set, setIdx) => (
                      <div
                        key={set.id}
                        className="flex items-center gap-2 text-xs bg-[#131720] p-2 rounded-lg"
                      >
                        <span className="w-5 text-center font-bold text-slate-400">{setIdx + 1}</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={set.weight_kg ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? null : parseFloat(e.target.value);
                              setExercises((prev) => {
                                const next = [...prev];
                                next[exIdx].sets[setIdx].weight_kg = val;
                                return next;
                              });
                            }}
                            className="w-14 bg-[#1a202c] border border-[#242c3d] rounded px-1.5 py-1 text-center font-bold text-white"
                          />
                          <span className="text-slate-500">kg</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={set.reps ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                              setExercises((prev) => {
                                const next = [...prev];
                                next[exIdx].sets[setIdx].reps = val;
                                return next;
                              });
                            }}
                            className="w-12 bg-[#1a202c] border border-[#242c3d] rounded px-1.5 py-1 text-center font-bold text-white"
                          />
                          <span className="text-slate-500">reps</span>
                        </div>

                        {ex.sets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSet(exIdx, setIdx)}
                            className="ml-auto text-slate-600 hover:text-red-400 p-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddSet(exIdx)}
                    className="text-xs text-[#008cff] font-semibold hover:underline flex items-center gap-1 pt-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Set
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="w-full py-3 bg-[#1a202c] hover:bg-[#222938] border border-dashed border-[#242c3d] hover:border-[#008cff] text-[#008cff] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
              >
                <Plus className="w-4 h-4" /> Add Exercise
              </button>
            </div>
          </div>

          {/* Footer Save Button */}
          <div className="pt-3 border-t border-[#242c3d] shrink-0">
            <button
              type="submit"
              className="w-full py-3.5 bg-[#008cff] hover:bg-[#0077db] text-white font-bold rounded-xl active:scale-98 transition shadow-lg shadow-[#008cff]/20"
            >
              Save Routine
            </button>
          </div>
        </form>
      </div>

      <ExerciseSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectExercise={handleAddExercise}
      />
    </div>
  );
};
