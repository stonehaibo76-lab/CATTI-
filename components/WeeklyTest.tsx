
import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Clock, 
  ShieldCheck, 
  ArrowRight, 
  Loader2, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  ChevronRight, 
  ChevronLeft, 
  Send, 
  Trophy, 
  History, 
  X,
  Timer,
  Zap,
  Coffee,
  Activity,
  Languages,
  BookOpen,
  Edit3
} from 'lucide-react';
import { generateWeeklyTest, evaluateWeeklyTest } from '../services/geminiService';

const WeeklyTest: React.FC = () => {
  const [testStarted, setTestStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testPaper, setTestPaper] = useState<any>(null);
  const [selectedDuration, setSelectedDuration] = useState(5400); 
  const [userAnswers, setUserAnswers] = useState<any>({
    vocabulary: {},
    cloze: {},
    reading: {},
    translationEC: "",
    translationCE: ""
  });
  const [currentSection, setCurrentSection] = useState<'intro' | 'vocabulary' | 'cloze' | 'reading' | 'translation' | 'result'>('intro');
  const [evaluating, setEvaluating] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(5400);

  useEffect(() => {
    let timer: any;
    if (testStarted && timeLeft > 0 && currentSection !== 'result') {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && testStarted && currentSection !== 'result') {
      handleSubmit();
    }
    return () => clearInterval(timer);
  }, [testStarted, timeLeft, currentSection]);

  const startNewTest = async () => {
    setLoading(true);
    try {
      const paper = await generateWeeklyTest();
      setTestPaper(paper);
      setTestStarted(true);
      setCurrentSection('vocabulary');
      setTimeLeft(selectedDuration);
    } catch (e) {
      alert("试卷生成失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (timeLeft > 0 && !window.confirm("确定要提交试卷吗？交卷后将由 AI 导师进行深度点评。")) return;
    setEvaluating(true);
    try {
      const result = await evaluateWeeklyTest(testPaper, userAnswers);
      setTestResult(result);
      setCurrentSection('result');
    } catch (e) {
      alert("批改失败，请检查网络。");
    } finally {
      setEvaluating(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const durationOptions = [
    { label: '魔鬼模式', time: 3600, desc: '60min 高压模拟', icon: Zap, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100' },
    { label: '标准模式', time: 5400, desc: '90min 科学配时', icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    { label: '沉浸模式', time: 7200, desc: '120min 深度打磨', icon: Coffee, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  ];

  if (currentSection === 'result' && testResult) {
    return (
      <div className="max-w-4xl mx-auto py-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden">
          <header className="bg-slate-900 p-12 text-center text-white relative">
             <div className="absolute top-10 right-10 flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/10 text-xs font-bold">
                <History size={14} /> 考后复盘
             </div>
             <div className="inline-flex items-center justify-center w-24 h-24 bg-indigo-600 rounded-full mb-6 border-4 border-white/20 shadow-2xl">
                <Trophy size={48} />
             </div>
             <h2 className="text-4xl font-black mb-2 tracking-tight">模拟测试报告</h2>
             <div className="text-7xl font-black text-indigo-400 mt-4 mb-2 tabular-nums">{testResult.score}<span className="text-xl text-white/50 ml-2">/ 100</span></div>
             <p className="text-slate-400 max-w-lg mx-auto font-medium leading-relaxed">{testResult.generalFeedback}</p>
          </header>

          <div className="p-12 space-y-12">
            {testResult.sections.map((sec: any, idx: number) => (
              <section key={idx} className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-indigo-600 rounded-full" /> {sec.title}
                  </h3>
                  <span className="font-bold text-indigo-600 bg-indigo-50 px-4 py-1 rounded-full text-sm">得分: {sec.score}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">正确答案与标准译文</label>
                      <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 text-emerald-900 text-sm font-medium leading-relaxed whitespace-pre-wrap font-serif-en italic">
                        {sec.correctAnswers}
                      </div>
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">导师深度点评</label>
                      <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 text-indigo-900 text-sm font-medium leading-relaxed">
                        {sec.critique}
                      </div>
                   </div>
                </div>
              </section>
            ))}
          </div>
          <footer className="p-10 bg-slate-50 border-t border-slate-100 flex justify-center">
            <button onClick={() => { setTestStarted(false); setCurrentSection('intro'); }} className="px-16 py-5 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-all active:scale-95">返回学习面板</button>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8">
      {currentSection === 'intro' ? (
        <div className="max-w-5xl mx-auto bg-white rounded-[3rem] border border-slate-100 p-16 text-center shadow-sm animate-in fade-in duration-500">
          <div className="bg-indigo-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 rotate-3 shadow-inner">
            <ClipboardList size={48} className="text-indigo-600 -rotate-3" />
          </div>
          <h2 className="text-4xl font-black text-slate-800 mb-6 tracking-tight">CATTI 二级全真模拟周测</h2>
          <p className="text-slate-500 mb-12 max-w-2xl mx-auto text-xl leading-relaxed font-medium">
            本试卷严格对标 CATTI 2 级。涵盖综合能力（词汇、完形、阅读）与翻译实务（英译汉、中译英）。
          </p>
          
          <div className="mb-12">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">选择测验时长 (Mode Select)</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {durationOptions.map((opt) => (
                <button
                  key={opt.time}
                  onClick={() => setSelectedDuration(opt.time)}
                  className={`p-6 rounded-[2rem] border-2 text-left transition-all relative overflow-hidden group ${
                    selectedDuration === opt.time 
                    ? `${opt.bg} ${opt.border} ring-4 ring-indigo-50` 
                    : 'bg-white border-slate-50 hover:border-slate-100'
                  }`}
                >
                  <div className={`mb-4 ${opt.color} flex justify-between items-start`}>
                    <opt.icon size={28} />
                    {selectedDuration === opt.time && <CheckCircle size={20} className="animate-in zoom-in" />}
                  </div>
                  <h4 className="font-black text-slate-800 text-lg mb-1">{opt.label}</h4>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-8">
            <button 
              onClick={startNewTest}
              disabled={loading}
              className="bg-slate-900 text-white px-20 py-6 rounded-3xl font-black text-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-4 disabled:opacity-50 shadow-2xl active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : <ArrowRight size={24} />}
              立即开始模拟测试
            </button>
            <div className="flex items-center gap-10">
               <div className="flex items-center gap-2 text-xs font-bold text-slate-400"><Clock size={14}/> 建议周末上午完成</div>
               <div className="flex items-center gap-2 text-xs font-bold text-slate-400"><ShieldCheck size={14}/> 包含综合+实务</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 h-[calc(100vh-140px)]">
          {/* Left Panel: Questions */}
          <div className="lg:col-span-8 bg-white rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden">
            <header className="bg-slate-900 px-10 py-6 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-6">
                <div className="bg-indigo-600 px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Timer size={14} /> Exam Mode
                </div>
                <h3 className="text-xl font-black tracking-tight">CATTI 二级模拟卷</h3>
              </div>
              <div className={`flex items-center gap-4 px-8 py-3 rounded-2xl font-black font-mono text-2xl shadow-inner ${timeLeft < 300 ? 'bg-rose-500 text-white animate-pulse' : 'bg-white/10 text-indigo-400'}`}>
                <Clock size={24} className={timeLeft < 300 ? 'animate-bounce' : ''} /> {formatTime(timeLeft)}
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
              {currentSection === 'vocabulary' && (
                <div className="space-y-12 animate-in slide-in-from-right-4 duration-500">
                   <div className="space-y-2">
                     <h4 className="text-2xl font-black text-slate-800 border-l-4 border-indigo-600 pl-6 uppercase tracking-tight">Section I: Vocabulary & Grammar</h4>
                     <p className="text-slate-400 text-xs font-bold ml-6 uppercase tracking-widest">词汇语法客观选择 (10道)</p>
                   </div>
                   {testPaper.vocabulary.map((q: any, idx: number) => (
                     <div key={q.id} className="space-y-6 bg-slate-50/50 p-8 rounded-[2rem] border border-slate-50">
                        <div className="text-xl font-bold text-slate-800 leading-relaxed">
                          <span className="text-indigo-600 mr-2">{idx + 1}.</span> {q.question}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {q.options.map((opt: string, i: number) => (
                             <button 
                               key={i}
                               onClick={() => setUserAnswers({
                                 ...userAnswers,
                                 vocabulary: { ...userAnswers.vocabulary, [q.id]: opt }
                               })}
                               className={`px-8 py-5 rounded-2xl border text-left font-bold transition-all relative ${
                                 userAnswers.vocabulary[q.id] === opt 
                                 ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl scale-[1.02] z-10' 
                                 : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50 hover:border-indigo-100'
                               }`}
                             >
                               {opt}
                             </button>
                           ))}
                        </div>
                     </div>
                   ))}
                </div>
              )}

              {currentSection === 'cloze' && (
                <div className="space-y-12 animate-in slide-in-from-right-4 duration-500">
                   <div className="space-y-2">
                     <h4 className="text-2xl font-black text-slate-800 border-l-4 border-amber-500 pl-6 uppercase tracking-tight">Section II: Cloze</h4>
                     <p className="text-slate-400 text-xs font-bold ml-6 uppercase tracking-widest">完形填空：根据上下文选择最佳项</p>
                   </div>
                   <div className="bg-slate-900 p-12 rounded-[3rem] border border-slate-800 shadow-2xl">
                      <div className="text-2xl font-medium text-slate-200 leading-relaxed italic font-serif-en">
                        {testPaper.cloze.text}
                      </div>
                   </div>
                   <div className="space-y-8">
                      {testPaper.cloze.items.map((item: any) => (
                        <div key={item.id} className="flex flex-col md:flex-row gap-6 items-center">
                           <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black">[{item.id}]</div>
                           <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {item.options.map((opt: string, i: number) => (
                                <button 
                                  key={i}
                                  onClick={() => setUserAnswers({
                                    ...userAnswers,
                                    cloze: { ...userAnswers.cloze, [item.id]: opt }
                                  })}
                                  className={`px-4 py-3 rounded-xl border font-bold text-sm transition-all ${
                                    userAnswers.cloze[item.id] === opt ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-100'
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              )}

              {currentSection === 'reading' && (
                <div className="space-y-12 animate-in slide-in-from-right-4 duration-500 h-full flex flex-col">
                   <div className="space-y-2">
                     <h4 className="text-2xl font-black text-slate-800 border-l-4 border-purple-500 pl-6 uppercase tracking-tight">Section III: Reading Comprehension</h4>
                     <p className="text-slate-400 text-xs font-bold ml-6 uppercase tracking-widest">阅读理解：深度剖析文章逻辑</p>
                   </div>
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-hidden min-h-[500px]">
                      <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 overflow-y-auto text-lg font-serif-en leading-relaxed italic shadow-inner">
                        {testPaper.reading.article}
                      </div>
                      <div className="space-y-8 overflow-y-auto pr-4">
                         {testPaper.reading.questions.map((q: any) => (
                           <div key={q.id} className="space-y-4">
                              <p className="font-bold text-slate-800">{q.id}. {q.question}</p>
                              <div className="space-y-2">
                                 {q.options.map((opt: string, i: number) => (
                                   <button 
                                     key={i}
                                     onClick={() => setUserAnswers({...userAnswers, reading: {...userAnswers.reading, [q.id]: opt}})}
                                     className={`w-full text-left px-6 py-4 rounded-2xl border font-medium text-sm transition-all ${
                                       userAnswers.reading[q.id] === opt ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-100 hover:bg-slate-50'
                                     }`}
                                   >
                                     {opt}
                                   </button>
                                 ))}
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
              )}

              {currentSection === 'translation' && (
                <div className="space-y-20 animate-in slide-in-from-right-4 duration-500">
                   <div className="space-y-10">
                      <div className="space-y-2">
                        <h4 className="text-2xl font-black text-slate-800 border-l-4 border-emerald-500 pl-6 uppercase tracking-tight">Section IV: Translation (E-C)</h4>
                        <p className="text-slate-400 text-xs font-bold ml-6 uppercase tracking-widest">英译汉实务：注意语序调整</p>
                      </div>
                      <div className="bg-slate-50 p-12 rounded-[3rem] border border-slate-100 text-2xl font-serif-en leading-relaxed text-slate-700 italic shadow-inner">
                        {testPaper.translationEC.source}
                      </div>
                      <textarea 
                        className="w-full h-80 p-10 bg-white border border-slate-100 rounded-[3rem] focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-xl font-medium resize-none shadow-sm leading-relaxed"
                        placeholder="请输入你的中文译文..."
                        value={userAnswers.translationEC}
                        onChange={e => setUserAnswers({...userAnswers, translationEC: e.target.value})}
                      />
                   </div>
                   <div className="space-y-10">
                      <div className="space-y-2">
                        <h4 className="text-2xl font-black text-slate-800 border-l-4 border-rose-500 pl-6 uppercase tracking-tight">Section V: Translation (C-E)</h4>
                        <p className="text-slate-400 text-xs font-bold ml-6 uppercase tracking-widest">中译英实务：注意时态与主语选择</p>
                      </div>
                      <div className="bg-slate-50 p-12 rounded-[3rem] border border-slate-100 text-2xl leading-relaxed text-slate-700 font-bold shadow-inner">
                        {testPaper.translationCE.source}
                      </div>
                      <textarea 
                        className="w-full h-80 p-10 bg-white border border-slate-100 rounded-[3rem] focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-xl font-serif-en italic resize-none shadow-sm leading-relaxed"
                        placeholder="请输入你的英文译文..."
                        value={userAnswers.translationCE}
                        onChange={e => setUserAnswers({...userAnswers, translationCE: e.target.value})}
                      />
                   </div>
                </div>
              )}
            </div>

            <footer className="px-12 py-8 border-t border-slate-100 flex justify-between bg-slate-50/50 backdrop-blur-md">
               <button 
                 onClick={() => {
                   if (currentSection === 'translation') setCurrentSection('reading');
                   else if (currentSection === 'reading') setCurrentSection('cloze');
                   else if (currentSection === 'cloze') setCurrentSection('vocabulary');
                 }}
                 disabled={currentSection === 'vocabulary'}
                 className="flex items-center gap-3 px-10 py-5 bg-white border border-slate-200 text-slate-600 font-black rounded-2xl hover:bg-slate-100 transition-all disabled:opacity-30 active:scale-95"
               >
                 <ChevronLeft size={24} /> 上一环节
               </button>
               <div className="flex gap-6">
                 {currentSection !== 'translation' ? (
                   <button 
                     onClick={() => {
                        if (currentSection === 'vocabulary') setCurrentSection('cloze');
                        else if (currentSection === 'cloze') setCurrentSection('reading');
                        else if (currentSection === 'reading') setCurrentSection('translation');
                     }}
                     className="flex items-center gap-3 px-12 py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
                   >
                     下一环节 <ChevronRight size={24} />
                   </button>
                 ) : (
                   <button 
                     onClick={handleSubmit}
                     disabled={evaluating}
                     className="flex items-center gap-4 px-14 py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 shadow-2xl transition-all disabled:opacity-50 active:scale-95"
                   >
                     {evaluating ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
                     立即交卷
                   </button>
                 )}
               </div>
            </footer>
          </div>
          
          {/* Right Panel: Navigator */}
          <div className="lg:col-span-4 space-y-8 h-full flex flex-col">
            <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm flex-1 overflow-y-auto">
               <h4 className="font-black text-slate-800 mb-10 flex items-center gap-3 text-lg">
                 <ClipboardList size={24} className="text-indigo-600" /> 考场题库导航
               </h4>
               
               <div className="space-y-12">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-2">Vocabulary (MCQ)</p>
                    <div className="grid grid-cols-5 gap-3">
                      {testPaper.vocabulary.map((q: any, i: number) => (
                        <button 
                          key={q.id}
                          onClick={() => setCurrentSection('vocabulary')}
                          className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${
                            userAnswers.vocabulary[q.id] ? 'bg-emerald-500 text-white' : currentSection === 'vocabulary' ? 'ring-2 ring-indigo-600 text-indigo-600' : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-2">Cloze & Reading</p>
                    <div className="flex gap-4">
                       <button onClick={() => setCurrentSection('cloze')} className={`flex-1 p-4 rounded-2xl font-black text-sm transition-all ${currentSection === 'cloze' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}>Cloze</button>
                       <button onClick={() => setCurrentSection('reading')} className={`flex-1 p-4 rounded-2xl font-black text-sm transition-all ${currentSection === 'reading' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}>Reading</button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-50 pb-2">Translation Practice</p>
                    <button 
                      onClick={() => setCurrentSection('translation')}
                      className={`w-full p-6 rounded-2xl font-black text-left flex items-center justify-between transition-all border-2 ${
                        currentSection === 'translation' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-slate-50 text-slate-400 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3"><Languages size={18}/> <span>Practical Test</span></div>
                      {userAnswers.translationEC && userAnswers.translationCE ? <CheckCircle size={20} className="text-emerald-500" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-200"/>}
                    </button>
                  </div>
               </div>

               <div className="mt-16 p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100">
                  <h5 className="font-black text-amber-800 text-xs mb-3 flex items-center gap-2">
                    <AlertCircle size={16} /> 考场说明
                  </h5>
                  <p className="text-xs text-amber-700 leading-relaxed font-medium italic">
                    测试涵盖 CATTI 二级综合三项（词汇、完形、阅读）及实务两项。
                  </p>
               </div>
            </div>

            <button 
              onClick={() => { if(confirm("确定要提前离场吗？")) setTestStarted(false); }} 
              className="w-full py-6 bg-white border border-slate-200 text-slate-400 font-bold rounded-3xl hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center gap-3 shadow-sm"
            >
              <X size={20} /> 放弃本次测验
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyTest;
