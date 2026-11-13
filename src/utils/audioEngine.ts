import { EXHIBITION_CONFIG } from '../config/exhibitionData';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;
  private isSynthesizing = false;
  private isCustomPlaying = false;
  private audioElement: HTMLAudioElement | null = null;
  private customSourceNode: MediaElementAudioSourceNode | null = null;
  private synthTimer: number | null = null;
  private currentStep = 0;
  private isMuted = false;
  private targetVolume = 0.7;
  private currentTime = 0;
  private duration = 180; // 3 minutes total timeline
  private playbackInterval: number | null = null;
  private onTimeUpdateCallbacks: Set<(time: number, duration: number) => void> = new Set();
  private onPlayStateChangeCallbacks: Set<(isPlaying: boolean) => void> = new Set();
  private crackleNode: AudioNode | null = null;

  // Emotional chord progression frequencies in Hz
  // Eb minor -> B major -> Db major -> Ab minor
  private chords = [
    [155.56, 185.0, 233.08, 277.18, 370.0], // Eb min9
    [123.47, 185.0, 246.94, 277.18, 370.0], // B maj9
    [138.59, 174.61, 207.65, 277.18, 329.63], // Db add9
    [103.83, 155.56, 207.65, 261.63, 311.13], // Ab min7
  ];

  public init() {
    if (this.ctx) return;
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtxClass();

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.85;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.targetVolume, this.ctx.currentTime);

    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
  }

  public loadAudioUrl(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.init();
      if (!this.ctx || !this.masterGain) {
        resolve(false);
        return;
      }

      if (!this.audioElement) {
        this.audioElement = new Audio();
        this.audioElement.loop = true;
        this.audioElement.preload = 'auto';
      }

      // Connect source node to Web Audio graph if not already connected
      if (!this.customSourceNode && this.ctx && this.masterGain) {
        try {
          this.customSourceNode = this.ctx.createMediaElementSource(this.audioElement);
          this.customSourceNode.connect(this.masterGain);
        } catch (e) {
          console.warn('MediaElementSource error:', e);
        }
      }

      // If already loaded and matching
      if (this.audioElement.src && this.audioElement.src.endsWith(url) && this.audioElement.readyState >= 1) {
        if (this.audioElement.duration && !isNaN(this.audioElement.duration)) {
          this.duration = this.audioElement.duration;
        }
        resolve(true);
        return;
      }

      this.audioElement.src = url;
      this.audioElement.load();

      this.audioElement.onloadedmetadata = () => {
        if (this.audioElement && this.audioElement.duration && !isNaN(this.audioElement.duration)) {
          this.duration = this.audioElement.duration;
        }
        resolve(true);
      };

      this.audioElement.oncanplay = () => {
        if (this.audioElement && this.audioElement.duration && !isNaN(this.audioElement.duration)) {
          this.duration = this.audioElement.duration;
        }
        resolve(true);
      };

      this.audioElement.onerror = (e) => {
        console.warn('Failed to load audio from url:', url, e);
        resolve(false);
      };

      // Immediate check if cached
      if (this.audioElement.readyState >= 1 && this.audioElement.duration) {
        this.duration = this.audioElement.duration;
        resolve(true);
      }
    });
  }

  public async start() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    const targetUrl = EXHIBITION_CONFIG.audio.audioUrl || '/audio/lagu-kita.mp3';
    if (targetUrl && (!this.audioElement || !this.audioElement.src)) {
      await this.loadAudioUrl(targetUrl);
    }

    if (this.audioElement && this.audioElement.src && !this.audioElement.error) {
      this.playCustom();
    } else {
      this.startSynthesizer();
    }
    this.startTimer();
    this.notifyPlayState(true);
  }

  private playCustom() {
    if (!this.audioElement) return;
    this.isSynthesizing = false;
    this.isCustomPlaying = true;
    const playPromise = this.audioElement.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('Audio play error, falling back to synthesizer:', err);
        this.startSynthesizer();
      });
    }
  }

  public pause() {
    if (this.audioElement) {
      this.audioElement.pause();
    }
    this.isSynthesizing = false;
    this.isCustomPlaying = false;
    if (this.synthTimer) {
      window.clearTimeout(this.synthTimer);
      this.synthTimer = null;
    }
    if (this.playbackInterval) {
      window.clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }
    this.notifyPlayState(false);
  }

  public togglePlay() {
    if (this.isPlaying()) {
      this.pause();
    } else {
      this.start();
    }
  }

  public isPlaying(): boolean {
    return this.isSynthesizing || this.isCustomPlaying;
  }

  public seek(seconds: number) {
    this.currentTime = Math.max(0, Math.min(seconds, this.duration));
    if (this.audioElement && this.isCustomPlaying) {
      this.audioElement.currentTime = this.currentTime;
    }
    this.notifyTime();
  }

  public setVolume(vol: number) {
    this.targetVolume = Math.max(0, Math.min(vol, 1));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.targetVolume, this.ctx.currentTime, 0.05);
    }
  }

  public duckVolume(duck: boolean) {
    if (!this.masterGain || !this.ctx) return;
    const vol = duck ? this.targetVolume * 0.35 : this.targetVolume;
    this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : vol, this.ctx.currentTime, 0.2);
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.targetVolume, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getFrequencyData(): Uint8Array {
    if (!this.analyser) {
      return new Uint8Array(128);
    }
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  public getBassEnergy(): number {
    if (!this.analyser) return 0;
    const data = new Uint8Array(32);
    this.analyser.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < 8; i++) {
      sum += data[i];
    }
    return sum / (8 * 255);
  }

  public loadCustomFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      this.init();
      if (!this.ctx || !this.masterGain) {
        reject(new Error('AudioContext not ready'));
        return;
      }

      const url = URL.createObjectURL(file);
      if (!this.audioElement) {
        this.audioElement = new Audio();
        this.audioElement.crossOrigin = 'anonymous';
        this.audioElement.loop = true;
      }

      this.audioElement.src = url;
      this.audioElement.onloadedmetadata = () => {
        if (this.audioElement) {
          this.duration = this.audioElement.duration || 180;
        }
        resolve(file.name);
      };

      if (!this.customSourceNode && this.ctx && this.masterGain) {
        this.customSourceNode = this.ctx.createMediaElementSource(this.audioElement);
        this.customSourceNode.connect(this.masterGain);
      }
    });
  }

  private startSynthesizer() {
    this.isSynthesizing = true;
    this.isCustomPlaying = false;
    this.startVinylCrackle();
    this.playChordStep();
  }

  private startVinylCrackle() {
    if (!this.ctx || !this.masterGain || this.crackleNode) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // sparse impulsive crackle like vintage dust
      const rand = Math.random();
      if (rand > 0.998) {
        output[i] = (Math.random() * 2 - 1) * 0.15;
      } else if (rand > 0.99) {
        output[i] = (Math.random() * 2 - 1) * 0.03;
      } else {
        output[i] = 0;
      }
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2400;

    const crackleGain = this.ctx.createGain();
    crackleGain.gain.value = 0.08;

    whiteNoise.connect(filter);
    filter.connect(crackleGain);
    crackleGain.connect(this.masterGain);
    whiteNoise.start();
    this.crackleNode = whiteNoise;
  }

  private playChordStep() {
    if (!this.isSynthesizing || !this.ctx || !this.masterGain) return;

    const chord = this.chords[this.currentStep % this.chords.length];
    const now = this.ctx.currentTime;
    const duration = 4.2;

    // Filtered warm pad chords
    chord.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      // gentle vibrato / detuning for dreamy warm resonance
      const detune = (idx - 2) * 4;
      osc.detune.setValueAtTime(detune, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600 + idx * 120, now);
      filter.frequency.exponentialRampToValueAtTime(1400, now + duration * 0.5);
      filter.frequency.exponentialRampToValueAtTime(500, now + duration);

      const peakGain = 0.09 / (chord.length * 0.5);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(peakGain, now + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + duration + 0.1);
    });

    // Sub-bass root drone
    const bassFreq = chord[0] * 0.5;
    const bassOsc = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();
    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(bassFreq, now);

    bassGain.gain.setValueAtTime(0.0001, now);
    bassGain.gain.exponentialRampToValueAtTime(0.12, now + 0.8);
    bassGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    bassOsc.connect(bassGain);
    bassGain.connect(this.masterGain);
    bassOsc.start(now);
    bassOsc.stop(now + duration + 0.1);

    // Subtle arpeggio chime note
    const arpeggioNote = chord[2 + (this.currentStep % 3)] * 2;
    const arpOsc = this.ctx.createOscillator();
    const arpGain = this.ctx.createGain();
    arpOsc.type = 'sine';
    arpOsc.frequency.setValueAtTime(arpeggioNote, now + 0.6);
    arpGain.gain.setValueAtTime(0.0001, now + 0.6);
    arpGain.gain.exponentialRampToValueAtTime(0.035, now + 0.7);
    arpGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);
    arpOsc.connect(arpGain);
    arpGain.connect(this.masterGain);
    arpOsc.start(now + 0.6);
    arpOsc.stop(now + 2.6);

    this.currentStep++;
    this.synthTimer = window.setTimeout(() => {
      this.playChordStep();
    }, (duration - 0.4) * 1000);
  }

  private startTimer() {
    if (this.playbackInterval) clearInterval(this.playbackInterval);
    this.playbackInterval = window.setInterval(() => {
      if (this.audioElement && this.isCustomPlaying) {
        this.currentTime = this.audioElement.currentTime;
      } else if (this.isSynthesizing) {
        this.currentTime = (this.currentTime + 0.25) % this.duration;
      }
      this.notifyTime();
    }, 250);
  }

  private notifyTime() {
    this.onTimeUpdateCallbacks.forEach((cb) => cb(this.currentTime, this.duration));
  }

  private notifyPlayState(isPlaying: boolean) {
    this.onPlayStateChangeCallbacks.forEach((cb) => cb(isPlaying));
  }

  public onTimeUpdate(cb: (time: number, duration: number) => void) {
    this.onTimeUpdateCallbacks.add(cb);
    return () => {
      this.onTimeUpdateCallbacks.delete(cb);
    };
  }

  public onPlayStateChange(cb: (isPlaying: boolean) => void) {
    this.onPlayStateChangeCallbacks.add(cb);
    return () => {
      this.onPlayStateChangeCallbacks.delete(cb);
    };
  }

  public getCurrentTime(): number {
    return this.currentTime;
  }

  public getDuration(): number {
    return this.duration;
  }
}

export const audioEngine = new AudioEngine();
