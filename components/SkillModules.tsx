
import React, { useEffect, useState } from 'react';
import { IELTSSkill, PracticeModule, UserProfile } from '../types';
import { gemini } from '../services/geminiService';

interface SkillModulesProps {
  user: UserProfile;
  skill: IELTSSkill;
  onSelectModule: (module: PracticeModule) => void;
  onBack: () => void;
}

const SkillModules: React.FC<SkillModulesProps> = ({ user, skill, onSelectModule, onBack }) => {
  const [modules, setModules] = useState<PracticeModule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await gemini.getPracticeModules(skill, user.estimatedBand || 5.5, user.type);
        setModules(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [skill, user]);

  return (
    <div className="animate-in slide-in-from-bottom duration-500">
      <div className="flex items-center gap-6 mb-12">
        <button onClick={onBack} className="p-4 bg-white rounded-full shadow-sm hover:bg-slate-50 transition-all border border-slate-100">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div>
          <h2 className="text-4xl font-black text-slate-900 capitalize">{skill} Practice</h2>
          <p className="text-slate-500 font-bold">Pick a focus area for Band {user.estimatedBand}</p>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white animate-pulse rounded-3xl border border-slate-100"></div>)}
        </div>
      ) : (
        <div className="grid gap-6">
          {modules.map(mod => (
            <button
              key={mod.id}
              onClick={() => onSelectModule(mod)}
              className="group flex items-center justify-between p-8 bg-white rounded-[2.5rem] border-4 border-slate-50 hover:border-blue-600 transition-all text-left shadow-sm hover:shadow-xl"
            >
              <div>
                <div className="text-xs font-black text-blue-500 uppercase tracking-widest mb-1">{mod.type}</div>
                <h3 className="text-2xl font-black text-slate-800">{mod.title}</h3>
                <p className="text-slate-500 font-medium">{mod.description}</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-slate-50 group-hover:bg-blue-600 flex items-center justify-center transition-all">
                 <svg className="w-6 h-6 text-slate-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7"/></svg>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SkillModules;
