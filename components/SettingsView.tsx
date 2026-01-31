
import React, { useState } from 'react';
import { CentaurIcon } from './Sidebar';

interface SettingsViewProps {
  proxyUrl: string;
  onSaveProxy: (url: string) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ proxyUrl, onSaveProxy }) => {
  const [url, setUrl] = useState(proxyUrl);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    onSaveProxy(url);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="p-12 max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700">
      <header className="border-b dark:border-slate-900 border-slate-200 pb-10">
        <h2 className="text-4xl font-black dark:text-white text-slate-900">تنظیمات سیستمی قنطورس</h2>
        <p className="dark:text-slate-500 text-slate-600 text-sm mt-3 font-bold">پیکربندی زیرساخت‌های ارتباطی و پارامترهای جهانی پلتفرم.</p>
      </header>

      <section className="dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-[3rem] p-12 space-y-8 shadow-2xl">
        <div className="flex items-center gap-6 mb-4">
           <div className="w-16 h-16 rounded-2xl bg-blue-600/10 flex items-center justify-center text-3xl text-blue-500 border border-blue-500/20">
             <i className="fas fa-network-wired"></i>
           </div>
           <div className="text-right">
             <h3 className="text-2xl font-black dark:text-white text-slate-900">سرور پروکسی (AI Proxy)</h3>
             <p className="text-xs dark:text-slate-500 text-slate-400 font-bold mt-1 uppercase tracking-widest">Global API Gateway Configuration</p>
           </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm dark:text-slate-400 text-slate-600 leading-relaxed font-medium">
            اگر برای دسترسی به Gemini API نیاز به استفاده از پروکسی یا گیت‌وی اختصاصی دارید، آدرس کامل آن را در این بخش وارد کنید. در صورت خالی بودن، درخواست‌ها به صورت مستقیم به سرورهای گوگل ارسال خواهند شد.
          </p>
          
          <div className="relative group">
            <input 
              type="text" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-proxy-domain.com/v1beta"
              className="w-full dark:bg-slate-950 bg-slate-50 border dark:border-slate-800 border-slate-200 rounded-2xl px-12 py-6 text-lg dark:text-white text-slate-900 outline-none focus:border-blue-500 transition-all shadow-inner font-mono ltr"
              dir="ltr"
            />
            <i className="fas fa-link absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors"></i>
          </div>
          
          <p className="text-[10px] dark:text-slate-600 text-slate-400 font-bold italic">
            نمونه: https://myproxy.ir/v1beta (باید شامل پروتکل و نسخه باشد)
          </p>
        </div>

        <div className="pt-8 border-t dark:border-slate-800 border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {isSaved && (
              <span className="text-emerald-500 text-sm font-black flex items-center gap-2 animate-in slide-in-from-right-2">
                <i className="fas fa-check-circle"></i> تنظیمات با موفقیت ذخیره شد
              </span>
            )}
          </div>
          <button 
            onClick={handleSave}
            className="px-12 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black shadow-xl shadow-blue-900/40 transition-all active:scale-95"
          >
            ذخیره و به‌روزرسانی زیرساخت
          </button>
        </div>
      </section>

      <footer className="flex items-center justify-center gap-3 text-slate-600 font-black text-[10px] uppercase tracking-[0.4em] pt-20">
        <CentaurIcon className="w-4 h-4" />
        CENTAURUS INFRASTRUCTURE ENGINE v1.1
      </footer>
    </div>
  );
};

export default SettingsView;
