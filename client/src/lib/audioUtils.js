// Simple Web Audio API Synthesizer for Phone Calls
// This avoids needing external MP3 files while still providing familiar call sounds.

class CallAudio {
  constructor() {
    this.audioCtx = null;
    this.ringInterval = null;
    this.dialInterval = null;
  }

  init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(console.error);
    }
  }

  playTone(freq1, freq2, duration) {
    if (!this.audioCtx) return;
    try {
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.value = freq1;
      osc2.frequency.value = freq2;

      // Envelope to prevent audio popping
      gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, this.audioCtx.currentTime + 0.02);
      gainNode.gain.setValueAtTime(0.1, this.audioCtx.currentTime + duration - 0.02);
      gainNode.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + duration);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(this.audioCtx.currentTime + duration);
      osc2.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      console.error("Audio playback error:", e);
    }
  }

  // Incoming Call Ringtone
  startRinging() {
    this.init();
    this.stopAll();
    
    const ring = () => {
      // European style ring (two short bursts)
      this.playTone(400, 450, 0.4);
      setTimeout(() => this.playTone(400, 450, 0.4), 600);
    };
    
    ring(); // Initial ring
    this.ringInterval = setInterval(ring, 3000); // Repeat every 3s
  }

  // Dialing tone (US style: long continuous tones with pauses)
  startDialing() {
    this.init();
    this.stopAll();

    const dial = () => {
      this.playTone(440, 480, 2.0); // 2 seconds tone
    };

    dial();
    this.dialInterval = setInterval(dial, 4000); // 2s tone + 2s pause
  }

  stopAll() {
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
    if (this.dialInterval) {
      clearInterval(this.dialInterval);
      this.dialInterval = null;
    }
  }

  // Hangup / Call Ended Beep
  playCallEnd() {
    this.init();
    this.stopAll();
    
    // Three quick descending beeps
    this.playTone(600, 600, 0.15);
    setTimeout(() => this.playTone(450, 450, 0.15), 200);
    setTimeout(() => this.playTone(300, 300, 0.15), 400);
  }
}

export const callAudio = new CallAudio();
