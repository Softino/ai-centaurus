
export type MaturityLevel = 'Prototype' | 'Production' | 'Certified';
export type CognitiveRole = 'Problem Framer' | 'Analyst' | 'Synthesizer' | 'Ideator' | 'Evaluator' | 'Critic' | 'Strategist' | 'Planner' | 'Executor' | 'Monitor' | 'Moderator' | 'Decision Support';
export type MainDomain = 'Technology' | 'Economy' | 'Governance' | 'Society & Culture' | 'Environment & Resources' | 'Data & Intelligence' | 'Innovation & Future';
export type Methodology = 'Rule-based' | 'LLM-driven' | 'Hybrid' | 'Multi-agent' | 'Search-based' | 'Simulation-based' | 'Heuristic' | 'Statistical / ML';
export type InputType = 'Text' | 'Dataset' | 'API' | 'PDF' | 'URL' | 'Sensor' | 'CSV' | 'JSON';

export type TimeHorizon = 'Short-term' | 'Mid-term' | 'Long-term' | 'Foresight';

export type PersonalityArchetype = 'The Architect' | 'The Disruptor' | 'The Diplomat' | 'The Sage' | 'The Guardian' | 'The Maverick';

export interface AppConfig {
  proxyUrl: string;
}

export interface DataSource {
  id: string;
  type: InputType;
  name: string;
  value: string;
  status: 'connected' | 'error' | 'syncing';
  apiConfig?: {
    endpoint: string;
    authType: 'None' | 'Bearer' | 'API-Key';
    authValue: string;
    parameters: string;
  };
  fileData?: {
    name: string;
    size: number;
    preview?: string;
  };
}

export interface PersonalityTraits {
  tone: 'Formal' | 'Casual' | 'Assertive' | 'Supportive' | 'Skeptical';
  thinkingStyle: 'Data-Driven' | 'Intuitive' | 'First-Principles' | 'Pragmatic';
  quirks?: string[];
  assertiveness: number; // 0-100
  creativity: number;    // 0-100
  archetype: PersonalityArchetype;
}

export interface Agent {
  id: string;
  name: string;
  version: string;
  creator: string;
  maturity: MaturityLevel;
  costPolicy: string;
  cognitiveRoles: CognitiveRole[];
  domains: { level1: MainDomain; level2?: string; level3?: string; }[];
  problemTypes: string[];
  methodology: Methodology;
  inputs: InputType[];
  outputs: string[];
  perspectives: string[];
  timeHorizon: TimeHorizon;
  multiAgent: {
    canCooperate: boolean;
    typicalCollaborators: string[];
    requiresSupervisor: boolean;
    conflictProneWith: string[];
  };
  dataSources?: DataSource[];
  description: string;
  systemPrompt: string;
  icon: string;
  isCustom: boolean;
  isHuman?: boolean;
  isExpert?: boolean;
  personality?: string;
  personalityTraits?: PersonalityTraits;
  category: 'agnostic' | 'specific';
}

export interface Expert {
  id: string;
  name: string;
  title: string;
  bio: string;
  domain: MainDomain;
  specialties: string[];
  rating: number;
  completedSessions: number;
  icon: string;
  avatar?: string;
  status: 'available' | 'busy' | 'offline';
  category: 'agnostic' | 'specific';
}

export interface ExpertHistory {
  sessionId: string;
  topic: string;
  date: number;
  impactScore: number;
}

export interface ExpertInvitation {
  id: string;
  expertId: string;
  sessionId: string;
  topic: string;
  status: 'pending' | 'accepted' | 'declined';
  timestamp: number;
  inviterName: string;
}

export interface ThinkTank {
  id: string;
  name: string;
  description: string;
  industry: string;
  agents: Agent[];
  icon: string;
  category: 'agnostic' | 'specific';
}

export interface ChatMessage {
  id: string;
  agentId: string;
  agentName: string;
  text: string;
  timestamp: number;
  status: 'approved' | 'rejected' | 'user' | 'pending';
  role: 'user' | 'assistant';
  targetAgentIds?: string[];
  citations?: { messageId: string, agentName: string }[];
  isInterjection?: boolean;
  sessionTitle?: string;
}

export interface RoundTableSession {
  id: string;
  topic: string;
  participants: Agent[];
  messages: ChatMessage[];
  status: 'active' | 'completed';
  currentTurnIndex: number;
  currentRound: number;
  maxRounds: number;
  raisedHands: string[];
  isRunning: boolean;
  mode: 'text' | 'voice';
  complexity: 1 | 2 | 3 | 4 | 5;
  timeRemaining: number;
  liveReport?: SessionReport;
  audioRecordingUrl?: string;
}

export interface SessionReport {
  sessionId: string;
  topic: string;
  summary: string;
  keyInsights: string[];
  keyTakeaways?: { agentName: string; takeaway: string }[];
  riskMatrix: { threat: string; impact: string }[];
  finalDecision: string;
  timeline: { agentName: string; keyContribution: string }[];
  agentRatings?: Record<string, number>;
}
