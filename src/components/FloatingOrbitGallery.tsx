import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCw, X, Sparkles, HeartHandshake, ArrowRight } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';
import { EXHIBITION_CONFIG, MemoryConfig } from '../config/exhibitionData';

export interface MemoryItem extends MemoryConfig {
  isRepaired?: boolean;
}

interface PhysicsCard {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vr: number;
  scale: number;
  width: number;
  height: number;
  memory: MemoryItem;
}

interface FloatingOrbitGalleryProps {
  onNextChapter: () => void;
}

export const FloatingOrbitGallery: React.FC<FloatingOrbitGalleryProps> = ({ onNextChapter }) => {
  const [memories, setMemories] = useState<MemoryItem[]>(() =>
    EXHIBITION_CONFIG.memories.map((m) => ({ ...m, isRepaired: false }))
  );
  const [activeMemory, setActiveMemory] = useState<MemoryItem | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [repairProgress, setRepairProgress] = useState(0);
  const [isHoldingRepair, setIsHoldingRepair] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<PhysicsCard[]>([]);
  const isDraggingRef = useRef<{ id: string; startX: number; startY: number; mouseStartX: number; mouseStartY: number; lastMouseX: number; lastMouseY: number; lastTime: number } | null>(null);
  const repairIntervalRef = useRef<number | null>(null);

  // Initialize floating physics positions
  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;

    cardsRef.current = memories.map((mem, i) => {
      // Distribute around center in an organic zero-gravity cluster
      const angle = (i / memories.length) * Math.PI * 2 + Math.PI * 0.25;
      const radius = Math.min(w, h) * 0.26 + (i % 2) * 40;
      const cardW = w < 640 ? 170 : 210;
      const cardH = cardW * 1.25;

      return {
        id: mem.id,
        x: w * 0.5 + Math.cos(angle) * radius - cardW * 0.5,
        y: h * 0.48 + Math.sin(angle) * radius - cardH * 0.5,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        rotation: (Math.random() - 0.5) * 14,
        vr: (Math.random() - 0.5) * 0.08,
        scale: 1,
        width: cardW,
        height: cardH,
        memory: mem,
      };
    });

    let animId: number;
    const updatePhysics = () => {
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;

      cardsRef.current.forEach((card) => {
        if (isDraggingRef.current?.id === card.id) return;

        card.x += card.vx;
        card.y += card.vy;
        card.rotation += card.vr;

        card.vx *= 0.992;
        card.vy *= 0.992;
        card.vr *= 0.99;

        card.vx += (Math.random() - 0.5) * 0.03;
        card.vy += (Math.random() - 0.5) * 0.03;

        const padding = 16;
        const topSafe = 80;
        const bottomSafe = screenH - 90;

        if (card.x < padding) {
          card.x = padding;
          card.vx = Math.abs(card.vx) * 0.7;
        } else if (card.x + card.width > screenW - padding) {
          card.x = screenW - padding - card.width;
          card.vx = -Math.abs(card.vx) * 0.7;
        }

        if (card.y < topSafe) {
          card.y = topSafe;
          card.vy = Math.abs(card.vy) * 0.7;
        } else if (card.y + card.height > bottomSafe) {
          card.y = bottomSafe - card.height;
          card.vy = -Math.abs(card.vy) * 0.7;
        }

        const el = document.getElementById(`physics-card-${card.id}`);
        if (el) {
          el.style.transform = `translate3d(${card.x}px, ${card.y}px, 0px) rotate(${card.rotation}deg)`;
        }
      });

      animId = requestAnimationFrame(updatePhysics);
    };

    animId = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(animId);
  }, [memories]);

  // Handle pointer down (drag & throw starts)
  const handlePointerDown = (e: React.PointerEvent, cardId: string) => {
    if (activeMemory) return;

    const card = cardsRef.current.find((c) => c.id === cardId);
    if (!card) return;

    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    isDraggingRef.current = {
      id: cardId,
      startX: card.x,
      startY: card.y,
      mouseStartX: e.clientX,
      mouseStartY: e.clientY,
      lastMouseX: e.clientX,
      lastMouseY: e.clientY,
      lastTime: Date.now(),
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const { id, startX, startY, mouseStartX, mouseStartY, lastTime } = isDraggingRef.current;
    const card = cardsRef.current.find((c) => c.id === id);
    if (!card) return;

    const dx = e.clientX - mouseStartX;
    const dy = e.clientY - mouseStartY;

    card.x = startX + dx;
    card.y = startY + dy;

    const now = Date.now();
    const dt = Math.max(1, now - lastTime);
    card.vx = (e.clientX - isDraggingRef.current.lastMouseX) / dt * 8;
    card.vy = (e.clientY - isDraggingRef.current.lastMouseY) / dt * 8;
    card.vr = card.vx * 0.05;

    isDraggingRef.current.lastMouseX = e.clientX;
    isDraggingRef.current.lastMouseY = e.clientY;
    isDraggingRef.current.lastTime = now;

    const el = document.getElementById(`physics-card-${card.id}`);
    if (el) {
      el.style.transform = `translate3d(${card.x}px, ${card.y}px, 0px) rotate(${card.rotation}deg) scale(1.04)`;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const { id, mouseStartX, mouseStartY } = isDraggingRef.current;
    const card = cardsRef.current.find((c) => c.id === id);

    const dist = Math.hypot(e.clientX - mouseStartX, e.clientY - mouseStartY);
    isDraggingRef.current = null;

    if (dist < 6 && card) {
      openMemory(card.memory);
    }
  };

  const openMemory = (mem: MemoryItem) => {
    setActiveMemory(mem);
    setIsFlipped(false);
    audioEngine.duckVolume(true);
  };

  const closeMemory = () => {
    setActiveMemory(null);
    setIsFlipped(false);
    audioEngine.duckVolume(false);
  };

  // Repair Cracked Memory Long-Press Interaction
  const startRepairHold = () => {
    if (!activeMemory?.isCracked || activeMemory.isRepaired) return;
    setIsHoldingRepair(true);
    const startTime = Date.now();
    const duration = 2400; // 2.4 seconds hold to heal

    if (repairIntervalRef.current) clearInterval(repairIntervalRef.current);
    repairIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const p = Math.min(100, (elapsed / duration) * 100);
      setRepairProgress(p);

      if (p >= 100) {
        clearInterval(repairIntervalRef.current!);
        repairIntervalRef.current = null;
        triggerRepairSuccess();
      }
    }, 30);
  };

  const stopRepairHold = () => {
    setIsHoldingRepair(false);
    if (repairIntervalRef.current) {
      clearInterval(repairIntervalRef.current);
      repairIntervalRef.current = null;
    }
    if (repairProgress < 100) {
      setRepairProgress(0);
    }
  };

// Severe Shattered Glass Overlay Component
// Obscures the photo underneath so the original image is completely hidden when broken
const ShatteredGlassOverlay: React.FC<{
  progress?: number; // 0 to 100
  isHolding?: boolean;
  isThumbnail?: boolean;
}> = ({ progress = 0, isHolding = false, isThumbnail = false }) => {
  const normProgress = Math.min(1, Math.max(0, progress / 100));
  const shardOpacity = Math.max(0, 1 - normProgress * 1.05);
  const strokeColor = isHolding && normProgress > 0.05
    ? `rgba(245, 158, 11, ${Math.max(0.4, 1 - normProgress * 0.4)})`
    : 'rgba(255, 255, 255, 0.9)';
  const glowFilter = isHolding && normProgress > 0.05 ? 'drop-shadow(0 0 6px #f59e0b)' : 'none';

  return (
    <div
      style={{ opacity: shardOpacity }}
      className="absolute inset-0 pointer-events-none overflow-hidden transition-opacity duration-150 z-10"
    >
      {/* Heavy dark frosted obscuring backdrop: completely blocks out original photo */}
      <div
        style={{ opacity: Math.max(0, 0.92 - normProgress * 0.95) }}
        className="absolute inset-0 bg-gradient-to-br from-stone-950 via-stone-900/95 to-black backdrop-blur-md"
      />

      <svg
        className="w-full h-full absolute inset-0"
        viewBox="0 0 200 150"
        preserveAspectRatio="none"
        style={{ filter: glowFilter }}
      >
        {/* Dense interlocking dark shards covering 100% of the surface */}
        <polygon points="0,0 70,0 55,60 0,40" fill="rgba(10, 8, 14, 0.96)" stroke={strokeColor} strokeWidth="1.4" />
        <polygon points="70,0 140,0 115,50 55,60" fill="rgba(18, 14, 22, 0.94)" stroke={strokeColor} strokeWidth="1.4" />
        <polygon points="140,0 200,0 200,45 145,55 115,50" fill="rgba(8, 7, 12, 0.97)" stroke={strokeColor} strokeWidth="1.4" />
        <polygon points="0,40 55,60 30,105 0,90" fill="rgba(20, 15, 24, 0.95)" stroke={strokeColor} strokeWidth="1.4" />
        <polygon points="55,60 115,50 90,92 30,105" fill="rgba(12, 10, 16, 0.98)" stroke={strokeColor} strokeWidth="1.6" />
        <polygon points="115,50 145,55 170,100 90,92" fill="rgba(16, 12, 20, 0.93)" stroke={strokeColor} strokeWidth="1.4" />
        <polygon points="145,55 200,45 200,110 170,100" fill="rgba(9, 8, 13, 0.96)" stroke={strokeColor} strokeWidth="1.4" />
        <polygon points="0,90 30,105 45,150 0,150" fill="rgba(14, 11, 18, 0.95)" stroke={strokeColor} strokeWidth="1.4" />
        <polygon points="30,105 90,92 115,150 45,150" fill="rgba(22, 16, 26, 0.93)" stroke={strokeColor} strokeWidth="1.4" />
        <polygon points="90,92 170,100 155,150 115,150" fill="rgba(11, 9, 15, 0.97)" stroke={strokeColor} strokeWidth="1.4" />
        <polygon points="170,100 200,110 200,150 155,150" fill="rgba(15, 12, 19, 0.95)" stroke={strokeColor} strokeWidth="1.4" />

        {/* Secondary sharp fracture lines radiating across shards */}
        <line x1="55" y1="60" x2="20" y2="10" stroke={strokeColor} strokeWidth="0.9" />
        <line x1="55" y1="60" x2="85" y2="20" stroke={strokeColor} strokeWidth="0.9" />
        <line x1="55" y1="60" x2="10" y2="65" stroke={strokeColor} strokeWidth="0.9" />
        <line x1="55" y1="60" x2="70" y2="100" stroke={strokeColor} strokeWidth="0.9" />
        <line x1="55" y1="60" x2="35" y2="80" stroke={strokeColor} strokeWidth="0.9" />
        <path d="M 40,45 Q 55,40 70,50" fill="none" stroke={strokeColor} strokeWidth="0.8" />
        <path d="M 35,70 Q 55,75 75,65" fill="none" stroke={strokeColor} strokeWidth="0.8" />

        {/* Impact center 2 at (145, 55) */}
        <line x1="145" y1="55" x2="165" y2="15" stroke={strokeColor} strokeWidth="0.9" />
        <line x1="145" y1="55" x2="185" y2="75" stroke={strokeColor} strokeWidth="0.9" />
        <line x1="145" y1="55" x2="125" y2="95" stroke={strokeColor} strokeWidth="0.9" />
        <line x1="145" y1="55" x2="130" y2="20" stroke={strokeColor} strokeWidth="0.9" />
        <path d="M 125,40 Q 145,35 160,45" fill="none" stroke={strokeColor} strokeWidth="0.8" />
        <path d="M 120,65 Q 145,70 165,60" fill="none" stroke={strokeColor} strokeWidth="0.8" />

        {/* Glinting glass refraction prisms */}
        <polygon points="45,10 65,0 55,25" fill="rgba(255, 255, 255, 0.18)" />
        <polygon points="125,35 140,50 120,45" fill="rgba(255, 255, 255, 0.22)" />
        <polygon points="80,80 100,90 85,110" fill="rgba(255, 255, 255, 0.15)" />
      </svg>

      {/* Warning status badge */}
      <div className={`absolute top-2 right-2 px-1.5 py-0.5 bg-red-950/95 border border-red-500/80 rounded ${
        isThumbnail ? 'text-[8px]' : 'text-[9px]'
      } uppercase tracking-wider text-red-200 font-bold shadow-xl flex items-center gap-1`}>
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
        <span>Hancur & Retak Parah</span>
      </div>
    </div>
  );
};

  const triggerRepairSuccess = () => {
    setMemories((prev) =>
      prev.map((m) =>
        m.id === 'mem-4' || m.isCracked
          ? {
              ...m,
              isRepaired: true,
              image: m.image, // TETAP FOTO YANG SAMA (foto_retak.jpeg)
              title: 'Saat Kita Memilih Menyatu Kembali',
            }
          : m
      )
    );
    if (activeMemory && (activeMemory.id === 'mem-4' || activeMemory.isCracked)) {
      setActiveMemory((prev) =>
        prev
          ? {
              ...prev,
              isRepaired: true,
              image: prev.image, // TETAP FOTO YANG SAMA (foto_retak.jpeg)
              title: 'Saat Kita Memilih Menyatu Kembali',
            }
          : null
      );
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="relative w-full h-[88vh] overflow-hidden select-none"
    >
      {/* Editorial Chapter Header */}
      <div className="absolute top-4 left-0 right-0 z-20 pointer-events-none text-center px-4">
        <span className="text-xs uppercase tracking-[0.25em] text-stone-400 font-sans block mb-1">
          Virtual Memory Space · Chapter 02
        </span>
        <h2 className="text-2xl sm:text-3xl font-serif text-stone-100 font-light">
          The Floating Orbit
        </h2>
        <p className="text-xs sm:text-sm text-stone-400 font-serif italic mt-1 max-w-md mx-auto">
          "Foto-foto kenangan melayang tanpa bobot. Sentuh, lempar ke segala arah, atau ketuk untuk membaca isi di baliknya."
        </p>
      </div>

      {/* Floating Physics Cards in Zero Gravity */}
      {memories.map((mem) => {
        return (
          <div
            key={mem.id}
            id={`physics-card-${mem.id}`}
            onPointerDown={(e) => handlePointerDown(e, mem.id)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              willChange: 'transform',
              touchAction: 'none',
            }}
            className="group cursor-grab active:cursor-grabbing"
          >
            {/* Polaroid frame */}
            <div className="w-44 sm:w-52 p-2.5 pb-4 bg-stone-900/90 hover:bg-stone-800/95 border border-stone-800/80 rounded-xl shadow-[0_12px_30px_rgba(0,0,0,0.6)] backdrop-blur-md transition-shadow group-hover:shadow-[0_16px_36px_rgba(251,191,36,0.15)] flex flex-col items-center">
              {/* Photo Box */}
              <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-stone-950">
                <img
                  src={mem.image}
                  alt={mem.title}
                  referrerPolicy="no-referrer"
                  style={{
                    filter: mem.isCracked && !mem.isRepaired
                      ? 'blur(16px) brightness(0.18) grayscale(100%) contrast(190%)'
                      : 'none',
                  }}
                  className="w-full h-full object-cover transition-all duration-700"
                />

                {/* Severe Cracked Glass Overlay if not repaired */}
                {mem.isCracked && !mem.isRepaired && (
                  <ShatteredGlassOverlay isThumbnail={true} />
                )}

                {mem.isRepaired && (
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-amber-950/90 border border-amber-400/80 rounded text-[9px] uppercase tracking-wider text-amber-200 flex items-center gap-1 shadow-lg z-20">
                    <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                    <span>Pulih & Utuh</span>
                  </div>
                )}
              </div>

              {/* Caption */}
              <div className="w-full mt-2.5 text-left px-1">
                <span className="text-[10px] text-stone-500 font-sans block truncate">
                  {mem.date}
                </span>
                <h4 className="text-xs font-serif text-stone-200 font-medium truncate mt-0.5">
                  {mem.title}
                </h4>
              </div>
            </div>
          </div>
        );
      })}

      {/* Zoomed 3D Detail Modal with Flip Effect & Reparation Mechanism */}
      <AnimatePresence>
        {activeMemory && (
          <div
            onClick={closeMemory}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl pt-20 pb-6 px-4 sm:px-6 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg perspective-1000 my-auto"
            >
              {/* Close Button (Always visible below navbar & above card) */}
              <button
                onClick={closeMemory}
                className="ml-auto mb-3 px-3 py-1.5 text-xs font-sans text-stone-200 hover:text-white rounded-full bg-stone-900/95 hover:bg-stone-800 border border-stone-700/80 shadow-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Tutup"
              >
                <X className="w-4 h-4" />
                <span>Tutup</span>
              </button>

              {/* 3D Flippable Card */}
              <div
                className={`relative w-full min-h-[460px] preserve-3d transition-transform duration-700 rounded-2xl shadow-2xl ${
                  isFlipped ? 'rotate-y-180' : ''
                }`}
              >
                {/* FRONT FACE: Photo & Reparation Hold Mechanism */}
                <div className="absolute inset-0 backface-hidden bg-stone-900 border border-stone-800 rounded-2xl p-5 flex flex-col justify-between overflow-hidden shadow-2xl">
                  {/* Photo container */}
                  <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-stone-950 border border-stone-800/80">
                    {(() => {
                      const isBroken = activeMemory.isCracked && !activeMemory.isRepaired;
                      const progressRatio = isBroken ? repairProgress / 100 : 1;
                      const blurPx = isBroken ? (1 - progressRatio) * 24 : 0;
                      const brightnessVal = isBroken ? 0.14 + progressRatio * 0.86 : 1;
                      const grayscaleVal = isBroken ? (1 - progressRatio) * 100 : 0;
                      const contrastVal = isBroken ? 190 - progressRatio * 90 : 100;

                      return (
                        <>
                          <img
                            src={activeMemory.image}
                            alt={activeMemory.title}
                            referrerPolicy="no-referrer"
                            style={{
                              filter: isBroken
                                ? `blur(${blurPx}px) brightness(${brightnessVal}) grayscale(${grayscaleVal}%) contrast(${contrastVal}%)`
                                : 'none',
                              transition: isHoldingRepair ? 'none' : 'filter 0.5s ease-out',
                            }}
                            className="w-full h-full object-cover"
                          />

                          {/* Severe Shattered Glass Overlay with dynamic Kintsugi repair glow */}
                          {isBroken && (
                            <ShatteredGlassOverlay
                              progress={repairProgress}
                              isHolding={isHoldingRepair}
                              isThumbnail={false}
                            />
                          )}

                          {/* Repaired Golden Shimmer Flash */}
                          {activeMemory.isRepaired && (
                            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-amber-300/15 pointer-events-none z-20 animate-pulse" />
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* Cracked repair prompt or normal flip prompt */}
                  <div className="my-3 text-center space-y-2">
                    <span className="text-xs text-stone-400 font-sans tracking-wider block">
                      {activeMemory.date}
                    </span>
                    <h3 className="text-xl font-serif text-stone-100 font-light">
                      {activeMemory.title}
                    </h3>

                    {/* If cracked and not repaired: Hold to Heal instruction */}
                    {activeMemory.isCracked && !activeMemory.isRepaired && (
                      <div className="pt-2">
                        <p className="text-xs text-amber-300 font-sans tracking-wide mb-3">
                          "Tahan jarimu di sini untuk memperbaiki hubungan ini."
                        </p>
                        <button
                          onMouseDown={startRepairHold}
                          onMouseUp={stopRepairHold}
                          onMouseLeave={stopRepairHold}
                          onTouchStart={startRepairHold}
                          onTouchEnd={stopRepairHold}
                          className="relative inline-flex items-center justify-center px-6 py-3 bg-stone-950 border border-amber-500/50 hover:border-amber-400 rounded-xl text-xs uppercase tracking-widest text-amber-300 transition-all cursor-pointer shadow-lg active:scale-95 overflow-hidden"
                        >
                          {/* Radial fill progress */}
                          <div
                            style={{ width: `${repairProgress}%` }}
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-600/40 to-amber-400/40 transition-all duration-75 pointer-events-none"
                          />
                          <span className="relative z-10 flex items-center gap-2">
                            <HeartHandshake className="w-4 h-4 text-amber-400" />
                            {isHoldingRepair ? `Menyerap (${Math.floor(repairProgress)}%)` : 'Tahan Untuk Memperbaiki'}
                          </span>
                        </button>
                      </div>
                    )}

                    {activeMemory.isRepaired && (
                      <div className="text-xs text-amber-300 font-serif italic py-1 flex items-center justify-center gap-1.5 animate-pulse">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Retakan telah menyatu kembali. Foto dan kenangan ini kini kembali utuh dan jernih.</span>
                      </div>
                    )}
                  </div>

                  {/* Flip Action Button */}
                  <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-stone-500 font-sans">
                      Volume musik meredup agar kamu bisa membaca dalam hening
                    </span>
                    <button
                      onClick={() => setIsFlipped(true)}
                      className="px-3.5 py-1.5 text-xs text-stone-200 bg-stone-800 hover:bg-stone-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Balik Foto</span>
                    </button>
                  </div>
                </div>

                {/* BACK FACE: Handwritten note & backstory */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#16141a] border border-amber-500/20 rounded-2xl p-6 flex flex-col justify-between overflow-y-auto shadow-2xl text-stone-200">
                  <div>
                    <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                      <div>
                        <span className="text-[11px] uppercase tracking-widest text-amber-400 font-sans block">
                          Catatan di Balik Foto
                        </span>
                        <h4 className="text-lg font-serif text-stone-100 mt-0.5">
                          {activeMemory.title}
                        </h4>
                      </div>
                      <span className="text-xs text-stone-500 font-mono">
                        {activeMemory.date}
                      </span>
                    </div>

                    {/* Heartfelt story in editorial serif typography */}
                    <div className="mt-5 space-y-3 font-serif leading-relaxed text-stone-300 text-sm sm:text-base italic">
                      <p className="first-letter:text-3xl first-letter:font-serif first-letter:font-bold first-letter:float-left first-letter:mr-2 text-stone-200">
                        "{activeMemory.story}"
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-stone-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-stone-500 font-sans">
                      Ketuk tombol untuk melihat kembali foto depan
                    </span>
                    <button
                      onClick={() => setIsFlipped(false)}
                      className="px-3.5 py-1.5 text-xs text-stone-300 hover:text-white bg-stone-800/80 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Lihat Foto Depan</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Prominent Next Button to proceed to Timeline */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 pointer-events-auto w-full max-w-sm px-4">
        <button
          onClick={onNextChapter}
          className="w-full py-3.5 px-6 rounded-2xl font-sans font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-[0_8px_25px_rgba(245,158,11,0.35)] cursor-pointer active:scale-[0.98] bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 text-stone-950"
        >
          <span>Lanjut ke Timeline Lagu & Momen</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
