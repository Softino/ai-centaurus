
import React, { useState, useMemo, useEffect } from 'react';
import { SessionReport as ReportType } from '../types';

interface SessionReportProps {
  report: ReportType;
  audioUrl?: string;
  onClose: () => void;
}

const SessionReport: React.FC<SessionReportProps> = ({ report, audioUrl, onClose }) => {
  const [ratings, setRatings] = useState<Record<string, number>>(report.agentRatings || {});

  const handlePrint = () => {
    window.print();
  };

  // Get unique agents from timeline or takeaways to list them for rating
  const participatingAgents = useMemo(() => {
    const agents = new Set<string>();
    report.timeline.forEach(t => agents.add(t.agentName));
    if (report.keyTakeaways) {
        report.keyTakeaways.forEach(t => agents.add(t.agentName));
    }
    return Array.from(agents);
  }, [report]);

  const handleRate = (agentName: string, rating: number) => {
    const newRatings = { ...ratings, [agentName]: rating };
    setRatings(newRatings);
    
    // Persist ratings to localStorage by updating the specific report in the saved list
    const savedReportsStr = localStorage.getItem('centaurus_saved_reports');
    if (savedReportsStr) {
        try {
            const savedReports: ReportType[] = JSON.parse(savedReportsStr);
            const updatedReports = savedReports.map(r => 
                r.sessionId === report.sessionId ? { ...r, agentRatings: newRatings } : r
            );
            localStorage.setItem('centaurus_saved_reports', JSON.stringify(updatedReports));
        } catch (e) {
            console.error("Failed to save ratings", e);
        }
    }
  };

  const today = new Date().toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-2xl z-[100] flex items-center justify-center p-4 overflow-y-auto">
      {/* Container for the paper/document */}
      <div className="bg-white w-full max-w-[210mm] min-h-[297mm] mx-auto shadow-2xl relative text-slate-900 print:w-full print:max-w-none print:shadow-none animate-in zoom-in-95 duration-500 flex flex-col">
        
        {/* Actions Bar (Hidden on Print) */}
        <div className="absolute -top-16 left-0 right-0 flex justify-between items-center print:hidden px-4">
           <button onClick={onClose} className="px-6 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-all">
             <i className="fas fa-times mr-2"></i> بستن
           </button>
           <div className="flex gap-3">
              {audioUrl && (
                <a href={audioUrl} download={`Session_${report.sessionId}.webm`} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 transition-all">
                  <i className="fas fa-download mr-2"></i> دانلود صوت
                </a>
              )}
              <button onClick={handlePrint} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-500 transition-all shadow-lg">
                <i className="fas fa-print mr-2"></i> چاپ / ذخیره PDF
              </button>
           </div>
        </div>

        {/* Report Content (A4 Style) */}
        <div className="p-[20mm] flex flex-col h-full font-vazir">
            
            {/* Header */}
            <header className="border-b-4 border-slate-900 pb-6 mb-10 flex justify-between items-end">
                <div className="text-right">
                    <h1 className="text-4xl font-black mb-2 text-slate-900">صورت‌جلسه استراتژیک</h1>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">پلتفرم هوشمند قنطورس (Centaurus)</p>
                </div>
                <div className="text-left space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase">شناسه نشست</p>
                    <p className="text-sm font-mono font-black">{report.sessionId}</p>
                    <p className="text-xs font-bold text-slate-400 mt-2">تاریخ</p>
                    <p className="text-sm font-black">{today}</p>
                </div>
            </header>

            {/* Subject */}
            <section className="mb-10 bg-slate-50 p-6 rounded-none border-l-4 border-blue-600">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">موضوع نشست</h3>
                <p className="text-xl font-black leading-tight">{report.topic}</p>
            </section>

            {/* Executive Summary */}
            <section className="mb-10">
                <h2 className="text-lg font-black bg-slate-900 text-white inline-block px-4 py-1 mb-4">۱. خلاصه اجرایی</h2>
                <p className="text-justify leading-8 text-base font-medium text-slate-700">
                    {report.summary}
                </p>
            </section>

            {/* Key Insights */}
            <section className="mb-10">
                <h2 className="text-lg font-black bg-slate-900 text-white inline-block px-4 py-1 mb-4">۲. یافته‌های کلیدی</h2>
                <ul className="list-disc pr-5 space-y-3 marker:text-blue-600">
                    {report.keyInsights.map((insight, idx) => (
                        <li key={idx} className="text-base text-slate-700 font-medium pl-2 leading-7">
                            {insight}
                        </li>
                    ))}
                </ul>
            </section>

            {/* Key Takeaways per Agent (NEW SECTION) */}
            {report.keyTakeaways && report.keyTakeaways.length > 0 && (
                <section className="mb-10 break-inside-avoid">
                    <h2 className="text-lg font-black bg-slate-900 text-white inline-block px-4 py-1 mb-4">۳. برداشت‌های کلیدی هر عامل</h2>
                    <div className="grid grid-cols-1 gap-4">
                        {report.keyTakeaways.map((item, idx) => (
                            <div key={idx} className="bg-indigo-50 border-r-4 border-indigo-500 p-4">
                                <h4 className="font-black text-sm text-indigo-800 mb-2">{item.agentName}</h4>
                                <p className="text-sm text-slate-700 leading-6 text-justify">
                                    {item.takeaway}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Minutes (Timeline) */}
            <section className="mb-10 break-inside-avoid">
                <h2 className="text-lg font-black bg-slate-900 text-white inline-block px-4 py-1 mb-6">۴. مشروح مذاکرات (Minutes)</h2>
                <div className="border-r-2 border-slate-200 pr-6 space-y-6">
                    {report.timeline && report.timeline.length > 0 ? (
                        report.timeline.map((item, idx) => (
                            <div key={idx} className="relative">
                                <div className="absolute -right-[31px] top-1 w-4 h-4 rounded-full bg-white border-4 border-slate-300"></div>
                                <h4 className="font-black text-sm text-blue-800 mb-1">{item.agentName}</h4>
                                <p className="text-sm text-slate-600 leading-6 text-justify bg-slate-50 p-3 border border-slate-100">
                                    {item.keyContribution}
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-slate-400 italic text-sm">جزئیات زمانی در دسترس نیست.</p>
                    )}
                </div>
            </section>

            {/* Risk Matrix */}
            <section className="mb-10 break-inside-avoid">
                <h2 className="text-lg font-black bg-slate-900 text-white inline-block px-4 py-1 mb-4">۵. تحلیل ریسک</h2>
                <div className="grid grid-cols-2 gap-4">
                    {report.riskMatrix.map((risk, idx) => (
                        <div key={idx} className="border border-slate-200 p-4 bg-white flex justify-between items-center">
                            <span className="font-bold text-sm text-slate-800">{risk.threat}</span>
                            <span className={`text-xs font-black px-2 py-1 uppercase ${
                                risk.impact.includes('High') || risk.impact.includes('بالا') ? 'bg-red-100 text-red-700' :
                                risk.impact.includes('Medium') || risk.impact.includes('متوسط') ? 'bg-amber-100 text-amber-700' :
                                'bg-emerald-100 text-emerald-700'
                            }`}>
                                {risk.impact}
                            </span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Conclusion */}
            <section className="mt-auto break-inside-avoid bg-slate-900 text-white p-8">
                <h2 className="text-lg font-black text-blue-400 mb-4 uppercase tracking-widest border-b border-slate-700 pb-2">۶. نتیجه‌گیری و اقدام بعدی</h2>
                <p className="text-lg leading-relaxed font-medium text-justify">
                    {report.finalDecision}
                </p>
            </section>

            {/* Agent Feedback Section (NEW - Only visible on screen, hidden on print) */}
            <section className="mt-10 break-inside-avoid print:hidden bg-blue-50 border border-blue-100 p-6 rounded-2xl">
                <h2 className="text-lg font-black text-blue-800 mb-4 flex items-center gap-2">
                    <i className="fas fa-star text-amber-500"></i>
                    ارزیابی عملکرد عوامل
                </h2>
                <p className="text-xs text-blue-600 mb-6 font-bold">لطفاً میزان اثربخشی هر عامل در این نشست را برای بهبود مدل‌های آتی امتیاز دهید.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {participatingAgents.map((agentName) => (
                        <div key={agentName} className="flex justify-between items-center bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                            <span className="font-bold text-sm text-slate-700">{agentName}</span>
                            <div className="flex gap-1" dir="ltr">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button 
                                        key={star} 
                                        onClick={() => handleRate(agentName, star)}
                                        className={`text-lg transition-all hover:scale-110 ${
                                            (ratings[agentName] || 0) >= star ? 'text-amber-500' : 'text-slate-300 hover:text-amber-300'
                                        }`}
                                    >
                                        <i className="fas fa-star"></i>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="mt-10 pt-6 border-t border-slate-300 flex justify-between items-center text-xs text-slate-500 font-bold">
                <p>تولید شده توسط هوش مصنوعی قنطورس</p>
                <p>محرمانه - داخلی</p>
            </footer>

        </div>
      </div>
      
      <style>{`
        @media print {
            body { background: white; }
            .fixed { position: static; overflow: visible; background: white; }
            .print\\:hidden { display: none !important; }
            .shadow-2xl { shadow: none !important; box-shadow: none !important; }
            .max-w-\\[210mm\\] { max-width: none !important; width: 100% !important; }
            .min-h-\\[297mm\\] { min-height: auto !important; }
            .p-\\[20mm\\] { padding: 0 !important; }
            /* Force background colors print */
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
};

export default SessionReport;
