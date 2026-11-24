import React, { useState, useEffect, useId, useRef } from 'react';
import {
  X,
  Upload,
  Link2,
  Check,
  Trash2,
  Sparkles,
  Film,
  Scissors,
  AlertCircle
} from 'lucide-react';
import {
  ExerciseTemplate,
  ExerciseVideoFitMode,
  ExerciseVideoMetadata
} from '../types';
import { useApp } from '../context/AppContext';
import {
  inspectLocalVideoFile,
  parseVideoExternalUrl,
  standardizeVideoBlobInBrowser,
  saveUploadedExerciseVideoToCloud,
  saveExternalExerciseVideoToCloud,
  updateExerciseVideoSettingsInCloud,
  removeExerciseVideoFromCloud
} from '../services/exerciseVideos';
import { StandardExerciseVideoPlayer } from './StandardExerciseVideoPlayer';
import { triggerHaptic } from '../utils/calc';

interface ExerciseVideoManagerModalProps {
  exercise: ExerciseTemplate;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (meta: ExerciseVideoMetadata | null) => void;
}

export const ExerciseVideoManagerModal: React.FC<ExerciseVideoManagerModalProps> = ({
  exercise,
  isOpen,
  onClose,
  onSaved
}) => {
  const {
    currentUser,
    isCurrentUserAdmin,
    getExerciseVideo,
    upsertExerciseVideoLocal,
    removeExerciseVideoLocal
  } = useApp();

  const existingVideo = getExerciseVideo(exercise.id) || exercise.video_meta;
  const uid = useId();
  const headingId = `${uid}-heading`;
  const urlInputId = `${uid}-url`;
  const urlHelpId = `${uid}-url-help`;
  const fileInputId = `${uid}-file`;
  const trimStartId = `${uid}-trim-start`;
  const trimEndId = `${uid}-trim-end`;
  const autoStandardizeId = `${uid}-auto-std`;

  const [mode, setMode] = useState<'upload' | 'link'>(() =>
    existingVideo && existingVideo.source_type !== 'cloud_blob' ? 'link' : 'upload'
  );
  const [fitMode, setFitMode] = useState<ExerciseVideoFitMode>(
    existingVideo?.fit_mode || 'contain'
  );
  const [trimStartStr, setTrimStartStr] = useState<string>(
    existingVideo?.trim_start_sec ? String(existingVideo.trim_start_sec) : '0'
  );
  const [trimEndStr, setTrimEndStr] = useState<string>(
    existingVideo?.trim_end_sec ? String(existingVideo.trim_end_sec) : ''
  );

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [localPoster, setLocalPoster] = useState<string>('');
  const [localDuration, setLocalDuration] = useState<number | null>(null);
  const [autoStandardize, setAutoStandardize] = useState<boolean>(true);

  // External link state
  const [externalUrl, setExternalUrl] = useState<string>(
    existingVideo && existingVideo.source_type !== 'cloud_blob'
      ? existingVideo.video_url || ''
      : ''
  );
  const [urlTouched, setUrlTouched] = useState<boolean>(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  // Submission & progress state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [progressPct, setProgressPct] = useState<number>(0);
  const [progressStage, setProgressStage] = useState<string>('');
  const [statusError, setStatusError] = useState<string | null>(null);

  const urlInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const latest = getExerciseVideo(exercise.id) || exercise.video_meta;
    setMode(latest && latest.source_type !== 'cloud_blob' ? 'link' : 'upload');
    setFitMode(latest?.fit_mode || 'contain');
    setTrimStartStr(latest?.trim_start_sec ? String(latest.trim_start_sec) : '0');
    setTrimEndStr(latest?.trim_end_sec ? String(latest.trim_end_sec) : '');
    setExternalUrl(
      latest && latest.source_type !== 'cloud_blob' ? latest.video_url || '' : ''
    );
    setSelectedFile(null);
    setLocalPreviewUrl(null);
    setLocalPoster('');
    setLocalDuration(null);
    setUrlTouched(false);
    setUrlError(null);
    setStatusError(null);
    setIsSubmitting(false);
    setProgressPct(0);
    setProgressStage('');
  }, [isOpen, exercise.id]);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  if (!isOpen || !isCurrentUserAdmin) return null;

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusError(null);
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }

    const objUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setLocalPreviewUrl(objUrl);

    try {
      const info = await inspectLocalVideoFile(file);
      setLocalDuration(info.durationSec);
      setLocalPoster(info.posterDataUrl);
      setTrimStartStr('0');
      setTrimEndStr(String(Math.min(15, Math.ceil(info.durationSec))));
    } catch (err: any) {
      setStatusError(
        err?.message || 'Não foi possível ler os metadados deste vídeo, mas você pode tentar enviá-lo.'
      );
    }
  };

  const validateUrlField = (val: string) => {
    const parsed = parseVideoExternalUrl(val);
    if (!parsed.ok) {
      setUrlError(parsed.error || 'Link inválido.');
      return null;
    }
    setUrlError(null);
    return parsed;
  };

  const handleUrlBlur = () => {
    if (!externalUrl.trim() && !urlTouched) return;
    setUrlTouched(true);
    validateUrlField(externalUrl);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setExternalUrl(val);
    setStatusError(null);
    if (urlError) {
      const res = parseVideoExternalUrl(val);
      if (res.ok) setUrlError(null);
    }
  };

  const parsedStart = Math.max(0, parseFloat(trimStartStr) || 0);
  const parsedEndRaw = parseFloat(trimEndStr);
  const parsedEnd =
    Number.isFinite(parsedEndRaw) && parsedEndRaw > parsedStart + 0.4
      ? parsedEndRaw
      : undefined;

  // Build live standardized preview metadata
  const buildLivePreviewMeta = (): {
    meta: ExerciseVideoMetadata | null;
    previewBlob?: string | null;
  } => {
    if (mode === 'upload') {
      if (selectedFile && localPreviewUrl) {
        return {
          meta: {
            exercise_id: exercise.id,
            source_type: 'direct_url',
            video_url: localPreviewUrl,
            fit_mode: fitMode,
            trim_start_sec: parsedStart,
            trim_end_sec: parsedEnd,
            poster_data_url: localPoster,
            updated_at: 'preview'
          },
          previewBlob: localPreviewUrl
        };
      }
      if (existingVideo && existingVideo.source_type === 'cloud_blob') {
        return {
          meta: {
            ...existingVideo,
            fit_mode: fitMode,
            trim_start_sec: parsedStart,
            trim_end_sec: parsedEnd
          }
        };
      }
      return { meta: null };
    }

    // Link mode
    const parsed = parseVideoExternalUrl(externalUrl);
    if (parsed.ok && parsed.sourceType) {
      return {
        meta: {
          exercise_id: exercise.id,
          source_type: parsed.sourceType,
          video_url: parsed.cleanUrl,
          youtube_id: parsed.youtubeId,
          fit_mode: fitMode,
          trim_start_sec: parsedStart,
          trim_end_sec: parsedEnd,
          poster_data_url: parsed.posterUrl,
          updated_at: 'preview-link'
        }
      };
    }

    return { meta: null };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setStatusError(null);

    if (mode === 'link') {
      setUrlTouched(true);
      const parsed = validateUrlField(externalUrl);
      if (!parsed) {
        urlInputRef.current?.focus();
        return;
      }

      setIsSubmitting(true);
      setProgressPct(50);
      setProgressStage('Salvando vídeo padronizado na nuvem...');

      const res = await saveExternalExerciseVideoToCloud({
        exerciseId: exercise.id,
        rawUrl: externalUrl,
        fitMode,
        trimStartSec: parsedStart,
        trimEndSec: parsedEnd,
        updatedBy: currentUser.name
      });

      setIsSubmitting(false);
      if (!res.ok || !res.metadata) {
        setStatusError(res.error || 'Erro ao salvar o link do vídeo.');
        return;
      }

      upsertExerciseVideoLocal(res.metadata);
      triggerHaptic('success');
      onSaved?.(res.metadata);
      onClose();
      return;
    }

    // Upload mode
    if (!selectedFile) {
      // If editing fit_mode / trim of an already uploaded video without re-uploading
      if (existingVideo && existingVideo.source_type === 'cloud_blob') {
        setIsSubmitting(true);
        setProgressPct(60);
        setProgressStage('Atualizando padronização...');
        const res = await updateExerciseVideoSettingsInCloud(exercise.id, {
          fitMode,
          trimStartSec: parsedStart,
          trimEndSec: parsedEnd,
          updatedBy: currentUser.name
        });
        setIsSubmitting(false);
        if (!res.ok || !res.metadata) {
          setStatusError(res.error || 'Erro ao atualizar a padronização do vídeo.');
          return;
        }
        upsertExerciseVideoLocal(res.metadata);
        triggerHaptic('success');
        onSaved?.(res.metadata);
        onClose();
        return;
      }

      setStatusError('Selecione um arquivo de vídeo (MP4, MOV ou WebM) do seu aparelho.');
      return;
    }

    try {
      setIsSubmitting(true);
      setProgressPct(5);
      setProgressStage('Iniciando padronização...');

      const standardized = await standardizeVideoBlobInBrowser(selectedFile, {
        trimStartSec: parsedStart,
        trimEndSec: parsedEnd || localDuration || 15,
        fitMode,
        standardize720p: autoStandardize,
        onProgress: (pct, label) => {
          setProgressPct(pct);
          setProgressStage(label);
        }
      });

      const res = await saveUploadedExerciseVideoToCloud({
        exerciseId: exercise.id,
        blob: standardized.blob,
        mimeType: standardized.mimeType,
        durationSec: standardized.durationSec,
        posterDataUrl: standardized.posterDataUrl,
        fitMode: standardized.wasTranscoded ? 'contain' : fitMode,
        trimStartSec: standardized.wasTranscoded ? undefined : parsedStart,
        trimEndSec: standardized.wasTranscoded ? undefined : parsedEnd,
        updatedBy: currentUser.name,
        onProgress: (pct, label) => {
          setProgressPct(pct);
          setProgressStage(label);
        }
      });

      setIsSubmitting(false);
      if (!res.ok || !res.metadata) {
        setStatusError(res.error || 'Falha ao enviar o vídeo para a nuvem.');
        return;
      }

      upsertExerciseVideoLocal(res.metadata);
      triggerHaptic('success');
      onSaved?.(res.metadata);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setStatusError(err?.message || 'Erro ao padronizar ou enviar o vídeo.');
    }
  };

  const handleRemoveVideo = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setProgressPct(50);
    setProgressStage('Removendo vídeo da nuvem...');

    const ok = await removeExerciseVideoFromCloud(exercise.id);
    setIsSubmitting(false);

    if (!ok) {
      setStatusError('Não foi possível remover o vídeo agora. Verifique sua conexão.');
      return;
    }

    removeExerciseVideoLocal(exercise.id);
    triggerHaptic('medium');
    onSaved?.(null);
    onClose();
  };

  const livePreview = buildLivePreviewMeta();

  return (
    <div
      className="fixed inset-0 z-[160] flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-150 text-white"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-[#121214] border border-[#27272a] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-4 pb-3 border-b border-[#27272a] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center shrink-0 shadow">
              <Film className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                Vídeo Padronizado Global (Admin)
              </span>
              <h2 id={headingId} className="text-sm font-black text-white truncate">
                {exercise.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition shrink-0"
            aria-label="Fechar gerenciador de vídeo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Semantic Form */}
        <form
          method="POST"
          action="#save-exercise-video"
          aria-labelledby={headingId}
          onSubmit={handleSubmit}
          className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4"
        >
          {/* 1. Origem do Vídeo (Radio Group <fieldset> + <legend>) */}
          <fieldset className="space-y-2">
            <legend className="text-[11px] font-black uppercase tracking-wider text-zinc-400 mb-1.5">
              Como deseja adicionar o vídeo?
            </legend>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <input
                  type="radio"
                  id={`${uid}-mode-upload`}
                  name="video_source_mode"
                  value="upload"
                  checked={mode === 'upload'}
                  onChange={() => {
                    setMode('upload');
                    setStatusError(null);
                  }}
                  className="sr-only peer"
                />
                <label
                  htmlFor={`${uid}-mode-upload`}
                  className="min-h-12 px-3 py-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition peer-focus-visible:ring-2 peer-focus-visible:ring-white peer-checked:bg-white peer-checked:text-black peer-checked:border-white bg-[#18181b] text-zinc-300 border-[#27272a] hover:border-zinc-500"
                >
                  <Upload className="w-4 h-4 shrink-0" />
                  <span>Upload (MP4/MOV)</span>
                </label>
              </div>

              <div className="relative">
                <input
                  type="radio"
                  id={`${uid}-mode-link`}
                  name="video_source_mode"
                  value="link"
                  checked={mode === 'link'}
                  onChange={() => {
                    setMode('link');
                    setStatusError(null);
                  }}
                  className="sr-only peer"
                />
                <label
                  htmlFor={`${uid}-mode-link`}
                  className="min-h-12 px-3 py-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition peer-focus-visible:ring-2 peer-focus-visible:ring-white peer-checked:bg-white peer-checked:text-black peer-checked:border-white bg-[#18181b] text-zinc-300 border-[#27272a] hover:border-zinc-500"
                >
                  <Link2 className="w-4 h-4 shrink-0" />
                  <span>Link / YouTube</span>
                </label>
              </div>
            </div>
          </fieldset>

          {/* 2. Entrada de Arquivo OU Link */}
          {mode === 'upload' ? (
            <div className="space-y-2.5">
              <label
                htmlFor={fileInputId}
                className="text-[11px] font-black uppercase tracking-wider text-zinc-300 block"
              >
                Arquivo de Vídeo do Celular ou Computador
              </label>

              <label
                htmlFor={fileInputId}
                className="w-full min-h-20 p-4 rounded-2xl border border-dashed border-zinc-600 hover:border-white bg-[#18181b] hover:bg-[#1e1e22] transition cursor-pointer flex flex-col items-center justify-center text-center gap-1.5"
              >
                <Upload className="w-5 h-5 text-zinc-300" />
                <span className="text-xs font-bold text-white">
                  {selectedFile
                    ? `${selectedFile.name} (${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)`
                    : existingVideo?.source_type === 'cloud_blob'
                    ? 'Vídeo já salvo na nuvem • Toque para substituir'
                    : 'Toque para escolher um vídeo (MP4, MOV, WebM)'}
                </span>
                <span className="text-[11px] text-zinc-400">
                  Ideal: 1 a 3 repetições limpas (até 15 segundos)
                </span>
              </label>
              <input
                id={fileInputId}
                name="video_file"
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/*"
                onChange={handleFileSelected}
                className="sr-only"
              />

              {/* Auto-standardization toggle */}
              <div className="p-3 rounded-xl bg-[#18181b] border border-[#27272a] flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id={autoStandardizeId}
                  name="auto_standardize"
                  checked={autoStandardize}
                  onChange={(e) => setAutoStandardize(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-white rounded shrink-0"
                />
                <label htmlFor={autoStandardizeId} className="text-xs leading-snug cursor-pointer">
                  <strong className="text-white flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Padronização Automática de Estúdio (Recomendado)
                  </strong>
                  <span className="text-[11px] text-zinc-400 block mt-0.5">
                    Converte para quadro 16:9 HD uniforme, remove o áudio ambiente (não pausa o
                    Spotify do aluno) e comprime para carregamento instantâneo.
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label
                htmlFor={urlInputId}
                className="text-[11px] font-black uppercase tracking-wider text-zinc-300 block"
              >
                Link do Vídeo (YouTube, Shorts ou MP4 direto) *
              </label>
              <input
                ref={urlInputRef}
                id={urlInputId}
                name="video_url"
                type="url"
                value={externalUrl}
                onChange={handleUrlChange}
                onBlur={handleUrlBlur}
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                enterKeyHint="done"
                aria-invalid={Boolean(urlError)}
                aria-describedby={urlHelpId}
                placeholder="https://youtube.com/shorts/... ou https://.../execucao.mp4"
                style={{ fontSize: 'max(1rem, 16px)' }}
                className={`w-full min-h-12 bg-[#18181b] border rounded-xl px-3.5 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-white transition ${
                  urlError ? 'border-red-500' : 'border-[#27272a] focus:border-white'
                }`}
              />
              <span
                id={urlHelpId}
                className={`text-[11px] block ${urlError ? 'text-red-400 font-bold' : 'text-zinc-400'}`}
              >
                {urlError ||
                  'Aceita vídeos normais do YouTube, YouTube Shorts ou links diretos .mp4 / .webm.'}
              </span>
            </div>
          )}

          {/* 3. Padronização de Enquadramento & Corte de Loop */}
          <div className="p-3.5 rounded-2xl bg-[#18181b] border border-[#27272a] space-y-3">
            <fieldset className="space-y-1.5">
              <legend className="text-[11px] font-black uppercase tracking-wider text-zinc-400 mb-1">
                Enquadramento Padrão no Player
              </legend>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="radio"
                    id={`${uid}-fit-contain`}
                    name="fit_mode"
                    value="contain"
                    checked={fitMode === 'contain'}
                    onChange={() => setFitMode('contain')}
                    className="sr-only peer"
                  />
                  <label
                    htmlFor={`${uid}-fit-contain`}
                    className="min-h-10 px-3 py-2 rounded-xl border text-[11px] font-bold flex items-center justify-center cursor-pointer transition peer-checked:bg-white peer-checked:text-black peer-checked:border-white bg-[#121214] text-zinc-300 border-[#27272a]"
                  >
                    Inteiro Centralizado
                  </label>
                </div>
                <div>
                  <input
                    type="radio"
                    id={`${uid}-fit-cover`}
                    name="fit_mode"
                    value="cover"
                    checked={fitMode === 'cover'}
                    onChange={() => setFitMode('cover')}
                    className="sr-only peer"
                  />
                  <label
                    htmlFor={`${uid}-fit-cover`}
                    className="min-h-10 px-3 py-2 rounded-xl border text-[11px] font-bold flex items-center justify-center cursor-pointer transition peer-checked:bg-white peer-checked:text-black peer-checked:border-white bg-[#121214] text-zinc-300 border-[#27272a]"
                  >
                    Preencher Quadro (Zoom)
                  </label>
                </div>
              </div>
            </fieldset>

            {/* Corte de Início / Fim do Loop */}
            <div className="pt-2 border-t border-[#27272a] space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-zinc-300" />
                Corte do Loop Limpo (Opcional, em segundos)
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label htmlFor={trimStartId} className="text-[11px] font-semibold text-zinc-400 block">
                    Início (seg)
                  </label>
                  <input
                    id={trimStartId}
                    name="trim_start_sec"
                    type="text"
                    inputMode="decimal"
                    value={trimStartStr}
                    onChange={(e) => setTrimStartStr(e.target.value)}
                    placeholder="0"
                    style={{ fontSize: 'max(1rem, 16px)' }}
                    className="w-full min-h-11 bg-[#121214] border border-[#27272a] focus:border-white rounded-xl px-3 py-1.5 text-white font-bold focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor={trimEndId} className="text-[11px] font-semibold text-zinc-400 block">
                    Fim (seg) {localDuration ? `(máx ${localDuration}s)` : ''}
                  </label>
                  <input
                    id={trimEndId}
                    name="trim_end_sec"
                    type="text"
                    inputMode="decimal"
                    value={trimEndStr}
                    onChange={(e) => setTrimEndStr(e.target.value)}
                    placeholder="Até o final"
                    style={{ fontSize: 'max(1rem, 16px)' }}
                    className="w-full min-h-11 bg-[#121214] border border-[#27272a] focus:border-white rounded-xl px-3 py-1.5 text-white font-bold focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 4. Pré-visualização Padronizada em Tempo Real */}
          {livePreview.meta && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block">
                Pré-visualização Padronizada (Como todos verão)
              </span>
              <StandardExerciseVideoPlayer
                videoMeta={livePreview.meta}
                exerciseTitle={exercise.title}
                previewBlobUrl={livePreview.previewBlob}
              />
            </div>
          )}

          {/* Barra de Progresso */}
          {isSubmitting && (
            <div role="status" aria-live="polite" className="p-3 rounded-xl bg-[#18181b] border border-[#27272a] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-white">{progressStage}</span>
                <span className="text-zinc-400 tabular-nums">{progressPct}%</span>
              </div>
              <progress
                value={progressPct}
                max={100}
                className="w-full h-2 rounded-full overflow-hidden accent-white"
              />
            </div>
          )}

          {/* Mensagem de Erro */}
          {statusError && (
            <div
              role="alert"
              aria-live="assertive"
              className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs font-semibold flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{statusError}</span>
            </div>
          )}

          {/* Ações */}
          <div className="pt-2 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onClose}
                className="flex-1 min-h-12 py-3 bg-[#18181b] hover:bg-[#222226] text-zinc-300 font-bold text-xs rounded-2xl transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 min-h-12 py-3 bg-white hover:bg-zinc-200 disabled:opacity-60 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl active:scale-98 transition flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{isSubmitting ? 'Processando...' : 'Salvar Vídeo Padrão'}</span>
              </button>
            </div>

            {existingVideo && !isSubmitting && (
              <button
                type="button"
                onClick={handleRemoveVideo}
                className="w-full min-h-11 py-2.5 rounded-xl border border-red-500/25 text-red-400 hover:bg-red-500/10 font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remover Vídeo Oficial deste Exercício</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
