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
  AlertTriangle,
  Sun,
  Moon,
  Users,
  FolderPlus,
  Cloud
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Routine } from '../../types';
import { RoutineEditorModal } from './RoutineEditorModal';
import { UserAccountModal } from '../UserAccountModal';

export const RoutinesView: React.FC = () => {
  const {
    routines,
    folders,
    startWorkout,
    deleteRoutine,
    saveRoutine,
    deleteFolder,
    createFolder,
    currentUser,
    isCurrentUserAdmin,
    cloudStatus,
    theme,
    toggleTheme
  } = useApp();

  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeMenuRoutineId, setActiveMenuRoutineId] = useState<string | null>(null);
  const [routineToDelete, setRoutineToDelete] = useState<Routine | null>(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderTitle, setNewFolderTitle] = useState('');

  const isLight = theme === 'light';

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

  const handleCreateNewFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderTitle.trim()) return;
    createFolder(newFolderTitle.trim());
    setNewFolderTitle('');
    setIsCreatingFolder(false);
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

        {/* Menu de Opções (Editar, Duplicar, Excluir) */}
        <div className="relative">
          <button
            onClick={() =>
              setActiveMenuRoutineId(activeMenuRoutineId === r.id ? null : r.id)
            }
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
            title="Mais opções do plano"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {activeMenuRoutineId === r.id && (
            <div className="absolute right-0 top-8 z-30 w-44 bg-[#1c1c1f] border border-[#3f3f46] rounded-xl shadow-2xl py-1 text-xs text-zinc-200 animate-in fade-in duration-100">
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
              <div className="h-px bg-[#27272a] my-1" />
              <button
                onClick={() => {
                  setRoutineToDelete(r);
                  setActiveMenuRoutineId(null);
                }}
                className="w-full px-3 py-2 text-left text-red-400 hover:bg-red-950/40 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" /> Excluir Plano
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Rodapé do Card com Botão Iniciar e Editar Rápido */}
      <div className="flex items-center justify-between pt-2 border-t border-[#27272a]">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-500 font-semibold">
            {r.exercises.length} {r.exercises.length === 1 ? 'Exercício' : 'Exercícios'}
          </span>
          <button
            onClick={() => {
              setEditingRoutine(r);
              setIsEditorOpen(true);
            }}
            className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 font-semibold underline"
          >
            <Edit2 className="w-3 h-3" /> Editar
          </button>
        </div>

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
    <div className="flex flex-col min-h-full px-4 pt-3 pb-28 space-y-4 text-white">
      {/* Topo Superior: Marca CHANGE, Perfil Ativo e Botão Modo Claro/Escuro */}
      <div className="flex items-center justify-between pt-1 pb-1">
        <div className="flex items-center gap-2.5">
          {/* Logo CHANGE com haltere */}
          <div className="w-8 h-8 rounded-xl bg-white text-black font-black flex items-center justify-center text-xs shadow-md relative">
            <Dumbbell className="w-4 h-4 stroke-[2.5] text-black" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-black tracking-wider text-white">CHANGE</h1>
              {cloudStatus === 'synced' && (
                <span
                  title="Sincronizado na nuvem"
                  className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300"
                >
                  <Cloud className="w-2.5 h-2.5" /> Nuvem
                </span>
              )}
            </div>
            <button
              onClick={() => setIsAccountModalOpen(true)}
              className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition"
            >
              <span>
                Conta: <strong>{currentUser.name}</strong>{' '}
                {isCurrentUserAdmin ? '(Admin • Cadastrar)' : '(Minha Conta)'}
              </span>
              <Users className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Botão de Alternância de Tema P&B (Sol / Lua) */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] rounded-xl text-white transition active:scale-95 flex items-center gap-1.5 text-xs font-bold"
            title="Alternar entre Modo Escuro e Claro"
          >
            {isLight ? (
              <>
                <Moon className="w-4 h-4 fill-white" />
                <span className="text-[11px]">Escuro</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 fill-white text-white" />
                <span className="text-[11px]">Claro</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* BOTÃO HERO: MONTAR NOVO PLANO DE TREINO (Ação Primária em Destaque) */}
      <div className="grid grid-cols-1 gap-2.5">
        <button
          onClick={() => {
            setEditingRoutine(null);
            setIsEditorOpen(true);
          }}
          className="w-full p-4 bg-white text-black rounded-2xl shadow-xl flex items-center justify-between active:scale-98 transition group border border-zinc-200"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shadow-md">
              <Plus className="w-6 h-6 stroke-[3] text-white" />
            </div>
            <div className="text-left">
              <span className="text-sm font-black block">Montar Novo Plano de Treino</span>
              <span className="text-xs text-zinc-700">
                Use uma sugestão conhecida ou monte seu treino do zero
              </span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-zinc-800 group-hover:translate-x-1 transition" />
        </button>

        {/* Treino Livre Rápido (Secundário) */}
        <button
          onClick={() => startWorkout(undefined, 'Treino Livre')}
          className="w-full py-2.5 px-3.5 bg-[#141416] hover:bg-[#1a1a1d] border border-[#27272a] rounded-xl flex items-center justify-between text-xs font-bold transition active:scale-98"
        >
          <div className="flex items-center gap-2 text-zinc-300">
            <Dumbbell className="w-4 h-4 text-white" />
            <span>Iniciar Treino Vazio Rápido</span>
          </div>
          <span className="text-[11px] text-zinc-500">Sem plano prévio →</span>
        </button>
      </div>

      {/* Divisões e Planos do Usuário */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-zinc-400">
            Seus Planos de Treino ({routines.length})
          </span>
          <button
            onClick={() => setIsCreatingFolder(!isCreatingFolder)}
            className="text-xs font-bold text-white hover:underline flex items-center gap-1"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>+ Nova Pasta</span>
          </button>
        </div>

        {/* Formulário de Nova Pasta */}
        {isCreatingFolder && (
          <form
            onSubmit={handleCreateNewFolder}
            className="p-3 bg-[#18181b] border border-[#27272a] rounded-xl flex items-center gap-2 animate-in fade-in duration-100"
          >
            <input
              type="text"
              value={newFolderTitle}
              onChange={(e) => setNewFolderTitle(e.target.value)}
              placeholder="Nome da pasta (Ex: Meus Treinos)"
              className="flex-1 bg-[#121214] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
              autoFocus
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-white text-black font-bold text-xs rounded-lg active:scale-95 transition"
            >
              Criar
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingFolder(false)}
              className="px-2 py-1.5 text-zinc-400 text-xs hover:text-white"
            >
              Cancelar
            </button>
          </form>
        )}

        {/* Estado Vazio Limpo na Primeira Tela */}
        {routines.length === 0 && folders.length === 0 && (
          <div className="bg-[#141416] border border-dashed border-[#27272a] rounded-2xl p-6 text-center space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-[#18181b] border border-[#27272a] flex items-center justify-center mx-auto text-zinc-300">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-white">
                Nenhum plano de treino definido ainda
              </h3>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                Sua tela inicial está limpa para você definir exatamente quais treinos vai começar a fazer.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingRoutine(null);
                setIsEditorOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white text-black rounded-xl text-xs font-black transition active:scale-95 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Montar Meu Primeiro Treino</span>
            </button>
          </div>
        )}

        {/* Pastas */}
        {folders.map((f) => {
          const list = routinesByFolder[f.id] || [];
          return (
            <div key={f.id} className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-white" />
                  <span className="text-sm font-bold text-white">{f.title}</span>
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
              <div className="space-y-2.5">
                {list.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic pl-6">Nenhum plano nesta pasta ainda.</p>
                ) : (
                  list.map(renderRoutineCard)
                )}
              </div>
            </div>
          );
        })}

        {/* Planos Soltos (Sem pasta) */}
        {uncategorized.length > 0 && (
          <div className="space-y-2.5">
            {folders.length > 0 && (
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Dumbbell className="w-4 h-4 text-white" />
                <span>Planos Principais</span>
                <span className="text-xs text-zinc-500 font-normal">({uncategorized.length})</span>
              </div>
            )}
            <div className="space-y-2.5">{uncategorized.map(renderRoutineCard)}</div>
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

      {/* Modal de Troca / Cadastro de Usuários */}
      <UserAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
      />
    </div>
  );
};
