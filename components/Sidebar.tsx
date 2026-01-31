
import React from 'react';

interface SidebarProps {
  activeTab: 'dashboard' | 'marketplace' | 'roundtable' | 'expert_network' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'marketplace' | 'roundtable' | 'expert_network' | 'settings') => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  role: 'architect' | 'expert';
  onLogout: () => void;
}

export const CentaurIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 -960 960 960" className={`${className} fill-current`} xmlns="http://www.w3.org/2000/svg">
    <path d="M200-120q-33 0-56.5-23.5T120-200v-160h80v160h160v80H200Zm560 0H600v-80h160v-160h80v160q0 33-23.5 56.5T760-120ZM120-760q0-33 23.5-56.5T200-840h160v80H200v160h-80v-160Zm720 0v160h-80v-160H600v-80h160q33 0 56.5 23.5T840-760ZM480-240q21 0 35.5-14.5T530-290q0-21-14.5-35.5T480-340q-21 0-35.5 14.5T430-290q0 21 14.5 35.5T480-240Zm-36-153h73q0-34 8-52t35-45q35-35 46.5-56.5T618-598q0-54-39-88t-99-34q-50 0-86 26t-52 74l66 27q7-26 26.5-42.5T480-652q29 0 46.5 15.5T544-595q0 20-9.5 37.5T502-521q-33 29-45.5 56T444-393Z"/>
  </svg>
);

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, theme, toggleTheme, role, onLogout }) => {
  const architectTabs = [
    { id: 'dashboard', label: 'میز کار من', icon: 'fa-layer-group' },
    { id: 'marketplace', label: 'بازارچه ایجنت‌ها', icon: 'fa-store' },
    { id: 'expert_network', label: 'شبکه خبرگان', icon: 'fa-users-viewfinder' },
    { id: 'roundtable', label: 'میز گرد قنطورس', icon: 'fa-chess-board' },
    { id: 'settings', label: 'تنظیمات سیستم', icon: 'fa-cog' },
  ] as const;

  const expertTabs = [
    { id: 'dashboard', label: 'پنل تخصصی من', icon: 'fa-address-card' },
    { id: 'roundtable', label: 'نشست‌های فعال', icon: 'fa-chess-board' },
    { id: 'settings', label: 'تنظیمات', icon: 'fa-cog' },
  ] as const;

  const tabs = role === 'architect' ? architectTabs : expertTabs;

  return (
    <div className="w-72 dark:bg-slate-950 bg-white border-l dark:border-slate-900 border-slate-200 flex flex-col h-screen sticky top-0 z-40 shadow-2xl transition-colors duration-300 shrink-0">
      <div className="p-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-900/40 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <CentaurIcon className="w-8 h-8 relative z-10" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black dark:text-white text-slate-900 tracking-tighter leading-none">قنطورس</h1>
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">تعامل انسان و هوش مصنوعی</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/30 translate-x-1'
                : 'dark:text-slate-500 text-slate-600 dark:hover:bg-slate-900 hover:bg-slate-100 dark:hover:text-white hover:text-blue-600 hover:translate-x-1'
            }`}
          >
            <i className={`fas ${tab.icon} text-lg w-6`}></i>
            <span className="font-bold text-sm">{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 space-y-6 border-t dark:border-slate-900 border-slate-100">
        <div className="flex gap-2 p-1 dark:bg-slate-900 bg-slate-100 rounded-xl border dark:border-slate-800 border-slate-200">
          <button 
            onClick={() => theme !== 'dark' && toggleTheme()}
            className={`flex-1 py-2 rounded-lg transition-all text-xs font-black flex items-center justify-center gap-2 ${theme === 'dark' ? 'bg-slate-800 shadow-lg text-white' : 'text-slate-600'}`}
          >
            <i className={`fas fa-moon ${theme === 'dark' ? 'text-blue-400' : ''}`}></i>
            <span>Night</span>
          </button>
          <button 
            onClick={() => theme !== 'light' && toggleTheme()}
            className={`flex-1 py-2 rounded-lg transition-all text-xs font-black flex items-center justify-center gap-2 ${theme === 'light' ? 'bg-white shadow-lg text-blue-600' : 'text-slate-400'}`}
          >
            <i className={`fas fa-sun ${theme === 'light' ? 'text-orange-400' : ''}`}></i>
            <span>Day</span>
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4 p-4 rounded-2xl dark:bg-slate-900 bg-slate-50 border dark:border-slate-800 border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg">
              <i className={`fas ${role === 'architect' ? 'fa-user-tie' : 'fa-user-graduate'}`}></i>
            </div>
            <div className="flex-1 overflow-hidden text-right">
              <p className="text-xs font-black truncate dark:text-white text-slate-800">{role === 'architect' ? 'معمار سیستم' : 'خبره اجتماعی'}</p>
              <div className="flex items-center justify-end gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <p className="text-[9px] dark:text-slate-500 text-slate-400 font-bold uppercase">Authorized</p>
              </div>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full py-3 rounded-xl dark:bg-red-950/20 bg-red-50 text-red-500 text-[10px] font-black hover:bg-red-500 hover:text-white transition-all border border-red-500/20 uppercase tracking-widest"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
