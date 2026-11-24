import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Maximize2, Minimize2, Gauge, AlertCircle } from 'lucide-react';
import { ExerciseVideoMetadata, ExerciseVideoFitMode } from '../types';
import { resolveCloudBlobVideoUrl } from '../services/exerciseVideos';

interface StandardExerciseVideoPlayerProps {
  videoMeta: ExerciseVideoMetadata;
  exerciseTitle: string;
  /** Optional direct object URL when previewing an unsaved upload inside the Admin modal */
  previewBlobUrl?: string | null;
  /** Set true only when rendered below the fold in long lists */
  lazy?: boolean;
}

export const StandardExerciseVideoPlayer: React.FC<StandardExerciseVideoPlayerProps> = ({
  videoMeta,
  exerciseTitle,
  previewBlobUrl,
  lazy = false
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [resolvedUrl, setResolvedUrl] = useState<string | null>(previewBlobUrl || null);
  const [isLoading, setIsLoading] = useState<boolean>(videoMeta.source_type !== 'youtube');
  const [hasError, setHasError] = useState<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  const [isPlaying, setIsPlaying] = useState<boolean>(() => !prefersReducedMotion);
  const [playbackRate, setPlaybackRate] = useState<1 | 0.5>(1);
  const [fitMode, setFitMode] = useState<ExerciseVideoFitMode>(videoMeta.fit_mode || 'contain');
  const [isNearViewport, setIsNearViewport] = useState<boolean>(() => !lazy);

  useEffect(() => {
    setFitMode(videoMeta.fit_mode || 'contain');
  }, [videoMeta.fit_mode, videoMeta.exercise_id]);

  // Listen to prefers-reduced-motion OS changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (ev: MediaQueryListEvent) => {
      setPrefersReducedMotion(ev.matches);
      if (ev.matches && videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    };
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  // Progressive fallback IntersectionObserver when lazy=true and native HTMLMediaElement.prototype.loading is unavailable
  useEffect(() => {
    if (!lazy) {
      setIsNearViewport(true);
      return;
    }
    const supportsNativeLazyMedia =
      typeof HTMLMediaElement !== 'undefined' &&
      Object.hasOwn(HTMLMediaElement.prototype, 'loading');

    if (supportsNativeLazyMedia) {
      setIsNearViewport(true);
      return;
    }

    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsNearViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsNearViewport(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin: '200px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [lazy]);

  // Resolve playable URL (preview override -> direct URL -> Supabase chunks + IndexedDB cache)
  useEffect(() => {
    let cancelled = false;

    if (previewBlobUrl) {
      setResolvedUrl(previewBlobUrl);
      setHasError(false);
      setIsLoading(false);
      return;
    }

    if (videoMeta.source_type === 'youtube') {
      setResolvedUrl(null);
      setHasError(!videoMeta.youtube_id);
      setIsLoading(false);
      return;
    }

    if (!isNearViewport) return;

    setIsLoading(true);
    setHasError(false);

    resolveCloudBlobVideoUrl(videoMeta).then((url) => {
      if (cancelled) return;
      if (!url) {
        setHasError(true);
        setIsLoading(false);
        return;
      }
      setResolvedUrl(url);
    });

    return () => {
      cancelled = true;
    };
  }, [
    previewBlobUrl,
    videoMeta.exercise_id,
    videoMeta.source_type,
    videoMeta.video_url,
    videoMeta.youtube_id,
    videoMeta.updated_at,
    isNearViewport
  ]);

  // Sync playbackRate on HTML5 <video>
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, resolvedUrl]);

  const trimStart = Math.max(0, videoMeta.trim_start_sec || 0);
  const trimEnd =
    videoMeta.trim_end_sec && videoMeta.trim_end_sec > trimStart + 0.4
      ? videoMeta.trim_end_sec
      : undefined;

  const handleLoadedMetadata = () => {
    const vid = videoRef.current;
    setIsLoading(false);
    if (!vid) return;

    vid.playbackRate = playbackRate;
    if (trimStart > 0 && vid.currentTime < trimStart) {
      vid.currentTime = trimStart;
    }

    if (!prefersReducedMotion) {
      vid
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      vid.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (trimEnd && vid.currentTime >= trimEnd) {
      vid.currentTime = trimStart;
      if (isPlaying) {
        vid.play().catch(() => {});
      }
    }
  };

  const togglePlayPause = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    } else {
      vid.pause();
      setIsPlaying(false);
    }
  };

  const toggleSlowMotion = () => {
    setPlaybackRate((prev) => (prev === 1 ? 0.5 : 1));
  };

  const toggleFitMode = () => {
    setFitMode((prev) => (prev === 'contain' ? 'cover' : 'contain'));
  };

  // Standardized YouTube / Shorts Clean Loop Player
  if (videoMeta.source_type === 'youtube' && videoMeta.youtube_id && !previewBlobUrl) {
    const ytParams = new URLSearchParams({
      autoplay: prefersReducedMotion ? '0' : '1',
      mute: '1',
      loop: '1',
      playlist: videoMeta.youtube_id,
      controls: '0',
      modestbranding: '1',
      rel: '0',
      playsinline: '1',
      iv_load_policy: '3',
      disablekb: '1'
    });
    if (trimStart > 0) ytParams.set('start', String(Math.floor(trimStart)));
    if (trimEnd) ytParams.set('end', String(Math.ceil(trimEnd)));

    const embedSrc = `https://www.youtube-nocookie.com/embed/${videoMeta.youtube_id}?${ytParams.toString()}`;

    return (
      <div
        ref={containerRef}
        className="relative w-full h-64 sm:h-72 rounded-xl overflow-hidden bg-[#09090b] border border-white/10 flex items-center justify-center select-none"
      >
        {/* Ambient blurred poster backdrop for cohesive studio look */}
        {videoMeta.poster_data_url && (
          <img
            src={videoMeta.poster_data_url}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover opacity-25 blur-xl scale-110 pointer-events-none"
          />
        )}

        <div
          className={`relative z-10 w-full h-full overflow-hidden flex items-center justify-center ${
            fitMode === 'cover' ? 'scale-[1.32]' : ''
          } transition-transform duration-200`}
        >
          <iframe
            src={embedSrc}
            title={`Vídeo de execução: ${exerciseTitle}`}
            width="960"
            height="540"
            loading={lazy ? 'lazy' : undefined}
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            className="w-full h-full border-0 pointer-events-auto"
          />
        </div>

        {/* Top-left standardized badge */}
        <div className="absolute top-2.5 left-2.5 z-20 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/15 flex items-center gap-1.5 pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-black tracking-wider uppercase text-white">
            Execução Oficial
          </span>
        </div>

        {/* Fit mode toggle for Shorts vs Landscape */}
        <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleFitMode}
            className="px-2.5 py-1.5 rounded-lg bg-black/80 hover:bg-black text-white border border-white/15 text-[10px] font-black flex items-center gap-1 backdrop-blur-md transition active:scale-95"
            title={fitMode === 'contain' ? 'Preencher quadro' : 'Ajustar vídeo inteiro'}
          >
            {fitMode === 'contain' ? (
              <>
                <Maximize2 className="w-3 h-3" />
                <span>Zoom</span>
              </>
            ) : (
              <>
                <Minimize2 className="w-3 h-3" />
                <span>Ajustar</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Standardized HTML5 <video> Studio Player (Uploaded Cloud Blob or Direct MP4/WebM)
  return (
    <div
      ref={containerRef}
      className="relative w-full h-64 sm:h-72 rounded-xl overflow-hidden bg-[#09090b] border border-white/10 flex items-center justify-center select-none group"
    >
      {/* Subtle ambient blurred poster backdrop so vertical/square videos look uniform */}
      {videoMeta.poster_data_url && fitMode === 'contain' && (
        <img
          src={videoMeta.poster_data_url}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-25 blur-xl scale-110 pointer-events-none"
        />
      )}

      {/* Loading overlay */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/75 backdrop-blur-xs space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          <span className="text-[11px] font-bold text-zinc-300">Carregando vídeo padronizado...</span>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950 p-4 text-center space-y-1.5">
          <AlertCircle className="w-6 h-6 text-zinc-400" />
          <p className="text-xs font-bold text-zinc-300">Não foi possível carregar este vídeo.</p>
          <p className="text-[11px] text-zinc-500">
            Verifique sua conexão ou alterne para a aba Boneco 3D.
          </p>
        </div>
      )}

      {resolvedUrl && !hasError && (
        <video
          ref={videoRef}
          src={resolvedUrl}
          width={960}
          height={540}
          poster={isNearViewport ? videoMeta.poster_data_url : undefined}
          preload={lazy ? 'metadata' : 'auto'}
          autoPlay={!prefersReducedMotion}
          loop
          muted
          playsInline
          onClick={togglePlayPause}
          onLoadedData={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
          }}
          {...(lazy ? ({ loading: 'lazy' } as any) : {})}
          className={`relative z-10 w-full h-full cursor-pointer transition-all duration-200 ${
            fitMode === 'cover' ? 'object-cover' : 'object-contain'
          }`}
        />
      )}

      {/* Top-left standardized badge */}
      <div className="absolute top-2.5 left-2.5 z-20 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/15 flex items-center gap-1.5 pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span className="text-[10px] font-black tracking-wider uppercase text-white">
          Execução Oficial
        </span>
      </div>

      {/* Standardized minimalist HUD controls */}
      {!hasError && !isLoading && (
        <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleSlowMotion}
            className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-black flex items-center gap-1 backdrop-blur-md transition active:scale-95 ${
              playbackRate === 0.5
                ? 'bg-white text-black border-white shadow-sm'
                : 'bg-black/80 hover:bg-black text-white border-white/15'
            }`}
            title="Alternar câmera lenta (0.5x) para analisar postura"
          >
            <Gauge className="w-3 h-3" />
            <span>{playbackRate === 0.5 ? '0.5x' : '1x'}</span>
          </button>

          <button
            type="button"
            onClick={toggleFitMode}
            className="px-2.5 py-1.5 rounded-lg bg-black/80 hover:bg-black text-white border border-white/15 text-[10px] font-black flex items-center gap-1 backdrop-blur-md transition active:scale-95"
            title={fitMode === 'contain' ? 'Preencher quadro' : 'Ajustar vídeo inteiro'}
          >
            {fitMode === 'contain' ? (
              <>
                <Maximize2 className="w-3 h-3" />
                <span className="hidden xs:inline">Zoom</span>
              </>
            ) : (
              <>
                <Minimize2 className="w-3 h-3" />
                <span className="hidden xs:inline">Ajustar</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={togglePlayPause}
            aria-label={isPlaying ? 'Pausar vídeo' : 'Reproduzir vídeo'}
            className="w-8 h-8 rounded-lg bg-white text-black hover:bg-zinc-200 flex items-center justify-center shadow-md transition active:scale-95"
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-black" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};
