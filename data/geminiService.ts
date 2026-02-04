import { GoogleGenAI, Type } from "@google/genai";
import { SynthParams } from '../types';
import { SYSTEM_INSTRUCTION } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSynthParams = async (
  description: string,
  baseParams?: SynthParams
): Promise<SynthParams> => {
  
  let prompt = `Generate synthesizer parameters for this sound description: "${description}".`;
  
  if (baseParams) {
    prompt += ` Base your design on these existing parameters but modify them to fit the new description: ${JSON.stringify(baseParams)}`;
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
            waveform: { type: Type.STRING },
            frequencyStart: { type: Type.NUMBER },
            frequencyEnd: { type: Type.NUMBER },
            duration: { type: Type.NUMBER },
            attack: { type: Type.NUMBER },
            decay: { type: Type.NUMBER },
            sustain: { type: Type.NUMBER },
            release: { type: Type.NUMBER },
            volume: { type: Type.NUMBER },
            filterType: { type: Type.STRING },
            filterFreq: { type: Type.NUMBER },
            qFactor: { type: Type.NUMBER }
          },
          required: [
            "waveform", "frequencyStart", "frequencyEnd", "duration",
            "attack", "decay", "sustain", "release", "volume",
            "filterType", "filterFreq", "qFactor"
          ]
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text) as SynthParams;
    }
    throw new Error("No response text from Gemini");
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw new Error("Failed to generate sound parameters.");
  }
};
