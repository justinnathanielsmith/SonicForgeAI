import { 
  ISoundRepository, 
  SynthParams, 
  SoundEntity, 
  SoundPreset 
} from '../types';
import { generateSynthParams } from '../data/geminiService';
import { generateSoundBuffer } from './audioEngine';
import { audioBufferToWav } from './wavEncoder';
import { synthParamsToMidi } from './midiEncoder';
import { 
  loadHistory, 
  saveHistory, 
  loadCustomPresets, 
  saveCustomPresets 
} from '../data/storage';

/**
 * Concrete implementation of the SoundRepository.
 */
export class SoundRepository implements ISoundRepository {
  async generateParams(prompt: string, baseParams?: SynthParams): Promise<SynthParams> {
    return await generateSynthParams(prompt, baseParams);
  }

  async renderAudio(params: SynthParams): Promise<AudioBuffer> {
    return await generateSoundBuffer(params);
  }

  getHistory(): SoundEntity[] {
    return loadHistory();
  }

  saveHistory(history: SoundEntity[]): void {
    saveHistory(history);
  }

  getCustomPresets(): SoundPreset[] {
    return loadCustomPresets();
  }

  saveCustomPresets(presets: SoundPreset[]): void {
    saveCustomPresets(presets);
  }

  exportWav(buffer: AudioBuffer): Blob {
    return audioBufferToWav(buffer);
  }

  exportMidi(params: SynthParams): Blob {
    return synthParamsToMidi(params);
  }
}

// Single instance for the app
export const soundRepository = new SoundRepository();