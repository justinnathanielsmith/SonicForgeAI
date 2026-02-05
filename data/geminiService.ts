import { GoogleGenAI, Type } from "@google/genai";
import { SynthParams } from '../types';
import { SYSTEM_INSTRUCTION } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSynthParams = async (
  description: string,
  baseParams?: SynthParams
): Promise<SynthParams> => {
  
  let prompt = `Task: Create high-quality game sound effect parameters.\nDescription: "${description || 'A generic electronic sound'}"`;
  
  if (baseParams) {
    prompt += `\n\nContext: Modify these existing base parameters to fit the description while maintaining a similar sonic character for consistency: ${JSON.stringify(baseParams)}`;
  } else {
    prompt += `\n\nContext: This is a fresh sound design. Be creative and professional.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            waveform: { type: Type.STRING, description: "One of: sine, square, sawtooth, triangle, noise, pulse, custom" },
            frequencyStart: { type: Type.NUMBER, description: "Start frequency in Hz (20-10000)" },
            frequencyEnd: { type: Type.NUMBER, description: "End frequency in Hz (20-10000)" },
            duration: { type: Type.NUMBER, description: "Duration in seconds (0.1-4.0)" },
            attack: { type: Type.NUMBER, description: "Attack time in seconds (0-1.0)" },
            decay: { type: Type.NUMBER, description: "Decay time in seconds (0-1.0)" },
            sustain: { type: Type.NUMBER, description: "Sustain level (0-1.0)" },
            release: { type: Type.NUMBER, description: "Release time in seconds (0-2.0)" },
            volume: { type: Type.NUMBER, description: "Master volume (0-1.0)" },
            filterType: { type: Type.STRING, description: "One of: lowpass, highpass, bandpass, allpass" },
            filterFreq: { type: Type.NUMBER, description: "Filter cutoff frequency (20-15000)" },
            qFactor: { type: Type.NUMBER, description: "Filter resonance (0.1-15.0)" },
            filterModLfoRate: { type: Type.NUMBER, description: "LFO frequency (0-20)" },
            filterModLfoDepth: { type: Type.NUMBER, description: "LFO depth in Hz (0-5000)" },
            filterModEnvDepth: { type: Type.NUMBER, description: "Envelope depth in Hz (0-5000)" },
            distortion: { type: Type.NUMBER, description: "Distortion drive (0-1.0)" },
            delayTime: { type: Type.NUMBER, description: "Delay time in seconds (0-1.0)" },
            delayFeedback: { type: Type.NUMBER, description: "Delay feedback (0-0.9)" },
            reverb: { type: Type.NUMBER, description: "Reverb wetness (0-1.0)" },
            pulseWidth: { type: Type.NUMBER, description: "Pulse width for pulse waves (0.01-0.99)" },
            harmonics: {
              type: Type.ARRAY,
              items: { type: Type.NUMBER },
              description: "8 harmonic amplitudes for custom waveform"
            }
          },
          required: [
            "waveform", "frequencyStart", "frequencyEnd", "duration",
            "attack", "decay", "sustain", "release", "volume",
            "filterType", "filterFreq", "qFactor", 
            "filterModLfoRate", "filterModLfoDepth", "filterModEnvDepth",
            "distortion", "delayTime", "delayFeedback", "reverb",
            "pulseWidth", "harmonics"
          ]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text from Gemini");
    
    // Robustly handle cases where the model might still return markdown blocks despite responseMimeType
    const cleanJson = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
    
    try {
      return JSON.parse(cleanJson) as SynthParams;
    } catch (parseError) {
      console.error("JSON Parse Error on text:", cleanJson);
      throw new Error("AI returned invalid JSON formatting.");
    }
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw new Error("Generation error: The AI core failed to compile sound parameters.");
  }
};