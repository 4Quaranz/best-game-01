// Synthesised sound only (WebAudio, no audio files): a soft chime when pollen is
// collected, a low thud when the moth is hit, and a little arpeggio on level-up.
// Everything is guarded, so the game never crashes without audio, and the audio
// context only starts after the player's first gesture.

export function createAudio() {
  let context = null;
  let muted = false;

  function ensure() {
    if (context !== null) return context;
    try {
      const AudioContext = window.AudioContext ?? window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
    } catch {
      context = null;
    }
    return context;
  }

  function tone(frequency, startAt, duration, type, volume) {
    if (muted) return;
    const audio = ensure();
    if (audio === null) return;
    try {
      if (audio.state === 'suspended') void audio.resume();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, audio.currentTime + startAt);
      gain.gain.setValueAtTime(0, audio.currentTime + startAt);
      gain.gain.linearRampToValueAtTime(volume, audio.currentTime + startAt + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + startAt + duration);
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start(audio.currentTime + startAt);
      oscillator.stop(audio.currentTime + startAt + duration + 0.05);
    } catch {
      // Sound is decoration: a failure here never stops the game.
    }
  }

  return {
    /** Start the audio context from a user gesture. */
    unlock() {
      ensure();
    },
    /** A bright two-note chime for one pollen orb. */
    chime() {
      tone(1318, 0, 0.16, 'sine', 0.12);
      tone(1760, 0.06, 0.2, 'sine', 0.1);
    },
    /** A low thud for a hit. */
    thud() {
      tone(110, 0, 0.22, 'triangle', 0.22);
      tone(65, 0.02, 0.26, 'sine', 0.2);
    },
    /** A rising arpeggio for a level-up. */
    fanfare() {
      const notes = [523, 659, 784, 1047];
      for (let index = 0; index < notes.length; index += 1) {
        tone(notes[index], index * 0.09, 0.24, 'sine', 0.12);
      }
    },
    /** Toggle sound on and off; returns the new muted state. */
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
  };
}
