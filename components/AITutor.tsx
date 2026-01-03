
import React, { useState, useRef, useEffect } from 'react';
import { gemini, decodeAudio } from '../services/geminiService';
import { UserProfile, IELTSSkill, PracticeModule, QuizQuestion } from '../types';
import ReadingMaterial from './ReadingMaterial';
import ProgressSummaryPanel from './ProgressSummaryPanel';
import { Play, Eye, EyeOff, Loader2, Sparkles, Image as ImageIcon, Headphones, CheckCircle2, Mic, Square, Volume2, Info, AlertCircle, ArrowRight, CornerDownRight, XCircle, RotateCcw } from 'lucide-react';

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

interface FeedbackReview {
  id: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  isCorrect: boolean;
}

const AITutor: React.FC<AITutorProps> = ({ user, skill, module, onBack, onComplete }) => {
  const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [quizMode, setQuizMode] = useState(false);
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [visualAid, setVisualAid] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [interactiveQuestions, setInteractiveQuestions] = useState<InteractiveQuestion[]>([]);
  const [reviewMode, setReviewMode] = useState<FeedbackReview[] | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  const isAcademicTask1 = skill === 'writing' && user.type === 'academic' && 
                         (module.title.toLowerCase().includes('task 1') || module.description.toLowerCase().includes('task 1'));

  // Cleanup function to ensure audio stops
  const stopAllAudio = () => {
    console.log("AITutor: Stopping all audio");
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch(e) {}
      sourceRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      console.log("AITutor: Unmounting, cleaning up audio...");
      stopAllAudio();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, []);

  const handleBack = () => {
    console.log("AITutor: Back button pressed");
    stopAllAudio();
    onBack();
  };

  useEffect(() => {
    const init = async () => {
      console.log("AITutor: Initializing session...");
      setInitializing(true);
      
      const systemInstruction = `You are a specialized IELTS Tutor. 
        Current Context: ${module.title}. Skill: ${skill}. Training Track: ${user.type}. Current Level: Band ${user.estimatedBand}.
        
        PEDAGOGICAL FLOW RULES:
        1. FOR SPEAKING:
           - START: Introduce the task (e.g. "Speaking Part 1 - Familiar Topics"). Explain what examiners look for (fluency, range).
           - NEXT: Present the first question clearly.
           - INTERACTION: After student audio, analyze Fluency, Pronunciation, Grammar, and Vocabulary. Give "Band Improvement" tips (scaffolding).
        2. FOR READING:
           - PASSAGES: Encapsulate in [PASSAGE]...[/PASSAGE].
           - QUESTIONS: Use [BLANK:1] or [TFNG:1:Statement].
           - SUBMISSION: When the student answers, provide a REVIEW summary. This MUST explicitly list:
             - Question Number
             - Student Answer
             - Correct Answer
             - Pedagogical "Why" explanation tailored to their current band level.
        3. GENERAL: Be encouraging but accurate. End sessions with the exact string "SESSION_COMPLETE".`;
      
      const prompt = skill === 'speaking' 
        ? `I am ready for my Speaking session on ${module.title}. Please introduce the task and give me my first question.`
        : `Let's begin the session for ${module.title}. Give me instructions and materials.`;

      try {
        const greeting = await gemini.getChatResponse([], prompt, systemInstruction);
        setMessages([{ role: 'model', text: greeting }]);
        parseInteractiveQuestions(greeting);

        if (skill === 'speaking' || skill === 'listening') {
          const speechText = greeting.replace(/\[PASSAGE\].*?\[\/PASSAGE\]/gs, '').replace(/\[BLANK:(\d+)\]/g, 'blank number $1').replace(/\[TFNG:(\d+):(.*?)\]/g, 'Question $1: $2');
          const audio = await gemini.generateListeningAudio(speechText);
          if (audio) {
            setAudioBase64(audio);
            playAudioData(audio);
          }
        }

        if (isAcademicTask1) {
          const type = ['line graph', 'bar chart', 'pie chart', 'complex table'][Math.floor(Math.random() * 4)];
          const img = await gemini.generateWritingTaskImage(type, user.estimatedBand || 5.5);
          if (img) setVisualAid(img);
        }
      } catch (err) {
        console.error("AITutor: Init error", err);
      } finally {
        setInitializing(false);
      }
    };
    init();
  }, [module, skill, user.estimatedBand, user.type, isAcademicTask1]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, interactiveQuestions, reviewMode]);

  const parseInteractiveQuestions = (text: string) => {
    const questions: InteractiveQuestion[] = [];
    const blankRegex = /\[BLANK:(\d+)\]/g;
    let blankMatch;
    while ((blankMatch = blankRegex.exec(text)) !== null) {
      questions.push({ type: 'blank', id: blankMatch[1] });
    }
    const tfngRegex = /\[TFNG:(\d+):(.*?)\]/g;
    let tfngMatch;
    while ((tfngMatch = tfngRegex.exec(text)) !== null) {
      questions.push({ type: 'tfng', id: tfngMatch[1], statement: tfngMatch[2] });
    }
    setInteractiveQuestions(questions);
    setReviewMode(null);
  };

  const playAudioData = async (base64: string) => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext();
    }
    stopAllAudio();
    try {
      const buffer = await decodeAudio(base64, audioCtxRef.current);
      const source = audioCtxRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtxRef.current.destination);
      sourceRef.current = source;
      source.start();
    } catch (e) {
      console.error("AITutor: Audio play error", e);
    }
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
    } catch (err) {
      alert("Microphone access is required for Speaking sessions.");
    }
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
      console.log("AITutor: Processing spoken answer...");
      await sendMessageToAI("I have submitted a spoken response. Please analyze it based on IELTS band criteria.", base64Audio);
    };
  };

  const handleInteractiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const answers = interactiveQuestions.map(q => `Question ${q.id}: ${q.userAnswer}`).join(', ');
    console.log("AITutor: Submitting interactive answers for review", answers);
    await sendMessageToAI(`Here are my answers: ${answers}. Provide the Reading Review analysis (Correct answer vs My answer + Why) for each before continuing.`);
    setInteractiveQuestions([]);
  };

  const sendMessageToAI = async (msg: string, audioData?: string) => {
    const userMsg = audioData ? "[Analyzing Spoken Response...]" : msg;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    stopAllAudio();
    setAudioBase64(null);
    
    try {
      const systemInstruction = `You are an IELTS Tutor. Goal: ${module.title}. Skill: ${skill}. Level: Band ${user.estimatedBand}.`;
      const responseText = await gemini.getChatResponse(messages, msg, systemInstruction, audioData);
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
      parseInteractiveQuestions(responseText);

      if (skill === 'speaking' || skill === 'listening') {
        const speechText = responseText.replace(/\[PASSAGE\].*?\[\/PASSAGE\]/gs, '').replace(/\[BLANK:(\d+)\]/g, 'blank $1').replace(/\[TFNG:(\d+):.*?\]/g, 'Question $1');
        const audio = await gemini.generateListeningAudio(speechText);
        if (audio) {
          setAudioBase64(audio);
          playAudioData(audio);
        }
      }

      if (responseText.includes("SESSION_COMPLETE")) {
        console.log("AITutor: Session complete detected");
        const quizData = await gemini.generateEndSessionQuiz(module.title, user.estimatedBand || 5.5);
        setQuiz(quizData);
        setQuizMode(true);
      }
    } catch (err) {
      console.error("AITutor: Chat error", err);
      setMessages(prev => [...prev, { role: 'model', text: "I encountered an error analyzing that. Please try again or rephrase." }]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = (text: string) => {
    let clean = text.replace(/\[SCRIPT\].*?\[\/SCRIPT\]/gs, '');
    clean = clean.replace(/\[BLANK:(\d+)\]/g, '(___$1___)');
    clean = clean.replace(/\[TFNG:(\d+):.*?\]/g, '(Q$1)');
    
    if (clean.includes('[PASSAGE]')) {
      const parts = clean.split(/\[PASSAGE\]|\[\/PASSAGE\]/);
      return (
        <div className="space-y-12">
          <div className="prose prose-slate max-w-none">{parts[0]}</div>
          <ReadingMaterial content={parts[1]} />
          {parts[2] && <div className="prose prose-slate max-w-none">{parts[2]}</div>}
        </div>
      );
    }
    
    // Check if the response looks like a Reading Review
    if (text.toLowerCase().includes("correct answer") && (text.toLowerCase().includes("why") || text.toLowerCase().includes("explanation"))) {
      return (
        <div className="space-y-6">
           <div className="flex items-center gap-3 text-emerald-600 mb-4">
             <CheckCircle2 size={24} />
             <h4 className="font-black text-xl uppercase tracking-tighter">Pedagogical Review</h4>
           </div>
           <div className="bg-emerald-50/50 p-8 rounded-[2.5rem] border-2 border-emerald-100 whitespace-pre-wrap leading-relaxed font-medium text-slate-700">
             {clean.replace("SESSION_COMPLETE", "")}
           </div>
        </div>
      );
    }

    return <div className="whitespace-pre-wrap leading-relaxed">{clean.replace("SESSION_COMPLETE", "")}</div>;
  };

  if (initializing) return (
    <div className="flex flex-col items-center justify-center h-[70vh] animate-in fade-in duration-1000">
      <div className="w-24 h-24 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-blue-400 mb-10 animate-bounce shadow-2xl">
        <Sparkles size={48} />
      </div>
      <h2 className="text-4xl font-black text-slate-900 tracking-tighter text-center">Entering Exam Room...</h2>
      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-4">Syncing with Band {user.estimatedBand} Descriptors</p>
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
    <div className="flex flex-col xl:flex-row gap-10 items-start h-full pb-20">
      <div className="flex-1 flex flex-col h-[85vh] bg-white rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden relative">
        <div className="px-12 py-8 border-b border-slate-50 flex items-center justify-between bg-white/95 backdrop-blur-xl z-30 sticky top-0">
          <div className="flex items-center gap-4">
            <button onClick={handleBack} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-200 transition-colors shadow-sm">
              <XCircle className="w-5 h-5 text-slate-500" />
            </button>
            <div>
              <h2 className="font-black text-xl text-slate-900 tracking-tight">{module.title}</h2>
              <div className="flex gap-2 items-center mt-1">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black uppercase rounded tracking-widest">Protocol Active</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             {audioBase64 && (
               <button onClick={() => playAudioData(audioBase64!)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-100 hover:scale-105 transition-transform">
                 <Volume2 size={18} /> Replay Task
               </button>
             )}
             <button onClick={handleBack} className="text-[10px] font-black text-slate-300 hover:text-red-500 uppercase px-4 border-l border-slate-100 ml-2">Abort</button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-12 space-y-12 bg-slate-50/10 scroll-smooth">
          {visualAid && (
            <div className="max-w-xl mx-auto bg-white p-12 rounded-[3.5rem] shadow-xl border-4 border-slate-50 group">
               <div className="flex items-center gap-2 mb-6 text-slate-400">
                 <ImageIcon size={16} />
                 <span className="text-[10px] font-black uppercase tracking-widest">Figure 1.1: Exam Context</span>
               </div>
               <img src={`data:image/png;base64,${visualAid}`} className="rounded-2xl w-full h-auto shadow-inner" alt="IELTS Visual Material" />
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom duration-300`}>
              <div className={`max-w-[85%] px-10 py-8 rounded-[3.5rem] shadow-sm relative ${m.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'}`}>
                 <div className="text-lg font-medium">
                    {renderMessage(m.text)}
                 </div>
              </div>
            </div>
          ))}

          {interactiveQuestions.length > 0 && (
            <div className="max-w-2xl mx-auto bg-white p-12 rounded-[4.5rem] border-2 border-blue-50 shadow-2xl animate-in slide-in-from-bottom duration-500">
              <div className="flex items-center gap-4 mb-10 pb-6 border-b">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="font-black text-2xl text-slate-900 tracking-tight tracking-tight">Answer Submission</h3>
              </div>
              <form onSubmit={handleInteractiveSubmit} className="space-y-8">
                {interactiveQuestions.map((q, idx) => (
                  <div key={q.id} className="bg-slate-50 p-8 rounded-[2.8rem] border border-slate-100 hover:border-blue-200 transition-colors">
                    <div className="text-[11px] font-black text-blue-500 uppercase mb-4 tracking-widest">Question {q.id}</div>
                    {q.type === 'blank' ? (
                      <input 
                        type="text" required 
                        className="w-full p-6 border-2 border-slate-200 bg-white rounded-2xl font-black text-xl focus:border-blue-500 outline-none transition-all placeholder:text-slate-200" 
                        placeholder="Type answer..." 
                        onChange={e => { const n = [...interactiveQuestions]; n[idx].userAnswer = e.target.value; setInteractiveQuestions(n); }} 
                      />
                    ) : (
                      <div className="space-y-6">
                        <p className="font-bold text-lg text-slate-700 leading-relaxed italic border-l-4 border-blue-200 pl-6">{q.statement}</p>
                        <div className="flex gap-3">
                          {['True', 'False', 'Not Given'].map(v => (
                            <button 
                              key={v} type="button" 
                              onClick={() => { const n = [...interactiveQuestions]; n[idx].userAnswer = v; setInteractiveQuestions(n); }} 
                              className={`flex-1 py-5 rounded-2xl font-black text-xs uppercase border-4 transition-all ${q.userAnswer === v ? 'bg-blue-600 text-white border-blue-500 shadow-xl' : 'bg-white text-slate-400 border-slate-50 hover:border-blue-100'}`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <button type="submit" className="w-full py-8 bg-slate-900 text-white font-black rounded-[2rem] text-xl shadow-2xl hover:bg-blue-600 transition-all active:scale-95">
                  Submit Answers for Review
                </button>
              </form>
            </div>
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white px-10 py-8 rounded-[2.5rem] border border-slate-50 shadow-sm animate-pulse flex items-center gap-4">
                <Loader2 className="animate-spin text-blue-500" />
                <span className="font-bold text-slate-400 text-sm uppercase tracking-widest">Analyzing your input...</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 border-t bg-white relative z-40">
          <div className="max-w-4xl mx-auto">
            {skill === 'speaking' ? (
              <div className="flex items-center justify-center gap-10 py-4">
                <div className="flex flex-col items-center">
                  <button 
                    onMouseDown={startRecording} 
                    onMouseUp={stopRecording} 
                    className={`w-32 h-32 rounded-full flex items-center justify-center transition-all shadow-2xl relative ${isRecording ? 'bg-red-500 scale-125' : 'bg-slate-900 hover:bg-blue-600'}`}
                  >
                    {isRecording && <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20"></div>}
                    {isRecording ? <Square size={44} className="text-white relative z-10" /> : <Mic size={44} className="text-white relative z-10" />}
                  </button>
                  <p className={`mt-6 font-black uppercase tracking-[0.3em] text-[10px] ${isRecording ? 'text-red-500' : 'text-slate-400'}`}>
                    {isRecording ? 'Recording Now' : 'Hold Mic to Speak'}
                  </p>
                </div>
                
                <div className="flex-1 max-w-sm hidden md:block">
                   <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100 flex gap-4">
                      <AlertCircle className="text-blue-500 shrink-0" />
                      <p className="text-[11px] font-bold text-blue-800 leading-relaxed italic">
                        Tip: Focus on varied connectors and naturally extending your answers. I am evaluating your fluency and range.
                      </p>
                   </div>
                </div>
              </div>
            ) : interactiveQuestions.length === 0 && (
              <form onSubmit={e => { e.preventDefault(); if (input.trim()) { sendMessageToAI(input); setInput(''); } }} className="flex gap-4">
                <input 
                  value={input} 
                  onChange={e => setInput(e.target.value)} 
                  className="flex-1 px-10 py-6 bg-slate-50 border-none rounded-[2.5rem] font-bold outline-none text-lg focus:ring-4 focus:ring-blue-100 transition-all shadow-inner" 
                  placeholder="Respond to the tutor..." 
                  disabled={loading} 
                />
                <button type="submit" disabled={!input.trim() || loading} className="p-7 bg-slate-900 text-white rounded-full hover:bg-blue-600 transition-all shadow-xl active:scale-90">
                  <ArrowRight size={32} />
                </button>
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
