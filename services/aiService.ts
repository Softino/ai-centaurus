
import { OpenRouter } from "@openrouter/sdk";
import { ChatMessage, Agent, SessionReport } from "../types";
import { MODELS } from "../constants";

// Helper to decode Base64
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Simple sleep helper
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// Logger helper
const log = (context: string, message: any, data?: any) => {
  console.log(`[AIService] [${context}]`, message, data ? JSON.stringify(data, (key, value) => {
    // Mask API keys in logs
    if (key.toLowerCase().includes('key') || key.toLowerCase().includes('auth')) return '***MASKED***';
    return value;
  }, 2) : '');
};

const logError = (context: string, error: any) => {
  console.error(`[AIService] [${context}] ERROR:`, error);
  if (error && error.response) {
    error.response.json().then((json: any) => {
      console.error(`[AIService] [${context}] Response Body:`, json);
    }).catch(() => { });
  }
};

export class AIService {
  private client: OpenRouter;
  private audioContext: AudioContext | null = null;
  private audioDestination: MediaStreamAudioDestinationNode | null = null;
  private audioQueue: AudioBuffer[] = [];
  public isPlaying = false;
  private nextPlayTime = 0;
  private apiKey: string = "";
  private speakChain: Promise<void> = Promise.resolve();

  constructor() {
    // Vite uses import.meta.env
    const envKey = import.meta.env.VITE_API_KEY;
    this.apiKey = (envKey || "") as string;

    log('Init', `Service initialized. API Key present? ${!!this.apiKey}`, {
      keyLength: this.apiKey ? this.apiKey.length : 0
    });

    this.client = new OpenRouter({
      apiKey: this.apiKey,
      // If no key is found, do not throw immediately, allow updateConfig later
    });
  }

  public updateConfig(proxyUrl?: string) {
    if (proxyUrl && proxyUrl.startsWith('sk-or-')) {
      log('UpdateConfig', 'Updating API Key');
      this.apiKey = proxyUrl;
      this.client = new OpenRouter({ apiKey: this.apiKey });
    }
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

  public isFetchingAudio = false;

  public isAudioActive(): boolean {
    return this.isPlaying || this.audioQueue.length > 0 || this.isFetchingAudio;
  }

  public getPendingAudioCount(): number {
    // If we are fetching, count it as 1 pending item so the UI waits
    return this.audioQueue.length + (this.isFetchingAudio ? 1 : 0);
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
    voiceName: string = 'alloy'
  ): Promise<string> {
    const formattedHistory = history
      .filter(m => m.status === 'approved' || m.status === 'user')
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: `[${m.agentName}]: ${m.text}`
      }));

    const participantList = allParticipants
      .map(p => `ID: ${p.id}, Name: ${p.name}`)
      .join(', ');

    const systemPrompt = `
      You are participating in a strategic round table.
      TOPIC: ${topic}
      ROLE: ${agent.name}
      CONTEXT: ${agent.systemPrompt}
      PARTICIPANTS: ${participantList}
      
      INSTRUCTIONS:
      - Reply in PERSIAN (Farsi).
      - Be professional and concise.
      - Output plain text only.
    `;

    log('streamAgentResponse', 'Starting stream request', { agent: agent.name, model: MODELS.TEXT });

    let fullText = "";

    try {
      const completion = await this.client.chat.send({
        model: MODELS.TEXT,
        messages: [
          { role: 'system', content: systemPrompt },
          ...formattedHistory as any
        ],
        stream: true
      });

      if (completion) {
        for await (const chunk of completion) {
          const text = chunk.choices[0]?.delta?.content || "";
          if (text) {
            fullText += text;
            onChunk(fullText);
          }
        }
      }

      log('streamAgentResponse', 'Text generation complete', { length: fullText.length });

      // Moderator Command Parsing
      // Helper to expose extraction to caller via special return if needed, 
      // but here we just return the full text. The UI must parse it or we attach metadata?
      // Since return type is Promise<string>, we can't return metadata easily without breaking interface.
      // We will handle parsing in the UI component (RoundTable.tsx) using the returned string.

      // Only generate audio once the full text is available
      if (shouldSpeak && fullText.trim().length > 0) {
        log('streamAgentResponse', 'Requesting full audio generation');
        // We await the speakChain to ensure it's queued, 
        // but note: speak() resolves when REQUEST is done, not when playback is done.
        // The RoundTable component handles "isAudioActive" checks to wait for playback.
        await this.speak(fullText.trim(), voiceName, true);
      }

    } catch (error) {
      logError('streamAgentResponse', error);
      return "Error generating response.";
    }

    return fullText;
  }

  // --- TTS Logic ---

  async speak(text: string, voiceName: string = 'alloy', queue: boolean = false) {
    if (!text || text.trim().length < 2) return; // Skip very short text (punctuation only)

    if (!queue) {
      this.cancelAudio();
    }

    // Chain the speak request to ensure sequential processing (FIFO)
    // This prevents out-of-order playback and API rate limiting issues
    this.speakChain = this.speakChain.then(async () => {
      this.isFetchingAudio = true;
      log('speak', 'Processing audio task', { length: text.length, voice: voiceName });

      try {
        const ctx = this.getAudioContext();
        if (ctx.state === 'suspended') await ctx.resume();

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: MODELS.AUDIO,
            modalities: ["text", "audio"],
            audio: { voice: voiceName, format: "pcm16" },
            messages: [{ role: "user", content: text }],
            stream: true
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`OpenRouter TTS API Error: ${response.status} ${response.statusText} - ${errText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        let audioDataParts: string[] = [];
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Decode with stream true to handle multi-byte characters split across chunks (though unlikely for base64)
          // More importantly, we just buffer the text to handle JSON split across chunks
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          const lines = buffer.split('\n');
          // Important: valid SSE messages always end with \n.
          // If the last item in split is not empty string, it means we have a partial line at the end.
          // We must save it for the next chunk.
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
              try {
                // Remove 'data: ' prefix
                const jsonStr = trimmed.slice(6);
                const json = JSON.parse(jsonStr);
                if (json.choices && json.choices[0]?.delta?.audio?.data) {
                  audioDataParts.push(json.choices[0].delta.audio.data);
                }
              } catch (e) {
                // It is normal to fail if we somehow got a bad chunk, but with buffering this should be rare.
                // console.warn('JSON Parse error on line:', trimmed);
              }
            }
          }
        }

        // flush anything remaining (though SSE usually ends with newline)
        if (buffer.trim()) {
          const trimmed = buffer.trim();
          if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
            try {
              const json = JSON.parse(trimmed.slice(6));
              if (json.choices && json.choices[0]?.delta?.audio?.data) {
                audioDataParts.push(json.choices[0].delta.audio.data);
              }
            } catch (e) { }
          }
        }

        if (audioDataParts.length > 0) {
          const fullBase64 = audioDataParts.join('');
          const rawBytes = decodeBase64(fullBase64);

          // Decode PCM16
          // Check alignment
          if (rawBytes.length % 2 !== 0) {
            console.warn("Audio bytes length is odd, truncating last byte.");
          }
          const int16View = new Int16Array(rawBytes.buffer, 0, Math.floor(rawBytes.length / 2));
          const float32Data = new Float32Array(int16View.length);
          for (let i = 0; i < int16View.length; i++) {
            float32Data[i] = int16View[i] / 32768.0;
          }

          // 24kHz is standard for this model
          const audioBuffer = ctx.createBuffer(1, float32Data.length, 24000);
          audioBuffer.getChannelData(0).set(float32Data);

          // Queue logic
          this.audioQueue.push(audioBuffer);
          this.processAudioQueue();

          log('speak', 'Audio task completed & queued', { totalSamples: float32Data.length, duration: float32Data.length / 24000 });
        } else {
          log('speak', 'No audio content in stream');
        }

      } catch (e) {
        logError('speak', e);
      } finally {
        this.isFetchingAudio = false;
      }
    }); // End of chain

    return this.speakChain;
  }

  public cancelAudio() {
    this.audioQueue = [];
    this.isPlaying = false;
    this.nextPlayTime = 0;
    // Note: We can't easily cancel the running Fetch promise in the chain, 
    // but clearing the queue stops future playback.
    const ctx = this.getAudioContext();
    if (ctx) {
      // Reset time if possible or just let it play out? 
      this.nextPlayTime = ctx.currentTime;
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

    // Ensure we don't schedule in the past
    // If nextPlayTime is far behind (e.g. paused/lagged), reset it to now
    if (this.nextPlayTime < ctx.currentTime) {
      this.nextPlayTime = ctx.currentTime;
    }

    source.start(this.nextPlayTime);

    // Update next start time
    this.nextPlayTime += buffer.duration;

    source.onended = () => {
      // Small buffer gap to prevent clicking? Not needed if contiguous logic is good.
      this.isPlaying = false;
      if (this.audioQueue.length > 0) {
        this.processAudioQueue();
      }
    };
  }

  async generateLiveReport(history: ChatMessage[], topic: string, sessionId: string): Promise<SessionReport> {
    const prompt = `
      Generate a professional "Minutes of Meeting" report in PERSIAN (Farsi).
      TOPIC: ${topic}
      SESSION ID: ${sessionId}
      
      TRANSCRIPT (Last 15 turns):
      ${history.slice(-15).map(m => `${m.agentName}: ${m.text.substring(0, 100)}...`).join('\n')}
      
      REQUIREMENTS (JSON ONLY):
      {
        "summary": "Executive summary...",
        "keyInsights": ["Point 1", "Point 2"],
        "keyTakeaways": [{"agentName": "Name", "takeaway": "Main point"}],
        "riskMatrix": [{"threat": "Threat name", "impact": "High/Medium/Low"}],
        "finalDecision": "Conclusion...",
        "timeline": [{"agentName": "Name", "keyContribution": "Contribution..."}]
      }
    `;

    log('generateLiveReport', 'Generating report for session ' + sessionId);

    try {
      const completion = await this.client.chat.send({
        model: MODELS.TEXT,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });

      const text = completion.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(text);

      log('generateLiveReport', 'Report generated successfully');

      return {
        sessionId,
        topic,
        summary: parsed.summary || "No summary available",
        keyInsights: parsed.keyInsights || [],
        keyTakeaways: parsed.keyTakeaways || [],
        riskMatrix: parsed.riskMatrix || [],
        finalDecision: parsed.finalDecision || "Pending discussion",
        timeline: parsed.timeline || []
      };
    } catch (e) {
      logError('generateLiveReport', e);
      return {
        sessionId,
        topic,
        summary: "Error generating report.",
        keyInsights: [],
        keyTakeaways: [],
        riskMatrix: [],
        finalDecision: "Report generation error",
        timeline: []
      };
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
}

export const geminiService = new AIService();
export const aiService = geminiService;
