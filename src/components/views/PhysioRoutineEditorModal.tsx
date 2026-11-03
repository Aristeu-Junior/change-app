import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  Check,
  Search,
  Activity,
  Clock,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  Routine,
  WorkoutExercise,
  WorkoutSet,
  PhysiotherapyExercise,
  PhysioRegion,
  ExerciseTemplate
} from '../../types';
import {
  PHYSIOTHERAPY_EXERCISES,
  PHYSIOTHERAPY_TEMPLATES,
  getPhysioExerciseById
} from '../../data/physiotherapyExercises';
import { ExerciseVisualDemo } from '../ExerciseVisualDemo';
import { triggerHaptic } from '../../utils/calc';

interface PhysioRoutineEditorModalProps {
  routineToEdit?: Routine | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (routine: Routine) => void;
}

const REGION_TABS: { label: string; value: PhysioRegion | 'all' }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Coluna & Lombar', value: 'lombar' },
  { label: 'Quadril & Pernas', value: 'quadril' },
  { label: 'Joelhos', value: 'joelho' },
  { label: 'Ombros & Escápulas', value: 'ombro' },
  { label: 'Cervical & Postura', value: 'cervical' }
];

export const PhysioRoutineEditorModal: React.FC<PhysioRoutineEditorModalProps> = ({
  routineToEdit,
  isOpen,
  onClose,
  onSaved
}) => {
  const { saveRoutine, theme } = useApp();
  const isLight = theme === 'light';

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerRegion, setPickerRegion] = useState<PhysioRegion | 'all'>('all');
  const [previewTemplate, setPreviewTemplate] = useState<ExerciseTemplate | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(routineToEdit?.title || '');
      setNotes(routineToEdit?.notes || '');
      setExercises(
        routineToEdit?.exercises ? JSON.parse(JSON.stringify(routineToEdit.exercises)) : []
      );
      setIsPickerOpen(false);
      setPickerSearch('');
      setPickerRegion('all');
      setPreviewTemplate(null);
    }
  }, [isOpen, routineToEdit]);

  if (!isOpen) return null;

  // Filtragem dos exercícios de fisioterapia no seletor
  const filteredPickerExercises = PHYSIOTHERAPY_EXERCISES.filter((ex) => {
    const matchRegion = pickerRegion === 'all' || ex.region === pickerRegion;
    if (!matchRegion) return false;
    if (!pickerSearch.trim()) return true;
    const q = pickerSearch.toLowerCase().trim();
    return (
      ex.title.toLowerCase().includes(q) ||
      ex.region_label.toLowerCase().includes(q) ||
      ex.clinical_objective.toLowerCase().includes(q)
    );
  });

  // Adicionar exercício de fisio ao plano
  const handleSelectPhysioExercise = (ex: PhysiotherapyExercise) => {
    triggerHaptic('light');
    const isDuration = ex.execution_type === 'duration';
    const initialSetsCount = ex.default_sets || 3;
    const initialDuration = ex.default_duration_seconds || 30;
    const initialReps = ex.default_reps || 12;

    const newSets: WorkoutSet[] = Array.from({ length: initialSetsCount }).map((_, sIdx) => ({
      id: `ps-${Date.now()}-${exercises.length}-${sIdx}`,
      index: sIdx,
      type: 'normal',
      weight_kg: null,
      reps: isDuration ? null : initialReps,
      duration_seconds: isDuration ? initialDuration : null,
      completed: false
    }));

    const newEx: WorkoutExercise = {
      id: `pe-${Date.now()}-${exercises.length}`,
      exercise_template_id: `physio-${ex.id}`,
      title: ex.title,
      notes: ex.clinical_objective,
      rest_seconds: 45,
      sets: newSets
    };

    setExercises((prev) => [...prev, newEx]);
    setIsPickerOpen(false);
    setPickerSearch('');
  };

  // Ajustar número de séries de um exercício
  const handleAdjustSetsCount = (exIdx: number, delta: number) => {
    setExercises((prev) => {
      const next = [...prev];
      const target = { ...next[exIdx] };
      const currentCount = target.sets.length;
      const newCount = Math.max(1, Math.min(10, currentCount + delta));
      if (newCount === currentCount) return prev;

      if (newCount > currentCount) {
        const lastSet = target.sets[target.sets.length - 1];
        const added: WorkoutSet = {
          id: `ps-${Date.now()}-${exIdx}-${newCount - 1}`,
          index: newCount - 1,
          type: 'normal',
          weight_kg: null,
          reps: lastSet?.reps ?? 12,
          duration_seconds: lastSet?.duration_seconds ?? 30,
          completed: false
        };
        target.sets = [...target.sets, added];
      } else {
        target.sets = target.sets.slice(0, newCount);
      }

      next[exIdx] = target;
      return next;
    });
  };

  // Ajustar duração ou repetições para todas as séries do exercício
  const handleAdjustTargetMetric = (exIdx: number, delta: number) => {
    setExercises((prev) => {
      const next = [...prev];
      const target = { ...next[exIdx] };
      const isDuration = Boolean(target.sets[0]?.duration_seconds !== null && target.sets[0]?.duration_seconds !== undefined);

      target.sets = target.sets.map((s) => {
        if (isDuration) {
          const cur = s.duration_seconds ?? 30;
          return { ...s, duration_seconds: Math.max(10, Math.min(600, cur + delta)) };
        } else {
          const cur = s.reps ?? 10;
          return { ...s, reps: Math.max(1, Math.min(100, cur + delta)) };
        }
      });

      next[exIdx] = target;
      return next;
    });
  };

  // Mover exercício na sequência
  const handleMoveExercise = (exIdx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? exIdx - 1 : exIdx + 1;
    if (targetIdx < 0 || targetIdx >= exercises.length) return;
    setExercises((prev) => {
      const next = [...prev];
      const temp = next[exIdx];
      next[exIdx] = next[targetIdx];
      next[targetIdx] = temp;
      return next;
    });
  };

  // Remover exercício
  const handleRemoveExercise = (exIdx: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== exIdx));
  };

  // Salvar plano
  const handleSave = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      alert('Por favor, informe um título para o seu plano de fisioterapia.');
      return;
    }
    if (exercises.length === 0) {
      alert('Adicione ao menos um exercício clínico ao seu plano.');
      return;
    }

    const savedRoutine: Routine = {
      id: routineToEdit?.id || `routine-physio-${Date.now()}`,
      title: trimmedTitle,
      folder_id: null,
      notes: notes.trim() || undefined,
      exercises,
      created_at: routineToEdit?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_physio: true
    };

    saveRoutine(savedRoutine);
    triggerHaptic('success');
    if (onSaved) onSaved(savedRoutine);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 text-white select-none">
      <div className="w-full sm:max-w-xl h-full sm:h-auto sm:max-h-[92vh] bg-[#121214] border-0 sm:border border-[#27272a] rounded-none sm:rounded-3xl p-5 shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* Topo do Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center shrink-0 shadow">
              <Activity className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                Plano de Fisioterapia & Reabilitação
              </span>
              <h2 className="text-base font-black truncate">
                {routineToEdit ? 'Editar Plano de Fisioterapia' : 'Novo Plano de Fisioterapia'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo Rolável */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Campo Título do Plano */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block">
              Nome do Plano:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Descompressão Lombar Matinal, Joelhos Sem Dor..."
              className={`w-full px-4 py-3 rounded-2xl text-xs font-bold border transition focus:outline-none ${
                isLight
                  ? 'bg-zinc-100 border-zinc-200 text-black placeholder-zinc-500 focus:border-black'
                  : 'bg-[#18181b] border-[#27272a] text-white placeholder-zinc-500 focus:border-white'
              }`}
            />
          </div>

          {/* Campo Observações Clínicas */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block">
              Observações / Recomendações:
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Fazer em jejum ao acordar, manter respiração lenta e profunda..."
              className={`w-full px-4 py-2.5 rounded-2xl text-xs font-medium border transition focus:outline-none ${
                isLight
                  ? 'bg-zinc-100 border-zinc-200 text-black placeholder-zinc-500 focus:border-black'
                  : 'bg-[#18181b] border-[#27272a] text-white placeholder-zinc-500 focus:border-white'
              }`}
            />
          </div>

          {/* Lista de Exercícios Adicionados */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
                Exercícios do Plano ({exercises.length})
              </span>
              <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-white text-black font-black text-xs flex items-center gap-1.5 active:scale-95 transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Exercício</span>
              </button>
            </div>

            {exercises.length === 0 ? (
              <div className="p-8 text-center bg-[#18181b] border border-dashed border-[#27272a] rounded-3xl space-y-2">
                <p className="text-xs font-bold text-zinc-400">
                  Nenhum exercício adicionado a este plano ainda.
                </p>
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(true)}
                  className="px-4 py-2 bg-white text-black font-black text-xs rounded-xl shadow inline-flex items-center gap-1.5 active:scale-95 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Escolher da Biblioteca de Fisio</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {exercises.map((ex, exIdx) => {
                  const tpl =
                    PHYSIOTHERAPY_TEMPLATES.find((t) => t.id === ex.exercise_template_id) ||
                    PHYSIOTHERAPY_TEMPLATES.find((t) => `physio-${t.id}` === ex.exercise_template_id);
                  const physioData = getPhysioExerciseById(ex.exercise_template_id);
                  const thumbUrl = physioData?.gif_id
                    ? `https://cdn.jsdelivr.net/gh/omercotkd/exercises-gifs@main/assets/${physioData.gif_id}.gif`
                    : tpl?.gif_id
                    ? `https://cdn.jsdelivr.net/gh/omercotkd/exercises-gifs@main/assets/${tpl.gif_id}.gif`
                    : null;
                  const isDuration = Boolean(ex.sets[0]?.duration_seconds !== null && ex.sets[0]?.duration_seconds !== undefined);
                  const currentMetric = isDuration
                    ? `${ex.sets[0]?.duration_seconds || 30}s`
                    : `${ex.sets[0]?.reps || 12} reps`;

                  return (
                    <div
                      key={ex.id || exIdx}
                      className="p-3.5 bg-[#18181b] border border-[#27272a] rounded-2xl space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <div className="w-11 h-11 rounded-xl bg-white border border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center">
                            {thumbUrl ? (
                              <img
                                src={thumbUrl}
                                alt={ex.title}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover pointer-events-none select-none"
                              />
                            ) : (
                              <Activity className="w-4 h-4 text-zinc-700" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-emerald-400">
                                {physioData?.region_label || 'Fisioterapia'}
                              </span>
                              <span className="text-[10px] font-bold text-zinc-400">
                                {isDuration ? '⏱ Isometria / Tempo' : '🔁 Repetições'}
                              </span>
                            </div>
                            <h4 className="text-xs font-black text-white mt-1 leading-snug">
                              {ex.title}
                            </h4>
                            {ex.notes && (
                              <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                                {ex.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveExercise(exIdx, 'up')}
                            disabled={exIdx === 0}
                            className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-30 rounded-lg"
                            title="Mover para cima"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveExercise(exIdx, 'down')}
                            disabled={exIdx === exercises.length - 1}
                            className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-30 rounded-lg"
                            title="Mover para baixo"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveExercise(exIdx)}
                            className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg"
                            title="Remover exercício"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Configuração de Séries e Métrica */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#27272a] text-xs">
                        {/* Séries */}
                        <div className="flex items-center gap-1.5 bg-[#121214] px-2.5 py-1.5 rounded-xl border border-[#27272a]">
                          <span className="text-[10px] text-zinc-400 font-bold uppercase">Séries:</span>
                          <button
                            type="button"
                            onClick={() => handleAdjustSetsCount(exIdx, -1)}
                            className="w-5 h-5 rounded-md bg-zinc-800 text-white font-black flex items-center justify-center hover:bg-zinc-700"
                          >
                            -
                          </button>
                          <span className="font-black text-xs px-1 text-white tabular-nums">
                            {ex.sets.length}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAdjustSetsCount(exIdx, 1)}
                            className="w-5 h-5 rounded-md bg-zinc-800 text-white font-black flex items-center justify-center hover:bg-zinc-700"
                          >
                            +
                          </button>
                        </div>

                        {/* Métrica: Duração (segundos) ou Repetições */}
                        <div className="flex items-center gap-1.5 bg-[#121214] px-2.5 py-1.5 rounded-xl border border-[#27272a]">
                          <span className="text-[10px] text-zinc-400 font-bold uppercase">
                            {isDuration ? 'Duração:' : 'Reps:'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAdjustTargetMetric(exIdx, isDuration ? -15 : -1)}
                            className="w-5 h-5 rounded-md bg-zinc-800 text-white font-black flex items-center justify-center hover:bg-zinc-700"
                          >
                            -
                          </button>
                          <span className="font-black text-xs px-1 text-white tabular-nums">
                            {currentMetric}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAdjustTargetMetric(exIdx, isDuration ? 15 : 1)}
                            className="w-5 h-5 rounded-md bg-zinc-800 text-white font-black flex items-center justify-center hover:bg-zinc-700"
                          >
                            +
                          </button>
                        </div>

                        {/* Botão Ver Demonstração 3D / Execução */}
                        {tpl && (
                          <button
                            type="button"
                            onClick={() => setPreviewTemplate(tpl)}
                            className="px-2.5 py-1.5 bg-[#222226] hover:bg-[#2b2b30] text-zinc-300 hover:text-white rounded-xl font-bold text-[11px] flex items-center gap-1 transition"
                            title="Ver demonstração visual"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Rodapé com Botões de Ação */}
        <div className="pt-3 border-t border-[#27272a] flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-[#18181b] hover:bg-[#222226] text-zinc-300 font-bold text-xs rounded-2xl transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl active:scale-95 transition flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Salvar Plano</span>
          </button>
        </div>
      </div>

      {/* MODAL SELETOR DE EXERCÍCIOS DE FISIOTERAPIA */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150 text-white select-none">
          <div className="w-full max-w-lg bg-[#141416] border border-[#27272a] rounded-3xl p-5 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                  Biblioteca de Fisioterapia
                </span>
                <h3 className="text-sm font-black text-white">Escolha os Exercícios Clínicos</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Busca & Filtros */}
            <div className="py-3 space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Buscar exercício terapêutico (ex: perna em L, ciático, lombar)..."
                  className="w-full pl-9 pr-3 py-2 bg-[#18181b] border border-[#27272a] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {REGION_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setPickerRegion(tab.value)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition border ${
                      pickerRegion === tab.value
                        ? 'bg-white text-black border-white shadow-sm'
                        : 'bg-[#18181b] text-zinc-400 border-[#27272a] hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista dos Exercícios para Selecionar com Miniatura 3D */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredPickerExercises.map((ex) => {
                const thumbUrl = ex.gif_id
                  ? `https://cdn.jsdelivr.net/gh/omercotkd/exercises-gifs@main/assets/${ex.gif_id}.gif`
                  : ex.gif_url || null;

                return (
                  <div
                    key={ex.id}
                    onClick={() => handleSelectPhysioExercise(ex)}
                    className="p-3 bg-[#18181b] hover:bg-[#202024] border border-[#27272a] rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-white border border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center">
                        {thumbUrl ? (
                          <img
                            src={thumbUrl}
                            alt={ex.title}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover pointer-events-none select-none"
                          />
                        ) : (
                          <Activity className="w-4 h-4 text-zinc-700" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-emerald-400">
                            {ex.region_label}
                          </span>
                          <span className="text-[10px] font-bold text-zinc-400">
                            {ex.execution_type === 'duration'
                              ? `⏱ ${ex.default_duration_seconds}s • ${ex.default_sets} séries`
                              : `🔁 ${ex.default_reps} reps • ${ex.default_sets} séries`}
                          </span>
                        </div>
                        <h4 className="text-xs font-black text-white mt-1 leading-snug">{ex.title}</h4>
                        <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                          {ex.clinical_objective}
                        </p>
                      </div>
                    </div>

                    <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center shrink-0 shadow">
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </div>
                  </div>
                );
              })}

              {filteredPickerExercises.length === 0 && (
                <div className="p-8 text-center text-xs text-zinc-400">
                  Nenhum exercício encontrado para essa busca.
                </div>
              )}
            </div>
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
          <div className="w-full max-w-md bg-[#121214] border border-[#27272a] rounded-t-3xl sm:rounded-2xl p-4 shadow-2xl space-y-3 text-white">
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
    </div>
  );
};
