import { SynthParams } from '../types';

/**
 * Encodes synth parameters into a MIDI file.
 * captures:
 * 1. The base note (derived from frequencyStart)
 * 2. Pitch bend events to simulate the frequency slide (frequencyEnd)
 * 3. CC #74 events to simulate the filter cutoff value
 */
export const synthParamsToMidi = (params: SynthParams): Blob => {
  const ticksPerBeat = 480;
  const tempoBPM = 120;
  // Use a fixed MIDI channel (0)
  
  // Frequency to MIDI Note conversion
  const freqToMidi = (f: number) => 69 + 12 * Math.log2(f / 440);
  const startMidiNote = Math.round(freqToMidi(params.frequencyStart));
  const endMidiNote = freqToMidi(params.frequencyEnd);
  
  // Calculate pitch bend. Standard range is +/- 2 semitones.
  // Many DAWs default to 2, but some use 12. We'll use 2 as a conservative standard.
  const semitoneDiff = endMidiNote - startMidiNote;
  const pitchBendRange = 2; // semitones
  const pitchBendValue = (diff: number) => {
    const normalized = Math.max(-1, Math.min(1, diff / pitchBendRange));
    return Math.floor((normalized + 1) * 8191.5);
  };

  const header = [
    0x4d, 0x54, 0x68, 0x64, // "MThd"
    0x00, 0x00, 0x00, 0x06, // length
    0x00, 0x00,             // format 0
    0x00, 0x01,             // 1 track
    (ticksPerBeat >> 8) & 0xff, ticksPerBeat & 0xff
  ];

  const trackEvents: number[] = [];

  // 1. Note On at t=0
  trackEvents.push(0x00); // delta time
  trackEvents.push(0x90, startMidiNote, 0x64); // Note On, pitch, velocity 100

  // 2. Set Initial CC 74 (Filter Cutoff)
  // Normalize 20-10000Hz to 0-127
  const filterVal = Math.floor(Math.max(0, Math.min(127, (params.filterFreq / 10000) * 127)));
  trackEvents.push(0x00);
  trackEvents.push(0xB0, 0x4A, filterVal); // CC 74

  // 3. Pitch Bend Automation (if frequency slide exists)
  const steps = 10;
  const totalTicks = Math.floor(params.duration * (tempoBPM / 60) * ticksPerBeat);
  const stepTicks = Math.floor(totalTicks / steps);

  for (let i = 1; i <= steps; i++) {
    const progress = i / steps;
    const currentFreq = params.frequencyStart + (params.frequencyEnd - params.frequencyStart) * progress;
    const currentMidi = freqToMidi(currentFreq);
    const diff = currentMidi - startMidiNote;
    const bend = pitchBendValue(diff);

    trackEvents.push(...encodeVariableLength(stepTicks));
    trackEvents.push(0xE0, bend & 0x7F, (bend >> 7) & 0x7F);
  }

  // 4. Note Off
  trackEvents.push(0x00); // end of last delta
  trackEvents.push(0x80, startMidiNote, 0x00);

  // 5. End of Track
  trackEvents.push(0x00, 0xFF, 0x2F, 0x00);

  const trackHeader = [
    0x4d, 0x54, 0x72, 0x6b, // "MTrk"
    (trackEvents.length >> 24) & 0xff,
    (trackEvents.length >> 16) & 0xff,
    (trackEvents.length >> 8) & 0xff,
    trackEvents.length & 0xff
  ];

  const midiData = new Uint8Array([...header, ...trackHeader, ...trackEvents]);
  return new Blob([midiData], { type: 'audio/midi' });
};

function encodeVariableLength(value: number): number[] {
  const buffer = [];
  buffer.push(value & 0x7F);
  while (value > 0x7F) {
    value >>= 7;
    buffer.push((value & 0x7F) | 0x80);
  }
  return buffer.reverse();
}
