import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Disc } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

export type ChapterType = 'gateway' | 'gallery' | 'timeline' | 'twoworlds' | 'letter';

interface NavigationHeaderProps {
  currentChapter: ChapterType;
  onSelectChapter: (chapter: ChapterType) => void;
  isAudioUnlocked: boolean;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  currentChapter,
  onSelectChapter,
  isAudioUnlocked,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    setIsPlaying(audioEngine.isPlaying());
    setIsMuted(audioEngine.getIsMuted());

    const unsub = audioEngine.onPlayStateChange((playing) => {
      setIsPlaying(playing);
    });
    return () => unsub();
  }, []);

  const toggleSound = () => {
    if (!isPlaying && !isAudioUnlocked) {
      audioEngine.start();
    } else {
      const muted = audioEngine.toggleMute();
      setIsMuted(muted);
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full flex items-center justify-between gap-8 px-4 sm:px-8 py-3.5 border-b border-stone-800/80 bg-black/60 backdrop-blur-md">
      {/* Zone 1: Single text element wordmark */}
      <button
        onClick={() => onSelectChapter('gateway')}
        className="text-base sm:text-lg font-serif font-light tracking-wider text-stone-100 hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        <span>Against The Gravity</span>
      </button>

      {/* Zone 2: 4 clean single-line nav links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-sans font-medium text-stone-400">
        <button
          onClick={() => onSelectChapter('gateway')}
          className={`hover:text-stone-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            currentChapter === 'gateway' ? 'text-amber-300 underline underline-offset-4' : ''
          }`}
        >
          The Gateway
        </button>
        <button
          onClick={() => onSelectChapter('gallery')}
          className={`hover:text-stone-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            currentChapter === 'gallery' ? 'text-amber-300 underline underline-offset-4' : ''
          }`}
        >
          Orbit Memories
        </button>
        <button
          onClick={() => onSelectChapter('timeline')}
          className={`hover:text-stone-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            currentChapter === 'timeline' ? 'text-amber-300 underline underline-offset-4' : ''
          }`}
        >
          Timeline
        </button>
        <button
          onClick={() => onSelectChapter('twoworlds')}
          className={`hover:text-stone-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            currentChapter === 'twoworlds' ? 'text-amber-300 underline underline-offset-4' : ''
          }`}
        >
          Two Worlds
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Subtle audio mute toggle indicator */}
        <button
          onClick={toggleSound}
          className="p-1.5 text-stone-400 hover:text-amber-300 rounded-lg transition-colors cursor-pointer"
          title={isMuted ? 'Nyalakan suara' : 'Bisukan suara'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className={`w-4 h-4 ${isPlaying ? 'text-amber-400 animate-pulse' : ''}`} />}
        </button>

        <button
          onClick={() => onSelectChapter('letter')}
          className="px-3.5 py-1.5 text-xs font-sans font-medium text-stone-950 bg-stone-100 hover:bg-white rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Read Letter
        </button>
      </div>
    </header>
  );
};
