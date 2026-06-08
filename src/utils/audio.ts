/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Procedural sound effects using Web Audio API to prevent external file dependencies
class AudioSynth {
  private ctx: AudioContext | null = null;
  private backgroundLoop: { hum: OscillatorNode; noise: AudioWorkletNode | ScriptProcessorNode; gain: GainNode } | null = null;

  private init() {
    if (!this.ctx) {
      // @ts-ignore
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
  }

  // Heavy metal clank or stone push
  playClick() {
    this.init();
    if (!this.ctx) return;
    const ctx = this.ctx;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(140, now);
    osc1.frequency.exponentialRampToValueAtTime(30, now + 0.15);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(80, now);
    osc2.frequency.exponentialRampToValueAtTime(10, now + 0.18);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, now);
    filter.Q.setValueAtTime(2, now);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.2);
    osc2.stop(now + 0.2);
  }

  // Hollow knight nail slash / Blasphemous sword sweep
  playSlash() {
    this.init();
    if (!this.ctx) return;
    const ctx = this.ctx;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    const bufferSize = ctx.sampleRate * 0.25; // 250ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate white noise with descending amplitude for sharp strike
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.frequency.exponentialRampToValueAtTime(600, now + 0.2);
    filter.Q.setValueAtTime(3, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    // Also layered with a fast metallic frequency sweep oscillator
    const metal = ctx.createOscillator();
    metal.type = 'sawtooth';
    metal.frequency.setValueAtTime(120, now);
    metal.frequency.exponentialRampToValueAtTime(900, now + 0.1);
    
    const metalGain = ctx.createGain();
    metalGain.gain.setValueAtTime(0.12, now);
    metalGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    metal.connect(metalGain);
    metalGain.connect(ctx.destination);

    noiseSource.start(now);
    metal.start(now);
    noiseSource.stop(now + 0.25);
    metal.stop(now + 0.15);
  }

  // Ethereal golden soul chime (Dark Souls bonfire claim/restore or geo get)
  playSoulsClaimed() {
    this.init();
    if (!this.ctx) return;
    const ctx = this.ctx;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    
    // Series of chime notes in a minor scale (gothic)
    const notes = [311.13, 369.99, 440.00, 554.37, 739.99]; // D#, F#, A, C#, F#
    notes.forEach((freq, idx) => {
      const stagger = idx * 0.04;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + stagger);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + stagger + 0.4);

      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(0.06, now + stagger + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + stagger + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + stagger);
      osc.stop(now + stagger + 0.7);
    });
  }

  // "YOU DIED" heavy orchestral gothic drone
  playYouDied() {
    this.init();
    if (!this.ctx) return;
    const ctx = this.ctx;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;

    // Orchestral low bass drone (C1 + C2 harmonics)
    const baseFreqs = [32.70, 65.41, 98.00, 130.81]; // C1, C2, G2, C3
    baseFreqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      // Gentle modulation
      osc.frequency.linearRampToValueAtTime(freq - 1, now + 1.5);
      osc.frequency.linearRampToValueAtTime(freq + 0.5, now + 3.0);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(150, now);
      filter.frequency.exponentialRampToValueAtTime(70, now + 2.5);

      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.3); // Fade in slowly like Dark Souls death screens
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 3.6);
    });

    // High ominous dissonant tone
    const highOsc = ctx.createOscillator();
    const highGain = ctx.createGain();
    highOsc.type = 'sine';
    highOsc.frequency.setValueAtTime(880, now); // A5
    highOsc.frequency.linearRampToValueAtTime(870, now + 2.0); // eerie pitch bend down

    highGain.gain.setValueAtTime(0.0, now);
    highGain.gain.linearRampToValueAtTime(0.03, now + 0.4);
    highGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

    highOsc.connect(highGain);
    highGain.connect(ctx.destination);
    highOsc.start(now);
    highOsc.stop(now + 3.3);
  }

  // Toggle ambient bonfire / bench loop
  toggleBonfireAmbient(isOn: boolean) {
    this.init();
    if (!this.ctx) return;
    const ctx = this.ctx;

    if (!isOn) {
      if (this.backgroundLoop) {
        try {
          const now = ctx.currentTime;
          this.backgroundLoop.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
          const loopRef = this.backgroundLoop;
          setTimeout(() => {
            loopRef.hum.stop();
            // @ts-ignore
            if (loopRef.noise.stop) loopRef.noise.stop();
          }, 900);
        } catch (e) {}
        this.backgroundLoop = null;
      }
      return;
    }

    if (this.backgroundLoop) return; // already active
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.0, now);
    gainNode.gain.linearRampToValueAtTime(0.05, now + 1.0); // Slow fade-in

    // 1. Warm core hum
    const humOsc = ctx.createOscillator();
    humOsc.type = 'triangle';
    humOsc.frequency.setValueAtTime(55, now); // Low G
    
    const humFilter = ctx.createBiquadFilter();
    humFilter.type = 'lowpass';
    humFilter.frequency.setValueAtTime(80, now);

    humOsc.connect(humFilter);
    humFilter.connect(gainNode);

    // 2. Continuous crackle noise helper using a ScriptProcessorNode (legacy but simple & reliable offline fallback)
    // We synthesize continuous crackling sparks
    // @ts-ignore
    const createCrackleNode = () => {
      const bufferSize = 4096;
      // @ts-ignore
      const node = ctx.createScriptProcessor ? ctx.createScriptProcessor(bufferSize, 0, 1) : null;
      if (!node) return null;
      
      let lastCrackle = 0;
      node.onaudioprocess = (e) => {
        const output = e.outputBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          let spark = 0;
          // Random pops
          if (Math.random() < 0.0002) {
            spark = (Math.random() > 0.5 ? 1 : -1) * 0.4;
            lastCrackle = spark;
          } else {
            // Decay pop
            lastCrackle *= 0.92;
            spark = lastCrackle;
          }
          // White-ish noise background crackle
          const baseHum = (Math.random() * 2 - 1) * 0.004;
          output[i] = spark + baseHum;
        };
      };
      return node;
    };

    const noiseNode = createCrackleNode();
    if (noiseNode) {
      const crackleFilter = ctx.createBiquadFilter();
      crackleFilter.type = 'bandpass';
      crackleFilter.frequency.setValueAtTime(1000, now);
      crackleFilter.Q.setValueAtTime(1.5, now);

      noiseNode.connect(crackleFilter);
      crackleFilter.connect(gainNode);
    }

    gainNode.connect(ctx.destination);
    humOsc.start(now);

    this.backgroundLoop = {
      hum: humOsc,
      noise: noiseNode as any,
      gain: gainNode
    };
  }

  // Ignite spark flame sound (when starting the RPG flow)
  playQuestIgnite() {
    this.init();
    if (!this.ctx) return;
    const ctx = this.ctx;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    
    // Low fire swell using a fast lowpass oscillator sweep
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.4);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(600, now + 0.35);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    // Dynamic fire crackle bursts
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * (1.0 - i / noiseBuffer.length);
    }
    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(800, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    noiseNode.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    osc.start(now);
    noiseNode.start(now);
    osc.stop(now + 0.5);
    noiseNode.stop(now + 0.4);
  }

  // Inscribe stone ledger / Quill signature pen sound
  playQuestInscribe() {
    this.init();
    if (!this.ctx) return;
    const ctx = this.ctx;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    
    // Scratch 1: fast friction bandpass noise burst
    const dur = 0.15;
    const scratchBuffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const scratchData = scratchBuffer.getChannelData(0);
    for (let i = 0; i < scratchBuffer.length; i++) {
       scratchData[i] = (Math.random() * 2 - 1) * Math.sin((i / scratchBuffer.length) * Math.PI);
    }
    const scratchNode = ctx.createBufferSource();
    scratchNode.buffer = scratchBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3000, now);
    filter.Q.setValueAtTime(5, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    scratchNode.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    scratchNode.start(now);
    scratchNode.stop(now + dur);

    // Followed immediately by a light chime ding representing inscription completed
    const osc = ctx.createOscillator();
    const bellGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, now + 0.08); // E5

    bellGain.gain.setValueAtTime(0.0, now);
    bellGain.gain.linearRampToValueAtTime(0.04, now + 0.1);
    bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(bellGain);
    bellGain.connect(ctx.destination);

    osc.start(now + 0.08);
    osc.stop(now + 0.5);
  }

  // Triumphant RPG level up chord
  playLevelUp() {
    this.init();
    if (!this.ctx) return;
    const ctx = this.ctx;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    
    // Multi-voice C major/minor celestial transition or gorgeous chord structure
    const chord = [261.63, 311.13, 392.00, 523.25, 659.25]; // C4, D#4 (Gothic Cm), G4, C5, E5 (resolution)
    
    chord.forEach((freq, idx) => {
      const stagger = idx * 0.05;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Alternating vintage sound sources
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + stagger);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, now);

      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(0.05, now + stagger + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + stagger + 1.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + stagger);
      osc.stop(now + stagger + 1.3);
    });
  }
}

export const soundEngine = new AudioSynth();
