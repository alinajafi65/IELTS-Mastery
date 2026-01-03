
import React, { useState, useRef, useEffect } from 'react';
import { gemini, decodeAudio } from '../services/geminiService';
import { UserProfile, IELTSSkill, PracticeModule, QuizQuestion } from '../types';
import ReadingMaterial from './ReadingMaterial';
import ProgressSummaryPanel from './ProgressSummaryPanel';
import { Play, Eye, EyeOff, Loader2, Sparkles, Image as ImageIcon, Headphones, CheckCircle2, Mic, Square, Volume2, Info, AlertCircle, ArrowRight, CornerDownRight, XCircle, RotateCcw, Lightbulb, BookOpen, ChevronDown } from 'lucide-react';

interface AITutorProps {
  user: UserProfile;
  skill: IELTSSkill;
  module: PracticeModule;
  onBack: () => void;
  onComplete: (data: { feedback: string; vocab: string[]; grammar: string[] }) => void;
}

interface InteractiveQuestion {
  type: 'blank' | 'tfng';
  id: string;
  statement?: string;
  label?: string;
  userAnswer?: string;
}

const AITutor: React.FC<AITutorProps> = ({ user, skill, module, onBack, onComplete }) => {
  const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [quizMode, setQuizMode] = useState(false);
  const [visualAid, setVisualAid] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [interactiveQuestions, setInteractiveQuestions] = useState<InteractiveQuestion[]>([]);
  const [scaffoldHint, setScaffoldHint] = useState<string | null>(null);
  const [showBandGuide, setShowBandGuide] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  const isAcademicTask1 = skill === 'writing' && user.type === 'academic' && 
                         (module.title.toLowerCase().includes('task 1') || module.description.toLowerCase().includes('task 1'));

  const stopAllAudio = () => {
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch(e) {}
      sourceRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopAllAudio();
  }, []);

  useEffect(() => {
    const init = async () => {
      setInitializing(true);
      const systemInstruction = `You are a specialized IELTS Tutor. 
        Current Goal: ${module.title}. Skill: ${skill}. Level: Band ${user.estimatedBand}. 
        When providing writing feedback, use the format [CATEGORY: Original | Correction | Explanation] for errors. 
        Categories: GR (Grammar), VOC (Vocabulary), COH (Cohesion), PUNC (Punctuation).
        Always end the session with "SESSION_COMPLETE".`;
      
      const prompt = `Let's begin the session for ${module.title}. Give me instructions and materials.`;

      try {
        const greeting = await gemini.getChatResponse([], prompt, systemInstruction);
        setMessages([{ role: 'model', text: greeting }]);
        parseInteractiveQuestions(greeting);

        if ((skill === 'speaking' || skill === 'listening') && !greeting.includes('[PASSAGE]')) {
          const audio = await gemini.generateListeningAudio(greeting);
          if (audio) { setAudioBase64(audio); playAudioData(audio); }
        }

        if (isAcademicTask1) {
          const img = await gemini.generateWritingTaskImage('bar chart', user.estimatedBand || 5.5);
          if (img) setVisualAid(img);
        }
      } catch (err) { console.error(err); } finally { setInitializing(false); }
    };
    init();
  }, [module, skill]);

  const fetchScaffoldHint = async () => {
    setHintLoading(true);
    setScaffoldHint(null);
    try {
      const lastBotMsg = messages.filter(m => m.role === 'model').slice(-1)[0]?.text || "";
      const hint = await gemini.generateScaffoldHint(skill, lastBotMsg, user.targetBand);
      setScaffoldHint(hint);
    } catch (e) {
      setScaffoldHint("Try using a transition word like 'Furthermore' or 'However' to link your ideas.");
    } finally {
      setHintLoading(false);
    }
  };

  const playAudioData = async (base64: string) => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext();
    }
    if (sourceRef.current) { try { sourceRef.current.stop(); } catch(e) {} }
    try {
      const buffer = await decodeAudio(base64, audioCtxRef.current);
      const source = audioCtxRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtxRef.current.destination);
      sourceRef.current = source;
      source.start();
    } catch (e) { console.error(e); }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm;codecs=opus' });
        processSpokenAnswer(blob);
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) { alert("Microphone required."); }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  };

  const processSpokenAnswer = async (blob: Blob) => {
    setLoading(true);
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      const base64Audio = (reader.result as string).split(',')[1];
      await sendMessageToAI("I've finished my spoken response.", base64Audio);
    };
  };

  const parseInteractiveQuestions = (text: string) => {
    const questions: InteractiveQuestion[] = [];
    const blankRegex = /\[BLANK:(\d+)\]/g;
    let match;
    while ((match = blankRegex.exec(text)) !== null) {
      questions.push({ type: 'blank', id: match[1] });
    }
    setInteractiveQuestions(questions);
  };

  const sendMessageToAI = async (msg: string, audioData?: string) => {
    const userMsg = audioData ? "[Analyzing Voice...]" : msg;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    setScaffoldHint(null);
    
    try {
      const systemInstruction = `You are an IELTS Tutor. Context: ${module.title}. Skill: ${skill}. Level: Band ${user.estimatedBand}.`;
      const responseText = await gemini.getChatResponse(messages, msg, systemInstruction, audioData);
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
      parseInteractiveQuestions(responseText);

      if (skill === 'speaking' || skill === 'listening') {
        const audio = await gemini.generateListeningAudio(responseText.replace(/\[PASSAGE\].*?\[\/PASSAGE\]/gs, '').replace(/\[.*?:.*?\|.*?\|.*?\]/g, ''));
        if (audio) { setAudioBase64(audio); playAudioData(audio); }
      }

      if (responseText.includes("SESSION_COMPLETE")) setQuizMode(true);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const renderMessage = (text: string) => {
    let clean = text.replace(/\[SCRIPT\].*?\[\/SCRIPT\]/gs, '');
    clean = clean.replace(/\[BLANK:(\d+)\]/g, '(___$1___)');
    
    // Check for interactive corrections: [CATEGORY: Original | Correction | Explanation]
    const correctionRegex = /\[(GR|VOC|COH|PUNC):\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\]/g;
    
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = correctionRegex.exec(clean)) !== null) {
      // Add text before match
      parts.push(clean.substring(lastIndex, match.index));
      
      const [full, category, original, correction, explanation] = match;
      parts.push(
        <span key={match.index} className="inline-block group relative">
          <span className="bg-red-50 text-red-700 border-b-2 border-red-300 px-1 cursor-help hover:bg-red-100 transition-colors">
            {original}
          </span>
          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl z-50 text-xs animate-in fade-in slide-in-from-bottom-2">
            <div className="flex justify-between items-center mb-2">
              <span className="bg-red-500 text-white px-2 py-0.5 rounded font-black uppercase text-[8px]">{category}</span>
              <span className="text-emerald-400 font-black">Correction</span>
            </div>
            <p className="font-bold text-lg mb-2 text-emerald-400">"{correction}"</p>
            <p className="opacity-70 leading-relaxed italic">{explanation}</p>
          </div>
        </span>
      );
      
      lastIndex = match.index + full.length;
    }
    parts.push(clean.substring(lastIndex));

    if (clean.includes('[PASSAGE]')) {
      // Note: simplistic split for passage demo
      const passageParts = clean.split(/\[PASSAGE\]|\[\/PASSAGE\]/);
      return (
        <div className="space-y-8">
          <p>{passageParts[0]}</p>
          <ReadingMaterial content={passageParts[1]} />
          {passageParts[2] && <p>{passageParts[2]}</p>}
        </div>
      );
    }

    return (
      <div className="whitespace-pre-wrap leading-relaxed">
        {parts.map((p, i) => <React.Fragment key={i}>{p}</React.Fragment>)}
      </div>
    );
  };

  if (initializing) return (
    <div className="flex flex-col items-center justify-center h-[60vh] animate-pulse">
      <Sparkles size={64} className="text-blue-500 mb-6" />
      <h2 className="text-3xl font-black text-slate-900">Personalizing Materials...</h2>
    </div>
  );

  if (quizMode) return (
    <div className="flex flex-col xl:flex-row gap-10 items-start animate-in zoom-in duration-500">
      <div className="flex-1 bg-white p-16 rounded-[4.5rem] shadow-2xl border border-slate-50 text-center">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">Mastery Achieved</h2>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-12">Session logged to your official profile</p>
        <button onClick={() => onComplete({ feedback: "Session complete", vocab: [], grammar: [] })} className="w-full py-8 bg-slate-900 text-white font-black rounded-3xl text-xl hover:bg-blue-600 shadow-2xl transition-all">
          Record Progress & Exit
        </button>
      </div>
      <ProgressSummaryPanel user={user} currentSkill={skill} />
    </div>
  );

  return (
    <div className="flex flex-col xl:flex-row gap-10 items-start h-full pb-20 relative">
      {showBandGuide && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={() => setShowBandGuide(false)}>
          <div className="bg-white rounded-[3rem] p-12 max-w-2xl w-full shadow-2xl animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-3xl font-black text-slate-900">Band {user.targetBand} Requirements</h3>
              <button onClick={() => setShowBandGuide(false)} className="p-2 bg-slate-50 rounded-full"><XCircle /></button>
            </div>
            <div className="space-y-6 text-slate-600 font-medium">
              <div className="p-6 bg-blue-50 rounded-2xl border-l-4 border-blue-600">
                <h4 className="font-black text-blue-900 mb-2 uppercase text-xs tracking-widest">Linguistic Range</h4>
                <p>Use a variety of complex structures with some flexibility. Use a wide range of vocabulary to discuss topics at length.</p>
              </div>
              <div className="p-6 bg-emerald-50 rounded-2xl border-l-4 border-emerald-600">
                <h4 className="font-black text-emerald-900 mb-2 uppercase text-xs tracking-widest">Cohesion & Coherence</h4>
                <p>Use a range of cohesive devices naturally. Ensure clear progression throughout the response.</p>
              </div>
              <p className="text-sm italic">These descriptors are based on official IELTS public band descriptors for {skill}.</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col h-[85vh] bg-white rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden">
        <div className="px-10 py-6 border-b flex items-center justify-between bg-white z-30 sticky top-0">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-50 rounded-xl"><XCircle className="text-slate-400" /></button>
            <h2 className="font-black text-lg text-slate-900">{module.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowBandGuide(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-[10px] font-black uppercase text-slate-600 transition-all">
              <BookOpen size={14} /> Band Guide
            </button>
            {audioBase64 && <button onClick={() => playAudioData(audioBase64!)} className="p-3 bg-blue-600 text-white rounded-xl shadow-lg"><Volume2 size={16} /></button>}
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-10 bg-slate-50/20">
          {visualAid && (
            <div className="max-w-md mx-auto bg-white p-8 rounded-[3rem] shadow-xl border-4 border-slate-50">
               <img src={`data:image/png;base64,${visualAid}`} className="rounded-2xl" alt="Task Visual" />
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom duration-300`}>
              <div className={`max-w-[85%] px-8 py-6 rounded-[2.5rem] shadow-sm ${m.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'}`}>
                 {renderMessage(m.text)}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white px-8 py-6 rounded-[2rem] border animate-pulse flex items-center gap-3">
                <Loader2 className="animate-spin text-blue-500" />
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Tutor is thinking...</span>
              </div>
            </div>
          )}
        </div>

        {scaffoldHint && (
          <div className="px-10 py-4 bg-yellow-50/80 border-t border-yellow-100 flex items-center justify-between animate-in slide-in-from-bottom duration-300">
             <div className="flex items-center gap-4 text-yellow-800">
                <Lightbulb className="shrink-0" size={20} />
                <p className="text-xs font-bold italic leading-relaxed">{scaffoldHint}</p>
             </div>
             <button onClick={() => setScaffoldHint(null)} className="p-1 hover:bg-yellow-100 rounded-full"><XCircle size={14} /></button>
          </div>
        )}

        <div className="p-8 border-t bg-white">
          <div className="max-w-4xl mx-auto flex flex-col gap-4">
            <div className="flex justify-center">
              <button 
                onClick={fetchScaffoldHint} 
                disabled={hintLoading || loading}
                className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-100 hover:border-yellow-400 hover:text-yellow-600 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
              >
                {hintLoading ? <Loader2 size={14} className="animate-spin" /> : <Lightbulb size={14} />}
                Get Scaffold Hint
              </button>
            </div>
            
            {skill === 'speaking' ? (
              <div className="flex items-center justify-center gap-6">
                <button onMouseDown={startRecording} onMouseUp={stopRecording} className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-2xl ${isRecording ? 'bg-red-500 scale-110 animate-pulse' : 'bg-slate-900'}`}>
                  {isRecording ? <Square size={32} className="text-white" /> : <Mic size={32} className="text-white" />}
                </button>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hold to speak</p>
              </div>
            ) : (
              <form onSubmit={e => { e.preventDefault(); if (input.trim()) { sendMessageToAI(input); setInput(''); } }} className="flex gap-4">
                <input value={input} onChange={e => setInput(e.target.value)} className="flex-1 px-8 py-5 bg-slate-50 border-none rounded-3xl font-bold outline-none" placeholder="Respond here..." disabled={loading} />
                <button type="submit" disabled={!input.trim() || loading} className="p-6 bg-slate-900 text-white rounded-full"><ArrowRight /></button>
              </form>
            )}
          </div>
        </div>
      </div>
      <ProgressSummaryPanel user={user} currentSkill={skill} />
    </div>
  );
};

export default AITutor;
