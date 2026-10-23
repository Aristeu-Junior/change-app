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
import { formatDuration, triggerHaptic } from '../utils/calc';
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
              <div
                className={`w-9 h-9 rounded-xl font-black flex items-center justify-center shadow-md border shrink-0 ${
                  isLight ? 'bg-black text-white border-black' : 'bg-white text-black border-zinc-300'
                }`}
              >
                <Dumbbell className={`w-5 h-5 stroke-[2.5] ${isLight ? 'text-white' : 'text-black'}`} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-base font-black tracking-widest ${isLight ? 'text-black' : 'text-white'}`}>
                    CHANGE
                  </span>
                  {cloudStatus === 'synced' && (
                    <span
                      title="Sincronizado na nuvem"
                      className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        isLight ? 'bg-zinc-200 text-zinc-800' : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      <Cloud className="w-2.5 h-2.5" /> Nuvem
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-semibold block ${isLight ? 'text-zinc-500' : 'text-zinc-500'}`}>
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
                      ? isLight
                        ? 'bg-black text-white font-black shadow-md'
                        : 'bg-white text-black font-black shadow-md'
                      : isLight
                      ? 'text-zinc-600 hover:text-black hover:bg-zinc-100'
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
                className={`w-full p-3.5 rounded-2xl shadow-xl flex flex-col gap-2 text-left transition hover:opacity-95 border ${
                  isLight
                    ? 'bg-zinc-900 text-white border-zinc-700'
                    : 'bg-white text-black border-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1 ${
                      isLight ? 'bg-white text-black' : 'bg-black text-white'
                    }`}
                  >
                    <Play className={`w-2.5 h-2.5 ${isLight ? 'fill-black' : 'fill-white'}`} /> Ao Vivo
                  </span>
                  <span className="text-xs font-black flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDuration(elapsed)}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-black block truncate">{activeWorkout.title}</span>
                  <span className={`text-[10px] font-bold ${isLight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Clique para retomar o treino →
                  </span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Rodapé da Sidebar: Conta Ativa + Alternador de Tema */}
        <div className={`space-y-2.5 pt-4 border-t ${isLight ? 'border-zinc-200' : 'border-[#27272a]'}`}>
          <button
            onClick={() => setIsAccountModalOpen(true)}
            className={`w-full p-2.5 rounded-xl border flex items-center justify-between gap-2 transition text-left ${
              isLight
                ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-black'
                : 'bg-[#141416] hover:bg-[#1c1c1f] border-[#27272a] text-white'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded-full font-black flex items-center justify-center text-xs shrink-0 ${
                  isLight ? 'bg-black text-white' : 'bg-white text-black'
                }`}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-black truncate ${isLight ? 'text-black' : 'text-white'}`}>
                    {currentUser.name}
                  </span>
                  {isCurrentUserAdmin && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase shrink-0 ${
                        isLight ? 'bg-black text-white' : 'bg-white text-black'
                      }`}
                    >
                      Admin
                    </span>
                  )}
                </div>
                <span className={`text-[10px] truncate block ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {currentUser.email}
                </span>
              </div>
            </div>
            <Users className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`} />
          </button>

          <button
            onClick={toggleTheme}
            className={`w-full py-2.5 px-3 border rounded-xl transition flex items-center justify-between text-xs font-bold ${
              isLight
                ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-black'
                : 'bg-[#141416] hover:bg-[#1c1c1f] border-[#27272a] text-white'
            }`}
          >
            <span className={isLight ? 'text-zinc-600' : 'text-zinc-400'}>Aparência</span>
            <span className={`flex items-center gap-1.5 font-black ${isLight ? 'text-black' : 'text-white'}`}>
              {isLight ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-black" /> Modo Escuro
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-white" /> Modo Claro
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

  const handleTabClick = (e: React.SyntheticEvent, tab: TabType) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onSelectTab(tab);
    try {
      triggerHaptic(10);
    } catch {
      // Ignore vibration errors
    }
  };

  return (
    <div className="md:hidden fixed inset-x-0 bottom-0 z-50 pointer-events-none select-none">
      {/* Pílula Flutuante de Treino Ativo (quando minimizado) */}
      {activeWorkout && !isWorkoutModalOpen && (
        <div
          className="px-3.5 w-full max-w-md mx-auto pointer-events-auto animate-in slide-in-from-bottom duration-200"
          style={{ marginBottom: 'max(76px, calc(var(--safe-bottom) + 68px))' }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setWorkoutModalOpen(true);
              try { triggerHaptic(15); } catch {}
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              setWorkoutModalOpen(true);
              try { triggerHaptic(15); } catch {}
            }}
            style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
            className={`w-full p-3 cursor-pointer pointer-events-auto ${
              isLight
                ? 'bg-black text-white shadow-[0_12px_32px_rgba(0,0,0,0.25)] border border-black/10'
                : 'bg-white text-black shadow-[0_12px_32px_rgba(0,0,0,0.75)] border border-white/20'
            } rounded-2xl flex items-center justify-between active:scale-[0.98] transition-all group`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded-xl shrink-0 ${
                  isLight ? 'bg-white text-black' : 'bg-black text-white'
                } flex items-center justify-center animate-pulse`}
              >
                <Play className={`w-3.5 h-3.5 ${isLight ? 'fill-black' : 'fill-white'}`} />
              </div>
              <div className="text-left min-w-0">
                <span className="text-xs font-black block truncate leading-tight">{activeWorkout.title}</span>
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
              className={`flex items-center gap-1 text-[11px] font-black shrink-0 ${
                isLight ? 'bg-white text-black' : 'bg-black text-white'
              } px-3 py-1.5 rounded-lg shadow-sm`}
            >
              <span>Continuar</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      )}

      {/* Dock Flutuante iPhone / iOS Liquid Glass com Efeito Vidro Líquido */}
      <div
        className="px-3.5 w-full max-w-md mx-auto pointer-events-auto"
        style={{
          paddingBottom: 'max(10px, var(--safe-bottom))'
        }}
      >
        <nav
          className={`w-full p-1.5 rounded-[28px] transition-all duration-300 grid grid-cols-5 gap-1 items-center pointer-events-auto ${
            isLight
              ? 'bg-white/75 border border-black/[0.08] text-black shadow-[0_14px_36px_-6px_rgba(0,0,0,0.12),inset_0_1px_1.5px_0_rgba(255,255,255,0.95)]'
              : 'bg-[#0c0d12]/75 border border-white/[0.12] text-white shadow-[0_16px_40px_-6px_rgba(0,0,0,0.75),inset_0_1px_1.5px_0_rgba(255,255,255,0.18)]'
          } backdrop-blur-2xl backdrop-saturate-200`}
          style={{
            WebkitBackdropFilter: 'blur(24px) saturate(200%)'
          }}
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={(e) => handleTabClick(e, item.id)}
                onTouchEnd={(e) => handleTabClick(e, item.id)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-200 select-none active:scale-95 cursor-pointer pointer-events-auto ${
                  isActive
                    ? isLight
                      ? 'bg-black/[0.08] text-black font-black shadow-sm ring-1 ring-black/5'
                      : 'bg-white/[0.12] text-white font-black shadow-sm ring-1 ring-white/10'
                    : isLight
                    ? 'text-zinc-500 hover:text-black font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 font-semibold'
                }`}
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation'
                }}
              >
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[2]'
                  }`}
                />
                <span className="text-[10px] tracking-tight mt-0.5 leading-none">
                  {item.label}
                </span>
                {isActive && (
                  <span
                    className={`w-1 h-1 rounded-full mt-1 ${
                      isLight
                        ? 'bg-black shadow-[0_0_6px_rgba(0,0,0,0.4)]'
                        : 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
