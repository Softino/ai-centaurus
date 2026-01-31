
import React, { useState, useMemo } from 'react';
import { Expert, MainDomain, ExpertInvitation } from '../types';

interface ExpertDirectoryProps {
  experts: Expert[];
  onInvite: (expert: Expert) => void;
  onAddToSession: (expert: Expert) => void;
  sentInvitations: ExpertInvitation[];
  isSessionRunning: boolean;
}

const ExpertDirectory: React.FC<ExpertDirectoryProps> = ({ 
  experts, 
  onInvite, 
  onAddToSession, 
  sentInvitations, 
  isSessionRunning 
}) => {
  const [categoryTab, setCategoryTab] = useState<'agnostic' | 'specific'>('agnostic');
  const [search, setSearch] = useState('');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [view, setView] = useState<'browse' | 'invitations'>('browse');

  // New Filter States
  const [selectedDomains, setSelectedDomains] = useState<MainDomain[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  // Extract unique values for filters
  const availableDomains = useMemo(() => Array.from(new Set(experts.map(e => e.domain))), [experts]);
  const availableSpecialties = useMemo(() => Array.from(new Set(experts.flatMap(e => e.specialties))), [experts]);

  const filteredExperts = useMemo(() => {
    return experts.filter(exp => {
      const matchesCategory = exp.category === categoryTab;
      const matchesSearch = exp.name.toLowerCase().includes(search.toLowerCase()) || 
                          exp.title.toLowerCase().includes(search.toLowerCase()) || 
                          exp.specialties.some(s => s.toLowerCase().includes(search.toLowerCase()));
      
      const matchesDomain = selectedDomains.length === 0 || selectedDomains.includes(exp.domain);
      const matchesSpecialty = selectedSpecialties.length === 0 || exp.specialties.some(s => selectedSpecialties.includes(s));
      const matchesAvailability = !showOnlyAvailable || exp.status === 'available';

      return matchesCategory && matchesSearch && matchesDomain && matchesSpecialty && matchesAvailability;
    });
  }, [categoryTab, search, selectedDomains, selectedSpecialties, experts, showOnlyAvailable]);

  const toggleFilter = <T,>(list: T[], setList: (l: T[]) => void, item: T) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const invitationStatusColor = (status: string) => {
    switch(status) {
      case 'accepted': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'declined': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    }
  };

  const invitationStatusLabel = (status: string) => {
    switch(status) {
      case 'accepted': return 'پذیرفته شده';
      case 'declined': return 'رد شده';
      default: return 'در انتظار';
    }
  };

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b dark:border-slate-900 border-slate-200 pb-10 gap-6">
        <div className="text-right flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest mb-4">
            <i className="fas fa-bolt"></i> خرد انسانی در زمان واقعی
          </div>
          <h2 className="text-4xl font-black dark:text-white text-slate-900">شبکه خبرگان هوشمند</h2>
          <p className="dark:text-slate-500 text-slate-600 text-sm mt-3 font-bold">متخصصانی را فراخوانی کنید که در این لحظه آماده همکاری و حضور در نشست هستند.</p>
          
          <div className="flex flex-col md:flex-row gap-6 mt-8">
            <div className="flex gap-2">
              <button 
                onClick={() => setView('browse')}
                className={`px-8 py-3 rounded-2xl text-[11px] font-black transition-all ${view === 'browse' ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/20' : 'dark:bg-slate-900 bg-slate-100 dark:text-slate-400 text-slate-500'}`}
              >
                <i className="fas fa-search ml-2"></i> مرور شبکه
              </button>
              <button 
                onClick={() => setView('invitations')}
                className={`px-8 py-3 rounded-2xl text-[11px] font-black transition-all relative ${view === 'invitations' ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/20' : 'dark:bg-slate-900 bg-slate-100 dark:text-slate-400 text-slate-500'}`}
              >
                <i className="fas fa-paper-plane ml-2"></i> دعوتنامه‌های ارسالی
                {sentInvitations.length > 0 && (
                  <span className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center font-black animate-bounce shadow-lg">
                    {sentInvitations.length}
                  </span>
                )}
              </button>
            </div>

            {view === 'browse' && (
              <div className="flex gap-2 p-1.5 dark:bg-slate-950 bg-slate-100 rounded-2xl border dark:border-slate-800 border-slate-200">
                <button 
                  onClick={() => setCategoryTab('agnostic')} 
                  className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${categoryTab === 'agnostic' ? 'bg-blue-600 text-white shadow-lg' : 'dark:text-slate-500 text-slate-500 hover:text-white'}`}
                >
                  مشاوران عمومی
                </button>
                <button 
                  onClick={() => setCategoryTab('specific')} 
                  className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${categoryTab === 'specific' ? 'bg-indigo-600 text-white shadow-lg' : 'dark:text-slate-500 text-slate-500 hover:text-white'}`}
                >
                  متخصصان موضوعی
                </button>
              </div>
            )}
          </div>
        </div>

        {view === 'browse' && (
          <div className="flex flex-col gap-4 w-full md:w-auto items-end">
             <div className="relative w-full md:w-80">
                <input 
                  type="text" 
                  placeholder="جستجو بر اساس نام..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="dark:bg-slate-950 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl px-6 py-4 text-sm text-right focus:border-blue-500 outline-none w-full shadow-sm"
                />
                <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-500"></i>
            </div>
            <button 
              onClick={() => setShowOnlyAvailable(!showOnlyAvailable)}
              className={`px-6 py-3 rounded-2xl text-[11px] font-black border transition-all flex items-center gap-3 w-full md:w-auto justify-center ${showOnlyAvailable ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-lg' : 'dark:bg-slate-950 bg-white dark:border-slate-800 border-slate-200 dark:text-slate-500 text-slate-500 hover:border-blue-500/30'}`}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${showOnlyAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
              فقط افراد آنلاین
            </button>
          </div>
        )}
      </header>

      {view === 'browse' && (
        <div className="space-y-8">
           {/* Filters Section */}
           <div className="dark:bg-slate-900/50 bg-slate-50 border dark:border-slate-800 border-slate-200 p-6 rounded-3xl space-y-6">
             <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">فیلتر دامنه تخصصی (Domain)</label>
               <div className="flex flex-wrap gap-2">
                 {availableDomains.map(domain => (
                   <button
                     key={domain}
                     onClick={() => toggleFilter(selectedDomains, setSelectedDomains, domain)}
                     className={`px-4 py-2 rounded-xl text-[10px] font-black border transition-all ${selectedDomains.includes(domain) ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'dark:bg-slate-950 bg-white dark:border-slate-800 border-slate-200 dark:text-slate-500 text-slate-600'}`}
                   >
                     {domain}
                   </button>
                 ))}
               </div>
             </div>
             <div className="h-px dark:bg-slate-800 bg-slate-200"></div>
             <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">فیلتر مهارت‌ها (Specialties)</label>
               <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                 {availableSpecialties.map(spec => (
                   <button
                     key={spec}
                     onClick={() => toggleFilter(selectedSpecialties, setSelectedSpecialties, spec)}
                     className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${selectedSpecialties.includes(spec) ? 'bg-blue-600 border-blue-500 text-white shadow-md' : 'dark:bg-slate-950 bg-white dark:border-slate-800 border-slate-200 dark:text-slate-500 text-slate-600'}`}
                   >
                     {spec}
                   </button>
                 ))}
               </div>
             </div>
           </div>

           {/* Experts Grid */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredExperts.map(expert => {
              const invite = sentInvitations.find(i => i.expertId === expert.id);
              const isInvited = !!invite;
              const isAvailable = expert.status === 'available';
              
              return (
                <div 
                  key={expert.id} 
                  className={`group dark:bg-slate-900/40 bg-white border-2 rounded-[3rem] p-10 transition-all duration-500 hover:shadow-2xl flex flex-col relative overflow-hidden ${
                    isAvailable 
                    ? 'border-emerald-500/30 dark:bg-emerald-950/5 shadow-emerald-500/5' 
                    : 'dark:border-slate-900 border-slate-200'
                  }`}
                >
                  {/* Visual Availability Indicator */}
                  {isAvailable && (
                    <div className="absolute top-0 right-0 p-4">
                      <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-10">
                    <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center text-5xl shadow-2xl transition-all duration-500 group-hover:scale-110 ${
                      isAvailable ? 'bg-emerald-600 text-white shadow-emerald-900/30' : 'dark:bg-slate-950 bg-slate-50 dark:text-slate-700 text-slate-300 border dark:border-slate-800 border-slate-200'
                    }`}>
                      <i className={`fas ${expert.icon}`}></i>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-3 border transition-colors ${
                        expert.status === 'available' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/5 text-amber-500/50 border-amber-500/10'
                      }`}>
                        {expert.status === 'available' ? 'Available Now' : 'Busy'}
                      </span>
                      <div className="flex gap-1 text-amber-400 text-xs">
                        {Array.from({ length: 5 }).map((_, i) => <i key={i} className={`fas fa-star ${i < Math.floor(expert.rating) ? '' : 'opacity-20'}`}></i>)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-8">
                    <h3 className="text-2xl font-black dark:text-white text-slate-900 leading-none">{expert.name}</h3>
                    <p className="text-sm font-bold text-blue-500">{expert.title}</p>
                  </div>

                  <p className="text-sm dark:text-slate-400 text-slate-600 leading-relaxed mb-8 line-clamp-3 min-h-[4.5rem] antialiased">
                    {expert.bio}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-10">
                    {expert.specialties.map(s => (
                      <span key={s} className="text-[10px] font-black px-3 py-1.5 rounded-xl dark:bg-slate-950 bg-slate-50 dark:text-slate-500 text-slate-400 border dark:border-slate-900 border-slate-200">{s}</span>
                    ))}
                  </div>

                  <div className="mt-auto pt-8 border-t dark:border-slate-900/50 border-slate-100 flex items-center justify-between">
                    <div className="text-right">
                      <p className="text-[9px] font-black dark:text-slate-600 text-slate-500 uppercase mb-1 tracking-widest">مجموع نشست‌ها</p>
                      <p className="text-sm font-black dark:text-slate-300 text-slate-800">{expert.completedSessions}+ نشست</p>
                    </div>
                    
                    <div className="flex gap-3">
                      {isSessionRunning && isAvailable ? (
                        <button 
                          onClick={() => onAddToSession(expert)}
                          className="px-8 py-4 rounded-[1.5rem] text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xl shadow-emerald-900/40 transition-all active:scale-95 flex items-center gap-3"
                        >
                          <i className="fas fa-plus-circle"></i> ورود فوری به نشست
                        </button>
                      ) : isInvited ? (
                        <div className={`px-6 py-3 rounded-2xl text-[10px] font-black border flex items-center gap-3 ${invitationStatusColor(invite.status)}`}>
                          <i className={`fas ${invite.status === 'accepted' ? 'fa-check-circle' : 'fa-clock'}`}></i>
                          {invitationStatusLabel(invite.status)}
                        </div>
                      ) : (
                        <button 
                          onClick={() => onInvite(expert)}
                          className="px-8 py-4 rounded-[1.5rem] text-xs font-black bg-blue-600 hover:bg-blue-500 text-white shadow-2xl shadow-blue-900/40 transition-all active:scale-95"
                        >
                          ارسال دعوتنامه
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredExperts.length === 0 && (
              <div className="col-span-full py-40 text-center opacity-30 flex flex-col items-center">
                <i className="fas fa-users-slash text-8xl mb-6"></i>
                <p className="text-2xl font-black">خبری با این مشخصات یافت نشد.</p>
                <button 
                  onClick={() => { setSelectedDomains([]); setSelectedSpecialties([]); setSearch(''); setShowOnlyAvailable(false); }}
                  className="mt-4 text-sm font-bold text-blue-500 hover:text-blue-400"
                >
                  پاکسازی فیلترها
                </button>
              </div>
            )}
           </div>
        </div>
      ) : (
        <div className="space-y-6 max-w-4xl mx-auto text-right">
          {sentInvitations.length === 0 ? (
            <div className="py-40 text-center opacity-30 flex flex-col items-center border-2 border-dashed dark:border-slate-900 border-slate-100 rounded-[3rem]">
              <i className="fas fa-paper-plane text-7xl mb-8"></i>
              <p className="text-2xl font-black">هنوز دعوتنامه‌ای ارسال نشده است.</p>
            </div>
          ) : sentInvitations.map(invite => {
            const expert = experts.find(e => e.id === invite.expertId);
            return (
              <div key={invite.id} className="dark:bg-slate-900/40 bg-white border dark:border-slate-900 border-slate-200 p-8 rounded-[2.5rem] flex items-center justify-between shadow-xl transition-all hover:scale-[1.01]">
                 <div className="flex items-center gap-8">
                    <div className="w-20 h-20 rounded-3xl dark:bg-slate-950 bg-slate-50 flex items-center justify-center text-4xl text-blue-500 border dark:border-slate-800 border-slate-100">
                      <i className={`fas ${expert?.icon}`}></i>
                    </div>
                    <div className="text-right space-y-1">
                       <h4 className="font-black text-xl dark:text-white text-slate-900">{expert?.name || 'نامشخص'}</h4>
                       <p className="text-xs dark:text-slate-500 text-slate-600 font-bold">{invite.topic}</p>
                    </div>
                 </div>
                 <div className="flex flex-col items-end gap-3">
                    <span className={`px-6 py-2 rounded-full text-[10px] font-black border uppercase tracking-widest ${invitationStatusColor(invite.status)}`}>
                      {invitationStatusLabel(invite.status)}
                    </span>
                    <p className="text-[10px] dark:text-slate-600 text-slate-500 font-mono tracking-widest">{new Date(invite.timestamp).toLocaleDateString('fa-IR')}</p>
                 </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ExpertDirectory;
