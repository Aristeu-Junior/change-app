import React, { useState, useEffect } from 'react';
import { KeyRound, Copy, Check, X, BellRing, UserCheck, UserX } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { MobileTabBar, DesktopSidebar, TabType } from './components/MobileTabBar';
import { AuthLoginScreen } from './components/AuthLoginScreen';
import { RoutinesView } from './components/views/RoutinesView';
import { ExercisesView } from './components/views/ExercisesView';
import { HistoryView } from './components/views/HistoryView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { SettingsView } from './components/views/SettingsView';
import { PhysiotherapyView } from './components/views/PhysiotherapyView';
import { ActiveWorkoutModal } from './components/ActiveWorkoutModal';
import { WorkoutSummaryModal } from './components/WorkoutSummaryModal';

const AppContent: React.FC = () => {
  const {
    theme,
    isAuthenticated,
    isCurrentUserAdmin,
    accessRequests,
    adminDecideAccessRequest,
    recoveryPasswordNotice,
    clearRecoveryPasswordNotice,
    changeMyPassword,
    canAccessPhysio
  } = useApp();
  const [currentTab, setCurrentTab] = useState<TabType>('routines');
  const [copiedNewPass, setCopiedNewPass] = useState(false);
  const [customNewPass, setCustomNewPass] = useState('');
  const [savedCustomPass, setSavedCustomPass] = useState(false);
  const [processingRequestEmail, setProcessingRequestEmail] = useState<string | null>(null);

  // Redireciona automaticamente para a aba de Competições se abrir via link de convite (#comp= ou ?comp=)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasComp =
        window.location.hash.includes('comp=') || window.location.search.includes('comp=');
      if (hasComp) {
        setCurrentTab('analytics');
      }
    }
  }, []);

  // Garante que se o usuário perder permissão enquanto na aba de fisioterapia, retorna para rotinas
  useEffect(() => {
    if (currentTab === 'physiotherapy' && !canAccessPhysio) {
      setCurrentTab('routines');
    }
  }, [currentTab, canAccessPhysio]);

  // Exige autenticação na tela de login estilo Hevy antes de exibir os treinos
  if (!isAuthenticated) {
    return <AuthLoginScreen />;
  }

  const isLight = theme === 'light';
  const pendingAccessRequests = isCurrentUserAdmin
    ? accessRequests.filter((r) => r.account_status === 'pending')
    : [];

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
        {/* Alerta em Tempo Real para o Administrador: Solicitações de Acesso Google Pendentes */}
        {isCurrentUserAdmin && pendingAccessRequests.length > 0 && (
          <div
            className="w-full max-w-4xl mx-auto px-4 pt-3 md:pt-5 space-y-2 z-30"
            style={{ marginTop: 'var(--safe-top, 0px)' }}
          >
            {pendingAccessRequests.map((req) => {
              const isBusy = processingRequestEmail === req.email;
              return (
                <div
                  key={req.user_id || req.email}
                  className="p-3.5 rounded-2xl bg-[#121214] border border-white/40 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white animate-in fade-in duration-200"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center shrink-0 shadow">
                      <BellRing className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/15 text-white">
                          Pedido de Acesso Google
                        </span>
                        <span className="text-xs font-black text-white truncate">{req.name}</span>
                      </div>
                      <p className="text-[11px] text-zinc-300 truncate mt-0.5">
                        <strong>{req.email}</strong> quer entrar no Change. Deseja autorizar?
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={async () => {
                        setProcessingRequestEmail(req.email);
                        await adminDecideAccessRequest(req.email, 'approved');
                        setProcessingRequestEmail(null);
                      }}
                      className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black font-black text-xs flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Aceitar</span>
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={async () => {
                        setProcessingRequestEmail(req.email);
                        await adminDecideAccessRequest(req.email, 'rejected');
                        setProcessingRequestEmail(null);
                      }}
                      className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-red-950/70 hover:bg-red-900 border border-red-500/40 text-red-200 font-black text-xs flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Negar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <main className="flex-1 w-full max-w-4xl mx-auto overflow-x-hidden">
          {currentTab === 'routines' && <RoutinesView />}
          {currentTab === 'exercises' && <ExercisesView />}
          {currentTab === 'physiotherapy' && canAccessPhysio && <PhysiotherapyView />}
          {currentTab === 'history' && <HistoryView />}
          {currentTab === 'analytics' && <AnalyticsView />}
          {currentTab === 'settings' && <SettingsView />}
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
      <ActiveWorkoutModal />
      <WorkoutSummaryModal />
    </div>
  );
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReload = async () => {
    try {
      if ('caches' in window) {
        const keys = await window.caches.keys();
        await Promise.all(keys.map((k) => window.caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
    } catch {
      // Ignora erro em navegadores que bloqueiem acesso ao cache
    }
    window.location.href = window.location.pathname + '?_v=' + Date.now();
  };

  handleReset = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-xl font-black">
            !
          </div>
          <h1 className="text-xl font-black">Ops! Algo deu errado.</h1>
          <p className="text-xs text-zinc-400 max-w-sm">
            {this.state.error?.message || 'Ocorreu um erro inesperado no aplicativo.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={this.handleReload}
              className="px-5 py-2.5 bg-white text-black font-black text-xs rounded-xl shadow active:scale-95 transition"
            >
              Recarregar Aplicativo
            </button>
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl hover:text-white active:scale-95 transition"
            >
              Restaurar Sessão
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
