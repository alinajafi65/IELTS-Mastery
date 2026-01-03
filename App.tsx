import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, IELTSSkill, PracticeModule } from './types';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import PlacementTest from './components/PlacementTest';
import Sidebar from './components/Sidebar';
import SkillSelection from './components/SkillSelection';
import SkillModules from './components/SkillModules';
import AITutor from './components/AITutor';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('ielts_mastery_v3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [view, setView] = useState<'dash' | 'test' | 'skills' | 'modules' | 'tutor'>('dash');
  const [selectedSkill, setSelectedSkill] = useState<IELTSSkill>('reading');
  const [selectedModule, setSelectedModule] = useState<PracticeModule | null>(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem('ielts_mastery_v3', JSON.stringify(user));
    }
  }, [user]);

  const handleSessionComplete = useCallback((data: { feedback: string; vocab: string[]; grammar: string[] }) => {
    setUser(prev => {
      if (!prev || !selectedModule) return prev;
      const newProgress = [...prev.progress];
      const skillIdx = newProgress.findIndex(p => p.skill === selectedSkill);
      const updatedProgress = [...newProgress];
      
      if (skillIdx > -1) {
        updatedProgress[skillIdx] = {
          ...updatedProgress[skillIdx],
          sessionsCompleted: updatedProgress[skillIdx].sessionsCompleted + 1,
          learnedVocab: Array.from(new Set([...updatedProgress[skillIdx].learnedVocab, ...data.vocab])),
          learnedGrammar: Array.from(new Set([...updatedProgress[skillIdx].learnedGrammar, ...data.grammar]))
        };
      } else {
        updatedProgress.push({
          skill: selectedSkill,
          sessionsCompleted: 1,
          lastFeedback: data.feedback,
          learnedVocab: data.vocab,
          learnedGrammar: data.grammar
        });
      }

      const newActivity = {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        skill: selectedSkill,
        title: selectedModule.title
      };

      return {
        ...prev,
        progress: updatedProgress,
        activityLog: [...(prev.activityLog || []), newActivity]
      };
    });
    setView('dash');
  }, [selectedModule, selectedSkill]);

  const handleChangeType = useCallback(() => {
    // Removed window.confirm to fix simulator issues
    if (!user) return;
    const nextType = user.type === 'academic' ? 'general' : 'academic';
    setUser(prev => prev ? ({ ...prev, type: nextType }) : null);
  }, [user]);

  const handleLogout = useCallback(() => {
    // Removed window.confirm to fix simulator issues
    localStorage.removeItem('ielts_mastery_v3');
    setUser(null);
    setView('dash');
  }, []);

  if (!user) return <Onboarding onComplete={(p, start) => { setUser(p); setView(start ? 'test' : 'dash'); }} />;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-['Inter']">
      <Sidebar 
        currentView={view} 
        onNavigate={setView} 
        user={user} 
        onLogout={handleLogout} 
        onChangeType={handleChangeType} 
      />
      <main className="flex-1 overflow-y-auto p-8 md:p-12 relative scroll-smooth">
        <div className="max-w-7xl mx-auto h-full">
          {view === 'dash' && (
            <Dashboard 
              user={user} 
              onStartPractice={() => setView('skills')} 
              onChangeType={handleChangeType}
              onLogout={handleLogout}
            />
          )}
          {view === 'test' && (
            <PlacementTest onComplete={res => { 
              setUser(prev => prev ? ({ ...prev, currentLevel: res.level, estimatedBand: res.band, completedOnboarding: true }) : null); 
              setView('dash'); 
            }} />
          )}
          {view === 'skills' && (
            <SkillSelection 
              onSelect={s => { setSelectedSkill(s); setView('modules'); }} 
              onBack={() => setView('dash')} 
            />
          )}
          {view === 'modules' && (
            <SkillModules 
              user={user} 
              skill={selectedSkill} 
              onSelectModule={m => { setSelectedModule(m); setView('tutor'); }} 
              onBack={() => setView('skills')} 
            />
          )}
          {view === 'tutor' && selectedModule && (
            <AITutor 
              user={user} 
              skill={selectedSkill} 
              module={selectedModule} 
              onBack={() => setView('modules')}
              onComplete={handleSessionComplete}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;