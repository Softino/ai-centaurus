
import React, { useState, useMemo } from 'react';
import { MARKETPLACE_AGENTS, MARKETPLACE_THINK_TANKS } from '../constants';
import { Agent, ThinkTank, CognitiveRole, Methodology, MaturityLevel } from '../types';
import AgentCard from './AgentCard';

interface MarketplaceProps {
  ownedAgents: Agent[];
  onPurchase: (agent: Agent) => void;
  onPurchaseThinkTank: (thinkTank: ThinkTank) => void;
}

const Marketplace: React.FC<MarketplaceProps> = ({ ownedAgents, onPurchase, onPurchaseThinkTank }) => {
  const [categoryTab, setCategoryTab] = useState<'agnostic' | 'specific'>('agnostic');
  const [contentTab, setContentTab] = useState<'agents' | 'thinktanks'>('agents');
  const [search, setSearch] = useState('');
  
  // Advanced Filters
  const [filterRoles, setFilterRoles] = useState<CognitiveRole[]>([]);
  const [filterMethods, setFilterMethods] = useState<Methodology[]>([]);
  const [filterMaturity, setFilterMaturity] = useState<MaturityLevel[]>([]);

  const filteredAgents = useMemo(() => {
    return MARKETPLACE_AGENTS.filter(agent => {
      const matchesCategory = agent.category === categoryTab;
      const matchesSearch = agent.name.toLowerCase().includes(search.toLowerCase()) || 
                          agent.description.toLowerCase().includes(search.toLowerCase());
      const matchesRole = filterRoles.length === 0 || agent.cognitiveRoles.some(r => filterRoles.includes(r));
      const matchesMethod = filterMethods.length === 0 || filterMethods.includes(agent.methodology);
      const matchesMaturity = filterMaturity.length === 0 || filterMaturity.includes(agent.maturity);
      
      return matchesCategory && matchesSearch && matchesRole && matchesMethod && matchesMaturity;
    });
  }, [categoryTab, search, filterRoles, filterMethods, filterMaturity]);

  const filteredThinkTanks = useMemo(() => {
    return MARKETPLACE_THINK_TANKS.filter(tt => {
      const matchesCategory = tt.category === categoryTab;
      const matchesSearch = tt.name.toLowerCase().includes(search.toLowerCase()) || 
                          tt.description.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [categoryTab, search]);

  const toggleFilter = <T,>(list: T[], set: (val: T[]) => void, item: T) => {
    if (list.includes(item)) set(list.filter(i => i !== item));
    else set([...list, item]);
  };

  return (
    <div className="flex h-full bg-[#010409]">
      {/* Filtering Sidebar */}
      <aside className="w-80 bg-slate-900/50 border-l border-slate-800 p-8 overflow-y-auto space-y-10 custom-scrollbar shrink-0">
        <div className="space-y-4 text-right">
          <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">جستجوی هوشمند</h4>
          <div className="relative">
            <input 
              type="text" 
              placeholder="نام یا قابلیت..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-right focus:border-blue-500 outline-none transition-all pr-12"
            />
            <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-600"></i>
          </div>
        </div>

        <div className="space-y-4 text-right">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">نقش‌های شناختی</h4>
          <div className="flex flex-wrap gap-2 justify-end">
            {['Analyst', 'Ideator', 'Strategist', 'Critic', 'Decision Support', 'Synthesizer'].map(r => (
              <button 
                key={r} 
                onClick={() => toggleFilter(filterRoles, setFilterRoles, r as any)}
                className={`px-3 py-2 rounded-xl text-[10px] font-black border transition-all ${filterRoles.includes(r as any) ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/40' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 text-right">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">متدولوژی تفکر</h4>
          <div className="flex flex-wrap gap-2 justify-end">
            {['LLM-driven', 'Hybrid', 'Rule-based', 'Multi-agent'].map(m => (
              <button 
                key={m} 
                onClick={() => toggleFilter(filterMethods, setFilterMethods, m as any)}
                className={`px-3 py-2 rounded-xl text-[10px] font-black border transition-all ${filterMethods.includes(m as any) ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-900/40' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 text-right">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">سطح بلوغ</h4>
          <div className="flex flex-wrap gap-2 justify-end">
            {['Prototype', 'Production', 'Certified'].map(m => (
              <button 
                key={m} 
                onClick={() => toggleFilter(filterMaturity, setFilterMaturity, m as any)}
                className={`px-3 py-2 rounded-xl text-[10px] font-black border transition-all ${filterMaturity.includes(m as any) ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-900/40' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        
        {(filterRoles.length > 0 || filterMethods.length > 0 || filterMaturity.length > 0 || search) && (
          <button 
            onClick={() => { setFilterRoles([]); setFilterMethods([]); setFilterMaturity([]); setSearch(''); }}
            className="w-full py-3 text-[10px] font-black text-red-400 hover:text-red-300 transition-all border border-red-900/30 rounded-xl bg-red-950/20"
          >
            حذف تمامی فیلترها
          </button>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 p-8 flex flex-col gap-6 shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex gap-2 p-1.5 bg-slate-950/50 rounded-2xl border border-slate-800">
              <button 
                onClick={() => setCategoryTab('agnostic')} 
                className={`px-8 py-3 rounded-xl text-xs font-black transition-all ${categoryTab === 'agnostic' ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40' : 'text-slate-500 hover:text-white'}`}
              >
                فراگیر (Agnostic)
              </button>
              <button 
                onClick={() => setCategoryTab('specific')} 
                className={`px-8 py-3 rounded-xl text-xs font-black transition-all ${categoryTab === 'specific' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/40' : 'text-slate-500 hover:text-white'}`}
              >
                تخصصی (Specific)
              </button>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-black">بازارچه ایجنت‌ها</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-1">Strategic Agent repository v2.5</p>
            </div>
          </div>

          <div className="flex gap-4 border-t border-slate-800 pt-6">
            <button 
              onClick={() => setContentTab('agents')} 
              className={`px-10 py-3 rounded-[1.25rem] text-sm font-black transition-all border ${contentTab === 'agents' ? 'bg-blue-600/10 border-blue-500/50 text-blue-400 shadow-xl' : 'border-transparent text-slate-500 hover:text-white'}`}
            >
              عوامل مستقل
            </button>
            <button 
              onClick={() => setContentTab('thinktanks')} 
              className={`px-10 py-3 rounded-[1.25rem] text-sm font-black transition-all border ${contentTab === 'thinktanks' ? 'bg-blue-600/10 border-blue-500/50 text-blue-400 shadow-xl' : 'border-transparent text-slate-500 hover:text-white'}`}
            >
              اندیشکده‌های آماده
            </button>
          </div>
        </header>

        <div className="p-10 flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {contentTab === 'agents' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                {filteredAgents.map(agent => (
                  <AgentCard 
                    key={agent.id}
                    agent={agent}
                    isOwned={ownedAgents.some(a => a.id === agent.id)}
                    actionLabel="استقرار"
                    onAction={onPurchase}
                    onShowProfile={() => {}}
                  />
                ))}
                {filteredAgents.length === 0 && (
                  <div className="col-span-full py-40 text-center opacity-30 flex flex-col items-center">
                    <i className="fas fa-search-minus text-8xl mb-6"></i>
                    <p className="text-2xl font-black">عاملی با این مشخصات یافت نشد.</p>
                    <p className="text-sm mt-2">فیلترهای جستجو را بازبینی کنید.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {filteredThinkTanks.map(tt => (
                  <div key={tt.id} className="group bg-slate-900/60 border border-slate-800 p-12 rounded-[3.5rem] space-y-10 text-right hover:border-blue-500/40 transition-all shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-all"></div>
                    <div className="flex justify-between items-start">
                      <div className="w-24 h-24 rounded-[2rem] bg-slate-950 border border-slate-800 flex items-center justify-center text-5xl text-blue-400 group-hover:scale-110 transition-all shadow-inner"><i className={`fas ${tt.icon}`}></i></div>
                      <span className="px-5 py-2 rounded-full bg-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest">{tt.industry}</span>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-4xl font-black text-white">{tt.name}</h3>
                      <p className="text-slate-400 text-lg leading-relaxed antialiased">{tt.description}</p>
                    </div>
                    <div className="pt-10 border-t border-slate-800 flex items-center justify-between">
                       <div className="flex -space-x-4 space-x-reverse">
                         {tt.agents.map(a => <div key={a.id} className="w-12 h-12 rounded-2xl bg-slate-800 border-4 border-slate-900 flex items-center justify-center text-sm text-blue-500 shadow-xl" title={a.name}><i className={`fas ${a.icon}`}></i></div>)}
                       </div>
                       <button onClick={() => onPurchaseThinkTank(tt)} className="px-10 py-5 bg-blue-600 rounded-[1.5rem] font-black text-lg hover:bg-blue-500 transition-all shadow-2xl shadow-blue-900/50">استقرار شورا</button>
                    </div>
                  </div>
                ))}
                {filteredThinkTanks.length === 0 && (
                  <div className="col-span-full py-40 text-center opacity-30 flex flex-col items-center">
                    <i className="fas fa-layer-group text-8xl mb-6"></i>
                    <p className="text-2xl font-black">اندیشکده‌ای با این مشخصات یافت نشد.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
