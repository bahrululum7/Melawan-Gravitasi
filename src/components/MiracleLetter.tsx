import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Infinity as InfinityIcon, Share2, Sparkles, RefreshCw } from 'lucide-react';
import { EXHIBITION_CONFIG } from '../config/exhibitionData';

interface MiracleLetterProps {
  onRestart: () => void;
}

const formatWhatsAppNumber = (raw: string): string => {
  const digits = raw.replace(/[^0-9]/g, '');
  if (digits.startsWith('0')) {
    return `62${digits.slice(1)}`;
  }
  return digits;
};

export const MiracleLetter: React.FC<MiracleLetterProps> = ({ onRestart }) => {
  const [isCopied, setIsCopied] = useState(false);

  const recipientName = EXHIBITION_CONFIG.letter.recipientName || 'Untukmu yang Selalu Menghuni Doaku';
  const senderName = EXHIBITION_CONFIG.letter.senderName || 'Seseorang yang Masih Memilihmu';
  const cleanNumber = formatWhatsAppNumber(EXHIBITION_CONFIG.letter.whatsappNumber || '081297109701');
  const encodedText = encodeURIComponent(
    EXHIBITION_CONFIG.letter.whatsappMessage ||
      'rifki... mungkin kita bisa perbaiki hal hal yang menjadi kekhawatiran kita belakangan ini ?'
  );
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedText}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="relative z-10 w-full min-h-[90vh] flex flex-col items-center justify-center p-4 sm:p-8 max-w-4xl mx-auto select-none">
      {/* Chapter Indicator */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-6"
      >
        <span className="text-xs uppercase tracking-[0.3em] text-amber-300 font-sans block mb-1">
          Chapter 05 · The Final Revelation
        </span>
        <h2 className="text-3xl sm:text-5xl font-serif text-stone-100 font-light">
          The Miracle Letter
        </h2>
      </motion.div>

      {/* Unfolding Digital Parchment Paper */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, rotateX: 20 }}
        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-2xl bg-[#f7f4ee] text-[#1f1c19] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] border border-stone-300 p-6 sm:p-10 overflow-hidden"
      >
        {/* Paper texture overlay & watermark */}
        <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(#d6cebe_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Vintage Top Stamp & Date */}
        <div className="relative z-10 flex items-center justify-between border-b border-stone-300/80 pb-4 mb-6 text-xs text-stone-600 font-serif">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-600/70" />
            <span className="italic">Ruang Hampa, Di Luar Gravitasi Waktu</span>
          </div>
          <span className="font-mono text-[11px] text-stone-500">
            Naskah Terbuka
          </span>
        </div>

        {/* Recipient Header */}
        <div className="relative z-10 mb-6">
          <h3 className="text-xl sm:text-2xl font-serif italic text-stone-900 font-medium">
            {recipientName},
          </h3>
        </div>

        {/* Core Letter Body */}
        <div className="relative z-10 space-y-4 font-serif text-base sm:text-lg text-stone-800 leading-relaxed sm:leading-loose">
          <p className="first-letter:text-5xl first-letter:font-serif first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:text-stone-900 first-letter:mt-1">
            Mungkin hukum alam atau logika bilang jalan kita buntu. Keadaan seolah menarik kita ke dua arah yang berlawanan, membuat setiap langkah terasa berat dan mustahil.
          </p>
          <p>
            Tapi kalau ada satu persen kemungkinan untuk sebuah keajaiban, aku memilih untuk berdiri di satu persen itu bareng kamu.
          </p>
          <p className="italic text-stone-900 font-medium">
            Maafkan kesalahanku, ya. Ambil waktumu, aku nggak ke mana-mana.
          </p>
        </div>

        {/* Sign-off */}
        <div className="relative z-10 mt-8 pt-6 border-t border-stone-300/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-stone-500 block font-sans tracking-wide">
              Tertanda dengan ketulusan,
            </span>
            <span className="text-base font-serif italic text-stone-900 font-semibold block mt-1">
              {senderName}
            </span>
          </div>

          {/* Wax Seal Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#e8e2d5] border border-amber-600/30 rounded-full text-xs font-serif text-amber-900">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>Gravitasi Hati</span>
          </div>
        </div>
      </motion.div>

      {/* Primary Action: Infinity Symbol Button -> Direct WhatsApp Chat */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="mt-8 flex flex-col items-center gap-4 w-full max-w-md"
      >
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group w-full py-4 px-6 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-sans font-semibold rounded-2xl shadow-[0_10px_35px_rgba(245,158,11,0.4)] hover:shadow-[0_15px_45px_rgba(245,158,11,0.6)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 cursor-pointer"
        >
          {/* Infinity Icon Symbol */}
          <InfinityIcon className="w-7 h-7 text-stone-950 group-hover:rotate-180 transition-transform duration-700" />
          <span className="text-sm sm:text-base tracking-wide font-medium">
            Beri aku satu kesempatan untuk bicara langsung
          </span>
        </a>

        {/* Secondary Utility Controls */}
        <div className="flex items-center justify-center gap-4 text-xs text-stone-400 font-sans">
          <button
            onClick={handleCopyLink}
            className="hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{isCopied ? 'Tautan Disalin!' : 'Salin Tautan'}</span>
          </button>
          <span>·</span>
          <button
            onClick={onRestart}
            className="hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Ulangi Pameran</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
