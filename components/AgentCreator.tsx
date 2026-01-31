
import React, { useState, useRef } from 'react';
import { Agent, CognitiveRole, MaturityLevel, MainDomain, InputType, DataSource, PersonalityTraits, PersonalityArchetype, Methodology, TimeHorizon } from '../types';
import { CentaurIcon } from './Sidebar';

interface AgentCreatorProps {
  onSave: (agent: Agent) => void;
  onCancel: () => void;
}

const ARCHETYPES: PersonalityArchetype[] = ['The Architect', 'The Disruptor', 'The Diplomat', 'The Sage', 'The Guardian', 'The Maverick'];
const COGNITIVE_ROLES: CognitiveRole[] = ['Problem Framer', 'Analyst', 'Synthesizer', 'Ideator', 'Evaluator', 'Critic', 'Strategist', 'Planner', 'Executor', 'Monitor', 'Moderator', 'Decision Support'];
const METHODOLOGIES: Methodology[] = ['Rule-based', 'LLM-driven', 'Hybrid', 'Multi-agent', 'Search-based', 'Simulation-based', 'Heuristic', 'Statistical / ML'];
const TIME_HORIZONS: TimeHorizon[] = ['Short-term', 'Mid-term', 'Long-term', 'Foresight'];
const INPUT_TYPES: InputType[] = ['Text', 'Dataset', 'API', 'PDF', 'URL', 'Sensor', 'CSV', 'JSON'];

const AGENT_ICONS = [
  'fa-robot', 'fa-brain', 'fa-microchip', 'fa-database', 'fa-network-wired',
  'fa-shield-halved', 'fa-gauge-high', 'fa-laptop-code', 'fa-satellite',
  'fa-magnifying-glass-chart', 'fa-dna', 'fa-bolt'
];

const AgentCreator: React.FC<AgentCreatorProps> = ({ onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [domain, setDomain] = useState<MainDomain>('Technology');
  const [category, setCategory] = useState<'agnostic' | 'specific'>('agnostic');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [selectedIcon, setSelectedIcon] = useState(AGENT_ICONS[0]);
  
  // New State Variables
  const [selectedRoles, setSelectedRoles] = useState<CognitiveRole[]>(['Analyst']);
  const [methodology, setMethodology] = useState<Methodology>('LLM-driven');
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>('Mid-term');
  const [inputs, setInputs] = useState<InputType[]>(['Text']);
  const [problemTypes, setProblemTypes] = useState('');
  const [outputs, setOutputs] = useState('');
  const [perspectives, setPerspectives] = useState('');

  // Personality
  const [tone, setTone] = useState<PersonalityTraits['tone']>('Formal');
  const [thinkingStyle, setThinkingStyle] = useState<PersonalityTraits['thinkingStyle']>('Data-Driven');
  const [assertiveness, setAssertiveness] = useState(50);
  const [creativity, setCreativity] = useState(50);
  const [archetype, setArchetype] = useState<PersonalityArchetype>('The Architect');
  const [quirks, setQuirks] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dataFileInputRef = useRef<HTMLInputElement>(null);

  const toggleSelection = <T,>(list: T[], setList: (l: T[]) => void, item: T) => {
    if (list.includes(item)) setList(list.filter(i => i !== item));
    else setList([...list, item]);
  };

  const addDataSource = (type: InputType) => {
    const newSource: DataSource = {
      id: `source-${Date.now()}`,
      type,
      name: `${type} Source`,
      value: '',
      status: 'syncing'
    };
    if (type === 'API') {
      newSource.apiConfig = { endpoint: '', authType: 'None', authValue: '', parameters: '' };
    }
    setDataSources([...dataSources, newSource]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'PDF' | 'CSV' | 'JSON') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const newSource: DataSource = {
        id: `source-${Date.now()}`,
        type,
        name: file.name,
        value: file.name,
        status: 'connected',
        fileData: {
          name: file.name,
          size: file.size,
          preview: type !== 'PDF' ? content.substring(0, 500) + '...' : undefined
        }
      };
      setDataSources([...dataSources, newSource]);
    };
    reader.readAsText(file);
  };

  const removeDataSource = (id: string) => setDataSources(dataSources.filter(s => s.id !== id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !systemPrompt) return;
    
    // Combine file inputs with selected input types to avoid duplicates
    const finalInputs = Array.from(new Set([...inputs, ...dataSources.map(s => s.type)]));

    const newAgent: Agent = {
      id: `custom-${Date.now()}`,
      name,
      version: '1.0.0',
      creator: 'User',
      maturity: 'Prototype',
      costPolicy: 'رایگان',
      cognitiveRoles: selectedRoles,
      domains: [{ level1: domain }], // Simplified for creator, expandable if needed
      problemTypes: problemTypes.split(',').map(s => s.trim()).filter(s => s),
      methodology,
      inputs: finalInputs,
      outputs: outputs.split(',').map(s => s.trim()).filter(s => s),
      perspectives: perspectives.split(',').map(s => s.trim()).filter(s => s),
      timeHorizon,
      multiAgent: { canCooperate: true, typicalCollaborators: [], requiresSupervisor: false, conflictProneWith: [] },
      dataSources,
      description: `Custom agent specialized in ${domain} using ${methodology}.`,
      systemPrompt,
      icon: selectedIcon,
      isCustom: true,
      category,
      personalityTraits: {
        tone,
        thinkingStyle,
        assertiveness,
        creativity,
        archetype,
        quirks: quirks.split(',').map(s => s.trim()).filter(s => s)
      }
    };
    onSave(newAgent);
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[100] flex items-center justify-center p-4">
      <div className="dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 w-full max-w-6xl rounded-[4rem] p-16 space-y-12 overflow-y-auto max-h-[95vh] text-right shadow-2xl custom-scrollbar transition-colors">
        <header className="flex justify-between items-center border-b dark:border-slate-800 border-slate-100 pb-10">
           <button onClick={onCancel} className="w-14 h-14 rounded-full dark:bg-slate-800 bg-slate-100 dark:text-slate-400 text-slate-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-lg"><i className="fas fa-times text-xl"></i></button>
           <div className="text-right flex items-center gap-6">
             <div>
               <h3 className="text-4xl font-black dark:text-white text-slate-900">معماری قنطورس: طراحی عامل</h3>
               <p className="text-[11px] font-black dark:text-slate-500 text-slate-400 uppercase tracking-widest mt-3">Advanced Think Tank Engineering Studio v3.0</p>
             </div>
             <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl">
               <CentaurIcon className="w-12 h-12" />
             </div>
           </div>
        </header>
        
        <form onSubmit={handleSubmit} className="space-y-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <label className="text-[11px] font-black dark:text-slate-500 text-slate-400 uppercase tracking-widest">نام و هویت عامل</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full dark:bg-slate-950 bg-slate-50 border dark:border-slate-800 border-slate-200 rounded-3xl px-8 py-6 text-xl dark:text-white text-slate-900 outline-none focus:border-blue-500 transition-all shadow-inner" placeholder="نام عامل (مثلاً: تحلیل‌گر راهبردی)..." />
            </div>
            <div className="space-y-4">
              <label className="text-[11px] font-black dark:text-slate-500 text-slate-400 uppercase tracking-widest">قلمرو تخصصی (Domain)</label>
              <select value={domain} onChange={e => setDomain(e.target.value as any)} className="w-full dark:bg-slate-950 bg-slate-50 border dark:border-slate-800 border-slate-200 rounded-3xl px-8 py-6 dark:text-white text-slate-900 outline-none appearance-none cursor-pointer hover:bg-slate-900 transition-all">
                <option value="Technology">Technology (فناوری)</option>
                <option value="Economy">Economy (اقتصاد)</option>
                <option value="Governance">Governance (حکمرانی)</option>
                <option value="Society & Culture">Society & Culture (جامعه و فرهنگ)</option>
                <option value="Environment & Resources">Environment (محیط زیست)</option>
                <option value="Data & Intelligence">Data & Intelligence (داده و هوش)</option>
                <option value="Innovation & Future">Innovation (نوآوری)</option>
              </select>
            </div>
            <div className="space-y-4">
              <label className="text-[11px] font-black dark:text-slate-500 text-slate-400 uppercase tracking-widest">دسته‌بندی (Classification)</label>
              <div className="flex gap-2 p-1.5 dark:bg-slate-950 bg-slate-100 rounded-3xl border dark:border-slate-800 border-slate-200">
                <button 
                  type="button"
                  onClick={() => setCategory('agnostic')} 
                  className={`flex-1 py-4 rounded-2xl text-[10px] font-black transition-all ${category === 'agnostic' ? 'bg-blue-600 text-white shadow-lg' : 'dark:text-slate-500 text-slate-500'}`}
                >
                  فراگیر (Agnostic)
                </button>
                <button 
                  type="button"
                  onClick={() => setCategory('specific')} 
                  className={`flex-1 py-4 rounded-2xl text-[10px] font-black transition-all ${category === 'specific' ? 'bg-indigo-600 text-white shadow-lg' : 'dark:text-slate-500 text-slate-500'}`}
                >
                  تخصصی (Specific)
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <label className="text-[11px] font-black dark:text-slate-500 text-slate-400 uppercase tracking-widest">انتخاب آیکون شناسه</label>
            <div className="grid grid-cols-6 md:grid-cols-12 gap-4 dark:bg-slate-950 bg-slate-50 p-8 rounded-[2.5rem] border dark:border-slate-800 border-slate-200">
              {AGENT_ICONS.map(icon => (
                <button 
                  key={icon} 
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all ${selectedIcon === icon ? 'bg-blue-600 text-white shadow-xl scale-110' : 'dark:bg-slate-900 bg-white dark:text-slate-600 text-slate-400 hover:text-blue-500 border dark:border-slate-800 border-slate-100'}`}
                >
                  <i className={`fas ${icon}`}></i>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-10 dark:bg-slate-950/40 bg-slate-50 p-12 rounded-[3.5rem] border dark:border-slate-800 border-slate-200 shadow-inner">
            <h4 className="text-[11px] font-black text-emerald-400 uppercase tracking-widest border-r-4 border-emerald-500 pr-6">پیکربندی شناختی (Cognitive Architecture)</h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black dark:text-slate-600 text-slate-400 uppercase">نقش‌های شناختی (چند گزینه‌ای)</label>
                <div className="flex flex-wrap gap-2">
                   {COGNITIVE_ROLES.map(role => (
                     <button 
                        key={role} 
                        type="button"
                        onClick={() => toggleSelection(selectedRoles, setSelectedRoles, role)}
                        className={`px-3 py-2 rounded-xl text-[10px] font-black border transition-all ${selectedRoles.includes(role) ? 'bg-emerald-600 border-emerald-500 text-white' : 'dark:bg-slate-900 bg-white border-slate-700 text-slate-500'}`}
                     >
                       {role}
                     </button>
                   ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black dark:text-slate-600 text-slate-400 uppercase">نوع ورودی‌ها</label>
                <div className="flex flex-wrap gap-2">
                   {INPUT_TYPES.map(it => (
                     <button 
                        key={it} 
                        type="button"
                        onClick={() => toggleSelection(inputs, setInputs, it)}
                        className={`px-3 py-2 rounded-xl text-[10px] font-black border transition-all ${inputs.includes(it) ? 'bg-blue-600 border-blue-500 text-white' : 'dark:bg-slate-900 bg-white border-slate-700 text-slate-500'}`}
                     >
                       {it}
                     </button>
                   ))}
                </div>
              </div>

              <div className="space-y-4">
                 <label className="text-[10px] font-black dark:text-slate-600 text-slate-400 uppercase">متدولوژی حل مسئله</label>
                 <select value={methodology} onChange={e => setMethodology(e.target.value as Methodology)} className="w-full dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl px-6 py-4 text-sm dark:text-white text-slate-900 outline-none">
                    {METHODOLOGIES.map(m => <option key={m} value={m}>{m}</option>)}
                 </select>
              </div>

              <div className="space-y-4">
                 <label className="text-[10px] font-black dark:text-slate-600 text-slate-400 uppercase">افق زمانی تحلیل</label>
                 <select value={timeHorizon} onChange={e => setTimeHorizon(e.target.value as TimeHorizon)} className="w-full dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl px-6 py-4 text-sm dark:text-white text-slate-900 outline-none">
                    {TIME_HORIZONS.map(t => <option key={t} value={t}>{t}</option>)}
                 </select>
              </div>

              <div className="space-y-4">
                 <label className="text-[10px] font-black dark:text-slate-600 text-slate-400 uppercase">نوع مسائل (Problem Types) - جدا با ویرگول</label>
                 <input value={problemTypes} onChange={e => setProblemTypes(e.target.value)} className="w-full dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl px-6 py-4 text-sm dark:text-white text-slate-900 outline-none" placeholder="مثلاً: Risk Analysis, Strategic Planning..." />
              </div>

              <div className="space-y-4">
                 <label className="text-[10px] font-black dark:text-slate-600 text-slate-400 uppercase">خروجی‌ها (Outputs) - جدا با ویرگول</label>
                 <input value={outputs} onChange={e => setOutputs(e.target.value)} className="w-full dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl px-6 py-4 text-sm dark:text-white text-slate-900 outline-none" placeholder="مثلاً: PDF Report, JSON, Strategy Map..." />
              </div>

               <div className="col-span-1 lg:col-span-2 space-y-4">
                 <label className="text-[10px] font-black dark:text-slate-600 text-slate-400 uppercase">دیدگاه‌ها و رویکردها (Perspectives) - جدا با ویرگول</label>
                 <input value={perspectives} onChange={e => setPerspectives(e.target.value)} className="w-full dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl px-6 py-4 text-sm dark:text-white text-slate-900 outline-none" placeholder="مثلاً: Ethical, Financial, Political..." />
              </div>
            </div>
          </div>

          <div className="space-y-10 dark:bg-slate-950/40 bg-slate-50 p-12 rounded-[3.5rem] border dark:border-slate-800 border-slate-200 shadow-inner">
            <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest border-r-4 border-indigo-500 pr-6">شکل‌دهی عمیق به شخصیت (Personality Matrix)</h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="space-y-6">
                <label className="text-[10px] font-black dark:text-slate-600 text-slate-400 uppercase">الگوی رفتاری (Archetype)</label>
                <div className="grid grid-cols-2 gap-3">
                   {ARCHETYPES.map(a => (
                     <button key={a} type="button" onClick={() => setArchetype(a)} className={`py-4 rounded-2xl text-[10px] font-black transition-all border ${archetype === a ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl' : 'dark:bg-slate-900 bg-white dark:border-slate-800 border-slate-200 dark:text-slate-500 text-slate-500 hover:text-indigo-400'}`}>
                       {a}
                     </button>
                   ))}
                </div>
              </div>

              <div className="space-y-10 lg:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <div className="flex justify-between text-[10px] font-black dark:text-slate-500 text-slate-400 uppercase"><span>Assertiveness (قاطعیت)</span><span>{assertiveness}%</span></div>
                    <input type="range" min="0" max="100" value={assertiveness} onChange={e => setAssertiveness(Number(e.target.value))} className="w-full accent-indigo-500 h-2 dark:bg-slate-900 bg-slate-200 rounded-full appearance-none cursor-pointer" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between text-[10px] font-black dark:text-slate-500 text-slate-400 uppercase"><span>Creativity (خلاقیت)</span><span>{creativity}%</span></div>
                    <input type="range" min="0" max="100" value={creativity} onChange={e => setCreativity(Number(e.target.value))} className="w-full accent-emerald-500 h-2 dark:bg-slate-900 bg-slate-200 rounded-full appearance-none cursor-pointer" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-3">
                     <label className="text-[10px] font-black dark:text-slate-600 text-slate-400 uppercase">لحن (Tone)</label>
                     <select value={tone} onChange={e => setTone(e.target.value as any)} className="w-full dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl px-6 py-4 text-sm dark:text-white text-slate-900 outline-none">
                        <option value="Formal">رسمی</option>
                        <option value="Casual">دوستانه</option>
                        <option value="Assertive">قاطع</option>
                        <option value="Supportive">حمایت‌گر</option>
                        <option value="Skeptical">منتقد</option>
                     </select>
                   </div>
                   <div className="space-y-3">
                     <label className="text-[10px] font-black dark:text-slate-600 text-slate-400 uppercase">سبک تفکر</label>
                     <select value={thinkingStyle} onChange={e => setThinkingStyle(e.target.value as any)} className="w-full dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl px-6 py-4 text-sm dark:text-white text-slate-900 outline-none">
                        <option value="Data-Driven">داده‌محور</option>
                        <option value="Intuitive">شهودی</option>
                        <option value="First-Principles">اصول اولیه</option>
                        <option value="Pragmatic">عمل‌گرا</option>
                     </select>
                   </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-10">
            <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-widest border-r-4 border-blue-500 pr-6">اتصالات و منابع داده (Data Sources & APIs)</h4>
            
            <div className="flex flex-wrap gap-4 justify-end">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="px-6 py-3 rounded-2xl bg-blue-600/10 border border-blue-500/30 text-blue-400 text-xs font-black hover:bg-blue-600/20 transition-all flex items-center gap-2">
                <i className="fas fa-file-pdf"></i> آپلود PDF
              </button>
              <button type="button" onClick={() => dataFileInputRef.current?.click()} className="px-6 py-3 rounded-2xl bg-emerald-600/10 border border-emerald-500/30 text-emerald-400 text-xs font-black hover:bg-emerald-600/20 transition-all flex items-center gap-2">
                <i className="fas fa-file-code"></i> آپلود CSV / JSON
              </button>
              <button type="button" onClick={() => addDataSource('API')} className="px-6 py-3 rounded-2xl bg-amber-600/10 border border-amber-500/30 text-amber-400 text-xs font-black hover:bg-amber-600/20 transition-all flex items-center gap-2">
                <i className="fas fa-link"></i> اتصال به API
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={e => handleFileUpload(e, 'PDF')} />
              <input type="file" ref={dataFileInputRef} className="hidden" accept=".csv,.json" onChange={e => handleFileUpload(e, e.target.files?.[0].name.endsWith('.csv') ? 'CSV' : 'JSON')} />
            </div>

            <div className="grid grid-cols-1 gap-6">
              {dataSources.map(s => (
                <div key={s.id} className="dark:bg-slate-950/60 bg-slate-50 border dark:border-slate-800 border-slate-200 rounded-[2.5rem] p-10 space-y-8 group transition-all hover:border-blue-500/40 relative overflow-hidden shadow-2xl">
                  <div className="flex justify-between items-center">
                    <button type="button" onClick={() => removeDataSource(s.id)} className="w-10 h-10 rounded-full dark:bg-red-950/20 bg-red-100 text-red-500 hover:bg-red-500 hover:text-white transition-all"><i className="fas fa-trash"></i></button>
                    <div className="flex items-center gap-4">
                       <span className="text-sm font-black dark:text-slate-300 text-slate-700">{s.name}</span>
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg ${s.type === 'PDF' ? 'bg-red-500/10 text-red-400' : s.type === 'API' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                         <i className={`fas ${s.type === 'PDF' ? 'fa-file-pdf' : s.type === 'API' ? 'fa-server' : 'fa-database'}`}></i>
                       </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[11px] font-black dark:text-slate-500 text-slate-400 uppercase tracking-widest block">پروتکل رفتاری سیستمی (System Prompt)</label>
            <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} rows={8} className="w-full dark:bg-slate-950 bg-slate-50 border dark:border-slate-800 border-slate-200 rounded-[3rem] px-10 py-10 dark:text-slate-300 text-slate-700 outline-none font-mono text-base focus:border-blue-500 transition-all resize-none shadow-inner leading-relaxed" placeholder="شما یک ایجنت هوشمند در قنطورس هستید که وظیفه دارید..." />
          </div>

          <button type="submit" className="w-full py-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-[3rem] shadow-2xl shadow-blue-900/40 transition-all text-2xl active:scale-[0.98]">
             تکمیل طراحی و استقرار در قنطورس
          </button>
        </form>
      </div>
    </div>
  );
};

export default AgentCreator;
