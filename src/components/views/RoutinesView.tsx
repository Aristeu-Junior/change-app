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
  Copy
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Routine } from '../../types';
import { RoutineEditorModal } from './RoutineEditorModal';

export const RoutinesView: React.FC = () => {
  const { routines, folders, startWorkout, deleteRoutine, saveRoutine } = useApp();

  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeMenuRoutineId, setActiveMenuRoutineId] = useState<string | null>(null);

  const handleStartRoutine = (routineId: string) => {
    startWorkout(routineId);
  };

  const handleDuplicateRoutine = (routine: Routine) => {
    const dup: Routine = {
      ...routine,
      id: `routine-${Date.now()}`,
      title: `${routine.title} (Copy)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    saveRoutine(dup);
    setActiveMenuRoutineId(null);
  };

  // Group routines by folder
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
      className="bg-[#131720] border border-[#242c3d] rounded-2xl p-4 shadow-md flex flex-col gap-3 relative transition hover:border-slate-700"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-bold text-white hover:text-[#008cff] transition">
            {r.title}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
            {r.exercises.map((e) => e.title).join(', ') || 'No exercises'}
          </p>
        </div>

        {/* 3-dots Menu */}
        <div className="relative">
          <button
            onClick={() =>
              setActiveMenuRoutineId(activeMenuRoutineId === r.id ? null : r.id)
            }
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {activeMenuRoutineId === r.id && (
            <div className="absolute right-0 top-8 z-30 w-36 bg-[#1a202c] border border-[#242c3d] rounded-xl shadow-xl py-1 text-xs text-slate-300 animate-in fade-in duration-100">
              <button
                onClick={() => {
                  setEditingRoutine(r);
                  setIsEditorOpen(true);
                  setActiveMenuRoutineId(null);
                }}
                className="w-full px-3 py-2 text-left hover:bg-slate-800 flex items-center gap-2"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
              <button
                onClick={() => handleDuplicateRoutine(r)}
                className="w-full px-3 py-2 text-left hover:bg-slate-800 flex items-center gap-2"
              >
                <Copy className="w-3.5 h-3.5" /> Duplicate
              </button>
              <button
                onClick={() => {
                  deleteRoutine(r.id);
                  setActiveMenuRoutineId(null);
                }}
                className="w-full px-3 py-2 text-left hover:bg-red-500/20 text-red-400 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Routine Footer & Start Button */}
      <div className="flex items-center justify-between pt-2 border-t border-[#242c3d]">
        <span className="text-[11px] text-slate-500 font-semibold">
          {r.exercises.length} {r.exercises.length === 1 ? 'Exercise' : 'Exercises'}
        </span>
        <button
          onClick={() => handleStartRoutine(r.id)}
          className="px-4 py-2 bg-[#008cff] hover:bg-[#0077db] text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 shadow-md shadow-[#008cff]/20 active:scale-95 transition"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          Start
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-28 space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Workouts</h1>
          <p className="text-xs text-slate-400">Choose a routine or start empty</p>
        </div>
        <button
          onClick={() => {
            setEditingRoutine(null);
            setIsEditorOpen(true);
          }}
          className="p-2.5 bg-[#131720] hover:bg-[#1a202c] border border-[#242c3d] text-[#008cff] rounded-xl flex items-center gap-1.5 text-xs font-bold transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Routine</span>
        </button>
      </div>

      {/* Quick Start Empty Workout Hero Button */}
      <button
        onClick={() => startWorkout(undefined, 'Quick Workout')}
        className="w-full p-4 bg-gradient-to-r from-[#008cff] to-[#0060b0] hover:brightness-110 text-white rounded-2xl shadow-xl shadow-[#008cff]/25 flex items-center justify-between active:scale-98 transition group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Plus className="w-6 h-6 stroke-[3]" />
          </div>
          <div className="text-left">
            <span className="text-base font-black block">Start Empty Workout</span>
            <span className="text-xs text-white/80">Log exercises on the fly</span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-white/70 group-hover:translate-x-1 transition" />
      </button>

      {/* Folders & Routines */}
      <div className="space-y-6">
        {/* Render Folders */}
        {folders.map((f) => {
          const list = routinesByFolder[f.id] || [];
          return (
            <div key={f.id} className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
                <Folder className="w-4 h-4 text-[#008cff]" />
                <span>{f.title}</span>
                <span className="text-xs text-slate-500 font-normal">({list.length})</span>
              </div>
              <div className="space-y-3">
                {list.length === 0 ? (
                  <p className="text-xs text-slate-500 italic pl-6">No routines in this folder</p>
                ) : (
                  list.map(renderRoutineCard)
                )}
              </div>
            </div>
          );
        })}

        {/* Uncategorized Routines */}
        {uncategorized.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
              <Dumbbell className="w-4 h-4 text-[#008cff]" />
              <span>My Routines</span>
              <span className="text-xs text-slate-500 font-normal">({uncategorized.length})</span>
            </div>
            <div className="space-y-3">{uncategorized.map(renderRoutineCard)}</div>
          </div>
        )}
      </div>

      {/* Routine Editor Modal */}
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
