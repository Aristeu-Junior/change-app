import React, { useState } from 'react';
import { Dumbbell, Lock, User, Eye, EyeOff, Sun, Moon, ShieldCheck, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AuthLoginScreen: React.FC = () => {
  const { loginUser, theme, toggleTheme } = useApp();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isLight = theme === 'light';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setErrorMsg('Preencha seu usuário/e-mail e sua senha.');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);
    const result = await loginUser(identifier.trim(), password);
    setIsLoading(false);

    if (!result) {
      setErrorMsg('Usuário/e-mail ou senha incorretos. Verifique seus dados.');
    }
  };

  return (
    <div
      className={`w-full min-h-screen ${
        isLight ? 'bg-[#f4f4f5] text-black' : 'bg-black text-white'
      } flex justify-center transition-colors duration-200`}
    >
      <div
        className={`w-full max-w-md min-h-screen ${
          isLight ? 'bg-white border-zinc-200' : 'bg-black border-[#27272a]/60'
        } border-x flex flex-col justify-between px-6 py-8 relative shadow-2xl transition-colors duration-200`}
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

        {/* Corpo Central estilo Hevy */}
        <div className="my-auto py-8 space-y-7">
          {/* Headline */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#141416] border border-[#27272a] text-[10px] font-black uppercase tracking-wider text-zinc-400">
              <Lock className="w-3 h-3 text-white" />
              <span>Acesso Individual e Isolado</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white leading-tight">
              Bem-vindo ao Change.
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Entre com sua conta exclusiva para acessar seus planos de treino, histórico de cargas reais e evoluções na nuvem.
            </p>
          </div>

          {/* Formulário de Login */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs font-bold text-red-300 animate-in fade-in duration-150">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider font-black text-zinc-400 block">
                E-mail ou Nome de Usuário
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Ex: aristeu, vitoria ou seu@email.com"
                  autoComplete="username"
                  required
                  className="w-full bg-[#141416] border border-[#27272a] focus:border-white rounded-xl pl-10 pr-4 py-3.5 text-xs font-bold text-white placeholder-zinc-500 focus:outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider font-black text-zinc-400 block">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha de acesso"
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
              <span>{isLoading ? 'Autenticando na Nuvem...' : 'Entrar na Minha Conta'}</span>
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>

        {/* Rodapé informativo: Somente Aristeu e Vitória cadastram novos usuários */}
        <div className="pt-4 border-t border-[#27272a] flex items-start gap-2.5 text-left">
          <ShieldCheck className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            <strong>Acesso restrito a convidados:</strong> Novos cadastros são criados exclusivamente pelos administradores (<strong>Aristeu</strong> e <strong>Vitória</strong>). Cada conta acessa apenas os seus próprios treinos.
          </p>
        </div>
      </div>
    </div>
  );
};
