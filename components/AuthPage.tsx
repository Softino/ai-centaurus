
import React, { useState } from 'react';
import { CentaurIcon } from './Sidebar';
import { MainDomain, Expert } from '../types';

interface AuthPageProps {
  onLogin: (role: 'architect' | 'expert', profile?: any) => void;
}

const EXPERT_ICONS = [
  'fa-brain-circuit',
  'fa-gavel',
  'fa-chart-line-up',
  'fa-user-graduate',
  'fa-handshake',
  'fa-microscope',
  'fa-scales-balanced',
  'fa-earth-americas'
];

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [view, setView] = useState<'landing' | 'register-expert'>('landing');
  
  // Expert Registration State
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [domain, setDomain] = useState<MainDomain>('Technology');
  const [specialties, setSpecialties] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(EXPERT_ICONS[0]);

  const handleExpertRegister = () => {
    if (!name || !title || !specialties) return;
    
    const profile: Partial<Expert> = {
      name,
      title,
      bio: bio || 'عضو خبره شبکه قنطورس',
      domain,
      specialties: specialties.split(',').map(s => s.trim()).filter(s => s !== ''),
      icon: selectedIcon,
      category: 'specific' // Default to specific for self-registered experts
    };
    
    onLogin('expert', profile);
  };

  if (view === 'register-expert') {
    return (
      <div className="min-h-screen bg-[#010409] flex items-center justify-center p-8 overflow-hidden relative">
        <div className="absolute inset-0 bg-blue-600/5 blur-[150px] animate-pulse rounded-full"></div>
        <div className="bg-slate-900/80 backdrop-blur-3xl border border-slate-800 w-full max-w-3xl rounded-[4rem] p-16 space-y-12 relative z-10 text-right shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
           <button onClick={() => setView('landing')} className="absolute top-10 left-10 text-slate-500 hover:text-white transition-all"><i className="fas fa-arrow-left text-xl"></i></button>
           <header className="space-y-4">
              <h2 className="text-4xl font-black text-white">ثبت‌نام در شبکه خبرگان</h2>
              <p className="text-slate-500 font-bold">هویت دیجیتال خود را برای حضور در نشست‌های استراتژیک بسازید.</p>
           </header>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-4">نام و نام خانوادگی</label>
                <input value={name} onChange={e => setName(e.target.value)} type="text" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-8 py-5 text-white outline-none focus:border-blue-500 shadow-inner" placeholder="نام شما..." />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-4">عنوان تخصص</label>
                <input value={title} onChange={e => setTitle(e.target.value)} type="text" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-8 py-5 text-white outline-none focus:border-blue-500 shadow-inner" placeholder="مثلاً: تحلیلگر ارشد..." />
              </div>
           </div>

           <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-4">انتخاب آیکون شناسه</label>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-4 bg-slate-950 p-6 rounded-3xl border border-slate-800">
                 {EXPERT_ICONS.map(icon => (
                   <button 
                      key={icon} 
                      onClick={() => setSelectedIcon(icon)}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all ${selectedIcon === icon ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-900 text-slate-600 hover:text-white border border-slate-800'}`}
                   >
                     <i className={`fas ${icon}`}></i>
                   </button>
                 ))}
              </div>
           </div>

           <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-4">قلمرو فعالیت</label>
             <select value={domain} onChange={e => setDomain(e.target.value as any)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-8 py-5 text-white outline-none focus:border-blue-500 shadow-inner appearance-none cursor-pointer">
                <option value="Technology">Technology</option>
                <option value="Economy">Economy</option>
                <option value="Governance">Governance</option>
                <option value="Society & Culture">Society & Culture</option>
             </select>
           </div>

           <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-4">مهارت‌ها (جدا شده با ویرگول)</label>
             <input value={specialties} onChange={e => setSpecialties(e.target.value)} type="text" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-8 py-5 text-white outline-none focus:border-blue-500 shadow-inner" placeholder="مهارت ۱، مهارت ۲..." />
           </div>

           <button onClick={handleExpertRegister} className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-blue-900/40 transition-all active:scale-95">تکمیل پروفایل و ورود</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#010409] text-white flex flex-col items-center justify-center p-8 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,#1e40af,transparent_50%)]"></div>
      
      <div className="z-10 text-center space-y-12 max-w-5xl">
         <div className="flex flex-col items-center space-y-6">
            <div className="w-32 h-32 bg-blue-600 rounded-[3rem] flex items-center justify-center text-white shadow-[0_0_70px_rgba(37,99,235,0.4)] animate-pulse mb-4 border border-blue-400/30 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
              <CentaurIcon className="w-20 h-20 relative z-10" />
            </div>
            <h1 className="text-8xl font-black tracking-tighter bg-gradient-to-b from-white to-slate-500 bg-clip-text text-transparent">قنطورس</h1>
            <p className="text-xl text-slate-400 font-bold max-w-2xl leading-relaxed">
              تلاقی همکاری‌های استراتژیک هوش مصنوعی و نخبگان انسانی.
            </p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mx-auto">
            <div 
              onClick={() => onLogin('architect', { name: 'معمار سیستم' })}
              className="group bg-slate-900/40 border border-slate-800 p-12 rounded-[3.5rem] cursor-pointer hover:bg-blue-600/5 hover:border-blue-500/50 transition-all flex flex-col items-center gap-6"
            >
               <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-3xl text-blue-500 group-hover:scale-110 transition-all">
                 <i className="fas fa-sign-in-alt"></i>
               </div>
               <div className="space-y-2">
                 <h3 className="text-2xl font-black group-hover:text-blue-400 transition-all">ورود به سیستم</h3>
                 <p className="text-xs text-slate-500 font-bold leading-relaxed">دسترسی مستقیم به میز کار معماری و مدیریت ایجنت‌ها.</p>
               </div>
            </div>

            <div 
              onClick={() => setView('register-expert')}
              className="group bg-slate-900/40 border border-slate-800 p-12 rounded-[3.5rem] cursor-pointer hover:bg-indigo-600/5 hover:border-indigo-500/50 transition-all flex flex-col items-center gap-6"
            >
               <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-3xl text-indigo-500 group-hover:scale-110 transition-all">
                 <i className="fas fa-user-graduate"></i>
               </div>
               <div className="space-y-2">
                 <h3 className="text-2xl font-black group-hover:text-indigo-400 transition-all">ورود خبره</h3>
                 <p className="text-xs text-slate-500 font-bold leading-relaxed">ارائه تخصص در لایه‌های تصمیم‌گیری به عنوان نیروی انسانی.</p>
               </div>
            </div>
         </div>
      </div>

      <div className="absolute bottom-10 flex items-center gap-3 text-slate-600 font-black text-[10px] uppercase tracking-[0.4em]">
        <CentaurIcon className="w-4 h-4" />
        CENTAURUS STRATEGIC ENGINE • V2.95
      </div>
    </div>
  );
};

export default AuthPage;
