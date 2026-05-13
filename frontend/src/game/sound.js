// ============================================================
// DIMENSIONLOCK — Enhanced Web Audio Sound Engine
// Realistic SFX + Gothic Rock Music Synthesizer
// ============================================================

// ============================================================
// MUSIC ENGINE — Cinematic orchestral dark fantasy score
// Dark strings · Choir pads · Sub-bass drone · Sparse piano
// No drums — pure atmosphere
// ============================================================

class MusicEngine {
  constructor(ctx, masterGain) {
    this.ctx = ctx;

    this.musicGain = ctx.createGain();
    this.musicGain.gain.value = 0;
    this.musicGain.connect(masterGain);

    // ── Instrument buses ──────────────────────────────────
    this.stringsBus = ctx.createGain();
    this.stringsBus.gain.value = 0.42;
    this.stringsBus.connect(this.musicGain);

    this.choirBus = ctx.createGain();
    this.choirBus.gain.value = 0.28;
    this.choirBus.connect(this.musicGain);

    this.bassBus = ctx.createGain();
    this.bassBus.gain.value = 0.55;
    this.bassBus.connect(this.musicGain);

    this.pianoBus = ctx.createGain();
    this.pianoBus.gain.value = 0.32;
    this.pianoBus.connect(this.musicGain);

    this.tensionBus = ctx.createGain();
    this.tensionBus.gain.value = 0.18;
    this.tensionBus.connect(this.musicGain);

    // ── Heavy cinematic reverb ────────────────────────────
    const reverbBuf = this._makeImpulse(4.5, 1.8);
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = reverbBuf;
    const reverbSend = ctx.createGain();
    reverbSend.gain.value = 0.45;
    this.stringsBus.connect(reverbSend);
    this.choirBus.connect(reverbSend);
    this.pianoBus.connect(reverbSend);
    reverbSend.connect(this.reverb);
    this.reverb.connect(this.musicGain);

    // ── Scheduler ─────────────────────────────────────────
    this.playing = false;
    this.bossMode = false;
    this.nextBarTime = 0;
    this.currentBar = 0;
    this.totalBars = 8;
    this._timer = null;

    // 80 BPM — slow and ominous
    this.tempo   = 80;
    this.beatDur = 60 / this.tempo;     // 0.75s
    this.barDur  = this.beatDur * 4;    // 3.0s per bar
    this.scheduleAhead = 0.5;

    // ── D-minor cinematic progression ────────────────────
    // Each chord entry spans 2 bars (6s)
    this.chords = [
      { strings: [146.83, 220.00, 293.66], choir: [293.66, 349.23, 440.00], bassFreq: 73.42,  name: 'Dm' },
      { strings: [110.00, 164.81, 220.00], choir: [220.00, 261.63, 329.63], bassFreq: 55.00,  name: 'Am' },
      { strings: [116.54, 174.61, 233.08], choir: [233.08, 293.66, 349.23], bassFreq: 58.27,  name: 'Bb' },
      { strings: [130.81, 196.00, 261.63], choir: [261.63, 329.63, 392.00], bassFreq: 65.41,  name: 'C'  },
    ];

    // ── Sparse piano melody (freq, beatOffset, barSlot) ──
    // barSlot 0-7 maps to which of the 8 total bars it plays on
    this.pianoNotes = [
      [587.33, 0, 0], [440.00, 2, 0],
      [523.25, 0, 2], [392.00, 3, 2],
      [466.16, 0, 4], [349.23, 2, 4],
      [440.00, 0, 6], [523.25, 2, 6], [587.33, 3.5, 6],
    ];
  }

  // ── helpers ─────────────────────────────────────────────
  _makeImpulse(duration, decay) {
    const sr  = this.ctx.sampleRate;
    const len = Math.floor(sr * duration);
    const buf = this.ctx.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  _makeNoiseBuf(dur) {
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  // ── String section (slow attack, lush) ──────────────────
  _strings(chordIdx, time) {
    const chord = this.chords[chordIdx % 4];
    const dur   = this.barDur * 2 * 0.96; // lasts 2 bars

    chord.strings.forEach((freq, i) => {
      const osc  = this.ctx.createOscillator();
      const lpf  = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.detune.value = i % 2 === 0 ? -6 : 6; // warm detuned chorus

      lpf.type = 'lowpass';
      lpf.frequency.value = 1200;
      lpf.Q.value = 0.4;

      // Long attack → sustain → slow release
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.075, time + 2.8);
      gain.gain.setValueAtTime(0.068, time + dur - 2.0);
      gain.gain.linearRampToValueAtTime(0, time + dur);

      osc.connect(lpf); lpf.connect(gain); gain.connect(this.stringsBus);
      osc.start(time); osc.stop(time + dur + 0.1);

      // Slightly detuned double for warmth
      if (i === 0) {
        const osc2  = this.ctx.createOscillator();
        const g2    = this.ctx.createGain();
        osc2.type = 'sawtooth';
        osc2.frequency.value = freq;
        osc2.detune.value = 8;
        g2.gain.setValueAtTime(0, time);
        g2.gain.linearRampToValueAtTime(0.04, time + 3.2);
        g2.gain.linearRampToValueAtTime(0, time + dur);
        osc2.connect(lpf); osc2.connect(g2); g2.connect(this.stringsBus);
        osc2.start(time); osc2.stop(time + dur + 0.1);
      }
    });
  }

  // ── Choir pad (slow vibrato, vocal quality) ──────────────
  _choir(chordIdx, time) {
    const chord = this.chords[chordIdx % 4];
    const dur   = this.barDur * 2 * 0.95;

    chord.choir.forEach((freq, i) => {
      const osc    = this.ctx.createOscillator();
      const vib    = this.ctx.createOscillator();
      const vibGain = this.ctx.createGain();
      const gain   = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      // Choir vibrato (≈5.5 Hz, ±3 cents)
      vib.frequency.value = 5.5 + i * 0.3;
      vibGain.gain.value  = 2.8;
      vib.connect(vibGain); vibGain.connect(osc.frequency);

      // Very long attack — choir swells in slowly
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.055, time + 3.5);
      gain.gain.setValueAtTime(0.05, time + dur - 2.5);
      gain.gain.linearRampToValueAtTime(0, time + dur);

      osc.connect(gain); gain.connect(this.choirBus);
      osc.start(time); osc.stop(time + dur + 0.1);
      vib.start(time); vib.stop(time + dur + 0.1);
    });
  }

  // ── Sub-bass drone ────────────────────────────────────────
  _bass(chordIdx, time) {
    const chord = this.chords[chordIdx % 4];
    const dur   = this.barDur * 2 * 0.9;

    // Deep sine drone
    const osc  = this.ctx.createOscillator();
    const lpf  = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = chord.bassFreq;
    lpf.type = 'lowpass'; lpf.frequency.value = 160;

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.55, time + 1.8);
    gain.gain.setValueAtTime(0.5, time + dur - 1.5);
    gain.gain.linearRampToValueAtTime(0, time + dur);

    osc.connect(lpf); lpf.connect(gain); gain.connect(this.bassBus);
    osc.start(time); osc.stop(time + dur + 0.1);

    // Slow heartbeat pulse (every 2 beats)
    for (let beat = 0; beat < 8; beat++) {
      const pt   = time + beat * this.beatDur;
      const pOsc = this.ctx.createOscillator();
      const pGain = this.ctx.createGain();
      pOsc.type = 'sine';
      pOsc.frequency.value = chord.bassFreq * 0.5;
      pGain.gain.setValueAtTime(0, pt);
      pGain.gain.linearRampToValueAtTime(0.22, pt + 0.07);
      pGain.gain.exponentialRampToValueAtTime(0.001, pt + 0.55);
      pOsc.connect(pGain); pGain.connect(this.bassBus);
      pOsc.start(pt); pOsc.stop(pt + 0.6);
    }
  }

  // ── Sparse piano (plucked triangle tones) ────────────────
  _piano(barIndex, time) {
    const notes = this.pianoNotes.filter(n => n[2] === barIndex % 8);
    notes.forEach(([freq, beatOff]) => {
      const noteTime = time + beatOff * this.beatDur;
      const dur = this.beatDur * 2.2;

      // Piano body: triangle with quick attack
      const osc  = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(0.18, noteTime + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + dur);
      osc.connect(gain); gain.connect(this.pianoBus);
      osc.start(noteTime); osc.stop(noteTime + dur + 0.05);

      // Harmonic overtone (piano shimmer)
      const ov  = this.ctx.createOscillator();
      const ovG = this.ctx.createGain();
      ov.type = 'sine';
      ov.frequency.value = freq * 2;
      ovG.gain.setValueAtTime(0, noteTime);
      ovG.gain.linearRampToValueAtTime(0.06, noteTime + 0.01);
      ovG.gain.exponentialRampToValueAtTime(0.001, noteTime + dur * 0.35);
      ov.connect(ovG); ovG.connect(this.pianoBus);
      ov.start(noteTime); ov.stop(noteTime + dur * 0.4);
    });
  }

  // ── Tension layer (boss mode: low rumble + dissonance) ───
  _tension(chordIdx, time) {
    if (!this.bossMode) return;
    const chord = this.chords[chordIdx % 4];
    const dur   = this.barDur * 2;

    // Dissonant tritone
    const tritone = chord.bassFreq * Math.pow(2, 6 / 12); // augmented 4th
    [chord.bassFreq * 0.5, tritone].forEach(freq => {
      const osc  = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.06, time + 1.5);
      gain.gain.linearRampToValueAtTime(0, time + dur);
      osc.connect(gain); gain.connect(this.tensionBus);
      osc.start(time); osc.stop(time + dur + 0.1);
    });
  }

  // ── Bar scheduler ─────────────────────────────────────────
  _scheduleBar(barIndex, time) {
    const chordIdx = Math.floor(barIndex / 2) % 4;

    if (barIndex % 2 === 0) {
      // Chord changes every 2 bars
      this._strings(chordIdx, time);
      this._choir(chordIdx, time);
      this._bass(chordIdx, time);
      this._tension(chordIdx, time);
    }
    // Piano melody every bar
    this._piano(barIndex, time);
  }

  _runScheduler() {
    if (!this.playing) return;
    while (this.nextBarTime < this.ctx.currentTime + this.scheduleAhead) {
      this._scheduleBar(this.currentBar, this.nextBarTime);
      this.nextBarTime  += this.barDur;
      this.currentBar    = (this.currentBar + 1) % this.totalBars;
    }
  }

  // ── Public API ────────────────────────────────────────────
  start() {
    if (this.playing) return;
    this.playing = true;
    this.currentBar = 0;
    this.nextBarTime = this.ctx.currentTime + 0.15;
    this._runScheduler();
    this._timer = setInterval(() => this._runScheduler(), 80);
    this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.musicGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.musicGain.gain.linearRampToValueAtTime(0.44, this.ctx.currentTime + 4.0);
  }

  stop() {
    if (!this.playing) return;
    this.playing = false;
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    const ct = this.ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(ct);
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, ct);
    this.musicGain.gain.linearRampToValueAtTime(0, ct + 2.0);
  }

  pause() {
    const ct = this.ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(ct);
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, ct);
    this.musicGain.gain.linearRampToValueAtTime(0, ct + 0.5);
  }

  resume() {
    const target = this.bossMode ? 0.58 : 0.44;
    const ct = this.ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(ct);
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, ct);
    this.musicGain.gain.linearRampToValueAtTime(target, ct + 0.5);
  }

  setBossMode(enabled) {
    this.bossMode = enabled;
    if (enabled) {
      // Boss: speed up slightly, add tension layer
      this.tempo   = 95;
      this.beatDur = 60 / this.tempo;
      this.barDur  = this.beatDur * 4;
    } else {
      this.tempo   = 80;
      this.beatDur = 60 / this.tempo;
      this.barDur  = this.beatDur * 4;
    }
    const target = enabled ? 0.58 : 0.44;
    const ct = this.ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(ct);
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, ct);
    this.musicGain.gain.linearRampToValueAtTime(target, ct + 1.2);
  }

  // Switch chord progression key based on biome
  setTheme(themeIdx) {
    const ct = this.ctx.currentTime;
    const themes = [
      // 0: Gothic violet — D minor (default, dark)
      [
        { strings: [146.83, 220.00, 293.66], choir: [293.66, 349.23, 440.00], bassFreq: 73.42 },
        { strings: [110.00, 164.81, 220.00], choir: [220.00, 261.63, 329.63], bassFreq: 55.00 },
        { strings: [116.54, 174.61, 233.08], choir: [233.08, 293.66, 349.23], bassFreq: 58.27 },
        { strings: [130.81, 196.00, 261.63], choir: [261.63, 329.63, 392.00], bassFreq: 65.41 },
      ],
      // 1: Toxic cyber — E minor pentatonic, slightly brighter, faster
      [
        { strings: [164.81, 246.94, 329.63], choir: [329.63, 392.00, 493.88], bassFreq: 82.41 },
        { strings: [123.47, 184.99, 246.94], choir: [246.94, 311.13, 369.99], bassFreq: 61.74 },
        { strings: [146.83, 220.00, 293.66], choir: [293.66, 349.23, 440.00], bassFreq: 73.42 },
        { strings: [164.81, 246.94, 329.63], choir: [329.63, 392.00, 493.88], bassFreq: 82.41 },
      ],
      // 2: Hellfire — F# minor, ominous high tension
      [
        { strings: [185.00, 277.18, 369.99], choir: [369.99, 440.00, 554.37], bassFreq: 92.50 },
        { strings: [138.59, 207.65, 277.18], choir: [277.18, 329.63, 415.30], bassFreq: 69.30 },
        { strings: [146.83, 220.00, 293.66], choir: [293.66, 349.23, 440.00], bassFreq: 73.42 },
        { strings: [164.81, 246.94, 329.63], choir: [329.63, 392.00, 493.88], bassFreq: 82.41 },
      ],
      // 3: Void blue — C minor, ethereal, slower
      [
        { strings: [130.81, 196.00, 261.63], choir: [261.63, 311.13, 392.00], bassFreq: 65.41 },
        { strings: [103.83, 155.56, 207.65], choir: [207.65, 246.94, 311.13], bassFreq: 51.91 },
        { strings: [110.00, 164.81, 220.00], choir: [220.00, 261.63, 329.63], bassFreq: 55.00 },
        { strings: [123.47, 184.99, 246.94], choir: [246.94, 293.66, 369.99], bassFreq: 61.74 },
      ],
    ];
    this.chords = (themes[themeIdx % 4] || themes[0]).map((c, i) => ({
      ...c,
      name: ['Tm','Sub','Dom','Tonic'][i] || 'T'
    }));
    // Slight tempo variation per biome
    const tempos = [80, 88, 76, 74];
    this.tempo = this.bossMode ? 95 : (tempos[themeIdx % 4] || 80);
    this.beatDur = 60 / this.tempo;
    this.barDur  = this.beatDur * 4;
    // Smooth fade through transition
    this.musicGain.gain.cancelScheduledValues(ct);
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, ct);
    this.musicGain.gain.linearRampToValueAtTime(0.32, ct + 0.4);
    this.musicGain.gain.linearRampToValueAtTime(this.bossMode ? 0.58 : 0.44, ct + 1.2);
  }
}


// ============================================================
// SOUND ENGINE — Realistic SFX synthesizer
// ============================================================

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this._masterGain = null;
    this._reverb = null;
    this._reverbSend = null;
    this._distCurve = null;
    this.music = null;
  }

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._masterGain = this.ctx.createGain();
      this._masterGain.gain.value = 0.72;
      this._masterGain.connect(this.ctx.destination);

      // Global reverb (send-return setup)
      const impulseBuf = this._makeImpulse(1.4, 2.8);
      this._reverb = this.ctx.createConvolver();
      this._reverb.buffer = impulseBuf;
      const reverbOut = this.ctx.createGain();
      reverbOut.gain.value = 0.9;
      this._reverb.connect(reverbOut);
      reverbOut.connect(this._masterGain);

      // Pre-built distortion curve for attack sounds
      this._distCurve = this._makeDistCurve(130);
    } catch (e) {
      this.enabled = false;
    }
  }

  // ── helpers ─────────────────────────────────────────────
  _time() { return this.ctx ? this.ctx.currentTime : 0; }

  _makeImpulse(duration, decay) {
    const sr = this.ctx.sampleRate;
    const len = Math.floor(sr * duration);
    const buf = this.ctx.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  _makeDistCurve(amount) {
    const n = 512;
    const c = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      c[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
    }
    return c;
  }

  // Create a noise AudioBuffer (decaying white noise by default)
  _noiseBuf(dur, decay = 0.9) {
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  // Send gainNode output to reverb (parallel wet path)
  _reverb$(gainNode, amount = 0.15) {
    if (!this._reverb) return;
    const send = this.ctx.createGain();
    send.gain.value = amount;
    gainNode.connect(send);
    send.connect(this._reverb);
  }

  // ── SFX METHODS ──────────────────────────────────────────

  // Jump — air rush + cloth swoosh + rising pitch
  playJump() {
    if (!this.ctx || !this.enabled) return;
    const t = this._time();

    // Air rush (bandpass noise sweeping up)
    const buf  = this._noiseBuf(0.22, 1.3);
    const src  = this.ctx.createBufferSource();
    const filt = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    src.buffer = buf;
    filt.type = 'bandpass'; filt.Q.value = 2.2;
    filt.frequency.setValueAtTime(900, t);
    filt.frequency.exponentialRampToValueAtTime(3500, t + 0.15);
    gain.gain.setValueAtTime(0.32, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    src.connect(filt); filt.connect(gain); gain.connect(this._masterGain);
    src.start(t);
    this._reverb$(gain, 0.07);

    // Rising sweep tone
    const osc  = this.ctx.createOscillator();
    const oGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(520, t + 0.14);
    oGain.gain.setValueAtTime(0.2, t);
    oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.17);
    osc.connect(oGain); oGain.connect(this._masterGain);
    osc.start(t); osc.stop(t + 0.2);
  }

  // Double jump — crystalline shimmer burst
  playDoubleJump() {
    if (!this.ctx || !this.enabled) return;
    const t = this._time();

    [880, 1320, 1760, 2200, 2640].forEach((freq, i) => {
      const osc  = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.detune.value = (Math.random() - 0.5) * 18;
      const delay = i * 0.022;
      gain.gain.setValueAtTime(0, t + delay);
      gain.gain.linearRampToValueAtTime(0.13, t + delay + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.22);
      osc.connect(gain); gain.connect(this._masterGain);
      osc.start(t + delay); osc.stop(t + delay + 0.25);
      this._reverb$(gain, 0.14);
    });

    // Air burst
    const buf  = this._noiseBuf(0.1, 2.5);
    const src  = this.ctx.createBufferSource();
    const filt = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    src.buffer = buf; filt.type = 'highpass'; filt.frequency.value = 4500;
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    src.connect(filt); filt.connect(gain); gain.connect(this._masterGain);
    src.start(t);
  }

  // Light attack — scythe blade whoosh + metal ring
  playLightAttack() {
    if (!this.ctx || !this.enabled) return;
    const t = this._time();

    // Blade whoosh (noise sweep high-to-mid)
    const buf  = this._noiseBuf(0.16, 1.6);
    const src  = this.ctx.createBufferSource();
    const filt = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    src.buffer = buf;
    filt.type = 'bandpass'; filt.Q.value = 1.4;
    filt.frequency.setValueAtTime(5500, t);
    filt.frequency.exponentialRampToValueAtTime(900, t + 0.13);
    gain.gain.setValueAtTime(0.55, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    src.connect(filt); filt.connect(gain); gain.connect(this._masterGain);
    src.start(t);

    // Metal ring / blade sing
    const ringOsc  = this.ctx.createOscillator();
    const ringGain = this.ctx.createGain();
    ringOsc.type = 'sine';
    ringOsc.frequency.setValueAtTime(3400, t);
    ringOsc.frequency.exponentialRampToValueAtTime(1600, t + 0.13);
    ringGain.gain.setValueAtTime(0.14, t);
    ringGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    ringOsc.connect(ringGain); ringGain.connect(this._masterGain);
    ringOsc.start(t); ringOsc.stop(t + 0.2);
  }

  // Heavy attack — massive scythe slam: whoosh + metallic CLANG + low rumble
  playHeavyAttack() {
    if (!this.ctx || !this.enabled) return;
    const t = this._time();

    // Pre-swing whoosh (sawtooth frequency drop)
    const whooshOsc  = this.ctx.createOscillator();
    const whooshGain = this.ctx.createGain();
    whooshOsc.type = 'sawtooth';
    whooshOsc.frequency.setValueAtTime(240, t);
    whooshOsc.frequency.exponentialRampToValueAtTime(55, t + 0.22);
    whooshGain.gain.setValueAtTime(0.28, t);
    whooshGain.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
    whooshOsc.connect(whooshGain); whooshGain.connect(this._masterGain);
    whooshOsc.start(t); whooshOsc.stop(t + 0.3);

    // Heavy impact thud (kick-like)
    const impOsc  = this.ctx.createOscillator();
    const impGain = this.ctx.createGain();
    impOsc.type = 'sine';
    impOsc.frequency.setValueAtTime(185, t + 0.2);
    impOsc.frequency.exponentialRampToValueAtTime(32, t + 0.52);
    impGain.gain.setValueAtTime(0, t);
    impGain.gain.setValueAtTime(0.7, t + 0.2);
    impGain.gain.exponentialRampToValueAtTime(0.001, t + 0.58);
    impOsc.connect(impGain); impGain.connect(this._masterGain);
    impOsc.start(t + 0.2); impOsc.stop(t + 0.62);
    this._reverb$(impGain, 0.22);

    // Metal CLANG (bandpass noise burst)
    const clangBuf  = this._noiseBuf(0.3, 0.45);
    const clangSrc  = this.ctx.createBufferSource();
    const clangFilt = this.ctx.createBiquadFilter();
    const clangGain = this.ctx.createGain();
    clangSrc.buffer = clangBuf;
    clangFilt.type = 'bandpass'; clangFilt.frequency.value = 3200; clangFilt.Q.value = 5;
    clangGain.gain.setValueAtTime(0, t);
    clangGain.gain.setValueAtTime(0.7, t + 0.19);
    clangGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    clangSrc.connect(clangFilt); clangFilt.connect(clangGain); clangGain.connect(this._masterGain);
    clangSrc.start(t);

    // Ground rumble (lowpass noise)
    const rumbleBuf  = this._noiseBuf(0.45, 2.2);
    const rumbleSrc  = this.ctx.createBufferSource();
    const rumbleFilt = this.ctx.createBiquadFilter();
    const rumbleGain = this.ctx.createGain();
    rumbleSrc.buffer = rumbleBuf;
    rumbleFilt.type = 'lowpass'; rumbleFilt.frequency.value = 110;
    rumbleGain.gain.setValueAtTime(0, t);
    rumbleGain.gain.setValueAtTime(0.55, t + 0.2);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    rumbleSrc.connect(rumbleFilt); rumbleFilt.connect(rumbleGain); rumbleGain.connect(this._masterGain);
    rumbleSrc.start(t);
  }

  // Special attack — dark aura build + demonic resonance
  playSpecialAttack() {
    if (!this.ctx || !this.enabled) return;
    const t = this._time();

    // Staggered dark chord (minor cluster build)
    [60, 65, 80, 95, 115, 138].forEach((freq, i) => {
      const osc  = this.ctx.createOscillator();
      const dist = this.ctx.createWaveShaper();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.detune.value = i * 4;
      dist.curve = this._distCurve;
      const start = t + i * 0.028;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
      osc.connect(dist); dist.connect(gain); gain.connect(this._masterGain);
      osc.start(start); osc.stop(t + 1.15);
    });
    this._reverb$(this._masterGain, 0); // already connected

    // Dark energy surge (noise)
    const buf  = this._noiseBuf(0.9, 0.35);
    const src  = this.ctx.createBufferSource();
    const filt = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    src.buffer = buf; filt.type = 'lowpass'; filt.frequency.value = 450;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.42, t + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
    src.connect(filt); filt.connect(gain); gain.connect(this._masterGain);
    src.start(t);
    this._reverb$(gain, 0.35);
  }

  // Hit on enemy — meaty flesh impact + bone crunch
  playHit() {
    if (!this.ctx || !this.enabled) return;
    const t = this._time();

    // Thud (rapid low pitch drop)
    const osc  = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.09);
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
    osc.connect(gain); gain.connect(this._masterGain);
    osc.start(t); osc.stop(t + 0.13);

    // Flesh/bone impact noise
    const buf  = this._noiseBuf(0.09, 3.5);
    const src  = this.ctx.createBufferSource();
    const filt = this.ctx.createBiquadFilter();
    const nGain = this.ctx.createGain();
    src.buffer = buf; filt.type = 'bandpass'; filt.frequency.value = 1800; filt.Q.value = 1.8;
    nGain.gain.setValueAtTime(0.45, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    src.connect(filt); filt.connect(nGain); nGain.connect(this._masterGain);
    src.start(t);
  }

  // Player hurt — flesh impact + rising pain whine
  playPlayerHurt() {
    if (!this.ctx || !this.enabled) return;
    const t = this._time();

    // Impact thud
    const osc  = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(75, t + 0.16);
    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(gain); gain.connect(this._masterGain);
    osc.start(t); osc.stop(t + 0.25);

    // Grunt-like noise
    const buf  = this._noiseBuf(0.28, 1.9);
    const src  = this.ctx.createBufferSource();
    const filt = this.ctx.createBiquadFilter();
    const nGain = this.ctx.createGain();
    src.buffer = buf;
    filt.type = 'bandpass'; filt.Q.value = 3.5;
    filt.frequency.setValueAtTime(700, t);
    filt.frequency.exponentialRampToValueAtTime(280, t + 0.22);
    nGain.gain.setValueAtTime(0.38, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    src.connect(filt); filt.connect(nGain); nGain.connect(this._masterGain);
    src.start(t);

    // Pain signal (upward pitch whip)
    const sigOsc  = this.ctx.createOscillator();
    const sigGain = this.ctx.createGain();
    sigOsc.type = 'sawtooth';
    sigOsc.frequency.setValueAtTime(260, t + 0.06);
    sigOsc.frequency.exponentialRampToValueAtTime(720, t + 0.3);
    sigGain.gain.setValueAtTime(0, t);
    sigGain.gain.setValueAtTime(0.18, t + 0.06);
    sigGain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
    sigOsc.connect(sigGain); sigGain.connect(this._masterGain);
    sigOsc.start(t + 0.06); sigOsc.stop(t + 0.35);
  }

  // Dash — supersonic air cut + energy crackle
  playDash() {
    if (!this.ctx || !this.enabled) return;
    const t = this._time();

    // Velocity air whoosh (high-to-low bandpass)
    const buf  = this._noiseBuf(0.16, 2.2);
    const src  = this.ctx.createBufferSource();
    const filt = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    src.buffer = buf;
    filt.type = 'bandpass'; filt.Q.value = 1.6;
    filt.frequency.setValueAtTime(6500, t);
    filt.frequency.exponentialRampToValueAtTime(1000, t + 0.12);
    gain.gain.setValueAtTime(0.48, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    src.connect(filt); filt.connect(gain); gain.connect(this._masterGain);
    src.start(t);

    // Energy crackle
    const osc  = this.ctx.createOscillator();
    const oGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(750, t);
    osc.frequency.exponentialRampToValueAtTime(190, t + 0.11);
    oGain.gain.setValueAtTime(0.22, t);
    oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
    osc.connect(oGain); oGain.connect(this._masterGain);
    osc.start(t); osc.stop(t + 0.15);
  }

  // Boss roar — deep FM guttural roar + noise rumble
  playBossRoar() {
    if (!this.ctx || !this.enabled) return;
    const t = this._time();

    // FM carrier (guttural roar)
    const carrier = this.ctx.createOscillator();
    const mod     = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const cGain   = this.ctx.createGain();

    mod.frequency.value = 7;
    modGain.gain.value = 30;
    mod.connect(modGain); modGain.connect(carrier.frequency);

    carrier.type = 'sawtooth';
    carrier.frequency.setValueAtTime(58, t);
    carrier.frequency.setValueAtTime(42, t + 0.6);
    carrier.frequency.setValueAtTime(52, t + 1.2);
    carrier.frequency.exponentialRampToValueAtTime(28, t + 2.4);

    cGain.gain.setValueAtTime(0, t);
    cGain.gain.linearRampToValueAtTime(0.75, t + 0.45);
    cGain.gain.setValueAtTime(0.68, t + 1.6);
    cGain.gain.exponentialRampToValueAtTime(0.001, t + 2.7);

    carrier.connect(cGain); cGain.connect(this._masterGain);
    carrier.start(t); carrier.stop(t + 2.75);
    mod.start(t); mod.stop(t + 2.75);
    this._reverb$(cGain, 0.45);

    // Low rumble noise
    const rumbleBuf  = this._noiseBuf(2.6, 0.25);
    const rumbleSrc  = this.ctx.createBufferSource();
    const rumbleFilt = this.ctx.createBiquadFilter();
    const rumbleGain = this.ctx.createGain();
    rumbleSrc.buffer = rumbleBuf;
    rumbleFilt.type = 'lowpass'; rumbleFilt.frequency.value = 280;
    rumbleGain.gain.setValueAtTime(0, t);
    rumbleGain.gain.linearRampToValueAtTime(0.45, t + 0.35);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, t + 2.6);
    rumbleSrc.connect(rumbleFilt); rumbleFilt.connect(rumbleGain); rumbleGain.connect(this._masterGain);
    rumbleSrc.start(t);
    this._reverb$(rumbleGain, 0.32);

    // Transient crack at start
    const crackBuf  = this._noiseBuf(0.1, 5.0);
    const crackSrc  = this.ctx.createBufferSource();
    const crackFilt = this.ctx.createBiquadFilter();
    const crackGain = this.ctx.createGain();
    crackSrc.buffer = crackBuf;
    crackFilt.type = 'bandpass'; crackFilt.frequency.value = 1400; crackFilt.Q.value = 2.5;
    crackGain.gain.setValueAtTime(0.7, t);
    crackGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    crackSrc.connect(crackFilt); crackFilt.connect(crackGain); crackGain.connect(this._masterGain);
    crackSrc.start(t);
  }

  // Floor clear — triumphant Am harp arpeggio + bell chord
  playFloorClear() {
    if (!this.ctx || !this.enabled) return;
    const t = this._time();

    // Rising arpeggio (A minor pentatonic)
    [220, 261.63, 329.63, 440, 523.25, 659.26, 880].forEach((freq, i) => {
      const osc  = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = t + i * 0.11;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.22, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.65);
      osc.connect(gain); gain.connect(this._masterGain);
      osc.start(start); osc.stop(start + 0.7);
      this._reverb$(gain, 0.3);
    });

    // Bell chord finish
    [880, 1320, 1760, 2200].forEach((freq, i) => {
      const osc  = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = t + 0.78;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.14, start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 1.8);
      osc.connect(gain); gain.connect(this._masterGain);
      osc.start(start); osc.stop(start + 1.9);
      this._reverb$(gain, 0.4);
    });
  }

  // Upgrade select — crystal chime with shimmer
  playUpgradeSelect() {
    if (!this.ctx || !this.enabled) return;
    const t = this._time();

    [523.25, 659.26, 783.99, 1046.5].forEach((freq, i) => {
      const osc  = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.detune.value = (Math.random() - 0.5) * 10;
      const start = t + i * 0.055;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.55);
      osc.connect(gain); gain.connect(this._masterGain);
      osc.start(start); osc.stop(start + 0.6);
      this._reverb$(gain, 0.22);
    });

    // Shimmer noise
    const buf  = this._noiseBuf(0.1, 3.5);
    const src  = this.ctx.createBufferSource();
    const filt = this.ctx.createBiquadFilter();
    const sGain = this.ctx.createGain();
    src.buffer = buf; filt.type = 'highpass'; filt.frequency.value = 7000;
    sGain.gain.setValueAtTime(0.16, t);
    sGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    src.connect(filt); filt.connect(sGain); sGain.connect(this._masterGain);
    src.start(t);
  }

  // Soul pickup — ethereal shimmer sweep
  playSoulPickup() {
    if (!this.ctx || !this.enabled) return;
    const t = this._time();

    [1100, 1550, 2100].forEach((freq, i) => {
      const osc  = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * 0.78, t + i * 0.016);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.22, t + i * 0.016 + 0.18);
      gain.gain.setValueAtTime(0.13, t + i * 0.016);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.016 + 0.22);
      osc.connect(gain); gain.connect(this._masterGain);
      osc.start(t + i * 0.016); osc.stop(t + i * 0.016 + 0.25);
      this._reverb$(gain, 0.1);
    });

    // Sparkle
    const buf  = this._noiseBuf(0.06, 4.5);
    const src  = this.ctx.createBufferSource();
    const filt = this.ctx.createBiquadFilter();
    const sGain = this.ctx.createGain();
    src.buffer = buf; filt.type = 'highpass'; filt.frequency.value = 9000;
    sGain.gain.setValueAtTime(0.09, t);
    sGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    src.connect(filt); filt.connect(sGain); sGain.connect(this._masterGain);
    src.start(t);
  }

  // ── New action sounds ────────────────────────────────────

  // Heavy hit confirm — extra "thwack" for heavy/ult landing on an enemy
  playHitHeavy() {
    if (!this.ctx || !this.enabled) return;
    const t = this._time();

    // Strong low thud
    const osc  = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.16);
    gain.gain.setValueAtTime(0.85, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(gain); gain.connect(this._masterGain);
    osc.start(t); osc.stop(t + 0.22);
    this._reverb$(gain, 0.18);

    // Crunch noise
    const buf  = this._noiseBuf(0.13, 2.8);
    const src  = this.ctx.createBufferSource();
    const filt = this.ctx.createBiquadFilter();
    const nGain = this.ctx.createGain();
    src.buffer = buf;
    filt.type = 'bandpass'; filt.frequency.value = 1100; filt.Q.value = 1.4;
    nGain.gain.setValueAtTime(0.55, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    src.connect(filt); filt.connect(nGain); nGain.connect(this._masterGain);
    src.start(t);

    // Mid bone-crack snap
    const snapOsc  = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snapOsc.type = 'sawtooth';
    snapOsc.frequency.setValueAtTime(520, t + 0.01);
    snapOsc.frequency.exponentialRampToValueAtTime(110, t + 0.09);
    snapGain.gain.setValueAtTime(0.22, t + 0.01);
    snapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    snapOsc.connect(snapGain); snapGain.connect(this._masterGain);
    snapOsc.start(t + 0.01); snapOsc.stop(t + 0.12);
  }

  // Landing — soft thud + boot scuff
  playLand() {
    if (!this.ctx || !this.enabled) return;
    const t = this._time();

    // Soft thud
    const osc  = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(48, t + 0.1);
    gain.gain.setValueAtTime(0.32, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
    osc.connect(gain); gain.connect(this._masterGain);
    osc.start(t); osc.stop(t + 0.15);

    // Dust scuff
    const buf = this._noiseBuf(0.12, 2.0);
    const src = this.ctx.createBufferSource();
    const filt = this.ctx.createBiquadFilter();
    const nGain = this.ctx.createGain();
    src.buffer = buf;
    filt.type = 'highpass'; filt.frequency.value = 2200;
    nGain.gain.setValueAtTime(0.18, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    src.connect(filt); filt.connect(nGain); nGain.connect(this._masterGain);
    src.start(t);
  }

  // Hit blocked / parried — metallic clink
  playBlocked() {
    if (!this.ctx || !this.enabled) return;
    const t = this._time();

    [1800, 2700, 3600].forEach((freq, i) => {
      const osc  = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.18 - i * 0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain); gain.connect(this._masterGain);
      osc.start(t); osc.stop(t + 0.2);
      this._reverb$(gain, 0.16);
    });

    // Metallic noise burst
    const buf  = this._noiseBuf(0.1, 4);
    const src  = this.ctx.createBufferSource();
    const filt = this.ctx.createBiquadFilter();
    const nGain = this.ctx.createGain();
    src.buffer = buf;
    filt.type = 'bandpass'; filt.frequency.value = 4200; filt.Q.value = 6;
    nGain.gain.setValueAtTime(0.38, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    src.connect(filt); filt.connect(nGain); nGain.connect(this._masterGain);
    src.start(t);
  }

  // Enemy death — soft squelch with descending pitch
  playEnemyDeath(type = 'shadow_demon') {
    if (!this.ctx || !this.enabled) return;
    const t = this._time();

    // Wail (pitch drop)
    const baseFreq = type === 'boss' ? 220 : (type === 'void_sprite' ? 540 : 320);
    const osc  = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type === 'ember_wraith' ? 'triangle' : 'sawtooth';
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.22, t + 0.55);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.34, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc.connect(gain); gain.connect(this._masterGain);
    osc.start(t); osc.stop(t + 0.65);
    this._reverb$(gain, 0.28);

    // Body splat (low noise burst)
    const buf  = this._noiseBuf(0.22, 1.6);
    const src  = this.ctx.createBufferSource();
    const filt = this.ctx.createBiquadFilter();
    const nGain = this.ctx.createGain();
    src.buffer = buf;
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(800, t);
    filt.frequency.exponentialRampToValueAtTime(180, t + 0.2);
    nGain.gain.setValueAtTime(0.42, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
    src.connect(filt); filt.connect(nGain); nGain.connect(this._masterGain);
    src.start(t);
  }

  // Projectile fired (enemy) — fiery shoosh
  playProjectileFire() {
    if (!this.ctx || !this.enabled) return;
    const t = this._time();

    const buf  = this._noiseBuf(0.18, 2.4);
    const src  = this.ctx.createBufferSource();
    const filt = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    src.buffer = buf;
    filt.type = 'bandpass'; filt.Q.value = 1.2;
    filt.frequency.setValueAtTime(1400, t);
    filt.frequency.exponentialRampToValueAtTime(420, t + 0.15);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    src.connect(filt); filt.connect(gain); gain.connect(this._masterGain);
    src.start(t);

    // Fire crackle
    const osc  = this.ctx.createOscillator();
    const oGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(380, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.16);
    oGain.gain.setValueAtTime(0.14, t);
    oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(oGain); oGain.connect(this._masterGain);
    osc.start(t); osc.stop(t + 0.2);
  }

  // Enemy charging up (plague imp wind-up etc.)
  playEnemyCharge() {
    if (!this.ctx || !this.enabled) return;
    const t = this._time();

    const osc  = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(75, t);
    osc.frequency.exponentialRampToValueAtTime(260, t + 0.4);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.1);
    gain.gain.setValueAtTime(0.18, t + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(gain); gain.connect(this._masterGain);
    osc.start(t); osc.stop(t + 0.52);
  }

  // Summon — eerie chord rise
  playSummon() {
    if (!this.ctx || !this.enabled) return;
    const t = this._time();

    [110, 138, 165, 220].forEach((freq, i) => {
      const osc  = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq * 0.6, t);
      osc.frequency.exponentialRampToValueAtTime(freq, t + 0.4);
      gain.gain.setValueAtTime(0, t + i * 0.04);
      gain.gain.linearRampToValueAtTime(0.16, t + i * 0.04 + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
      osc.connect(gain); gain.connect(this._masterGain);
      osc.start(t + i * 0.04); osc.stop(t + 0.75);
      this._reverb$(gain, 0.35);
    });

    // Whoosh
    const buf  = this._noiseBuf(0.5, 1.2);
    const src  = this.ctx.createBufferSource();
    const filt = this.ctx.createBiquadFilter();
    const nGain = this.ctx.createGain();
    src.buffer = buf;
    filt.type = 'bandpass'; filt.frequency.value = 700; filt.Q.value = 1.2;
    nGain.gain.setValueAtTime(0.2, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    src.connect(filt); filt.connect(nGain); nGain.connect(this._masterGain);
    src.start(t);
    this._reverb$(nGain, 0.25);
  }

  // Menu / UI click
  playUiClick() {
    if (!this.ctx || !this.enabled) return;
    const t = this._time();

    const osc  = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(780, t);
    osc.frequency.exponentialRampToValueAtTime(520, t + 0.05);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(gain); gain.connect(this._masterGain);
    osc.start(t); osc.stop(t + 0.1);
  }

  // Ultimate — massive power explosion
  playUltimate() {
    if (!this.ctx || !this.enabled) return;
    const t = this._time();

    // Low power surge chord
    [55, 82.5, 110, 165, 220].forEach((freq, i) => {
      const osc  = this.ctx.createOscillator();
      const dist = this.ctx.createWaveShaper();
      const gain = this.ctx.createGain();
      osc.type = i < 2 ? 'sawtooth' : 'triangle';
      osc.frequency.value = freq;
      osc.detune.value = i * 4;
      dist.curve = this._distCurve;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.24, t + 0.09);
      gain.gain.setValueAtTime(0.22, t + 0.9);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 2.4);
      osc.connect(dist); dist.connect(gain); gain.connect(this._masterGain);
      osc.start(t); osc.stop(t + 2.5);
    });
    this._reverb$(this._masterGain, 0);

    // Explosion noise (massive)
    const expBuf  = this._noiseBuf(1.6, 0.5);
    const expSrc  = this.ctx.createBufferSource();
    const expFilt = this.ctx.createBiquadFilter();
    const expGain = this.ctx.createGain();
    expSrc.buffer = expBuf;
    expFilt.type = 'lowpass';
    expFilt.frequency.setValueAtTime(9000, t);
    expFilt.frequency.exponentialRampToValueAtTime(450, t + 0.5);
    expGain.gain.setValueAtTime(0.78, t);
    expGain.gain.exponentialRampToValueAtTime(0.001, t + 1.6);
    expSrc.connect(expFilt); expFilt.connect(expGain); expGain.connect(this._masterGain);
    expSrc.start(t);
    this._reverb$(expGain, 0.42);

    // High energy screech
    const scrOsc  = this.ctx.createOscillator();
    const scrGain = this.ctx.createGain();
    scrOsc.type = 'sawtooth';
    scrOsc.frequency.setValueAtTime(1900, t);
    scrOsc.frequency.exponentialRampToValueAtTime(380, t + 0.32);
    scrGain.gain.setValueAtTime(0.18, t);
    scrGain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
    scrOsc.connect(scrGain); scrGain.connect(this._masterGain);
    scrOsc.start(t); scrOsc.stop(t + 0.42);
  }

  // ── Music control ────────────────────────────────────────
  startMusic() {
    if (!this.ctx || !this.enabled) return;
    if (!this.music) this.music = new MusicEngine(this.ctx, this._masterGain);
    this.music.start();
  }

  stopMusic() {
    if (this.music) this.music.stop();
  }

  pauseMusic() {
    if (this.music) this.music.pause();
  }

  resumeMusic() {
    if (this.music) this.music.resume();
  }

  setBossMusic(enabled) {
    if (this.music) this.music.setBossMode(enabled);
  }

  // Tell the music engine which biome/theme to play
  setMusicTheme(themeIdx) {
    if (this.music && this.music.setTheme) this.music.setTheme(themeIdx);
  }

  // ── External audio (HTMLAudio for the menu .wav track) ───
  _ensureMenuAudio() {
    if (this._menuAudio) return this._menuAudio;
    const a = new Audio('https://customer-assets.emergentagent.com/job_mobile-ui-demon-fix/artifacts/hrrb2l64_Theenderswar%28inst%29.wav');
    a.loop = true;
    a.volume = 0;
    a.preload = 'auto';
    this._menuAudio = a;
    return a;
  }

  playMenuMusic() {
    if (!this.enabled) return;
    const a = this._ensureMenuAudio();
    try {
      const p = a.play();
      if (p && typeof p.then === 'function') p.catch(() => {});
    } catch (e) { /* ignore — needs user gesture */ }
    // Fade in
    a.volume = 0;
    const targetVol = 0.42;
    const startT = Date.now();
    const fadeIn = () => {
      const elapsed = (Date.now() - startT) / 1000;
      if (elapsed >= 1.2 || !this._menuAudio) {
        if (this._menuAudio) this._menuAudio.volume = targetVol;
        return;
      }
      a.volume = Math.min(targetVol, (elapsed / 1.2) * targetVol);
      requestAnimationFrame(fadeIn);
    };
    requestAnimationFrame(fadeIn);
  }

  stopMenuMusic() {
    if (!this._menuAudio) return;
    const a = this._menuAudio;
    const startVol = a.volume;
    const startT = Date.now();
    const fadeOut = () => {
      const elapsed = (Date.now() - startT) / 1000;
      if (elapsed >= 0.8) {
        a.pause();
        a.currentTime = 0;
        a.volume = startVol;
        return;
      }
      a.volume = Math.max(0, startVol * (1 - elapsed / 0.8));
      requestAnimationFrame(fadeOut);
    };
    requestAnimationFrame(fadeOut);
  }

  // ── Special stings ───────────────────────────────────────

  // Floor complete victory sting (synth) - triumphant orchestral hit
  playFloorCompleteSting() {
    if (!this.ctx || !this.enabled) return;
    const t = this._time();

    // Big bell hit
    [220, 330, 440, 554.37, 659.26, 880].forEach((freq, i) => {
      const osc  = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = i < 2 ? 'triangle' : 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.18 - i * 0.018, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 2.4);
      osc.connect(gain); gain.connect(this._masterGain);
      osc.start(t); osc.stop(t + 2.5);
      this._reverb$(gain, 0.45);
    });

    // Choir-style rise
    [261.63, 329.63, 392.00, 523.25].forEach((freq, i) => {
      const osc  = this.ctx.createOscillator();
      const lpf  = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.detune.value = i % 2 === 0 ? -8 : 8;
      lpf.type = 'lowpass'; lpf.frequency.value = 1600;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.13, t + 0.4);
      gain.gain.setValueAtTime(0.13, t + 1.8);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 3.2);
      osc.connect(lpf); lpf.connect(gain); gain.connect(this._masterGain);
      osc.start(t); osc.stop(t + 3.3);
      this._reverb$(gain, 0.35);
    });

    // Deep impact thud at start
    const impOsc  = this.ctx.createOscillator();
    const impGain = this.ctx.createGain();
    impOsc.type = 'sine';
    impOsc.frequency.setValueAtTime(90, t);
    impOsc.frequency.exponentialRampToValueAtTime(35, t + 0.5);
    impGain.gain.setValueAtTime(0.7, t);
    impGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    impOsc.connect(impGain); impGain.connect(this._masterGain);
    impOsc.start(t); impOsc.stop(t + 0.65);
    this._reverb$(impGain, 0.3);
  }

  // Door unlock — heavy mechanism + chime
  playDoorUnlock() {
    if (!this.ctx || !this.enabled) return;
    const t = this._time();

    // Big mechanical thunk
    const osc  = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(125, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.25);
    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
    osc.connect(gain); gain.connect(this._masterGain);
    osc.start(t); osc.stop(t + 0.36);
    this._reverb$(gain, 0.25);

    // Chime/sparkle on top
    [880, 1320, 1760].forEach((freq, i) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      const start = t + 0.18 + i * 0.06;
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(0.14, start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, start + 0.9);
      o.connect(g); g.connect(this._masterGain);
      o.start(start); o.stop(start + 1);
      this._reverb$(g, 0.3);
    });
  }

  // Generic enemy roar — type-flavoured
  playEnemyRoar(type = 'shadow_demon') {
    if (!this.ctx || !this.enabled) return;
    const t = this._time();

    const profiles = {
      shadow_demon:    { freq: 110, dur: 0.6, wave: 'sawtooth', noise: 1.2 },
      void_sprite:     { freq: 440, dur: 0.3, wave: 'square',   noise: 0.5 },
      dimension_watcher:{ freq: 220, dur: 0.5, wave: 'triangle',noise: 0.3 },
      lurker_cultist:  { freq: 95,  dur: 0.7, wave: 'sawtooth', noise: 1.5 },
      plague_imp:      { freq: 280, dur: 0.4, wave: 'square',   noise: 0.8 },
      shadow_crawler:  { freq: 380, dur: 0.25,wave: 'sawtooth', noise: 0.6 },
      ember_wraith:    { freq: 165, dur: 0.55,wave: 'triangle', noise: 1.0 },
      bone_howler:     { freq: 75,  dur: 1.1, wave: 'sawtooth', noise: 1.8 },
      hex_beast:       { freq: 70,  dur: 0.9, wave: 'sawtooth', noise: 1.6 },
      boss:            { freq: 60,  dur: 1.4, wave: 'sawtooth', noise: 2.2 },
    };
    const p = profiles[type] || profiles.shadow_demon;

    const carrier = this.ctx.createOscillator();
    const mod     = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const gain    = this.ctx.createGain();

    mod.frequency.value = 8 + Math.random() * 6;
    modGain.gain.value = p.freq * 0.25;
    mod.connect(modGain); modGain.connect(carrier.frequency);

    carrier.type = p.wave;
    carrier.frequency.setValueAtTime(p.freq, t);
    carrier.frequency.exponentialRampToValueAtTime(p.freq * 0.55, t + p.dur);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.32, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + p.dur);
    carrier.connect(gain); gain.connect(this._masterGain);
    carrier.start(t); carrier.stop(t + p.dur + 0.05);
    mod.start(t); mod.stop(t + p.dur + 0.05);
    this._reverb$(gain, 0.3);

    // Breath/noise layer
    if (p.noise > 0) {
      const buf  = this._noiseBuf(p.dur * 0.8, 1.2);
      const src  = this.ctx.createBufferSource();
      const filt = this.ctx.createBiquadFilter();
      const nGain= this.ctx.createGain();
      src.buffer = buf;
      filt.type = 'lowpass'; filt.frequency.value = 500 + p.freq * 1.5;
      nGain.gain.setValueAtTime(0.08 * p.noise, t);
      nGain.gain.exponentialRampToValueAtTime(0.001, t + p.dur);
      src.connect(filt); filt.connect(nGain); nGain.connect(this._masterGain);
      src.start(t);
    }
  }
}

export const soundEngine = new SoundEngine();
