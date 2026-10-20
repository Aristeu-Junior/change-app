import React, { useState, lazy, Suspense } from 'react';
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
  const { theme, isAuthenticated } = useApp();
  const [currentTab, setCurrentTab] = useState<TabType>('routines');

  // Exige autenticação na tela de login estilo Hevy antes de exibir os treinos
  if (!isAuthenticated) {
    return <AuthLoginScreen />;
  }

  const isLight = theme === 'light';

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
