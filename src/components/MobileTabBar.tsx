import React, { useState, useEffect } from 'react';
import {
  Dumbbell,
  List,
  History,
  Trophy,
  User,
  Clock,
  ChevronRight,
  Play,
  Sun,
  Moon,
  Cloud,
  Users
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDuration } from '../utils/calc';
import { UserAccountModal } from './UserAccountModal';

export type TabType = 'routines' | 'exercises' | 'history' | 'analytics' | 'settings';

interface NavigationProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

const NAV_ITEMS: { id: TabType; label: string; desktopLabel: string; icon: React.FC<any> }[] = [
  { id: 'routines', label: 'Planos', desktopLabel: 'Planos de Treino', icon: Dumbbell },
  { id: 'exercises', label: 'Exercícios', desktopLabel: 'Biblioteca de Exercícios', icon: List },
  { id: 'history', label: 'Histórico', desktopLabel: 'Histórico de Treinos', icon: History },
  { id: 'analytics', label: 'Rank', desktopLabel: 'Rank & Competição', icon: Trophy },
  { id: 'settings', label: 'Perfil', desktopLabel: 'Perfil & Ajustes', icon: User }
];

export const DesktopSidebar: React.FC<NavigationProps> = ({ currentTab, onSelectTab }) => {
  const {
    activeWorkout,
    isWorkoutModalOpen,
    setWorkoutModalOpen,
    theme,
    toggleTheme,
    currentUser,
    isCurrentUserAdmin,
    cloudStatus
  } = useApp();
  const [elapsed, setElapsed] = useState(0);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  useEffect(() => {
    if (!activeWorkout) return;
    const start = new Date(activeWorkout.start_time).getTime();
    const update = () => setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [activeWorkout]);

  const isLight = theme === 'light';

  return (
    <>
      <aside
        className={`hidden md:flex md:w-64 lg:w-72 shrink-0 flex-col justify-between border-r sticky top-0 h-dvh p-5 select-none transition-colors ${
          isLight ? 'bg-white border-zinc-200 text-black' : 'bg-[#09090b] border-[#27272a] text-white'
        }`}
      >
        {/* Topo: Marca CHANGE + Navegação */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white text-black font-black flex items-center justify-center shadow-md border border-zinc-300 shrink-0">
                <Dumbbell className="w-5 h-5 stroke-[2.5] text-black" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-black tracking-widest text-white">CHANGE</span>
                  {cloudStatus === 'synced' && (
                    <span
                      title="Sincronizado na nuvem"
                      className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300"
                    >
                      <Cloud className="w-2.5 h-2.5" /> Nuvem
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-zinc-500 font-semibold block">
                  Performance & Ranking
                </span>
              </div>
            </div>
          </div>

          {/* Menu Principal Desktop */}
          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-white text-black font-black shadow-md'
                      : 'text-zinc-400 hover:text-white hover:bg-[#141416]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 stroke-[2.3]" />
                    <span>{item.desktopLabel}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </nav>

          {/* Card de Treino em Andamento na Barra Lateral */}
          {activeWorkout && !isWorkoutModalOpen && (
            <div className="pt-2">
              <button
                onClick={() => setWorkoutModalOpen(true)}
                className="w-full p-3.5 bg-white text-black rounded-2xl shadow-xl flex flex-col gap-2 text-left transition hover:opacity-95 border border-zinc-200"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-black text-white flex items-center gap-1">
                    <Play className="w-2.5 h-2.5 fill-white" /> Ao Vivo
                  </span>
                  <span className="text-xs font-black flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDuration(elapsed)}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-black block truncate">{activeWorkout.title}</span>
                  <span className="text-[10px] text-zinc-600 font-bold">
                    Clique para retomar o treino →
                  </span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Rodapé da Sidebar: Conta Ativa + Alternador de Tema */}
        <div className="space-y-2.5 pt-4 border-t border-[#27272a]">
          <button
            onClick={() => setIsAccountModalOpen(true)}
            className="w-full p-2.5 rounded-xl bg-[#141416] hover:bg-[#1c1c1f] border border-[#27272a] flex items-center justify-between gap-2 transition text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-white text-black font-black flex items-center justify-center text-xs shrink-0">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-white truncate">{currentUser.name}</span>
                  {isCurrentUserAdmin && (
                    <span className="px-1.5 py-0.5 rounded bg-white text-black text-[8px] font-black uppercase shrink-0">
                      Admin
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-zinc-400 truncate block">{currentUser.email}</span>
              </div>
            </div>
            <Users className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          </button>

          <button
            onClick={toggleTheme}
            className="w-full py-2.5 px-3 bg-[#141416] hover:bg-[#1c1c1f] border border-[#27272a] rounded-xl text-white transition flex items-center justify-between text-xs font-bold"
          >
            <span className="text-zinc-400">Aparência</span>
            <span className="flex items-center gap-1.5 font-black text-white">
              {isLight ? (
                <>
                  <Moon className="w-3.5 h-3.5" /> Modo Escuro
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5" /> Modo Claro
                </>
              )}
            </span>
          </button>
        </div>
      </aside>

      <UserAccountModal isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)} />
    </>
  );
};

export const MobileTabBar: React.FC<NavigationProps> = ({ currentTab, onSelectTab }) => {
  const { activeWorkout, isWorkoutModalOpen, setWorkoutModalOpen, theme } = useApp();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!activeWorkout) return;
    const start = new Date(activeWorkout.start_time).getTime();
    const update = () => setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [activeWorkout]);

  const isLight = theme === 'light';

  const tabClass = (tab: TabType) => {
    const isActive = currentTab === tab;
    if (isActive) {
      return isLight ? 'text-black font-extrabold scale-105' : 'text-white font-extrabold scale-105';
    }
    return isLight ? 'text-zinc-400 hover:text-zinc-600' : 'text-zinc-500 hover:text-zinc-300';
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex flex-col pointer-events-none">
      {/* Pílula Flutuante de Treino Ativo (quando minimizado) */}
      {activeWorkout && !isWorkoutModalOpen && (
        <div className="px-4 pb-2 w-full max-w-md mx-auto pointer-events-auto animate-in slide-in-from-bottom duration-150">
          <button
            onClick={() => setWorkoutModalOpen(true)}
            className={`w-full p-3.5 ${
              isLight ? 'bg-black text-white' : 'bg-white text-black'
            } rounded-2xl shadow-2xl flex items-center justify-between active:scale-98 transition group border border-zinc-200/20`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded-xl shrink-0 ${
                  isLight ? 'bg-white text-black' : 'bg-black text-white'
                } flex items-center justify-center animate-pulse`}
              >
                <Play className={`w-4 h-4 ${isLight ? 'fill-black' : 'fill-white'}`} />
              </div>
              <div className="text-left min-w-0">
                <span className="text-xs font-black block truncate">{activeWorkout.title}</span>
                <span
                  className={`text-[10px] ${
                    isLight ? 'text-zinc-300' : 'text-zinc-600'
                  } flex items-center gap-1 font-bold`}
                >
                  <Clock className="w-3 h-3" />
                  {formatDuration(elapsed)}
                </span>
              </div>
            </div>

            <div
              className={`flex items-center gap-1 text-xs font-extrabold shrink-0 ${
                isLight ? 'bg-white text-black' : 'bg-black text-white'
              } px-3 py-1.5 rounded-lg shadow-sm`}
            >
              <span>Continuar</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      )}

      {/* Barra de Navegação Inferior Intuitiva (com pb-safe para barra de início do iPhone/Android) */}
      <nav
        className={`w-full ${
          isLight ? 'bg-white/95 border-zinc-200' : 'bg-[#000000]/95 border-[#27272a]'
        } backdrop-blur-md border-t px-2 pt-2 pb-safe pointer-events-auto flex items-center justify-around shadow-2xl transition-colors`}
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${tabClass(
                item.id
              )}`}
            >
              <Icon className="w-5 h-5 stroke-[2.3]" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
              {currentTab === item.id && (
                <span className={`w-1 h-1 rounded-full ${isLight ? 'bg-black' : 'bg-white'}`} />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
