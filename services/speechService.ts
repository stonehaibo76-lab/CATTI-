import { GoogleGenAI, Modality } from "@google/genai";
import { getAIConfig } from "./geminiService";

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  // 使用 DataView 或确保对齐，但此处遵循文档示例
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const speakText = async (text: string, type: 'word' | 'sentence' = 'word') => {
  // 1. 尝试使用 Gemini TTS (需要 Gemini Key)
  const { geminiKey } = getAIConfig();
  
  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const prompt = type === 'word' 
        ? `Read this word clearly: ${text}` 
        : `Read this sentence naturally: ${text}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }, 
            },
          },
        },
      });

      // 健壮性优化：遍历所有 parts 寻找 inlineData
      let base64Audio: string | undefined;
      const parts = response.candidates?.[0]?.content?.parts;
      
      if (parts) {
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            base64Audio = part.inlineData.data;
            break;
          }
        }
      }

      if (base64Audio) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const audioData = decode(base64Audio);
        const audioBuffer = await decodeAudioData(audioData, audioContext, 24000, 1);
        
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();

        return new Promise((resolve) => {
          source.onended = () => {
            audioContext.close();
            resolve(true);
          };
          setTimeout(() => {
            if (audioContext.state !== 'closed') {
              audioContext.close();
              resolve(false);
            }
          }, 10000);
        });
      }
    } catch (error) {
      console.warn("Gemini TTS failed, attempting browser fallback.", error);
    }
  }

  // 2. 降级方案：使用浏览器原生 Web Speech API
  return new Promise((resolve) => {
    try {
        if (!window.speechSynthesis) {
            console.error("Browser does not support SpeechSynthesis");
            resolve(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        
        // 尝试选择一个好听的英语声音
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha'));
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onend = () => resolve(true);
        utterance.onerror = () => resolve(false);
        
        // 解决 Chrome 的一些 TTS bug，必须在用户交互后调用，但通常在点击事件中是安全的
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    } catch (e) {
        console.error("Browser TTS failed", e);
        resolve(false);
    }
  });
};