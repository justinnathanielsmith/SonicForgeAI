import { SoundEntity, SoundPreset } from '../types';

const HISTORY_KEY = 'sonicforge_history_v1';
const PRESETS_KEY = 'sonicforge_custom_presets_v1';

export const loadHistory = (): SoundEntity[] => {
  if (typeof window === 'undefined') return [];
  try {
    const item = localStorage.getItem(HISTORY_KEY);
    return item ? JSON.parse(item) : [];
  } catch (error) {
    console.warn('Failed to load history from local storage:', error);
    return [];
  }
};

export const saveHistory = (history: SoundEntity[]) => {
  try {
    // We must exclude audioBuffer and blobUrl as they are not serializable or session-specific
    const serializableHistory = history.map(({ audioBuffer, blobUrl, ...rest }) => rest);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(serializableHistory));
  } catch (error) {
    console.error('Failed to save history to local storage:', error);
  }
};

export const loadCustomPresets = (): SoundPreset[] => {
  if (typeof window === 'undefined') return [];
  try {
    const item = localStorage.getItem(PRESETS_KEY);
    return item ? JSON.parse(item) : [];
  } catch (error) {
    console.warn('Failed to load custom presets from local storage:', error);
    return [];
  }
};

export const saveCustomPresets = (presets: SoundPreset[]) => {
  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  } catch (error) {
    console.error('Failed to save custom presets to local storage:', error);
  }
};