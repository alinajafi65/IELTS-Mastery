
import React from 'react';
import { UserProfile, IELTSSkill } from '../types';

interface ProgressSummaryPanelProps {
  user: UserProfile;
  currentSkill: IELTSSkill;
}

const ProgressSummaryPanel: React.FC<ProgressSummaryPanelProps> = ({ user, currentSkill }) => {
  const skillProg = user.progress.find(p => p.skill === currentSkill);

  return (
    <div className="hidden xl:block w-72 h-fit bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl sticky top-8 animate-in slide-in-from-right duration-500">
      <div className="text-center mb-6">
        <div className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-1">Your Journey</div>
        <h3 className="text-xl font-black text-slate-800">Stats Summary</h3>
      </div>
      
      <div className="space-y-6">
        <div className="bg-slate-50 p-4 rounded-2xl">
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Band</div>
          <div className="text-2xl font-black text-blue-600">{user.targetBand}</div>
        </div>

        <div>
          <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            <span>{currentSkill} Mastery</span>
            <span>{Math.min((skillProg?.sessionsCompleted || 0) * 10, 100)}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all duration-1000" style={{width: `${Math.min((skillProg?.sessionsCompleted || 0) * 10, 100)}%`}}></div>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-50">
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Recent Vocabulary</div>
          <div className="flex flex-wrap gap-1">
            {skillProg?.learnedVocab.slice(-6).map((v, i) => (
              <span key={i} className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold">{v}</span>
            ))}
            {!skillProg?.learnedVocab.length && <div className="text-[10px] text-slate-300 italic">None yet</div>}
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-50">
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Recent Grammar</div>
          <div className="flex flex-wrap gap-1">
            {skillProg?.learnedGrammar.slice(-3).map((g, i) => (
              <span key={i} className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold">{g}</span>
            ))}
            {!skillProg?.learnedGrammar.length && <div className="text-[10px] text-slate-300 italic">None yet</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressSummaryPanel;
