import React, { useState, useEffect } from 'react';
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
  XCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  requestPasswordRecoveryEmail,
  recoverPasswordWithTotp,
  requestOrCheckGoogleAccess
} from '../services/cloudSync';

type AuthMode =
  | 'login'
  | 'two_factor'
  | 'forgot_password'
  | 'request_access'
  | 'access_pending'
  | 'access_approved'
  | 'access_denied';

export const AuthLoginScreen: React.FC = () => {
  const { loginUserWith2FA, loginWithCloudPayload, theme, toggleTheme } = useApp();

  const [mode, setMode] = useState<AuthMode>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [newRecoveryPassword, setNewRecoveryPassword] = useState('');
  const [useTotpForRecovery, setUseTotpForRecovery] = useState(false);

  // Dados para solicitar novo acesso ao Administrador (com Nome, E-mail e Senha própria)
  const [requestName, setRequestName] = useState('');
  const [requestPassword, setRequestPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isLight = theme === 'light';

  useEffect(() => {
    // Remove qualquer lista de contas salva anteriormente por segurança
    try {
      localStorage.removeItem('change_device_google_accounts');
    } catch {
      // Ignore
    }

    const savedPendingEmail = localStorage.getItem('change_pending_google_email');
    if (savedPendingEmail) {
      setIdentifier(savedPendingEmail);
      requestOrCheckGoogleAccess(savedPendingEmail).then((res) => {
        if (res.status === 'pending') {
          setMode('access_pending');
        } else if (res.status === 'rejected') {
          setMode('access_denied');
        } else if (res.status === 'approved') {
          localStorage.removeItem('change_pending_google_email');
          setMode('access_approved');
        } else {
          localStorage.removeItem('change_pending_google_email');
        }
      });
    }
  }, []);

  // Monitoramento em tempo real enquanto aguarda aprovação do Admin (Aceitar ou Negar)
  useEffect(() => {
    if (mode !== 'access_pending' || !identifier.trim()) return;

    const cleanEmail = identifier.trim().toLowerCase();
    let active = true;

    const checkStatusNow = async () => {
      if (!active) return;
      const res = await requestOrCheckGoogleAccess(cleanEmail);
      if (!active) return;
      if (res.status === 'approved') {
        localStorage.removeItem('change_pending_google_email');
        // Se a pessoa acabou de criar a senha nesta sessão, autentica automaticamente com a senha dela
        if (requestPassword.trim()) {
          const authRes = await loginUserWith2FA(cleanEmail, requestPassword.trim());
          if (authRes.ok) return;
        }
        setMode('access_approved');
      } else if (res.status === 'rejected') {
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
  }, [mode, identifier, requestPassword]);

  const resetMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // 1. Login Padrão Seguro (E-mail + Senha -> e 2FA se ativo)
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
      setMode('access_pending');
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
    const result = await loginUserWith2FA(identifier.trim(), password, totpCode);
    setIsLoading(false);

    if (!result.ok) {
      setErrorMsg(result.error || 'Código 2FA incorreto.');
    }
  };

  // 3. Solicitar Novo Acesso ao Administrador (Para convidados ainda não cadastrados)
  const handleRequestAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = identifier.trim().toLowerCase();
    const cleanName = requestName.trim();
    const cleanPass = requestPassword.trim();

    if (!cleanName) {
      setErrorMsg('Informe o seu nome.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Informe um endereço de e-mail válido.');
      return;
    }
    if (!cleanPass || cleanPass.length < 4) {
      setErrorMsg('Crie uma senha de pelo menos 4 caracteres para sua conta.');
      return;
    }

    resetMessages();
    setIsLoading(true);

    // Verifica primeiro se o e-mail já existe no banco
    const checkExisting = await requestOrCheckGoogleAccess(cleanEmail);
    if (checkExisting.status === 'approved') {
      setIsLoading(false);
      setErrorMsg('Este e-mail já possui cadastro ativo. Volte e entre usando sua senha.');
      return;
    }
    if (checkExisting.status === 'rejected') {
      setIsLoading(false);
      setMode('access_denied');
      return;
    }
    if (checkExisting.status === 'pending') {
      setIsLoading(false);
      localStorage.setItem('change_pending_google_email', cleanEmail);
      setMode('access_pending');
      return;
    }

    const res = await requestOrCheckGoogleAccess(cleanEmail, cleanName, cleanPass);
    setIsLoading(false);

    if (res.status === 'pending') {
      localStorage.setItem('change_pending_google_email', cleanEmail);
      setPassword(cleanPass);
      setMode('access_pending');
      return;
    }

    if (res.status === 'rejected') {
      setMode('access_denied');
      return;
    }

    setErrorMsg(res.message || 'Não foi possível enviar a solicitação de acesso.');
  };

  // 4. Esqueci Minha Senha (Envio de Nova Senha por E-mail ou Redefinição Imediata via 2FA)
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
            MODO 1: TELA DE LOGIN PRINCIPAL (100% SEGURA COM E-MAIL E SENHA)
           ========================================================= */}
        {mode === 'login' && (
          <div className="my-auto py-6 space-y-6 animate-in fade-in duration-150">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#141416] border border-[#27272a] text-[10px] font-black uppercase tracking-wider text-zinc-400">
                <Lock className="w-3 h-3 text-white" />
                <span>Acesso Individual Protegido</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white leading-tight">
                Bem-vindo ao Change.
              </h1>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Entre com seu e-mail e sua senha para acessar seus planos de treino, histórico de cargas e ranking.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs font-bold text-red-300 animate-in fade-in duration-150">
                {errorMsg}
              </div>
            )}

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

            {/* Opção para novos convidados pedirem aprovação de acesso ao Administrador */}
            <div className="pt-2 border-t border-[#27272a] text-center">
              <button
                type="button"
                onClick={() => {
                  resetMessages();
                  setRequestName('');
                  setRequestPassword('');
                  setMode('request_access');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition py-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Não tem conta? Solicitar acesso ao administrador</span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================================
            MODO 2: SOLICITAR NOVO ACESSO AO ADMINISTRADOR
           ========================================================= */}
        {mode === 'request_access' && (
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
                <UserPlus className="w-3 h-3 text-white" />
                <span>Pedido de Acesso</span>
              </div>
              <h2 className="text-2xl font-black text-white leading-tight">
                Solicitar Entrada no Change
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Preencha seus dados abaixo. O administrador receberá um aviso para aceitar ou negar o seu perfil.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs font-bold text-red-300">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleRequestAccessSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider font-black text-zinc-400 block">
                  Seu Nome
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={requestName}
                    onChange={(e) => setRequestName(e.target.value)}
                    placeholder="Como você se chama?"
                    required
                    className="w-full bg-[#141416] border border-[#27272a] focus:border-white rounded-xl pl-10 pr-4 py-3.5 text-xs font-bold text-white placeholder-zinc-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider font-black text-zinc-400 block">
                  Seu E-mail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="seuemail@gmail.com"
                    required
                    className="w-full bg-[#141416] border border-[#27272a] focus:border-white rounded-xl pl-10 pr-4 py-3.5 text-xs font-bold text-white placeholder-zinc-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider font-black text-zinc-400 block">
                  Crie sua Senha de Acesso
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={requestPassword}
                    onChange={(e) => setRequestPassword(e.target.value)}
                    placeholder="Mínimo de 4 caracteres"
                    required
                    className="w-full bg-[#141416] border border-[#27272a] focus:border-white rounded-xl pl-10 pr-4 py-3.5 text-xs font-bold text-white placeholder-zinc-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-widest rounded-xl shadow-xl flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50"
              >
                <span>{isLoading ? 'Enviando pedido...' : 'Enviar Solicitação de Acesso'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* =========================================================
            MODO 3: VERIFICAÇÃO DE 2 FATORES (2FA - GOOGLE AUTHENTICATOR)
           ========================================================= */}
        {mode === 'two_factor' && (
          <div className="my-auto py-6 space-y-6 animate-in fade-in duration-150">
            <button
              type="button"
              onClick={() => {
                resetMessages();
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
            MODO 4: ABA ESQUECI MINHA SENHA (POR E-MAIL OU 2FA)
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
            MODO 5: AGUARDANDO APROVAÇÃO DO ADMINISTRADOR (TEMPO REAL)
           ========================================================= */}
        {mode === 'access_pending' && (
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
                  if (res.status === 'approved') {
                    localStorage.removeItem('change_pending_google_email');
                    if (requestPassword.trim()) {
                      const authRes = await loginUserWith2FA(cleanEmail, requestPassword.trim());
                      if (authRes.ok) return;
                    }
                    setMode('access_approved');
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
            MODO 6: ACESSO ACEITO PELO ADMINISTRADOR!
           ========================================================= */}
        {mode === 'access_approved' && (
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
                O administrador aprovou a sua entrada no Change para <strong>{identifier.trim().toLowerCase()}</strong>! Agora basta entrar com a sua senha.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                resetMessages();
                setMode('login');
              }}
              className="w-full py-4 bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-widest rounded-xl shadow-xl flex items-center justify-center gap-2 transition active:scale-98"
            >
              <span>Entrar com Minha Senha Agora</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* =========================================================
            MODO 7: ACESSO NEGADO PELO ADMINISTRADOR (BLOQUEIO TOTAL)
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
