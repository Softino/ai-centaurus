
import React, { useState } from 'react';
import { Agent } from '../types';

interface AgentCardProps {
  agent: Agent;
  onAction: (agent: Agent) => void;
  onStop?: (agent: Agent) => void;
  onShowProfile: (agent: Agent) => void;
  actionLabel: string;
  isOwned?: boolean;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, onAction, onStop, onShowProfile, actionLabel, isOwned }) => {
  const [shared, setShared] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  // Mapping maturity levels to Persian
  const maturityMap: Record<string, string> = {
    'Prototype': 'نمونه اولیه',
    'Production': 'عملیاتی',
    'Certified': 'معتبر/تایید شده'
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}?agent=${agent.id}`;
    navigator.clipboard.writeText(url);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const toggleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCompact(!isCompact);
  };

  return (
    <div className={`group relative bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-[2.5rem] p-8 transition-all duration-500 hover:border-blue-500/60 hover:shadow-[0_0_50px_rgba(59,130,246,0.15)] flex flex-col overflow-hidden ${isCompact ? 'h-auto' : 'h-full hover:scale-[1.03]'}`}>
      {/* Decorative Glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/5 rounded-full blur-3xl group-hover:bg-blue-600/10 transition-all duration-500"></div>
      
      {/* Header */}
      <div className="flex items-start justify-between mb-6 relative z-10">
        <div 
          onClick={(e) => { e.stopPropagation(); onShowProfile(agent); }}
          className={`${isCompact ? 'w-12 h-12 text-2xl' : 'w-16 h-16 text-3xl'} rounded-[1.25rem] bg-slate-800 border border-slate-700/50 flex items-center justify-center text-blue-400 shadow-xl group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-blue-500/30 transition-all duration-500 cursor-pointer`}
        >
          <i className={`fas ${agent.icon}`}></i>
        </div>
        <div className="flex gap-1">
          <button 
             onClick={toggleView}
             className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
             title={isCompact ? "نمای کامل" : "نمای فشرده"}
          >
            <i className={`fas ${isCompact ? 'fa-expand-alt' : 'fa-compress-alt'}`}></i>
          </button>
          {!isCompact && (
            <>
              <button 
                onClick={handleShare}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${shared ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                title="اشتراک‌گذاری"
              >
                <i className={`fas ${shared ? 'fa-check' : 'fa-share-nodes'}`}></i>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onShowProfile(agent); }}
                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
              >
                <i className="fas fa-ellipsis-h"></i>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2 relative z-10">
        <h3 className={`${isCompact ? 'text-lg' : 'text-xl'} font-black text-white group-hover:text-blue-400 transition-colors duration-300`}>{agent.name}</h3>
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
          <span>نسخه {agent.version}</span>
          {!isCompact && (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-700"></span>
              <span>سازنده: {agent.creator}</span>
            </>
          )}
        </div>
      </div>

      {!isCompact && (
        <>
          {/* Meta Pills */}
          <div className="flex flex-wrap gap-2 my-6 relative z-10">
            <span className="text-[10px] font-black px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {agent.cognitiveRoles[0]}
            </span>
            <span className="text-[10px] font-black px-3 py-1 rounded-lg bg-slate-800 text-slate-400 border border-slate-700">
              {agent.domains[0].level1}
            </span>
          </div>

          <p className="text-slate-400 text-sm leading-relaxed mb-8 line-clamp-2 min-h-[3rem] antialiased">
            {agent.description}
          </p>

          {/* Footer */}
          <div className="mt-auto pt-6 border-t border-slate-800/50 flex items-center justify-between relative z-10">
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-600 font-black uppercase mb-1">وضعیت بلوغ</span>
              <span className="text-xs font-bold text-slate-300">{maturityMap[agent.maturity] || agent.maturity}</span>
            </div>
            
            {isOwned && onStop ? (
              <button
                onClick={(e) => { e.stopPropagation(); onStop(agent); }}
                className="px-6 py-3 rounded-2xl text-xs font-black transition-all duration-300 bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/30 active:scale-95"
              >
                <span className="flex items-center gap-2">
                  <i className="fas fa-power-off"></i>
                  توقف عامل
                </span>
              </button>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onAction(agent); }}
                disabled={isOwned}
                className={`px-6 py-3 rounded-2xl text-xs font-black transition-all duration-300 ${
                  isOwned 
                  ? 'bg-slate-800/50 text-slate-600 border border-slate-700/50 cursor-default' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/30 active:scale-95'
                }`}
              >
                {isOwned ? (
                  <span className="flex items-center gap-2">
                    <i className="fas fa-check-circle"></i>
                    مستقر شده
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <i className="fas fa-plus-circle"></i>
                    {actionLabel}
                  </span>
                )}
              </button>
            )}
          </div>
        </>
      )}
      
      {isCompact && (
        <div className="mt-4 pt-4 border-t border-slate-800/50 flex justify-end">
           {isOwned && onStop ? (
             <button
                onClick={(e) => { e.stopPropagation(); onStop(agent); }}
                className="w-full py-2 rounded-xl text-xs font-black transition-all duration-300 bg-red-600 hover:bg-red-500 text-white"
                title="توقف عامل"
              >
                <i className="fas fa-power-off"></i>
              </button>
           ) : (
             <button
                onClick={(e) => { e.stopPropagation(); onAction(agent); }}
                disabled={isOwned}
                className={`w-full py-2 rounded-xl text-xs font-black transition-all duration-300 ${
                  isOwned 
                  ? 'bg-slate-800/50 text-slate-600' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                {isOwned ? <i className="fas fa-check"></i> : <i className="fas fa-plus"></i>}
              </button>
           )}
        </div>
      )}
    </div>
  );
};

export default AgentCard;
