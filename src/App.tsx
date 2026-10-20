import React, { useState, lazy, Suspense } from 'react';
import { KeyRound, Copy, Check, X } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { MobileTabBar, DesktopSidebar, TabType } from './components/MobileTabBar';
import { AuthLoginScreen } from './components/AuthLoginScreen';

// Code-splitting de alta performance: carrega cada aba sob demanda
const RoutinesView = lazy(() => import('./components/views/RoutinesView').then(m => ({ default: m.RoutinesView })));
const ExercisesView = lazy(() => import('./components/views/ExercisesView').then(m => ({ default: m.ExercisesView })));
const HistoryView = lazy(() => import('./components/views/HistoryView').then(m => ({ default: m.HistoryView })));
const AnalyticsView = lazy(() => import('./components/views/AnalyticsView').then(m => ({ default: m.AnalyticsView })));
const SettingsView = lazy(() => import('./components/views/SettingsView').then(m => ({ default: m.SettingsView })));
const ActiveWorkoutModal = lazy(() => import('./components/ActiveWorkoutModal').then(m => ({ default: m.ActiveWorkoutModal })));
const WorkoutSummaryModal = lazy(() => import('./components/WorkoutSummaryModal').then(m => ({ default: m.WorkoutSummaryModal })));

const ViewLoadingFallback: React.FC = () => (
  <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] space-y-3">
    <div className="w-7 h-7 rounded-full border-2 border-zinc-700 border-t-white animate-spin" />
    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Carregando...</span>
  </div>
);

const AppContent: React.FC = () => {
  const {
    theme,
    isAuthenticated,
    recoveryPasswordNotice,
    clearRecoveryPasswordNotice,
    changeMyPassword
  } = useApp();
  const [currentTab, setCurrentTab] = useState<TabType>('routines');
  const [copiedNewPass, setCopiedNewPass] = useState(false);
  const [customNewPass, setCustomNewPass] = useState('');
  const [savedCustomPass, setSavedCustomPass] = useState(false);

  // Exige autenticação na tela de login estilo Hevy antes de exibir os treinos
  if (!isAuthenticated) {
    return <AuthLoginScreen />;
  }

  const isLight = theme === 'light';

  const handleCopyGeneratedPass = async () => {
    if (!recoveryPasswordNotice) return;
    try {
      await navigator.clipboard.writeText(recoveryPasswordNotice);
      setCopiedNewPass(true);
      setTimeout(() => setCopiedNewPass(false), 2000);
    } catch {
      // Ignore
    }
  };

  const handleSaveCustomRecoveryPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customNewPass.trim() || customNewPass.trim().length < 4) return;
    const ok = await changeMyPassword(customNewPass.trim());
    if (ok) {
      setSavedCustomPass(true);
      setTimeout(() => {
        setSavedCustomPass(false);
        setCustomNewPass('');
        clearRecoveryPasswordNotice();
      }, 1200);
    }
  };

  return (
    <div
      className={`w-full min-h-dvh ${
        isLight ? 'bg-white text-black' : 'bg-black text-white'
      } flex flex-col md:flex-row transition-colors duration-200`}
    >
      {/* Escudo de Safe-Area Superior no Celular (protege o relógio e bateria no modo Web App) */}
      <div className="safe-top-shield md:hidden" />

      {/* Barra Lateral Desktop (Computador / Notebook >= 768px) */}
      <DesktopSidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Área Principal (Full-width responsiva no Celular e Container amplo e limpo no Computador) */}
      <div className="flex-1 min-w-0 flex flex-col">
        <main className="flex-1 w-full max-w-4xl mx-auto overflow-x-hidden">
          <Suspense fallback={<ViewLoadingFallback />}>
            {currentTab === 'routines' && <RoutinesView />}
            {currentTab === 'exercises' && <ExercisesView />}
            {currentTab === 'history' && <HistoryView />}
            {currentTab === 'analytics' && <AnalyticsView />}
            {currentTab === 'settings' && <SettingsView />}
          </Suspense>
        </main>
      </div>

      {/* Barra Inferior Mobile (< 768px) */}
      <MobileTabBar currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Modal de Nova Senha Gerada via E-mail ("Esqueci minha senha") */}
      {recoveryPasswordNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200 text-white">
          <div className="w-full max-w-sm bg-[#121214] border border-[#27272a] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-white" />
                <h3 className="text-base font-black text-white">Sua Nova Senha foi Gerada!</h3>
              </div>
              <button
                onClick={clearRecoveryPasswordNotice}
                className="p-1 text-zinc-400 hover:text-white rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Seu acesso por e-mail foi confirmado e esta nova senha já está ativa na sua conta:
            </p>

            <div className="p-3.5 bg-[#18181b] border border-white/30 rounded-2xl flex items-center justify-between">
              <code className="text-base font-black tracking-wider text-white select-all">
                {recoveryPasswordNotice}
              </code>
              <button
                onClick={handleCopyGeneratedPass}
                className="px-3 py-1.5 bg-white text-black rounded-xl text-xs font-black flex items-center gap-1.5"
              >
                {copiedNewPass ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedNewPass ? 'Copiada!' : 'Copiar'}</span>
              </button>
            </div>

            <form onSubmit={handleSaveCustomRecoveryPass} className="space-y-2 pt-2 border-t border-[#27272a]">
              <label className="text-[11px] uppercase font-bold text-zinc-400 block">
                Ou escolha outra senha personalizada agora:
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={customNewPass}
                  onChange={(e) => setCustomNewPass(e.target.value)}
                  placeholder="Nova senha desejada..."
                  className="flex-1 bg-[#18181b] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-white text-black font-black text-xs rounded-xl shrink-0"
                >
                  {savedCustomPass ? 'Salva!' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modais Globais de Treino Ativo e Resumo */}
      <Suspense fallback={null}>
        <ActiveWorkoutModal />
        <WorkoutSummaryModal />
      </Suspense>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
