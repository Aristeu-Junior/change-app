import React, { useState } from 'react';
import {
  X,
  UserPlus,
  LogOut,
  Check,
  UserCircle2,
  Cloud,
  ShieldCheck,
  KeyRound,
  Trash2,
  Lock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { isAdminProfile } from '../services/cloudSync';

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({ isOpen, onClose }) => {
  const {
    users,
    currentUser,
    isCurrentUserAdmin,
    adminCreateUser,
    adminDeleteUser,
    changeMyPassword,
    logoutUser,
    cloudStatus
  } = useApp();

  const [mode, setMode] = useState<'profile' | 'admin_create' | 'change_password'>('profile');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newMyPassword, setNewMyPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleAdminCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCurrentUserAdmin) {
      setErrorMsg('Apenas Aristeu e Vitória podem cadastrar novas pessoas.');
      return;
    }
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Preencha o nome, o e-mail/usuário e a senha da pessoa.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);
    const res = await adminCreateUser(name.trim(), email.trim(), password.trim());
    setIsLoading(false);

    if (res.ok) {
      setSuccessMsg(
        `Acesso criado na nuvem para "${name.trim()}"! Login: ${email
          .trim()
          .toLowerCase()} | Senha: ${password.trim()}`
      );
      setName('');
      setEmail('');
      setPassword('');
    } else {
      setErrorMsg(res.error || 'Não foi possível criar o cadastro.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMyPassword.trim() || newMyPassword.trim().length < 4) {
      setErrorMsg('A nova senha deve ter pelo menos 4 caracteres.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);
    const ok = await changeMyPassword(newMyPassword.trim());
    setIsLoading(false);

    if (ok) {
      setSuccessMsg('Sua senha foi atualizada com sucesso na nuvem!');
      setNewMyPassword('');
      setTimeout(() => {
        setSuccessMsg(null);
        setMode('profile');
      }, 1500);
    } else {
      setErrorMsg('Erro ao atualizar a senha. Tente novamente.');
    }
  };

  const guestUsers = users.filter((u) => !isAdminProfile(u));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#121214] border border-[#27272a] rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-white modal-safe-sheet overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <UserCircle2 className="w-5 h-5 text-white" />
            <h2 className="text-base font-bold text-white">
              {mode === 'profile' && 'Minha Conta'}
              {mode === 'admin_create' && 'Cadastrar Novo Convidado'}
              {mode === 'change_password' && 'Alterar Minha Senha'}
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
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs font-semibold text-red-300">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-zinc-800 border border-white/50 text-xs font-bold text-white flex items-start gap-2">
            <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {mode === 'profile' && (
          <div className="space-y-4">
            {/* Cartão da Conta Logada */}
            <div className="p-3.5 rounded-xl bg-[#1c1c1f] border border-[#3f3f46] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] uppercase font-bold text-zinc-400">
                    Sessão Isolada
                  </span>
                  {isCurrentUserAdmin && (
                    <span className="px-1.5 py-0.2 rounded bg-white text-black text-[9px] font-black uppercase">
                      Admin
                    </span>
                  )}
                </div>
                <span className="text-sm font-black text-white block">{currentUser.name}</span>
                <span className="text-xs text-zinc-500">{currentUser.email}</span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="px-2.5 py-1 rounded-full bg-white text-black font-extrabold text-[10px]">
                  Conectado
                </span>
                {cloudStatus === 'synced' && (
                  <span className="flex items-center gap-1 text-[9px] text-zinc-400 font-bold">
                    <Cloud className="w-3 h-3" /> Nuvem Ativa
                  </span>
                )}
              </div>
            </div>

            {/* PAINEL EXCLUSIVO DE ARISTEU E VITÓRIA */}
            {isCurrentUserAdmin ? (
              <div className="p-3.5 rounded-2xl bg-[#18181b] border border-[#27272a] space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <span className="text-xs font-black uppercase tracking-wider text-white">
                    Permissão Exclusiva (Aristeu & Vitória)
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Apenas você e {currentUser.name.toLowerCase().includes('arist') ? 'a Vitória' : 'o Aristeu'} têm permissão para criar acessos para amigos. Os convidados acessam somente os próprios treinos.
                </p>

                <button
                  onClick={() => {
                    setErrorMsg(null);
                    setSuccessMsg(null);
                    setMode('admin_create');
                  }}
                  className="w-full py-3 bg-white text-black font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition"
                >
                  <UserPlus className="w-4 h-4" />
                  Cadastrar Nova Pessoa / Amigo
                </button>

                {/* Lista de amigos cadastrados para gerenciamento */}
                {guestUsers.length > 0 && (
                  <div className="pt-2 border-t border-[#27272a] space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                      Amigos Cadastrados ({guestUsers.length})
                    </span>
                    <div className="max-h-32 overflow-y-auto space-y-1 pr-0.5">
                      {guestUsers.map((g) => (
                        <div
                          key={g.email}
                          className="p-2 rounded-lg bg-[#121214] border border-[#27272a] flex items-center justify-between text-xs"
                        >
                          <div className="min-w-0">
                            <span className="font-bold text-white block truncate">{g.name}</span>
                            <span className="text-[10px] text-zinc-500 block truncate">{g.email}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => adminDeleteUser(g.email)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-red-950/30 transition shrink-0"
                            title="Revogar acesso deste convidado"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-[#18181b] border border-[#27272a] flex items-center gap-2.5 text-xs text-zinc-400">
                <Lock className="w-4 h-4 text-zinc-300 shrink-0" />
                <span>
                  Seus treinos e cargas são privados e salvos exclusivamente no seu perfil na nuvem.
                </span>
              </div>
            )}

            {/* Ações da Própria Conta: Alterar Senha e Sair */}
            <div className="pt-2 border-t border-[#27272a] flex flex-col gap-2">
              <button
                onClick={() => {
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  setMode('change_password');
                }}
                className="w-full py-2.5 bg-[#18181b] hover:bg-[#222226] text-white font-bold text-xs rounded-xl border border-[#27272a] flex items-center justify-center gap-1.5 transition"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Alterar Minha Senha
              </button>

              <button
                onClick={() => {
                  onClose();
                  logoutUser();
                }}
                className="w-full py-2.5 bg-red-950/30 hover:bg-red-950/50 text-red-300 font-bold text-xs rounded-xl border border-red-500/20 flex items-center justify-center gap-1.5 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sair da Conta (Voltar ao Login)
              </button>
            </div>
          </div>
        )}

        {/* MODO ADMIN: CADASTRAR NOVA PESSOA (Exclusivo Aristeu e Vitória) */}
        {mode === 'admin_create' && isCurrentUserAdmin && (
          <form onSubmit={handleAdminCreateUser} className="space-y-3">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Crie o login e a senha para o seu convidado. Ele entrará direto nos próprios treinos vazios e não terá acesso aos seus treinos.
            </p>

            <div>
              <label className="text-xs uppercase text-zinc-400 font-bold block mb-1">
                Nome da Pessoa
              </label>
              <input
                type="text"
                placeholder="Ex: Lucas, Mariana..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="text-xs uppercase text-zinc-400 font-bold block mb-1">
                E-mail ou Usuário de Login
              </label>
              <input
                type="text"
                placeholder="Ex: lucas@email.com ou lucas"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="text-xs uppercase text-zinc-400 font-bold block mb-1">
                Senha de Acesso
              </label>
              <input
                type="text"
                placeholder="Defina a senha para esta pessoa"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
              />
            </div>

            <div className="pt-3 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  setMode('profile');
                }}
                className="flex-1 py-2.5 bg-[#18181b] text-zinc-400 text-xs font-bold rounded-xl"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 bg-white text-black text-xs font-black rounded-xl active:scale-98 transition shadow-md disabled:opacity-50"
              >
                {isLoading ? 'Criando na Nuvem...' : 'Liberar Acesso'}
              </button>
            </div>
          </form>
        )}

        {/* MODO: ALTERAR MINHA SENHA */}
        {mode === 'change_password' && (
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="text-xs uppercase text-zinc-400 font-bold block mb-1">
                Nova Senha de Acesso ({currentUser.name})
              </label>
              <input
                type="password"
                placeholder="Digite sua nova senha"
                value={newMyPassword}
                onChange={(e) => setNewMyPassword(e.target.value)}
                required
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
              />
            </div>

            <div className="pt-3 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  setMode('profile');
                }}
                className="flex-1 py-2.5 bg-[#18181b] text-zinc-400 text-xs font-bold rounded-xl"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 bg-white text-black text-xs font-black rounded-xl active:scale-98 transition shadow-md disabled:opacity-50"
              >
                {isLoading ? 'Salvando...' : 'Salvar Nova Senha'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
