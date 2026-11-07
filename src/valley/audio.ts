/**
 * Audio engine with background "Ram Siya Ram" devotional track by default
 * and celebratory firework/diya sound effects
 */

class ValleyAudio {
  private ctx: AudioContext | null = null;
  private bgMusic: HTMLAudioElement | null = null;
  private isMuted: boolean = false;
  private isPlayingMusic: boolean = false;
  private userExplicitlyMuted: boolean = false;
  private filterNode: BiquadFilterNode | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.bgMusic = new Audio('/assets/aistudio/ram_siya_ram_dc31cc96.mp3');
        this.bgMusic.loop = true;
        this.bgMusic.volume = 0.75;
        this.bgMusic.preload = 'auto';
      } catch (e) {
        console.warn('Failed to load background audio:', e);
      }
    }
  }

  public initAudio() {
    if (typeof window === 'undefined') return;

    // Start background music immediately by default
    this.startBackgroundMusic();

    // Register one-time user gesture handler if autoplay was blocked by browser
    this.enableOnUserGesture();
  }

  public startBackgroundMusic() {
    if (!this.bgMusic || this.userExplicitlyMuted) return;

    this.isMuted = false;
    this.bgMusic.volume = 0.75;
    this.bgMusic.play().then(() => {
      this.isPlayingMusic = true;
    }).catch(() => {
      // If browser blocked unmuted autoplay before gesture, keep unmuted intent;
      // enableOnUserGesture will immediately play on first touch.
      this.isPlayingMusic = false;
    });
  }

  public enableOnUserGesture() {
    if (typeof window === 'undefined') return;

    const resumeAudio = () => {
      if (this.bgMusic && !this.userExplicitlyMuted) {
        this.isMuted = false;
        this.bgMusic.volume = 0.75;
        this.bgMusic.play().then(() => {
          this.isPlayingMusic = true;
        }).catch(() => {});
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    };

    window.addEventListener('pointerdown', resumeAudio, { once: true });
    window.addEventListener('touchstart', resumeAudio, { once: true });
    window.addEventListener('click', resumeAudio, { once: true });
  }

  public toggleMute(): boolean {
    if (!this.bgMusic) {
      this.isMuted = !this.isMuted;
      return this.isMuted;
    }

    if (!this.isMuted) {
      // Mute / Pause
      this.bgMusic.pause();
      this.isPlayingMusic = false;
      this.isMuted = true;
      this.userExplicitlyMuted = true;
    } else {
      // Unmute / Play
      this.userExplicitlyMuted = false;
      this.isMuted = false;
      this.bgMusic.volume = 0.75;
      this.bgMusic.play().then(() => {
        this.isPlayingMusic = true;
      }).catch(() => {});
    }

    return this.isMuted;
  }

  public playFireworkBurst() {
    if (this.isMuted) return;

    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtx();
      }

      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;

      // Soft deep bass thump
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();

      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(80, now);
      bassOsc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

      bassGain.gain.setValueAtTime(0.06, now);
      bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      bassOsc.connect(bassGain);
      bassGain.connect(this.ctx.destination);

      bassOsc.start(now);
      bassOsc.stop(now + 0.5);

      // Soft crackle sparkle noise
      const bufferSize = this.ctx.sampleRate * 0.25;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(2200, now);
      noiseFilter.Q.setValueAtTime(1.5, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.025, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

      whiteNoise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.3);
    } catch {}
  }

  public playDiyaIgnitionSound() {
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtx();
      }

      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880];

      notes.forEach((f, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.07);

        gain.gain.setValueAtTime(0.001, now + i * 0.07);
        gain.gain.linearRampToValueAtTime(0.035, now + i * 0.07 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.07 + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 1.4);
      });
    } catch {}
  }

  public setMuffled(muffled: boolean) {
    if (this.bgMusic) {
      this.bgMusic.volume = muffled ? 0.35 : 0.75;
    }
  }

  public get muted(): boolean {
    return this.isMuted;
  }

  public dispose() {
    if (this.bgMusic) {
      try {
        this.bgMusic.pause();
        this.bgMusic = null;
      } catch {}
    }
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {}
    }
  }
}

export const audioStore = new ValleyAudio();
