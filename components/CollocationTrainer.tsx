
import React, { useState, useEffect } from 'react';
import { 
  Link2, 
  Sparkles, 
  Leaf, 
  TrendingUp, 
  Cpu, 
  Gavel, 
  Landmark, 
  BookOpen, 
  Plus, 
  Check, 
  Trash2,
  Loader2,
  RefreshCw,
  Search,
  Tag,
  Play,
  Download,
  Upload,
  X,
  ChevronRight,
  RotateCw
} from 'lucide-react';
import { generateCollocations } from '../services/geminiService';
import { CollocationItem } from '../types';
import * as XLSX from 'xlsx';

const CollocationTrainer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generate' | 'library'>('generate');
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [generatedList, setGeneratedList] = useState<Omit<CollocationItem, 'id' | 'addedAt'>[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedLibrary, setSavedLibrary] = useState<CollocationItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Practice Mode State
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [practiceQueue, setPracticeQueue] = useState<CollocationItem[]>([]);
  const [currentPracticeIndex, setCurrentPracticeIndex] = useState(0);
  const [showPracticeAnswer, setShowPracticeAnswer] = useState(false);

  const themes = [
    { id: 'Economy & Trade', label: '经济贸易', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { id: 'Environment', label: '生态环保', icon: Leaf, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
    { id: 'Sci-Tech', label: '科技创新', icon: Cpu, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    { id: 'Politics', label: '时政外交', icon: Landmark, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
    { id: 'Law', label: '法律法规', icon: Gavel, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100' },
    { id: 'Culture', label: '文化教育', icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  ];

  useEffect(() => {
    const stored = localStorage.getItem('collocation_library');
    if (stored) {
      setSavedLibrary(JSON.parse(stored));
    }
  }, []);

  const handleGenerate = async (theme: string) => {
    setSelectedTheme(theme);
    setLoading(true);
    setGeneratedList([]);
    try {
      const result = await generateCollocations(theme);
      if (result && result.collocations) {
        setGeneratedList(result.collocations.map((item: any) => ({
          ...item,
          theme: theme
        })));
      }
    } catch (e) {
      alert("生成失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  };

  const saveToLibrary = (item: Omit<CollocationItem, 'id' | 'addedAt'>) => {
    const newItem: CollocationItem = {
      ...item,
      id: Date.now().toString() + Math.random().toString(),
      addedAt: new Date().toISOString()
    };
    
    // Check dupe
    if (savedLibrary.some(s => s.phrase === item.phrase)) return;

    const newLib = [newItem, ...savedLibrary];
    setSavedLibrary(newLib);
    localStorage.setItem('collocation_library', JSON.stringify(newLib));
  };

  const removeFromLibrary = (id: string) => {
    const newLib = savedLibrary.filter(item => item.id !== id);
    setSavedLibrary(newLib);
    localStorage.setItem('collocation_library', JSON.stringify(newLib));
  };

  // --- Export / Import Logic ---
  const exportToExcel = () => {
    if (savedLibrary.length === 0) return alert("搭配本为空，无法导出。");
    const data = savedLibrary.map(item => ({
      "主题 (Theme)": item.theme,
      "搭配词 (Phrase)": item.phrase,
      "含义 (Meaning)": item.meaning,
      "例句 (Example)": item.example,
      "添加时间": new Date(item.addedAt).toLocaleDateString()
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "搭配本");
    XLSX.writeFile(workbook, `CATTI_Collocations_${new Date().toISOString().split('T')[0]}.xlsx`);
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

        const existingPhrases = new Set(savedLibrary.map(s => s.phrase.trim().toLowerCase()));
        
        const importedItems: CollocationItem[] = jsonData
          .filter(row => {
            const phrase = String(row['搭配词 (Phrase)'] || '').trim();
            return phrase && !existingPhrases.has(phrase.toLowerCase());
          })
          .map((row, index) => ({
            id: (Date.now() + index).toString(),
            theme: String(row['主题 (Theme)'] || 'Uncategorized').trim(),
            phrase: String(row['搭配词 (Phrase)']).trim(),
            meaning: String(row['含义 (Meaning)'] || '').trim(),
            example: String(row['例句 (Example)'] || '').trim(),
            addedAt: new Date().toISOString()
          }));

        if (importedItems.length > 0) {
          const newLib = [...savedLibrary, ...importedItems];
          setSavedLibrary(newLib);
          localStorage.setItem('collocation_library', JSON.stringify(newLib));
          alert(`成功导入 ${importedItems.length} 条搭配。`);
        } else {
          alert("未检测到新的有效记录（可能已存在或格式不符）。");
        }
      } catch (err) {
        alert("导入失败，请检查 Excel 格式。");
      }
      e.target.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  // --- Practice Mode Logic ---
  const startPractice = () => {
    if (savedLibrary.length === 0) return alert("搭配本为空，请先添加内容。");
    const queue = [...savedLibrary].sort(() => 0.5 - Math.random());
    setPracticeQueue(queue);
    setCurrentPracticeIndex(0);
    setShowPracticeAnswer(false);
    setIsPracticeMode(true);
  };

  const nextPracticeCard = () => {
    if (currentPracticeIndex < practiceQueue.length - 1) {
      setCurrentPracticeIndex(prev => prev + 1);
      setShowPracticeAnswer(false);
    } else {
      if (confirm("练习完成！是否重新开始？")) {
        startPractice();
      } else {
        setIsPracticeMode(false);
      }
    }
  };

  const isSaved = (phrase: string) => savedLibrary.some(s => s.phrase === phrase);

  const filteredLibrary = savedLibrary.filter(item => 
    item.phrase.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.meaning.includes(searchTerm) ||
    item.theme.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <Link2 className="text-indigo-600" size={32} /> 高频词语搭配
          </h2>
          <p className="text-slate-500 font-medium mt-2">
            CATTI 考试的得分关键在于固定搭配（Fixed Collocations）的积累。
          </p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
          <button 
            onClick={() => setActiveTab('generate')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'generate' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            AI 生成训练
          </button>
          <button 
            onClick={() => setActiveTab('library')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'library' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            我的搭配本 <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-[10px]">{savedLibrary.length}</span>
          </button>
        </div>
      </header>

      {activeTab === 'generate' ? (
        <div className="space-y-10">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {themes.map(theme => (
              <button
                key={theme.id}
                onClick={() => handleGenerate(theme.id)}
                disabled={loading && selectedTheme === theme.id}
                className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 text-center group ${
                  selectedTheme === theme.id 
                    ? `${theme.bg} ${theme.border} ${theme.color} ring-2 ring-offset-2 ring-indigo-100 scale-105` 
                    : 'bg-white border-slate-50 hover:border-slate-200 text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className={`p-3 rounded-2xl bg-white shadow-sm transition-transform group-hover:scale-110 ${selectedTheme === theme.id ? '' : 'grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100'}`}>
                  {loading && selectedTheme === theme.id ? <Loader2 className="animate-spin" size={20} /> : <theme.icon size={20} className={theme.color} />}
                </div>
                <span className="text-xs font-black">{theme.label}</span>
              </button>
            ))}
          </div>

          {loading ? (
             <div className="bg-white rounded-[3rem] border border-slate-100 p-24 text-center">
               <Loader2 size={48} className="animate-spin text-indigo-500 mx-auto mb-6" />
               <h3 className="text-lg font-bold text-slate-800">正在挖掘 {selectedTheme} 领域的高阶搭配...</h3>
             </div>
          ) : generatedList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4">
              {generatedList.map((item, idx) => (
                <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all relative group">
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black rounded uppercase tracking-widest">{item.theme}</span>
                    <button 
                      onClick={() => saveToLibrary(item)}
                      disabled={isSaved(item.phrase)}
                      className={`p-2 rounded-xl transition-all ${isSaved(item.phrase) ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600'}`}
                    >
                      {isSaved(item.phrase) ? <Check size={18} /> : <Plus size={18} />}
                    </button>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mb-2 font-serif-en">{item.phrase}</h3>
                  {/* Meaning Restored here */}
                  <p className="text-sm font-bold text-indigo-600 mb-4">{item.meaning}</p>
                  <div className="bg-slate-50 p-4 rounded-2xl text-xs text-slate-600 italic leading-relaxed border border-slate-100">
                    "{item.example}"
                  </div>
                </div>
              ))}
              <div className="md:col-span-2 flex justify-center mt-4">
                <button 
                  onClick={() => selectedTheme && handleGenerate(selectedTheme)}
                  className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 font-bold hover:bg-slate-50 transition-all shadow-sm"
                >
                  <RefreshCw size={16} /> 换一批
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[3rem] border border-dashed border-slate-200 p-24 text-center">
              <Sparkles size={48} className="text-slate-200 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-slate-800">点击上方主题开始训练</h3>
              <p className="text-slate-400 mt-2">AI 将为你生成该领域的 5 个高频 CATTI 固定搭配。</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="搜索我的搭配本..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full pl-14 pr-8 py-5 rounded-3xl border border-slate-100 focus:ring-4 focus:ring-indigo-50 outline-none transition-all shadow-sm text-lg" 
              />
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={startPractice}
                disabled={savedLibrary.length === 0}
                className="px-6 py-5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 font-bold flex items-center gap-2 shadow-xl shadow-indigo-100 transition-all disabled:opacity-50"
              >
                <Play size={20} className="fill-current" /> 开始练习
              </button>
              <button onClick={exportToExcel} className="p-5 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 text-slate-600 transition-all" title="导出 Excel"><Download size={20} /></button>
              <label className="p-5 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 text-slate-600 transition-all cursor-pointer" title="导入 Excel">
                <Upload size={20} />
                <input type="file" className="hidden" accept=".xlsx, .xls" onChange={importFromExcel} />
              </label>
            </div>
          </div>
          
          {filteredLibrary.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLibrary.map((item) => (
                <div key={item.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative group hover:border-indigo-100 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-2 py-1 bg-slate-50 text-slate-400 text-[9px] font-black rounded uppercase tracking-widest flex items-center gap-1">
                      <Tag size={10} /> {item.theme}
                    </span>
                    <button 
                      onClick={() => removeFromLibrary(item.id)}
                      className="text-slate-300 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <h3 className="text-lg font-black text-slate-800 mb-1 font-serif-en">{item.phrase}</h3>
                  <p className="text-sm font-medium text-indigo-600 mb-3">{item.meaning}</p>
                  <p className="text-xs text-slate-500 italic leading-relaxed border-l-2 border-slate-100 pl-3">
                    {item.example}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-slate-400 font-medium">搭配本空空如也，快去生成并收藏吧。</p>
            </div>
          )}
        </div>
      )}

      {/* Practice Mode Overlay */}
      {isPracticeMode && practiceQueue.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-white rounded-[3rem] p-10 shadow-2xl relative flex flex-col min-h-[500px]">
            <button 
              onClick={() => setIsPracticeMode(false)} 
              className="absolute top-8 right-8 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all"
            >
              <X size={24} />
            </button>
            
            <div className="flex justify-between items-center mb-10">
              <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                Collocation Drill
              </span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {currentPracticeIndex + 1} / {practiceQueue.length}
              </span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
              <div className="space-y-4">
                 <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{practiceQueue[currentPracticeIndex].theme}</span>
                 <h3 className="text-5xl font-black text-slate-800 font-serif-en">{practiceQueue[currentPracticeIndex].phrase}</h3>
              </div>
              
              <div className="w-full">
                {!showPracticeAnswer ? (
                  <button 
                    onClick={() => setShowPracticeAnswer(true)}
                    className="mt-8 px-10 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all flex items-center gap-2 mx-auto"
                  >
                    <RotateCw size={18} /> 点击翻转 (Reveal)
                  </button>
                ) : (
                  <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300 w-full bg-indigo-50/50 p-8 rounded-[2.5rem] border border-indigo-100">
                    <div>
                      <h4 className="text-2xl font-black text-indigo-600 mb-2">{practiceQueue[currentPracticeIndex].meaning}</h4>
                      <p className="text-slate-500 italic font-serif-en">"{practiceQueue[currentPracticeIndex].example}"</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <button 
                onClick={nextPracticeCard}
                className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl"
              >
                {currentPracticeIndex < practiceQueue.length - 1 ? '下一个 (Next)' : '完成练习 (Finish)'} 
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollocationTrainer;
