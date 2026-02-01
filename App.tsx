
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Marketplace from './components/Marketplace';
import AgentCreator from './components/AgentCreator';
import RoundTable from './components/RoundTable';
import AgentCard from './components/AgentCard';
import ProfileModal from './components/ProfileModal';
import SessionReport from './components/SessionReport';
import ExpertDirectory from './components/ExpertDirectory';
import ExpertDashboard from './components/ExpertDashboard';
import SettingsView from './components/SettingsView';
import AuthPage from './components/AuthPage';
import { Agent, RoundTableSession, SessionReport as ReportType, ThinkTank, Expert, ExpertInvitation, ExpertHistory } from './types';
import { MARKETPLACE_AGENTS, SOCIAL_EXPERTS } from './constants';
import { geminiService as aiService } from './services/aiService';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<'architect' | 'expert'>('architect');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'marketplace' | 'roundtable' | 'expert_network' | 'settings'>('dashboard');
  const [ownedAgents, setOwnedAgents] = useState<Agent[]>([]);
  const [showCreator, setShowCreator] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Agent | null>(null);
  const [sessions, setSessions] = useState<RoundTableSession[]>([]);
  const [activeReport, setActiveReport] = useState<ReportType | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [proxyUrl, setProxyUrl] = useState<string>(localStorage.getItem('centaurus_proxy') || '');

  // Experts & Invitations
  const [allExperts, setAllExperts] = useState<Expert[]>(SOCIAL_EXPERTS);
  const [expertInvitations, setExpertInvitations] = useState<ExpertInvitation[]>([]);
  const [expertHistory, setExpertHistory] = useState<ExpertHistory[]>([
    { sessionId: 'prev-1', topic: 'تحلیل پایداری زنجیره تامین انرژی', date: Date.now() - 864000000, impactScore: 4 },
    { sessionId: 'prev-2', topic: 'سیاست‌گذاری مهاجرت نخبگان در منطقه', date: Date.now() - 1728000000, impactScore: 5 },
  ]);

  useEffect(() => {
    const savedAgents = localStorage.getItem('centaurus_agents');
    if (savedAgents) {
      setOwnedAgents(JSON.parse(savedAgents));
    } else {
      const defaultAgents = MARKETPLACE_AGENTS.slice(0, 3);
      setOwnedAgents(defaultAgents);
      localStorage.setItem('centaurus_agents', JSON.stringify(defaultAgents));
    }

    const savedTheme = localStorage.getItem('centaurus_theme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('centaurus_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const addAgent = (agent: Agent) => {
    if (ownedAgents.some(a => a.id === agent.id)) return;
    const newAgents = [...ownedAgents, agent];
    setOwnedAgents(newAgents);
    localStorage.setItem('centaurus_agents', JSON.stringify(newAgents));
  };

  const updateAgent = (updatedAgent: Agent) => {
    const newAgents = ownedAgents.map(a => a.id === updatedAgent.id ? updatedAgent : a);
    setOwnedAgents(newAgents);
    localStorage.setItem('centaurus_agents', JSON.stringify(newAgents));
    if (selectedProfile?.id === updatedAgent.id) {
      setSelectedProfile(updatedAgent);
    }
  };

  const stopAgent = (agent: Agent) => {
    const newAgents = ownedAgents.filter(a => a.id !== agent.id);
    setOwnedAgents(newAgents);
    localStorage.setItem('centaurus_agents', JSON.stringify(newAgents));
  };

  const addThinkTank = (tt: ThinkTank) => {
    const currentIds = ownedAgents.map(a => a.id);
    const newAgents = [...ownedAgents];
    tt.agents.forEach(a => {
      if (!currentIds.includes(a.id)) newAgents.push(a);
    });
    setOwnedAgents(newAgents);
    localStorage.setItem('centaurus_agents', JSON.stringify(newAgents));
    setActiveTab('dashboard');
  };

  const handleUpdateSession = (updatedSession: RoundTableSession) => {
    setSessions(prev => {
      const exists = prev.find(s => s.id === updatedSession.id);
      return exists ? prev.map(s => s.id === updatedSession.id ? updatedSession : s) : [...prev, updatedSession];
    });
  };

  const handleCompleteSession = (session: RoundTableSession) => {
    const report: ReportType = session.liveReport || {
      sessionId: session.id,
      topic: session.topic,
      summary: `گزارش جامع نشست قنطورس حول محور "${session.topic}".`,
      keyInsights: ["تحلیل اولیه تکمیل شد"],
      keyTakeaways: [],
      riskMatrix: [{ threat: "نوسانات عملیاتی", impact: "متوسط" }],
      finalDecision: "نیاز به بررسی تکمیلی.",
      timeline: []
    };

    // Auto-save logic
    try {
      const savedReportsStr = localStorage.getItem('centaurus_saved_reports');
      const savedReports = savedReportsStr ? JSON.parse(savedReportsStr) : [];
      const updatedReports = [...savedReports, report];
      localStorage.setItem('centaurus_saved_reports', JSON.stringify(updatedReports));
      console.log("Report auto-saved to localStorage", report.sessionId);
    } catch (error) {
      console.error("Failed to auto-save report", error);
    }

    setAudioUrl(session.audioRecordingUrl);
    setActiveReport(report);
  };

  const handleInviteExpert = (expert: Expert) => {
    const activeSession = sessions.find(s => s.status === 'active');

    const newInvite: ExpertInvitation = {
      id: `inv-${Date.now()}`,
      expertId: expert.id,
      sessionId: activeSession ? activeSession.id : `session-${Date.now()}`,
      topic: activeSession ? activeSession.topic : "بررسی روندهای کلان استراتژیک",
      status: 'pending',
      timestamp: Date.now(),
      inviterName: role === 'architect' ? userProfile?.name || "معمار سیستم" : "ناظر سیستم"
    };

    setExpertInvitations(prev => [...prev, newInvite]);

    if (activeSession && expert.status === 'available') {
      handleAddToSession(expert);
    }
  };

  const handleAddToSession = (expert: Expert) => {
    const expertAgent: Agent = {
      id: expert.id,
      name: expert.name,
      version: "Live",
      creator: "Human",
      maturity: "Certified",
      costPolicy: "Direct",
      cognitiveRoles: ["Analyst", "Decision Support"],
      domains: [{ level1: expert.domain }],
      problemTypes: ["Critical Thinking"],
      methodology: "Hybrid",
      inputs: ["Text"],
      outputs: ["Strategy"],
      perspectives: ["Social"],
      timeHorizon: "Short-term",
      multiAgent: { canCooperate: true, typicalCollaborators: [], requiresSupervisor: false, conflictProneWith: [] },
      description: expert.bio,
      systemPrompt: "Immediate human intervention.",
      icon: expert.icon,
      isCustom: false,
      isHuman: true,
      isExpert: true,
      // Fix: Added missing category property
      category: expert.category
    };

    const activeSession = sessions.find(s => s.status === 'active');
    if (activeSession) {
      if (activeSession.participants.some(p => p.id === expertAgent.id)) {
        setActiveTab('roundtable');
        return;
      }

      const updatedSession: RoundTableSession = {
        ...activeSession,
        participants: [...activeSession.participants, expertAgent]
      };
      handleUpdateSession(updatedSession);
      setActiveTab('roundtable');
    } else {
      addAgent(expertAgent);
      setActiveTab('roundtable');
    }
  };

  const handleAcceptInvite = (inviteId: string) => {
    setExpertInvitations(prev => prev.map(i => i.id === inviteId ? { ...i, status: 'accepted' } : i));
    const invite = expertInvitations.find(i => i.id === inviteId);
    if (!invite) return;
    const expert = allExperts.find(e => e.id === invite.expertId);
    if (expert) {
      setAllExperts(prev => prev.map(e => e.id === expert.id ? { ...e, status: 'busy' } : e));
      handleAddToSession(expert);
    }
  };

  const handleDeclineInvite = (inviteId: string) => {
    setExpertInvitations(prev => prev.map(i => i.id === inviteId ? { ...i, status: 'declined' } : i));
  };

  const handleUpdateExpertStatus = (status: 'available' | 'busy' | 'offline') => {
    if (role === 'expert' && userProfile) {
      const updatedProfile = { ...userProfile, status };
      setUserProfile(updatedProfile);
      setAllExperts(prev => prev.map(e => e.id === userProfile.id ? updatedProfile : e));
    }
  };

  const handleSaveProxy = (url: string) => {
    setProxyUrl(url);
    localStorage.setItem('centaurus_proxy', url);
    aiService.updateConfig(url);
  };

  const handleLogin = (r: 'architect' | 'expert', profile: any) => {
    setRole(r);
    setUserProfile(profile);
    setIsLoggedIn(true);
    setActiveTab('dashboard');

    if (r === 'expert') {
      const newExpert: Expert = {
        id: profile.id || `expert-${Date.now()}`,
        name: profile.name,
        title: profile.title,
        bio: profile.bio,
        domain: profile.domain,
        specialties: profile.specialties,
        rating: 5.0,
        completedSessions: 0,
        icon: profile.icon || 'fa-user-graduate',
        status: 'available',
        // Fix: Added missing category property
        category: profile.category || 'specific'
      };
      setAllExperts(prev => [newExpert, ...prev]);
      setUserProfile(newExpert);
    }
  };

  const activeSessionRunning = sessions.some(s => s.status === 'active');

  if (!isLoggedIn) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`} dir="rtl">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        toggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        role={role}
        onLogout={() => { setIsLoggedIn(false); setUserProfile(null); }}
      />
      <main className="flex-1 overflow-y-auto relative transition-colors duration-300 dark:bg-[#020617] bg-slate-50">
        {activeTab === 'dashboard' && role === 'architect' && (
          <div className="p-10">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
              <div className="text-right">
                <h2 className="text-4xl font-black mb-3 dark:text-white text-slate-900">میز کار معمار: {userProfile?.name}</h2>
                <p className="dark:text-slate-500 text-slate-600 text-sm font-bold">مدیریت لایه‌های شناختی، مداخله‌گران انسانی و نخبگان استراتژیک.</p>
              </div>
              <button onClick={() => setShowCreator(true)} className="bg-blue-600 hover:bg-blue-500 transition-all px-10 py-5 rounded-[1.5rem] font-black shadow-2xl shadow-blue-900/40 text-white flex items-center gap-3 active:scale-95">
                <i className="fas fa-plus"></i> طراحی عامل جدید
              </button>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {ownedAgents.map(agent => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  isOwned={true}
                  actionLabel="توقف"
                  onAction={() => { }}
                  onStop={stopAgent}
                  onShowProfile={setSelectedProfile}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && role === 'expert' && (
          <ExpertDashboard
            expert={userProfile}
            invitations={expertInvitations}
            history={expertHistory}
            onAcceptInvite={handleAcceptInvite}
            onDeclineInvite={handleDeclineInvite}
            onUpdateStatus={handleUpdateExpertStatus}
          />
        )}

        {activeTab === 'expert_network' && (
          <ExpertDirectory
            experts={allExperts}
            onInvite={handleInviteExpert}
            onAddToSession={handleAddToSession}
            sentInvitations={expertInvitations}
            isSessionRunning={activeSessionRunning}
          />
        )}

        {activeTab === 'marketplace' && <Marketplace ownedAgents={ownedAgents} onPurchase={addAgent} onPurchaseThinkTank={addThinkTank} />}
        {activeTab === 'roundtable' && <RoundTable ownedAgents={ownedAgents} allExperts={allExperts} sentInvitations={expertInvitations} onUpdateSession={handleUpdateSession} currentSessions={sessions} onCompleteSession={handleCompleteSession} />}

        {activeTab === 'settings' && <SettingsView proxyUrl={proxyUrl} onSaveProxy={handleSaveProxy} />}

        {showCreator && <AgentCreator onSave={(a) => { addAgent(a); setShowCreator(false); }} onCancel={() => setShowCreator(false)} />}
        {selectedProfile && <ProfileModal agent={selectedProfile} onUpdateAgent={updateAgent} onClose={() => setSelectedProfile(null)} />}
        {activeReport && <SessionReport report={activeReport} audioUrl={audioUrl} onClose={() => setActiveReport(null)} />}
      </main>
    </div>
  );
};

export default App;
