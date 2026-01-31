
import React from 'react';
import { Agent } from '../types';

interface ProfileModalProps {
  agent: Agent;
  onUpdateAgent?: (agent: Agent) => void;
  onClose: () => void;
}

const AGENT_ICONS = [
  'fa-robot',
  'fa-brain',
  'fa-microchip',
  'fa-database',
  'fa-network-wired',
  'fa-shield-halved',
  'fa-gauge-high',
  'fa-laptop-code',
  'fa-satellite',
  'fa-magnifying-glass-chart',
  'fa-dna',
  'fa-bolt',
  'fa-atom',
  'fa-code-branch',
  'fa-server',
  'fa-user-astronaut'
];

const ProfileModal: React.FC<ProfileModalProps> = ({ agent, onUpdateAgent, onClose }) => {
  const maturityMap: Record<string, string> = {
    'Prototype': 'نمونه اولیه',
    'Production': 'عملیاتی',
    'Certified': 'تایید شده'
  };

  const horizonMap: Record<string, string> = {
    'Short-term': 'کوتاه‌مدت',
    'Mid-term': 'میان‌مدت',
    'Long-term': 'بلندمدت',
    'Foresight': 'آینده‌پژوهی'
  };

  const handleIconSelect = (icon: string) => {
    if (onUpdateAgent) {
      onUpdateAgent({ ...agent, icon });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-[100] p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col my-8 animate-in zoom-in-95 duration-300">
        {/* Header Section */}
        <div className="relative h-64 bg-gradient-to-br from-slate-800 to-slate-950 flex items-center p-12 shrink-0 border-b border-slate-800/50">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
          
          <div className="relative z-10 flex items-center gap-10 w-full">
            <div className="w-32 h-32 rounded-[2.5rem] bg-slate-900 border border-slate-700 flex items-center justify-center text-6xl text-blue-500 shadow-2xl relative group">
              <i className={`fas ${agent.icon}`}></i>
              <div className="absolute -inset-2 border-2 border-blue-500/30 rounded-[3rem] animate-pulse"></div>
            </div>
            
            <div className="text-right flex-1">
              <h2 className="text-5xl font-black text-white mb-4">{agent.name}</h2>
              <div className="flex flex-wrap items-center justify-end gap-6">
                <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-800/50 border border-slate-700 text-slate-300 font-black text-sm">
                  <i className="fas fa-code-branch text-blue-400"></i>
                  <span>نسخه: {agent.version}</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-800/50 border border-slate-700 text-slate-300 font-black text-sm">
                  <i className="fas fa-user-gear text-indigo-400"></i>
                  <span>توسعه‌دهنده: {agent.creator}</span>
                </div>
              </div>
            </div>
          </div>

          <button onClick={onClose} className="absolute top-10 left-10 w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all z-20">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Info Grid */}
        <div className="p-12 space-y-12 overflow-y-auto custom-scrollbar">
          
          {/* Icon Selection (New Feature) */}
          <div className="space-y-6">
            <h4 className="text-xs font-black text-blue-500 uppercase tracking-widest border-r-4 border-blue-500 pr-4 text-right">شخصی‌سازی هویت بصری</h4>
            <div className="dark:bg-slate-950/40 bg-slate-50 p-8 rounded-[2.5rem] border dark:border-slate-800 border-slate-200">
              <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
                {AGENT_ICONS.map(icon => (
                  <button 
                    key={icon}
                    onClick={() => handleIconSelect(icon)}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all ${agent.icon === icon ? 'bg-blue-600 text-white shadow-xl scale-110 shadow-blue-500/30' : 'bg-slate-900 text-slate-500 hover:text-white border border-slate-800 hover:border-slate-600'}`}
                  >
                    <i className={`fas ${icon}`}></i>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-600 font-bold mt-6 text-center italic">یک آیکون جدید برای تغییر نمایش بصری این عامل در سیستم انتخاب کنید.</p>
            </div>
          </div>

          {/* Personality Matrix & System Prompt */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h4 className="text-xs font-black text-indigo-500 uppercase tracking-widest border-r-4 border-indigo-500 pr-4 text-right">ماتریس شخصیت (Personality Matrix)</h4>
              <div className="dark:bg-slate-950/40 bg-slate-50 p-8 rounded-[2.5rem] border dark:border-slate-800 border-slate-200 space-y-6">
                {agent.personalityTraits ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                       <span className="text-indigo-400 font-black">{agent.personalityTraits.archetype}</span>
                       <span className="text-[10px] text-slate-500 font-bold uppercase">الگوی رفتاری</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[9px] text-slate-600 font-black uppercase">لحن</p>
                        <p className="text-sm font-bold text-slate-300">{agent.personalityTraits.tone}</p>
                      </div>
                      <div className="space-y-1 text-left">
                        <p className="text-[9px] text-slate-600 font-black uppercase">سبک تفکر</p>
                        <p className="text-sm font-bold text-slate-300">{agent.personalityTraits.thinkingStyle}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] text-slate-500"><span>{agent.personalityTraits.assertiveness}%</span><span>قاطعیت</span></div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: `${agent.personalityTraits.assertiveness}%` }}></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] text-slate-500"><span>{agent.personalityTraits.creativity}%</span><span>خلاقیت</span></div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${agent.personalityTraits.creativity}%` }}></div>
                        </div>
                      </div>
                    </div>
                    {agent.personalityTraits.quirks && agent.personalityTraits.quirks.length > 0 && (
                      <div className="flex flex-wrap gap-2 justify-end">
                        {agent.personalityTraits.quirks.map((q, i) => (
                          <span key={i} className="text-[9px] font-bold px-2 py-1 bg-slate-800 text-slate-400 rounded-lg">{q}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-slate-600 py-10 font-bold">اطلاعات شخصیتی برای این نسخه ثبت نشده است.</p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest border-r-4 border-amber-500 pr-4 text-right">دستورالعمل سیستمی (System Prompt)</h4>
              <div className="dark:bg-slate-950/40 bg-slate-50 p-8 rounded-[2.5rem] border dark:border-slate-800 border-slate-200 h-full max-h-[300px] overflow-y-auto custom-scrollbar">
                <p className="text-slate-400 font-mono text-sm leading-relaxed text-right whitespace-pre-wrap">{agent.systemPrompt}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-black text-blue-500 uppercase tracking-widest border-r-4 border-blue-500 pr-4 text-right">ماموریت عملیاتی</h4>
            <p className="text-slate-300 leading-relaxed text-xl font-medium text-right">{agent.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Cognitive Roles */}
            <div className="space-y-5">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-r-4 border-slate-800 pr-4 text-right">نقش‌های شناختی</h4>
              <div className="flex flex-wrap gap-2 justify-end">
                {agent.cognitiveRoles.map(r => (
                  <span key={r} className="bg-blue-900/20 text-blue-400 px-4 py-2 rounded-xl text-xs font-bold border border-blue-900/30">{r}</span>
                ))}
              </div>
            </div>

            {/* Domains */}
            <div className="space-y-5">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-r-4 border-slate-800 pr-4 text-right">قلمروهای تخصصی</h4>
              <div className="space-y-3">
                {agent.domains.map((d, i) => (
                  <div key={i} className="flex items-center justify-end text-sm p-3 rounded-xl bg-slate-800/30 border border-slate-800">
                    <span className="text-slate-500 italic text-xs mr-3">{d.level3}</span>
                    {d.level3 && <i className="fas fa-chevron-right text-[10px] mx-3 text-slate-700"></i>}
                    <span className="text-slate-400 font-bold">{d.level2}</span>
                    {d.level2 && <i className="fas fa-chevron-right text-[10px] mx-3 text-slate-700"></i>}
                    <span className="text-slate-300 font-black">{d.level1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 border-t border-slate-800/50 text-center">
            <div className="p-4 rounded-2xl bg-slate-800/20 border border-slate-800/50">
              <p className="text-[9px] text-slate-600 uppercase font-black mb-2">افق زمانی</p>
              <p className="text-sm font-black text-slate-300">{horizonMap[agent.timeHorizon] || agent.timeHorizon}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/20 border border-slate-800/50">
              <p className="text-[9px] text-slate-600 uppercase font-black mb-2">سطح بلوغ</p>
              <p className="text-sm font-black text-slate-300">{maturityMap[agent.maturity] || agent.maturity}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/20 border border-slate-800/50">
              <p className="text-[9px] text-slate-600 uppercase font-black mb-2">تعامل با سایرین</p>
              <p className="text-sm font-black text-emerald-500">{agent.multiAgent.canCooperate ? 'بله' : 'خیر'}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/20 border border-slate-800/50">
              <p className="text-[9px] text-slate-600 uppercase font-black mb-2">نیاز به ناظر</p>
              <p className="text-sm font-black text-amber-500">{agent.multiAgent.requiresSupervisor ? 'بله' : 'خیر'}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-10 bg-slate-950 border-t border-slate-800 shrink-0">
          <button 
            onClick={onClose}
            className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-900/20 text-lg"
          >
            تایید و بازگشت به داشبورد
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
