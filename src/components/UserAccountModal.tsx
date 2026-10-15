import React, { useState } from 'react';
import { X, UserPlus, LogIn, Users, Check, UserCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({ isOpen, onClose }) => {
  const { users, currentUser, registerUser, loginUser, switchUser } = useApp();

  const [mode, setMode] = useState<'profile' | 'login' | 'register'>('profile');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const ok = registerUser(name, email, password);
    if (ok) {
      setErrorMsg(null);
      setName('');
      setEmail('');
      setPassword('');
      setMode('profile');
      onClose();
    } else {
      setErrorMsg('Este e-mail já está cadastrado.');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    const ok = loginUser(email, password);
    if (ok) {
      setErrorMsg(null);
      setEmail('');
      setPassword('');
      setMode('profile');
      onClose();
    } else {
      setErrorMsg('E-mail ou senha incorretos.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#121214] border border-[#27272a] rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <UserCircle2 className="w-5 h-5 text-white" />
            <h2 className="text-base font-bold text-white">
              {mode === 'profile' && 'Perfis de Acesso'}
              {mode === 'login' && 'Entrar na Conta'}
              {mode === 'register' && 'Cadastrar Novo Atleta'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-xs font-semibold text-red-300">
            {errorMsg}
          </div>
        )}

        {mode === 'profile' && (
          <div className="space-y-4">
            {/* Current Active User Card */}
            <div className="p-3.5 rounded-xl bg-[#1c1c1f] border border-[#3f3f46] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Atleta Ativo</span>
                <span className="text-sm font-black text-white block">{currentUser.name}</span>
                <span className="text-xs text-zinc-500">{currentUser.email}</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-white text-black font-extrabold text-[10px]">
                Ativo
              </span>
            </div>

            {/* List of Registered Users */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                Alternar Usuário Neste Aparelho
              </span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {users.map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => switchUser(u.id)}
                      className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition ${
                        isCurrent
                          ? 'bg-[#27272a] border-white text-white'
                          : 'bg-[#18181b] border-[#27272a] text-zinc-300 hover:bg-[#222226]'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold block">{u.name}</span>
                        <span className="text-[10px] text-zinc-500">{u.email}</span>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-[#27272a] flex flex-col gap-2">
              <button
                onClick={() => {
                  setErrorMsg(null);
                  setMode('register');
                }}
                className="w-full py-3 bg-white text-black font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition"
              >
                <UserPlus className="w-4 h-4" />
                Cadastrar Nova Pessoa
              </button>

              <button
                onClick={() => {
                  setErrorMsg(null);
                  setMode('login');
                }}
                className="w-full py-2.5 bg-[#18181b] hover:bg-[#222226] text-white font-semibold text-xs rounded-xl border border-[#27272a] flex items-center justify-center gap-1.5 transition"
              >
                <LogIn className="w-4 h-4" />
                Acessar com Outro E-mail
              </button>
            </div>
          </div>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="text-xs uppercase text-zinc-400 font-bold block mb-1">
                Nome Completo ou Apelido
              </label>
              <input
                type="text"
                placeholder="Ex: Carlos Treinador"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="text-xs uppercase text-zinc-400 font-bold block mb-1">
                E-mail
              </label>
              <input
                type="email"
                placeholder="carlos@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="text-xs uppercase text-zinc-400 font-bold block mb-1">
                Senha / PIN (Opcional)
              </label>
              <input
                type="password"
                placeholder="Criar senha de acesso"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
              />
            </div>

            <div className="pt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setMode('profile')}
                className="flex-1 py-2.5 bg-[#18181b] text-zinc-400 text-xs font-bold rounded-xl"
              >
                Voltar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-white text-black text-xs font-black rounded-xl active:scale-98 transition shadow-md"
              >
                Cadastrar
              </button>
            </div>
          </form>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="text-xs uppercase text-zinc-400 font-bold block mb-1">
                E-mail Cadastrado
              </label>
              <input
                type="email"
                placeholder="Digite seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="text-xs uppercase text-zinc-400 font-bold block mb-1">
                Senha
              </label>
              <input
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
              />
            </div>

            <div className="pt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setMode('profile')}
                className="flex-1 py-2.5 bg-[#18181b] text-zinc-400 text-xs font-bold rounded-xl"
              >
                Voltar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-white text-black text-xs font-black rounded-xl active:scale-98 transition shadow-md"
              >
                Entrar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
