
import React, { useState, useEffect } from 'react';
import { gemini } from '../services/geminiService';
import { Question } from '../types';

interface PlacementTestProps {
  onComplete: (result: { level: any; band: number }) => void;
}

const PlacementTest: React.FC<PlacementTestProps> = ({ onComplete }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const data = await gemini.generatePlacementTest();
        setQuestions(data);
      } catch (error) {
        console.error("Failed to load test:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  const handleAnswer = (option: string) => {
    setAnswers({ ...answers, [questions[currentIdx].id]: option });
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const calculateResults = async () => {
    setSubmitting(true);
    let score = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) score++;
    });

    try {
      const assessment = await gemini.getLevelAssessment(score, questions.length);
      onComplete({
        level: assessment.level,
        band: assessment.band
      });
    } catch (error) {
      console.error("Assessment error:", error);
      // Fallback
      onComplete({ level: 'B2', band: 6.0 });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-bold text-slate-800 italic">Generating your personalized test...</h2>
        <p className="text-slate-500 mt-2">Gemini is curating questions based on IELTS standards.</p>
      </div>
    );
  }

  const progress = ((currentIdx + 1) / questions.length) * 100;
  const currentQuestion = questions[currentIdx];
  const allAnswered = Object.keys(answers).length === questions.length;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="h-2 bg-slate-100 w-full">
          <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">IELTS Proficiency Test</span>
            <span className="text-sm font-medium text-slate-400">Question {currentIdx + 1} of {questions.length}</span>
          </div>

          <h3 className="text-xl font-semibold text-slate-800 mb-8 leading-relaxed">
            {currentQuestion.text}
          </h3>

          <div className="space-y-4">
            {currentQuestion.options.map((option, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(option)}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                  answers[currentQuestion.id] === option 
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' 
                    : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <span className="inline-block w-8 font-bold text-slate-300">{String.fromCharCode(65 + i)}.</span>
                {option}
              </button>
            ))}
          </div>

          <div className="mt-12 flex justify-between">
            <button 
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx(currentIdx - 1)}
              className="px-6 py-2 text-slate-400 hover:text-slate-600 disabled:opacity-30"
            >
              Back
            </button>
            
            {allAnswered && currentIdx === questions.length - 1 ? (
              <button 
                onClick={calculateResults}
                disabled={submitting}
                className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-100 transition-all disabled:opacity-50"
              >
                {submitting ? 'Analyzing...' : 'Complete Assessment'}
              </button>
            ) : (
              <button 
                onClick={() => setCurrentIdx(Math.min(currentIdx + 1, questions.length - 1))}
                className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlacementTest;
