
import React from 'react';
import { ChatMessage } from '../types';

interface HITLManagerProps {
  pendingMessages: ChatMessage[];
  onAction: (messageId: string, approved: boolean) => void;
}

const HITLManager: React.FC<HITLManagerProps> = ({ pendingMessages, onAction }) => {
  return (
    <div className="p-10 max-w-6xl mx-auto space-y-12">
      <header className="flex justify-between items-end">
        <div className="text-right">
          <div className="inline-block px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest mb-3">
            نظارت انسانی (HITL)
          </div>
          <h2 className="text-4xl font-black mb-3">مرکز تاییدات و نظارت</h2>
          <p className="text-slate-400 text-sm max-w-xl">بازبینی خروجی‌های حساس عوامل هوشمند پیش از نهایی‌سازی و استقرار در بدنه تصمیم‌گیری سازمان.</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 px-6 py-4 rounded-2xl text-center shadow-lg">
          <p className="text-[10px] font-black text-slate-500 mb-1">موارد در انتظار</p>
          <p className="text-3xl font-black text-blue-500">{pendingMessages.length}</p>
        </div>
      </header>

      {pendingMessages.length === 0 ? (
        <div className="py-32 border-2 border-dashed border-slate-800 rounded-[3rem] flex flex-col items-center justify-center text-slate-500 bg-slate-900/10">
          <div className="w-24 h-24 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-8 opacity-20">
            <i className="fas fa-check-double text-5xl"></i>
          </div>
          <p className="text-2xl font-black">تمامی درخواست‌ها بررسی شده‌اند</p>
          <p className="text-sm mt-4 opacity-60">در حال حاضر موردی برای بازبینی در صف نظارت انسانی وجود ندارد.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingMessages.map((msg) => (
            <div key={msg.id} className="bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-8 hover:border-blue-500/30 transition-all group overflow-hidden relative">
              {/* Context Header */}
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="px-4 py-1 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-400">
                    <i className="fas fa-clock ml-2"></i>
                    {new Date(msg.timestamp).toLocaleTimeString('fa-IR')}
                  </div>
                  <div className="px-4 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400">
                    <i className="fas fa-layer-group ml-2"></i>
                    {msg.sessionTitle || 'جلسه بدون عنوان'}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-slate-200">{msg.agentName}</span>
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 shadow-lg">
                    <i className="fas fa-robot"></i>
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div className="p-6 bg-slate-950/50 rounded-2xl border border-slate-800/50 mb-8 relative z-10">
                <p className="text-slate-300 leading-relaxed text-right font-medium">{msg.text}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 relative z-10">
                <button 
                  onClick={() => onAction(msg.id, true)}
                  className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/20"
                >
                  <i className="fas fa-check-double"></i> تایید و انتشار
                </button>
                <button 
                  onClick={() => onAction(msg.id, false)}
                  className="flex-1 py-4 bg-red-900/20 hover:bg-red-800/30 text-red-400 rounded-2xl font-black transition-all flex items-center justify-center gap-3 border border-red-900/30"
                >
                  <i className="fas fa-undo"></i> رد و بازنویسی
                </button>
              </div>
              
              {/* Decorative Accent */}
              <div className="absolute top-0 right-0 w-1 h-full bg-amber-500/40"></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HITLManager;
