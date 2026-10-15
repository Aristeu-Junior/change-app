import React, { useState } from 'react';
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
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Routine } from '../../types';
import { RoutineEditorModal } from './RoutineEditorModal';

export const RoutinesView: React.FC = () => {
  const { routines, folders, startWorkout, deleteRoutine, saveRoutine, deleteFolder } = useApp();

  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeMenuRoutineId, setActiveMenuRoutineId] = useState<string | null>(null);
  const [routineToDelete, setRoutineToDelete] = useState<Routine | null>(null);

  const handleStartRoutine = (routineId: string) => {
    startWorkout(routineId);
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

  // Agrupamento por pasta
  const routinesByFolder: Record<string, Routine[]> = {};
  const uncategorized: Routine[] = [];

  routines.forEach((r) => {
    if (r.folder_id) {
      if (!routinesByFolder[r.folder_id]) routinesByFolder[r.folder_id] = [];
      routinesByFolder[r.folder_id].push(r);
    } else {
      uncategorized.push(r);
    }
  });

  const renderRoutineCard = (r: Routine) => (
    <div
      key={r.id}
      className="bg-[#141416] border border-[#27272a] rounded-2xl p-4 shadow-md flex flex-col gap-3 relative transition hover:border-zinc-500 text-white"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold text-white hover:text-zinc-300 transition">
            {r.title}
          </h3>
          <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
            {r.exercises.map((e) => e.title).join(', ') || 'Nenhum exercício adicionado'}
          </p>
        </div>

        {/* Menu de 3 pontinhos */}
        <div className="relative">
          <button
            onClick={() =>
              setActiveMenuRoutineId(activeMenuRoutineId === r.id ? null : r.id)
            }
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {activeMenuRoutineId === r.id && (
            <div className="absolute right-0 top-8 z-30 w-40 bg-[#1c1c1f] border border-[#3f3f46] rounded-xl shadow-2xl py-1 text-xs text-zinc-200 animate-in fade-in duration-100">
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
              <button
                onClick={() => {
                  setRoutineToDelete(r);
                  setActiveMenuRoutineId(null);
                }}
                className="w-full px-3 py-2 text-left hover:bg-red-500/20 text-red-400 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" /> Excluir Plano
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Rodapé do Card com Botão Iniciar */}
      <div className="flex items-center justify-between pt-2 border-t border-[#27272a]">
        <span className="text-[11px] text-zinc-500 font-semibold">
          {r.exercises.length} {r.exercises.length === 1 ? 'Exercício' : 'Exercícios'}
        </span>
        <button
          onClick={() => handleStartRoutine(r.id)}
          className="px-4 py-2 bg-white text-black font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition"
        >
          <Play className="w-3 h-3 fill-black" />
          Iniciar
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-28 space-y-5 text-white">
      {/* Topo */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Treinos</h1>
          <p className="text-xs text-zinc-400">Planos de treino montados & divisões</p>
        </div>
        <button
          onClick={() => {
            setEditingRoutine(null);
            setIsEditorOpen(true);
          }}
          className="p-2.5 bg-[#141416] hover:bg-[#1e1e24] border border-[#27272a] text-white rounded-xl flex items-center gap-1.5 text-xs font-bold transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Plano</span>
        </button>
      </div>

      {/* Botão Hero Treino Livre Rápido */}
      <button
        onClick={() => startWorkout(undefined, 'Treino Livre')}
        className="w-full p-4 bg-white text-black rounded-2xl shadow-xl flex items-center justify-between active:scale-98 transition group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-black/10 flex items-center justify-center">
            <Plus className="w-6 h-6 stroke-[3] text-black" />
          </div>
          <div className="text-left">
            <span className="text-sm font-black block">Iniciar Treino Vazio</span>
            <span className="text-xs text-zinc-700">Adicione exercícios na hora</span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:translate-x-1 transition" />
      </button>

      {/* Pastas & Rotinas */}
      <div className="space-y-6">
        {/* Pastas */}
        {folders.map((f) => {
          const list = routinesByFolder[f.id] || [];
          return (
            <div key={f.id} className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-white" />
                  <span className="text-sm text-white">{f.title}</span>
                  <span className="text-xs text-zinc-500 font-normal">({list.length})</span>
                </div>
                <button
                  onClick={() => deleteFolder(f.id)}
                  className="text-zinc-500 hover:text-red-400 p-1"
                  title="Excluir Pasta"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-3">
                {list.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic pl-6">Nenhum plano nesta pasta ainda</p>
                ) : (
                  list.map(renderRoutineCard)
                )}
              </div>
            </div>
          );
        })}

        {/* Planos Soltos */}
        {uncategorized.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Dumbbell className="w-4 h-4 text-white" />
              <span>Meus Planos</span>
              <span className="text-xs text-zinc-500 font-normal">({uncategorized.length})</span>
            </div>
            <div className="space-y-3">{uncategorized.map(renderRoutineCard)}</div>
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {routineToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
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

      {/* Modal Editor / Criador de Plano */}
      <RoutineEditorModal
        routineToEdit={editingRoutine}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingRoutine(null);
        }}
      />
    </div>
  );
};
