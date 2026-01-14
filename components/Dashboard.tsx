
import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Target, 
  TrendingUp, 
  Sparkles, 
  BookOpen, 
  PenTool, 
  Loader2, 
  Plus, 
  Check, 
  GraduationCap, 
  ArrowRight,
  BookMarked,
  Languages,
  X,
  ChevronRight,
  Info,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  CalendarCheck,
  AlertCircle,
  Volume2,
  BookX
} from 'lucide-react';
import { generateDailyLesson, analyzeReadingArticle } from '../services/geminiService';
import { speakText } from '../services/speechService';
import { DailyLesson, AppView, ArticleAnalysis, ComprehensiveExercise, VocabItem, MistakeItem } from '../types';

interface DashboardProps {
  onViewChange?: (view: AppView) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onViewChange }) => {
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [lesson, setLesson] = useState<DailyLesson | null>(null);
  const [addedWords, setAddedWords] = useState<Set<string>>(new Set());
  const [masteredWords, setMasteredWords] = useState<Set<string>>(new Set());
  const [daysToExam, setDaysToExam] = useState(0);
  const [progress, setProgress] = useState(0);
  const [masteredWordsCount, setMasteredWordsCount] = useState(10000);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [dueVocabCount, setDueVocabCount] = useState(0);
  
  const [isGrammarCn, setIsGrammarCn] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ArticleAnalysis | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});
  const [userSelections, setUserSelections] = useState<Record<number, string>>({}); // New: Track user selections
  const [addedMistakes, setAddedMistakes] = useState<Set<number>>(new Set()); // New: Track added mistakes
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    const updateStats = () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      
      const juneExam = new Date(currentYear, 5, 15);
      const novExam = new Date(currentYear, 10, 15);
      
      let targetExam;
      if (now < juneExam) {
        targetExam = juneExam;
      } else if (now < novExam) {
        targetExam = novExam;
      } else {
        targetExam = new Date(currentYear + 1, 5, 15);
      }

      const diffTime = targetExam.getTime() - now.getTime();
      setDaysToExam(Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

      const storedCompleted = localStorage.getItem('lessons_completed');
      const completed = storedCompleted ? JSON.parse(storedCompleted) : [];
      setProgress(Math.min(Math.round((completed.length / 180) * 100), 100));

      const todayStr = new Date().toLocaleDateString('zh-CN');
      setIsCheckedIn(completed.includes(todayStr));

      const vault: VocabItem[] = JSON.parse(localStorage.getItem('vocab_vault') || '[]');
      const mastered = JSON.parse(localStorage.getItem('mastered_words') || '[]');
      setMasteredWords(new Set(mastered));
      setMasteredWordsCount(10000 + vault.length);

      const dueCount = vault.filter(v => {
        if (!v.nextReviewAt) return true;
        return new Date(v.nextReviewAt) <= new Date();
      }).length;
      setDueVocabCount(dueCount);

      const savedLesson = localStorage.getItem('today_lesson');
      if (savedLesson) {
        const parsed = JSON.parse(savedLesson);
        if (parsed.id === todayStr) {
          setLesson(parsed);
          const initialRevealed: Record<number, boolean> = {};
          parsed.comprehensiveExercises?.forEach((_: any, idx: number) => {
            initialRevealed[idx] = false;
          });
          setRevealedAnswers(initialRevealed);
        }
      }
    };
    updateStats();
  }, []);

  const handleGenerateLesson = async () => {
    setLoadingLesson(true);
    setRevealedAnswers({});
    setUserSelections({});
    setAddedMistakes(new Set());
    try {
      const mastered = Array.from(masteredWords) as string[];
      const completedCount = JSON.parse(localStorage.getItem('lessons_completed') || '[]').length;
      const phaseNum = Math.min(Math.ceil((completedCount + 1) / 30), 6);
      const data = await generateDailyLesson(`第 ${phaseNum} 阶段`, mastered);
      const todayStr = new Date().toLocaleDateString('zh-CN');
      const lessonWithId = { ...data, id: todayStr };
      setLesson(lessonWithId);
      localStorage.setItem('today_lesson', JSON.stringify(lessonWithId));
    } catch (e) {
      alert("生成失败，请检查网络连接。");
    } finally {
      setLoadingLesson(false);
    }
  };

  const handleSpeak = async (id: string, text: string, type: 'word' | 'sentence') => {
    if (playingId) return;
    setPlayingId(id);
    await speakText(text, type);
    setPlayingId(null);
  };

  const handleCheckIn = () => {
    const todayStr = new Date().toLocaleDateString('zh-CN');
    const stored = localStorage.getItem('lessons_completed');
    const completed = stored ? JSON.parse(stored) : [];
    
    if (!completed.includes(todayStr)) {
      const newList = [...completed, todayStr];
      localStorage.setItem('lessons_completed', JSON.stringify(newList));
      setIsCheckedIn(true);
      window.dispatchEvent(new Event('storage'));
    }
  };

  const toggleAnswer = (idx: number) => {
    setRevealedAnswers(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleOptionSelect = (exerciseIdx: number, option: string) => {
    if (revealedAnswers[exerciseIdx]) return; // Prevent changing answer after reveal
    setUserSelections(prev => ({ ...prev, [exerciseIdx]: option }));
  };

  const addToMistakes = (ex: ComprehensiveExercise, idx: number) => {
    const stored = localStorage.getItem('mistake_notebook');
    const notebook: MistakeItem[] = stored ? JSON.parse(stored) : [];
    
    // Check if already exists to prevent dupes (though we have addedMistakes state for UI)
    const exists = notebook.some(m => m.source === ex.question && m.addedAt.startsWith(new Date().toISOString().split('T')[0]));
    if (exists) {
      setAddedMistakes(prev => new Set([...prev, idx]));
      return;
    }

    const newMistake: MistakeItem = {
      id: Date.now().toString(),
      type: 'objective',
      source: ex.question,
      userAnswer: userSelections[idx] || '未作答',
      correctAnswer: ex.answer,
      analysis: ex.explanation,
      tags: ['综合能力', ex.typeLabel],
      addedAt: new Date().toISOString(),
      options: ex.options // Save options for context
    };

    localStorage.setItem('mistake_notebook', JSON.stringify([...notebook, newMistake]));
    setAddedMistakes(prev => new Set([...prev, idx]));
  };

  const handleDeepAnalysis = async () => {
    if (!lesson || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeReadingArticle(lesson.readingArticle.title, lesson.readingArticle.content);
      setAnalysis(result);
      setShowAnalysisModal(true);
    } catch (e) {
      alert("分析失败，请稍后重试。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const goToLab = () => {
    if (!lesson) return;
    localStorage.setItem('lab_source_override', lesson.exercise.question);
    if (onViewChange) onViewChange(AppView.TRANSLATION_LAB);
  };

  const addToVault = (vocab: any) => {
    const stored = localStorage.getItem('vocab_vault');
    const vault: VocabItem[] = stored ? JSON.parse(stored) : [];
    if (!vault.find((v: any) => v.word === vocab.word)) {
      const word: VocabItem = { 
        ...vocab, 
        addedAt: new Date().toISOString(), 
        level: 'C1', 
        mastery: 0,
        nextReviewAt: new Date().toISOString(),
        intervalDays: 0,
        reviewCount: 0
      };
      localStorage.setItem('vocab_vault', JSON.stringify([...vault, word]));
      setAddedWords(prev => new Set([...prev, vocab.word]));
    }
  };

  const markAsMastered = (word: string) => {
    const stored = localStorage.getItem('mastered_words');
    const masteredList = stored ? JSON.parse(stored) : [];
    if (!masteredList.includes(word)) {
      const newList = [...masteredList, word];
      localStorage.setItem('mastered_words', JSON.stringify(newList));
      setMasteredWords(new Set(newList));
    }
  };

  const completedCount = JSON.parse(localStorage.getItem('lessons_completed') || '[]').length;
  const currentMonth = Math.min(Math.ceil((completedCount + 1) / 30), 6);

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800">CATTI 备考工作台</h2>
          <p className="text-slate-500 font-medium">6个月精品进阶计划：第 {currentMonth} 阶段 (Month {currentMonth})</p>
        </div>
        <button 
          onClick={handleGenerateLesson} disabled={loadingLesson}
          className="flex items-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
        >
          {loadingLesson ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
          生成今日个性化课堂
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="bg-blue-50 text-blue-600 p-4 rounded-2xl w-fit mb-4"><Target size={24} /></div>
          <div className="text-2xl font-black text-slate-800">{masteredWordsCount.toLocaleString()}</div>
          <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">预估词汇量</div>
          {dueVocabCount > 0 && (
            <div 
              onClick={() => onViewChange?.(AppView.VOCABULARY)}
              className="mt-4 flex items-center gap-2 text-[10px] font-bold text-rose-500 bg-rose-50 px-3 py-2 rounded-xl cursor-pointer hover:bg-rose-100 transition-all animate-pulse"
            >
              <AlertCircle size={14} /> {dueVocabCount} 个词汇待复习
            </div>
          )}
        </div>
        {[
          { label: '备考倒计时', value: `${daysToExam} 天`, icon: Clock, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: '计划总进度', value: `${progress}%`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: '核心目标', value: 'CATTI 二级', icon: GraduationCap, color: 'text-purple-600', bg: 'bg-purple-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl w-fit mb-4`}><stat.icon size={24} /></div>
            <div className="text-2xl font-black text-slate-800">{stat.value}</div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {lesson ? (
        <div className="space-y-8">
          {/* Vocabulary Section */}
          <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="bg-slate-900 px-8 py-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3"><BookMarked size={24} /><h3 className="text-xl font-black">今日核心词汇 (综合能力)</h3></div>
              <span className="text-[10px] font-black bg-white/10 px-3 py-1 rounded-full uppercase">{lesson.vocabulary.length} WORDS</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <tbody className="divide-y divide-slate-50">
                  {lesson.vocabulary.map((v, i) => (
                    <tr key={i} className={`hover:bg-slate-50/50 transition-colors ${masteredWords.has(v.word) ? 'opacity-50' : ''}`}>
                      <td className="px-8 py-6 font-black text-slate-800 text-lg font-serif-en w-1/4">
                        <div className="flex items-center gap-3">
                          <span>{v.word}</span>
                          <button 
                            onClick={() => handleSpeak(`w-${v.word}`, v.word, 'word')}
                            className={`p-1.5 rounded-lg hover:bg-indigo-50 transition-all ${playingId === `w-${v.word}` ? 'text-indigo-600 animate-pulse' : 'text-slate-300'}`}
                          >
                            <Volume2 size={16} />
                          </button>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-slate-600 font-medium">
                        <div className="font-bold">{v.meaning}</div>
                        <div className="flex items-start gap-2 mt-2">
                          <button 
                            onClick={() => handleSpeak(`s-${v.word}`, v.usage, 'sentence')}
                            className={`mt-1.5 shrink-0 p-1 rounded-lg hover:bg-indigo-50 transition-all ${playingId === `s-${v.word}` ? 'text-indigo-600 animate-pulse' : 'text-slate-300'}`}
                          >
                            <Volume2 size={18} />
                          </button>
                          <div className="text-base text-slate-500 font-medium font-serif-en leading-relaxed">"{v.usage}"</div>
                        </div>
                      </td>
                      <td className="px-8 py-6 w-1/6">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => addToVault(v)} 
                            title="添加到生词本"
                            className={`p-3 rounded-xl transition-all ${addedWords.has(v.word) ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600'}`}
                          >
                            {addedWords.has(v.word) ? <Check size={20} /> : <Plus size={20} />}
                          </button>
                          <button 
                            onClick={() => markAsMastered(v.word)} 
                            disabled={masteredWords.has(v.word)}
                            title="设为已掌握 (下次不再出现)"
                            className={`p-3 rounded-xl transition-all ${masteredWords.has(v.word) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'}`}
                          >
                            <CheckCircle2 size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Comprehensive Exercises Section */}
          <section className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <HelpCircle className="text-purple-600" size={24} />
              <h3 className="text-xl font-black text-slate-800">综合能力专项训练</h3>
            </div>
            <div className="space-y-6">
              {lesson.comprehensiveExercises?.map((ex, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-100 rounded-[2rem] overflow-hidden">
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-4 py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-black uppercase tracking-widest">
                        {ex.typeLabel}
                      </span>
                    </div>
                    <div className="text-lg text-slate-800 font-medium mb-6 leading-relaxed whitespace-pre-wrap">
                      {ex.question}
                    </div>
                    
                    {ex.options && ex.options.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {ex.options.map((opt, i) => (
                          <button 
                            key={i} 
                            onClick={() => handleOptionSelect(idx, opt)}
                            disabled={revealedAnswers[idx]}
                            className={`px-6 py-4 rounded-xl border font-medium text-sm transition-all text-left relative ${
                              userSelections[idx] === opt
                                ? revealedAnswers[idx]
                                  ? opt === ex.answer 
                                    ? 'bg-emerald-500 text-white border-emerald-500' // Selected correct
                                    : 'bg-rose-500 text-white border-rose-500' // Selected wrong
                                  : 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-[1.01]' // Selected active
                                : revealedAnswers[idx] && opt === ex.answer
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold' // Correct but not selected
                                  : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300' // Default
                            }`}
                          >
                            <span className="mr-2 opacity-50 font-mono">{String.fromCharCode(65+i)}.</span> {opt.replace(/^[A-Z]\.\s*/, '')}
                            {revealedAnswers[idx] && opt === ex.answer && <CheckCircle2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2" />}
                            {revealedAnswers[idx] && userSelections[idx] === opt && opt !== ex.answer && <X size={16} className="absolute right-4 top-1/2 -translate-y-1/2" />}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <button 
                        onClick={() => toggleAnswer(idx)}
                        className="flex items-center gap-2 text-indigo-600 font-black text-sm hover:underline"
                      >
                        {revealedAnswers[idx] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        {revealedAnswers[idx] ? '收起解析' : '提交并查看解析'}
                      </button>
                    </div>
                  </div>

                  {revealedAnswers[idx] && (
                    <div className="px-8 py-8 bg-indigo-50/50 border-t border-indigo-100 animate-in slide-in-from-top-4 duration-300">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="text-emerald-500" size={18} />
                          <span className="font-black text-slate-800">正确答案：{ex.answer || "（AI 未生成答案，请参考解析）"}</span>
                        </div>
                        <button 
                          onClick={() => addToMistakes(ex, idx)}
                          disabled={addedMistakes.has(idx)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            addedMistakes.has(idx) 
                            ? 'bg-rose-100 text-rose-400 cursor-default' 
                            : 'bg-white text-rose-500 hover:bg-rose-500 hover:text-white shadow-sm'
                          }`}
                        >
                          {addedMistakes.has(idx) ? <Check size={14} /> : <BookX size={14} />}
                          {addedMistakes.has(idx) ? '已加入错题本' : '加入错题本'}
                        </button>
                      </div>
                      <div className="text-sm text-slate-600 leading-relaxed font-medium">
                        <span className="block font-black text-slate-400 uppercase text-[10px] tracking-widest mb-2">深度中文解析</span>
                        {ex.explanation}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* ... Reading, Translation, Checkin, Grammar sections unchanged ... */}
            <div className="lg:col-span-8 space-y-8">
              {/* Reading Section */}
              <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm relative">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-3"><BookOpen size={24} className="text-blue-600" /> 文章精读</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{lesson.readingArticle.source}</p>
                  </div>
                  <button onClick={handleDeepAnalysis} disabled={isAnalyzing} className="flex items-center gap-2 px-6 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-all">
                    {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Info size={16} />} 详解文章
                  </button>
                </div>
                <h4 className="text-2xl font-black text-slate-800 mb-6">{lesson.readingArticle.title}</h4>
                <div className="text-slate-700 leading-relaxed text-xl font-serif-en bg-slate-50 p-10 rounded-[2rem] border border-slate-100 shadow-inner">
                  {lesson.readingArticle.content}
                </div>
              </div>

              {/* Translation Practice */}
              <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-3"><PenTool size={24} className="text-emerald-600" /> 笔译实务练习</h3>
                  <span className="text-[10px] font-black px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full uppercase tracking-widest">{lesson.exercise.type}</span>
                </div>
                <p className="text-slate-700 text-2xl font-medium leading-relaxed italic mb-10 border-l-4 border-emerald-500 pl-8">
                  "{lesson.exercise.question}"
                </p>
                <button onClick={goToLab} className="w-full py-6 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-xl">
                  前往实验室提交答案 <ArrowRight size={20} />
                </button>
              </div>

              {/* Check-in Section */}
              <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-xl shadow-indigo-100 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black flex items-center gap-3"><CalendarCheck size={28} /> 完成今日修行？</h3>
                  <p className="text-indigo-100 font-medium">每天进步一点点，CATTI 二级证书就在眼前。</p>
                </div>
                <button 
                  onClick={handleCheckIn}
                  disabled={isCheckedIn}
                  className={`px-10 py-5 rounded-2xl font-black transition-all flex items-center gap-3 ${isCheckedIn ? 'bg-indigo-500 text-indigo-200 cursor-default' : 'bg-white text-indigo-600 hover:bg-indigo-50 shadow-2xl'}`}
                >
                  {isCheckedIn ? <Check size={24} /> : <Sparkles size={24} />}
                  {isCheckedIn ? '今日已打卡' : '完成学习并打卡'}
                </button>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-8">
              {/* Grammar Section */}
              <div className="bg-amber-50 rounded-[2.5rem] border border-amber-100 p-8 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-amber-900 flex items-center gap-3"><TrendingUp size={24} className="text-amber-600" /> 翻译语法</h3>
                  <button onClick={() => setIsGrammarCn(!isGrammarCn)} className="p-2 bg-white/60 text-amber-600 rounded-lg hover:bg-white transition-all shadow-sm">
                    <Languages size={18} />
                  </button>
                </div>
                <div className="space-y-4">
                  <h4 className="font-black text-amber-800 text-lg uppercase tracking-tight underline decoration-amber-200 decoration-4 underline-offset-4">{lesson.grammarPoint.topic}</h4>
                  <p className="text-amber-700 leading-relaxed font-medium">
                    {isGrammarCn ? lesson.grammarPoint.explanationCn : lesson.grammarPoint.explanation}
                  </p>
                  <div className="bg-white/80 p-6 rounded-2xl border border-amber-100 space-y-3">
                    <p className="text-sm italic text-slate-800 font-serif-en">{lesson.grammarPoint.example}</p>
                    {isGrammarCn && <p className="text-xs text-amber-600 font-bold">{lesson.grammarPoint.exampleCn}</p>}
                  </div>
                  <button onClick={() => setIsGrammarCn(!isGrammarCn)} className="text-xs font-black text-amber-600 hover:underline flex items-center gap-1 mt-4">
                    {isGrammarCn ? "Switch to English" : "查看中文对照"} <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] border border-dashed border-slate-200 p-24 text-center">
          <Sparkles size={48} className="text-slate-200 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-slate-800">暂无今日课堂内容</h3>
        </div>
      )}

      {/* Article Analysis Modal */}
      {showAnalysisModal && analysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
            <header className="px-10 py-8 bg-indigo-900 text-white flex justify-between items-center">
              <div><h3 className="text-2xl font-black">文章深度详解</h3><p className="text-indigo-300 text-sm">中文详解版 (Sentence Analysis)</p></div>
              <button onClick={() => setShowAnalysisModal(false)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"><X size={24} /></button>
            </header>
            <div className="flex-1 overflow-y-auto p-12 space-y-12">
              <section className="space-y-6">
                <h4 className="text-xl font-black text-slate-800 flex items-center gap-3"><div className="w-1.5 h-6 bg-indigo-600 rounded-full" /> 重点句式拆解 (中文解析)</h4>
                <div className="space-y-6">
                  {analysis.structures.map((s, idx) => (
                    <div key={idx} className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                      <p className="text-xl font-bold text-slate-800 mb-4 font-serif-en italic">"{s.original}"</p>
                      <p className="text-base text-slate-700导致逻辑转换 font-medium">{s.analysis}</p>
                    </div>
                  ))}
                </div>
              </section>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <section className="space-y-6">
                  <h4 className="text-xl font-black text-slate-800 flex items-center gap-3"><div className="w-1.5 h-6 bg-emerald-600 rounded-full" /> 翻译技巧运用</h4>
                  <div className="flex flex-wrap gap-3">{analysis.techniques.map((t, i) => <span key={i} className="px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-2xl font-bold text-sm border border-emerald-100">{t}</span>)}</div>
                </section>
                <section className="space-y-6">
                  <h4 className="text-xl font-black text-slate-800 flex items-center gap-3"><div className="w-1.5 h-6 bg-amber-500 rounded-full" /> 核心语法重点</h4>
                  <div className="bg-amber-50 p-6 rounded-3xl text-amber-900 text-base font-medium leading-relaxed">{analysis.grammarFocus}</div>
                </section>
              </div>
              <section className="space-y-6">
                <h4 className="text-xl font-black text-slate-800 flex items-center gap-3"><div className="w-1.5 h-6 bg-rose-600 rounded-full" /> 全文参考译文</h4>
                <div className="bg-slate-900 text-slate-100 p-10 rounded-[2.5rem] text-lg font-medium leading-relaxed">{analysis.referenceTranslation}</div>
              </section>
            </div>
            <footer className="p-8 border-t border-slate-100 flex justify-end">
              <button onClick={() => setShowAnalysisModal(false)} className="px-10 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all">掌握并关闭</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
