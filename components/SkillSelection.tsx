
import React from 'react';
import { IELTSSkill } from '../types';

interface SkillSelectionProps {
  onSelect: (skill: IELTSSkill) => void;
  onBack: () => void;
}

const SkillSelection: React.FC<SkillSelectionProps> = ({ onSelect, onBack }) => {
  const skills = [
    { id: 'reading', label: 'Reading', color: 'bg-emerald-500', icon: '📖', desc: 'Passages & Questions' },
    { id: 'writing', label: 'Writing', color: 'bg-purple-500', icon: '✍️', desc: 'Task 1 & Task 2 Feedback' },
    { id: 'listening', label: 'Listening', color: 'bg-orange-500', icon: '🎧', desc: 'Comprehension Drills' },
    { id: 'speaking', label: 'Speaking', color: 'bg-blue-500', icon: '🗣️', desc: 'Mock Interviews & Feedback' },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-slate-200 rounded-full transition-colors"
        >
          <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="text-3xl font-bold text-slate-900">Choose a Skill</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {skills.map((skill) => (
          <button
            key={skill.id}
            onClick={() => onSelect(skill.id as IELTSSkill)}
            className="flex items-center gap-6 p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left group"
          >
            <div className={`w-20 h-20 ${skill.color} rounded-2xl flex items-center justify-center text-3xl text-white shadow-lg`}>
              {skill.icon}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{skill.label}</h3>
              <p className="text-slate-500">{skill.desc}</p>
              <div className="mt-2 text-sm font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Start Practice →
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SkillSelection;
