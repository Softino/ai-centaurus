
import { GoogleGenAI, Type, Modality, GenerateContentResponse } from "@google/genai";
import { ChatMessage, Agent, SessionReport } from "../types";
import { MODELS } from "../constants";

function decodeBase64(base64: string) {
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

// Simple sleep helper
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export class GeminiService {
  private ai: GoogleGenAI;
  private audioContext: AudioContext | null = null;
  private audioDestination: MediaStreamAudioDestinationNode | null = null;
  private audioQueue: AudioBuffer[] = [];
  public isPlaying = false; // Made public for UI sync
  private nextPlayTime = 0;
  private ttsErrorCount = 0; // Circuit breaker for TTS

  constructor() {
    this.ai = new GoogleGenAI({ 
      apiKey: process.env.API_KEY as string
    });
  }

  public updateConfig(proxyUrl?: string) {
    this.ai = new GoogleGenAI({ 
      apiKey: process.env.API_KEY as string
    });
  }

  public getAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      this.audioDestination = this.audioContext.createMediaStreamDestination();
    }
    return this.audioContext;
  }

  public getAudioStream(): MediaStream | null {
    const ctx = this.getAudioContext();
    return this.audioDestination?.stream || null;
  }
  
  // Helper to check if audio is currently active
  public isAudioActive(): boolean {
      return this.isPlaying || this.audioQueue.length > 0;
  }

  private async withRetry<T>(fn: () => Promise<T>, maxRetries: number = 3): Promise<T> {
    let delay = 1000; // Start with 1 second delay
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        const isRateLimit = error?.message?.includes('429') || error?.status === 429 || error?.message?.includes('quota');
        const isServerOverload = error?.status === 503 || error?.message?.includes('503');
        
        // If we've reached the last retry, break loop to throw error
        if (i === maxRetries - 1) break;

        if (isRateLimit || isServerOverload) {
          console.warn(`API Busy/RateLimit. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
          await sleep(delay);
          delay = Math.min(delay * 2, 10000); // Exponential backoff capped at 10s
          continue;
        }
        throw error; // Throw non-retriable errors immediately
      }
    }
    throw new Error("Max retries exceeded");
  }

  // --- Streaming Logic ---

  async streamAgentResponse(
    agent: Agent,
    history: ChatMessage[],
    topic: string,
    allParticipants: Agent[],
    complexity: number = 3,
    onChunk: (text: string) => void,
    shouldSpeak: boolean = true,
    voiceName: string = 'Kore'
  ): Promise<string> {
    const formattedHistory = history
      .filter(m => m.status === 'approved' || m.status === 'user')
      .map(m => `[ID: ${m.id}] ${m.agentName}: ${m.text}`)
      .join('\n');

    const participantList = allParticipants
      .map(p => `ID: ${p.id}, Name: ${p.name}, Type: ${p.isHuman ? 'HUMAN' : 'AI'}`)
      .join('\n');

    const complexityGuide = [
      "Keep it brief and high-level.",
      "Concise but meaningful point.",
      "Standard professional contribution.",
      "Detailed analysis with specific data points.",
      "Comprehensive strategic deep dive."
    ][complexity - 1];

    const prompt = `
      CONTEXT: You are participating in a formal, high-level strategic think tank round table.
      TOPIC: ${topic}
      
      YOUR PROFILE:
      - Name: "${agent.name}"
      - Role: ${agent.cognitiveRoles.join(', ')}
      - Personality: ${agent.personality || 'Professional, Articulate, Expert'}
      - Core Instruction: ${agent.systemPrompt}
      
      SESSION DYNAMICS:
      - Participants: ${participantList}
      - History: 
      ${formattedHistory}
      
      INSTRUCTION FOR THIS TURN:
      - Level of Detail: ${complexityGuide} (Level ${complexity}/5)
      - Language: PERSIAN (Farsi)
      - Tone: Professional, authoritative, coherent, and organized.
      - Structure: Speak in full sentences. Group your thoughts logically. 
      - AVOID: "As an AI", "I think", markdown lists unless absolutely necessary for data, repetition, disorganization, or stuttering.
      - GOAL: Provide a substantial, valuable contribution that moves the strategic discussion forward. Connect your point to previous speakers if relevant.
      
      OUTPUT: Output ONLY the raw text of your speech. No JSON.
    `;

    let fullText = "";
    let buffer = "";

    try {
      const response = await this.withRetry(() => this.ai.models.generateContentStream({
        model: MODELS.TEXT,
        contents: prompt,
        config: {
          temperature: 0.7,
        }
      }), 4); // Increased retries for text generation

      for await (const chunk of response) {
        const text = chunk.text || "";
        fullText += text;
        buffer += text;
        onChunk(fullText);

        // Simple sentence detection for TTS chunking
        if (shouldSpeak) {
            const sentenceEndRegex = /[.!?؟\n]/;
            const match = buffer.match(sentenceEndRegex);
            if (match && match.index !== undefined) {
                const sentence = buffer.substring(0, match.index + 1);
                buffer = buffer.substring(match.index + 1);
                if (sentence.trim().length > 1) {
                    try {
                      await this.speak(sentence.trim(), voiceName, true); // true = queue mode
                      // Add artificial delay to prevent TTS API flooding (Quota management)
                      // Increased to 500ms to better handle rate limits
                      await sleep(500); 
                    } catch (speakError) {
                      console.warn("TTS skipped for segment due to error.");
                    }
                }
            }
        }
      }

      // Speak remaining buffer
      if (shouldSpeak && buffer.trim().length > 0) {
        try {
           await this.speak(buffer.trim(), voiceName, true);
        } catch (speakError) {
           console.warn("TTS skipped for final segment.");
        }
      }

    } catch (error) {
      console.error("Stream error:", error);
      return "Error generating response.";
    }

    return fullText;
  }

  // --- End Streaming Logic ---

  async generateAgentResponse(
    agent: Agent,
    history: ChatMessage[],
    topic: string,
    allParticipants: Agent[],
    complexity: number = 3
  ): Promise<{ text: string, targetAgentIds: string[], citations: { messageId: string, agentName: string }[] }> {
    return { text: "Use streaming method", targetAgentIds: [], citations: [] };
  }

  async generateLiveReport(history: ChatMessage[], topic: string, sessionId: string): Promise<SessionReport> {
    const prompt = `
      Generate a professional, formal "Minutes of Meeting" report in PERSIAN for the strategic think tank session.
      
      TOPIC: ${topic}
      SESSION ID: ${sessionId}
      
      TRANSCRIPT SUMMARY (Last 15 turns):
      ${history.slice(-15).map(m => `${m.agentName}: ${m.text.substring(0, 100)}...`).join('\n')}
      
      REQUIREMENTS:
      1. Summary: A high-level executive summary of the discussion.
      2. Key Insights: Bullet points of major strategic findings.
      3. Key Takeaways per Agent: Identify the single most critical contribution or stance for EACH participating agent (Name -> Takeaway).
      4. Risk Matrix: Potential threats and their impact level.
      5. Final Decision/Conclusion: The outcome or next step.
      6. Timeline (Minutes): A chronological list of key contributions (Who said what key point).
      
      OUTPUT FORMAT: JSON ONLY.
    `;
    
    try {
      // Reduced retry count for reports to prioritize conversation quota
      const response = await this.withRetry<GenerateContentResponse>(() => this.ai.models.generateContent({
        model: MODELS.TEXT,
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              keyInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
              keyTakeaways: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.OBJECT,
                  properties: {
                    agentName: { type: Type.STRING },
                    takeaway: { type: Type.STRING }
                  }
                } 
              },
              riskMatrix: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.OBJECT,
                  properties: {
                    threat: { type: Type.STRING },
                    impact: { type: Type.STRING }
                  }
                } 
              },
              finalDecision: { type: Type.STRING },
              timeline: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.OBJECT,
                  properties: {
                    agentName: { type: Type.STRING },
                    keyContribution: { type: Type.STRING }
                  }
                } 
              }
            },
            required: ["summary", "keyInsights", "keyTakeaways", "timeline", "finalDecision"]
          }
        }
      }), 2); 
      return { ...JSON.parse(response.text || "{}"), sessionId, topic };
    } catch (e) {
      return { sessionId, topic, summary: "در حال تولید گزارش...", keyInsights: [], keyTakeaways: [], riskMatrix: [], finalDecision: "نامشخص", timeline: [] };
    }
  }

  async playNotification() {
    const ctx = this.getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (this.audioDestination) gain.connect(this.audioDestination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  }

  // Modified speak to support queuing
  async speak(text: string, voiceName: string = 'Kore', queue: boolean = false) {
    if (!text || !text.trim()) return; // Don't call API for empty text

    // Circuit breaker: if we failed 3 times in a row, stop trying for a while
    if (this.ttsErrorCount >= 3) {
      console.warn("TTS suspended due to consecutive errors.");
      return; 
    }

    if (!queue) {
        // Reset queue if not in queue mode
        this.audioQueue = [];
        this.isPlaying = false;
    }

    try {
      const ctx = this.getAudioContext();
      if (ctx.state === 'suspended') await ctx.resume();
      
      const response = await this.withRetry<GenerateContentResponse>(() => this.ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
        },
      }), 5); // Increased max retries for TTS to 5 to handle rate limits better

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        this.ttsErrorCount = 0; // Reset error count on success
        const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), ctx, 24000, 1);
        
        if (queue) {
            this.audioQueue.push(audioBuffer);
            this.processAudioQueue();
        } else {
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            if (this.audioDestination) source.connect(this.audioDestination);
            source.start();
        }
      }
    } catch (e) { 
      this.ttsErrorCount++; // Increment error count
      // Log warning instead of error to avoid alarming the user for transient failures
      console.warn("TTS generation failed (Max retries exceeded or other error). Skipping segment.");
    }
  }

  private processAudioQueue() {
      if (this.isPlaying || this.audioQueue.length === 0) return;
      
      this.isPlaying = true;
      const ctx = this.getAudioContext();
      const buffer = this.audioQueue.shift();
      
      if (!buffer) {
          this.isPlaying = false;
          return;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      if (this.audioDestination) source.connect(this.audioDestination);
      
      // Calculate start time to ensure smooth concatenation
      const startTime = Math.max(ctx.currentTime, this.nextPlayTime);
      source.start(startTime);
      this.nextPlayTime = startTime + buffer.duration;

      source.onended = () => {
          // If queue is empty, reset flag, but nextPlayTime logic handles gaps
          if (this.audioQueue.length === 0) {
              this.isPlaying = false;
              // Reset nextPlayTime if silence is too long to prevent drift
              if (ctx.currentTime > this.nextPlayTime + 0.5) {
                  this.nextPlayTime = ctx.currentTime;
              }
          } else {
              // Trigger next immediately (though start time handles syncing)
              this.processAudioQueue(); 
          }
      };
      
      if (this.audioQueue.length > 0) {
           this.processAudioQueue();
      }
  }
}

export const geminiService = new GeminiService();
