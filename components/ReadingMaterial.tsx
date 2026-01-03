
import React from 'react';

interface ReadingMaterialProps {
  content: string;
  format?: 'newspaper' | 'academic' | 'leaflet' | 'standard';
}

const ReadingMaterial: React.FC<ReadingMaterialProps> = ({ content, format = 'newspaper' }) => {
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const displayFormat = content.toLowerCase().includes('news') ? 'newspaper' : 
                        content.toLowerCase().includes('notice') ? 'leaflet' : 
                        content.toLowerCase().includes('academic') || lines.length > 10 ? 'academic' : format;

  if (displayFormat === 'newspaper') {
    return (
      <div className="bg-[#fcfaf5] p-10 md:p-14 rounded-sm shadow-2xl border-t-[16px] border-slate-900 font-serif text-slate-900 mx-auto max-w-4xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-slate-900/5 rotate-45 -mr-12 -mt-12"></div>
        <div className="text-center border-b-4 border-slate-900 pb-8 mb-10">
          <h1 className="text-6xl font-black uppercase tracking-tighter mb-2 text-slate-900">The Global Chronicle</h1>
          <div className="flex justify-between text-[11px] font-black mt-2 uppercase tracking-[0.3em] text-slate-500 px-4">
            <span>Volume 42 • Issue 12</span>
            <span>IELTS Academic Source material</span>
            <span>Sunday Edition</span>
          </div>
        </div>
        
        <div className="columns-1 md:columns-2 gap-12 leading-relaxed text-justify">
          {lines.map((p, i) => (
            <p key={i} className={`mb-6 text-lg ${i === 0 ? "first-letter:text-7xl first-letter:font-black first-letter:float-left first-letter:mr-4 first-letter:mt-2 first-letter:text-slate-900" : ""}`}>
              {p}
            </p>
          ))}
        </div>
      </div>
    );
  }

  if (displayFormat === 'academic') {
    return (
      <div className="bg-white p-16 rounded-xl shadow-2xl border border-slate-100 font-serif leading-[2.2] text-slate-800 mx-auto max-w-3xl">
        <div className="max-w-2xl mx-auto">
          <div className="mb-12 text-center border-b border-slate-100 pb-10">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mb-6">Cambridge International Assessment</h2>
            <h1 className="text-4xl font-bold italic tracking-tight text-slate-900 leading-tight">Reading Passage 3: Systematic Analysis</h1>
          </div>
          
          <div className="mb-10 p-6 bg-slate-50 rounded-2xl border-l-8 border-blue-600 text-base italic text-slate-500 leading-relaxed shadow-sm">
            You should spend about 20 minutes on Questions 27–40, which are based on the Reading Passage below.
          </div>

          <div className="text-xl space-y-10 text-justify">
            {lines.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </div>
      </div>
    );
  }

  if (displayFormat === 'leaflet') {
    return (
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-3 rounded-[3rem] shadow-2xl max-w-2xl mx-auto group">
        <div className="bg-white p-12 rounded-[2.8rem] font-sans">
          <div className="flex justify-between items-start mb-10">
            <div className="bg-blue-100 text-blue-700 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-blue-200">
              Visitor Information Guide
            </div>
            <div className="text-slate-200 font-black text-3xl">#A-04</div>
          </div>
          
          <h2 className="text-5xl font-black text-slate-900 mb-10 leading-none tracking-tighter">Essential Safety & Policy Guidelines</h2>
          
          <div className="grid gap-8 text-slate-600 font-medium">
            {lines.map((p, i) => (
              <div key={i} className="flex gap-6 items-start bg-slate-50 p-8 rounded-[2rem] border-2 border-slate-50 group-hover:bg-blue-50/50 transition-all shadow-sm hover:shadow-md">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex-shrink-0 flex items-center justify-center text-white font-black shadow-lg shadow-blue-100 text-lg">
                  {i + 1}
                </div>
                <p className="leading-relaxed text-lg font-bold text-slate-700">{p}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-12 rounded-[3rem] border-4 border-slate-50 shadow-inner leading-relaxed max-w-3xl mx-auto font-medium text-slate-700 text-lg italic">
      <div className="space-y-6">
        {lines.map((p, i) => <p key={i}>{p}</p>)}
      </div>
    </div>
  );
};

export default ReadingMaterial;
