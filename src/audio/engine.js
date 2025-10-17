let singleton = null;
export class AudioEngine {
  constructor() {
    this.audio = new Audio();
    this.audio.crossOrigin = "anonymous";
    this.audio.preservesPitch = false;
    this.audio.mozPreservesPitch = false;
    this.audio.webkitPreservesPitch = false;

    this.ctx = null; this.srcNode = null;
    this.bass = null; this.dryGain = null; this.delay = null; this.feedbackGain = null; this.delayWet = null;
    this.convolver = null; this.reverbWet = null; this.master = null; this.analyser = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.srcNode = this.ctx.createMediaElementSource(this.audio);

    this.bass = this.ctx.createBiquadFilter();
    this.bass.type = "lowshelf"; this.bass.frequency.value = 200; this.bass.gain.value = 0;

    this.dryGain = this.ctx.createGain(); this.dryGain.gain.value = 1;

    this.delay = this.ctx.createDelay(5.0); this.delay.delayTime.value = 0.25;
    this.feedbackGain = this.ctx.createGain(); this.feedbackGain.gain.value = 0.0;
    this.delayWet = this.ctx.createGain(); this.delayWet.gain.value = 0.0;
    this.delay.connect(this.feedbackGain); this.feedbackGain.connect(this.delay);

    this.convolver = this.ctx.createConvolver(); this.convolver.normalize = true;
    this.convolver.buffer = this._impulse(this.ctx, 2.5, 2.0);
    this.reverbWet = this.ctx.createGain(); this.reverbWet.gain.value = 0.0;

    this.master = this.ctx.createGain(); this.master.gain.value = 1.0;

    this.analyser = this.ctx.createAnalyser(); this.analyser.fftSize = 2048; this.analyser.smoothingTimeConstant = 0.8;

    this.srcNode.connect(this.bass);
    this.bass.connect(this.dryGain); this.dryGain.connect(this.master);
    this.bass.connect(this.delay); this.delay.connect(this.delayWet); this.delayWet.connect(this.master);
    this.bass.connect(this.convolver); this.convolver.connect(this.reverbWet); this.reverbWet.connect(this.master);
    this.master.connect(this.analyser); this.analyser.connect(this.ctx.destination);
    this.initialized = true;
  }

  _impulse(ctx, duration = 2.5, decay = 2.0) {
    const rate = ctx.sampleRate, len = Math.max(1, Math.floor(rate * duration));
    const buf = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  async load(url) { this.init(); if (this.audio.src !== url) this.audio.src = url; try { await this.audio.play() } catch (e) {} }
  setPlaybackRate(rate) { this.init(); const r = Math.max(0.25, Math.min(4.0, rate || 1)); this.audio.playbackRate = r }
  setBassGain(db) { this.init(); const v = Math.max(-30, Math.min(30, db || 0)); this.bass.gain.value = v }
  setFxMix(mix) {
    this.init(); const m = Math.max(-1, Math.min(1, +mix || 0));
    if (m < 0) { const amt = Math.abs(m);
      this.delayWet.gain.value = amt;
      this.feedbackGain.gain.value = Math.min(0.7, amt * 0.6 + 0.1);
      this.delay.delayTime.value = 0.15 + amt * 0.35;
      this.reverbWet.gain.value = 0.0;
    } else if (m > 0) {
      this.reverbWet.gain.value = m;
      this.delayWet.gain.value = 0.0; this.feedbackGain.gain.value = 0.0;
    } else {
      this.delayWet.gain.value = 0.0; this.feedbackGain.gain.value = 0.0; this.reverbWet.gain.value = 0.0;
    }
  }
  play() { this.init(); return this.audio.play() }
  pause() { return this.audio.pause() }
  toggle() { if (this.audio.paused) this.play(); else this.pause() }
  setOnEnded(cb) { this.audio.onended = cb }

  // 🛑 stop lecture + reset
  stopAll() {
    try { this.audio.pause(); } catch (e) {}
    this.audio.currentTime = 0;
  }
}
export function getEngine() { if (!singleton) singleton = new AudioEngine(); return singleton }
