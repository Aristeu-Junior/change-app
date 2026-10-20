import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, FolderPlus, Sparkles, ChevronRight, RotateCcw, Dumbbell, Eye } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Routine, WorkoutExercise, ExerciseTemplate } from '../../types';
import { ExerciseSearchModal } from '../ExerciseSearchModal';
import { ExerciseVisualDemo } from '../ExerciseVisualDemo';
import { POPULAR_ROUTINE_PRESETS, RoutinePreset } from '../../data/defaultRoutines';

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
  const { folders, createFolder, saveRoutine, exercises: allTemplates } = useApp();

  const [title, setTitle] = useState('');
  const [folderId, setFolderId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderTitle, setNewFolderTitle] = useState('');
  const [showPresets, setShowPresets] = useState(true);
  const [preview3DExId, setPreview3DExId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(routineToEdit?.title || '');
      setFolderId(routineToEdit?.folder_id ?? null);
      setNotes(routineToEdit?.notes || '');
      setExercises(
        routineToEdit?.exercises ? JSON.parse(JSON.stringify(routineToEdit.exercises)) : []
      );
      setIsCreatingFolder(false);
      setNewFolderTitle('');
      setShowPresets(!routineToEdit);
    }
  }, [isOpen, routineToEdit]);

  if (!isOpen) return null;

  // Preenche o plano com uma sugestão conhecida (podendo editar livremente antes de salvar)
  const handleApplyPreset = (preset: RoutinePreset) => {
    setTitle(preset.title);
    setNotes(`${preset.subtitle}. ${preset.description}`);
    const mappedExercises: WorkoutExercise[] = preset.exercises.map((pEx, idx) => ({
      id: `pe-${Date.now()}-${idx}`,
      exercise_template_id: pEx.exercise_template_id,
      title: pEx.title,
      rest_seconds: 90,
      sets: Array.from({ length: pEx.setsCount }).map((_, sIdx) => ({
        id: `ps-${Date.now()}-${idx}-${sIdx}`,
        index: sIdx,
        type: 'normal',
        weight_kg: pEx.weightKg,
        reps: pEx.reps,
        completed: false
      }))
    }));
    setExercises(mappedExercises);
    setShowPresets(false);
  };

  // Limpa para montar do zero
  const handleResetToEmpty = () => {
    setTitle('');
    setNotes('');
    setExercises([]);
  };

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#121214] border border-[#27272a] rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl flex flex-col h-[86dvh] modal-safe-sheet text-white">
        {/* Topo */}
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a] shrink-0">
          <div>
            <h2 className="text-base font-black text-white">
              {routineToEdit ? 'Editar Plano de Treino' : 'Montar Novo Plano de Treino'}
            </h2>
            <p className="text-[11px] text-zinc-400">
              Escolha uma sugestão conhecida abaixo ou monte seu treino do zero
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSave} className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 py-3 pr-1">
            {/* SUGESTÕES DE TREINOS CONHECIDOS (Aparece apenas aqui ao clicar em Montar Novo Treino) */}
            <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowPresets(!showPresets)}
                  className="flex items-center gap-2 text-left"
                >
                  <div className="w-6 h-6 rounded-lg bg-white text-black flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-black" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-white block">
                      Sugestões de Treinos Conhecidos
                    </span>
                    <span className="text-[10px] text-zinc-400 block">
                      {showPresets
                        ? 'Toque em um modelo para carregar ou preencha do zero abaixo'
                        : 'Toque para ver as 6 divisões clássicas de academia'}
                    </span>
                  </div>
                </button>

                <div className="flex items-center gap-1.5">
                  {(title || exercises.length > 0) && (
                    <button
                      type="button"
                      onClick={handleResetToEmpty}
                      className="px-2 py-1 rounded-lg bg-[#27272a] hover:bg-zinc-700 text-[10px] font-bold text-zinc-200 flex items-center gap-1 transition"
                      title="Limpar e montar do zero"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Do Zero
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPresets(!showPresets)}
                    className="text-[11px] font-bold text-zinc-400 hover:text-white px-1.5 py-0.5"
                  >
                    {showPresets ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
              </div>

              {showPresets && (
                <div className="flex gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar -mx-1 px-1">
                  {POPULAR_ROUTINE_PRESETS.map((preset) => (
                    <button
                      type="button"
                      key={preset.id}
                      onClick={() => handleApplyPreset(preset)}
                      className="min-w-[205px] max-w-[220px] bg-[#121214] border border-[#27272a] hover:border-white rounded-xl p-2.5 text-left flex flex-col justify-between shrink-0 transition active:scale-95 group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-white text-black">
                            {preset.tag}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-semibold">
                            {preset.exercises.length} exerc.
                          </span>
                        </div>
                        <h4 className="text-xs font-black text-white line-clamp-1">
                          {preset.title}
                        </h4>
                        <p className="text-[10px] text-zinc-400 line-clamp-2 mt-0.5 leading-snug">
                          {preset.description}
                        </p>
                      </div>
                      <div className="mt-2 pt-1.5 border-t border-[#27272a] flex items-center justify-between text-[10px] font-black text-white">
                        <span>Carregar modelo</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Nome do Plano */}
            <div>
              <label className="text-xs uppercase text-zinc-400 font-bold mb-1 block">
                Nome do Plano de Treino
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Treino A - Peitoral e Tríceps"
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs text-white font-bold placeholder-zinc-500 focus:outline-none focus:border-white"
                required
              />
            </div>

            {/* Pasta / Divisão */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs uppercase text-zinc-400 font-bold block">
                  Pasta / Grupo de Treinos (Opcional)
                </label>
                <button
                  type="button"
                  onClick={() => setIsCreatingFolder(!isCreatingFolder)}
                  className="text-xs text-white font-semibold hover:underline flex items-center gap-1"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  + Nova Pasta
                </button>
              </div>

              {isCreatingFolder && (
                <div className="flex gap-2 mb-2 p-2 bg-[#18181b] rounded-xl border border-[#27272a]">
                  <input
                    type="text"
                    value={newFolderTitle}
                    onChange={(e) => setNewFolderTitle(e.target.value)}
                    placeholder="Nome da pasta (Ex: Divisão ABC)..."
                    className="flex-1 bg-[#121214] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={handleCreateFolder}
                    className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded-lg shadow-sm"
                  >
                    Criar
                  </button>
                </div>
              )}

              <select
                value={folderId ?? ''}
                onChange={(e) => setFolderId(e.target.value ? Number(e.target.value) : null)}
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white"
              >
                <option value="">Sem Pasta (Lista Principal)</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Notas / Observações */}
            <div>
              <label className="text-xs uppercase text-zinc-400 font-bold mb-1 block">
                Notas do Treino / Orientações
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Aquecer manguito rotador antes de começar. 90s de descanso."
                rows={2}
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white resize-none"
              />
            </div>

            {/* Lista dos Exercícios do Plano */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase text-zinc-400 font-bold block">
                  Exercícios Deste Plano ({exercises.length})
                </span>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="text-xs font-black text-white hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Pesquisar Exercício
                </button>
              </div>

              {exercises.map((ex, exIdx) => {
                const tpl =
                  allTemplates.find((t) => t.id === ex.exercise_template_id) ||
                  allTemplates.find((t) => t.title.toLowerCase() === ex.title.toLowerCase());
                const thumbUrl = tpl?.gif_id
                  ? `https://cdn.jsdelivr.net/gh/omercotkd/exercises-gifs@main/assets/${tpl.gif_id}.gif`
                  : tpl?.gif_url || null;
                const isPreviewing3D = preview3DExId === ex.id;

                return (
                  <div
                    key={ex.id}
                    className="bg-[#18181b] border border-[#27272a] rounded-2xl p-3.5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          type="button"
                          onClick={() => setPreview3DExId(isPreviewing3D ? null : ex.id)}
                          className="w-11 h-11 rounded-xl bg-white border border-[#27272a] overflow-hidden shrink-0 flex items-center justify-center relative group"
                          title="Toque para expandir a visualização 3D"
                        >
                          {thumbUrl ? (
                            <img
                              src={thumbUrl}
                              alt={ex.title}
                              loading="lazy"
                              className="w-full h-full object-cover pointer-events-none"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#121214] flex items-center justify-center">
                              <Dumbbell className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </button>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{ex.title}</h4>
                          <button
                            type="button"
                            onClick={() => setPreview3DExId(isPreviewing3D ? null : ex.id)}
                            className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 mt-0.5 font-semibold"
                          >
                            <Eye className="w-3 h-3" />
                            <span>{isPreviewing3D ? 'Ocultar 3D' : 'Ver Execução 3D'}</span>
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(exIdx)}
                        className="p-1 text-zinc-500 hover:text-red-400 transition shrink-0"
                        title="Remover do plano"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {isPreviewing3D && tpl && (
                      <div className="pt-1">
                        <ExerciseVisualDemo exercise={tpl} />
                      </div>
                    )}

                  {/* Séries do exercício no plano */}
                  <div className="space-y-1.5">
                    {ex.sets.map((set, setIdx) => (
                      <div
                        key={set.id}
                        className="flex items-center gap-2 text-xs bg-[#121214] p-2 rounded-lg"
                      >
                        <span className="w-5 text-center font-bold text-zinc-400">{setIdx + 1}</span>
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
                            className="w-14 bg-[#18181b] border border-[#27272a] rounded px-1.5 py-1 text-center font-bold text-white"
                          />
                          <span className="text-zinc-500 text-[10px]">kg</span>
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
                            className="w-12 bg-[#18181b] border border-[#27272a] rounded px-1.5 py-1 text-center font-bold text-white"
                          />
                          <span className="text-zinc-500 text-[10px]">reps</span>
                        </div>

                        {ex.sets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSet(exIdx, setIdx)}
                            className="ml-auto text-zinc-600 hover:text-red-400 p-1"
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
                      className="text-xs text-zinc-300 font-semibold hover:text-white flex items-center gap-1 pt-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Série
                    </button>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="w-full py-3 bg-[#18181b] hover:bg-[#222226] border border-dashed border-[#3f3f46] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
              >
                <Plus className="w-4 h-4" /> Adicionar Exercício ao Plano
              </button>
            </div>
          </div>

          {/* Botão Salvar Plano */}
          <div className="pt-3 border-t border-[#27272a] shrink-0">
            <button
              type="submit"
              className="w-full py-3.5 bg-white text-black font-black text-xs uppercase tracking-wider rounded-xl active:scale-98 transition shadow-lg"
            >
              Salvar Plano de Treino
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
