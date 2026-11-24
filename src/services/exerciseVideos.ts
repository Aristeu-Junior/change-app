import { ExerciseVideoMetadata, ExerciseVideoFitMode } from '../types';
import { getSupabaseConfig } from './cloudSync';

const VIDEO_INDEX_SETTING_KEY = 'exercise_videos_index';
const VIDEO_BLOB_PREFIX = 'exercise_video_blob:';
const LOCAL_INDEX_CACHE_KEY = 'change_exercise_videos_index_v1';

// ~2.2 MB Base64 chunks keep every PostgREST request fast and reliable
const CHUNK_CHAR_SIZE = 2_200_000;
const MAX_RAW_FILE_BYTES = 16 * 1024 * 1024; // 16 MB max fallback without transcoding
const MAX_INPUT_FILE_BYTES = 80 * 1024 * 1024; // 80 MB max input before client-side standardization

const memoryBlobUrlCache = new Map<string, { updatedAt: string; objectUrl: string }>();

// IndexedDB helper for caching downloaded video blobs locally across reloads
const IDB_NAME = 'change_exercise_videos_db';
const IDB_STORE = 'video_blobs';

function openVideoCacheDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: 'exercise_id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function getCachedBlobFromIdb(
  exerciseId: string,
  expectedUpdatedAt: string
): Promise<Blob | null> {
  const db = await openVideoCacheDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(exerciseId);
      req.onsuccess = () => {
        const rec = req.result;
        if (rec && rec.updated_at === expectedUpdatedAt && rec.blob instanceof Blob) {
          resolve(rec.blob);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function saveCachedBlobToIdb(
  exerciseId: string,
  updatedAt: string,
  blob: Blob
): Promise<void> {
  const db = await openVideoCacheDb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put({ exercise_id: exerciseId, updated_at: updatedAt, blob });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function deleteCachedBlobFromIdb(exerciseId: string): Promise<void> {
  const mem = memoryBlobUrlCache.get(exerciseId);
  if (mem) {
    URL.revokeObjectURL(mem.objectUrl);
    memoryBlobUrlCache.delete(exerciseId);
  }
  const db = await openVideoCacheDb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(exerciseId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

function buildRestHeaders(anonKey: string, extra?: Record<string, string>) {
  return {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    ...extra
  };
}

export function getCachedExerciseVideosIndex(): Record<string, ExerciseVideoMetadata> {
  try {
    const raw = localStorage.getItem(LOCAL_INDEX_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function setCachedExerciseVideosIndex(index: Record<string, ExerciseVideoMetadata>): void {
  try {
    localStorage.setItem(LOCAL_INDEX_CACHE_KEY, JSON.stringify(index));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Fetches the lightweight global exercise video metadata index from Supabase
 */
export async function fetchExerciseVideosIndexFromCloud(): Promise<
  Record<string, ExerciseVideoMetadata>
> {
  const config = getSupabaseConfig();
  if (!config) return getCachedExerciseVideosIndex();

  try {
    const res = await fetch(
      `${config.url}/rest/v1/change_app_settings?key=eq.${VIDEO_INDEX_SETTING_KEY}&select=value&limit=1`,
      {
        method: 'GET',
        headers: buildRestHeaders(config.anonKey)
      }
    );

    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0 && rows[0]?.value) {
        const parsed = JSON.parse(rows[0].value);
        if (parsed && typeof parsed === 'object') {
          setCachedExerciseVideosIndex(parsed);
          return parsed;
        }
      } else if (Array.isArray(rows) && rows.length === 0) {
        setCachedExerciseVideosIndex({});
        return {};
      }
    }
  } catch {
    // Fallback to local cache when offline
  }

  return getCachedExerciseVideosIndex();
}

async function pushExerciseVideosIndexToCloud(
  index: Record<string, ExerciseVideoMetadata>
): Promise<boolean> {
  const config = getSupabaseConfig();
  if (!config) return false;

  try {
    const res = await fetch(`${config.url}/rest/v1/change_app_settings?on_conflict=key`, {
      method: 'POST',
      headers: buildRestHeaders(config.anonKey, {
        Prefer: 'resolution=merge-duplicates,return=minimal'
      }),
      body: JSON.stringify({
        key: VIDEO_INDEX_SETTING_KEY,
        value: JSON.stringify(index),
        updated_at: new Date().toISOString()
      })
    });

    if (res.ok) {
      setCachedExerciseVideosIndex(index);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Parses and validates YouTube, YouTube Shorts, or direct HTTPS video links
 */
export function parseVideoExternalUrl(rawInput: string): {
  ok: boolean;
  sourceType?: 'youtube' | 'direct_url';
  youtubeId?: string;
  cleanUrl?: string;
  posterUrl?: string;
  error?: string;
} {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { ok: false, error: 'Informe um link válido (YouTube, Shorts ou arquivo MP4/WebM).' };
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmed);
  } catch {
    return {
      ok: false,
      error: 'Formato de link inválido. Use um endereço completo iniciando com https://.'
    };
  }

  if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
    return { ok: false, error: 'O link deve utilizar protocolo seguro https://.' };
  }

  const host = parsedUrl.hostname.toLowerCase().replace(/^www\./, '');

  // YouTube & YouTube Shorts detection
  if (
    host === 'youtube.com' ||
    host === 'm.youtube.com' ||
    host === 'youtu.be' ||
    host === 'youtube-nocookie.com'
  ) {
    let ytId = '';
    if (host === 'youtu.be') {
      ytId = parsedUrl.pathname.split('/').filter(Boolean)[0] || '';
    } else if (parsedUrl.pathname.startsWith('/shorts/')) {
      ytId = parsedUrl.pathname.replace('/shorts/', '').split('/')[0] || '';
    } else if (parsedUrl.pathname.startsWith('/embed/')) {
      ytId = parsedUrl.pathname.replace('/embed/', '').split('/')[0] || '';
    } else {
      ytId = parsedUrl.searchParams.get('v') || '';
    }

    ytId = ytId.replace(/[^a-zA-Z0-9_-]/g, '');
    if (ytId.length === 11) {
      return {
        ok: true,
        sourceType: 'youtube',
        youtubeId: ytId,
        cleanUrl: `https://www.youtube.com/watch?v=${ytId}`,
        posterUrl: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`
      };
    }

    return {
      ok: false,
      error: 'Não foi possível identificar o ID do vídeo do YouTube. Copie o link completo do vídeo ou Short.'
    };
  }

  // Google Drive sharing link -> direct stream helper if applicable, or standard direct MP4/WebM URL
  return {
    ok: true,
    sourceType: 'direct_url',
    cleanUrl: parsedUrl.toString()
  };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = String(reader.result || '');
      const commaIdx = res.indexOf(',');
      resolve(commaIdx >= 0 ? res.slice(commaIdx + 1) : res);
    };
    reader.onerror = () => reject(new Error('Falha ao ler arquivo de vídeo.'));
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType || 'video/mp4' });
}

/**
 * Inspects a local File/Blob in an offscreen <video>, returning duration, dimensions, and a standardized WebP poster
 */
export function inspectLocalVideoFile(file: File | Blob): Promise<{
  durationSec: number;
  width: number;
  height: number;
  posterDataUrl: string;
}> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute('src');
      video.load();
    };

    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('Tempo esgotado ao carregar metadados do vídeo.'));
    }, 15000);

    video.onerror = () => {
      clearTimeout(timeout);
      cleanup();
      reject(new Error('Formato de vídeo não suportado pelo navegador. Prefira MP4 ou WebM.'));
    };

    video.onloadedmetadata = () => {
      const durationSec = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 8;
      const sampleTime = Math.min(Math.max(0.4, durationSec * 0.2), Math.max(0, durationSec - 0.1));
      video.currentTime = sampleTime;
    };

    video.onseeked = () => {
      clearTimeout(timeout);
      try {
        const vw = video.videoWidth || 640;
        const vh = video.videoHeight || 360;
        const maxThumb = 420;
        const scale = Math.min(1, maxThumb / Math.max(vw, vh));
        const tw = Math.max(2, Math.round(vw * scale));
        const th = Math.max(2, Math.round(vh * scale));

        const canvas = document.createElement('canvas');
        canvas.width = tw;
        canvas.height = th;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, tw, th);
        }
        let posterDataUrl = canvas.toDataURL('image/webp', 0.72);
        if (!posterDataUrl.startsWith('data:image/webp')) {
          posterDataUrl = canvas.toDataURL('image/jpeg', 0.72);
        }

        const durationSec = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 8;
        cleanup();
        resolve({
          durationSec: Math.round(durationSec * 10) / 10,
          width: vw,
          height: vh,
          posterDataUrl
        });
      } catch {
        cleanup();
        resolve({
          durationSec: 8,
          width: 640,
          height: 360,
          posterDataUrl: ''
        });
      }
    };

    video.src = objectUrl;
  });
}

function pickSupportedRecorderMimeType(): string | null {
  if (typeof MediaRecorder === 'undefined') return null;
  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4;codecs=avc1',
    'video/mp4'
  ];
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return null;
}

/**
 * Standardizes an uploaded video file in the browser:
 * - Normalizes resolution up to 720p HD with even dimensions
 * - Removes audio track completely (silent gym loop, never interrupts Spotify/Apple Music)
 * - Trims dead start/end seconds (max 16s clean execution loop)
 * - Compresses to ~1.5-3.0 MB for instant global loading
 */
export async function standardizeVideoBlobInBrowser(
  file: File,
  options: {
    trimStartSec: number;
    trimEndSec: number;
    fitMode: ExerciseVideoFitMode;
    standardize720p: boolean;
    onProgress?: (percent: number, stageLabel: string) => void;
  }
): Promise<{
  blob: Blob;
  mimeType: string;
  durationSec: number;
  posterDataUrl: string;
  wasTranscoded: boolean;
}> {
  if (file.size > MAX_INPUT_FILE_BYTES) {
    throw new Error('O arquivo excede 80 MB. Escolha um vídeo mais curto da execução.');
  }

  options.onProgress?.(5, 'Analisando vídeo...');
  const info = await inspectLocalVideoFile(file);

  const startSec = Math.max(0, Math.min(options.trimStartSec || 0, Math.max(0, info.durationSec - 0.5)));
  const requestedEnd =
    options.trimEndSec && options.trimEndSec > startSec + 0.5
      ? Math.min(options.trimEndSec, info.durationSec)
      : info.durationSec;

  // Standardized clean execution loop max 16s when transcoding
  const effectiveEnd = Math.min(requestedEnd, startSec + 16);
  const clipDuration = Math.max(0.8, effectiveEnd - startSec);

  const recorderMime = pickSupportedRecorderMimeType();
  const canCaptureCanvas =
    typeof HTMLCanvasElement !== 'undefined' &&
    typeof HTMLCanvasElement.prototype.captureStream === 'function' &&
    Boolean(recorderMime);

  const needsTranscode =
    options.standardize720p || file.size > MAX_RAW_FILE_BYTES || file.name.toLowerCase().endsWith('.mov');

  if (!needsTranscode || !canCaptureCanvas) {
    if (file.size > MAX_RAW_FILE_BYTES) {
      throw new Error(
        'Este vídeo é muito grande (>16 MB) e seu navegador não suporta compressão automática. Envie um clipe mais curto (até 15s).'
      );
    }
    return {
      blob: file,
      mimeType: file.type || 'video/mp4',
      durationSec: Math.round(clipDuration * 10) / 10,
      posterDataUrl: info.posterDataUrl,
      wasTranscoded: false
    };
  }

  // Transcode via Canvas + MediaRecorder (720p HD, 24fps, silent, standardized 16:9 or original clean aspect)
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    // Target standardized 16:9 HD frame (960x540 crisp & fast) so ALL uploaded videos share the exact same frame!
    const targetW = 960;
    const targetH = 540;

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d', { alpha: false });

    if (!ctx || !recorderMime) {
      URL.revokeObjectURL(objectUrl);
      resolve({
        blob: file,
        mimeType: file.type || 'video/mp4',
        durationSec: info.durationSec,
        posterDataUrl: info.posterDataUrl,
        wasTranscoded: false
      });
      return;
    }

    let rafId = 0;
    let settled = false;

    const cleanup = () => {
      if (rafId) cancelAnimationFrame(rafId);
      video.pause();
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute('src');
      video.load();
    };

    const drawStandardizedFrame = () => {
      const vw = video.videoWidth || targetW;
      const vh = video.videoHeight || targetH;

      // Clean dark background
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, targetW, targetH);

      if (options.fitMode === 'cover') {
        const scale = Math.max(targetW / vw, targetH / vh);
        const dw = vw * scale;
        const dh = vh * scale;
        const dx = (targetW - dw) / 2;
        const dy = (targetH - dh) / 2;
        ctx.drawImage(video, dx, dy, dw, dh);
      } else {
        // Subtle ambient backdrop for vertical/square videos + crisp centered video
        const bgScale = Math.max(targetW / vw, targetH / vh) * 1.08;
        const bgW = vw * bgScale;
        const bgH = vh * bgScale;
        ctx.save();
        ctx.globalAlpha = 0.22;
        ctx.filter = 'blur(18px)';
        ctx.drawImage(video, (targetW - bgW) / 2, (targetH - bgH) / 2, bgW, bgH);
        ctx.restore();

        const scale = Math.min(targetW / vw, targetH / vh);
        const dw = vw * scale;
        const dh = vh * scale;
        const dx = (targetW - dw) / 2;
        const dy = (targetH - dh) / 2;
        ctx.drawImage(video, dx, dy, dw, dh);
      }
    };

    video.onerror = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('Não foi possível processar este arquivo de vídeo.'));
    };

    video.onloadeddata = () => {
      video.currentTime = startSec;
    };

    video.onseeked = () => {
      if (settled) return;
      drawStandardizedFrame();

      // Capture standardized poster from the actual standardized canvas!
      let standardizedPoster = canvas.toDataURL('image/webp', 0.75);
      if (!standardizedPoster.startsWith('data:image/webp')) {
        standardizedPoster = canvas.toDataURL('image/jpeg', 0.75);
      }

      const stream = canvas.captureStream(24);
      const chunks: BlobPart[] = [];
      let recorder: MediaRecorder;

      try {
        recorder = new MediaRecorder(stream, {
          mimeType: recorderMime,
          videoBitsPerSecond: 1_750_000 // ~1.75 Mbps crisp & compact
        });
      } catch {
        recorder = new MediaRecorder(stream);
      }

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          chunks.push(ev.data);
        }
      };

      recorder.onstop = () => {
        if (settled) return;
        settled = true;
        cleanup();
        const finalMime = recorder.mimeType || recorderMime || 'video/webm';
        const outBlob = new Blob(chunks, { type: finalMime });
        if (outBlob.size < 1024) {
          // Fallback to original if browser produced empty recording
          resolve({
            blob: file,
            mimeType: file.type || 'video/mp4',
            durationSec: info.durationSec,
            posterDataUrl: standardizedPoster || info.posterDataUrl,
            wasTranscoded: false
          });
          return;
        }
        resolve({
          blob: outBlob,
          mimeType: finalMime,
          durationSec: Math.round(clipDuration * 10) / 10,
          posterDataUrl: standardizedPoster || info.posterDataUrl,
          wasTranscoded: true
        });
      };

      const renderLoop = () => {
        if (settled) return;
        drawStandardizedFrame();
        const elapsed = Math.max(0, video.currentTime - startSec);
        const pct = Math.min(68, Math.round(10 + (elapsed / clipDuration) * 58));
        options.onProgress?.(pct, 'Padronizando enquadramento e removendo ruído...');

        if (video.currentTime >= effectiveEnd || video.ended) {
          if (recorder.state !== 'inactive') {
            recorder.stop();
          }
          return;
        }
        rafId = requestAnimationFrame(renderLoop);
      };

      video.onended = () => {
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
      };

      recorder.start(250);
      video.play().then(() => {
        rafId = requestAnimationFrame(renderLoop);
      }).catch(() => {
        if (recorder.state !== 'inactive') recorder.stop();
      });
    };

    // Only attach seek handler once
    let firstSeekHandled = false;
    const origOnSeeked = video.onseeked;
    video.onseeked = (ev) => {
      if (firstSeekHandled) return;
      firstSeekHandled = true;
      origOnSeeked?.call(video, ev);
    };

    video.src = objectUrl;
  });
}

async function deleteBlobChunksFromCloud(exerciseId: string, maxChunks = 10): Promise<void> {
  const config = getSupabaseConfig();
  if (!config) return;

  const keys = Array.from({ length: maxChunks }, (_, i) => `${VIDEO_BLOB_PREFIX}${exerciseId}:${i}`);
  const inList = keys.map((k) => `"${k}"`).join(',');

  try {
    await fetch(
      `${config.url}/rest/v1/change_app_settings?key=in.(${encodeURIComponent(inList)})`,
      {
        method: 'DELETE',
        headers: buildRestHeaders(config.anonKey)
      }
    );
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Saves an uploaded video Blob for an exercise globally to Supabase (chunked in change_app_settings)
 */
export async function saveUploadedExerciseVideoToCloud(params: {
  exerciseId: string;
  blob: Blob;
  mimeType: string;
  durationSec: number;
  posterDataUrl: string;
  fitMode: ExerciseVideoFitMode;
  trimStartSec?: number;
  trimEndSec?: number;
  updatedBy?: string;
  onProgress?: (percent: number, stageLabel: string) => void;
}): Promise<{ ok: boolean; metadata?: ExerciseVideoMetadata; error?: string }> {
  const config = getSupabaseConfig();
  if (!config) {
    return { ok: false, error: 'Banco em nuvem não configurado.' };
  }

  try {
    params.onProgress?.(72, 'Preparando envio para a nuvem...');
    const base64 = await blobToBase64(params.blob);
    const chunks: string[] = [];
    for (let i = 0; i < base64.length; i += CHUNK_CHAR_SIZE) {
      chunks.push(base64.slice(i, i + CHUNK_CHAR_SIZE));
    }

    if (chunks.length > 8) {
      return {
        ok: false,
        error: 'O vídeo final ultrapassou o limite permitido. Reduza o tempo do corte para até 15 segundos.'
      };
    }

    const nowIso = new Date().toISOString();

    // Clean any old chunks beyond new chunk count
    await deleteBlobChunksFromCloud(params.exerciseId, 10);

    for (let idx = 0; idx < chunks.length; idx++) {
      const pct = Math.round(75 + ((idx + 1) / chunks.length) * 20);
      params.onProgress?.(pct, `Enviando vídeo padronizado (${idx + 1}/${chunks.length})...`);

      const res = await fetch(`${config.url}/rest/v1/change_app_settings?on_conflict=key`, {
        method: 'POST',
        headers: buildRestHeaders(config.anonKey, {
          Prefer: 'resolution=merge-duplicates,return=minimal'
        }),
        body: JSON.stringify({
          key: `${VIDEO_BLOB_PREFIX}${params.exerciseId}:${idx}`,
          value: chunks[idx],
          updated_at: nowIso
        })
      });

      if (!res.ok) {
        return { ok: false, error: 'Falha ao gravar o vídeo na nuvem. Tente novamente.' };
      }
    }

    const latestIndex = await fetchExerciseVideosIndexFromCloud();
    const metadata: ExerciseVideoMetadata = {
      exercise_id: params.exerciseId,
      source_type: 'cloud_blob',
      chunk_count: chunks.length,
      mime_type: params.mimeType || 'video/webm',
      fit_mode: params.fitMode,
      trim_start_sec: params.trimStartSec,
      trim_end_sec: params.trimEndSec,
      poster_data_url: params.posterDataUrl,
      duration_sec: params.durationSec,
      updated_by: params.updatedBy,
      updated_at: nowIso
    };

    const nextIndex = {
      ...latestIndex,
      [params.exerciseId]: metadata
    };

    params.onProgress?.(98, 'Atualizando catálogo global...');
    const indexSaved = await pushExerciseVideosIndexToCloud(nextIndex);
    if (!indexSaved) {
      return { ok: false, error: 'Não foi possível atualizar o índice global de vídeos.' };
    }

    // Cache locally immediately for 0ms playback
    await saveCachedBlobToIdb(params.exerciseId, nowIso, params.blob);
    const prevMem = memoryBlobUrlCache.get(params.exerciseId);
    if (prevMem) URL.revokeObjectURL(prevMem.objectUrl);
    memoryBlobUrlCache.set(params.exerciseId, {
      updatedAt: nowIso,
      objectUrl: URL.createObjectURL(params.blob)
    });

    params.onProgress?.(100, 'Concluído!');
    return { ok: true, metadata };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || 'Erro inesperado ao salvar vídeo na nuvem.'
    };
  }
}

/**
 * Saves an external video link (YouTube, Shorts, or direct MP4/WebM) globally to Supabase
 */
export async function saveExternalExerciseVideoToCloud(params: {
  exerciseId: string;
  rawUrl: string;
  fitMode: ExerciseVideoFitMode;
  trimStartSec?: number;
  trimEndSec?: number;
  updatedBy?: string;
}): Promise<{ ok: boolean; metadata?: ExerciseVideoMetadata; error?: string }> {
  const parsed = parseVideoExternalUrl(params.rawUrl);
  if (!parsed.ok || !parsed.sourceType) {
    return { ok: false, error: parsed.error || 'Link inválido.' };
  }

  const nowIso = new Date().toISOString();

  // Remove any previously uploaded cloud blob chunks for this exercise
  await deleteBlobChunksFromCloud(params.exerciseId, 10);
  await deleteCachedBlobFromIdb(params.exerciseId);

  const latestIndex = await fetchExerciseVideosIndexFromCloud();
  const metadata: ExerciseVideoMetadata = {
    exercise_id: params.exerciseId,
    source_type: parsed.sourceType,
    video_url: parsed.cleanUrl,
    youtube_id: parsed.youtubeId,
    fit_mode: params.fitMode,
    trim_start_sec:
      params.trimStartSec && params.trimStartSec > 0 ? params.trimStartSec : undefined,
    trim_end_sec: params.trimEndSec && params.trimEndSec > 0 ? params.trimEndSec : undefined,
    poster_data_url: parsed.posterUrl,
    updated_by: params.updatedBy,
    updated_at: nowIso
  };

  const nextIndex = {
    ...latestIndex,
    [params.exerciseId]: metadata
  };

  const ok = await pushExerciseVideosIndexToCloud(nextIndex);
  if (!ok) {
    return { ok: false, error: 'Erro ao salvar o link do vídeo na nuvem.' };
  }

  return { ok: true, metadata };
}

/**
 * Updates only the standardization metadata (fit_mode, trim_start_sec, trim_end_sec) of an existing cloud video
 */
export async function updateExerciseVideoSettingsInCloud(
  exerciseId: string,
  updates: {
    fitMode: ExerciseVideoFitMode;
    trimStartSec?: number;
    trimEndSec?: number;
    updatedBy?: string;
  }
): Promise<{ ok: boolean; metadata?: ExerciseVideoMetadata; error?: string }> {
  const latestIndex = await fetchExerciseVideosIndexFromCloud();
  const existing = latestIndex[exerciseId];
  if (!existing) {
    return { ok: false, error: 'Vídeo original não encontrado na nuvem.' };
  }

  const updatedMeta: ExerciseVideoMetadata = {
    ...existing,
    fit_mode: updates.fitMode,
    trim_start_sec:
      updates.trimStartSec && updates.trimStartSec > 0 ? updates.trimStartSec : undefined,
    trim_end_sec:
      updates.trimEndSec && updates.trimEndSec > 0 ? updates.trimEndSec : undefined,
    updated_by: updates.updatedBy || existing.updated_by
  };

  const nextIndex = {
    ...latestIndex,
    [exerciseId]: updatedMeta
  };

  const ok = await pushExerciseVideosIndexToCloud(nextIndex);
  if (!ok) {
    return { ok: false, error: 'Não foi possível atualizar as configurações do vídeo.' };
  }

  return { ok: true, metadata: updatedMeta };
}

/**
 * Removes the custom video from an exercise globally
 */
export async function removeExerciseVideoFromCloud(exerciseId: string): Promise<boolean> {
  await deleteBlobChunksFromCloud(exerciseId, 10);
  await deleteCachedBlobFromIdb(exerciseId);

  const latestIndex = await fetchExerciseVideosIndexFromCloud();
  if (!latestIndex[exerciseId]) return true;

  const nextIndex = { ...latestIndex };
  delete nextIndex[exerciseId];

  return pushExerciseVideosIndexToCloud(nextIndex);
}

/**
 * Resolves a playable URL for a `cloud_blob` video (using memory -> IndexedDB -> Supabase chunks)
 */
export async function resolveCloudBlobVideoUrl(
  meta: ExerciseVideoMetadata
): Promise<string | null> {
  if (meta.source_type !== 'cloud_blob') {
    return meta.video_url || null;
  }

  const cachedMem = memoryBlobUrlCache.get(meta.exercise_id);
  if (cachedMem && cachedMem.updatedAt === meta.updated_at) {
    return cachedMem.objectUrl;
  }

  const idbBlob = await getCachedBlobFromIdb(meta.exercise_id, meta.updated_at);
  if (idbBlob) {
    const objUrl = URL.createObjectURL(idbBlob);
    memoryBlobUrlCache.set(meta.exercise_id, {
      updatedAt: meta.updated_at,
      objectUrl: objUrl
    });
    return objUrl;
  }

  const config = getSupabaseConfig();
  if (!config) return null;

  const chunkCount = Math.max(1, meta.chunk_count || 1);
  const keys = Array.from(
    { length: chunkCount },
    (_, i) => `${VIDEO_BLOB_PREFIX}${meta.exercise_id}:${i}`
  );
  const inList = keys.map((k) => `"${k}"`).join(',');

  try {
    const res = await fetch(
      `${config.url}/rest/v1/change_app_settings?key=in.(${encodeURIComponent(inList)})&select=key,value`,
      {
        method: 'GET',
        headers: buildRestHeaders(config.anonKey)
      }
    );

    if (!res.ok) return null;
    const rows = (await res.json()) as { key: string; value: string }[];
    if (!Array.isArray(rows) || rows.length === 0) return null;

    const byKey = new Map(rows.map((r) => [r.key, r.value]));
    let combinedBase64 = '';
    for (let i = 0; i < chunkCount; i++) {
      const part = byKey.get(`${VIDEO_BLOB_PREFIX}${meta.exercise_id}:${i}`);
      if (!part) return null;
      combinedBase64 += part;
    }

    const blob = base64ToBlob(combinedBase64, meta.mime_type || 'video/webm');
    await saveCachedBlobToIdb(meta.exercise_id, meta.updated_at, blob);

    const objUrl = URL.createObjectURL(blob);
    memoryBlobUrlCache.set(meta.exercise_id, {
      updatedAt: meta.updated_at,
      objectUrl: objUrl
    });
    return objUrl;
  } catch {
    return null;
  }
}
