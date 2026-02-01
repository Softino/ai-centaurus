
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Agent, ChatMessage, RoundTableSession, Expert, ExpertInvitation } from '../types';
import { geminiService } from '../services/aiService';
import { CentaurIcon } from './Sidebar';

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

interface RoundTableProps {
  ownedAgents: Agent[];
  allExperts: Expert[];
  sentInvitations: ExpertInvitation[];
  onUpdateSession: (session: RoundTableSession) => void;
  currentSessions: RoundTableSession[];
  onCompleteSession: (session: RoundTableSession) => void;
}

const VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer', 'coral', 'verse', 'ballad', 'ash', 'sage', 'marin', 'cedar'];
const HUMAN_ICONS = [
  'fa-user-astronaut',
  'fa-user-shield',
  'fa-user-graduate',
  'fa-user-ninja',
  'fa-user-tie',
  'fa-user-doctor',
  'fa-user-secret',
  'fa-user-gear'
];

interface HumanEntry {
  id: string;
  name: string;
  icon: string;
}

const RoundTable: React.FC<RoundTableProps> = ({ ownedAgents, allExperts, sentInvitations, onUpdateSession, currentSessions, onCompleteSession }) => {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [selectedExpertIds, setSelectedExpertIds] = useState<string[]>([]);
  const [architects, setArchitects] = useState<HumanEntry[]>([{ id: 'h-1', name: 'معمار سیستم', icon: 'fa-user-astronaut' }]);

  // Voice selection state
  const [agentVoices, setAgentVoices] = useState<Record<string, string>>({});

  const [isGenerating, setIsGenerating] = useState(false);
  const [thinkingAgentId, setThinkingAgentId] = useState<string | null>(null); // New state for thinking mode
  const [isWaitingForQuota, setIsWaitingForQuota] = useState(false);
  const [humanInput, setHumanInput] = useState('');
  const [targetAgentIds, setTargetAgentIds] = useState<string[]>([]);
  const [isHumanPanelOpen, setIsHumanPanelOpen] = useState(false);

  // New state for forcing human priority
  const [humanInterjectionPending, setHumanInterjectionPending] = useState(false);

  const [rotateX, setRotateX] = useState(15);
  const [rotateY, setRotateY] = useState(0);
  const [rotateZ, setRotateZ] = useState(0);
  const [zoom, setZoom] = useState(1);

  const [streamingContent, setStreamingContent] = useState<{ agentId: string, text: string } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [sessionMode, setSessionMode] = useState<'text' | 'voice'>('voice');
  const [sessionDuration, setSessionDuration] = useState(600);
  const [complexity, setComplexity] = useState<1 | 2 | 3 | 4 | 5>(3);

  const transcriptRef = useRef<HTMLDivElement>(null);
  const session = currentSessions.find(s => s.id === activeSessionId) || null;
  const currentTurnAgent = session?.participants[session.currentTurnIndex];
  const activeSpeakerId = session?.isRunning ? currentTurnAgent?.id : null;

  // Calculate Contribution Stats
  const contributionStats = useMemo(() => {
    if (!session) return { total: 0, byAgent: {} as Record<string, number> };
    const counts: Record<string, number> = {};
    let total = 0;
    session.messages.forEach(m => {
      // Estimate word count for rough contribution metric
      const words = m.text.trim().split(/\s+/).length;
      counts[m.agentId] = (counts[m.agentId] || 0) + words;
      total += words;
    });
    return { total, byAgent: counts };
  }, [session?.messages]);

  // Suggested Duration Logic
  const suggestedDuration = useMemo(() => {
    const participantCount = selectedAgentIds.length + architects.length + selectedExpertIds.length;
    // Base 60s per participant * complexity multiplier
    const suggested = Math.max(300, participantCount * 60 * (complexity / 2));
    return Math.round(suggested);
  }, [selectedAgentIds.length, architects.length, selectedExpertIds.length, complexity]);

  // Filter experts based on sent invitations as requested
  const invitedExperts = useMemo(() => {
    const invitedIds = new Set(sentInvitations.map(inv => inv.expertId));
    return allExperts.filter(e => invitedIds.has(e.id));
  }, [allExperts, sentInvitations]);

  useEffect(() => {
    if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
  }, [session?.messages, streamingContent]);

  const startRecording = () => {
    const stream = geminiService.getAudioStream();
    if (!stream) {
      console.warn("No audio stream found for recording.");
      return;
    }
    audioChunksRef.current = [];

    // We attempt to record the system output mixed with user input if possible.
    // For this context, we'll record the destination stream from our service.
    const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      if (activeSessionId) {
        // Find the most current session state
        const s = currentSessions.find(x => x.id === activeSessionId);
        if (s) {
          onUpdateSession({ ...s, audioRecordingUrl: url });
        }
      }
    };
    recorder.start();
    mediaRecorderRef.current = recorder;
  };

  const stopRecordingAndComplete = (s: RoundTableSession) => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    onCompleteSession({ ...s, status: 'completed', isRunning: false });
    setActiveSessionId(null);
  };

  useEffect(() => {
    let interval: any;
    if (session?.isRunning && session.timeRemaining > 0) {
      interval = setInterval(async () => {
        const newVal = session.timeRemaining - 1;
        let updatedReport = session.liveReport;

        // Decreased report generation frequency to every 120s to save quota
        if (newVal > 0 && newVal % 120 === 0 && session.messages.length > 2) {
          try {
            updatedReport = await geminiService.generateLiveReport(session.messages, session.topic, session.id);
          } catch (e) { }
        }
        onUpdateSession({ ...session, timeRemaining: newVal, liveReport: updatedReport });
        if (newVal <= 0) {
          stopRecordingAndComplete(session);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [session?.isRunning, session?.timeRemaining, activeSessionId]);

  // Turn Management Loop
  useEffect(() => {
    let turnTimer: any;

    const checkAndTriggerTurn = async () => {
      // Basic conditions checks
      if (!session) return;

      // If paused or finished, stop everything
      if (!session.isRunning || session.timeRemaining <= 0) {
        if (geminiService.isAudioActive()) {
          geminiService.cancelAudio();
        }
        return;
      }

      // If generating or thinking, just wait
      if (isGenerating || thinkingAgentId) return;

      // Fast-track human interjection
      if (humanInterjectionPending) {
        nextAgentTurn();
        return;
      }

      const lastMsg = session.messages[session.messages.length - 1];

      // CRITICAL FIX: Prevent Double-Triggering on Stale Index
      // If the last message was JUST approved and it belongs to the CURRENT agent, 
      // it means we finished the turn but the 'currentTurnIndex' prop hasn't updated yet.
      // We must WAIT for the prop to update (advancing the index) before triggering again.
      if (lastMsg && lastMsg.status === 'approved' && lastMsg.agentId === currentTurnAgent?.id) {
        // console.log("Backoff: Waiting for turn index to advance...");
        return;
      }

      // If text generation is finished (or no messages yet), proceed.
      if (!lastMsg || lastMsg.status === 'approved' || lastMsg.status === 'user') {

        // Audio Sync Check: 
        // Allow pre-fetching of the *next* turn while the current one plays.
        // We only wait if there is already PENDING audio waiting in the queue (backlog).
        // If queue is empty (0), it means either silence or only the current item is playing.
        // We can safely trigger the next generation which will take a few seconds anyway.
        if (session.mode === 'voice' && geminiService.getPendingAudioCount() > 0) {
          return; // Wait for queue to drain
        }

        if (currentTurnAgent?.isHuman) {
          if (!isHumanPanelOpen) {
            geminiService.playNotification();
            setIsHumanPanelOpen(true);
            onUpdateSession({ ...session, isRunning: false });
          }
        } else {
          // Proceed to next agent
          nextAgentTurn();
        }
      }
    };

    // Run the check every 1 second
    if (session?.isRunning) {
      turnTimer = setInterval(checkAndTriggerTurn, 1000);
    }

    return () => clearInterval(turnTimer);
  }, [session?.isRunning, session?.messages, session?.currentTurnIndex, isGenerating, humanInterjectionPending, session?.mode, thinkingAgentId]);

  const agentPositions = useMemo(() => {
    if (!session) return {};
    const positions: Record<string, { x: number, y: number }> = {};
    const radius = 38; // Slightly larger radius

    // Identify Moderator (Center Agent)
    // Priority: Agent with ID 'mod_1' OR Agent with role 'Moderator' OR first agent
    const moderator = session.participants.find(p => p.id === 'mod_1') ||
      session.participants.find(p => p.cognitiveRoles.includes('Moderator'));

    if (moderator) {
      positions[moderator.id] = { x: 50, y: 50 };

      // Distribute others
      const others = session.participants.filter(p => p.id !== moderator.id);
      others.forEach((agent, index) => {
        const angle = (index / others.length) * 2 * Math.PI;
        positions[agent.id] = { x: 50 + radius * Math.cos(angle), y: 50 + radius * Math.sin(angle) };
      });
    } else {
      // Fallback: No specific moderator found, circle everyone
      session.participants.forEach((agent, index) => {
        const angle = (index / session.participants.length) * 2 * Math.PI;
        positions[agent.id] = { x: 50 + radius * Math.cos(angle), y: 50 + radius * Math.sin(angle) };
      });
    }

    return positions;
  }, [session?.participants]);

  const startSession = () => {
    if (!topic || (selectedAgentIds.length === 0 && architects.length === 0 && selectedExpertIds.length === 0)) return;

    // 1. Architects
    const architectParticipants: Agent[] = architects.map(h => ({
      id: h.id,
      name: h.name,
      version: "Live",
      creator: "Self",
      maturity: "Certified",
      costPolicy: "رایگان",
      cognitiveRoles: ["Decision Support"],
      domains: [{ level1: "Governance" }],
      problemTypes: ["Decision Support"],
      methodology: "Hybrid",
      inputs: ["Text"],
      outputs: ["Insight"],
      perspectives: ["Ethical"],
      timeHorizon: "Mid-term",
      multiAgent: { canCooperate: true, typicalCollaborators: [], requiresSupervisor: false, conflictProneWith: [] },
      description: "معمار ناظر نشست",
      systemPrompt: "Manual override architect",
      icon: h.icon,
      isCustom: false,
      isHuman: true,
      category: 'agnostic'
    }));

    // 2. Experts
    const selectedExperts = allExperts.filter(e => selectedExpertIds.includes(e.id));
    const expertParticipants: Agent[] = selectedExperts.map(e => ({
      id: e.id,
      name: e.name,
      version: "Expert",
      creator: "Network",
      maturity: "Certified",
      costPolicy: "Direct",
      cognitiveRoles: ["Analyst"],
      domains: [{ level1: e.domain }],
      problemTypes: ["Domain Analysis"],
      methodology: "Hybrid",
      inputs: ["Text"],
      outputs: ["Strategy"],
      perspectives: ["Specialized"],
      timeHorizon: "Mid-term",
      multiAgent: { canCooperate: true, typicalCollaborators: [], requiresSupervisor: false, conflictProneWith: [] },
      description: e.bio,
      systemPrompt: "Immediate human expert intervention.",
      icon: e.icon,
      isCustom: false,
      isHuman: true,
      isExpert: true,
      category: e.category
    }));

    // 3. AI Agents
    const aiParticipants = ownedAgents.filter(a => selectedAgentIds.includes(a.id));

    const participants = [...architectParticipants, ...expertParticipants, ...aiParticipants];

    // --- Distinct Voice Assignment Logic ---
    const newVoices = { ...agentVoices };
    // Filter out participants that need voice assignment (AI agents)
    const aiAgents = participants.filter(p => !p.isHuman);

    // Assign voices round-robin from the VOICES list
    aiAgents.forEach((p, index) => {
      if (!newVoices[p.id]) {
        newVoices[p.id] = VOICES[index % VOICES.length];
      }
    });
    setAgentVoices(newVoices);
    // ---------------------------------------

    const newSession: RoundTableSession = {
      id: `session-${Date.now()}`,
      topic,
      participants,
      messages: [],
      status: 'active',
      currentTurnIndex: 0,
      currentRound: 1,
      maxRounds: 100,
      raisedHands: [],
      isRunning: true,
      mode: sessionMode,
      complexity: complexity,
      timeRemaining: sessionDuration
    };
    onUpdateSession(newSession);
    setActiveSessionId(newSession.id);

    // Start recording after a short delay for stream initialization
    setTimeout(() => startRecording(), 1000);
  };

  const processingTurnRef = useRef(false);
  const sessionRef = useRef(session);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);


  const nextAgentTurn = async () => {
    // 1. Strict Locking to prevent duplicate/concurrent turns
    if (processingTurnRef.current) return;

    // 2. Stale Closure Prevention: Use Ref to check LATEST state
    const currentSession = sessionRef.current;
    if (!currentSession || !currentSession.isRunning || isGenerating) return;

    processingTurnRef.current = true;
    setHumanInterjectionPending(false);
    setIsGenerating(true);
    setIsWaitingForQuota(false);

    try {
      const agentIndex = currentSession.currentTurnIndex;
      const agent = currentSession.participants[agentIndex];

      // --- THINKING MODE SIMULATION ---
      setThinkingAgentId(agent.id);
      const thinkingDelay = Math.random() * 2000 + 1000;
      await new Promise(r => setTimeout(r, thinkingDelay));
      setThinkingAgentId(null);

      // Re-check state after delay (User might have paused)
      if (!sessionRef.current?.isRunning) {
        return; // Abort if paused during thinking
      }
      // --------------------------------

      // Start Ghost Bubble (Local State)
      setStreamingContent({ agentId: agent.id, text: "..." });

      // Determine voice 
      const selectedVoice = agentVoices[agent.id] || VOICES[agentIndex % VOICES.length];

      // STREAMING
      const fullText = await geminiService.streamAgentResponse(
        agent,
        sessionRef.current.messages,
        sessionRef.current.topic,
        sessionRef.current.participants,
        sessionRef.current.complexity,
        (chunkText) => {
          // Update LOCAL state only - No Race Condition !!
          setStreamingContent({ agentId: agent.id, text: chunkText });
        },
        sessionRef.current.mode === 'voice',
        selectedVoice
      );

      // Clear Ghost Bubble
      setStreamingContent(null);

      // Re-check state after generation
      if (!sessionRef.current?.isRunning) {
        // Pause pressed during generation? 
        // Commit the message but DON'T advance turn
        if (sessionRef.current) {
          const newMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            agentId: agent.id,
            agentName: agent.name,
            text: fullText,
            timestamp: Date.now(),
            status: 'approved',
            role: 'assistant',
            targetAgentIds: [],
            citations: []
          };

          onUpdateSession({
            ...sessionRef.current,
            messages: [...sessionRef.current.messages, newMessage],
          });
        }
        return;
      }

      // MODERATOR STRATEGY LOGIC
      // Check if current agent is Moderator/Chairman
      const isModerator = agent.cognitiveRoles.includes("Moderator") || agent.id === 'mod_1' || agent.id === 'h-1';
      let nextIndex = (sessionRef.current.currentTurnIndex + 1) % sessionRef.current.participants.length;

      if (isModerator) {
        // Simple parsing logic: Look for "Next: [Name]" or "Calls: [Name]" or just mentions
        // Valid patterns: "@AgentName", "AgentName", "[AgentName]"
        // We iterate participants to see if any is mentioned in the last sentence.
        const lastSentence = fullText.split(/[.!?؟\n]+/).pop() || fullText;

        const mentionedParticipant = sessionRef.current.participants.find(p => {
          if (p.id === agent.id) return false;
          return lastSentence.includes(p.name) || (p.isHuman && lastSentence.includes("Human")) || fullText.includes(`[${p.name}]`);
        });

        if (mentionedParticipant) {
          const foundIndex = sessionRef.current.participants.findIndex(p => p.id === mentionedParticipant.id);
          if (foundIndex !== -1) {
            console.log(`Moderator called ${mentionedParticipant.name}, jumping to index ${foundIndex}`);
            nextIndex = foundIndex;
          }
        }
      }

      // COMMIT MESSAGE & ADVANCE TURN ATOMICALLY
      const newMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        agentId: agent.id,
        agentName: agent.name,
        text: fullText,
        timestamp: Date.now(),
        status: 'approved',
        role: 'assistant',
        targetAgentIds: [],
        citations: []
      };

      onUpdateSession({
        ...sessionRef.current,
        messages: [...sessionRef.current.messages, newMessage],
        currentTurnIndex: nextIndex,
        currentRound: nextIndex === 0 ? sessionRef.current.currentRound + 1 : sessionRef.current.currentRound
      });

    } catch (error: any) {
      console.error("Agent Turn Error", error);
      if (error?.message?.includes('429') || error?.message?.includes('quota')) {
        setIsWaitingForQuota(true);
      }
      setStreamingContent(null);
    } finally {
      setIsGenerating(false);
      processingTurnRef.current = false;
    }
  };

  const submitHumanMessage = (approved: boolean, isInterjection: boolean = false) => {
    if (!session || !humanInput.trim()) return;

    // Stop any current generation logic (though we can't easily cancel the API promise, we ignore it via state)
    setIsGenerating(false);
    setHumanInterjectionPending(true); // Flag to prioritize this flow

    const humanAgent = session.participants.find(p => p.isHuman && p.id === currentTurnAgent?.id) || session.participants.find(p => p.isHuman) || session.participants[0];

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      agentId: humanAgent.id,
      agentName: humanAgent.name,
      text: humanInput,
      timestamp: Date.now(),
      status: approved ? 'approved' : 'rejected',
      role: 'user',
      targetAgentIds,
      isInterjection
    };

    let nextIndex = (session.currentTurnIndex + 1) % session.participants.length;

    if (targetAgentIds.length > 0) {
      const targetIndex = session.participants.findIndex(p => p.id === targetAgentIds[0]);
      if (targetIndex !== -1) {
        nextIndex = targetIndex;
      }
    }

    onUpdateSession({
      ...session,
      messages: [...session.messages, newMessage],
      currentTurnIndex: nextIndex,
      isRunning: true
    });

    setHumanInput('');
    setTargetAgentIds([]);
    setIsHumanPanelOpen(false);
  };

  const toggleMode = () => {
    if (!session) return;
    const newMode = session.mode === 'voice' ? 'text' : 'voice';
    onUpdateSession({ ...session, mode: newMode });
  };

  const handleAgentSelection = (agentId: string) => {
    setSelectedAgentIds(prev => prev.includes(agentId) ? prev.filter(id => id !== agentId) : [...prev, agentId]);
    // Assign a random voice initially if not set (UI selection fallback)
    if (!agentVoices[agentId]) {
      const randomVoice = VOICES[Math.floor(Math.random() * VOICES.length)];
      setAgentVoices(prev => ({ ...prev, [agentId]: randomVoice }));
    }
  };

  if (!session) {
    return (
      <div className="p-12 max-w-7xl mx-auto text-right space-y-12">
        <header className="mb-12 text-center animate-in fade-in duration-1000">
          <div className="w-24 h-24 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white shadow-[0_0_50px_rgba(37,99,235,0.4)] mx-auto mb-8 border border-blue-400/30">
            <CentaurIcon className="w-14 h-14" />
          </div>
          <h2 className="text-6xl font-black mb-6 bg-gradient-to-r from-blue-400 to-indigo-600 bg-clip-text text-transparent">آغاز نشست استراتژیک قنطورس</h2>
          <p className="text-slate-500 font-bold max-w-2xl mx-auto">ترکیب خرد انسانی و هوش مصنوعی برای حل پیچیده‌ترین مسائل راهبردی.</p>
        </header>

        <div className="dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-[3.5rem] p-12 space-y-12 shadow-2xl relative transition-colors duration-300">
          <div className="space-y-4">
            <label className="text-[10px] font-black dark:text-slate-500 text-slate-400 uppercase tracking-widest mr-4">عنوان یا صورت مسئله نشست</label>
            <textarea
              rows={2}
              placeholder="موضوع استراتژیک نشست..."
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="w-full dark:bg-slate-950 bg-slate-50 border dark:border-slate-800 border-slate-200 rounded-[2.5rem] px-10 py-8 text-2xl focus:ring-4 focus:ring-blue-500/20 text-right dark:text-white text-slate-900 outline-none transition-all placeholder:text-slate-400 font-black shadow-inner"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Column 1: Human Resources (Architects & Experts) */}
            <div className="space-y-8">
              <div className="dark:bg-slate-950/40 bg-slate-50 p-8 rounded-[2.5rem] border dark:border-slate-800 border-slate-200 transition-colors">
                <div className="flex justify-between items-center mb-6">
                  <button onClick={() => setArchitects(prev => [...prev, { id: `h-${Date.now()}`, name: '', icon: HUMAN_ICONS[0] }])} className="px-4 py-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[10px] font-black rounded-xl hover:bg-blue-600/20 transition-all">+ افزودن معمار جدید</button>
                  <label className="text-[10px] font-black dark:text-slate-500 text-slate-400 uppercase tracking-widest">تخصیص ظرفیت انسانی (Architects)</label>
                </div>
                <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar p-2">
                  {architects.map(h => (
                    <div key={h.id} className="flex items-center gap-4 dark:bg-slate-900 bg-white p-4 rounded-2xl border dark:border-slate-800 border-slate-200 animate-in slide-in-from-right-4 shadow-sm transition-colors">
                      <button onClick={() => architects.length > 1 && setArchitects(prev => prev.filter(item => item.id !== h.id))} className="w-10 h-10 rounded-xl bg-red-950/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"><i className="fas fa-trash"></i></button>
                      <input value={h.name} onChange={e => setArchitects(prev => prev.map(item => item.id === h.id ? { ...item, name: e.target.value } : item))} className="flex-1 dark:bg-slate-950 bg-slate-50 border dark:border-slate-800 border-slate-200 rounded-xl px-4 py-2 text-xs text-right dark:text-white text-slate-900 outline-none focus:border-blue-500 font-bold" placeholder="نام معمار..." />
                      <div className="w-10 h-10 rounded-xl dark:bg-slate-950 bg-slate-50 border dark:border-slate-800 border-slate-200 flex items-center justify-center text-blue-500 shadow-inner">
                        <i className={`fas ${h.icon}`}></i>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="dark:bg-slate-950/40 bg-slate-50 p-8 rounded-[2.5rem] border dark:border-slate-800 border-slate-200 transition-colors">
                <label className="text-[10px] font-black dark:text-slate-500 text-slate-400 uppercase tracking-widest block mb-6 text-center">تخصیص ظرفیت انسانی (Experts Invited)</label>
                <div className="grid grid-cols-2 gap-4 max-h-60 overflow-y-auto custom-scrollbar p-2">
                  {invitedExperts.map(expert => (
                    <button
                      key={expert.id}
                      onClick={() => setSelectedExpertIds(prev => prev.includes(expert.id) ? prev.filter(id => id !== expert.id) : [...prev, expert.id])}
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${selectedExpertIds.includes(expert.id) ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-900/10' : 'dark:bg-slate-900 bg-white dark:border-slate-800 border-slate-200'}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${selectedExpertIds.includes(expert.id) ? 'bg-emerald-600 text-white' : 'dark:bg-slate-800 bg-slate-100 dark:text-slate-500 text-slate-400'}`}>
                        <i className={`fas ${expert.icon}`}></i>
                      </div>
                      <div className="text-right flex-1 overflow-hidden">
                        <p className={`text-[10px] font-black truncate ${selectedExpertIds.includes(expert.id) ? 'text-emerald-400' : 'dark:text-white text-slate-900'}`}>{expert.name}</p>
                        <p className="text-[8px] dark:text-slate-600 text-slate-400 font-bold truncate">{expert.domain}</p>
                      </div>
                    </button>
                  ))}
                  {invitedExperts.length === 0 && (
                    <div className="col-span-2 py-10 text-center opacity-30 text-[10px] font-black leading-relaxed">
                      <i className="fas fa-paper-plane mb-3 block text-2xl animate-bounce"></i>
                      هنوز دعوتی برای خبرگان ارسال نشده است.<br />از بخش شبکه خبرگان اقدام کنید.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Column 2: AI Agents & Session Config */}
            <div className="space-y-8">
              <div className="dark:bg-slate-950/40 bg-slate-50 p-8 rounded-[2.5rem] border dark:border-slate-800 border-slate-200 transition-colors">
                <label className="text-[10px] font-black dark:text-slate-500 text-slate-400 uppercase tracking-widest block mb-6 text-center">انتخاب لایه‌های شناختی (AI Agents)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-60 overflow-y-auto custom-scrollbar p-2">
                  {ownedAgents.filter(a => !a.isHuman).map(agent => (
                    <div key={agent.id} className="relative group">
                      <button
                        onClick={() => handleAgentSelection(agent.id)}
                        className={`w-full flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${selectedAgentIds.includes(agent.id) ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-900/10' : 'dark:bg-slate-900 bg-white dark:border-slate-800 border-slate-200'}`}
                      >
                        <div className={`w-10 h-10 rounded-xl mb-2 flex items-center justify-center text-xl transition-all shadow-xl ${selectedAgentIds.includes(agent.id) ? 'bg-blue-600 text-white shadow-blue-500/20' : 'dark:bg-slate-800 bg-slate-100 dark:text-slate-500 text-slate-400'}`}><i className={`fas ${agent.icon}`}></i></div>
                        <span className={`text-[10px] font-black text-center line-clamp-1 ${selectedAgentIds.includes(agent.id) ? 'dark:text-white text-blue-600' : 'dark:text-slate-600 text-slate-500'}`}>{agent.name}</span>
                      </button>

                      {/* Voice Selection Dropdown (Only visible when selected) */}
                      {selectedAgentIds.includes(agent.id) && (
                        <div className="mt-2 relative z-20">
                          <select
                            value={agentVoices[agent.id] || ''}
                            onChange={(e) => setAgentVoices(prev => ({ ...prev, [agent.id]: e.target.value }))}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-[8px] dark:bg-slate-950 bg-slate-100 border dark:border-slate-800 border-slate-300 rounded-lg px-2 py-1 dark:text-slate-300 text-slate-600 outline-none"
                          >
                            {VOICES.map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-2">
                    <button
                      onClick={() => setSessionDuration(suggestedDuration)}
                      className="text-[8px] font-black text-blue-500 hover:text-blue-400 transition-colors flex items-center gap-1"
                    >
                      <i className="fas fa-wand-magic-sparkles"></i> استفاده از پیشنهاد سیستم
                    </button>
                    <label className="text-[10px] font-black dark:text-slate-500 text-slate-400 uppercase tracking-widest">زمان نشست (ثانیه)</label>
                  </div>
                  <input type="number" value={sessionDuration} onChange={e => setSessionDuration(Number(e.target.value))} className="w-full dark:bg-slate-950 bg-slate-50 border dark:border-slate-800 border-slate-200 rounded-2xl px-6 py-4 text-center text-2xl font-black text-blue-400 outline-none focus:border-blue-500 transition-colors" />
                  <p className="text-[9px] text-center dark:text-slate-600 text-slate-400 font-bold">پیشنهاد سیستم: {suggestedDuration} ثانیه</p>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black dark:text-slate-500 text-slate-400 uppercase tracking-widest block text-center">عمق تحلیل (1-5)</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(v => (
                      <button key={v} onClick={() => setComplexity(v as any)} className={`flex-1 py-4 rounded-xl border-2 font-black transition-all ${complexity === v ? 'bg-blue-600 border-blue-400 text-white shadow-xl' : 'dark:bg-slate-800 bg-slate-200 dark:border-slate-700 border-slate-300 dark:text-slate-500 text-slate-600'}`}>{v}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black dark:text-slate-500 text-slate-400 uppercase tracking-widest block">پروتکل ارتباطی</label>
                <div className="flex gap-4">
                  <button onClick={() => setSessionMode('voice')} className={`flex-1 py-5 rounded-2xl border-2 font-black transition-all flex items-center justify-center gap-3 ${sessionMode === 'voice' ? 'bg-indigo-600 border-indigo-400 text-white shadow-2xl shadow-indigo-900/20' : 'dark:bg-slate-800 bg-slate-200 dark:border-slate-700 border-slate-300 dark:text-slate-500 text-slate-600'}`}>
                    <i className="fas fa-microphone"></i> صوتی
                  </button>
                  <button onClick={() => setSessionMode('text')} className={`flex-1 py-5 rounded-2xl border-2 font-black transition-all flex items-center justify-center gap-3 ${sessionMode === 'text' ? 'bg-emerald-600 border-emerald-400 text-white shadow-2xl shadow-emerald-900/20' : 'dark:bg-slate-800 bg-slate-200 dark:border-slate-700 border-slate-300 dark:text-slate-500 text-slate-600'}`}>
                    <i className="fas fa-keyboard"></i> متنی
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button onClick={startSession} disabled={!topic || (selectedAgentIds.length === 0 && architects.length === 0 && selectedExpertIds.length === 0)} className="w-full py-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-[3rem] text-3xl font-black text-white shadow-2xl transition-all active:scale-95 disabled:opacity-20 flex items-center justify-center gap-4">
            <CentaurIcon className="w-10 h-10" />
            آغاز عملیات مشترک (Architects, Experts & Agents)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden dark:bg-[#010409] bg-slate-50 transition-colors duration-300">
      <div className="flex-1 relative overflow-hidden flex items-center justify-center p-20 z-10" style={{ perspective: '2000px' }}>
        {/* Same interface components as previous... */}
        <div className="absolute left-10 top-1/2 -translate-y-1/2 dark:bg-slate-900/90 bg-white/90 backdrop-blur-3xl border dark:border-slate-800 border-slate-200 p-8 rounded-[3.5rem] space-y-6 z-50 w-64 shadow-2xl">
          <div className="flex items-center justify-center mb-4">
            <CentaurIcon className="w-10 h-10 text-blue-500" />
          </div>
          <h5 className="text-[9px] font-black text-blue-500 tracking-[0.3em] uppercase text-center mb-4">Strategic Interface Control</h5>

          {/* Recording Indicator */}
          <div className="flex items-center justify-center gap-2 py-2 dark:bg-slate-950 bg-slate-50 rounded-xl border dark:border-slate-800 border-slate-100">
            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
            <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">Recording Session...</span>
          </div>

          <div className="flex justify-between items-center gap-2 mb-4">
            <button onClick={() => setZoom(prev => Math.min(5, prev + 0.1))} className="flex-1 py-3 dark:bg-slate-800 bg-slate-100 dark:hover:bg-slate-700 hover:bg-slate-200 rounded-xl dark:text-white text-slate-900 transition-all shadow-sm"><i className="fas fa-plus"></i></button>
            <button onClick={() => setZoom(prev => Math.max(0.2, prev - 0.1))} className="flex-1 py-3 dark:bg-slate-800 bg-slate-100 dark:hover:bg-slate-700 hover:bg-slate-200 rounded-xl dark:text-white text-slate-900 transition-all shadow-sm"><i className="fas fa-minus"></i></button>
          </div>
          {['X', 'Y', 'Z'].map(axis => (
            <div key={axis} className="space-y-2">
              <div className="flex justify-between text-[8px] font-black dark:text-slate-600 text-slate-400 uppercase"><span>Rotate {axis}</span><span>{axis === 'X' ? rotateX : axis === 'Y' ? rotateY : rotateZ}°</span></div>
              <input type="range" min="-180" max="180" value={axis === 'X' ? rotateX : axis === 'Y' ? rotateY : rotateZ} onChange={e => axis === 'X' ? setRotateX(Number(e.target.value)) : axis === 'Y' ? setRotateY(Number(e.target.value)) : setRotateZ(Number(e.target.value))} className="w-full accent-blue-500 h-1.5 dark:bg-slate-800 bg-slate-200 rounded-full appearance-none cursor-pointer" />
            </div>
          ))}
          <div className="h-px dark:bg-slate-800 bg-slate-100 my-4"></div>
          <button onClick={() => setIsHumanPanelOpen(true)} className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.5rem] text-[10px] font-black shadow-xl animate-pulse">مداخله معمار (HITL)</button>
        </div>

        <div className="absolute inset-0 flex items-center justify-center transition-all duration-1000" style={{ transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${zoom})`, transformStyle: 'preserve-3d' }}>
          <div className="absolute w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[150px] animate-pulse"></div>
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
            {session.participants.map(f => session.participants.map(t => {

              if (!activeSpeakerId) return null; // No lines if no one speaking

              // Only draw lines originating from the active speaker
              if (f.id !== activeSpeakerId) return null;

              // Don't draw line to self
              if (f.id === t.id) return null;

              const posF = agentPositions[f.id];
              const posT = agentPositions[t.id];

              if (!posF || !posT) return null;

              // Neon Green to Neon Blue gradient
              return (
                <line
                  key={`${f.id}-${t.id}`}
                  x1={`${posF.x}%`}
                  y1={`${posF.y}%`}
                  x2={`${posT.x}%`}
                  y2={`${posT.y}%`}
                  stroke="url(#speakerGradient)"
                  strokeWidth="2"
                  strokeDasharray="0"
                  className="animate-pulse opacity-60"
                />
              );
            }))}
            <defs>
              <linearGradient id="speakerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22c55e" /> {/* Green (Speaker) */}
                <stop offset="100%" stopColor="#3b82f6" /> {/* Blue (Audience) */}
              </linearGradient>
            </defs>
          </svg>
          {session.participants.map(agent => {
            const pos = agentPositions[agent.id];
            if (!pos) return null;
            const isActive = activeSpeakerId === agent.id;
            const isThinking = thinkingAgentId === agent.id;

            // Visual Styles Update
            // Active Speaker: Green Pulsing
            // Thinking Agent: Amber Pulsing (New)
            // Audience (Everyone else): Blue Matte

            const isExpert = agent.isExpert;
            const isArchitect = agent.isHuman && !isExpert;

            // Contribution calculation
            const agentWordCount = contributionStats.byAgent[agent.id] || 0;
            const contributionPercent = contributionStats.total > 0 ? (agentWordCount / contributionStats.total) * 100 : 0;

            // Base styles
            let cardStyles = "dark:bg-slate-900 bg-white dark:border-slate-800 border-slate-200";
            let iconColor = isArchitect ? "text-indigo-500" : isExpert ? "text-emerald-500" : "text-blue-500";

            // Active Speaker Styles (Green Neon Pulsing)
            let activeStyles = "bg-green-600/20 border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.6)] animate-pulse z-50 scale-125";
            let activeIconColor = "text-green-400";

            // Thinking Styles (Amber Neon Pulsing)
            let thinkingStyles = "bg-amber-600/20 border-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.6)] animate-pulse z-50 scale-110";
            let thinkingIconColor = "text-amber-400";

            // Audience Styles (Blue Matte)
            let audienceStyles = "bg-blue-900/40 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.3)] opacity-90 grayscale-[0.3]";

            return (
              <div key={agent.id} className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ${isActive || isThinking ? 'z-50' : 'z-20'}`} style={{ left: `${pos.x}%`, top: `${pos.y}%`, transformStyle: 'preserve-3d' }}>
                <div className="flex flex-col items-center gap-8 relative">

                  {/* Contribution Bar */}
                  <div className="absolute -right-6 top-0 bottom-0 w-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`w-full absolute bottom-0 rounded-full transition-all duration-700 ${isActive ? 'bg-green-500' : 'bg-blue-500'}`}
                      style={{ height: `${Math.min(contributionPercent, 100)}%` }}
                    ></div>
                  </div>

                  {/* Agent Card */}
                  <div className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center border-4 transition-all cursor-pointer relative ${isActive ? activeStyles : isThinking ? thinkingStyles : (activeSpeakerId ? audienceStyles : cardStyles)}`}>
                    <i className={`fas ${agent.icon} text-5xl transition-all ${isActive ? activeIconColor : isThinking ? thinkingIconColor : iconColor}`}></i>
                    {/* Speaking Pulse Ripple */}
                    {isActive && (
                      <div className="absolute inset-0 border-4 border-green-400 rounded-[2.5rem] animate-ping opacity-20"></div>
                    )}
                    {/* Thinking Pulse Ripple */}
                    {isThinking && (
                      <div className="absolute inset-0 border-4 border-amber-400 rounded-[2.5rem] animate-ping opacity-20"></div>
                    )}
                  </div>

                  {/* Name Badge */}
                  <div className={`px-6 py-2 rounded-full dark:bg-slate-950/90 bg-white/90 border text-[10px] font-black uppercase tracking-widest shadow-lg flex flex-col items-center ${isActive ? 'text-green-500 border-green-500/50' : isThinking ? 'text-amber-500 border-amber-500/50' : (activeSpeakerId ? 'text-blue-400 border-blue-500/30' : 'dark:text-slate-600 text-slate-500 dark:border-slate-800 border-slate-200')}`}>
                    <span>{agent.name}</span>
                    {isActive && <span className="text-[8px] animate-pulse text-green-400 mt-1">Speaking...</span>}
                    {isThinking && <span className="text-[8px] animate-pulse text-amber-400 mt-1">Thinking...</span>}
                    {isExpert && !isActive && !isThinking && <span className="mt-1 text-[8px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded uppercase">Expert</span>}
                    {isArchitect && !isActive && !isThinking && <span className="mt-1 text-[8px] bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded uppercase">Architect</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="absolute top-10 right-10 flex flex-col gap-4 z-50 items-end">
          <div className="flex gap-4 items-center">
            <div className="dark:bg-slate-950/90 bg-white/90 px-8 py-4 rounded-[2rem] border-2 dark:border-slate-800 border-slate-200 dark:text-blue-500 text-blue-600 font-black text-2xl shadow-2xl flex items-center gap-4 backdrop-blur-3xl transition-colors">
              <i className="fas fa-clock text-xl animate-pulse"></i> {formatTime(session.timeRemaining)}
            </div>
            <button
              onClick={toggleMode}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-xl transition-all border-2 dark:border-slate-800 border-slate-200 ${session.mode === 'voice' ? 'bg-indigo-600/20 text-indigo-400' : 'bg-emerald-600/20 text-emerald-400'}`}
            >
              <i className={`fas ${session.mode === 'voice' ? 'fa-microphone-lines' : 'fa-comment-dots'}`}></i>
            </button>
            <button
              onClick={() => onUpdateSession({ ...session, isRunning: !session.isRunning })}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl shadow-2xl border-2 dark:border-slate-900 border-white transition-all ${session.isRunning ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20'}`}
            >
              <i className={`fas ${session.isRunning ? 'fa-pause' : 'fa-play'}`}></i>
            </button>
            <button onClick={() => stopRecordingAndComplete(session)} className="px-8 py-4 dark:bg-red-900/20 bg-red-50 dark:hover:bg-red-900/40 hover:bg-red-100 text-red-500 font-black rounded-2xl border dark:border-red-900/30 border-red-200 shadow-2xl transition-all font-black">اتمام نشست</button>
          </div>
          {isWaitingForQuota && (
            <div className="dark:bg-amber-500/20 bg-amber-50 border dark:border-amber-500/40 border-amber-200 text-amber-600 px-6 py-3 rounded-2xl flex items-center gap-3 animate-pulse shadow-lg backdrop-blur-xl transition-colors">
              <i className="fas fa-hourglass-half"></i>
              <span className="text-xs font-black">در انتظار بازگشت محدودیت زمانی...</span>
            </div>
          )}
        </div>
      </div>

      <div className="h-80 dark:bg-slate-900/98 bg-white/98 backdrop-blur-3xl border-t dark:border-slate-800 border-slate-200 flex flex-col z-50 relative transition-colors">
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 px-10 py-2 rounded-full text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] z-50 flex items-center gap-3">
          <CentaurIcon className="w-4 h-4" />
          <span>Strategic Telemetry Stream</span>
        </div>
        <div ref={transcriptRef} className="flex-1 overflow-y-auto p-12 space-y-10 custom-scrollbar">
          {session.messages.map(msg => {
            const sender = session.participants.find(p => p.id === msg.agentId);
            const isSenderArchitect = sender?.isHuman && !sender?.isExpert;
            const isSenderExpert = sender?.isExpert;

            return (
              <div key={msg.id} className="flex gap-10 text-right animate-in slide-in-from-bottom-8 duration-700">
                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 border-2 transition-all ${isSenderArchitect ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' :
                  isSenderExpert ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' :
                    'dark:bg-blue-600/10 bg-blue-50 dark:border-blue-500/20 border-blue-200 text-blue-500 shadow-xl shadow-blue-900/5'
                  }`}>
                  <i className={`fas ${sender?.icon || 'fa-robot'} text-2xl`}></i>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-end gap-6">
                    <span className="text-[10px] dark:text-slate-600 text-slate-400 font-bold uppercase">{new Date(msg.timestamp).toLocaleTimeString('fa-IR')}</span>
                    <span className={`font-black text-sm uppercase tracking-widest flex items-center gap-2 ${isSenderArchitect ? 'text-indigo-400' : isSenderExpert ? 'text-emerald-400' : 'text-blue-500'
                      }`}>
                      {msg.agentName}
                      {isSenderExpert && <span className="text-[8px] bg-emerald-500/10 px-2 py-0.5 rounded">EXPERT</span>}
                      {isSenderArchitect && <span className="text-[8px] bg-indigo-500/10 px-2 py-0.5 rounded">ARCHITECT</span>}
                    </span>
                  </div>
                  <div className={`p-8 rounded-[3rem] border transition-all text-lg leading-relaxed antialiased ${isSenderArchitect ? 'dark:bg-indigo-950/20 bg-indigo-50 dark:border-indigo-800/40 border-indigo-200 dark:text-indigo-100 text-indigo-900 shadow-2xl shadow-indigo-900/10' :
                    isSenderExpert ? 'dark:bg-emerald-950/20 bg-emerald-50 dark:border-emerald-800/40 border-emerald-200 dark:text-emerald-100 text-emerald-900 shadow-2xl shadow-emerald-900/10' :
                      'dark:bg-slate-800/40 bg-slate-50 dark:border-slate-800 border-slate-200 dark:text-slate-300 text-slate-700'
                    }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isHumanPanelOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[100] flex items-center justify-center p-8">
          <div className="dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 w-full max-w-5xl rounded-[4rem] p-20 space-y-16 text-right shadow-[0_0_150px_rgba(99,102,241,0.1)] animate-in zoom-in-95 duration-500">
            <header className="flex justify-between items-center border-b dark:border-slate-800 border-slate-100 pb-12">
              <div className="w-24 h-24 rounded-[2.5rem] bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-5xl text-indigo-400"><i className={`fas ${currentTurnAgent?.icon || 'fa-user-astronaut'}`}></i></div>
              <div className="text-right">
                <h4 className="text-5xl font-black text-indigo-400">مداخله مستقیم {currentTurnAgent?.name || 'انسانی'}</h4>
                <p className="text-[10px] dark:text-slate-500 text-slate-400 font-bold uppercase tracking-[0.4em] mt-4">Human-In-The-Loop Operation Matrix Active</p>
              </div>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              <div className="md:col-span-2 space-y-6">
                <label className="text-[10px] font-black dark:text-slate-500 text-slate-400 uppercase tracking-widest">متن مداخله یا پاسخ راهبردی</label>
                <textarea value={humanInput} onChange={(e) => setHumanInput(e.target.value)} placeholder="دیدگاه یا فرمان اصلاحی خود را وارد کنید..." rows={8} className="w-full dark:bg-slate-950 bg-slate-50 border dark:border-slate-800 border-slate-200 rounded-[3rem] px-12 py-10 text-2xl dark:text-white text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/20 shadow-inner resize-none leading-relaxed font-black" />
              </div>
              <div className="space-y-6">
                <label className="text-[10px] font-black dark:text-slate-500 text-slate-400 uppercase tracking-widest">توجیه یا هدف‌گذاری مخاطب</label>
                <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar p-2">
                  {session.participants.filter(p => !p.isHuman).map(p => (
                    <button key={p.id} onClick={() => setTargetAgentIds(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])} className={`w-full py-5 px-6 rounded-[1.5rem] border-2 text-xs font-black transition-all flex items-center justify-between ${targetAgentIds.includes(p.id) ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl' : 'dark:bg-slate-950 bg-slate-50 dark:border-slate-800 border-slate-200 dark:text-slate-600 text-slate-500 hover:border-indigo-900/50'}`}>
                      <i className={`fas ${targetAgentIds.includes(p.id) ? 'fa-check-circle' : 'fa-circle-plus'}`}></i>
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-8">
              <button onClick={() => { setIsHumanPanelOpen(false); if (currentTurnAgent?.isHuman) onUpdateSession({ ...session, isRunning: true }); }} className="flex-1 py-8 dark:bg-slate-800 bg-slate-100 dark:hover:bg-slate-700 hover:bg-slate-200 dark:text-white text-slate-900 rounded-[2.5rem] font-black shadow-xl transition-all border dark:border-slate-700 border-slate-200 font-black">انصراف</button>
              <button onClick={() => submitHumanMessage(true, !currentTurnAgent?.isHuman)} className="flex-[3] py-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2.5rem] font-black shadow-2xl shadow-indigo-900/50 transition-all text-2xl active:scale-[0.98] font-black">ارسال و ادامه جریان تصمیم‌گیری</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 12px; }
        .light .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; }
      `}</style>
    </div>
  );
};

export default RoundTable;
