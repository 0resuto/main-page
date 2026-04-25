"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from "motion/react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Music,
  AlertCircle,
  Volume2,
  VolumeX,
  Shuffle,
} from "lucide-react";
import { useNavidrome } from "../app/useNavidrome";
import { useLanguage } from "./LanguageProvider";

export default function MusicPlayer() {
  const { t } = useLanguage();
  const { playlist, loading, error } = useNavidrome();
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [allowListScroll, setAllowListScroll] = useState(false);
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(true);
  const [hasActivatedMiniPlayer, setHasActivatedMiniPlayer] = useState(false);
  const [isMobileMiniPlayerVisible, setIsMobileMiniPlayerVisible] = useState(true);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() || 0;
    const diff = latest - previous;

    if (diff > 5 && latest > 50) {
      setIsMobileMiniPlayerVisible(false);
    } else if (diff < -5 || latest <= 50) {
      setIsMobileMiniPlayerVisible(true);
    }
  });

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressContainerRef = useRef<HTMLDivElement>(null);
  const volumeContainerRef = useRef<HTMLDivElement>(null);
  const playlistContainerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const visualizerRef = useRef<HTMLDivElement>(null);
  const drawVisualizerRef = useRef<() => void>(() => {});

  const initAudioContext = useCallback(() => {
    if (!audioRef.current) return;

    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      audioContextRef.current = new AudioContextClass();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 128;
      analyserRef.current.smoothingTimeConstant = 0.95;

      if (!sourceRef.current) {
        try {
          sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
          gainNodeRef.current = audioContextRef.current.createGain();
          gainNodeRef.current.gain.value = volume;

          sourceRef.current.connect(analyserRef.current);
          analyserRef.current.connect(gainNodeRef.current);
          gainNodeRef.current.connect(audioContextRef.current.destination);

          audioRef.current.volume = 1;
        } catch (connectError) {
          console.error("Audio source connect error:", connectError);
        }
      }
    }

    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
  }, [volume]);

  const drawVisualizer = useCallback(() => {
    if (!analyserRef.current || !visualizerRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const bars = visualizerRef.current.children;
    const numBars = bars.length;
    const tiltFactor = 0.6;
    let min = Infinity;
    let max = 0;

    for (let i = 0; i < numBars; i += 1) {
      const value = dataArray[i] * (1 + (i / numBars) * tiltFactor);
      if (value > max) max = value;
      if (value < min) min = value;
    }

    const range = max > min ? max - min : 1;

    for (let i = 0; i < numBars; i += 1) {
      const value = dataArray[i] * (1 + (i / numBars) * tiltFactor);
      const percent = (value - min) / range;
      const height = Math.max(4, percent * 32);
      (bars[i] as HTMLElement).style.height = `${height}px`;
    }

    animationRef.current = requestAnimationFrame(() => drawVisualizerRef.current());
  }, []);

  useEffect(() => {
    drawVisualizerRef.current = drawVisualizer;
  }, [drawVisualizer]);

  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      initAudioContext();
      audioRef.current
        .play()
        .then(() => {
          if (animationRef.current) cancelAnimationFrame(animationRef.current);
          drawVisualizer();
        })
        .catch((playbackError) => {
          console.error("Playback failed:", playbackError);
          setIsPlaying(false);
        });
    } else {
      audioRef.current.pause();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentTrackIndex, drawVisualizer, initAudioContext, isPlaying]);

  useEffect(() => {
    if (!playlistContainerRef.current) return;

    const container = playlistContainerRef.current;
    const activeItem = container.children[currentTrackIndex] as HTMLElement | undefined;

    if (activeItem) {
      const scrollPos =
        activeItem.offsetTop - container.clientHeight / 2 + activeItem.clientHeight / 2;
      container.scrollTo({
        top: scrollPos,
        behavior: "smooth",
      });
    }
  }, [currentTrackIndex]);

  const handlePlaylistScroll = () => {
    if (!playlistContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = playlistContainerRef.current;
    setShowTopShadow(scrollTop > 0);
    setShowBottomShadow(Math.ceil(scrollTop + clientHeight) < scrollHeight - 1);
  };

  useEffect(() => {
    const timer = window.setTimeout(handlePlaylistScroll, 100);
    window.addEventListener("resize", handlePlaylistScroll);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", handlePlaylistScroll);
    };
  }, [playlist.length]);

  const handleNext = () => {
    if (!playlist.length) return;

    if (isShuffle) {
      let nextIndex = Math.floor(Math.random() * playlist.length);
      if (nextIndex === currentTrackIndex && playlist.length > 1) {
        nextIndex = (nextIndex + 1) % playlist.length;
      }
      setCurrentTrackIndex(nextIndex);
    } else {
      setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
    }

    setHasActivatedMiniPlayer(true);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    if (!playlist.length) return;

    if (isShuffle) {
      let prevIndex = Math.floor(Math.random() * playlist.length);
      if (prevIndex === currentTrackIndex && playlist.length > 1) {
        prevIndex = (prevIndex - 1 + playlist.length) % playlist.length;
      }
      setCurrentTrackIndex(prevIndex);
    } else {
      setCurrentTrackIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    }

    setHasActivatedMiniPlayer(true);
    setIsPlaying(true);
  };

  const updateProgressFromEvent = (e: React.PointerEvent<HTMLDivElement>, commit = false) => {
    if (!progressContainerRef.current || !audioRef.current) return;

    const bounds = progressContainerRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - bounds.left) / bounds.width));
    const newTime = percent * (duration || playlist[currentTrackIndex]?.duration || 0);
    setProgress(newTime);

    if (commit) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleProgressPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDraggingProgress(true);
    updateProgressFromEvent(e, true);
  };

  const handleProgressPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons === 1 && isDraggingProgress) {
      updateProgressFromEvent(e, false);
    }
  };

  const handleProgressPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingProgress(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    updateProgressFromEvent(e, true);
  };

  const updateVolumeFromEvent = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!volumeContainerRef.current) return;

    const bounds = volumeContainerRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - bounds.left) / bounds.width));
    setVolume(percent);

    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = percent;
    } else if (audioRef.current) {
      audioRef.current.volume = percent;
    }
  };

  const handleVolumePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDraggingVolume(true);
    updateVolumeFromEvent(e);
  };

  const handleVolumePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons === 1 && isDraggingVolume) {
      updateVolumeFromEvent(e);
    }
  };

  const handleVolumePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingVolume(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const toggleMute = () => {
    const newVolume = volume > 0 ? 0 : 0.8;
    setVolume(newVolume);

    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = newVolume;
    } else if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const formatTime = (time: number) => {
    if (!time || Number.isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60).toString().padStart(2, "0");
    const seconds = Math.floor(time % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto w-full h-[250px] animate-pulse relative isolate rounded-3xl shadow-md border border-brand-10/10 bg-brand-60/20"></div>
    );
  }

  if (error) {
    const errorMessage =
      error.kind === "playlist"
        ? t.musicPlayer.errors.playlist
        : error.kind === "proxyUnavailable"
          ? `${t.musicPlayer.errors.proxyUnavailable} (Status: ${error.status})`
          : t.musicPlayer.errors.unexpected;

    return (
      <div className="max-w-5xl mx-auto w-full p-10 relative isolate rounded-3xl shadow-md border border-brand-10/10 bg-brand-60/20 flex flex-col items-center justify-center text-center">
        <AlertCircle size={48} className="text-brand-30 mb-4" />
        <h3 className="text-xl font-bold text-brand-10 mb-2">{t.musicPlayer.failedTitle}</h3>
        <p className="text-brand-10/70">{errorMessage}</p>
      </div>
    );
  }

  if (!playlist.length) return null;

  const currentTrack = playlist[currentTrackIndex];
  const progressPercent = Math.min(
    100,
    Math.max(0, (progress / (duration || currentTrack.duration || 1)) * 100),
  );
  const miniPlayerActive = hasActivatedMiniPlayer;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto w-full"
      >
        <div className="relative group isolate rounded-3xl shadow-md hover:shadow-2xl overflow-hidden antialiased transform-gpu will-change-transform hover:-translate-y-2 transition-all duration-300">
          <div className="absolute inset-0 glass backdrop-blur-md bg-brand-60/30 transition-colors duration-300 pointer-events-none border border-brand-10/10 rounded-3xl group-hover:border-brand-30/30 group-hover:bg-brand-60/40"></div>

          <div className="relative z-10 p-8 lg:p-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-10">
            <div className="w-68 h-68 lg:w-60 lg:h-60 shrink-0 bg-brand-60/80 border border-brand-10/10 rounded-2xl shadow-xl flex items-center justify-center text-brand-10/30 relative overflow-hidden group-hover:border-brand-30/50 transition-colors">
              {currentTrack.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentTrack.coverUrl} alt={currentTrack.album} className="w-full h-full object-cover" />
              ) : (
                <Music size={48} />
              )}

              <div
                ref={visualizerRef}
                className={`absolute bottom-0 inset-x-0 h-16 flex items-end justify-between gap-[2px] transition-opacity duration-700 bg-gradient-to-t from-brand-bg/80 to-transparent ${
                  isPlaying ? "opacity-100" : "opacity-0"
                }`}
              >
                {Array.from({ length: 32 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-full bg-brand-30/50 rounded-t-sm will-change-[height]"
                    style={{ height: "4px" }}
                  ></div>
                ))}
              </div>
            </div>

            <div className="flex-1 w-full text-center lg:text-left flex flex-col justify-center">
              <div className="text-xs font-bold uppercase tracking-widest text-brand-30 mb-2">
                {currentTrack.album || t.musicPlayer.myPlaylist}
              </div>
              <h3 className="text-2xl lg:text-3xl font-extrabold tracking-tighter text-brand-10 mb-1 truncate" title={currentTrack.title}>
                {currentTrack.title}
              </h3>
              <p className="text-brand-10/70 font-medium text-lg truncate mb-8" title={currentTrack.artist}>
                {currentTrack.artist}
              </p>

              <div className="w-full flex flex-col lg:flex-row items-center gap-1.5 lg:gap-4 text-xs font-bold text-brand-10/50 mb-6">
                <span className="hidden lg:block w-10 text-right">{formatTime(progress)}</span>
                <div
                  ref={progressContainerRef}
                  className="w-full lg:flex-1 h-1 bg-brand-10/10 rounded-full relative cursor-pointer hover:bg-brand-10/20 transition-colors touch-none group/progress before:absolute before:-inset-y-2 before:-inset-x-0"
                  onPointerDown={handleProgressPointerDown}
                  onPointerMove={handleProgressPointerMove}
                  onPointerUp={handleProgressPointerUp}
                >
                  <div
                    className={`absolute top-0 left-0 h-full bg-brand-30 rounded-full ${
                      isDraggingProgress ? "" : "transition-all duration-100"
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  >
                    <div
                      className={`absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 lg:w-3 lg:h-3 bg-brand-10 rounded-full shadow-md translate-x-1/2 transition-opacity ${
                        isDraggingProgress ? "opacity-100" : "opacity-0 group-hover/progress:opacity-100"
                      }`}
                    ></div>
                  </div>
                </div>
                <div className="w-full flex justify-between lg:hidden">
                  <span>{formatTime(progress)}</span>
                  <span>{formatTime(duration || currentTrack.duration)}</span>
                </div>
                <span className="hidden lg:block w-10">{formatTime(duration || currentTrack.duration)}</span>
              </div>

              <div className="w-full flex items-center justify-center h-14 lg:h-16">
                <div className="flex items-center lg:absolute lg:left-1/2 lg:-translate-x-1/2">
                  <div className="flex items-center justify-end gap-4 lg:gap-6 w-24 lg:w-32">
                    <button
                      onClick={() => setIsShuffle(!isShuffle)}
                      className={`transition-colors hover:scale-110 active:scale-95 ${
                        isShuffle ? "text-brand-30" : "text-brand-10/50 hover:text-brand-10"
                      }`}
                    >
                      <Shuffle size={20} />
                    </button>
                    <button
                      onClick={handlePrev}
                      className="text-brand-10/70 hover:text-brand-10 transition-colors hover:scale-110 active:scale-95"
                    >
                      <SkipBack size={24} fill="currentColor" />
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      if (!isPlaying) setHasActivatedMiniPlayer(true);
                      setIsPlaying(!isPlaying);
                    }}
                    className="w-14 h-14 lg:w-16 lg:h-16 mx-4 lg:mx-6 bg-brand-30 text-brand-10 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand-30/20 shrink-0"
                  >
                    {isPlaying ? (
                      <Pause size={28} fill="currentColor" />
                    ) : (
                      <Play size={28} fill="currentColor" className="translate-x-0.5" />
                    )}
                  </button>

                  <div className="flex items-center justify-start gap-4 lg:gap-6 w-24 lg:w-32">
                    <button
                      onClick={handleNext}
                      className="text-brand-10/70 hover:text-brand-10 transition-colors hover:scale-110 active:scale-95"
                    >
                      <SkipForward size={24} fill="currentColor" />
                    </button>
                  </div>
                </div>

                <div className="hidden lg:flex items-center gap-3 ml-auto">
                  <button
                    onClick={toggleMute}
                    className="text-brand-10/70 hover:text-brand-10 transition-colors hover:scale-110 active:scale-95"
                  >
                    {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                  <div
                    ref={volumeContainerRef}
                    className="w-20 lg:w-24 h-1 bg-brand-10/10 rounded-full relative cursor-pointer hover:bg-brand-10/20 transition-colors touch-none group/volume before:absolute before:-inset-y-2 before:-inset-x-0"
                    onPointerDown={handleVolumePointerDown}
                    onPointerMove={handleVolumePointerMove}
                    onPointerUp={handleVolumePointerUp}
                  >
                    <div
                      className={`absolute top-0 left-0 h-full bg-brand-30 rounded-full ${
                        isDraggingVolume ? "" : "transition-all duration-100"
                      }`}
                      style={{ width: `${volume * 100}%` }}
                    >
                      <div
                        className={`absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-brand-10 rounded-full shadow-md translate-x-1/2 transition-opacity ${
                          isDraggingVolume ? "opacity-100" : "opacity-0 group-hover/volume:opacity-100"
                        }`}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <audio
                ref={audioRef}
                src={currentTrack.streamUrl}
                crossOrigin="anonymous"
                onTimeUpdate={() => {
                  if (!isDraggingProgress) setProgress(audioRef.current?.currentTime || 0);
                }}
                onLoadedMetadata={() => {
                  setDuration(audioRef.current?.duration || currentTrack.duration);
                  if (audioRef.current && !gainNodeRef.current) audioRef.current.volume = volume;
                }}
                onEnded={handleNext}
              />
            </div>
          </div>

          {playlist.length > 1 && (
            <div className="relative z-10 border-t border-brand-10/10 bg-brand-bg/40 p-6 md:p-8">
              <h4 className="text-sm font-bold uppercase tracking-widest text-brand-10/50 mb-4 px-2">
                {t.musicPlayer.queue}
              </h4>
              <div className="relative">
                <div
                  className={`absolute inset-0 pointer-events-none z-10 rounded-xl shadow-[inset_0_4px_6px_-4px_rgba(0,0,0,0.1)] transition-opacity duration-300 ${
                    showTopShadow ? "opacity-100" : "opacity-0"
                  }`}
                ></div>
                <div
                  className={`absolute inset-0 pointer-events-none z-10 rounded-xl shadow-[inset_0_-4px_6px_-4px_rgba(0,0,0,0.1)] transition-opacity duration-300 ${
                    showBottomShadow ? "opacity-100" : "opacity-0"
                  }`}
                ></div>
                <div
                  ref={playlistContainerRef}
                  onScroll={handlePlaylistScroll}
                  data-lenis-prevent={allowListScroll ? "true" : undefined}
                  onMouseEnter={() => setAllowListScroll(false)}
                  onMouseMove={() => setAllowListScroll(true)}
                  onMouseLeave={() => setAllowListScroll(false)}
                  className="relative flex flex-col gap-1 max-h-64 md:max-h-72 overflow-y-auto overscroll-contain rounded-xl py-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-brand-10/20 hover:[&::-webkit-scrollbar-thumb]:bg-brand-10/30 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:transparent transition-colors"
                >
                  {playlist.map((track, idx) => (
                    <div
                      key={`${track.id}-${idx}`}
                      onClick={() => {
                        setCurrentTrackIndex(idx);
                        setHasActivatedMiniPlayer(true);
                        setIsPlaying(true);
                      }}
                      className={`flex items-center gap-4 p-2 md:p-3 rounded-xl cursor-pointer transition-all duration-300 group/item ${
                        idx === currentTrackIndex
                          ? "bg-brand-30/10 shadow-sm"
                          : "hover:bg-brand-10/5 hover:-translate-y-0.5"
                      }`}
                    >
                      <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 bg-brand-60/80 border border-brand-10/10 rounded-lg shadow overflow-hidden flex items-center justify-center relative">
                        {track.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                        ) : (
                          <Music size={20} className="text-brand-10/30" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`font-bold text-sm md:text-base truncate transition-colors ${
                            idx === currentTrackIndex
                              ? "text-brand-30"
                              : "text-brand-10 group-hover/item:text-brand-30"
                          }`}
                        >
                          {track.title}
                        </div>
                        <div className="text-xs md:text-sm text-brand-10/50 truncate font-medium mt-0.5">
                          {track.artist}
                        </div>
                      </div>
                      <div className="text-xs font-bold text-brand-10/30 w-12 text-right hidden sm:block">
                        {formatTime(track.duration)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {miniPlayerActive && (
          <motion.div
            key="mini-player"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed z-50 right-4 top-0 left-auto w-[min(420px,calc(100vw-2rem))] xl:right-8 xl:w-[420px] max-xl:inset-x-0 max-xl:bottom-0 max-xl:top-auto max-xl:w-auto"
          >
            <div className="xl:hidden absolute bottom-0 left-0 right-0 h-0.5 w-full bg-brand-10/10 z-[60]">
              <motion.div
                className="h-full bg-brand-30"
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: isDraggingProgress ? 0 : 0.12 }}
              />
            </div>

            <div className="relative xl:h-16">
              <div className="absolute inset-0 hidden xl:block pointer-events-none" />
              <div className="relative xl:flex xl:h-full xl:items-center xl:justify-end">
                <div
                  className={`relative overflow-hidden max-xl:border-t max-xl:border-brand-10/10 max-xl:glass max-xl:backdrop-blur-md max-xl:bg-brand-bg/80 max-xl:shadow-sm max-xl:px-4 max-xl:pb-[calc(env(safe-area-inset-bottom,0px)+0.9rem)] max-xl:pt-3 xl:w-full xl:max-w-[420px] transition-transform duration-300 ease-in-out ${
                    !isMobileMiniPlayerVisible ? "max-xl:translate-y-full" : "max-xl:translate-y-0"
                  }`}
                >
                  <div className="flex items-center gap-2 xl:gap-3 xl:py-2">
                    <div className="flex min-w-0 flex-1 items-center gap-3 py-1 xl:py-0">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-brand-10/10 bg-brand-60/80 xl:h-12 xl:w-12 xl:border-brand-10/10 xl:bg-brand-10/8 transform-gpu">
                        {currentTrack.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={currentTrack.coverUrl}
                            alt={currentTrack.album}
                            className="h-full w-full object-cover"
                            decoding="async"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-brand-10/30">
                            <Music size={20} />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[11px] font-bold uppercase tracking-[0.24em] text-brand-30/90 xl:hidden mb-0.5">
                          {currentTrack.album || t.musicPlayer.myPlaylist}
                        </div>

                        <div className="flex items-end justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-extrabold text-brand-10" title={currentTrack.title}>
                              {currentTrack.title}
                            </div>
                            <div className="truncate text-xs font-medium text-brand-10/60" title={currentTrack.artist}>
                              {currentTrack.artist}
                            </div>
                          </div>
                          <div className="hidden text-[11px] font-bold text-brand-10/45 xl:block shrink-0 pb-0.5">
                            {formatTime(progress)} / {formatTime(duration || currentTrack.duration)}
                          </div>
                        </div>

                        <div className="hidden xl:block mt-1.5 h-0.5 w-full overflow-hidden rounded-full bg-brand-10/10">
                          <motion.div
                            className="h-full rounded-full bg-brand-30"
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: isDraggingProgress ? 0 : 0.12 }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center justify-end gap-1 xl:gap-0.5">
                      <button className="flex h-9 w-9 items-center justify-center rounded-full text-brand-10/70 transition hover:bg-brand-10/8 hover:text-brand-10 xl:h-8 xl:w-8" onClick={handlePrev}>
                        <SkipBack size={18} fill="currentColor" />
                      </button>
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-30 text-brand-10 shadow-lg shadow-brand-30/20 transition hover:scale-[1.03] active:scale-95 xl:h-8 xl:w-8 xl:bg-brand-10/10 xl:shadow-none"
                      >
                        {isPlaying ? (
                          <Pause size={18} fill="currentColor" />
                        ) : (
                          <Play size={18} fill="currentColor" className="translate-x-[1px]" />
                        )}
                      </button>
                      <button className="flex h-9 w-9 items-center justify-center rounded-full text-brand-10/70 transition hover:bg-brand-10/8 hover:text-brand-10 xl:h-8 xl:w-8" onClick={handleNext}>
                        <SkipForward size={18} fill="currentColor" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
