
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Trash2, 
  Download, 
  Upload, 
  ArrowRight,
  Bookmark,
  Plus,
  X,
  Languages,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Shuffle,
  ChevronRight
} from 'lucide-react';
import { LibrarySentence } from '../types';
import * as XLSX from 'xlsx';

const TranslationLibrary: React.FC = () => {
  const [library, setLibrary] = useState<LibrarySentence[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [practiceSentence, setPracticeSentence] = useState<LibrarySentence | null>(null);
  const [isRandomMode, setIsRandomMode] = useState(false); // 是否处于随机练习模式
  const [newSentence, setNewSentence] = useState({ source: '', target: '' });
  const [userDraft, setUserDraft] = useState('');
  const [showResult, setShowResult] = useState(false);

  // 删除确认相关的状态
  const [confirmDelete, setConfirmDelete] = useState<{
    show: boolean;
    type: 'single' | 'all';
    id?: string;
    preview?: string;
  }>({ show: false, type: 'single' });

  useEffect(() => {
    const loadLibrary = () => {
      const stored = localStorage.getItem('sentence_library');
      setLibrary(stored ? JSON.parse(stored) : []);
    };
    loadLibrary();
    window.addEventListener('storage', loadLibrary);
    return () => window.removeEventListener('storage', loadLibrary);
  }, []);

  const saveLibrary = (newLib: LibrarySentence[]) => {
    localStorage.setItem('sentence_library', JSON.stringify(newLib));
    setLibrary(newLib);
    window.dispatchEvent(new Event('storage'));
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSentence.source || !newSentence.target) return;
    
    if (library.some(s => s.source.trim() === newSentence.source.trim())) {
      alert("该例句已存在于库中。");
      return;
    }

    const item: LibrarySentence = {
      id: Date.now().toString(),
      source: newSentence.source,
      target: newSentence.target,
      tags: ['手动录入'],
      addedAt: new Date().toISOString()
    };
    saveLibrary([...library, item]);
    setShowAddModal(false);
    setNewSentence({ source: '', target: '' });
  };

  // 随机练习逻辑
  const startRandomPractice = () => {
    if (library.length === 0) return alert("库中没有例句，请先添加。");
    const randomIndex = Math.floor(Math.random() * library.length);
    setPracticeSentence(library[randomIndex]);
    setIsRandomMode(true);
    setShowResult(false);
    setUserDraft('');
  };

  const nextRandomSentence = () => {
    if (library.length <= 1) {
      alert("库中例句不足，无法切换下一条。");
      return;
    }
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * library.length);
    } while (library[nextIndex].id === practiceSentence?.id);
    
    setPracticeSentence(library[nextIndex]);
    setShowResult(false);
    setUserDraft('');
  };

  const closePractice = () => {
    setPracticeSentence(null);
    setIsRandomMode(false);
  };

  // 触发清空确认
  const triggerClearAll = () => {
    if (library.length === 0) return;
    setConfirmDelete({
      show: true,
      type: 'all'
    });
  };

  // 触发单句删除确认
  const triggerDeleteOne = (id: string, source: string) => {
    setConfirmDelete({
      show: true,
      type: 'single',
      id,
      preview: source.length > 40 ? source.substring(0, 40) + '...' : source
    });
  };

  // 执行最终删除逻辑
  const executeDelete = () => {
    if (confirmDelete.type === 'all') {
      saveLibrary([]);
    } else if (confirmDelete.type === 'single' && confirmDelete.id) {
      saveLibrary(library.filter(s => s.id !== confirmDelete.id));
    }
    // 关闭确认模态框
    setConfirmDelete({ show: false, type: 'single' });
  };

  const exportToExcel = () => {
    if (library.length === 0) return alert("库中没有例句。");
    const data = library.map(item => ({
      "原文 (Source)": item.source,
      "参考译文 (Target)": item.target,
      "添加时间": new Date(item.addedAt).toLocaleDateString()
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "例句库");
    XLSX.writeFile(workbook, `CATTI_Sentences_${new Date().toISOString().split('T')[0]}.xlsx`);
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

        const existingSources = new Set(library.map(s => s.source.trim()));
        
        const importedItems: LibrarySentence[] = jsonData
          .filter(row => {
            const source = String(row['原文 (Source)'] || '').trim();
            const target = String(row['参考译文 (Target)'] || '').trim();
            return source && target && !existingSources.has(source);
          })
          .map((row, index) => ({
            id: (Date.now() + index).toString(),
            source: String(row['原文 (Source)']).trim(),
            target: String(row['参考译文 (Target)']).trim(),
            tags: ['导入'],
            addedAt: new Date().toISOString()
          }));

        if (importedItems.length > 0) {
          saveLibrary([...library, ...importedItems]);
          alert(`成功导入 ${importedItems.length} 条条例句。`);
        } else {
          alert("未检测到新的有效记录。");
        }
      } catch (err) {
        alert("导入失败，请检查文件格式。");
      }
      e.target.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  const filtered = library.filter(s => 
    s.source.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.target.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <header className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800">例句资源库</h2>
          <p className="text-slate-500 font-medium">收藏的高阶译文库，共 {library.length} 条。定期复习是翻译进阶的王道。</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={startRandomPractice}
            disabled={library.length === 0}
            className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold flex items-center gap-2 shadow-xl shadow-indigo-100 transition-all disabled:opacity-50"
          >
            <Shuffle size={20} /> 随机挑战
          </button>
          <button 
            onClick={triggerClearAll}
            className={`p-3 border rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all ${
              library.length > 0 
              ? 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white' 
              : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
            }`}
          >
            <Trash2 size={20} /> 清空全部
          </button>
          <button onClick={() => setShowAddModal(true)} className="p-3 bg-white border border-slate-100 text-indigo-600 rounded-xl hover:bg-indigo-50 font-bold flex items-center gap-2 shadow-sm"><Plus size={20} /> 手动录入</button>
          <button onClick={exportToExcel} className="p-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 font-bold flex items-center gap-2"><Download size={20} /> 导出 Excel</button>
          <label className="p-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 font-bold flex items-center gap-2 cursor-pointer shadow-sm">
            <Upload size={20} /> 导入 Excel
            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={importFromExcel} />
          </label>
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" placeholder="搜索库中的中英文内容..." value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-6 py-5 rounded-3xl border border-slate-100 focus:ring-4 focus:ring-indigo-50 outline-none transition-all shadow-sm text-lg"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filtered.length > 0 ? filtered.map((item) => (
          <div key={item.id} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute top-8 right-8 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-20">
              <button 
                onClick={() => { setPracticeSentence(item); setShowResult(false); setUserDraft(''); setIsRandomMode(false); }} 
                className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white font-bold flex items-center gap-2 text-xs transition-all shadow-sm"
              >
                <Languages size={16} /> 练习此句
              </button>
              <button 
                onClick={() => triggerDeleteOne(item.id, item.source)} 
                className="p-3 bg-rose-50 text-rose-300 hover:text-rose-600 hover:bg-rose-100 rounded-xl transition-all shadow-sm"
                title="删除此句"
              >
                <Trash2 size={20} />
              </button>
            </div>
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-1 space-y-4">
                <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black rounded uppercase tracking-widest">Source</span>
                <p className="text-2xl font-bold text-slate-800 leading-relaxed">{item.source}</p>
              </div>
              <div className="hidden md:flex h-32 items-center justify-center text-slate-200"><ArrowRight size={32} /></div>
              <div className="flex-1 space-y-4">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded uppercase tracking-widest">Master Target</span>
                <p className="text-2xl font-black text-indigo-600 italic leading-relaxed font-serif-en">{item.target}</p>
              </div>
            </div>
          </div>
        )) : (
          <div className="bg-white rounded-[3rem] border border-dashed border-slate-200 p-24 text-center">
            <Bookmark size={64} className="mx-auto text-slate-200 mb-6" />
            <h3 className="text-2xl font-bold text-slate-800">例句库暂无匹配记录</h3>
          </div>
        )}
      </div>

      {/* 自定义删除确认模态框 */}
      {confirmDelete.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="bg-rose-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-rose-600">
              <AlertTriangle size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 text-center mb-4">确认删除？</h3>
            <p className="text-slate-500 text-center mb-8 font-medium">
              {confirmDelete.type === 'all' 
                ? "您确定要清空所有收藏的例句吗？此操作无法撤销，所有的翻译积累将永久丢失。" 
                : <>您确定要删除这条例句吗？<br/><span className="text-xs text-slate-400 italic">"{confirmDelete.preview}"</span></>
              }
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setConfirmDelete({ show: false, type: 'single' })}
                className="py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all"
              >
                取消
              </button>
              <button 
                onClick={executeDelete}
                className="py-4 bg-rose-600 text-white font-black rounded-2xl shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Sentence Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-[2.5rem] p-10 shadow-2xl relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all"><X size={20} /></button>
            <h3 className="text-2xl font-black text-slate-800 mb-8">录入高阶例句</h3>
            <form onSubmit={handleManualAdd} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">原文 (Source)</label>
                <textarea required autoFocus rows={3} className="w-full px-6 py-4 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:ring-4 focus:ring-indigo-50 transition-all" value={newSentence.source} onChange={e => setNewSentence({...newSentence, source: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">标准译文 (Target)</label>
                <textarea required rows={3} className="w-full px-6 py-4 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:ring-4 focus:ring-indigo-50 font-serif-en transition-all" value={newSentence.target} onChange={e => setNewSentence({...newSentence, target: e.target.value})} />
              </div>
              <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-700 transition-all">保存至例句库</button>
            </form>
          </div>
        </div>
      )}

      {/* Practice Modal */}
      {practiceSentence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-3xl bg-white rounded-[3rem] overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
            <button onClick={closePractice} className="absolute top-8 right-8 p-3 text-slate-400 hover:bg-slate-100 rounded-full z-10 transition-all"><X size={24} /></button>
            <div className="p-12 overflow-y-auto space-y-8 text-center">
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full uppercase tracking-widest">
                  {isRandomMode ? 'Random Challenge Mode' : 'Translation Practice'}
                </span>
                {isRandomMode && <p className="text-[10px] font-bold text-slate-400">正在随机抽取库中例句...</p>}
              </div>
              <h3 className="text-2xl font-black text-slate-800 leading-relaxed">{practiceSentence.source}</h3>
              {!showResult ? (
                <div className="space-y-6">
                  <textarea autoFocus rows={4} className="w-full p-8 text-xl text-slate-700 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-indigo-50 transition-all" placeholder="输入你的译文..." value={userDraft} onChange={e => setUserDraft(e.target.value)} />
                  <button onClick={() => setShowResult(true)} disabled={!userDraft.trim()} className="w-full py-6 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl disabled:opacity-50 flex items-center justify-center gap-3 transition-all">显示参考译文 <ArrowRight size={24} /></button>
                </div>
              ) : (
                <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500 text-left">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">你的译文</label>
                    <p className="text-xl text-slate-600 p-6 bg-slate-50 rounded-2xl border border-slate-100 italic">{userDraft}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4 block">标准参考</label>
                    <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-[2rem] text-emerald-900 italic text-2xl font-serif-en leading-relaxed">{practiceSentence.target}</div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    {isRandomMode ? (
                      <>
                        <button onClick={nextRandomSentence} className="flex-1 py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95">下一题 <ChevronRight size={20} /></button>
                        <button onClick={closePractice} className="flex-1 py-5 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 flex items-center justify-center gap-2 transition-all">结束练习</button>
                      </>
                    ) : (
                      <button onClick={closePractice} className="w-full py-5 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 flex items-center justify-center gap-2 transition-all"><CheckCircle2 size={20} /> 练习完成</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranslationLibrary;
