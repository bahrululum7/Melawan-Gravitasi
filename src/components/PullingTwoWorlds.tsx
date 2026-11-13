import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';
import { EXHIBITION_CONFIG } from '../config/exhibitionData';

interface PullingTwoWorldsProps {
  onSuccess: () => void;
}

interface VortexPhoto {
  id: number;
  image: string;
  initialRx: number;
  initialRy: number;
  progress: number; // 0 = outer orbit, 1 = swallowed into center
  delayProgress: number; // staggered inward pull start so inner rings clear smoothly
  angle: number;
  angularVelocity: number; // rad per second (gentle, steady orbit)
  tilt: number; // subtle photo tilt in degrees
  scale: number;
  opacity: number;
  posX: number;
  posY: number;
  isSwallowed: boolean;
}

export const PullingTwoWorlds: React.FC<PullingTwoWorldsProps> = ({ onSuccess }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Positions normalized between 0 and 1 (x-axis)
  const [orbAPos, setOrbAPos] = useState(0.18); // "Kamu"
  const [orbBPos, setOrbBPos] = useState(0.82); // "Dia"
  const [isMerged, setIsMerged] = useState(false);
  const [isVortexActive, setIsVortexActive] = useState(false);
  const [showSupernovaBloom, setShowSupernovaBloom] = useState(false);

  const activeTouchesRef = useRef<Map<number, 'A' | 'B'>>(new Map());
  const mouseDraggingRef = useRef<'A' | 'B' | null>(null);

  // Memory photos state for Black Hole Gravitational Vortex
  const [vortexPhotos, setVortexPhotos] = useState<VortexPhoto[]>([]);
  const vortexAnimFrameRef = useRef<number | null>(null);
  const bloomTriggeredRef = useRef(false);

  // Continuous repulsive force simulation (logic and reality pulling them apart)
  useEffect(() => {
    if (isMerged || isVortexActive) return;

    const interval = window.setInterval(() => {
      setOrbAPos((prevA) => {
        if (mouseDraggingRef.current === 'A' || activeTouchesRef.current.get(1) === 'A') return prevA;
        return prevA + (0.18 - prevA) * 0.04;
      });

      setOrbBPos((prevB) => {
        if (mouseDraggingRef.current === 'B' || activeTouchesRef.current.get(2) === 'B') return prevB;
        return prevB + (0.82 - prevB) * 0.04;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [isMerged, isVortexActive]);

  // Check collision / merge when positions change
  useEffect(() => {
    if (isMerged || isVortexActive) return;

    const dist = Math.abs(orbBPos - orbAPos);
    const centerPoint = (orbAPos + orbBPos) / 2;
    const isNearCenter = Math.abs(centerPoint - 0.5) < 0.12;

    if (dist < 0.08 && isNearCenter) {
      triggerMerge();
    }
  }, [orbAPos, orbBPos, isMerged, isVortexActive]);

  // Trigger collision -> initiates slow, clear Black Hole Gravitational Singularity
  const triggerMerge = () => {
    if (isMerged || isVortexActive) return;
    setIsMerged(true);
    setOrbAPos(0.5);
    setOrbBPos(0.5);
    setIsVortexActive(true);
    bloomTriggeredRef.current = false;

    audioEngine.start();

    const memoriesList = EXHIBITION_CONFIG.memories;
    const customVortexList = EXHIBITION_CONFIG.vortexPhotos || [];
    const count = customVortexList.length > 0 ? customVortexList.length : 20;

    // Fit all concentric rings comfortably inside viewport so every photo is clearly visible
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const maxRx = Math.max(130, vw * 0.42 - 44);
    const maxRy = Math.max(145, vh * 0.36 - 48);

    const initialPhotos: VortexPhoto[] = Array.from({ length: count }, (_, i) => {
      const fallbackMem = memoriesList[i % memoriesList.length];
      const photoImg = customVortexList[i] || fallbackMem.image;

      // Distribute across 3 well-spaced rings so photos don't pile on top of each other
      const ringIndex = i % 3; // 0 = inner-mid, 1 = middle, 2 = outer
      const ringFraction = 0.54 + ringIndex * 0.22 + (Math.random() - 0.5) * 0.06;
      const initialRx = maxRx * ringFraction;
      const initialRy = maxRy * ringFraction;

      // Even angular spread + slight offset per ring
      const initialAngle = (i / count) * Math.PI * 2 + ringIndex * 0.45;
      const posX = Math.cos(initialAngle) * initialRx;
      const posY = Math.sin(initialAngle) * initialRy;

      return {
        id: i,
        image: photoImg,
        initialRx,
        initialRy,
        progress: 0,
        // Stagger inward pull gently (inner ring goes slightly sooner, outer ring follows)
        delayProgress: ringIndex * 0.08 + (i / count) * 0.14,
        angle: initialAngle,
        angularVelocity: 0.24 + (2 - ringIndex) * 0.06, // gentle ~0.24 - 0.36 rad/s
        tilt: (Math.random() - 0.5) * 14, // subtle readable polaroid tilt
        scale: 1,
        opacity: 0,
        posX,
        posY,
        isSwallowed: false,
      };
    });

    setVortexPhotos(initialPhotos);

    // Slow, graceful ~10.5s delta-time physics loop so every photo is clearly seen before absorption
    const startTime = performance.now();
    let lastTime = startTime;
    const totalDuration = 10500; // 10.5 seconds total

    const runVortexPhysics = (now: number) => {
      const elapsed = now - startTime;
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const globalProgress = Math.min(1, elapsed / totalDuration);

      setVortexPhotos((prevPhotos) =>
        prevPhotos.map((p) => {
          // Hold outer orbit briefly (~1.8s) so user can admire all photos clearly first,
          // then ease gently inward into the event horizon
          const fadeInOpacity = Math.min(1, elapsed / 1100);

          // Normalized individual absorption progress after initial reveal & stagger
          const startThreshold = 0.14 + p.delayProgress;
          const localSpan = Math.max(0.25, 0.94 - startThreshold);
          const rawPull = Math.max(0, Math.min(1, (globalProgress - startThreshold) / localSpan));

          // Smooth ease-in curve: moves slowly at first, only accelerates near the singularity
          const easedPull = rawPull * rawPull * (0.45 + 0.55 * rawPull);

          const radiusFactor = Math.max(0, 1 - easedPull);
          const currentRx = p.initialRx * radiusFactor;
          const currentRy = p.initialRy * radiusFactor;

          // Subtle conservation of angular momentum (spins faster only when very close to core)
          const angularBoost = 1 + easedPull * 1.8;
          const newAngle = p.angle + p.angularVelocity * angularBoost * dt;

          const posX = Math.cos(newAngle) * currentRx;
          const posY = Math.sin(newAngle) * currentRy;

          // Keep photo full-size (1.0 -> 0.85) through most of its orbit, shrinking only as it enters center
          const newScale = radiusFactor > 0.35
            ? 0.85 + 0.15 * ((radiusFactor - 0.35) / 0.65)
            : Math.max(0.06, (radiusFactor / 0.35) * 0.85);

          // Fade smoothly only right before disappearing into the event horizon
          const swallowFade = radiusFactor < 0.16 ? Math.max(0, radiusFactor / 0.16) : 1;
          const newOpacity = fadeInOpacity * swallowFade;

          return {
            ...p,
            progress: rawPull,
            angle: newAngle,
            posX,
            posY,
            scale: newScale,
            opacity: newOpacity,
            isSwallowed: radiusFactor <= 0.03,
          };
        })
      );

      // Trigger Supernova Bloom once near the end of collapse
      if (globalProgress > 0.88 && !bloomTriggeredRef.current) {
        bloomTriggeredRef.current = true;
        setShowSupernovaBloom(true);
      }

      if (globalProgress < 1) {
        vortexAnimFrameRef.current = requestAnimationFrame(runVortexPhysics);
      } else {
        setTimeout(() => {
          onSuccess();
        }, 900);
      }
    };

    vortexAnimFrameRef.current = requestAnimationFrame(runVortexPhysics);
  };

  useEffect(() => {
    return () => {
      if (vortexAnimFrameRef.current) {
        cancelAnimationFrame(vortexAnimFrameRef.current);
      }
    };
  }, []);

  // Mouse drag handlers
  const handleMouseDown = (orb: 'A' | 'B') => {
    if (isMerged || isVortexActive) return;
    mouseDraggingRef.current = orb;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!mouseDraggingRef.current || isMerged || isVortexActive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const normalizedX = Math.max(0.08, Math.min(0.92, (e.clientX - rect.left) / rect.width));

    if (mouseDraggingRef.current === 'A') {
      setOrbAPos(Math.min(normalizedX, orbBPos - 0.02));
    } else if (mouseDraggingRef.current === 'B') {
      setOrbBPos(Math.max(normalizedX, orbAPos + 0.02));
    }
  };

  const handleMouseUp = () => {
    mouseDraggingRef.current = null;
  };

  // Touch handlers for multi-touch (dual finger drag)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isMerged || isVortexActive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const normX = (touch.clientX - rect.left) / rect.width;

      const distA = Math.abs(normX - orbAPos);
      const distB = Math.abs(normX - orbBPos);

      if (distA < distB && distA < 0.25) {
        activeTouchesRef.current.set(touch.identifier, 'A');
      } else if (distB <= distA && distB < 0.25) {
        activeTouchesRef.current.set(touch.identifier, 'B');
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isMerged || isVortexActive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const assigned = activeTouchesRef.current.get(touch.identifier);
      if (!assigned) continue;

      const normX = Math.max(0.08, Math.min(0.92, (touch.clientX - rect.left) / rect.width));
      if (assigned === 'A') {
        setOrbAPos(() => Math.min(normX, orbBPos - 0.02));
      } else if (assigned === 'B') {
        setOrbBPos(() => Math.max(normX, orbAPos + 0.02));
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      activeTouchesRef.current.delete(e.changedTouches[i].identifier);
    }
  };

  const handleCenterSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isMerged || isVortexActive) return;
    const val = parseFloat(e.target.value);
    const newA = 0.18 + val * (0.5 - 0.18);
    const newB = 0.82 - val * (0.82 - 0.5);
    setOrbAPos(newA);
    setOrbBPos(newB);
  };

  const progressPercent = Math.min(100, Math.max(0, ((1 - Math.abs(orbBPos - orbAPos) / (0.82 - 0.18))) * 100));

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full min-h-[85vh] flex flex-col justify-between items-center p-4 sm:p-8 max-w-5xl mx-auto select-none overflow-hidden"
    >
      {/* MEMORY PHOTOS BLACK HOLE GRAVITATIONAL VORTEX TRANSITION OVERLAY */}
      <AnimatePresence>
        {isVortexActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl pointer-events-none overflow-hidden"
          >
            {/* Swirling Relativistic Accretion Ring Distortion */}
            <div className="absolute w-[340px] sm:w-[540px] h-[340px] sm:h-[540px] rounded-full border border-amber-500/20 animate-[spin_18s_linear_infinite]" />
            <div className="absolute w-[240px] sm:w-[380px] h-[240px] sm:h-[380px] rounded-full border border-cyan-500/20 animate-[spin_12s_linear_infinite_reverse]" />
            <div className="absolute w-[150px] sm:w-[230px] h-[150px] sm:h-[230px] rounded-full border border-amber-400/40 animate-[spin_7s_linear_infinite]" />

            {/* Central Black Hole Singularity Event Horizon */}
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-black shadow-[0_0_80px_#f59e0b,0_0_140px_#06b6d4,inset_0_0_40px_#000] border-2 border-amber-400/80 flex items-center justify-center z-20">
              <div className="w-14 h-14 rounded-full bg-black shadow-[inset_0_0_20px_#000]" />
              <div className="absolute inset-[-12px] rounded-full border border-amber-300/60 blur-xs animate-pulse" />
            </div>

            {/* MEMORY PHOTOS SLOWLY ORBITING & GENTLY ABSORBED INTO THE BLACK HOLE */}
            {vortexPhotos.map((photo) => {
              if (photo.isSwallowed) return null;

              return (
                <div
                  key={photo.id}
                  style={{
                    transform: `translate3d(${photo.posX}px, ${photo.posY}px, 0px) rotate(${photo.tilt}deg) scale(${photo.scale})`,
                    opacity: photo.opacity,
                    willChange: 'transform, opacity',
                  }}
                  className="absolute pointer-events-none z-10"
                >
                  {/* Crisp Polaroid Frame so every photo is clearly visible */}
                  <div className="w-24 sm:w-32 p-1.5 pb-2.5 bg-stone-900/95 border border-stone-700/80 rounded-lg shadow-[0_12px_30px_rgba(0,0,0,0.9)]">
                    <div className="w-full aspect-[4/3] rounded overflow-hidden bg-stone-950">
                      <img
                        src={photo.image}
                        alt=""
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.src = '/images/foto1.jpeg';
                        }}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Floating Poetic Revelation Text during Singularity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 1.2 }}
              className="absolute bottom-10 sm:bottom-14 z-30 text-center px-4"
            >
              <span className="text-xs uppercase tracking-[0.3em] text-amber-300 font-sans block mb-1">
                Singularity of Love
              </span>
              <p className="text-base sm:text-xl font-serif italic text-stone-200 max-w-md mx-auto">
                "Semua jarak dan logika runtuh... Seluruh memori kita ditarik perlahan ke dalam satu titik keajaiban."
              </p>
            </motion.div>

            {/* Final Radiant Supernova Bloom upon Collapsing into Letter */}
            <AnimatePresence>
              {showSupernovaBloom && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  className="absolute inset-0 bg-gradient-to-t from-amber-400 via-amber-200 to-white z-40 backdrop-blur-3xl"
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Editorial Context */}
      <div className="text-center space-y-2 mt-2">
        <span className="text-xs uppercase tracking-[0.25em] text-stone-400 font-sans block">
          Chapter 04 · Interaksi Puncak
        </span>
        <h2 className="text-3xl sm:text-5xl font-serif text-stone-100 font-light text-balance">
          Pulling Two Worlds Together
        </h2>
        <p className="text-xs sm:text-sm text-stone-400 font-serif italic max-w-xl mx-auto">
          "Logika dan keadaan menarik kita menjauh. Tapi jika kamu mau, tarik kedua titik cahaya ini ke tengah melawan semua gaya tolak itu."
        </p>
      </div>

      {/* Interactive Arena */}
      <div className="relative w-full h-80 sm:h-96 my-auto flex items-center justify-center">
        {/* Center Gravitational Well Indicator */}
        <div className="absolute w-28 h-28 sm:w-36 sm:h-36 rounded-full border border-dashed border-stone-800 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-amber-500/5 blur-md" />
          <span className="text-[10px] uppercase tracking-widest text-stone-600 font-sans">
            Pusat Gravitasi
          </span>
        </div>

        {/* Repulsive particles between them */}
        {!isMerged && (
          <div className="absolute inset-x-12 h-1 bg-stone-900 rounded-full overflow-hidden pointer-events-none">
            <div
              style={{
                left: `${orbAPos * 100}%`,
                width: `${Math.max(0, (orbBPos - orbAPos) * 100)}%`,
              }}
              className="absolute h-full bg-gradient-to-r from-amber-500/40 via-red-500/30 to-cyan-500/40 transition-all duration-75"
            />
          </div>
        )}

        {/* ORB A: "Kamu" (Amber / Warm Gold) */}
        <div
          onMouseDown={() => handleMouseDown('A')}
          style={{
            left: `${orbAPos * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className={`absolute top-1/2 cursor-grab active:cursor-grabbing transition-transform duration-75 ${
            isMerged ? 'scale-125' : ''
          }`}
        >
          <div className="relative flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 shadow-[0_0_40px_rgba(245,158,11,0.6)] flex items-center justify-center animate-pulse">
              <div className="w-6 h-6 rounded-full bg-white shadow-inner" />
            </div>
            <span className="mt-2 text-xs font-serif tracking-wider text-amber-200 whitespace-nowrap bg-stone-950/80 px-2 py-0.5 rounded border border-amber-500/30">
              Kamu
            </span>
          </div>
        </div>

        {/* ORB B: "Dia" (Celestial Cyan / Moon Starlight) */}
        <div
          onMouseDown={() => handleMouseDown('B')}
          style={{
            left: `${orbBPos * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className={`absolute top-1/2 cursor-grab active:cursor-grabbing transition-transform duration-75 ${
            isMerged ? 'scale-125' : ''
          }`}
        >
          <div className="relative flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-cyan-600 via-sky-400 to-indigo-200 shadow-[0_0_40px_rgba(6,182,212,0.6)] flex items-center justify-center animate-pulse">
              <div className="w-6 h-6 rounded-full bg-white shadow-inner" />
            </div>
            <span className="mt-2 text-xs font-serif tracking-wider text-cyan-200 whitespace-nowrap bg-stone-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
              Dia
            </span>
          </div>
        </div>
      </div>

      {/* Tension Meter & Instructions */}
      <div className="w-full max-w-md mx-auto space-y-4 text-center">
        {/* Instructions */}
        <div className="bg-stone-950/70 border border-stone-800/80 rounded-xl p-3.5 backdrop-blur-sm">
          <p className="text-xs sm:text-sm text-stone-300 font-sans">
            {isMerged ? (
              <span className="text-amber-300 font-serif italic text-base flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                "Kedua dunia telah menyatu. Keajaiban itu nyata."
              </span>
            ) : (
              <span>
                Gunakan dua jari di layar HP (atau seret kedua bola cahaya / tuas di bawah) untuk mempertemukan keduanya di tengah.
              </span>
            )}
          </p>

          {/* Magnetic Pull Slider */}
          {!isMerged && (
            <div className="mt-3 pt-3 border-t border-stone-900 flex items-center gap-3">
              <span className="text-[10px] text-stone-500 uppercase tracking-wider font-sans whitespace-nowrap">
                Tarik Bersama
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={progressPercent / 100}
                onChange={handleCenterSlider}
                className="w-full accent-amber-400 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
              />
              <span className="text-[11px] font-mono text-amber-300 min-w-[36px]">
                {Math.floor(progressPercent)}%
              </span>
            </div>
          )}
        </div>

        {/* PROMINENT NEXT BUTTON: PROCEED TO SURAT HARAPAN */}
        <div className="flex flex-col items-center gap-2 pt-1">
          <button
            onClick={triggerMerge}
            className="w-full py-3.5 px-6 rounded-2xl font-sans font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-[0_8px_25px_rgba(245,158,11,0.35)] cursor-pointer active:scale-[0.98] bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 text-stone-950"
          >
            <span>Satukan Dunia & Buka Surat Harapan</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
