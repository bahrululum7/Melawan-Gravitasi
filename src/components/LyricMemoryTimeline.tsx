import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Volume2, VolumeX, Sparkles, Compass, ArrowRight } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

interface PhaseMilestone {
  id: string;
  phaseNumber: string;
  name: string;
  startTime: number;
  endTime: number;
  lyrics: string[];
  backdrop: string;
  reflection: string;
}

const MILESTONES: PhaseMilestone[] = [
  {
    id: 'phase-1',
    phaseNumber: 'Fase 01 (00:00 - 00:45)',
    name: 'Maaf Atas Kebodohan & Egoku',
    startTime: 0,
    endTime: 45,
    lyrics: [
      'Ada banyak kata yang terlambat kusampaikan...',
      'Ego yang terlalu keras, membuatku lupa mendengar gemetar suaramu.',
      'Maafkan aku yang baru tersadar setelah keheningan ini tercipta.',
    ],
    backdrop: '/images/foto2.jpeg',
    reflection: 'Kita sering tersandung bukan karena jalanannya yang berbatu, melainkan karena aku yang terlalu terburu-buru dan enggan menoleh.',
  },
  {
    id: 'phase-2',
    phaseNumber: 'Fase 02 (00:45 - 01:45)',
    name: 'Realita Sulit yang Kita Hadapi',
    startTime: 45,
    endTime: 105,
    lyrics: [
      'Hukum alam dan realita seolah menarik kita ke dua kutub berbeda.',
      'Ruang hampa di antara kita terasa dingin dan membingungkan.',
      'Logika berkata semuanya buntu, tapi perasaanku tak pernah bisa setuju.',
    ],
    backdrop: '/images/foto_retak.jpeg',
    reflection: 'Jarak bukan cuma soal kilometer, tapi tentang rasa takut bahwa mungkin kita tak lagi punya arah yang sama.',
  },
  {
    id: 'phase-3',
    phaseNumber: 'Fase 03 (01:45 - 03:00)',
    name: 'Janjiku untuk Memperjuangkan Keajaiban (Puncak / Reff)',
    startTime: 105,
    endTime: 180,
    lyrics: [
      'Kalau ada satu persen kemungkinan untuk sebuah keajaiban...',
      'Aku memilih untuk berdiri di satu persen itu bersamamu.',
      'Melawan gravitasi logika, menanti kehangatan itu kembali pulang.',
    ],
    backdrop: '/images/foto1.jpeg',
    reflection: 'Gravitasi perasaanku masih di sini—tak pernah bergeser meski ditarik oleh apa pun di luar sana.',
  },
];

interface LyricMemoryTimelineProps {
  onNextChapter: () => void;
}

export const LyricMemoryTimeline: React.FC<LyricMemoryTimelineProps> = ({ onNextChapter }) => {
  const [currentTime, setCurrentTime] = useState(() => audioEngine.getCurrentTime());
  const [duration, setDuration] = useState(() => audioEngine.getDuration());
  const [isPlaying, setIsPlaying] = useState(() => audioEngine.isPlaying());
  const [isMuted, setIsMuted] = useState(() => audioEngine.getIsMuted());
  const [activePhase, setActivePhase] = useState<PhaseMilestone>(() => {
    const time = audioEngine.getCurrentTime();
    return (
      MILESTONES.find((m) => time >= m.startTime && time < m.endTime) ||
      MILESTONES[0]
    );
  });
  const [isDraggingScrubber, setIsDraggingScrubber] = useState(false);
  const [isManualPhase, setIsManualPhase] = useState(false);
  const scrubberTrackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsPlaying(audioEngine.isPlaying());
    setIsMuted(audioEngine.getIsMuted());

    const unsubTime = audioEngine.onTimeUpdate((time, dur) => {
      if (!isDraggingScrubber) {
        setCurrentTime(time);
        setDuration(dur || 180);

        // Auto sync active milestone only when not manually overridden by phase buttons
        if (!isManualPhase) {
          const currentMilestone =
            MILESTONES.find((m) => time >= m.startTime && time < m.endTime) ||
            MILESTONES[MILESTONES.length - 1];
          if (currentMilestone) {
            setActivePhase(currentMilestone);
          }
        }
      }
    });

    const unsubState = audioEngine.onPlayStateChange((playing) => {
      setIsPlaying(playing);
    });

    return () => {
      unsubTime();
      unsubState();
    };
  }, [isDraggingScrubber, isManualPhase]);

  const togglePlay = () => {
    audioEngine.togglePlay();
  };

  const toggleMute = () => {
    const muted = audioEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubberTrackRef.current) return;
    const rect = scrubberTrackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSeconds = ratio * duration;
    audioEngine.seek(targetSeconds);
    setCurrentTime(targetSeconds);
    setIsManualPhase(false);

    const match =
      MILESTONES.find((m) => targetSeconds >= m.startTime && targetSeconds < m.endTime) ||
      MILESTONES[MILESTONES.length - 1];
    if (match) setActivePhase(match);
  };

  const selectPhase = (phase: PhaseMilestone) => {
    // Switch lyric/memory phase view without seeking or interrupting the ongoing song timeline
    setIsManualPhase(true);
    setActivePhase(phase);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="relative z-10 w-full min-h-[85vh] flex flex-col justify-between p-4 sm:p-8 max-w-6xl mx-auto">
      {/* Background Cinematic Backdrop Syncing with Current Phase */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none rounded-3xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePhase.id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 0.28, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 1.4, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            <img
              src={activePhase.backdrop}
              alt={activePhase.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover filter brightness-75 contrast-110"
            />
            {/* Cinematic light leak vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Header Phase Info */}
      <div className="relative z-10 text-center space-y-2 mt-2">
        <span className="text-xs uppercase tracking-[0.25em] text-amber-300 font-sans block">
          Chapter 03 · The Lyric & Memory Timeline
        </span>
        <h2 className="text-3xl sm:text-5xl font-serif text-stone-100 font-light text-balance">
          {activePhase.name}
        </h2>
        <span className="text-xs text-stone-400 font-mono tracking-widest block">
          {activePhase.phaseNumber}
        </span>
      </div>

      {/* Central Visual Lyric Presentation */}
      <div className="relative z-10 my-8 max-w-2xl mx-auto text-center space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePhase.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.8 }}
            className="space-y-4"
          >
            {activePhase.lyrics.map((line, idx) => (
              <p
                key={idx}
                className="text-lg sm:text-2xl font-serif italic text-stone-200 tracking-wide text-balance leading-relaxed"
              >
                "{line}"
              </p>
            ))}

            <div className="pt-4 border-t border-stone-800/80 max-w-lg mx-auto">
              <p className="text-xs sm:text-sm text-stone-400 font-sans leading-relaxed">
                {activePhase.reflection}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Phase Selector Tabs */}
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 mb-4">
        {MILESTONES.map((phase, idx) => {
          const isActive = activePhase.id === phase.id;
          return (
            <button
              key={phase.id}
              onClick={() => selectPhase(phase)}
              className={`px-3 py-1.5 rounded-lg text-xs font-sans transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-amber-400/20 text-amber-200 border border-amber-400/40 shadow-sm'
                  : 'bg-stone-900/60 text-stone-400 hover:text-stone-200 border border-stone-800'
              }`}
            >
              <span className="font-mono text-[10px] opacity-70">0{idx + 1}</span>
              <span>{phase.name.split(' (')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Cinematic Audio Scrubber Timeline at the Bottom */}
      <div className="relative z-10 bg-stone-950/80 border border-stone-800/90 rounded-2xl p-4 sm:p-5 backdrop-blur-xl shadow-2xl space-y-3">
        {/* Scrubber Track */}
        <div
          ref={scrubberTrackRef}
          onClick={handleScrubberClick}
          className="relative h-2 w-full bg-stone-800/80 rounded-full cursor-pointer overflow-hidden group"
        >
          {/* Milestone markers along the track */}
          {MILESTONES.map((m) => {
            const leftPercent = (m.startTime / duration) * 100;
            return (
              <div
                key={m.id}
                style={{ left: `${leftPercent}%` }}
                className="absolute top-0 bottom-0 w-0.5 bg-amber-400/50 group-hover:bg-amber-300 z-10 pointer-events-none"
              />
            );
          })}

          {/* Active progress fill */}
          <div
            style={{ width: `${(currentTime / duration) * 100}%` }}
            className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-300 rounded-full transition-all duration-75 relative"
          >
            {/* Scrubber head handle */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md border border-amber-500 scale-100 group-hover:scale-125 transition-transform" />
          </div>
        </div>

        {/* Scrubber Controls & Timers */}
        <div className="flex items-center justify-between text-xs text-stone-400 font-sans">
          <div className="flex items-center gap-3">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              className="p-2 text-stone-900 bg-stone-100 hover:bg-white rounded-full transition-colors cursor-pointer"
              title={isPlaying ? 'Jeda lagu' : 'Putar lagu'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
            </button>

            {/* Mute toggle */}
            <button
              onClick={toggleMute}
              className="p-2 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
              title={isMuted ? 'Nyalakan suara' : 'Bisukan suara'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <span className="font-mono text-[11px] text-stone-400">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[11px] text-stone-500 font-serif italic">
              "Geser linimasa untuk merasakan setiap bait penyesalan & harapan"
            </span>
          </div>
        </div>
      </div>

      {/* Prominent Next Button: Proceed to Two Worlds */}
      <div className="mt-4 flex justify-center w-full">
        <button
          onClick={onNextChapter}
          className="w-full max-w-sm py-3.5 px-6 rounded-2xl font-sans font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-[0_8px_25px_rgba(245,158,11,0.35)] cursor-pointer active:scale-[0.98] bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 text-stone-950"
        >
          <span>Lanjut ke Dua Titik Cahaya (Two Worlds)</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
