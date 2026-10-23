import React, { useState, useEffect } from 'react';
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
  Lock,
  Smartphone,
  Copy,
  ExternalLink,
  Mail
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { isAdminProfile } from '../services/cloudSync';
import {
  generateTotpSecret,
  formatTotpSecret,
  getTotpUri,
  verifyTotpCode
} from '../utils/totp';

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AccountModalMode = 'profile' | 'edit_credentials' | 'two_factor' | 'admin_create';

export const UserAccountModal: React.FC<UserAccountModalProps> = ({ isOpen, onClose }) => {
  const {
    users,
    currentUser,
    isCurrentUserAdmin,
    accessRequests,
    refreshAccessRequests,
    adminDecideAccessRequest,
    adminCreateUser,
    adminDeleteUser,
    refreshCloudUsers,
    updateMyProfile,
    configureMyTotp,
    logoutUser,
    cloudStatus
  } = useApp();

  const [mode, setMode] = useState<AccountModalMode>('profile');

  // Estados para criar novo convidado (Admin)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Estados para editar próprio cadastro (Nome, E-mail Google e Senha)
  const [editName, setEditName] = useState(currentUser.name);
  const [editEmail, setEditEmail] = useState(currentUser.email);
  const [editNewPassword, setEditNewPassword] = useState('');

  // Estados para 2FA (TOTP)
  const [pendingTotpSecret, setPendingTotpSecret] = useState<string>('');
  const [totpVerifyCode, setTotpVerifyCode] = useState<string>('');
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Estado para confirmação de exclusão de conta pelo Admin
  const [confirmDeleteEmail, setConfirmDeleteEmail] = useState<string | null>(null);
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);
  const [decidingEmail, setDecidingEmail] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEditName(currentUser.name);
      setEditEmail(currentUser.email);
      setEditNewPassword('');
      setConfirmDeleteEmail(null);
      setErrorMsg(null);
      setSuccessMsg(null);
      if (isCurrentUserAdmin) {
        refreshCloudUsers();
        refreshAccessRequests();
      }
    }
  }, [isOpen, currentUser.name, currentUser.email, isCurrentUserAdmin]);

  if (!isOpen) return null;

  const resetMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // 1. Admin: Criar novo convidado
  const handleAdminCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCurrentUserAdmin) {
      setErrorMsg('Apenas Aristeu e Vitória podem cadastrar novas pessoas.');
      return;
    }
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Preencha o nome, o e-mail e a senha da pessoa.');
      return;
    }

    resetMessages();
    setIsLoading(true);
    const res = await adminCreateUser(name.trim(), email.trim(), password.trim());
    setIsLoading(false);

    if (res.ok) {
      setSuccessMsg(
        `Acesso criado na nuvem para "${name.trim()}"! E-mail: ${email
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

  // 2. Atualizar Próprio Cadastro (Nome, E-mail Google e Senha)
  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editEmail.trim() || !editEmail.includes('@')) {
      setErrorMsg('Informe um nome e um endereço de e-mail válido (ex: seuemail@gmail.com).');
      return;
    }
    if (editNewPassword.trim() && editNewPassword.trim().length < 4) {
      setErrorMsg('A nova senha deve ter pelo menos 4 caracteres.');
      return;
    }

    resetMessages();
    setIsLoading(true);
    const res = await updateMyProfile(
      editName.trim(),
      editEmail.trim().toLowerCase(),
      editNewPassword.trim() || undefined
    );
    setIsLoading(false);

    if (res.ok) {
      setSuccessMsg('Seus dados de cadastro foram atualizados com sucesso na nuvem!');
      setEditNewPassword('');
      setTimeout(() => {
        setSuccessMsg(null);
        setMode('profile');
      }, 1500);
    } else {
      setErrorMsg(res.error || 'Erro ao atualizar seus dados. Tente novamente.');
    }
  };

  // 3. Configurar Autenticação de 2 Fatores (2FA)
  const handleStart2FASetup = () => {
    resetMessages();
    const newSecret = generateTotpSecret(16);
    setPendingTotpSecret(newSecret);
    setTotpVerifyCode('');
    setMode('two_factor');
  };

  const handleConfirmEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingTotpSecret) return;

    resetMessages();
    const isValid = await verifyTotpCode(pendingTotpSecret, totpVerifyCode);
    if (!isValid) {
      setErrorMsg('Código de 6 dígitos inválido. Verifique o horário do celular e o código no app autenticador.');
      return;
    }

    setIsLoading(true);
    const ok = await configureMyTotp(pendingTotpSecret, true);
    setIsLoading(false);

    if (ok) {
      setSuccessMsg('Autenticação de 2 Fatores (2FA) ativada com sucesso!');
      setPendingTotpSecret('');
      setTotpVerifyCode('');
      setTimeout(() => {
        setSuccessMsg(null);
        setMode('profile');
      }, 1400);
    } else {
      setErrorMsg('Erro ao salvar o 2FA na nuvem.');
    }
  };

  const handleDisable2FA = async () => {
    resetMessages();
    setIsLoading(true);
    const ok = await configureMyTotp(null, false);
    setIsLoading(false);
    if (ok) {
      setSuccessMsg('Autenticação de 2 Fatores (2FA) desativada.');
    } else {
      setErrorMsg('Não foi possível desativar o 2FA.');
    }
  };

  const handleCopyTotpSecret = async () => {
    try {
      await navigator.clipboard.writeText(pendingTotpSecret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } catch {
      // Ignore
    }
  };

  const guestUsers = users.filter((u) => !isAdminProfile(u));

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#121214] border border-[#27272a] rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-white modal-safe-sheet overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <UserCircle2 className="w-5 h-5 text-white" />
            <h2 className="text-base font-bold text-white">
              {mode === 'profile' && 'Minha Conta'}
              {mode === 'edit_credentials' && 'Alterar Cadastro (E-mail e Senha)'}
              {mode === 'two_factor' && 'Segurança de 2 Fatores (2FA)'}
              {mode === 'admin_create' && 'Cadastrar Novo Convidado'}
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
          <div className="p-3 rounded-xl bg-zinc-900 border border-white/40 text-xs font-bold text-white flex items-start gap-2">
            <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* =========================================================
            MODO 1: VISÃO GERAL DA CONTA
           ========================================================= */}
        {mode === 'profile' && (
          <div className="space-y-4">
            {/* Cartão da Conta Ativa */}
            <div className="p-4 rounded-2xl bg-[#18181b] border border-[#27272a] flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-full bg-white text-black font-black flex items-center justify-center text-base shadow-md shrink-0">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-white truncate">
                      {currentUser.name}
                    </span>
                    {isCurrentUserAdmin && (
                      <span className="px-1.5 py-0.5 rounded bg-white text-black text-[9px] font-black uppercase shrink-0">
                        Admin
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-400 block truncate">{currentUser.email}</span>
                </div>
              </div>

              {cloudStatus === 'synced' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-zinc-800 text-zinc-200 shrink-0">
                  <Cloud className="w-3 h-3" /> Nuvem
                </span>
              )}
            </div>

            {/* Aviso caso ainda esteja com e-mail provisório @change.app */}
            {currentUser.email.endsWith('@change.app') && (
              <div className="p-3 rounded-xl bg-[#18181b] border border-white/30 text-[11px] text-zinc-300 space-y-1.5">
                <span className="font-black text-white flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Vincule seu E-mail do Google
                </span>
                <p className="text-zinc-400 leading-relaxed">
                  Toque em <strong>Alterar Meu E-mail / Senha</strong> abaixo para cadastrar seu Gmail pessoal e liberar o login com Google e recuperação de senha por e-mail.
                </p>
              </div>
            )}

            {/* Ações da Própria Conta */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  resetMessages();
                  setMode('edit_credentials');
                }}
                className="w-full py-3 px-4 bg-[#18181b] hover:bg-[#222226] border border-[#27272a] rounded-xl text-xs font-bold text-white flex items-center justify-between transition"
              >
                <span className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-zinc-400" />
                  Alterar Meu E-mail / Senha
                </span>
                <span className="text-zinc-500">→</span>
              </button>

              {/* Botão de Autenticação de 2 Fatores (2FA) */}
              <div className="p-3 bg-[#18181b] border border-[#27272a] rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Smartphone className="w-4 h-4 text-white shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block">
                      Autenticação de 2 Fatores (2FA)
                    </span>
                    <span className="text-[10px] text-zinc-400 block">
                      {currentUser.totp_enabled
                        ? 'Ativa (Google Authenticator / Senhas)'
                        : 'Desativada • Proteção extra no login'}
                    </span>
                  </div>
                </div>

                {currentUser.totp_enabled ? (
                  <button
                    onClick={handleDisable2FA}
                    disabled={isLoading}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-red-950/60 text-zinc-300 hover:text-red-300 border border-zinc-700 text-[10px] font-bold transition shrink-0"
                  >
                    Desativar
                  </button>
                ) : (
                  <button
                    onClick={handleStart2FASetup}
                    className="px-3 py-1.5 rounded-lg bg-white text-black font-black text-[10px] uppercase tracking-wider hover:bg-zinc-200 transition shrink-0"
                  >
                    Ativar 2FA
                  </button>
                )}
              </div>

              {/* Botão Exclusivo para Aristeu e Vitória: Cadastrar Amigos */}
              {isCurrentUserAdmin && (
                <button
                  onClick={() => {
                    resetMessages();
                    setMode('admin_create');
                  }}
                  className="w-full py-3.5 px-4 bg-white hover:bg-zinc-200 text-black rounded-xl text-xs font-black flex items-center justify-center gap-2 transition shadow-md active:scale-98"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Cadastrar Nova Pessoa / Amigo</span>
                </button>
              )}
            </div>

            {/* Solicitações de Acesso Google (Pendentes e Negadas) — Exclusivo Admin */}
            {isCurrentUserAdmin && accessRequests.length > 0 && (
              <div className="pt-2 border-t border-[#27272a] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-black text-white">
                    Solicitações Google ({accessRequests.length})
                  </span>
                  <span className="text-[10px] text-zinc-400">Aceitar ou Negar</span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {accessRequests.map((req) => {
                    const isPending = req.account_status === 'pending';
                    const isBusy = decidingEmail === req.email;

                    return (
                      <div
                        key={req.user_id || req.email}
                        className={`p-2.5 rounded-xl border flex flex-col gap-2 text-xs ${
                          isPending
                            ? 'bg-[#18181b] border-white/40'
                            : 'bg-[#141416] border-red-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-white truncate">{req.name}</span>
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase shrink-0 ${
                                  isPending
                                    ? 'bg-white text-black'
                                    : 'bg-red-950/70 text-red-300 border border-red-500/30'
                                }`}
                              >
                                {isPending ? 'Aguardando' : 'Negado'}
                              </span>
                            </div>
                            <span className="text-[10px] text-zinc-400 truncate block">
                              {req.email}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={async () => {
                                resetMessages();
                                setDecidingEmail(req.email);
                                const ok = await adminDecideAccessRequest(req.email, 'approved');
                                setDecidingEmail(null);
                                if (ok) {
                                  setSuccessMsg(`Acesso de "${req.name}" (${req.email}) ACEITO!`);
                                } else {
                                  setErrorMsg('Não foi possível aprovar esta solicitação.');
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black text-[10px] font-black transition"
                            >
                              Aceitar
                            </button>

                            {isPending ? (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={async () => {
                                  resetMessages();
                                  setDecidingEmail(req.email);
                                  const ok = await adminDecideAccessRequest(req.email, 'rejected');
                                  setDecidingEmail(null);
                                  if (ok) {
                                    setSuccessMsg(
                                      `Acesso de "${req.name}" (${req.email}) foi NEGADO.`
                                    );
                                  } else {
                                    setErrorMsg('Não foi possível negar esta solicitação.');
                                  }
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-500/30 text-[10px] font-black transition"
                              >
                                Negar
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={async () => {
                                  resetMessages();
                                  setDecidingEmail(req.email);
                                  await adminDeleteUser(req.email, req.user_id);
                                  setDecidingEmail(null);
                                  setSuccessMsg(
                                    `Solicitação de "${req.name}" excluída definitivamente.`
                                  );
                                }}
                                className="p-1.5 rounded-lg bg-[#222226] hover:bg-red-950/60 text-zinc-400 hover:text-red-300 transition"
                                title="Excluir definitivamente do banco de dados"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Lista de Convidados Cadastrados (Visível apenas para Aristeu e Vitória) */}
            {isCurrentUserAdmin && (
              <div className="pt-2 border-t border-[#27272a] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-black text-zinc-400">
                    Pessoas Cadastradas ({users.length})
                  </span>
                  <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Painel Admin
                  </span>
                </div>

                <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                  {users.map((u) => {
                    const isAdmin = isAdminProfile(u);
                    const isConfirming = confirmDeleteEmail === u.email;
                    const isDeleting = deletingEmail === u.email;

                    return (
                      <div
                        key={u.id}
                        className="p-2.5 rounded-xl bg-[#18181b] border border-[#27272a] flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white truncate">{u.name}</span>
                            {isAdmin && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold shrink-0">
                                Admin
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-500 truncate block">{u.email}</span>
                        </div>

                        {!isAdmin && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isConfirming ? (
                              <>
                                <button
                                  type="button"
                                  disabled={isDeleting}
                                  onClick={async () => {
                                    resetMessages();
                                    setDeletingEmail(u.email);
                                    const ok = await adminDeleteUser(u.email, u.id);
                                    setDeletingEmail(null);
                                    setConfirmDeleteEmail(null);
                                    if (ok) {
                                      setSuccessMsg(
                                        `A conta de "${u.name}" foi removida do sistema e excluída do banco de dados!`
                                      );
                                    } else {
                                      setErrorMsg(
                                        'Não foi possível excluir esta conta do banco de dados.'
                                      );
                                    }
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[10px] font-black transition"
                                >
                                  {isDeleting ? 'Excluindo...' : 'Confirmar'}
                                </button>
                                <button
                                  type="button"
                                  disabled={isDeleting}
                                  onClick={() => setConfirmDeleteEmail(null)}
                                  className="px-2 py-1.5 rounded-lg bg-[#27272a] text-zinc-300 text-[10px] font-bold hover:text-white transition"
                                >
                                  Cancelar
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteEmail(u.email)}
                                className="px-2.5 py-1.5 text-zinc-300 hover:text-red-300 bg-[#222226] hover:bg-red-950/50 border border-[#27272a] hover:border-red-500/30 rounded-lg transition flex items-center gap-1 text-[10px] font-bold"
                                title="Remover conta do sistema e do banco de dados"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Remover</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {guestUsers.length === 0 && (
                    <p className="text-[11px] text-zinc-500 italic text-center py-1">
                      Nenhum amigo convidado cadastrado ainda.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Botão de Sair da Conta (Logout) */}
            <div className="pt-2 border-t border-[#27272a]">
              <button
                onClick={() => {
                  onClose();
                  logoutUser();
                }}
                className="w-full py-3 bg-[#18181b] hover:bg-red-950/40 border border-[#27272a] hover:border-red-500/30 text-zinc-300 hover:text-red-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair da Minha Conta</span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================================
            MODO 2: ALTERAR CADASTRO (NOME, E-MAIL GOOGLE E SENHA)
           ========================================================= */}
        {mode === 'edit_credentials' && (
          <form onSubmit={handleUpdateCredentials} className="space-y-3.5">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Atualize seu nome, cadastre seu <strong>e-mail do Google (Gmail)</strong> para login rápido e recuperação de senha, ou defina uma nova senha.
            </p>

            <div>
              <label className="text-[11px] uppercase text-zinc-400 font-bold mb-1 block">
                Seu Nome
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase text-zinc-400 font-bold mb-1 block">
                Seu E-mail Pessoal (Google / Gmail)
              </label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="seuemail@gmail.com"
                required
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase text-zinc-400 font-bold mb-1 block">
                Nova Senha (Opcional — deixe em branco para manter a atual)
              </label>
              <input
                type="password"
                value={editNewPassword}
                onChange={(e) => setEditNewPassword(e.target.value)}
                placeholder="Digite apenas se quiser trocar a senha"
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  resetMessages();
                  setMode('profile');
                }}
                className="flex-1 py-2.5 bg-[#18181b] hover:bg-[#27272a] text-zinc-300 font-bold text-xs rounded-xl transition"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 bg-white text-black font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition"
              >
                <Check className="w-4 h-4" />
                <span>{isLoading ? 'Salvando...' : 'Salvar Dados'}</span>
              </button>
            </div>
          </form>
        )}

        {/* =========================================================
            MODO 3: CONFIGURAR AUTENTICAÇÃO DE 2 FATORES (2FA TOTP)
           ========================================================= */}
        {mode === 'two_factor' && (
          <form onSubmit={handleConfirmEnable2FA} className="space-y-4">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Adicione a chave abaixo ao seu <strong>Google Authenticator</strong>, <strong>Apple Senhas</strong> ou <strong>Authy</strong> e digite o código de 6 dígitos gerado:
            </p>

            {/* Botão 1-Toque para abrir direto no App Autenticador do Celular */}
            <a
              href={getTotpUri(currentUser.email, pendingTotpSecret)}
              className="w-full py-3 px-4 bg-white text-black font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md hover:bg-zinc-200 transition"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Adicionar com 1 Toque no Celular</span>
            </a>

            {/* Chave Secreta Copiável */}
            <div className="p-3 bg-[#18181b] border border-[#27272a] rounded-xl space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                Ou copie a Chave de Configuração Manual:
              </span>
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs font-black tracking-widest text-white select-all">
                  {formatTotpSecret(pendingTotpSecret)}
                </code>
                <button
                  type="button"
                  onClick={handleCopyTotpSecret}
                  className="px-2.5 py-1 rounded-lg bg-[#27272a] hover:bg-zinc-700 text-[10px] font-bold text-white flex items-center gap-1 shrink-0"
                >
                  {copiedSecret ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSecret ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase text-zinc-400 font-bold mb-1 block">
                Digite o Código de 6 Dígitos do App Autenticador
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={totpVerifyCode}
                onChange={(e) => setTotpVerifyCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                required
                className="w-full bg-[#18181b] border border-[#27272a] focus:border-white rounded-xl py-3 text-center text-lg font-black tracking-[0.4em] text-white placeholder-zinc-600 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  resetMessages();
                  setMode('profile');
                }}
                className="flex-1 py-2.5 bg-[#18181b] hover:bg-[#27272a] text-zinc-300 font-bold text-xs rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 bg-white text-black font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition"
              >
                <Check className="w-4 h-4" />
                <span>{isLoading ? 'Ativando...' : 'Confirmar 2FA'}</span>
              </button>
            </div>
          </form>
        )}

        {/* =========================================================
            MODO 4: CADASTRAR NOVO AMIGO (EXCLUSIVO ADMIN)
           ========================================================= */}
        {mode === 'admin_create' && isCurrentUserAdmin && (
          <form onSubmit={handleAdminCreateUser} className="space-y-3.5">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Crie um login e senha exclusivos para um amigo. Ele terá os treinos, histórico e ranking salvos separadamente.
            </p>

            <div>
              <label className="text-[11px] uppercase text-zinc-400 font-bold mb-1 block">
                Nome da Pessoa
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Gabriel, Lucas, Mariana..."
                required
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase text-zinc-400 font-bold mb-1 block">
                E-mail (Google / Gmail ou Login)
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: amigo@gmail.com"
                required
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase text-zinc-400 font-bold mb-1 block">
                Senha Inicial de Acesso
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Defina a senha para enviar a ele(a)"
                  required
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  resetMessages();
                  setMode('profile');
                }}
                className="flex-1 py-2.5 bg-[#18181b] hover:bg-[#27272a] text-zinc-300 font-bold text-xs rounded-xl transition"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 bg-white text-black font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition"
              >
                <Check className="w-4 h-4" />
                <span>{isLoading ? 'Criando...' : 'Criar Acesso'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
