// ============================================================
// DIMENSIONLOCK — Enhanced Web Audio Sound Engine
// Realistic SFX + Gothic Rock Music Synthesizer
// ============================================================

// ============================================================
// MUSIC ENGINE — Gothic rock soundtrack synthesizer
// ============================================================

class MusicEngine {
  constructor(ctx, masterGain) {
    this.ctx = ctx;

    // Separate music volume bus
    this.musicGain = ctx.createGain();
    this.musicGain.gain.value = 0;
    this.musicGain.connect(masterGain);

    // Instrument buses
    this.guitarBus = ctx.createGain();
    this.guitarBus.gain.value = 0.55;
    this.guitarBus.connect(this.musicGain);

    this.bassBus = ctx.createGain();
    this.bassBus.gain.value = 0.7;
    this.bassBus.connect(this.musicGain);

    this.drumBus = ctx.createGain();
    this.drumBus.gain.value = 0.85;
    this.drumBus.connect(this.musicGain);

    this.padBus = ctx.createGain();
    this.padBus.gain.value = 0.22;
    this.padBus.connect(this.musicGain);

    // Reverb for atmosphere
    const reverbBuf = this._makeImpulse(2.2, 3.0);
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = reverbBuf;
    const reverbSend = ctx.createGain();
    reverbSend.gain.value = 0.18;
    this.padBus.connect(reverbSend);
    this.guitarBus.connect(reverbSend);
    reverbSend.connect(this.reverb);
    this.reverb.connect(this.musicGain);

    // Distortion curves
    this._heavyDist = this._makeDistCurve(280);
    this._mildDist = this._makeDistCurve(40);

    // Pre-generate reusable noise buffers
    this._kickClickBuf = this._makeNoiseBuf(0.05);
    this._snareBuf = this._makeNoiseBuf(0.22);
    this._hihatLongBuf = this._makeNoiseBuf(0.12);
    this._hihatShortBuf = this._makeNoiseBuf(0.05);

    // Scheduler state
    this.playing = false;
    this.bossMode = false;
    this.nextBeatTime = 0;
    this.currentBeat = 0;
    this.totalBeats = 16; // 4 bars × 4 beats
    this._timer = null;

    // Timing — 120 BPM normal, 140 BPM boss
    this.tempo = 120;
    this.beatDur = 60 / this.tempo;
    this.scheduleAhead = 0.28;

    // Gothic Am chord progression — power chords (root + 5th)
    // Am → F → Dm → E
    this.chords = [
      { freqs: [110, 165],       bassFreq: 55,    name: 'Am' },
      { freqs: [87.31, 130.81],  bassFreq: 43.65, name: 'F'  },
      { freqs: [73.42, 110],     bassFreq: 36.71, name: 'Dm' },
      { freqs: [82.41, 123.47],  bassFreq: 41.20, name: 'E'  },
    ];

    // Lead melody — A natural minor scale over the 4 bars
    // 0 = rest
    this.melody = [
      [440,    0,      329.63, 0     ], // Bar 1 (Am): A4 – E4
      [392,    0,      349.23, 0     ], // Bar 2 (F):  G4 – F4
      [329.63, 349.23, 392,    0     ], // Bar 3 (Dm): E4 – F4 – G4
      [329.63, 0,      0,      0     ], // Bar 4 (E):  E4
    ];
  }

  // ── helpers ─────────────────────────────────────────────
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

  _makeNoiseBuf(dur) {
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  // ── instrument schedulers ────────────────────────────────
  _guitar(chordIdx, time) {
    const chord = this.chords[chordIdx % 4];
    const dur = this.beatDur * 4 * 0.94;

    chord.freqs.forEach((freq, i) => {
      const osc  = this.ctx.createOscillator();
      const dist = this.ctx.createWaveShaper();
      const eq   = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.detune.value = i % 2 === 0 ? -10 : 10; // stereo-width detune
      dist.curve = this._heavyDist;
      eq.type = 'peaking'; eq.frequency.value = 900; eq.Q.value = 1.5; eq.gain.value = 4;

      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.13, time + 0.025);
      gain.gain.setValueAtTime(0.11, time + dur * 0.78);
      gain.gain.linearRampToValueAtTime(0, time + dur);

      osc.connect(dist); dist.connect(eq); eq.connect(gain); gain.connect(this.guitarBus);
      osc.start(time); osc.stop(time + dur + 0.06);
    });
  }

  _bass(chordIdx, time) {
    const chord = this.chords[chordIdx % 4];
    const dur = this.beatDur * 4 * 0.92;

    const osc   = this.ctx.createOscillator();
    const dist  = this.ctx.createWaveShaper();
    const lpf   = this.ctx.createBiquadFilter();
    const gain  = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.value = chord.bassFreq;
    dist.curve = this._mildDist;
    lpf.type = 'lowpass'; lpf.frequency.value = 350; lpf.Q.value = 1.8;

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.45, time + 0.04);
    gain.gain.setValueAtTime(0.38, time + dur * 0.82);
    gain.gain.linearRampToValueAtTime(0, time + dur);

    osc.connect(dist); dist.connect(lpf); lpf.connect(gain); gain.connect(this.bassBus);
    osc.start(time); osc.stop(time + dur + 0.06);
  }

  _pad(chordIdx, time) {
    const chord = this.chords[chordIdx % 4];
    const dur = this.beatDur * 4;
    // Minor triad atmosphere
    [chord.freqs[0] * 2, chord.freqs[0] * 2.378, chord.freqs[0] * 3].forEach((freq, i) => {
      const osc  = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      osc.detune.value = (Math.random() - 0.5) * 8;
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.038, time + 0.55);
      gain.gain.setValueAtTime(0.032, time + dur * 0.72);
      gain.gain.linearRampToValueAtTime(0, time + dur);
      osc.connect(gain); gain.connect(this.padBus);
      osc.start(time); osc.stop(time + dur + 0.1);
    });
  }

  _melody(barIdx, beatInBar, time) {
    const freq = this.melody[barIdx % 4][beatInBar];
    if (!freq) return;
    const dur = this.beatDur * 0.8;
    const osc  = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    osc.detune.value = -6;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.065, time + 0.03);
    gain.gain.setValueAtTime(0.055, time + dur * 0.68);
    gain.gain.linearRampToValueAtTime(0, time + dur);
    osc.connect(gain); gain.connect(this.guitarBus);
    osc.start(time); osc.stop(time + dur + 0.05);
  }

  _kick(time) {
    // Low sine sweep
    const osc  = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(165, time);
    osc.frequency.exponentialRampToValueAtTime(35, time + 0.13);
    gain.gain.setValueAtTime(1.1, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);
    osc.connect(gain); gain.connect(this.drumBus);
    osc.start(time); osc.stop(time + 0.32);

    // Click transient
    const src  = this.ctx.createBufferSource();
    const filt = this.ctx.createBiquadFilter();
    const cGain = this.ctx.createGain();
    src.buffer = this._kickClickBuf;
    filt.type = 'lowpass'; filt.frequency.value = 280;
    cGain.gain.setValueAtTime(0.55, time);
    cGain.gain.exponentialRampToValueAtTime(0.001, time + 0.045);
    src.connect(filt); filt.connect(cGain); cGain.connect(this.drumBus);
    src.start(time);
  }

  _snare(time) {
    // Noise body
    const src  = this.ctx.createBufferSource();
    const filt = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    src.buffer = this._snareBuf;
    filt.type = 'bandpass'; filt.frequency.value = 2600; filt.Q.value = 0.65;
    gain.gain.setValueAtTime(1.0, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.17);
    src.connect(filt); filt.connect(gain); gain.connect(this.drumBus);
    src.start(time);

    // Body tone
    const osc  = this.ctx.createOscillator();
    const oGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(230, time);
    osc.frequency.exponentialRampToValueAtTime(100, time + 0.06);
    oGain.gain.setValueAtTime(0.42, time);
    oGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    osc.connect(oGain); oGain.connect(this.drumBus);
    osc.start(time); osc.stop(time + 0.12);
  }

  _hihat(time, isAccent) {
    const buf  = isAccent ? this._hihatLongBuf : this._hihatShortBuf;
    const src  = this.ctx.createBufferSource();
    const filt = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    src.buffer = buf;
    filt.type = 'highpass'; filt.frequency.value = 8500;
    gain.gain.setValueAtTime(isAccent ? 0.38 : 0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + (isAccent ? 0.1 : 0.045));
    src.connect(filt); filt.connect(gain); gain.connect(this.drumBus);
    src.start(time);
  }

  // ── scheduler ────────────────────────────────────────────
  _scheduleBeat(beatIndex, time) {
    const beatInBar = beatIndex % 4;
    const barIndex  = Math.floor(beatIndex / 4) % 4;

    if (beatInBar === 0) {
      this._guitar(barIndex, time);
      this._bass(barIndex, time);
      this._pad(barIndex, time);
    }

    this._melody(barIndex, beatInBar, time);

    // Kick: beats 1 & 3 (index 0, 2)
    if (beatInBar === 0 || beatInBar === 2) this._kick(time);
    // Snare: beats 2 & 4 (index 1, 3)
    if (beatInBar === 1 || beatInBar === 3) this._snare(time);

    // Hi-hats (on beat + 8th-note off-beat)
    this._hihat(time, beatInBar % 2 === 0);
    this._hihat(time + this.beatDur * 0.5, false);

    // Boss mode: extra kick on 'and' of beats 1 & 3
    if (this.bossMode && (beatInBar === 0 || beatInBar === 2)) {
      this._kick(time + this.beatDur * 0.5);
    }
  }

  _runScheduler() {
    if (!this.playing) return;
    while (this.nextBeatTime < this.ctx.currentTime + this.scheduleAhead) {
      this._scheduleBeat(this.currentBeat, this.nextBeatTime);
      this.nextBeatTime += this.beatDur;
      this.currentBeat = (this.currentBeat + 1) % this.totalBeats;
    }
  }

  // ── public API ───────────────────────────────────────────
  start() {
    if (this.playing) return;
    this.playing = true;
    this.currentBeat = 0;
    this.nextBeatTime = this.ctx.currentTime + 0.12;
    this._runScheduler();
    this._timer = setInterval(() => this._runScheduler(), 22);
    this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.musicGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.musicGain.gain.linearRampToValueAtTime(0.38, this.ctx.currentTime + 2.5);
  }

  stop() {
    if (!this.playing) return;
    this.playing = false;
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    const ct = this.ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(ct);
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, ct);
    this.musicGain.gain.linearRampToValueAtTime(0, ct + 0.9);
  }

  pause() {
    const ct = this.ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(ct);
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, ct);
    this.musicGain.gain.linearRampToValueAtTime(0, ct + 0.35);
  }

  resume() {
    const target = this.bossMode ? 0.5 : 0.38;
    const ct = this.ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(ct);
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, ct);
    this.musicGain.gain.linearRampToValueAtTime(target, ct + 0.35);
  }

  setBossMode(enabled) {
    this.bossMode = enabled;
    this.tempo = enabled ? 140 : 120;
    this.beatDur = 60 / this.tempo;
    const target = enabled ? 0.5 : 0.38;
    const ct = this.ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(ct);
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, ct);
    this.musicGain.gain.linearRampToValueAtTime(target, ct + 0.6);
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
}

export const soundEngine = new SoundEngine();
