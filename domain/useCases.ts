import { 
  ISoundRepository, 
  SynthParams, 
  SoundEntity, 
  SoundPreset,
  WaveformType
} from '../types';

/**
 * Orchestrates the full generation flow: AI -> Audio -> Metadata
 */
export const generateSoundUseCase = async (
  repo: ISoundRepository,
  prompt: string,
  baseParams?: SynthParams
): Promise<SoundEntity> => {
  // 1. Generate Parameters via AI
  const params = await repo.generateParams(prompt, baseParams);
  
  // 2. Render Audio Buffer
  const buffer = await repo.renderAudio(params);
  
  // 3. Create WAV Blob for download
  const wavBlob = repo.exportWav(buffer);
  const blobUrl = URL.createObjectURL(wavBlob);

  return {
    id: crypto.randomUUID(),
    name: prompt.toUpperCase().slice(0, 20) || 'GEN_CORE',
    description: prompt,
    params,
    timestamp: Date.now(),
    audioBuffer: buffer,
    blobUrl
  };
};

/**
 * Handles manual parameter compilation
 */
export const compileManualSoundUseCase = async (
  repo: ISoundRepository,
  params: SynthParams
): Promise<SoundEntity> => {
  const buffer = await repo.renderAudio(params);
  const wavBlob = repo.exportWav(buffer);
  const blobUrl = URL.createObjectURL(wavBlob);

  return {
    id: crypto.randomUUID(),
    name: `PATCH_${params.waveform.toUpperCase().slice(0, 3)}_${Date.now().toString().slice(-4)}`,
    description: 'MANUAL_PATCH',
    params: { ...params },
    timestamp: Date.now(),
    audioBuffer: buffer,
    blobUrl
  };
};

/**
 * Converts a preset into a working SoundEntity
 */
export const loadPresetUseCase = async (
  repo: ISoundRepository,
  preset: SoundPreset
): Promise<SoundEntity> => {
  const buffer = await repo.renderAudio(preset.params);
  const wavBlob = repo.exportWav(buffer);
  const blobUrl = URL.createObjectURL(wavBlob);

  return {
    id: crypto.randomUUID(),
    name: preset.name.toUpperCase(),
    description: preset.description,
    params: { ...preset.params },
    timestamp: Date.now(),
    audioBuffer: buffer,
    blobUrl
  };
};

/**
 * Handles the logic for creating a new user preset
 */
export const createUserPresetUseCase = (
  sound: SoundEntity,
  customName: string
): SoundPreset => {
  return {
    id: crypto.randomUUID(),
    name: customName.toUpperCase() || sound.name,
    description: `USR_PATCH_FROM_${sound.id.slice(0, 4)}`,
    params: { ...sound.params }
  };
};
