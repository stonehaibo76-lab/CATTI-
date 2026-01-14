
import React, { useState, useEffect } from 'react';
import { reviewTranslation, generateTranslationChallenge } from '../services/geminiService';
import { 
  ArrowRight, 
  Loader2, 
  RotateCcw, 
  Languages, 
  GraduationCap, 
  Save, 
  BookmarkCheck,
  AlertTriangle,
  Zap,
  BookOpenCheck,
  Repeat,
  Quote,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Info,
  Edit3
} from 'lucide-react';
import { LibrarySentence } from '../types';

const TranslationLab: React.FC = () => {
  const [sourceText, setSourceText] = useState("经济全球化是不可逆转的历史潮流，各方应携手合作，共同应对挑战。");
  const [sourceMeta, setSourceMeta] = useState<{context?: string, difficulty?: string, type?: string}>({
    context: "CATTI 入门精选",
    difficulty: "B1 -> B2 衔接",
    type: "C-E"
  });
  const [userTranslation, setUserTranslation] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingRandom, setLoadingRandom] = useState(false);
  const [review, setReview] = useState<any>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    const override = localStorage.getItem('lab_source_override');
    if (override) {
      setSourceText(override);
      setSourceMeta({ 
        context: "今日课堂指定练习", 
        difficulty: "当前阶段任务",
        type: "课堂练习" 
      });
      localStorage.removeItem('lab_source_override');
      setReview(null);
      setUserTranslation("");
    }
  }, []);

  const getCurrentPhaseStr = () => {
    const completedCount = JSON.parse(localStorage.getItem('lessons_completed') || '[]').length;
    const phaseNum = Math.min(Math.ceil((completedCount + 1) / 30), 6);
    return `第 ${phaseNum} 阶段`;
  };

  const handleRandomGenerate = async () => {
    setLoadingRandom(true);
    try {
      const phase = getCurrentPhaseStr();
      const challenge = await generateTranslationChallenge(phase);
      setSourceText(challenge.source);
      setSourceMeta({
        context: challenge.context,
        difficulty: challenge.difficulty,
        type: challenge.type
      });
      setUserTranslation("");
      setReview(null);
      setIsSaved(false);
    } catch (error) {
      alert("随机出题失败，请稍后重试。");
    } finally {
      setLoadingRandom(false);
    }
  };

  const handleReview = async () => {
    if (!userTranslation.trim()) return;
    setLoading(true);
    setIsSaved(false);
    try {
      const result = await reviewTranslation(sourceText, userTranslation);
      setReview(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const saveToLibrary = () => {
    if (!review) return;
    const stored = localStorage.getItem('sentence_library');
    const library: LibrarySentence[] = stored ? JSON.parse(stored) : [];
    
    const newSentence: LibrarySentence = {
      id: Date.now().toString(),
      source: sourceText,
      target: review.improvedVersion,
      tags: ['AI-Review', 'CATTI-L2'],
      addedAt: new Date().toISOString()
    };
    
    localStorage.setItem('sentence_library', JSON.stringify([...library, newSentence]));
    setIsSaved(true);
  };

  const executeReset = () => {
    setUserTranslation("");
    setReview(null);
    setIsSaved(false);
    setShowResetConfirm(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700">
      {/* 顶部工具栏 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 backdrop-blur-md p-4 rounded-3xl border border-white shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-4 px-2">
          <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-200">
            <Languages size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">翻译实验室</h2>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Expert Realtime Feedback</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleRandomGenerate}
            disabled={loadingRandom}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50 text-sm"
          >
            {loadingRandom ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} className="text-yellow-400 fill-yellow-400" />}
            AI 随机出题
          </button>
          <button 
            onClick={() => setShowResetConfirm(true)} 
            className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all border border-slate-100 bg-white"
            title="清空当前练习"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      {/* 使用 items-stretch 确保左右列高度一致 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* 左侧创作区 (60%) */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          {/* 原文卡片 */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group">
            <div className="px-8 py-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
               <div className="flex items-center gap-2">
                 <Quote size={16} className="text-indigo-600" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">待译原文 Source</span>
               </div>
               <div className="flex gap-2">
                 {sourceMeta.type && (
                   <span className={`px-3 py-1 text-[9px] font-black rounded-lg uppercase tracking-tight flex items-center gap-1.5 shadow-sm border ${
                     sourceMeta.type === 'C-E' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                   }`}>
                     {sourceMeta.type === 'C-E' ? '中译英' : '英译汉'}
                   </span>
                 )}
                 <span className="px-3 py-1 bg-white border border-slate-100 text-slate-500 text-[9px] font-bold rounded-lg uppercase shadow-sm">
                   {sourceMeta.context}
                 </span>
               </div>
            </div>
            <div className="p-10 relative">
              {loadingRandom && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex items-center justify-center animate-in fade-in">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 size={32} className="animate-spin text-indigo-600" />
                    <span className="text-xs font-black text-indigo-600 tracking-tighter uppercase">Generative loading...</span>
                  </div>
                </div>
              )}
              <div className="text-2xl font-bold text-slate-800 leading-relaxed font-serif-en">
                {sourceText}
              </div>
              <div className="mt-6 flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                <Info size={12} /> 难度系数：{sourceMeta.difficulty}
              </div>
            </div>
          </div>

          {/* 译文输入区 */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-lg overflow-hidden transition-all focus-within:ring-4 focus-within:ring-indigo-50 flex-1 flex flex-col">
            <div className="px-8 py-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
               <div className="flex items-center gap-2">
                 <Edit3 size={16} className="text-indigo-600" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">你的译文 Draft</span>
               </div>
               <span className="text-[10px] font-bold text-slate-300">{userTranslation.length} 字符</span>
            </div>
            <textarea
              className="w-full flex-1 min-h-[320px] p-10 text-xl text-slate-700 outline-none resize-none font-medium leading-relaxed bg-transparent placeholder:text-slate-200"
              placeholder={sourceMeta.type === 'C-E' ? "请开始你的英文翻译创作..." : "请开始你的中文翻译创作..."}
              value={userTranslation}
              onChange={(e) => setUserTranslation(e.target.value)}
            />
            <div className="p-8 pt-0">
              <button
                onClick={handleReview}
                disabled={loading || !userTranslation.trim() || loadingRandom}
                className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 disabled:opacity-50 group active:scale-[0.98]"
              >
                {loading ? <Loader2 className="animate-spin" /> : <BookOpenCheck size={20} className="group-hover:scale-110 transition-transform" />}
                提交并获取 AI 深度点评
              </button>
            </div>
          </div>
        </div>

        {/* 右侧反馈区 (40%) - 移除固定视口高度，改用 h-full 自动填充 Grid 高度 */}
        <div className="lg:col-span-5">
          <div className="bg-slate-900 rounded-[3rem] h-full shadow-2xl overflow-hidden flex flex-col border border-slate-800 transition-all duration-500">
            {!review && !loading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-8 animate-in zoom-in duration-500">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 animate-pulse"></div>
                  <div className="relative bg-white/5 p-10 rounded-[2.5rem] border border-white/5">
                    <Sparkles size={64} className="text-indigo-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white mb-3">等待批改中</h3>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-[240px] mx-auto font-medium">完成左侧翻译并提交，导师将实时对你的译文进行 CATTI 标准的打分与改进建议。</p>
                </div>
              </div>
            ) : loading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-8">
                <div className="relative">
                   <Loader2 size={80} className="animate-spin text-indigo-500 opacity-20" />
                   <div className="absolute inset-0 flex items-center justify-center">
                      <GraduationCap size={40} className="text-indigo-400" />
                   </div>
                </div>
                <div className="text-center">
                  <p className="text-indigo-400 font-black tracking-widest uppercase text-xs animate-pulse">Professor is evaluating...</p>
                  <p className="text-slate-500 text-[10px] mt-2 font-bold">正在比对标准译库与语料库</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10 animate-in slide-in-from-right-8 duration-700">
                {/* 专家总评 */}
                <section>
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1 h-1 bg-indigo-400 rounded-full"></div> 专家考评点评
                    </h4>
                    <button 
                      onClick={saveToLibrary}
                      disabled={isSaved}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[10px] transition-all border uppercase tracking-tighter ${isSaved ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-white/5 text-white hover:bg-white/10'}`}
                    >
                      {isSaved ? <CheckCircle2 size={14} /> : <Save size={14} />}
                      {isSaved ? 'Saved to Library' : 'Save Example'}
                    </button>
                  </div>
                  <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5">
                    <p className="text-slate-200 leading-relaxed text-lg font-medium italic">"{review.critique}"</p>
                  </div>
                </section>

                {/* 标准精译 */}
                <section>
                  <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <div className="w-1 h-1 bg-emerald-400 rounded-full"></div> 黄金参考译文
                  </h4>
                  <div className="p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-[2.5rem] relative group">
                    <div className="text-emerald-50 italic text-2xl leading-relaxed font-serif-en tracking-tight">
                      "{review.improvedVersion}"
                    </div>
                    <div className="absolute -top-4 -right-4 bg-emerald-500 text-white p-2 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <CheckCircle2 size={16} />
                    </div>
                  </div>
                </section>

                {/* 考点笔记 */}
                <section>
                  <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <div className="w-1 h-1 bg-amber-400 rounded-full"></div> CATTI 实务考点
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {review.cattiTips.map((tip: string, i: number) => (
                      <div key={i} className="flex gap-4 items-start bg-white/5 p-5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                        <div className="mt-1 bg-amber-500/20 p-1 rounded-lg text-amber-400">
                           <ChevronRight size={14} />
                        </div>
                        <span className="text-slate-300 text-sm font-medium leading-relaxed">{tip}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}
            {/* 底部装饰 */}
            <div className="p-6 border-t border-white/5 bg-black/20 flex justify-center mt-auto">
               <div className="flex items-center gap-2 text-[8px] font-black text-slate-600 uppercase tracking-[0.2em]">
                 Mastery Lab Powered by Gemini 3 Pro
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* 重置确认模态框 */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white rounded-[3rem] p-10 shadow-2xl relative animate-in zoom-in-95 duration-300">
            <div className="bg-amber-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-amber-600">
              <AlertTriangle size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 text-center mb-4">放弃当前进度？</h3>
            <p className="text-slate-500 text-center mb-8 font-medium">
              当前的译文和批改结果将会丢失，是否确认重置实验室？
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setShowResetConfirm(false)}
                className="py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all"
              >
                返回
              </button>
              <button 
                onClick={executeReset}
                className="py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
              >
                确认并清空
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranslationLab;
