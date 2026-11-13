import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Disc, Volume2, ArrowRight } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';
import { EXHIBITION_CONFIG } from '../config/exhibitionData';

interface GatewayVinylProps {
  onAudioStarted: () => void;
  onNextChapter: () => void;
  isUnlocked: boolean;
}

const DEFAULT_PLAY_ANGLE = 40; // Directly over the vinyl grooves on both mobile & desktop

export const GatewayVinyl: React.FC<GatewayVinylProps> = ({
  onAudioStarted,
  onNextChapter,
}) => {
  const [isPlaying, setIsPlaying] = useState(() => audioEngine.isPlaying());
  const [holdProgress, setHoldProgress] = useState(0);
  const [armAngle, setArmAngle] = useState(() =>
    audioEngine.isPlaying() ? DEFAULT_PLAY_ANGLE : 0
  );
  const [isArmLifted, setIsArmLifted] = useState(false);
  const [isDraggingArm, setIsDraggingArm] = useState(false);
  const [isHoveringVinyl, setIsHoveringVinyl] = useState(false);
  const [isNeedleOnRecord, setIsNeedleOnRecord] = useState(() => audioEngine.isPlaying());
  const [currentTime, setCurrentTime] = useState(() => audioEngine.getCurrentTime());
  const [duration, setDuration] = useState(() => audioEngine.getDuration());

  const holdIntervalRef = useRef<number | null>(null);
  const dropTimeoutRef = useRef<number | null>(null);
  const pivotRef = useRef<HTMLDivElement | null>(null);
  const platterRef = useRef<HTMLDivElement | null>(null);
  const armRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const latestAngleRef = useRef<number>(armAngle);

  useEffect(() => {
    const unsubState = audioEngine.onPlayStateChange((playing) => {
      setIsPlaying(playing);
      if (playing) {
        setIsNeedleOnRecord(true);
      }
    });

    const unsubTime = audioEngine.onTimeUpdate((time, dur) => {
      setCurrentTime(time);
      setDuration(dur || 180);
    });

    return () => {
      unsubState();
      unsubTime();
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
      if (dropTimeoutRef.current) clearTimeout(dropTimeoutRef.current);
    };
  }, []);

  // Measure whether the needle tip at a given arm angle rests over the playable vinyl grooves
  const checkTipOverVinyl = (angleDeg: number): boolean => {
    if (!pivotRef.current || !platterRef.current || !armRef.current) {
      return angleDeg >= 30 && angleDeg <= 52;
    }

    const pivotRect = pivotRef.current.getBoundingClientRect();
    const platterRect = platterRef.current.getBoundingClientRect();

    const pivotCenterX = pivotRect.left + pivotRect.width / 2;
    const pivotCenterY = pivotRect.top + pivotRect.height / 2;

    // Needle tip distance from pivot (24px from top of arm container to bottom tip)
    const armLength = armRef.current.clientHeight - 26;
    const rad = (angleDeg * Math.PI) / 180;

    // 0deg points straight down (0, +armLength). Positive CSS rotation swings toward left (-X, +Y).
    const tipX = pivotCenterX - armLength * Math.sin(rad);
    const tipY = pivotCenterY + armLength * Math.cos(rad);

    const platterCenterX = platterRect.left + platterRect.width / 2;
    const platterCenterY = platterRect.top + platterRect.height / 2;
    const platterRadius = platterRect.width / 2;

    const dist = Math.hypot(tipX - platterCenterX, tipY - platterCenterY);

    // Must land inside the grooved ring (inside outer rim, outside center spindle label)
    return dist <= platterRadius - 4 && dist >= platterRadius * 0.34;
  };

  const triggerStartAudio = async () => {
    await audioEngine.start();
    setIsPlaying(true);
    setIsNeedleOnRecord(true);
    setHoldProgress(100);
    onAudioStarted();
  };

  // Smooth cueing sequence when triggered by 2-second center hold or quick tap
  const cueArmToPlay = () => {
    if (dropTimeoutRef.current) clearTimeout(dropTimeoutRef.current);
    setIsArmLifted(true);
    setArmAngle(DEFAULT_PLAY_ANGLE);
    latestAngleRef.current = DEFAULT_PLAY_ANGLE;

    // Swing smoothly over the vinyl first, then lower needle onto groove and start audio
    dropTimeoutRef.current = window.setTimeout(() => {
      setIsArmLifted(false);
      setIsHoveringVinyl(false);
      dropTimeoutRef.current = window.setTimeout(() => {
        triggerStartAudio();
      }, 220);
    }, 520);
  };

  const cueArmToRest = () => {
    if (dropTimeoutRef.current) clearTimeout(dropTimeoutRef.current);
    audioEngine.pause();
    setIsPlaying(false);
    setIsNeedleOnRecord(false);
    setIsArmLifted(true);

    // Lift gently off the record, swing back to rest cradle, then lower smoothly
    dropTimeoutRef.current = window.setTimeout(() => {
      setArmAngle(0);
      latestAngleRef.current = 0;
      dropTimeoutRef.current = window.setTimeout(() => {
        setIsArmLifted(false);
        setIsHoveringVinyl(false);
      }, 520);
    }, 180);
  };

  // Handle 2-second hold on center spindle button
  const startHold = () => {
    if (isPlaying) return;
    const startTime = Date.now();
    const durationMs = 2000;

    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    holdIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / durationMs) * 100);
      setHoldProgress(progress);

      if (progress >= 100) {
        clearInterval(holdIntervalRef.current!);
        holdIntervalRef.current = null;
        cueArmToPlay();
      }
    }, 30);
  };

  const endHold = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    if (holdProgress < 100 && !isPlaying) {
      setHoldProgress(0);
    }
  };

  // Compute rotation angle around the fixed gimbal pivot from pointer coordinates
  const calculateAngleFromPointer = (clientX: number, clientY: number): number => {
    if (!pivotRef.current) return latestAngleRef.current;
    const rect = pivotRef.current.getBoundingClientRect();
    const pivotX = rect.left + rect.width / 2;
    const pivotY = rect.top + rect.height / 2;

    const dx = clientX - pivotX;
    const dy = Math.max(20, clientY - pivotY); // prevent angle inversion above pivot
    const angleDeg = Math.atan2(-dx, dy) * (180 / Math.PI);

    return Math.max(-4, Math.min(52, angleDeg));
  };

  // Draggable Tonearm Pointer Handlers (pivot stays 100% locked in place)
  const handleArmPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (dropTimeoutRef.current) clearTimeout(dropTimeoutRef.current);

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragStartRef.current = { x: e.clientX, y: e.clientY, moved: false };

    setIsDraggingArm(true);
    setIsArmLifted(true); // Smoothly lift tonearm off rest/record while holding

    // Lifting needle out of the groove pauses audio until placed back onto the vinyl
    if (audioEngine.isPlaying()) {
      audioEngine.pause();
      setIsPlaying(false);
      setIsNeedleOnRecord(false);
    }

    setIsHoveringVinyl(checkTipOverVinyl(latestAngleRef.current));
  };

  const handleArmPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingArm || !dragStartRef.current) return;

    const dist = Math.hypot(
      e.clientX - dragStartRef.current.x,
      e.clientY - dragStartRef.current.y
    );
    if (dist > 6) {
      dragStartRef.current.moved = true;
    }

    if (dragStartRef.current.moved) {
      const nextAngle = calculateAngleFromPointer(e.clientX, e.clientY);
      latestAngleRef.current = nextAngle;
      setArmAngle(nextAngle);
      setIsHoveringVinyl(checkTipOverVinyl(nextAngle));
    }
  };

  const handleArmPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingArm) return;

    if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    }

    const wasDragged = dragStartRef.current?.moved ?? false;
    dragStartRef.current = null;
    setIsDraggingArm(false);

    if (!wasDragged) {
      // Quick click/tap toggles smoothly between rest and vinyl
      if (isNeedleOnRecord || latestAngleRef.current >= 25) {
        cueArmToRest();
      } else {
        cueArmToPlay();
      }
      return;
    }

    // Released after dragging: check if the tip is placed on the vinyl platter
    const finalAngle = latestAngleRef.current;
    const droppedOnVinyl = checkTipOverVinyl(finalAngle);

    if (droppedOnVinyl) {
      // Lower needle smoothly onto the exact spot on the vinyl, then play music!
      setIsArmLifted(false);
      setIsHoveringVinyl(false);
      dropTimeoutRef.current = window.setTimeout(() => {
        triggerStartAudio();
      }, 240);
    } else {
      // Released outside vinyl -> glide back to rest cradle and lower smoothly
      setIsHoveringVinyl(false);
      setIsNeedleOnRecord(false);
      setArmAngle(0);
      latestAngleRef.current = 0;
      dropTimeoutRef.current = window.setTimeout(() => {
        setIsArmLifted(false);
      }, 450);
    }
  };

  const handleNextClick = async () => {
    if (!audioEngine.isPlaying()) {
      setIsArmLifted(false);
      setArmAngle(DEFAULT_PLAY_ANGLE);
      latestAngleRef.current = DEFAULT_PLAY_ANGLE;
      await triggerStartAudio();
    }
    onNextChapter();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="relative z-10 flex flex-col items-center justify-center w-full px-4 py-4 sm:py-6 max-w-4xl mx-auto text-center">
      {/* Editorial Title */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-4 sm:mb-6"
      >
        <span className="text-xs uppercase tracking-[0.28em] text-stone-400 font-sans block mb-2">
          Virtual Memory Space · Chapter 01
        </span>
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-light text-stone-100 tracking-tight text-balance">
          Against The Gravity
        </h1>
        <p className="mt-2 text-stone-400 text-xs sm:text-sm font-serif italic max-w-lg mx-auto">
          "Hubungan kita mungkin ditarik ke arah yang berlawanan oleh keadaan. Tapi gravitasi perasaanku masih cukup kuat untuk menarikmu kembali."
        </p>
      </motion.div>

      {/* Turntable Deck (Chassis) - Single unified coordinate system */}
      <div className="relative my-2 sm:my-4 flex items-center justify-center select-none">
        {/* Ambient Bass Glow behind Turntable */}
        <div
          className={`absolute w-72 sm:w-[440px] h-72 sm:h-[350px] rounded-3xl blur-3xl transition-all duration-1000 pointer-events-none ${
            isPlaying ? 'bg-amber-500/25 scale-105' : 'bg-stone-800/20 scale-95'
          }`}
        />

        {/* Physical Turntable Chassis */}
        <div className="relative w-[340px] sm:w-[440px] h-[290px] sm:h-[340px] rounded-3xl bg-gradient-to-b from-[#18161b] via-[#121115] to-[#0a090d] border border-stone-800/90 shadow-[0_25px_60px_rgba(0,0,0,0.9)] p-4">
          {/* Subtle metallic deck finish */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none rounded-3xl" />

          {/* Turntable Brand Stamp */}
          <div className="absolute bottom-3 left-6 text-[10px] uppercase font-mono tracking-widest text-stone-600">
            ATG · Hi-Fi Phono System
          </div>

          {/* Left: The Vinyl Platter Disc */}
          <div
            ref={platterRef}
            className={`absolute left-4 sm:left-6 top-6 sm:top-7 w-[220px] h-[220px] sm:w-[260px] sm:h-[260px] rounded-full bg-stone-950 border-2 shadow-[0_15px_35px_rgba(0,0,0,0.95)] flex items-center justify-center overflow-hidden transition-all duration-300 ${
              isArmLifted && isHoveringVinyl
                ? 'border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.45)]'
                : 'border-stone-800/90'
            }`}
          >
            {/* Spinning Grooves (Continuously rotates while isPlaying is true) */}
            <div
              className={`absolute inset-1.5 rounded-full vinyl-grooves ${
                isPlaying ? 'animate-[spin_3.5s_linear_infinite]' : ''
              }`}
            >
              {/* Dynamic light reflection sheen */}
              <div className="absolute inset-0 rounded-full vinyl-sheen opacity-40 pointer-events-none" />
            </div>

            {/* Target Groove Drop Ring Indicator while dragging arm over platter */}
            {isArmLifted && (
              <div
                className={`absolute inset-4 rounded-full border border-dashed transition-all duration-200 pointer-events-none ${
                  isHoveringVinyl
                    ? 'border-amber-400/80 bg-amber-400/5 scale-100 opacity-100'
                    : 'border-stone-600/40 scale-95 opacity-60'
                }`}
              />
            )}

            {/* Vinyl Center Label */}
            <div className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-stone-900 to-stone-950 border border-amber-500/40 flex flex-col items-center justify-center shadow-inner">
              <span className="text-[8px] uppercase tracking-widest text-amber-300/80 font-sans">
                33 ⅓ RPM
              </span>
              <span className="text-[11px] font-serif italic text-stone-200 mt-0.5 max-w-[80px] truncate">
                Side A
              </span>

              {/* Central Spindle Interactive Hold Button (Tahan 2 detik) */}
              <button
                onMouseDown={startHold}
                onMouseUp={endHold}
                onMouseLeave={endHold}
                onTouchStart={startHold}
                onTouchEnd={endHold}
                onClick={() => {
                  if (!isPlaying && holdProgress === 0) {
                    cueArmToPlay();
                  }
                }}
                title={isPlaying ? 'Musik sedang berputar terus' : 'Tahan 2 detik untuk menyalakan musik'}
                className="mt-1.5 relative w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-stone-950 flex items-center justify-center shadow-lg active:scale-95 transition-transform cursor-pointer"
              >
                {/* Circular Progress Ring for 2-Second Hold */}
                <svg className="absolute inset-[-4px] w-12 h-12 sm:w-13 sm:h-13 -rotate-90 pointer-events-none">
                  <circle
                    cx="24"
                    cy="24"
                    r="22"
                    fill="none"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="2"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="22"
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="2.5"
                    strokeDasharray={138.2}
                    strokeDashoffset={138.2 - (138.2 * holdProgress) / 100}
                    className="transition-all duration-75"
                  />
                </svg>
                <Disc className={`w-4 h-4 ${isPlaying ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Right: Rest Cradle Post */}
          <div className="absolute right-8 sm:right-11 top-44 sm:top-48 w-5 h-5 border-l-2 border-b-2 border-stone-600 rounded-bl pointer-events-none z-10">
            <span className="absolute -bottom-4 -left-2 text-[8px] uppercase tracking-wider text-stone-600 font-mono">
              Rest
            </span>
          </div>

          {/* Base Gimbal Turret Housing (POROS TETAP - NEVER MOVES OR ROTATES) */}
          <div
            ref={pivotRef}
            className="absolute right-7 sm:right-10 top-6 sm:top-8 w-12 h-12 rounded-full bg-gradient-to-b from-stone-700 to-stone-900 border border-stone-500/80 shadow-[0_6px_14px_rgba(0,0,0,0.8)] flex items-center justify-center z-20 pointer-events-none"
          >
            <div className="w-8 h-8 rounded-full border border-stone-500/50 bg-stone-800/90" />
          </div>

          {/* The Draggable Tonearm Assembly:
              - Outer wrapper ONLY applies rotate(armAngle) around exact pivot (24px, 24px).
              - Inner elevation wrapper ONLY applies scale(1.045) around the SAME exact pivot (24px, 24px)
                plus floating drop-shadow, giving a smooth cueing-lift effect while keeping the pivot 100% stationary! */}
          <div
            ref={armRef}
            onPointerDown={handleArmPointerDown}
            onPointerMove={handleArmPointerMove}
            onPointerUp={handleArmPointerUp}
            onPointerCancel={handleArmPointerUp}
            style={{
              transformOrigin: '24px 24px',
              transform: `rotate(${armAngle}deg)`,
              touchAction: 'none',
            }}
            title={
              isPlaying
                ? 'Geser batang jarum untuk mengangkat & memindahkannya'
                : 'Tarik & geser batang jarum ke atas piringan hitam untuk memutar lagu'
            }
            className={`absolute right-7 sm:right-10 top-6 sm:top-8 w-12 h-56 sm:h-64 z-30 ${
              isDraggingArm
                ? 'cursor-grabbing'
                : 'cursor-grab transition-transform duration-500 ease-out'
            }`}
          >
            {/* Elevation Layer (Smooth Lift Illusion anchored at exact 24px 24px pivot) */}
            <div
              style={{
                transformOrigin: '24px 24px',
                transform: isArmLifted ? 'scale(1.045)' : 'scale(1)',
                filter: isArmLifted
                  ? 'drop-shadow(8px 16px 12px rgba(0,0,0,0.85))'
                  : 'drop-shadow(1px 3px 3px rgba(0,0,0,0.65))',
              }}
              className="relative w-full h-full transition-all duration-300 ease-out"
            >
              {/* Generous invisible hit area around arm rod for easy touch/mouse dragging */}
              <div className="absolute -inset-x-3 top-6 bottom-0" />

              {/* Counterweight at top (coaxial with x=24px) */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-6 bg-stone-700 border border-stone-500 rounded shadow-md" />

              {/* Metallic Arm Rod (coaxial with x=24px) */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-1.5 h-44 sm:h-50 bg-gradient-to-r from-stone-400 via-stone-200 to-stone-500 rounded-full" />

              {/* Headshell & Needle Cartridge (coaxial with x=24px) */}
              <div
                className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-7 h-10 bg-gradient-to-b from-stone-800 to-stone-950 rounded flex flex-col items-center justify-between p-1 transition-colors duration-200 ${
                  isArmLifted && isHoveringVinyl
                    ? 'border border-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.65)]'
                    : 'border border-amber-400/90'
                }`}
              >
                {/* Finger lift handle */}
                <div className="absolute -right-2.5 top-1.5 w-3.5 h-1.5 bg-amber-400 rounded-r shadow-sm" />
                {/* Brand gold mark */}
                <div className="w-3.5 h-0.5 bg-amber-400 mt-1" />
                {/* Stylus Needle Tip */}
                <div
                  className={`relative w-2 h-2.5 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isPlaying && !isArmLifted
                      ? 'bg-amber-300 shadow-[0_0_12px_rgba(251,191,36,1)] scale-110'
                      : 'bg-amber-400/80 shadow-[0_0_6px_rgba(251,191,36,0.5)]'
                  }`}
                >
                  {isPlaying && !isArmLifted && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Top Gimbal Cap Screw (FIXED ABOVE PIVOT AT z-40 - POROS TERKUNCI DI SINI) */}
          <div className="absolute right-7 sm:right-10 top-6 sm:top-8 w-12 h-12 flex items-center justify-center z-40 pointer-events-none">
            <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-amber-600 to-amber-300 border border-amber-200/70 shadow-md flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-stone-900/80" />
            </div>
          </div>
        </div>
      </div>

      {/* Needle Status & Duration Sync */}
      <div className="mt-3 space-y-2">
        <p className="text-stone-300 text-xs sm:text-sm font-sans tracking-wide">
          {isArmLifted ? (
            isHoveringVinyl ? (
              <span className="text-amber-300 font-medium">
                Lepaskan jarum untuk meletakkan ujungnya di atas piringan hitam & memutar lagu...
              </span>
            ) : (
              <span className="text-stone-300">
                Jarum terangkat. Geser batangnya ke atas piringan hitam di sebelah kiri.
              </span>
            )
          ) : isPlaying ? (
            <span className="text-amber-300/90 flex items-center justify-center gap-2">
              <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />
              Jarum menimpa piringan hitam yang sedang berputar. Musik mengaliri ruang hampa.
            </span>
          ) : (
            <span className="text-stone-400">
              Geser & taruh ujung jarum ke atas piringan hitam, atau{' '}
              <strong>tahan tombol tengah 2 detik</strong> untuk memutar musik.
            </span>
          )}
        </p>

        {/* Live Audio Duration connected with Timeline */}
        {isPlaying && (
          <div className="flex items-center justify-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-stone-900/90 border border-stone-800 rounded-full text-xs font-mono text-amber-300 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Linimasa Musik: {formatTime(currentTime)} / {formatTime(duration)}</span>
            </div>
          </div>
        )}

        {/* Poetic Note */}
        <AnimatePresence>
          {isPlaying && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="py-2 border-t border-b border-stone-800/80 max-w-md mx-auto"
            >
              <p className="text-stone-200 text-base sm:text-lg font-serif italic text-balance">
                "Dengarkan lagunya dulu. Ada hal yang cuma bisa aku sampaikan lewat ini."
              </p>
              <span className="text-[11px] text-stone-500 font-sans tracking-wider block mt-1">
                Sedang memutar: {EXHIBITION_CONFIG.audio.title}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* PRIMARY UNMISSABLE NEXT BUTTON */}
      <div className="mt-5 w-full max-w-md mx-auto flex flex-col items-center gap-3">
        <button
          onClick={handleNextClick}
          className={`w-full py-4 px-6 rounded-2xl font-sans font-bold text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-3 transition-all shadow-[0_10px_30px_rgba(245,158,11,0.35)] cursor-pointer active:scale-[0.99] ${
            isPlaying
              ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 text-stone-950 animate-pulse'
              : 'bg-stone-100 hover:bg-white text-stone-950'
          }`}
        >
          <span>Lanjut ke Orbit Memories (Galeri Foto)</span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
