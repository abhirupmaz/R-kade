/**
 * Advanced Multi-Platform Mobile Haptics Engine
 * Optimized for both Android (Vibration API) and iOS (Acoustic Chassis Transducer + WebKit Taptic)
 */
class HapticsEngine {
  private iosTriggerEl: HTMLInputElement | null = null;
  private audioCtx: AudioContext | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private enabled: boolean = true;

  constructor() {
    this.initIosTrigger();
    this.attachUnlockListeners();
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private attachUnlockListeners() {
    if (typeof window !== 'undefined') {
      const unlock = () => {
        this.initAudio();
        window.removeEventListener('touchstart', unlock);
        window.removeEventListener('touchend', unlock);
        window.removeEventListener('click', unlock);
      };
      window.addEventListener('touchstart', unlock, { passive: true, once: true });
      window.addEventListener('touchend', unlock, { passive: true, once: true });
      window.addEventListener('click', unlock, { passive: true, once: true });
    }
  }

  private initIosTrigger() {
    if (typeof document !== 'undefined') {
      try {
        const existing = document.getElementById('ios-haptic-trigger');
        if (!existing) {
          const el = document.createElement('input');
          el.id = 'ios-haptic-trigger';
          el.type = 'checkbox';
          el.style.position = 'fixed';
          el.style.top = '-9999px';
          el.style.left = '-9999px';
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
          document.body?.appendChild(el);
          this.iosTriggerEl = el;
        } else {
          this.iosTriggerEl = existing as HTMLInputElement;
        }
      } catch {
        // ignore
      }
    }
  }

  public initAudio() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioClass) {
        this.audioCtx = new AudioClass();
        // Setup compressor for maximum punchy bass without clipping
        this.compressor = this.audioCtx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-24, this.audioCtx.currentTime);
        this.compressor.knee.setValueAtTime(30, this.audioCtx.currentTime);
        this.compressor.ratio.setValueAtTime(12, this.audioCtx.currentTime);
        this.compressor.attack.setValueAtTime(0.003, this.audioCtx.currentTime);
        this.compressor.release.setValueAtTime(0.25, this.audioCtx.currentTime);
        this.compressor.connect(this.audioCtx.destination);
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /**
   * Generates a sub-bass physical acoustic vibration impulse through the iPhone/Android speaker driver
   */
  private playAcousticHapticThud(startFreq: number = 120, endFreq: number = 28, duration: number = 0.07, gainVal: number = 0.95) {
    if (!this.enabled) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      // Triangle wave has rich sub-harmonic punch that physically displaces speaker driver
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(startFreq, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), this.audioCtx.currentTime + duration);

      gain.gain.setValueAtTime(gainVal, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

      if (this.compressor) {
        osc.connect(gain);
        gain.connect(this.compressor);
      } else {
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
      }

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch {
      // ignore
    }
  }

  /**
   * Trigger iOS Taptic Engine through input change
   */
  private triggerIosHaptic() {
    if (!this.enabled) return;
    if (this.iosTriggerEl) {
      this.iosTriggerEl.checked = !this.iosTriggerEl.checked;
    }
  }

  /**
   * Subtle tactile tick for key taps
   */
  public vibrateKey() {
    if (!this.enabled) return;

    // 1. Android Vibration API
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(35);
      } catch {
        // ignore
      }
    }

    // 2. iOS Taptic Trigger
    this.triggerIosHaptic();

    // 3. Acoustic Sub-bass punch (38Hz transient)
    this.playAcousticHapticThud(95, 36, 0.04, 0.6);
  }

  /**
   * Rapid double-buzz for invalid words / errors
   */
  public vibrateError() {
    if (!this.enabled) return;

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([140, 60, 180]);
      } catch {
        // ignore
      }
    }

    this.triggerIosHaptic();
    this.playAcousticHapticThud(140, 28, 0.12, 1.0);
    setTimeout(() => {
      this.triggerIosHaptic();
      this.playAcousticHapticThud(110, 24, 0.14, 1.0);
    }, 110);
  }

  /**
   * Tactile shake pulse for incorrect evaluated guess
   */
  public vibrateWrongGuess() {
    if (!this.enabled) return;

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([120, 60, 160]);
      } catch {
        // ignore
      }
    }

    this.triggerIosHaptic();
    this.playAcousticHapticThud(130, 30, 0.1, 0.9);
    setTimeout(() => {
      this.triggerIosHaptic();
      this.playAcousticHapticThud(100, 26, 0.12, 0.95);
    }, 100);
  }

  /**
   * Distinct haptic pulse for revealing a single letter tile
   */
  public vibrateTileReveal(status: string) {
    if (!this.enabled) return;

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        if (status === 'correct') {
          navigator.vibrate(70);
        } else if (status === 'present') {
          navigator.vibrate(45);
        } else {
          navigator.vibrate(30);
        }
      } catch {
        // ignore
      }
    }

    this.triggerIosHaptic();
    const startFreq = status === 'correct' ? 140 : status === 'present' ? 100 : 70;
    const endFreq = status === 'correct' ? 45 : status === 'present' ? 35 : 28;
    this.playAcousticHapticThud(startFreq, endFreq, 0.06, 0.7);
  }

  /**
   * Triumphant short pulses for victory
   */
  public vibrateWin() {
    if (!this.enabled) return;

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([80, 40, 80, 40, 220]);
      } catch {
        // ignore
      }
    }

    this.triggerIosHaptic();
    this.playAcousticHapticThud(160, 45, 0.15, 0.85);
  }

  /**
   * Heavy drop buzz for game loss
   */
  public vibrateLoss() {
    if (!this.enabled) return;

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([200, 90, 300]);
      } catch {
        // ignore
      }
    }

    this.triggerIosHaptic();
    this.playAcousticHapticThud(85, 20, 0.28, 1.0);
  }
}

export const haptics = new HapticsEngine();
