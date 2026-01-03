
import React from 'react';
import { UserProfile } from '../types';
import { LogOut, RefreshCcw, LayoutDashboard, History, BookOpen } from 'lucide-react';

interface DashboardProps {
  user: UserProfile;
  onStartPractice: () => void;
  onChangeType: () => void;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onStartPractice, onChangeType, onLogout }) => {
  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Header with Navigation/Logout */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <h1 className="text-6xl font-black text-slate-900 tracking-tighter">Hi, {user.name}!</h1>
            <div className="flex gap-2">
              <button 
                onClick={onChangeType}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 text-[10px] font-black uppercase rounded-xl transition-all shadow-sm active:scale-95"
              >
                <RefreshCcw className="w-3 h-3" />
                Switch to {user.type === 'academic' ? 'General' : 'Academic'}
              </button>
              <button 
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-500 text-[10px] font-black uppercase rounded-xl transition-all shadow-sm active:scale-95"
              >
                <LogOut className="w-3 h-3" />
                Reset & Sign Out
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">{user.type} Path</span>
            <p className="text-xl text-slate-500 font-medium tracking-tight">Your current estimation is <span className="text-slate-900 font-bold">Band {user.estimatedBand}</span>. Target: <span className="text-blue-600 font-bold">{user.targetBand}</span></p>
          </div>
        </div>
        
        <button 
          onClick={onStartPractice}
          className="group relative px-12 py-8 bg-slate-900 text-white text-2xl font-black rounded-[2.5rem] hover:bg-blue-600 transition-all shadow-2xl shadow-blue-200 overflow-hidden"
        >
          <span className="relative z-10 flex items-center gap-4">
            Start Learning
            <BookOpen className="w-8 h-8 group-hover:rotate-12 transition-transform" />
          </span>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform"></div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Progress Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {['Reading', 'Listening', 'Writing', 'Speaking'].map(skill => {
            const prog = user.progress.find(p => p.skill === skill.toLowerCase());
            const completion = Math.min((prog?.sessionsCompleted || 0) * 20, 100);
            return (
              <div key={skill} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all">
                <div className={`absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 transition-colors duration-500 ${completion > 50 ? 'bg-blue-50' : ''}`}></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-slate-900 text-2xl">{skill}</h3>
                    <div className="flex flex-col items-end">
                      <span className="text-blue-600 font-black text-3xl leading-none">{prog?.sessionsCompleted || 0}</span>
                      <span className="text-[9px] font-black text-slate-400 uppercase">Sessions</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden mb-6">
                    <div className="h-full bg-blue-500 transition-all duration-1000 ease-out" style={{width: `${completion}%`}}></div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {prog?.learnedVocab.slice(-3).map((v, i) => (
                      <span key={i} className="text-[10px] bg-slate-50 text-slate-600 px-3 py-1.5 rounded-xl font-bold border border-slate-100">{v}</span>
                    ))}
                    {(prog?.learnedVocab.length || 0) > 3 && (
                      <span className="text-[10px] text-blue-500 font-black flex items-center">+{(prog?.learnedVocab.length || 0) - 3}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enhanced Activity Log */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm h-fit">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-slate-900 text-2xl flex items-center gap-3">
              <History className="w-6 h-6 text-blue-600" />
              Activity Log
            </h3>
          </div>
          <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-50">
            {user.activityLog.length === 0 ? (
              <div className="text-center py-10 px-4">
                <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No history yet</p>
              </div>
            ) : (
              user.activityLog.slice(-5).reverse().map((act, idx) => (
                <div key={act.id} className="flex gap-6 items-start relative z-10">
                  <div className="w-6 h-6 rounded-full bg-white border-4 border-blue-500 shrink-0 mt-1 shadow-sm"></div>
                  <div>
                    <div className="font-black text-slate-900 text-base leading-tight hover:text-blue-600 transition-colors cursor-default">{act.title}</div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-blue-500 uppercase font-black tracking-widest bg-blue-50 px-2 py-0.5 rounded">{act.skill}</span>
                      <span className="text-[10px] text-slate-400 font-bold">{new Date(act.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {user.activityLog.length > 5 && (
            <button className="w-full mt-8 py-4 text-[10px] font-black uppercase text-slate-400 border-t border-slate-50 hover:text-blue-600 transition-colors tracking-widest">
              View Full History
            </button>
          )}
        </div>
      </div>

      {/* Mastered Knowledge / Knowledge Bank */}
      <section className="bg-slate-900 rounded-[4rem] p-16 text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full blur-[150px] opacity-10 -mr-48 -mt-48 group-hover:opacity-20 transition-opacity"></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h2 className="text-4xl font-black tracking-tighter mb-2">Knowledge Archive</h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">A comprehensive record of your vocabulary and grammar gains</p>
            </div>
            <LayoutDashboard className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                  <span className="text-blue-400 font-black">A-Z</span>
                </div>
                <h4 className="text-blue-400 font-black uppercase tracking-[0.2em] text-sm">Vocabulary Library</h4>
              </div>
              <div className="flex flex-wrap gap-3">
                {user.progress.flatMap(p => p.learnedVocab).slice(-20).map((v, i) => (
                  <span key={i} className="px-5 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-sm font-bold transition-all border border-white/5 hover:border-white/10 hover:scale-105 cursor-default">{v}</span>
                ))}
                {user.progress.flatMap(p => p.learnedVocab).length === 0 && (
                  <div className="text-white/20 italic text-sm py-10 border border-dashed border-white/10 rounded-3xl w-full text-center">
                    Learned words from your tutoring sessions will be stored here.
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                  <span className="text-emerald-400 font-black">G</span>
                </div>
                <h4 className="text-emerald-400 font-black uppercase tracking-[0.2em] text-sm">Grammar Structures</h4>
              </div>
              <div className="flex flex-wrap gap-3">
                {user.progress.flatMap(p => p.learnedGrammar).slice(-20).map((g, i) => (
                  <span key={i} className="px-5 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-sm font-bold transition-all border border-white/5 hover:border-white/10 hover:scale-105 cursor-default">{g}</span>
                ))}
                {user.progress.flatMap(p => p.learnedGrammar).length === 0 && (
                  <div className="text-white/20 italic text-sm py-10 border border-dashed border-white/10 rounded-3xl w-full text-center">
                    Grammar tips and corrections will appear here.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
