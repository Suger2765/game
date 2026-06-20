export class AudioFX {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e) {
      this.enabled = false;
    }
    this._initOnInteraction();
  }

  _initOnInteraction() {
    if (!this.ctx || this.ctx.state !== 'suspended') return;
    const wake = () => {
      this.ctx.resume();
      document.removeEventListener('click', wake);
      document.removeEventListener('touchstart', wake);
    };
    document.addEventListener('click', wake);
    document.addEventListener('touchstart', wake);
  }

  _play(freqs, durations, delay = 0) {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime + delay;
    const oscGain = 0.08;
    for (let i = 0; i < freqs.length; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freqs[i], now);
      gain.gain.setValueAtTime(oscGain, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + durations[i]);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + (i > 0 ? durations[i-1] : 0));
      osc.stop(now + durations[i] + 0.1);
    }
  }

  starClick() {
    this._play([523.25, 659.25, 783.99], [0.1, 0.1, 0.2], 0);
  }

  complete() {
    const dur = 0.15;
    this._play([261.63, 329.63, 392.00, 523.25], [dur, dur, dur, 0.4], 0);
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }
}
