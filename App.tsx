
import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, IELTSSkill, PracticeModule, VocabularyItem } from './types';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import PlacementTest from './components/PlacementTest';
import Sidebar from './components/Sidebar';
import SkillSelection from './components/SkillSelection';
import SkillModules from './components/SkillModules';
import AITutor from './components/AITutor';
import VocabularyVault from './components/VocabularyVault';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('ielts_mastery_v4');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migrating old data to v4 with vocabVault
        if (!parsed.vocabVault) parsed.vocabVault = [];
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [view, setView] = useState<'dash' | 'test' | 'skills' | 'modules' | 'tutor' | 'vault'>('dash');
  const [selectedSkill, setSelectedSkill] = useState<IELTSSkill>('reading');
  const [selectedModule, setSelectedModule] = useState<PracticeModule | null>(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem('ielts_mastery_v4', JSON.stringify(user));
    }
  }, [user]);

  const handleSessionComplete = useCallback((data: { feedback: string; vocab: string[]; grammar: string[] }) => {
    setUser(prev => {
      if (!prev || !selectedModule) return prev;
      
      const newVocabItems: VocabularyItem[] = data.vocab.map(word => ({
        word,
        skill: selectedSkill,
        dateAdded: new Date().toISOString(),
        mastered: false
      }));

      // Merge only unique words into the vault
      const existingWords = new Set(prev.vocabVault.map(v => v.word.toLowerCase()));
      const filteredNewVocab = newVocabItems.filter(v => !existingWords.has(v.word.toLowerCase()));

      const skillIdx = prev.progress.findIndex(p => p.skill === selectedSkill);
      const updatedProgress = [...prev.progress];
      
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
        vocabVault: [...prev.vocabVault, ...filteredNewVocab],
        activityLog: [...prev.activityLog, newActivity]
      };
    });
    setView('dash');
  }, [selectedModule, selectedSkill]);

  const toggleVocabMastery = (word: string) => {
    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        vocabVault: prev.vocabVault.map(v => v.word === word ? { ...v, mastered: !v.mastered } : v)
      };
    });
  };

  const handleChangeType = useCallback(() => {
    setUser(prev => {
      if (!prev) return null;
      return { ...prev, type: prev.type === 'academic' ? 'general' : 'academic' };
    });
  }, []);

  const handleLogout = useCallback(() => {
    if (window.confirm("Sign out and reset all progress?")) {
      localStorage.removeItem('ielts_mastery_v4');
      setUser(null);
      setView('dash');
    }
  }, []);

  if (!user) return <Onboarding onComplete={(p, start) => { 
    setUser({ ...p, vocabVault: [] }); 
    setView(start ? 'test' : 'dash'); 
  }} />;

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
          {view === 'vault' && (
            <VocabularyVault 
              user={user} 
              onToggleMastery={toggleVocabMastery} 
              onBack={() => setView('dash')}
            />
          )}
          {view === 'test' && (
            <PlacementTest onComplete={res => { 
              setUser(prev => prev ? ({ ...prev, currentLevel: res.level, estimatedBand: res.band, completedOnboarding: true }) : null); 
              setView('dash'); 
            }} />
          )}
          {view === 'skills' && (
            <SkillSelection onSelect={s => { setSelectedSkill(s); setView('modules'); }} onBack={() => setView('dash')} />
          )}
          {view === 'modules' && (
            <SkillModules user={user} skill={selectedSkill} onSelectModule={m => { setSelectedModule(m); setView('tutor'); }} onBack={() => setView('skills')} />
          )}
          {view === 'tutor' && selectedModule && (
            <AITutor user={user} skill={selectedSkill} module={selectedModule} onBack={() => setView('modules')} onComplete={handleSessionComplete} />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
