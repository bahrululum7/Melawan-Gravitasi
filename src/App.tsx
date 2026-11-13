/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AudioReactiveSpace } from './components/AudioReactiveSpace';
import { NavigationHeader, ChapterType } from './components/NavigationHeader';
import { GatewayVinyl } from './components/GatewayVinyl';
import { FloatingOrbitGallery } from './components/FloatingOrbitGallery';
import { LyricMemoryTimeline } from './components/LyricMemoryTimeline';
import { PullingTwoWorlds } from './components/PullingTwoWorlds';
import { MiracleLetter } from './components/MiracleLetter';

export default function App() {
  const [currentChapter, setCurrentChapter] = useState<ChapterType>('gateway');
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);

  const handleAudioStarted = () => {
    setIsAudioUnlocked(true);
  };

  const handleNextChapter = () => {
    setCurrentChapter('gallery');
  };

  const handleTwoWorldsMerged = () => {
    setCurrentChapter('letter');
  };

  const handleRestart = () => {
    setCurrentChapter('gateway');
  };

  return (
    <div className="relative min-h-screen w-full bg-[#050507] text-stone-100 flex flex-col justify-between overflow-x-hidden selection:bg-amber-500/30 selection:text-amber-200">
      {/* Real-time Audio-Reactive Zero-Gravity Canvas Background */}
      <AudioReactiveSpace />

      {/* Subtle Analog Film Grain Overlay */}
      <div className="fixed inset-0 pointer-events-none z-1 grain-overlay opacity-60" aria-hidden="true" />

      {/* Top Bar Contract Navigation */}
      <NavigationHeader
        currentChapter={currentChapter}
        onSelectChapter={(ch) => setCurrentChapter(ch)}
        isAudioUnlocked={isAudioUnlocked}
      />

      {/* Main Exhibition Stage */}
      <main className="relative flex-1 flex flex-col justify-center items-center">
        <AnimatePresence mode="wait">
          {currentChapter === 'gateway' && (
            <motion.section
              key="gateway"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="w-full flex-1 flex items-center justify-center"
            >
              <GatewayVinyl
                onAudioStarted={handleAudioStarted}
                onNextChapter={handleNextChapter}
                isUnlocked={isAudioUnlocked}
              />
            </motion.section>
          )}

          {currentChapter === 'gallery' && (
            <motion.section
              key="gallery"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="w-full flex-1"
            >
              <FloatingOrbitGallery onNextChapter={() => setCurrentChapter('timeline')} />
            </motion.section>
          )}

          {currentChapter === 'timeline' && (
            <motion.section
              key="timeline"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="w-full flex-1 flex items-center justify-center"
            >
              <LyricMemoryTimeline onNextChapter={() => setCurrentChapter('twoworlds')} />
            </motion.section>
          )}

          {currentChapter === 'twoworlds' && (
            <motion.section
              key="twoworlds"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="w-full flex-1 flex items-center justify-center"
            >
              <PullingTwoWorlds onSuccess={handleTwoWorldsMerged} />
            </motion.section>
          )}

          {currentChapter === 'letter' && (
            <motion.section
              key="letter"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="w-full flex-1 flex items-center justify-center"
            >
              <MiracleLetter onRestart={handleRestart} />
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Discrete Curatorial Footer */}
      <footer className="relative z-10 w-full py-3 px-6 border-t border-stone-900/80 bg-black/40 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-500 font-sans gap-2">
        <div className="flex items-center gap-2">
          <span>Against The Gravity</span>
          <span aria-hidden="true">·</span>
          <span>Virtual Memory Space</span>
          <span aria-hidden="true">·</span>
          <span className="italic font-serif text-stone-400">"Satu persen kemungkinan untuk sebuah keajaiban"</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentChapter('gateway')}
            className={`hover:text-stone-300 transition-colors ${currentChapter === 'gateway' ? 'text-amber-400' : ''}`}
          >
            01 Gateway
          </button>
          <button
            onClick={() => setCurrentChapter('gallery')}
            className={`hover:text-stone-300 transition-colors ${currentChapter === 'gallery' ? 'text-amber-400' : ''}`}
          >
            02 Floating Orbit
          </button>
          <button
            onClick={() => setCurrentChapter('timeline')}
            className={`hover:text-stone-300 transition-colors ${currentChapter === 'timeline' ? 'text-amber-400' : ''}`}
          >
            03 Timeline
          </button>
          <button
            onClick={() => setCurrentChapter('twoworlds')}
            className={`hover:text-stone-300 transition-colors ${currentChapter === 'twoworlds' ? 'text-amber-400' : ''}`}
          >
            04 Two Worlds
          </button>
          <button
            onClick={() => setCurrentChapter('letter')}
            className={`hover:text-stone-300 transition-colors ${currentChapter === 'letter' ? 'text-amber-400' : ''}`}
          >
            05 Miracle Letter
          </button>
        </div>
      </footer>
    </div>
  );
}
