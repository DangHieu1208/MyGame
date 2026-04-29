class SoundManager {
  private ctx: AudioContext | null = null;
  public volume: number = 0.5;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', volumeScale = 1) {
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(this.volume * volumeScale, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playMove() { this.playTone(150, 0.1, 'triangle', 0.2); }
  playAttack() { this.playTone(80, 0.2, 'square', 0.3); }
  playHurt() { this.playTone(60, 0.3, 'sawtooth', 0.4); }
  playPick() { this.playTone(440, 0.1, 'sine', 0.5); setTimeout(() => this.playTone(880, 0.1), 50); }
  playPlace() { this.playTone(880, 0.15, 'sine', 0.5); setTimeout(() => this.playTone(440, 0.15), 50); }
  playDeath() { this.playTone(40, 0.5, 'sawtooth', 0.5); }
  playUpgrade() { 
    [261, 329, 392, 523].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.2, 'sine', 0.5), i * 100);
    });
  }
}

export const sounds = new SoundManager();
