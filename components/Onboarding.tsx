import React, { useState } from 'react';
import { UserProfile, IELTSType } from '../types';

interface OnboardingProps {
  onComplete: (profile: UserProfile, startTest: boolean) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [type, setType] = useState<IELTSType>('academic');
  const [targetBand, setTargetBand] = useState(7.0);
  const [currentBand, setCurrentBand] = useState(5.5);

  const handleSubmit = (startTest: boolean) => {
    // FIX: Included missing vocabVault property to match UserProfile interface definition
    onComplete({
      name,
      type,
      targetBand,
      currentLevel: startTest ? null : `Band ${currentBand}`,
      estimatedBand: startTest ? null : currentBand,
      completedOnboarding: !startTest,
      progress: [],
      activityLog: [],
      vocabVault: []
    }, startTest);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 border border-slate-100 transition-all overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
        
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <h2 className="text-3xl font-black text-slate-900 leading-tight">First, what's your name?</h2>
            {/* FIX: Added 'text-slate-900' to make text black and visible */}
            <input 
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold text-slate-900 placeholder:text-slate-400"
              placeholder="Your name"
            />
            <button 
              disabled={!name.trim()} onClick={() => setStep(2)}
              className="w-full py-5 bg-blue-600 text-white font-black rounded-3xl hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-95"
            >
              Let's Go!
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <h2 className="text-3xl font-black text-slate-900">Which IELTS test?</h2>
            <div className="grid gap-4">
              <button 
                onClick={() => { setType('academic'); setStep(3); }}
                className={`p-6 text-left border-4 rounded-[2rem] transition-all group ${type === 'academic' ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-blue-200'}`}
              >
                <div className="text-xl font-black text-slate-800">Academic</div>
                <p className="text-sm text-slate-500">For university or professional registration.</p>
              </button>
              <button 
                onClick={() => { setType('general'); setStep(3); }}
                className={`p-6 text-left border-4 rounded-[2rem] transition-all group ${type === 'general' ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-blue-200'}`}
              >
                <div className="text-xl font-black text-slate-800">General Training</div>
                <p className="text-sm text-slate-500">For migration or work in English countries.</p>
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in slide-in-from-right duration-300 text-center">
            <h2 className="text-2xl font-black text-slate-900">Do you know your level?</h2>
            <div className="grid gap-4">
              <button onClick={() => setStep(4)} className="p-6 bg-slate-900 text-white font-bold rounded-3xl shadow-lg">Yes, I'll enter it</button>
              <button onClick={() => handleSubmit(true)} className="p-6 border-4 border-slate-100 font-bold rounded-3xl text-slate-600 hover:border-blue-600 hover:text-blue-600">No, test me</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-10 animate-in slide-in-from-right duration-300">
            <div>
              <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Current Band: {currentBand}</label>
              <input type="range" min="1" max="9" step="0.5" value={currentBand} onChange={e => setCurrentBand(parseFloat(e.target.value))} className="w-full accent-blue-600" />
            </div>
            <div>
              <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Target Band: {targetBand}</label>
              <input type="range" min="1" max="9" step="0.5" value={targetBand} onChange={e => setTargetBand(parseFloat(e.target.value))} className="w-full accent-blue-600" />
            </div>
            <button onClick={() => handleSubmit(false)} className="w-full py-5 bg-blue-600 text-white font-black rounded-3xl shadow-xl">Complete Setup</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;