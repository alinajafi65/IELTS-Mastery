import React, { useState } from 'react';
import { UserProfile, IELTSSkill } from '../types';
// FIX: Added 'Library' to the imported icons from lucide-react
import { Search, Filter, CheckCircle, Circle, ArrowLeft, Trash2, Calendar, Library } from 'lucide-react';

interface VocabularyVaultProps {
  user: UserProfile;
  onToggleMastery: (word: string) => void;
  onBack: () => void;
}

const VocabularyVault: React.FC<VocabularyVaultProps> = ({ user, onToggleMastery, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [skillFilter, setSkillFilter] = useState<IELTSSkill | 'all'>('all');

  const filteredVocab = user.vocabVault.filter(item => {
    const matchesSearch = item.word.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSkill = skillFilter === 'all' || item.skill === skillFilter;
    return matchesSearch && matchesSkill;
  }).sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());

  const stats = {
    total: user.vocabVault.length,
    mastered: user.vocabVault.filter(v => v.mastered).length,
    learning: user.vocabVault.filter(v => !v.mastered).length,
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors mb-4 font-black uppercase text-[10px] tracking-widest">
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Vocab Vault</h1>
          <p className="text-slate-500 font-medium mt-2">Centralized lexicon harvested from your practice sessions.</p>
        </div>

        <div className="flex gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center min-w-[100px]">
            <div className="text-2xl font-black text-blue-600">{stats.mastered}</div>
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mastered</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center min-w-[100px]">
            <div className="text-2xl font-black text-slate-400">{stats.learning}</div>
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Learning</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 p-8">
        <div className="flex flex-col lg:flex-row gap-6 mb-10">
          <div className="flex-1 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input 
              type="text" 
              placeholder="Search words..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-slate-50 border-none rounded-[1.8rem] font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-inner"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['all', 'reading', 'listening', 'writing', 'speaking'].map(s => (
              <button
                key={s}
                onClick={() => setSkillFilter(s as any)}
                className={`px-6 py-5 rounded-[1.8rem] font-black text-xs uppercase tracking-widest border-2 transition-all whitespace-nowrap ${
                  skillFilter === s 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
                    : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVocab.length === 0 ? (
            <div className="col-span-full py-20 text-center opacity-30">
              {/* FIX: Using the now correctly imported Library icon */}
              <Library size={64} className="mx-auto mb-4" />
              <p className="font-black uppercase tracking-widest">No words found in this category</p>
            </div>
          ) : (
            filteredVocab.map((item) => (
              <div 
                key={item.word} 
                className={`group p-8 rounded-[2.5rem] border-4 transition-all ${
                  item.mastered 
                    ? 'bg-emerald-50/30 border-emerald-100/50' 
                    : 'bg-white border-slate-50 hover:border-blue-100'
                }`}
              >
                <div className="flex justify-between items-start mb-6">
                  <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                    item.skill === 'reading' ? 'bg-emerald-100 text-emerald-700' :
                    item.skill === 'listening' ? 'bg-orange-100 text-orange-700' :
                    item.skill === 'writing' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {item.skill}
                  </span>
                  <button 
                    onClick={() => onToggleMastery(item.word)}
                    className={`p-2 rounded-xl transition-all ${
                      item.mastered ? 'text-emerald-500 bg-emerald-100' : 'text-slate-200 bg-slate-50 hover:bg-blue-50 hover:text-blue-500'
                    }`}
                  >
                    {item.mastered ? <CheckCircle size={20} /> : <Circle size={20} />}
                  </button>
                </div>
                
                <h3 className={`text-2xl font-black tracking-tight mb-2 ${item.mastered ? 'text-emerald-900 line-through opacity-50' : 'text-slate-900'}`}>
                  {item.word}
                </h3>
                
                <div className="flex items-center gap-2 text-slate-400">
                  <Calendar size={12} />
                  <span className="text-[10px] font-bold">{new Date(item.dateAdded).toLocaleDateString()}</span>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100/50 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <button className="text-[10px] font-black uppercase text-blue-600 hover:underline">View Context</button>
                   <button className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default VocabularyVault;