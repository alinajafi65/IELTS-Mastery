
import React from 'react';
import { UserProfile } from '../types';
import { LogOut, RefreshCcw, LayoutDashboard, History, BookOpen, Sparkles } from 'lucide-react';

interface DashboardProps {
  user: UserProfile;
  onStartPractice: () => void;
  onChangeType: () => void;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onStartPractice, onChangeType, onLogout }) => {
  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <h1 className="text-6xl font-black text-slate-900 tracking-tighter">Welcome, {user.name}</h1>
            <div className="flex gap-2">
              <button 
                onClick={onChangeType}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-blue-50 hover:border-blue-200 text-blue-600 text-[10px] font-black uppercase rounded-2xl transition-all shadow-sm active:scale-95"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                Change to {user.type === 'academic' ? 'General' : 'Academic'}
              </button>
              <button 
                onClick={onLogout}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-500 text-[10px] font-black uppercase rounded-2xl transition-all shadow-sm active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 text-white rounded-full">
               <Sparkles size={12} className="text-blue-400" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">{user.type} Path</span>
            </div>
            <p className="text-xl text-slate-500 font-medium tracking-tight">Est. <span className="text-slate-900 font-black">Band {user.estimatedBand}</span> • Goal: <span className="text-blue-600 font-black">{user.targetBand}</span></p>
          </div>
        </div>
        
        <button 
          onClick={onStartPractice}
          className="group relative px-12 py-8 bg-slate-900 text-white text-2xl font-black rounded-[3rem] hover:bg-blue-600 transition-all shadow-2xl shadow-blue-100 overflow-hidden"
        >
          <span className="relative z-10 flex items-center gap-4">
            Start Practice
            <BookOpen className="w-8 h-8 group-hover:rotate-12 transition-transform" />
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {['Reading', 'Listening', 'Writing', 'Speaking'].map(skill => {
            const prog = user.progress.find(p => p.skill === skill.toLowerCase());
            const completion = Math.min((prog?.sessionsCompleted || 0) * 20, 100);
            return (
              <div key={skill} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-slate-900 text-2xl tracking-tighter">{skill}</h3>
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-blue-600 font-black">{prog?.sessionsCompleted || 0}</div>
                  </div>
                  <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden mb-6">
                    <div className="h-full bg-blue-500 transition-all duration-1000 ease-out" style={{width: `${completion}%`}}></div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {prog?.learnedVocab.slice(-2).map((v, i) => (
                      <span key={i} className="text-[10px] bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl font-black border border-blue-100 uppercase tracking-widest">{v}</span>
                    ))}
                    {(prog?.learnedVocab.length || 0) > 2 && (
                      <span className="text-[10px] text-slate-300 font-black uppercase">+{(prog?.learnedVocab.length || 0) - 2} more</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm h-fit">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-slate-900 text-2xl flex items-center gap-3 tracking-tighter">
              <History className="w-6 h-6 text-blue-600" />
              Recent Activity
            </h3>
          </div>
          <div className="space-y-6">
            {user.activityLog.length === 0 ? (
              <div className="text-center py-10 opacity-30">
                <BookOpen className="mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest">No history recorded</p>
              </div>
            ) : (
              user.activityLog.slice(-4).reverse().map((act) => (
                <div key={act.id} className="group p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                  <div className="font-black text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{act.title}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[9px] text-blue-500 uppercase font-black tracking-widest bg-blue-50 px-2 py-0.5 rounded">{act.skill}</span>
                    <span className="text-[9px] text-slate-400 font-bold">{new Date(act.date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
