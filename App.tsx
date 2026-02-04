import React, { useReducer, useEffect, useRef } from 'react';
import { 
  AppState, 
  Action, 
  IntentType, 
  SoundEntity 
} from './types';
import { generateSynthParams } from './data/geminiService';
import { generateSoundBuffer, playBuffer, getAudioContext } from './domain/audioEngine';
import { audioBufferToWav } from './domain/wavEncoder';
import Button from './ui/Button';
import Visualizer from './ui/Visualizer';
import { 
  Play, 
  Square, 
  Download, 
  Wand2, 
  History, 
  Trash2, 
  RefreshCw, 
  Music2,
  Sliders
} from 'lucide-react';

// --- INITIAL STATE ---
const initialState: AppState = {
  prompt: '',
  isGenerating: false,
  history: [],
  selectedSoundId: null,
  isPlaying: false,
  error: null,
  analyzerData: null,
};

// --- REDUCER (Pure Domain Logic) ---
const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case IntentType.UPDATE_PROMPT:
      return { ...state, prompt: action.payload };
    case IntentType.GENERATE_SOUND:
      return { ...state, isGenerating: true, error: null };
    case IntentType.GENERATION_SUCCESS:
      return {
        ...state,
        isGenerating: false,
        history: [action.payload, ...state.history],
        selectedSoundId: action.payload.id,
      };
    case IntentType.GENERATION_FAILURE:
      return { ...state, isGenerating: false, error: action.payload };
    case IntentType.SELECT_SOUND:
      return { ...state, selectedSoundId: action.payload, error: null };
    case IntentType.PLAY_SOUND:
      return { ...state, isPlaying: true, selectedSoundId: action.payload };
    case IntentType.STOP_SOUND:
      return { ...state, isPlaying: false, analyzerData: null };
    case IntentType.UPDATE_ANALYZER:
      return { ...state, analyzerData: action.payload };
    case IntentType.DELETE_SOUND:
        return {
            ...state,
            history: state.history.filter(s => s.id !== action.payload),
            selectedSoundId: state.selectedSoundId === action.payload ? null : state.selectedSoundId
        }
    default:
      return state;
  }
};

const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const animationRef = useRef<number>(0);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // --- INTENT HANDLERS (Side Effects + Dispatch) ---

  const handleGenerate = async (remix: boolean = false) => {
    if (!state.prompt && !remix) return;

    dispatch({ type: IntentType.GENERATE_SOUND });

    try {
      let baseParams = undefined;
      // If remixing, find the selected sound's params
      if (remix && state.selectedSoundId) {
         const selected = state.history.find(s => s.id === state.selectedSoundId);
         if (selected) baseParams = selected.params;
      }

      // 1. Get Params from Gemini
      const params = await generateSynthParams(state.prompt, baseParams);

      // 2. Synthesize Audio
      const buffer = await generateSoundBuffer(params);
      
      // 3. Encode to WAV
      const blob = audioBufferToWav(buffer);
      const blobUrl = URL.createObjectURL(blob);

      const newSound: SoundEntity = {
        id: crypto.randomUUID(),
        name: remix ? `Remix: ${state.prompt || 'Untitled'}` : (state.prompt || 'Generated Sound'),
        description: state.prompt,
        params,
        timestamp: Date.now(),
        audioBuffer: buffer,
        blobUrl
      };

      dispatch({ type: IntentType.GENERATION_SUCCESS, payload: newSound });
      
      // Auto-play on success
      handlePlay(newSound);

    } catch (error: any) {
      dispatch({ 
        type: IntentType.GENERATION_FAILURE, 
        payload: error.message || 'Unknown error occurred' 
      });
    }
  };

  const handlePlay = (sound: SoundEntity) => {
    if (activeSourceRef.current) {
        try { activeSourceRef.current.stop(); } catch(e){}
    }
    
    // Ensure AudioContext is ready (user interaction requirement)
    getAudioContext().resume();

    if (!sound.audioBuffer) {
        // Re-synthesize if buffer missing (shouldn't happen in this session)
        generateSoundBuffer(sound.params).then(buffer => {
            sound.audioBuffer = buffer;
            sound.blobUrl = URL.createObjectURL(audioBufferToWav(buffer));
            startPlayback(sound.audioBuffer, sound.id);
        });
    } else {
        startPlayback(sound.audioBuffer, sound.id);
    }
  };

  const startPlayback = (buffer: AudioBuffer, id: string) => {
    dispatch({ type: IntentType.PLAY_SOUND, payload: id });

    const { source, analyser } = playBuffer(buffer, () => {
      dispatch({ type: IntentType.STOP_SOUND });
      cancelAnimationFrame(animationRef.current!);
    });

    activeSourceRef.current = source;

    // Animation Loop
    const updateVisualizer = () => {
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteTimeDomainData(dataArray);
      dispatch({ type: IntentType.UPDATE_ANALYZER, payload: dataArray });
      animationRef.current = requestAnimationFrame(updateVisualizer);
    };
    updateVisualizer();
  };

  const handleDownload = (sound: SoundEntity) => {
    if (!sound.blobUrl) return;
    const a = document.createElement('a');
    a.href = sound.blobUrl;
    a.download = `${sound.name.replace(/\s+/g, '_')}_${sound.id.slice(0,4)}.wav`;
    a.click();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (activeSourceRef.current) {
        try { activeSourceRef.current.stop(); } catch(e){}
      }
      cancelAnimationFrame(animationRef.current!);
    };
  }, []);

  const selectedSound = state.history.find(s => s.id === state.selectedSoundId);

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-8 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <header className="w-full flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Music2 className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">SonicForge AI</h1>
            <p className="text-gray-400 text-sm">GenAI Powered Sound Engine</p>
          </div>
        </div>
        <div className="text-right hidden sm:block">
            <div className="text-xs text-gray-500 font-mono">MODEL: GEMINI-3-FLASH</div>
            <div className="text-xs text-gray-500 font-mono">AUDIO: 44.1KHZ 16-BIT</div>
        </div>
      </header>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full flex-1">
        
        {/* LEFT COLUMN: Controls & Visualizer */}
        <section className="lg:col-span-8 space-y-6">
          
          {/* VISUALIZER */}
          <Visualizer data={state.analyzerData} isPlaying={state.isPlaying} />

          {/* INPUT AREA */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-2xl">
            <label className="block text-sm font-medium text-gray-400 mb-2">Describe your sound effect</label>
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={state.prompt}
                onChange={(e) => dispatch({ type: IntentType.UPDATE_PROMPT, payload: e.target.value })}
                placeholder="e.g. 'Retro laser gun', 'Heavy wooden door slam', 'Magical chime'..."
                className="flex-1 bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-gray-600"
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate(false)}
              />
              <Button 
                onClick={() => handleGenerate(false)} 
                isLoading={state.isGenerating}
                disabled={!state.prompt}
                icon={<Wand2 className="w-4 h-4" />}
              >
                Generate
              </Button>
            </div>
            
            {state.error && (
              <div className="bg-red-900/20 border border-red-900/50 text-red-300 p-3 rounded-lg text-sm mb-4">
                {state.error}
              </div>
            )}

            {/* REMIX CONTROLS */}
            {selectedSound && (
              <div className="mt-4 pt-4 border-t border-gray-800">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                        <span className="text-indigo-400 font-semibold">Selected:</span> {selectedSound.name}
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            variant="secondary" 
                            onClick={() => handleGenerate(true)}
                            title="Generate a new sound based on the selected one's parameters"
                            icon={<Sliders className="w-3 h-3"/>}
                            className="text-xs"
                        >
                            Remix Selected
                        </Button>
                    </div>
                </div>
              </div>
            )}
          </div>

          {/* SELECTED SOUND DETAILS */}
          {selectedSound && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-white">Parameters</h3>
                    <div className="flex gap-2">
                        <Button 
                            onClick={() => handlePlay(selectedSound)}
                            variant={state.isPlaying && state.selectedSoundId === selectedSound.id ? "secondary" : "primary"}
                            icon={state.isPlaying && state.selectedSoundId === selectedSound.id ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        >
                            {state.isPlaying && state.selectedSoundId === selectedSound.id ? "Stop" : "Play"}
                        </Button>
                        <Button 
                            variant="secondary"
                            onClick={() => handleDownload(selectedSound)}
                            icon={<Download className="w-3 h-3" />}
                        >
                            WAV
                        </Button>
                    </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                    <div className="bg-gray-950 p-3 rounded border border-gray-800">
                        <div className="text-gray-500 mb-1">WAVEFORM</div>
                        <div className="text-indigo-400 uppercase">{selectedSound.params.waveform}</div>
                    </div>
                    <div className="bg-gray-950 p-3 rounded border border-gray-800">
                        <div className="text-gray-500 mb-1">FREQ</div>
                        <div className="text-indigo-400">{selectedSound.params.frequencyStart.toFixed(0)} Hz → {selectedSound.params.frequencyEnd.toFixed(0)} Hz</div>
                    </div>
                    <div className="bg-gray-950 p-3 rounded border border-gray-800">
                        <div className="text-gray-500 mb-1">ENVELOPE</div>
                        <div className="text-gray-300">
                            A:{selectedSound.params.attack} D:{selectedSound.params.decay} S:{selectedSound.params.sustain} R:{selectedSound.params.release}
                        </div>
                    </div>
                     <div className="bg-gray-950 p-3 rounded border border-gray-800">
                        <div className="text-gray-500 mb-1">FILTER</div>
                        <div className="text-gray-300">{selectedSound.params.filterType} @ {selectedSound.params.filterFreq}Hz</div>
                    </div>
                </div>
            </div>
          )}

        </section>

        {/* RIGHT COLUMN: History */}
        <section className="lg:col-span-4 flex flex-col h-[600px] lg:h-auto bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
                <div className="flex items-center gap-2 text-gray-300 font-medium">
                    <History className="w-4 h-4" />
                    Generated History
                </div>
                <span className="bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded-full">{state.history.length}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {state.history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm">
                        <RefreshCw className="w-8 h-8 mb-2 opacity-20" />
                        <p>No sounds generated yet.</p>
                        <p className="text-xs opacity-50 mt-1">Try "8-bit coin pickup"</p>
                    </div>
                ) : (
                    state.history.map(sound => (
                        <div 
                            key={sound.id}
                            onClick={() => dispatch({ type: IntentType.SELECT_SOUND, payload: sound.id })}
                            className={`group p-3 rounded-lg border cursor-pointer transition-all hover:bg-gray-800 flex items-center justify-between ${
                                state.selectedSoundId === sound.id 
                                ? 'bg-indigo-900/20 border-indigo-500/50' 
                                : 'bg-gray-950 border-gray-800 hover:border-gray-700'
                            }`}
                        >
                            <div className="flex-1 min-w-0">
                                <div className={`font-medium truncate ${state.selectedSoundId === sound.id ? 'text-indigo-400' : 'text-gray-300'}`}>
                                    {sound.name}
                                </div>
                                <div className="text-xs text-gray-500 truncate mt-0.5">
                                    {sound.params.waveform} • {sound.params.duration}s
                                </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handlePlay(sound); }}
                                    className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
                                >
                                    <Play className="w-3 h-3" />
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); dispatch({ type: IntentType.DELETE_SOUND, payload: sound.id }); }}
                                    className="p-1.5 rounded hover:bg-red-900/50 text-gray-500 hover:text-red-400"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>

      </div>
    </div>
  );
};

export default App;