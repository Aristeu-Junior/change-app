import React, { useState, useEffect, useMemo } from 'react';
import {
  Dumbbell,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sun,
  Moon,
  ShieldCheck,
  ShieldAlert,
  Clock,
  UserCheck,
  User,
  UserPlus,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  Smartphone,
  CheckCircle2,
  XCircle,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  requestPasswordRecoveryEmail,
  recoverPasswordWithTotp,
  requestOrCheckGoogleAccess,
  pullAllUserProfilesFromCloud,
  CloudUserPayload
} from '../services/cloudSync';
import { verifyTotpCode } from '../utils/totp';

type AuthMode =
  | 'login'
  | 'two_factor'
  | 'forgot_password'
  | 'google_account_chooser'
  | 'google_add_account'
  | 'google_pending'
  | 'google_approved'
  | 'access_denied';

interface SavedGoogleAccountItem {
  name: string;
  email: string;
  status?: 'approved' | 'pending' | 'rejected';
}

const DEVICE_GOOGLE_ACCOUNTS_KEY = 'change_device_google_accounts';

export const AuthLoginScreen: React.FC = () => {
  const { users, loginUserWith2FA, loginWithCloudPayload, theme, toggleTheme } = useApp();

  const [mode, setMode] = useState<AuthMode>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [newRecoveryPassword, setNewRecoveryPassword] = useState('');
  const [useTotpForRecovery, setUseTotpForRecovery] = useState(false);

  // Contas Google disponíveis no seletor ("Escolha uma conta")
  const [deviceGoogleAccounts, setDeviceGoogleAccounts] = useState<SavedGoogleAccountItem[]>(() => {
    try {
      const raw = localStorage.getItem(DEVICE_GOOGLE_ACCOUNTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [cloudProfiles, setCloudProfiles] = useState<SavedGoogleAccountItem[]>([]);
  const [selectingAccountEmail, setSelectingAccountEmail] = useState<string | null>(null);

  // Dados para adicionar nova conta Google (quando a pessoa clica em "Usar outra conta")
  const [googleRequestName, setGoogleRequestName] = useState('');
  const [googleRequestPassword, setGoogleRequestPassword] = useState('');
  const [approvedCloudAccount, setApprovedCloudAccount] = useState<CloudUserPayload | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Caso o login via Google exija 2FA antes de concluir
  const [pendingGoogleAccount, setPendingGoogleAccount] = useState<CloudUserPayload | null>(null);

  const isLight = theme === 'light';

  const saveAccountToDeviceChooser = (acc: SavedGoogleAccountItem) => {
    setDeviceGoogleAccounts((prev) => {
      const cleanEmail = acc.email.trim().toLowerCase();
      const filtered = prev.filter((item) => item.email.toLowerCase() !== cleanEmail);
      const next = [{ name: acc.name.trim(), email: cleanEmail, status: acc.status }, ...filtered];
      try {
        localStorage.setItem(DEVICE_GOOGLE_ACCOUNTS_KEY, JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  // Carrega perfis existentes e verifica solicitações pendentes no aparelho
  useEffect(() => {
    pullAllUserProfilesFromCloud().then((list) => {
      if (list && list.length > 0) {
        setCloudProfiles(
          list.map((u) => ({
            name: u.name,
            email: u.email,
            status: 'approved'
          }))
        );
      }
    });

    const savedPendingEmail = localStorage.getItem('change_pending_google_email');
    if (savedPendingEmail) {
      setIdentifier(savedPendingEmail);
      requestOrCheckGoogleAccess(savedPendingEmail).then((res) => {
        if (res.status === 'pending') {
          setMode('google_pending');
        } else if (res.status === 'rejected') {
          setMode('access_denied');
        } else if (res.status === 'approved' && res.account) {
          localStorage.removeItem('change_pending_google_email');
          saveAccountToDeviceChooser({
            name: res.account.name,
            email: res.account.email,
            status: 'approved'
          });
          setApprovedCloudAccount(res.account);
          setMode('google_approved');
        } else {
          localStorage.removeItem('change_pending_google_email');
        }
      });
    }
  }, []);

  // Lista unificada de contas para o Seletor Padrão do Google ("Escolha uma conta")
  const chooserAccounts = useMemo(() => {
    const map = new Map<string, SavedGoogleAccountItem>();

    // 1. Contas salvas neste dispositivo (prioridade no topo)
    deviceGoogleAccounts.forEach((acc) => {
      if (acc.email) {
        map.set(acc.email.toLowerCase(), acc);
      }
    });

    // 2. Perfis sincronizados da nuvem
    cloudProfiles.forEach((acc) => {
      if (acc.email && !map.has(acc.email.toLowerCase())) {
        map.set(acc.email.toLowerCase(), acc);
      }
    });

    // 3. Perfis locais conhecidos
    users.forEach((u) => {
      if (u.email && !map.has(u.email.toLowerCase())) {
        map.set(u.email.toLowerCase(), {
          name: u.name,
          email: u.email,
          status: 'approved'
        });
      }
    });

    return Array.from(map.values());
  }, [deviceGoogleAccounts, cloudProfiles, users]);

  // Monitoramento em tempo real enquanto aguarda aprovação do Admin (Aceitar ou Negar)
  useEffect(() => {
    if (mode !== 'google_pending' || !identifier.trim()) return;

    const cleanEmail = identifier.trim().toLowerCase();
    let active = true;

    const checkStatusNow = async () => {
      if (!active) return;
      const res = await requestOrCheckGoogleAccess(cleanEmail);
      if (!active) return;
      if (res.status === 'approved' && res.account) {
        localStorage.removeItem('change_pending_google_email');
        saveAccountToDeviceChooser({
          name: res.account.name,
          email: res.account.email,
          status: 'approved'
        });
        setApprovedCloudAccount(res.account);
        setMode('google_approved');
      } else if (res.status === 'rejected') {
        saveAccountToDeviceChooser({
          name: googleRequestName || cleanEmail.split('@')[0],
          email: cleanEmail,
          status: 'rejected'
        });
        setMode('access_denied');
      }
    };

    checkStatusNow();
    const interval = window.setInterval(checkStatusNow, 2500);

    const handleWake = () => {
      if (document.visibilityState === 'visible') {
        checkStatusNow();
      }
    };

    document.addEventListener('visibilitychange', handleWake);
    window.addEventListener('focus', checkStatusNow);
    window.addEventListener('pageshow', checkStatusNow);
    window.addEventListener('online', checkStatusNow);

    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleWake);
      window.removeEventListener('focus', checkStatusNow);
      window.removeEventListener('pageshow', checkStatusNow);
      window.removeEventListener('online', checkStatusNow);
    };
  }, [mode, identifier, googleRequestName]);

  const resetMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // 1. Login Padrão (E-mail + Senha -> e 2FA se ativo)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setErrorMsg('Insira o seu e-mail e a sua senha.');
      return;
    }

    resetMessages();
    setIsLoading(true);
    const result = await loginUserWith2FA(identifier.trim(), password);
    setIsLoading(false);

    if (result.accountStatus === 'rejected') {
      setMode('access_denied');
      return;
    }

    if (result.accountStatus === 'pending') {
      setMode('google_pending');
      return;
    }

    if (result.requires2FA) {
      setMode('two_factor');
      return;
    }

    if (!result.ok) {
      setErrorMsg(result.error || 'E-mail ou senha incorretos. Verifique seus dados.');
    }
  };

  // 2. Confirmação do Código de 2 Fatores (2FA)
  const handleVerify2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.replace(/\D/g, '').length !== 6) {
      setErrorMsg('Digite os 6 dígitos do seu aplicativo autenticador.');
      return;
    }

    resetMessages();
    setIsLoading(true);

    if (pendingGoogleAccount) {
      const valid = await verifyTotpCode(pendingGoogleAccount.totp_secret || '', totpCode);
      if (!valid) {
        setIsLoading(false);
        setErrorMsg('Código de 2 Fatores (2FA) inválido ou expirado.');
        return;
      }
      await loginWithCloudPayload(pendingGoogleAccount);
      setIsLoading(false);
      return;
    }

    const result = await loginUserWith2FA(identifier.trim(), password, totpCode);
    setIsLoading(false);

    if (!result.ok) {
      setErrorMsg(result.error || 'Código 2FA incorreto.');
    }
  };

  // 3. Ao tocar em "Continuar com o Google": abre imediatamente a Aba Padrão de Seleção de Contas do Google
  const handleGoogleSignInClick = () => {
    resetMessages();
    pullAllUserProfilesFromCloud().then((list) => {
      if (list && list.length > 0) {
        setCloudProfiles(
          list.map((u) => ({
            name: u.name,
            email: u.email,
            status: 'approved'
          }))
        );
      }
    });
    setMode('google_account_chooser');
  };

  // 4. Ao tocar em uma Conta Google na lista ("Escolha uma conta para continuar no Change")
  const handleSelectGoogleAccount = async (acc: SavedGoogleAccountItem) => {
    resetMessages();
    const cleanEmail = acc.email.trim().toLowerCase();
    setIdentifier(cleanEmail);
    setGoogleRequestName(acc.name);
    setSelectingAccountEmail(cleanEmail);
    setIsLoading(true);

    const checkRes = await requestOrCheckGoogleAccess(cleanEmail, acc.name);
    setSelectingAccountEmail(null);
    setIsLoading(false);

    if (checkRes.status === 'rejected') {
      saveAccountToDeviceChooser({ ...acc, status: 'rejected' });
      setMode('access_denied');
      return;
    }

    if (checkRes.status === 'pending') {
      localStorage.setItem('change_pending_google_email', cleanEmail);
      saveAccountToDeviceChooser({ ...acc, status: 'pending' });
      setMode('google_pending');
      return;
    }

    if (checkRes.status === 'approved' && checkRes.account) {
      localStorage.removeItem('change_pending_google_email');
      saveAccountToDeviceChooser({
        name: checkRes.account.name,
        email: checkRes.account.email,
        status: 'approved'
      });

      if (checkRes.account.totp_enabled && checkRes.account.totp_secret) {
        setPendingGoogleAccount(checkRes.account);
        setMode('two_factor');
        return;
      }

      await loginWithCloudPayload(checkRes.account);
      return;
    }

    // Fallback local caso seja um dos perfis locais offline
    const localMatch = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (localMatch) {
      await loginUserWith2FA(localMatch.email, localMatch.password || '123456');
      return;
    }

    setErrorMsg(checkRes.message || 'Não foi possível conectar com esta conta Google.');
  };

  // 5. Quando uma pessoa nova escolhe "Usar outra conta" no seletor do Google
  const handleAddAnotherGoogleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = identifier.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Informe um endereço de e-mail Google válido (ex: seuemail@gmail.com).');
      return;
    }

    const derivedName =
      googleRequestName.trim() ||
      cleanEmail.split('@')[0].replace(/[._0-9]/g, ' ').trim() ||
      'Atleta';
    const formattedName = derivedName.charAt(0).toUpperCase() + derivedName.slice(1);

    resetMessages();
    setIsLoading(true);
    const res = await requestOrCheckGoogleAccess(
      cleanEmail,
      formattedName,
      googleRequestPassword.trim() || undefined
    );
    setIsLoading(false);

    if (res.status === 'rejected') {
      saveAccountToDeviceChooser({ name: formattedName, email: cleanEmail, status: 'rejected' });
      setMode('access_denied');
      return;
    }

    if (res.status === 'pending') {
      localStorage.setItem('change_pending_google_email', cleanEmail);
      saveAccountToDeviceChooser({ name: formattedName, email: cleanEmail, status: 'pending' });
      setMode('google_pending');
      return;
    }

    if (res.status === 'approved' && res.account) {
      localStorage.removeItem('change_pending_google_email');
      saveAccountToDeviceChooser({
        name: res.account.name,
        email: res.account.email,
        status: 'approved'
      });

      if (res.account.totp_enabled && res.account.totp_secret) {
        setPendingGoogleAccount(res.account);
        setMode('two_factor');
        return;
      }

      await loginWithCloudPayload(res.account);
      return;
    }

    setErrorMsg(res.message || 'Não foi possível conectar esta conta Google.');
  };

  // 6. Esqueci Minha Senha (Envio de Nova Senha por E-mail ou Redefinição Imediata via 2FA)
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMsg('Informe o e-mail cadastrado na sua conta.');
      return;
    }

    resetMessages();

    if (useTotpForRecovery) {
      if (totpCode.replace(/\D/g, '').length !== 6) {
        setErrorMsg('Informe o código de 6 dígitos do seu aplicativo autenticador (2FA).');
        return;
      }
      if (!newRecoveryPassword.trim() || newRecoveryPassword.trim().length < 4) {
        setErrorMsg('Defina uma nova senha de pelo menos 4 caracteres.');
        return;
      }

      setIsLoading(true);
      const res = await recoverPasswordWithTotp(
        identifier.trim(),
        totpCode.trim(),
        newRecoveryPassword.trim()
      );
      setIsLoading(false);

      if (res.ok && res.account) {
        await loginWithCloudPayload(res.account);
      } else {
        setErrorMsg(res.error || 'Não foi possível redefinir a senha via 2FA.');
      }
      return;
    }

    setIsLoading(true);
    const res = await requestPasswordRecoveryEmail(identifier.trim());
    setIsLoading(false);

    if (res.ok) {
      setSuccessMsg(
        `Enviamos um e-mail para ${res.email}! Ao tocar no link recebido no seu e-mail, o sistema gerará automaticamente uma nova senha para você e abrirá sua conta.`
      );
    } else {
      setErrorMsg(res.error || 'Não foi possível solicitar uma nova senha para este e-mail.');
    }
  };

  return (
    <div
      className={`w-full min-h-dvh ${
        isLight ? 'bg-[#f4f4f5] text-black' : 'bg-black text-white'
      } flex items-center justify-center sm:p-6 transition-colors duration-200`}
    >
      <div className="safe-top-shield sm:hidden" />

      <div
        className={`w-full max-w-md min-h-dvh sm:min-h-0 ${
          isLight ? 'bg-white border-zinc-200' : 'bg-[#09090b] border-[#27272a]'
        } sm:border sm:rounded-3xl flex flex-col justify-between px-6 sm:p-8 view-container sm:!pt-8 sm:!pb-8 relative shadow-2xl transition-colors duration-200`}
      >
        {/* Barra Superior: Logo + Botão Tema P&B */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white text-black font-black flex items-center justify-center shadow-md border border-zinc-300">
              <Dumbbell className="w-5 h-5 stroke-[2.5] text-black" />
            </div>
            <span className="text-lg font-black tracking-widest text-white">CHANGE</span>
          </div>

          <button
            type="button"
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

        {/* =========================================================
            MODO 1: TELA DE LOGIN PRINCIPAL (E-MAIL, SENHA & GOOGLE)
           ========================================================= */}
        {mode === 'login' && (
          <div className="my-auto py-6 space-y-6 animate-in fade-in duration-150">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#141416] border border-[#27272a] text-[10px] font-black uppercase tracking-wider text-zinc-400">
                <Lock className="w-3 h-3 text-white" />
                <span>Acesso Individual</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white leading-tight">
                Bem-vindo ao Change.
              </h1>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Entre com sua conta para acessar seus planos de treino, histórico de cargas e ranking.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs font-bold text-red-300 animate-in fade-in duration-150">
                {errorMsg}
              </div>
            )}

            {/* Botão Entrar com o Google -> Abre o Seletor Padrão de Contas do Google */}
            <button
              type="button"
              onClick={handleGoogleSignInClick}
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-[#141416] hover:bg-[#1c1c1f] border border-[#27272a] hover:border-zinc-500 rounded-xl flex items-center justify-center gap-3 text-xs font-black text-white transition active:scale-98 shadow-sm"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81Z"
                />
              </svg>
              <span>Continuar com o Google</span>
            </button>

            <div className="flex items-center gap-3 py-0.5">
              <div className="flex-1 border-t border-[#27272a]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 whitespace-nowrap shrink-0">
                ou com e-mail
              </span>
              <div className="flex-1 border-t border-[#27272a]" />
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider font-black text-zinc-400 block">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Insira o seu e-mail"
                    autoComplete="username"
                    required
                    className="w-full bg-[#141416] border border-[#27272a] focus:border-white rounded-xl pl-10 pr-4 py-3.5 text-xs font-bold text-white placeholder-zinc-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] uppercase tracking-wider font-black text-zinc-400 block">
                    Senha
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      resetMessages();
                      setMode('forgot_password');
                    }}
                    className="text-[11px] font-bold text-zinc-400 hover:text-white underline transition"
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Insira a sua senha"
                    autoComplete="current-password"
                    required
                    className="w-full bg-[#141416] border border-[#27272a] focus:border-white rounded-xl pl-10 pr-10 py-3.5 text-xs font-bold text-white placeholder-zinc-500 focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-widest rounded-xl shadow-xl flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50 mt-2"
              >
                <span>{isLoading ? 'Entrando...' : 'Entrar'}</span>
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          </div>
        )}

        {/* =========================================================
            MODO 2: SELETOR PADRÃO DE CONTAS DO GOOGLE ("ESCOLHA UMA CONTA")
           ========================================================= */}
        {mode === 'google_account_chooser' && (
          <div className="my-auto py-5 animate-in fade-in duration-150">
            <div className="bg-[#141416] border border-[#27272a] rounded-3xl overflow-hidden shadow-2xl">
              {/* Barra Superior Oficial "Fazer login com o Google" */}
              <div className="px-5 py-3.5 border-b border-[#27272a] flex items-center justify-between bg-[#18181b]">
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                    />
                  </svg>
                  <span className="text-xs font-bold text-zinc-200">
                    Fazer login com o Google
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    resetMessages();
                    setMode('login');
                  }}
                  className="text-[11px] font-bold text-zinc-400 hover:text-white transition"
                >
                  Cancelar
                </button>
              </div>

              {/* Cabeçalho Central "Escolha uma conta" */}
              <div className="px-6 pt-6 pb-4 text-center space-y-1.5">
                <div className="w-11 h-11 rounded-2xl bg-white text-black font-black flex items-center justify-center mx-auto shadow-md mb-2">
                  <Dumbbell className="w-5 h-5 stroke-[2.5] text-black" />
                </div>
                <h2 className="text-xl font-black text-white tracking-tight">
                  Escolha uma conta
                </h2>
                <p className="text-xs text-zinc-400">
                  para prosseguir para <strong className="text-white">Change</strong>
                </p>
              </div>

              {errorMsg && (
                <div className="mx-5 mb-3 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs font-bold text-red-300">
                  {errorMsg}
                </div>
              )}

              {/* Lista de Contas para Selecionar com 1 Toque */}
              <div className="divide-y divide-[#27272a] border-t border-b border-[#27272a] max-h-72 overflow-y-auto">
                {chooserAccounts.map((acc) => {
                  const isBusy = selectingAccountEmail === acc.email.toLowerCase();
                  return (
                    <button
                      key={acc.email}
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleSelectGoogleAccount(acc)}
                      className="w-full px-5 py-3.5 hover:bg-[#1c1c1f] active:bg-zinc-800 flex items-center justify-between gap-3 text-left transition group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-white text-black font-black text-sm flex items-center justify-center shrink-0 shadow">
                          {acc.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-white truncate">
                              {acc.name}
                            </span>
                            {acc.status === 'pending' && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 font-bold">
                                Pendente
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-zinc-400 truncate block">
                            {acc.email}
                          </span>
                        </div>
                      </div>

                      {isBusy ? (
                        <div className="w-4 h-4 rounded-full border-2 border-zinc-500 border-t-white animate-spin shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition shrink-0" />
                      )}
                    </button>
                  );
                })}

                {/* Opção Padrão do Google: "Usar outra conta" */}
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    resetMessages();
                    setIdentifier('');
                    setGoogleRequestName('');
                    setGoogleRequestPassword('');
                    setMode('google_add_account');
                  }}
                  className="w-full px-5 py-4 hover:bg-[#1c1c1f] active:bg-zinc-800 flex items-center gap-3.5 text-left transition"
                >
                  <div className="w-10 h-10 rounded-full bg-[#1c1c1f] border border-[#3f3f46] text-white flex items-center justify-center shrink-0">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-white block">
                      Usar outra conta
                    </span>
                    <span className="text-[10px] text-zinc-400 block">
                      Conectar um novo e-mail do Google ao Change
                    </span>
                  </div>
                </button>
              </div>

              <div className="px-6 py-4 bg-[#121214] text-[10px] text-zinc-500 leading-relaxed text-center">
                Para continuar, o Google compartilhará seu nome e endereço de e-mail com o aplicativo Change.
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            MODO 3: USAR OUTRA CONTA GOOGLE (SOLICITAÇÃO AO ADMIN)
           ========================================================= */}
        {mode === 'google_add_account' && (
          <div className="my-auto py-5 animate-in fade-in duration-150">
            <div className="bg-[#141416] border border-[#27272a] rounded-3xl p-6 shadow-2xl space-y-5">
              <button
                type="button"
                onClick={() => {
                  resetMessages();
                  setMode('google_account_chooser');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar para as contas</span>
              </button>

              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#18181b] border border-[#27272a] text-[10px] font-black uppercase tracking-wider text-zinc-200">
                  <span>Conta Google</span>
                </div>
                <h2 className="text-xl font-black text-white leading-tight">
                  Fazer login com o Google
                </h2>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Selecione sua conta informando seu Gmail abaixo. Caso seja seu primeiro acesso, o administrador receberá seu pedido de aprovação na hora.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs font-bold text-red-300">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleAddAnotherGoogleAccountSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-wider font-black text-zinc-400 block">
                    Seu Nome
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={googleRequestName}
                      onChange={(e) => setGoogleRequestName(e.target.value)}
                      placeholder="Como você se chama?"
                      required
                      className="w-full bg-[#18181b] border border-[#27272a] focus:border-white rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-white placeholder-zinc-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-wider font-black text-zinc-400 block">
                    E-mail do Google (Gmail)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="seuemail@gmail.com"
                      required
                      className="w-full bg-[#18181b] border border-[#27272a] focus:border-white rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-white placeholder-zinc-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-widest rounded-xl shadow-xl flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50"
                >
                  <span>{isLoading ? 'Conectando...' : 'Continuar com esta Conta'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================
            MODO 4: VERIFICAÇÃO DE 2 FATORES (2FA - GOOGLE AUTHENTICATOR)
           ========================================================= */}
        {mode === 'two_factor' && (
          <div className="my-auto py-6 space-y-6 animate-in fade-in duration-150">
            <button
              type="button"
              onClick={() => {
                resetMessages();
                setPendingGoogleAccount(null);
                setTotpCode('');
                setMode('login');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar para o login</span>
            </button>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#141416] border border-[#27272a] text-[10px] font-black uppercase tracking-wider text-white">
                <Smartphone className="w-3 h-3" />
                <span>Segurança de 2 Fatores (2FA)</span>
              </div>
              <h2 className="text-2xl font-black text-white leading-tight">
                Código do Autenticador
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Abra o seu <strong>Google Authenticator</strong> ou app de Senhas e digite o código temporário de 6 dígitos da sua conta.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs font-bold text-red-300">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleVerify2FASubmit} className="space-y-4">
              <div>
                <label className="text-[11px] uppercase tracking-wider font-black text-zinc-400 block mb-1.5">
                  Código 2FA (6 dígitos)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  autoFocus
                  required
                  className="w-full bg-[#141416] border border-[#27272a] focus:border-white rounded-xl py-4 text-center text-2xl font-black tracking-[0.5em] text-white placeholder-zinc-600 focus:outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-widest rounded-xl shadow-xl flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50"
              >
                <span>{isLoading ? 'Verificando...' : 'Confirmar e Entrar'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* =========================================================
            MODO 5: ABA ESQUECI MINHA SENHA (POR E-MAIL OU 2FA)
           ========================================================= */}
        {mode === 'forgot_password' && (
          <div className="my-auto py-6 space-y-5 animate-in fade-in duration-150">
            <button
              type="button"
              onClick={() => {
                resetMessages();
                setMode('login');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar para o login</span>
            </button>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#141416] border border-[#27272a] text-[10px] font-black uppercase tracking-wider text-zinc-300">
                <KeyRound className="w-3 h-3 text-white" />
                <span>Recuperação de Acesso</span>
              </div>
              <h2 className="text-2xl font-black text-white leading-tight">Esqueci minha senha</h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Informe o e-mail cadastrado para receber uma nova senha direto no seu e-mail ou redefina usando seu código de 2 Fatores (2FA).
              </p>
            </div>

            <div className="grid grid-cols-2 gap-1.5 bg-[#141416] p-1 rounded-xl border border-[#27272a]">
              <button
                type="button"
                onClick={() => {
                  resetMessages();
                  setUseTotpForRecovery(false);
                }}
                className={`py-2 rounded-lg text-[11px] font-black transition ${
                  !useTotpForRecovery ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Receber no E-mail
              </button>
              <button
                type="button"
                onClick={() => {
                  resetMessages();
                  setUseTotpForRecovery(true);
                }}
                className={`py-2 rounded-lg text-[11px] font-black transition ${
                  useTotpForRecovery ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Usar Código 2FA
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs font-bold text-red-300">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-white/40 text-xs font-bold text-white flex items-start gap-2.5 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider font-black text-zinc-400 block">
                  E-mail Cadastrado
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Insira o seu e-mail"
                    required
                    className="w-full bg-[#141416] border border-[#27272a] focus:border-white rounded-xl pl-10 pr-4 py-3.5 text-xs font-bold text-white placeholder-zinc-500 focus:outline-none transition"
                  />
                </div>
              </div>

              {useTotpForRecovery && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-wider font-black text-zinc-400 block">
                      Código de 6 Dígitos do Autenticador (2FA)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      required
                      className="w-full bg-[#141416] border border-[#27272a] focus:border-white rounded-xl py-3 text-center text-lg font-black tracking-[0.4em] text-white placeholder-zinc-600 focus:outline-none transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-wider font-black text-zinc-400 block">
                      Nova Senha Desejada
                    </label>
                    <input
                      type="password"
                      value={newRecoveryPassword}
                      onChange={(e) => setNewRecoveryPassword(e.target.value)}
                      placeholder="Digite sua nova senha"
                      required
                      className="w-full bg-[#141416] border border-[#27272a] focus:border-white rounded-xl px-4 py-3.5 text-xs font-bold text-white placeholder-zinc-500 focus:outline-none transition"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-widest rounded-xl shadow-xl flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50"
              >
                <span>
                  {isLoading
                    ? 'Processando...'
                    : useTotpForRecovery
                    ? 'Redefinir Senha Agora'
                    : 'Enviar Nova Senha para o E-mail'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* =========================================================
            MODO 6: AGUARDANDO APROVAÇÃO DO ADMINISTRADOR (TEMPO REAL)
           ========================================================= */}
        {mode === 'google_pending' && (
          <div className="my-auto py-8 space-y-6 text-center animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-3xl bg-[#141416] border border-[#27272a] flex items-center justify-center mx-auto shadow-xl relative">
              <Clock className="w-8 h-8 text-white animate-pulse" />
              <span className="w-3 h-3 rounded-full bg-white absolute -top-1 -right-1 animate-ping" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#141416] border border-[#27272a] text-[10px] font-black uppercase tracking-widest text-zinc-300">
                <span>Solicitação Enviada</span>
              </div>
              <h2 className="text-2xl font-black text-white leading-tight">
                Aguardando Aprovação
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
                Sua solicitação para <strong className="text-white">{identifier.trim().toLowerCase()}</strong> já foi enviada ao administrador. Assim que ele aceitar, sua tela será liberada automaticamente!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#141416] border border-[#27272a] flex items-center justify-center gap-3 text-xs font-bold text-zinc-300">
              <div className="w-4 h-4 rounded-full border-2 border-zinc-600 border-t-white animate-spin shrink-0" />
              <span>Verificando resposta do administrador em tempo real...</span>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={async () => {
                  const cleanEmail = identifier.trim().toLowerCase();
                  if (!cleanEmail) return;
                  setIsLoading(true);
                  const res = await requestOrCheckGoogleAccess(cleanEmail);
                  setIsLoading(false);
                  if (res.status === 'approved' && res.account) {
                    localStorage.removeItem('change_pending_google_email');
                    setApprovedCloudAccount(res.account);
                    setMode('google_approved');
                  } else if (res.status === 'rejected') {
                    setMode('access_denied');
                  }
                }}
                className="w-full py-3 bg-white text-black font-black text-xs rounded-xl shadow hover:bg-zinc-200 transition active:scale-95"
              >
                {isLoading ? 'Verificando...' : 'Verificar Liberação Agora'}
              </button>

              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('change_pending_google_email');
                  resetMessages();
                  setMode('login');
                }}
                className="text-xs font-bold text-zinc-400 hover:text-white underline transition py-1"
              >
                Voltar para a tela inicial
              </button>
            </div>
          </div>
        )}

        {/* =========================================================
            MODO 7: ACESSO ACEITO PELO ADMINISTRADOR!
           ========================================================= */}
        {mode === 'google_approved' && approvedCloudAccount && (
          <div className="my-auto py-8 space-y-6 text-center animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-3xl bg-white text-black flex items-center justify-center mx-auto shadow-2xl">
              <UserCheck className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/30 text-[10px] font-black uppercase tracking-widest text-white">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Acesso Liberado</span>
              </div>
              <h2 className="text-3xl font-black text-white leading-tight">
                Acesso Aceito!
              </h2>
              <p className="text-xs text-zinc-300 leading-relaxed max-w-xs mx-auto">
                Olá, <strong>{approvedCloudAccount.name}</strong>! O administrador aprovou a sua entrada no Change. Seus treinos e ranking já estão liberados.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loginWithCloudPayload(approvedCloudAccount)}
              className="w-full py-4 bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-widest rounded-xl shadow-xl flex items-center justify-center gap-2 transition active:scale-98"
            >
              <span>Entrar no Aplicativo Agora</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* =========================================================
            MODO 8: ACESSO NEGADO PELO ADMINISTRADOR (BLOQUEIO TOTAL)
           ========================================================= */}
        {mode === 'access_denied' && (
          <div className="my-auto py-8 space-y-6 text-center animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-3xl bg-red-950/60 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto shadow-2xl">
              <XCircle className="w-9 h-9 stroke-[2.2]" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/60 border border-red-500/30 text-[10px] font-black uppercase tracking-widest text-red-300">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Entrada Bloqueada</span>
              </div>
              <h2 className="text-3xl font-black text-white leading-tight">
                Acesso Negado
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
                Sua solicitação de acesso para <strong className="text-white">{identifier.trim().toLowerCase() || 'esta conta'}</strong> não foi autorizada pelo administrador. Você não possui permissão para acessar o aplicativo.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('change_pending_google_email');
                resetMessages();
                setIdentifier('');
                setPassword('');
                setMode('login');
              }}
              className="w-full py-3.5 bg-[#141416] hover:bg-[#1c1c1f] border border-[#27272a] text-zinc-300 font-bold text-xs rounded-xl transition"
            >
              Voltar
            </button>
          </div>
        )}

        {/* Rodapé discreto sem expor nomes de administradores */}
        <div className="pt-4 border-t border-[#27272a] flex items-start gap-2.5 text-left">
          <ShieldCheck className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Plataforma fechada para membros convidados. Cada conta possui acesso isolado e criptografado aos próprios treinos.
          </p>
        </div>
      </div>
    </div>
  );
};
