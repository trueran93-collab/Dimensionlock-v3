// Web Audio API sound engine - synthesized sounds

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this._masterGain = null;
  }

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._masterGain = this.ctx.createGain();
      this._masterGain.gain.value = 0.6;
      this._masterGain.connect(this.ctx.destination);
    } catch (e) {
      this.enabled = false;
    }
  }

  _time() { return this.ctx ? this.ctx.currentTime : 0; }

  _osc(freq, type, duration, gainVal, detune = 0) {
    if (!this.ctx || !this.enabled) return;
    const now = this._time();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;
    osc.connect(gain);
    gain.connect(this._masterGain);
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  }

  _noise(duration, gainVal, filterFreq = 1000) {
    if (!this.ctx || !this.enabled) return;
    const now = this._time();
    const bufSize = Math.floor(this.ctx.sampleRate * duration);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 0.8);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = filterFreq;
    filt.Q.value = 3;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    src.connect(filt);
    filt.connect(gain);
    gain.connect(this._masterGain);
    src.start(now);
  }

  playJump() {
    if (!this.ctx || !this.enabled) return;
    const now = this._time();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.12);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain); gain.connect(this._masterGain);
    osc.start(now); osc.stop(now + 0.18);
  }

  playDoubleJump() {
    if (!this.ctx || !this.enabled) return;
    const now = this._time();
    [0, 0.05, 0.1].forEach((delay, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 300 + i * 150;
      gain.gain.setValueAtTime(0.15, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.1);
      osc.connect(gain); gain.connect(this._masterGain);
      osc.start(now + delay); osc.stop(now + delay + 0.1);
    });
  }

  playLightAttack() {
    this._noise(0.15, 0.35, 1800);
    this._osc(400, 'sawtooth', 0.08, 0.1);
  }

  playHeavyAttack() {
    if (!this.ctx || !this.enabled) return;
    const now = this._time();
    // Deep whoosh
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.35);
    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain); gain.connect(this._masterGain);
    osc.start(now); osc.stop(now + 0.35);
    this._noise(0.25, 0.5, 600);
  }

  playSpecialAttack() {
    if (!this.ctx || !this.enabled) return;
    const now = this._time();
    // Ominous dark chord
    [80, 120, 160, 200].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.detune.value = i * 7;
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc.connect(gain); gain.connect(this._masterGain);
      osc.start(now + i * 0.04); osc.stop(now + 0.9);
    });
    this._noise(0.4, 0.3, 300);
  }

  playHit() {
    if (!this.ctx || !this.enabled) return;
    const now = this._time();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.06);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain); gain.connect(this._masterGain);
    osc.start(now); osc.stop(now + 0.1);
  }

  playPlayerHurt() {
    if (!this.ctx || !this.enabled) return;
    const now = this._time();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.25);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain); gain.connect(this._masterGain);
    osc.start(now); osc.stop(now + 0.3);
  }

  playDash() {
    this._noise(0.12, 0.25, 2500);
    this._osc(600, 'sine', 0.1, 0.15);
  }

  playBossRoar() {
    if (!this.ctx || !this.enabled) return;
    const now = this._time();
    const carrier = this.ctx.createOscillator();
    const mod = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const gain = this.ctx.createGain();
    mod.frequency.value = 8;
    modGain.gain.value = 40;
    mod.connect(modGain);
    modGain.connect(carrier.frequency);
    carrier.type = 'sawtooth';
    carrier.frequency.value = 60;
    carrier.connect(gain);
    gain.connect(this._masterGain);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.6, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2);
    mod.start(now); carrier.start(now);
    mod.stop(now + 2); carrier.stop(now + 2);
    this._noise(1, 0.3, 150);
  }

  playFloorClear() {
    if (!this.ctx || !this.enabled) return;
    const now = this._time();
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.25);
      osc.connect(gain); gain.connect(this._masterGain);
      osc.start(now + i * 0.12); osc.stop(now + i * 0.12 + 0.3);
    });
  }

  playUpgradeSelect() {
    if (!this.ctx || !this.enabled) return;
    const now = this._time();
    [440, 554, 659].forEach((freq, i) => {
      this._osc(freq, 'sine', 0.3, 0.15);
    });
  }

  playSoulPickup() {
    if (!this.ctx || !this.enabled) return;
    const now = this._time();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.12);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain); gain.connect(this._masterGain);
    osc.start(now); osc.stop(now + 0.15);
  }

  playUltimate() {
    if (!this.ctx || !this.enabled) return;
    const now = this._time();
    // Big resonant chord swell
    [110, 165, 220, 330, 440].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = i < 2 ? 'sawtooth' : 'sine';
      osc.frequency.value = freq;
      osc.detune.value = i * 4;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
      osc.connect(gain); gain.connect(this._masterGain);
      osc.start(now); osc.stop(now + 1.9);
    });
    this._noise(0.8, 0.45, 800);
  }
}

export const soundEngine = new SoundEngine();
