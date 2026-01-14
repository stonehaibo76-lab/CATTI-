
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  X,
  Brain,
  History,
  CheckCircle2,
  Type as TypeIcon,
  CalendarDays,
  Volume2,
  Zap,
  Sword,
  Target,
  Waves,
  Eye,
  Info,
  Loader2,
  Skull,
  Flame,
  Check,
  TrendingUp,
  Clock,
  BookOpen,
  Tag,
  Gamepad2,
  ShieldAlert,
  Trophy,
  Heart,
  Timer as TimerIcon,
  Sparkles,
  ChevronRight,
  Layers,
  Bot
} from 'lucide-react';
import { VocabItem } from '../types';
import { speakText } from '../services/speechService';
import { generateVocabChallenge } from '../services/geminiService';
import * as XLSX from 'xlsx';

type ReviewMode = 'flashcard' | 'economist' | 'synonym' | 'shadowing';
type GameStatus = 'idle' | 'preparing' | 'playing' | 'won' | 'lost';

const VocabularyVault: React.FC = () => {
  const [vault, setVault] = useState<VocabItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBossWarning, setShowBossWarning] = useState(false); 
  const [showReviewModeSelector, setShowReviewModeSelector] = useState(false); // 新增：复习模式选择器
  const [useAiReview, setUseAiReview] = useState(true); // 新增：是否使用 AI 复习
  const [playingId, setPlayingId] = useState<string | null>(null);
  
  const [newWord, setNewWord] = useState({ word: '', meaning: '', usage: '', level: 'C1', pos: 'n.' });

  const posOptions = [
    { label: '名词 n.', value: 'n.' },
    { label: '动词 v.', value: 'v.' },
    { label: '形容词 adj.', value: 'adj.' },
    { label: '副词 adv.', value: 'adv.' },
    { label: '代词 pron.', value: 'pron.' },
    { label: '介词 prep.', value: 'prep.' },
    { label: '连词 conj.', value: 'conj.' },
    { label: '短语 phrase', value: 'phrase' },
  ];

  const levelOptions = ['B1', 'B2', 'C1', 'C2', 'CATTI 3', 'CATTI 2'];

  // ------------------- 游戏模式状态 -------------------
  const [duelMode, setDuelMode] = useState(false);
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [hp, setHp] = useState(100);
  const [combo, setCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [gameQueue, setGameQueue] = useState<VocabItem[]>([]);
  const [gameIndex, setGameIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [gameChallenge, setGameChallenge] = useState<any>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // ------------------- 基础数据逻辑 -------------------
  useEffect(() => {
    const loadVault = () => {
      const stored = localStorage.getItem('vocab_vault');
      const saved = stored ? JSON.parse(stored) : [];
      setVault(saved);
    };
    loadVault();
    window.addEventListener('storage', loadVault);
    return () => window.removeEventListener('storage', loadVault);
  }, []);

  const saveVault = (newVault: VocabItem[]) => {
    setVault(newVault);
    localStorage.setItem('vocab_vault', JSON.stringify(newVault));
    window.dispatchEvent(new Event('storage'));
  };

  const handleSpeak = async (id: string, text: string, type: 'word' | 'sentence') => {
    if (playingId) return;
    setPlayingId(id);
    await speakText(text, type);
    setPlayingId(null);
  };

  const getMemoryStage = (item: VocabItem) => {
    const interval = item.intervalDays || 0;
    if (interval === 0) return { label: 'New', color: 'bg-slate-100 text-slate-500', barColor: 'bg-slate-200' };
    if (interval < 3) return { label: 'Learning', color: 'bg-orange-100 text-orange-600', barColor: 'bg-orange-400' };
    if (interval < 14) return { label: 'Reviewing', color: 'bg-indigo-100 text-indigo-600', barColor: 'bg-indigo-400' };
    return { label: 'Mastered', color: 'bg-emerald-100 text-emerald-600', barColor: 'bg-emerald-500' };
  };

  const isBoss = (word: VocabItem) => (word.reviewCount || 0) >= 3 && (word.mastery || 0) < 2;

  // ------------------- 导入导出逻辑 -------------------
  const exportToExcel = () => {
    if (vault.length === 0) return alert("词汇库为空。");
    const data = vault.map(item => ({
      "单词 (Word)": item.word,
      "词性 (POS)": item.pos || 'n.',
      "含义 (Meaning)": item.meaning,
      "例句 (Usage)": item.usage,
      "等级 (Level)": item.level || 'C1',
      "掌握天数": item.intervalDays,
      "下次复习": item.nextReviewAt ? new Date(item.nextReviewAt).toLocaleDateString() : '即刻'
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "词汇库");
    XLSX.writeFile(workbook, `CATTI_Vocab_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const importFromExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        const existingWords = new Set(vault.map(v => v.word.trim().toLowerCase()));
        const importedItems: VocabItem[] = jsonData
          .filter(row => {
            const word = String(row['单词 (Word)'] || row['word'] || '').trim();
            return word && !existingWords.has(word.toLowerCase());
          })
          .map((row) => ({
            word: String(row['单词 (Word)'] || row['word']).trim(),
            pos: String(row['词性 (POS)'] || row['pos'] || 'n.').trim(),
            meaning: String(row['含义 (Meaning)'] || row['meaning'] || '').trim(),
            usage: String(row['例句 (Usage)'] || row['usage'] || '').trim(),
            level: String(row['等级 (Level)'] || row['level'] || 'C1').trim(),
            addedAt: new Date().toISOString(),
            mastery: 0,
            nextReviewAt: new Date().toISOString(),
            intervalDays: 0,
            reviewCount: 0
          }));

        if (importedItems.length > 0) {
          saveVault([...vault, ...importedItems]);
          alert(`成功导入 ${importedItems.length} 个单词。`);
        } else {
          alert("未发现可导入的新单词。");
        }
      } catch (err) { alert("导入失败，请检查 Excel 格式。"); }
      e.target.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  // ------------------- 词影对决核心逻辑 -------------------
  const startDuel = () => {
    const bosses = vault.filter(isBoss);
    if (bosses.length < 3) {
      setShowBossWarning(true); 
      return;
    }
    
    const queue = [...bosses].sort(() => 0.5 - Math.random()).slice(0, 10);
    setGameQueue(queue);
    setGameIndex(0);
    setHp(100);
    setCombo(0);
    setScore(0);
    setGameStatus('preparing');
    setDuelMode(true);
    loadGameRound(queue[0]);
  };

  const loadGameRound = async (wordItem: VocabItem) => {
    setGameStatus('preparing');
    setIsAnswered(false);
    setIsCorrect(null);
    setTimeLeft(12);
    
    try {
      const mode = Math.random() > 0.5 ? 'economist' : 'synonym';
      const challenge = await generateVocabChallenge(wordItem.word, mode);
      setGameChallenge(challenge);
      setGameStatus('playing');
    } catch (e) {
      setDuelMode(false);
      alert("AI 引擎波动，对决中断。");
    }
  };

  useEffect(() => {
    let timer: any;
    if (gameStatus === 'playing' && timeLeft > 0 && !isAnswered) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && !isAnswered && gameStatus === 'playing') {
      handleGameFeedback(null);
    }
    return () => clearInterval(timer);
  }, [gameStatus, timeLeft, isAnswered]);

  const handleGameFeedback = (selected: string | null) => {
    if (isAnswered) return;
    setIsAnswered(true);
    
    const correctWord = gameQueue[gameIndex].word;
    const isRight = selected?.trim().toLowerCase() === correctWord.toLowerCase() || 
                    (gameChallenge?.answer?.trim().toLowerCase() === selected?.trim().toLowerCase());

    setIsCorrect(isRight);

    if (isRight) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      setScore(prev => prev + (10 * newCombo));
      setHp(prev => Math.min(100, prev + 5));
      applyVictoryBonus(gameQueue[gameIndex]);
    } else {
      setCombo(0);
      setHp(prev => {
        const newHp = prev - 25;
        if (newHp <= 0) setTimeout(() => setGameStatus('lost'), 500);
        return newHp;
      });
    }

    setTimeout(() => {
      if (hp > 25 || (hp > 0 && isRight)) {
        if (gameIndex < gameQueue.length - 1) {
          setGameIndex(prev => prev + 1);
          loadGameRound(gameQueue[gameIndex + 1]);
        } else {
          setGameStatus('won');
        }
      }
    }, 2500);
  };

  const applyVictoryBonus = (wordItem: VocabItem) => {
    const updatedVault = vault.map(v => {
      if (v.word === wordItem.word) {
        const currentInterval = v.intervalDays || 1;
        const newInterval = Math.round(currentInterval * 3);
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + newInterval);
        return {
          ...v,
          intervalDays: newInterval,
          nextReviewAt: nextDate.toISOString(),
          reviewCount: (v.reviewCount || 0) + 1,
          mastery: Math.min(5, (v.mastery || 0) + 1)
        };
      }
      return v;
    });
    saveVault(updatedVault);
  };

  // ------------------- 复习模式逻辑 -------------------
  const dueWords = useMemo(() => vault.filter(v => !v.nextReviewAt || new Date(v.nextReviewAt) <= new Date()), [vault]);
  const stats = useMemo(() => {
    const total = vault.length;
    const due = dueWords.length;
    const mastered = vault.filter(v => (v.intervalDays || 0) >= 14).length;
    const learning = vault.filter(v => (v.intervalDays || 0) > 0 && (v.intervalDays || 0) < 14).length;
    return { total, due, mastered, learning };
  }, [vault, dueWords]);

  const [reviewMode, setReviewMode] = useState(false);
  const [reviewQueue, setReviewQueue] = useState<VocabItem[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [activeSubMode, setActiveSubMode] = useState<ReviewMode>('flashcard');
  const [challengeData, setChallengeData] = useState<any>(null);
  const [loadingChallenge, setLoadingChallenge] = useState(false);

  const startReviewFlow = () => {
    if (dueWords.length === 0) return alert("今日复习任务已完成！");
    setShowReviewModeSelector(true);
  };

  const confirmReview = (useAi: boolean) => {
    setUseAiReview(useAi);
    setShowReviewModeSelector(false);
    
    const queue = [...dueWords].sort((a, b) => ((b.reviewCount || 0) - (b.mastery || 0) * 2) - ((a.reviewCount || 0) - (a.mastery || 0) * 2));
    setReviewQueue(queue);
    setReviewIndex(0);
    setReviewMode(true);
    prepareReviewChallenge(queue[0], useAi);
  };

  const prepareReviewChallenge = async (wordItem: VocabItem, isAi: boolean = useAiReview) => {
    setIsFlipped(false);
    setChallengeData(null);
    
    if (!isAi) {
      setActiveSubMode('flashcard');
      return;
    }

    const modes: ReviewMode[] = ['flashcard', 'economist', 'synonym', 'shadowing'];
    const selectedMode = modes[Math.floor(Math.random() * modes.length)];
    setActiveSubMode(selectedMode);
    
    if (selectedMode === 'economist' || selectedMode === 'synonym') {
      setLoadingChallenge(true);
      try {
        const data = await generateVocabChallenge(wordItem.word, selectedMode);
        setChallengeData(data);
      } catch (e) { setActiveSubMode('flashcard'); }
      finally { setLoadingChallenge(false); }
    }
  };

  const handleSRSFeedback = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    const currentWord = reviewQueue[reviewIndex];
    const predictNextInterval = (currentInterval: number, r: string) => {
      if (r === 'again') return 0;
      if (r === 'hard') return Math.max(1, Math.round((currentInterval || 1) * 1.2));
      if (r === 'good') return Math.max(1, currentInterval === 0 ? 1 : Math.round(currentInterval * 2));
      return Math.max(2, currentInterval === 0 ? 3 : Math.round(currentInterval * 4));
    };
    const nextInterval = predictNextInterval(currentWord.intervalDays || 0, rating);
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + nextInterval);

    const updatedVault = vault.map(v => v.word === currentWord.word ? {
      ...v, intervalDays: nextInterval, nextReviewAt: nextReviewDate.toISOString(), reviewCount: (v.reviewCount || 0) + 1, mastery: Math.min(5, Math.floor(nextInterval / 10))
    } : v);

    saveVault(updatedVault);
    if (reviewIndex < reviewQueue.length - 1) {
      setReviewIndex(reviewIndex + 1);
      prepareReviewChallenge(reviewQueue[reviewIndex + 1]);
    } else {
      alert("复习完成！");
      setReviewMode(false);
    }
  };

  const deleteWord = (word: string) => {
    if (confirm(`确定要从库中删除 "${word}" 吗？`)) {
      const newVault = vault.filter(v => v.word !== word);
      saveVault(newVault);
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <header className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800">词汇宝库</h2>
          <p className="text-slate-500 font-medium">SRS 记忆引擎与 AI 竞技场已就绪。</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={exportToExcel} className="p-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 font-bold flex items-center gap-2 shadow-sm text-slate-600 transition-all" title="导出 Excel">
            <Download size={20} />
          </button>
          <label className="p-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 font-bold flex items-center gap-2 cursor-pointer shadow-sm text-slate-600 transition-all" title="导入 Excel">
            <Upload size={20} />
            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={importFromExcel} />
          </label>
          <button onClick={startDuel} className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-indigo-700 shadow-xl shadow-indigo-100 group transition-all">
            <Sword size={20} className="group-hover:rotate-12" />
            词影对决 (Game)
          </button>
          <button onClick={startReviewFlow} className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-slate-800 shadow-xl group transition-all">
            <Brain size={20} className="group-hover:animate-bounce text-indigo-400" /> 
            复习实验室 {dueWords.length > 0 && <span className="bg-indigo-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black">{dueWords.length}</span>}
          </button>
          <button onClick={() => setShowAddModal(true)} className="p-4 bg-white border border-slate-100 text-indigo-600 rounded-2xl hover:bg-indigo-50 transition-all shadow-sm"><Plus size={24} /></button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '待复习', val: stats.due, color: 'text-rose-500', icon: Clock },
          { label: '正在学', val: stats.learning, color: 'text-orange-500', icon: Zap },
          { label: '已掌握', val: stats.mastered, color: 'text-emerald-500', icon: CheckCircle2 },
          { label: '总词量', val: stats.total, color: 'text-slate-800', icon: TrendingUp }
        ].map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-2xl bg-slate-50 ${s.color}`}><s.icon size={20}/></div>
            <div><div className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{s.label}</div><div className={`text-2xl font-black ${s.color}`}>{s.val}</div></div>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input type="text" placeholder="快速检索记忆库 (单词、含义、例句)..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-14 pr-8 py-5 rounded-2xl border border-slate-100 focus:ring-4 focus:ring-indigo-50 outline-none transition-all shadow-sm text-lg" />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {vault.filter(v => 
          v.word.toLowerCase().includes(searchTerm.toLowerCase()) || 
          v.meaning.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.usage?.toLowerCase().includes(searchTerm.toLowerCase())
        ).map((w, i) => {
          const stage = getMemoryStage(w);
          return (
            <div key={i} className={`bg-white px-8 py-6 rounded-[2rem] border shadow-sm transition-all relative overflow-hidden flex flex-col md:flex-row md:items-center gap-6 ${isBoss(w) ? 'border-rose-100 ring-1 ring-rose-50' : 'border-slate-100'}`}>
              <div className="md:w-1/4 space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-2xl font-black text-slate-800 font-serif-en">{w.word}</h4>
                  <span className="text-indigo-400 font-bold text-xs">[{w.pos || 'n.'}]</span>
                  <button onClick={() => deleteWord(w.word)} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors ml-auto md:ml-0"><Trash2 size={14}/></button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black">{w.level || 'C1'}</span>
                  {isBoss(w) && <span className="flex items-center gap-1 text-[9px] font-black text-rose-500 uppercase"><Skull size={10}/> Boss</span>}
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <p className="text-slate-800 font-bold text-lg leading-tight">{w.meaning}</p>
                {w.usage && (
                  <div className="flex items-start gap-3">
                    <button onClick={() => handleSpeak(`v-${w.word}`, w.usage, 'sentence')} className="mt-1 p-1 text-slate-300 hover:text-indigo-500 transition-colors"><Volume2 size={14}/></button>
                    <p className="text-slate-500 text-sm font-serif-en italic border-l-2 border-slate-100 pl-3 leading-relaxed">"{w.usage}"</p>
                  </div>
                )}
              </div>
              <div className="md:w-1/5 space-y-2 border-l border-slate-50 pl-6">
                <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-1000 ${stage.barColor}`} style={{ width: `${Math.min(100, (w.intervalDays || 0) * 5)}%` }}></div>
                </div>
                <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                  <span className="flex items-center gap-1"><History size={10}/> {w.reviewCount} Revs</span>
                  <span className="flex items-center gap-1"><CalendarDays size={10}/> {w.intervalDays}d</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 复习模式选择器 - 新增 */}
      {showReviewModeSelector && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-white rounded-[3rem] p-12 shadow-2xl relative">
            <button onClick={() => setShowReviewModeSelector(false)} className="absolute top-8 right-8 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all"><X size={20} /></button>
            <div className="text-center mb-10">
              <h3 className="text-3xl font-black text-slate-800 mb-2">选择复习模式</h3>
              <p className="text-slate-500 font-medium">根据当前状态选择最适合的挑战方式</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button 
                onClick={() => confirmReview(true)}
                className="group p-8 rounded-[2.5rem] border-2 border-slate-50 bg-slate-50 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left relative overflow-hidden"
              >
                <div className="absolute -right-4 -top-4 text-indigo-100 group-hover:text-indigo-200 transition-colors">
                  <Sparkles size={120} />
                </div>
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-200">
                    <Bot size={28} />
                  </div>
                  <h4 className="text-xl font-black text-slate-800 mb-2">AI 深度增强</h4>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">包含经济学人语境、近义词辨析等 AI 挑战。适合深度掌握。</p>
                </div>
              </button>

              <button 
                onClick={() => confirmReview(false)}
                className="group p-8 rounded-[2.5rem] border-2 border-slate-50 bg-slate-50 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left relative overflow-hidden"
              >
                <div className="absolute -right-4 -top-4 text-emerald-100 group-hover:text-emerald-200 transition-colors">
                  <Layers size={120} />
                </div>
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-emerald-200">
                    <Zap size={28} />
                  </div>
                  <h4 className="text-xl font-black text-slate-800 mb-2">经典快速复习</h4>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">纯净闪卡模式，专注于词义与用法。极速刷词，无需等待 AI。</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 词影对决 (Duel Mode) UI */}
      {duelMode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 p-4 sm:p-8 animate-in fade-in duration-500">
          <div className="w-full max-w-5xl h-full max-h-[900px] bg-slate-900 rounded-[4rem] border border-white/10 shadow-2xl relative overflow-hidden flex flex-col">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 bg-indigo-500/10 blur-[120px] pointer-events-none"></div>
            
            <header className="px-12 py-8 flex flex-wrap items-center justify-between gap-8 z-10">
              <div className="flex items-center gap-6">
                <button onClick={() => { if(confirm("对决正在进行，确定逃跑吗？")) setDuelMode(false); }} className="p-3 bg-white/5 text-slate-400 hover:text-white rounded-2xl transition-all"><X size={24} /></button>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-white font-black uppercase text-xs tracking-widest"><Heart size={14} className="text-rose-500 fill-rose-500" /> Spirit Health</div>
                  <div className="w-64 h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-rose-500 transition-all duration-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]" style={{ width: `${hp}%` }}></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-12">
                <div className="text-center">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Combo</div>
                  <div className="text-4xl font-black text-indigo-400 tabular-nums">{combo}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Score</div>
                  <div className="text-4xl font-black text-white tabular-nums">{score}</div>
                </div>
                <div className={`w-20 h-20 rounded-3xl flex flex-col items-center justify-center border-2 transition-all ${timeLeft < 5 ? 'border-rose-500 bg-rose-500/10 animate-pulse' : 'border-white/10 bg-white/5'}`}>
                   <TimerIcon size={24} className={timeLeft < 5 ? 'text-rose-500' : 'text-slate-400'} />
                   <span className={`text-2xl font-black tabular-nums ${timeLeft < 5 ? 'text-rose-500' : 'text-white'}`}>{timeLeft}</span>
                </div>
              </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-12 z-10 relative">
              {gameStatus === 'preparing' ? (
                <div className="flex flex-col items-center gap-6 animate-pulse">
                  <Loader2 size={64} className="text-indigo-500 animate-spin" />
                  <p className="text-indigo-400 font-black tracking-widest uppercase text-xs">AI Boss Summoning...</p>
                </div>
              ) : gameStatus === 'playing' ? (
                <div className="w-full max-w-3xl space-y-12 animate-in zoom-in duration-300 text-center">
                   <div className="space-y-4">
                     <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-500 text-[10px] font-black uppercase tracking-widest"><Skull size={14}/> Boss Level Challenge</div>
                     <h3 className="text-7xl font-black text-white tracking-tighter font-serif-en italic">{gameQueue[gameIndex].word}</h3>
                   </div>
                   <div className="bg-white/5 backdrop-blur-sm p-10 rounded-[3rem] border border-white/5 relative min-h-[160px] flex items-center justify-center">
                      {isCorrect !== null && (
                        <div className={`absolute -top-10 left-1/2 -translate-x-1/2 px-8 py-3 rounded-2xl font-black text-white animate-in slide-in-from-bottom-4 shadow-2xl ${isCorrect ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                          {isCorrect ? 'PERFECT! +Spirit' : 'MISSED! -25 HP'}
                        </div>
                      )}
                      <p className="text-2xl text-slate-300 font-serif-en leading-relaxed">"{gameChallenge?.content || gameQueue[gameIndex].meaning}"</p>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(gameChallenge?.options || [gameQueue[gameIndex].meaning, "干扰项 A", "干扰项 B", "干扰项 C"]).sort(() => 0.5 - Math.random()).map((opt: string, i: number) => (
                        <button 
                          key={i}
                          disabled={isAnswered}
                          onClick={() => handleGameFeedback(opt)}
                          className={`group p-6 rounded-[2rem] border-2 text-left transition-all ${
                            isAnswered 
                              ? (opt === gameQueue[gameIndex].word || opt === gameChallenge?.answer || opt === gameQueue[gameIndex].meaning)
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                                : 'bg-white/5 border-white/5 text-slate-600 opacity-50'
                              : 'bg-white/5 border-white/5 text-slate-300 hover:border-indigo-500 hover:bg-indigo-500/10 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-lg">{opt}</span>
                            {!isAnswered && <ChevronRight size={20} className="opacity-0 group-hover:opacity-100 transition-all" />}
                          </div>
                        </button>
                      ))}
                   </div>
                </div>
              ) : gameStatus === 'won' ? (
                <div className="text-center space-y-8 animate-in zoom-in duration-500">
                   <div className="w-32 h-32 bg-indigo-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(99,102,241,0.4)]"><Trophy size={64} className="text-white" /></div>
                   <h3 className="text-6xl font-black text-white">DEFEATED THE BOSSES!</h3>
                   <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5 grid grid-cols-3 gap-8">
                      <div><div className="text-[10px] font-black text-slate-500 uppercase mb-1">Score</div><div className="text-4xl font-black text-white">{score}</div></div>
                      <div><div className="text-[10px] font-black text-slate-500 uppercase mb-1">Words Smashed</div><div className="text-4xl font-black text-white">{gameQueue.length}</div></div>
                      <div><div className="text-[10px] font-black text-slate-500 uppercase mb-1">XP Boost</div><div className="text-4xl font-black text-emerald-400">Triple</div></div>
                   </div>
                   <button onClick={() => setDuelMode(false)} className="px-12 py-5 bg-white text-slate-900 rounded-3xl font-black text-xl hover:bg-indigo-50 transition-all shadow-2xl">Return to Vault</button>
                </div>
              ) : (
                <div className="text-center space-y-8 animate-in zoom-in duration-500">
                   <div className="w-32 h-32 bg-rose-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto border-2 border-rose-500/30"><Skull size={64} className="text-rose-500" /></div>
                   <h3 className="text-6xl font-black text-white">DUEL FAILED</h3>
                   <button onClick={startDuel} className="px-12 py-5 bg-rose-500 text-white rounded-3xl font-black text-xl hover:bg-rose-600 transition-all shadow-2xl">Re-try Boss Rush</button>
                </div>
              )}
            </main>
          </div>
        </div>
      )}

      {/* Manual Add Modal - Enhanced */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-[3rem] p-12 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowAddModal(false)} className="absolute top-8 right-8 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all"><X size={20} /></button>
            <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3"><TypeIcon className="text-indigo-600" /> 录入新词汇</h3>
            <form onSubmit={(e) => {
               e.preventDefault();
               saveVault([...vault, { ...newWord, addedAt: new Date().toISOString(), mastery: 0, nextReviewAt: new Date().toISOString(), intervalDays: 0, reviewCount: 0 }]);
               setShowAddModal(false);
               setNewWord({ word: '', meaning: '', usage: '', level: 'C1', pos: 'n.' });
            }} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">单词</label>
                  <input type="text" required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-serif-en text-lg" value={newWord.word} onChange={e => setNewWord({...newWord, word: e.target.value})} placeholder="word" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">词性</label>
                  <select className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-bold" value={newWord.pos} onChange={e => setNewWord({...newWord, pos: e.target.value})}>
                    {posOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">中文释义</label>
                <input type="text" required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-4 focus:ring-indigo-50 transition-all" value={newWord.meaning} onChange={e => setNewWord({...newWord, meaning: e.target.value})} placeholder="输入核心词义" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">难度分级</label>
                <select className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-bold" value={newWord.level} onChange={e => setNewWord({...newWord, level: e.target.value})}>
                  {levelOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">例句 (Usage)</label>
                <textarea className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none h-24 resize-none transition-all font-serif-en italic" value={newWord.usage} onChange={e => setNewWord({...newWord, usage: e.target.value})} placeholder="输入地道例句，增强记忆语境..." />
              </div>
              <button type="submit" className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl shadow-xl hover:bg-slate-800 transition-all">录入实验室</button>
            </form>
          </div>
        </div>
      )}

      {/* Boss Warning Modal */}
      {showBossWarning && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-[3rem] p-12 shadow-2xl relative text-center">
            <div className="bg-rose-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-rose-600">
              <ShieldAlert size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-4">对决门槛未达成</h3>
            <p className="text-slate-500 mb-8 font-medium leading-relaxed">
              你的词库中目前还没有足够的 'Boss' (复习多次仍未掌握) 单词。<br/>请先进行常规复习！
            </p>
            <button 
              onClick={() => setShowBossWarning(false)}
              className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl active:scale-95"
            >
              我知道了
            </button>
          </div>
        </div>
      )}

      {/* Review Mode (Enhanced with AI toggle) */}
      {reviewMode && reviewQueue.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-3xl bg-white rounded-[4rem] p-20 text-center min-h-[600px] flex flex-col relative">
            <button onClick={() => setReviewMode(false)} className="absolute top-10 right-10 p-3 text-slate-300 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-all"><X size={24} /></button>
            <div className="mb-12 flex justify-between items-center">
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2 ${useAiReview ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {useAiReview ? <Bot size={14} /> : <Zap size={14} />}
                {useAiReview ? `AI: ${activeSubMode}` : 'Standard Flashcard'}
              </span>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Remain: {reviewQueue.length - reviewIndex}</span>
            </div>
            
            <div className="flex-1 flex flex-col justify-center">
              {loadingChallenge ? (
                <div className="flex flex-col items-center gap-4 animate-pulse"><Loader2 size={40} className="animate-spin text-indigo-500" /><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">AI Summoning Context...</p></div>
              ) : (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <h3 className="text-7xl font-black text-slate-800 font-serif-en">{reviewQueue[reviewIndex].word}</h3>
                    <p className="text-indigo-400 font-bold italic text-xl">[{reviewQueue[reviewIndex].pos || 'n.'}]</p>
                  </div>
                  <div className="min-h-[160px] flex items-center justify-center">
                    {isFlipped ? (
                      <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 w-full animate-in slide-in-from-bottom-4 shadow-inner">
                        <p className="text-4xl font-black text-indigo-700 mb-6">{reviewQueue[reviewIndex].meaning}</p>
                        <div className="flex items-start gap-3 justify-center">
                          <Quote className="text-slate-200 mt-1" size={16} />
                          <p className="text-sm text-slate-400 font-serif-en italic max-w-md">"{reviewQueue[reviewIndex].usage}"</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-2xl text-slate-400 font-medium italic leading-relaxed">
                        {(!useAiReview || activeSubMode === 'flashcard') ? 'Recall the meaning & core usage...' : challengeData?.content || 'Identify the word in context...'}
                      </p>
                    )}
                  </div>
                  {!isFlipped ? (
                    <button onClick={() => setIsFlipped(true)} className="px-16 py-6 bg-slate-900 text-white rounded-3xl font-black text-xl shadow-2xl hover:bg-slate-800 transition-all active:scale-95">Reveal Answer</button>
                  ) : (
                    <div className="grid grid-cols-4 gap-4 max-w-xl mx-auto">
                      {[
                        { key: 'again', color: 'hover:bg-rose-500' },
                        { key: 'hard', color: 'hover:bg-orange-500' },
                        { key: 'good', color: 'hover:bg-emerald-500' },
                        { key: 'easy', color: 'hover:bg-indigo-600' }
                      ].map(k => (
                        <button 
                          key={k.key} 
                          onClick={() => handleSRSFeedback(k.key as any)} 
                          className={`py-5 bg-slate-100 text-slate-600 ${k.color} hover:text-white rounded-2xl font-black transition-all capitalize shadow-sm`}
                        >
                          {k.key}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper components missing from earlier snippet but required for visual consistency
const Quote = ({ className, size }: { className?: string, size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.75-2-2-2H4c-1.25 0-2 .75-2 2v3c0 1.25.75 2 2 2h3c0 4-4 6-4 6" />
    <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.75-2-2-2h-4c-1.25 0-2 .75-2 2v3c0 1.25.75 2 2 2h3c0 4-4 6-4 6" />
  </svg>
);

export default VocabularyVault;
