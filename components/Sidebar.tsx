import React from 'react';
import { UserProfile } from '../types';
import { LayoutDashboard, BookOpen, MessageSquare, Award, LogOut, ChevronRight, RefreshCw } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: any) => void;
  user: UserProfile;
  onLogout: () => void;
  onChangeType: () => void; // Added this capability
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, user, onLogout, onChangeType }) => {
  const menuItems = [
    { id: 'dash', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'skills', label: 'Practice Hub', icon: BookOpen },
  ];

  return (
    <div className="hidden lg:flex flex-col w-80 bg-white border-r border-slate-100 h-full shadow-sm">
      <div className="p-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
            <Award className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter">
            IELTS <span className="text-blue-600">Mastery</span>
          </h1>
        </div>
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] ml-1">AI-Powered Prep</p>
      </div>

      <nav className="flex-1 px-6 space-y-2 mt-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-6 py-5 rounded-[2rem] transition-all group ${
                isActive 
                  ? 'bg-slate-900 text-white shadow-2xl shadow-slate-200 translate-x-2' 
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-4">
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span className="font-bold tracking-tight">{item.label}</span>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`} />
            </button>
          );
        })}
      </nav>

      <div className="p-8">
        <div className="bg-slate-50 p-6 rounded-[2rem] mb-6 border border-slate-100">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-4">Live Performance</p>
          <div className="flex items-end justify-between">
            <div className="text-4xl font-black text-slate-900 tracking-tighter">{user.estimatedBand || '?.?'}</div>
            
            {/* This section is now a button that changes the exam type */}
            <button 
              onClick={onChangeType}
              className="flex flex-col items-end cursor-pointer hover:opacity-70 transition-opacity"
              title="Click to switch between Academic and General"
            >
              <div className="flex items-center gap-1 text-blue-600">
                 <span className="text-[9px] font-black uppercase tracking-widest">{user.type}</span>
                 <RefreshCw className="w-3 h-3" />
              </div>
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">EST. BAND</span>
            </button>

          </div>
        </div>
        
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 text-xs font-black text-red-500 hover:bg-red-50 rounded-2xl transition-all uppercase tracking-widest active:scale-95"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;