
import React, { useState } from 'react';
import { Expert, ExpertInvitation, ExpertHistory } from '../types';

interface ExpertDashboardProps {
  expert: Expert;
  invitations: ExpertInvitation[];
  history: ExpertHistory[];
  onAcceptInvite: (inviteId: string) => void;
  onDeclineInvite: (inviteId: string) => void;
  onUpdateStatus: (status: 'available' | 'busy' | 'offline') => void;
}

const ExpertDashboard: React.FC<ExpertDashboardProps> = ({ expert, invitations, history, onAcceptInvite, onDeclineInvite, onUpdateStatus }) => {
  const [inviteFilter, setInviteFilter] = useState<'pending' | 'all'>('pending');
  const [searchTopic, setSearchTopic] = useState('');

  const filteredInvitations = invitations.filter(inv => {
    const matchesFilter = inviteFilter === 'all' || inv.status === 'pending';
    const matchesSearch = inv.topic.toLowerCase().includes(searchTopic.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-center bg-gradient-to-l from-blue-600 to-indigo-700 p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="z-10 text-right flex-1">
          <div className="flex items-center gap-3 mb-4">
             <div className="px-3 py-1 rounded-full bg-white/10 text-white text-[10px] font-black uppercase tracking-widest border border-white/20">
               هویت خبره قنطورس
             </div>
             <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 ${expert.status === 'available' ? 'bg-emerald-500/20 border-emerald-400 text-emerald-100' : 'bg-amber-500/20 border-amber-400 text-amber-100'}`}>
                <div className={`w-2 h-2 rounded-full ${expert.status === 'available' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></div>
                {expert.status === 'available' ? 'وضعیت: آنلاین' : 'وضعیت: مشغول'}
             </div>
          </div>
          <h2 className="text-4xl font-black mb-4">درود، {expert.name}</h2>
          <p className="text-blue-100 font-medium max-w-xl leading-relaxed">داشبورد اختصاصی مدیریت مشارکت‌های راهبردی و پایش امتیازات کیفی.</p>
          
          <div className="flex gap-4 mt-8">
             <button 
               onClick={() => onUpdateStatus('available')}
               className={`px-6 py-3 rounded-2xl text-xs font-black transition-all border ${expert.status === 'available' ? 'bg-white text-blue-600 border-white shadow-xl' : 'bg-white/5 border-white/20 hover:bg-white/10'}`}
             >
               در دسترس برای نشست
             </button>
             <button 
               onClick={() => onUpdateStatus('busy')}
               className={`px-6 py-3 rounded-2xl text-xs font-black transition-all border ${expert.status === 'busy' ? 'bg-amber-500 text-white border-amber-400 shadow-xl' : 'bg-white/5 border-white/20 hover:bg-white/10'}`}
             >
               در حال حاضر مشغول
             </button>
          </div>
        </div>
        <div className="relative z-10">
          <div className="w-40 h-40 rounded-[2.5rem] bg-slate-900 border-8 border-white/10 flex items-center justify-center text-6xl text-blue-400 shadow-2xl">
            <i className={`fas ${expert.icon}`}></i>
          </div>
          <div className={`absolute -bottom-2 -left-2 w-10 h-10 rounded-full border-4 border-slate-900 ${expert.status === 'available' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <h3 className="text-2xl font-black dark:text-white text-slate-900 flex items-center gap-4">
                 <i className="fas fa-inbox text-blue-500"></i>
                 درخواست‌های ورودی
              </h3>
              <div className="flex gap-4 w-full md:w-auto">
                 <input 
                   type="text" 
                   placeholder="جستجوی موضوع..." 
                   value={searchTopic}
                   onChange={e => setSearchTopic(e.target.value)}
                   className="dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-xl px-4 py-2 text-xs text-right outline-none focus:border-blue-500"
                 />
                 <select 
                   value={inviteFilter} 
                   onChange={e => setInviteFilter(e.target.value as any)}
                   className="dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-xl px-4 py-2 text-xs outline-none"
                 >
                    <option value="pending">جدید</option>
                    <option value="all">همه</option>
                 </select>
              </div>
            </div>
            
            <div className="space-y-6">
              {filteredInvitations.map(invite => (
                <div key={invite.id} className="dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 p-8 rounded-[2.5rem] flex flex-col md:flex-row gap-8 items-center shadow-xl hover:shadow-blue-500/5 transition-all">
                   <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-3xl text-blue-500 shrink-0 border border-blue-500/20">
                     <i className="fas fa-chess-board"></i>
                   </div>
                   <div className="flex-1 text-right">
                      <h4 className="text-xl font-black dark:text-white text-slate-900 mb-2">{invite.topic}</h4>
                      <p className="text-xs dark:text-slate-500 text-slate-400 font-bold">فرستنده: {invite.inviterName}</p>
                   </div>
                   {invite.status === 'pending' ? (
                     <div className="flex gap-3">
                        <button onClick={() => onDeclineInvite(invite.id)} className="px-6 py-4 rounded-xl dark:bg-red-950/20 bg-red-50 text-red-500 text-xs font-black hover:bg-red-500 hover:text-white transition-all border border-red-200">رد</button>
                        <button onClick={() => onAcceptInvite(invite.id)} className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg shadow-blue-900/20 transition-all">قبول دعوت</button>
                     </div>
                   ) : (
                     <span className={`px-4 py-2 rounded-xl text-xs font-black ${invite.status === 'accepted' ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'}`}>
                       {invite.status === 'accepted' ? 'تایید شده' : 'رد شده'}
                     </span>
                   )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-2xl font-black dark:text-white text-slate-900 flex items-center gap-4">
               <i className="fas fa-history text-indigo-500"></i>
               سوابق مشارکت‌ها
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {history.map((item, idx) => (
                 <div key={idx} className="dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 p-8 rounded-[2.5rem] space-y-6 hover:shadow-2xl transition-all">
                    <div className="flex justify-between items-start">
                       <p className="text-[9px] dark:text-slate-600 text-slate-400 font-mono uppercase tracking-widest">{new Date(item.date).toLocaleDateString('fa-IR')}</p>
                       <div className="flex gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <i key={i} className={`fas fa-star text-xs ${i < item.impactScore ? 'text-amber-500' : 'dark:text-slate-800 text-slate-200'}`}></i>
                          ))}
                       </div>
                    </div>
                    <h5 className="font-black text-lg dark:text-slate-200 text-slate-800 mt-1">{item.topic}</h5>
                    <div className="pt-4 border-t dark:border-slate-800 border-slate-100 flex justify-between items-center text-xs">
                       <span className="dark:text-slate-400 text-slate-600 font-bold">تاثیرگذاری: {item.impactScore * 20}%</span>
                       <button className="text-indigo-500 font-black">گزارش نهایی</button>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>

        <div className="space-y-10">
           <h3 className="text-2xl font-black dark:text-white text-slate-900 flex items-center gap-4">
             <i className="fas fa-chart-line text-indigo-500"></i>
             پایش عملکرد
           </h3>
           <div className="dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 p-10 rounded-[3rem] space-y-10 shadow-xl">
              <div className="space-y-4 text-center">
                <p className="text-[11px] font-black dark:text-slate-600 text-slate-400 uppercase tracking-widest">امتیاز کیفی کل</p>
                <div className="flex items-end justify-center gap-4">
                  <span className="text-7xl font-black dark:text-white text-slate-900">{expert.rating}</span>
                  <span className="text-2xl text-amber-500 mb-2"><i className="fas fa-star"></i></span>
                </div>
              </div>
              
              <div className="pt-10 border-t dark:border-slate-800 border-slate-100 grid grid-cols-2 gap-8 text-center">
                <div className="space-y-2">
                   <p className="text-[10px] font-black dark:text-slate-600 text-slate-400 uppercase tracking-widest">نشست‌های موفق</p>
                   <p className="text-3xl font-black dark:text-blue-400 text-blue-600">{expert.completedSessions}</p>
                </div>
                <div className="space-y-2">
                   <p className="text-[10px] font-black dark:text-slate-600 text-slate-400 uppercase tracking-widest">ضریب نفوذ کلام</p>
                   <p className="text-3xl font-black dark:text-emerald-400 text-emerald-600">۸۷٪</p>
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ExpertDashboard;
