
import React, { useState, useEffect } from 'react';
import { 
  BookX, 
  Trash2, 
  Search, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Tag,
  CheckCircle2,
  AlertCircle,
  Languages,
  X
} from 'lucide-react';
import { MistakeItem } from '../types';

const MistakeNotebook: React.FC = () => {
  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const loadMistakes = () => {
      const stored = localStorage.getItem('mistake_notebook');
      if (stored) {
        setMistakes(JSON.parse(stored).reverse()); // Show newest first
      }
    };
    loadMistakes();
  }, []);

  const handleDelete = (id: string) => {
    if (confirm('确定要移除这条错题记录吗？')) {
      const updated = mistakes.filter(m => m.id !== id);
      setMistakes(updated);
      localStorage.setItem('mistake_notebook', JSON.stringify(updated));
    }
  };

  const filteredMistakes = mistakes.filter(m => 
    m.source.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.analysis.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.correctAnswer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <BookX className="text-rose-500" size={32} /> 错题回顾本
          </h2>
          <p className="text-slate-500 font-medium mt-2">
            记录在练习与翻译实验室中遇到的挑战。定期回顾错误是打破瓶颈的关键。
          </p>
        </div>
        <div className="bg-rose-50 px-6 py-3 rounded-2xl text-rose-600 font-black text-sm border border-rose-100 shadow-sm">
          共 {mistakes.length} 个重点复盘
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="搜索错题内容或解析..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="w-full pl-14 pr-8 py-5 rounded-2xl border border-slate-100 focus:ring-4 focus:ring-rose-50 outline-none transition-all shadow-sm text-lg" 
        />
      </div>

      {filteredMistakes.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {filteredMistakes.map((mistake) => (
            <div key={mistake.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div 
                onClick={() => setExpandedId(expandedId === mistake.id ? null : mistake.id)}
                className="p-8 cursor-pointer flex gap-6 items-start hover:bg-slate-50/50 transition-colors"
              >
                <div className="mt-1">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    mistake.type === 'translation' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {mistake.type === 'translation' ? <Languages size={24} /> : <AlertCircle size={24} />}
                  </div>
                </div>
                
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {mistake.tags.map((tag, i) => (
                      <span key={i} className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black rounded-lg uppercase tracking-widest flex items-center gap-1">
                        <Tag size={10} /> {tag}
                      </span>
                    ))}
                    <span className="text-[10px] text-slate-400 font-bold ml-auto">
                      {new Date(mistake.addedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 leading-relaxed line-clamp-2">
                    {mistake.source}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                     <span className="font-bold">我的答案:</span> <span className="italic line-clamp-1">{mistake.userAnswer}</span>
                  </div>
                </div>

                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(mistake.id); }}
                  className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                  title="移除此题"
                >
                  <Trash2 size={20} />
                </button>
                <div className="p-3 text-slate-300">
                  {expandedId === mistake.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {expandedId === mistake.id && (
                <div className="px-8 pb-8 pt-0 animate-in slide-in-from-top-2">
                  <div className="bg-slate-50 rounded-3xl p-8 space-y-8 border border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">你的回答 (User Answer)</h4>
                        <div className={`p-5 rounded-2xl border font-medium text-slate-600 italic leading-relaxed ${
                          mistake.userAnswer === mistake.correctAnswer 
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                          : 'bg-white border-slate-100'
                        }`}>
                          {mistake.userAnswer}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3">正确答案 (Correct)</h4>
                        <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800 font-bold leading-relaxed font-serif-en">
                          {mistake.correctAnswer}
                        </div>
                      </div>
                    </div>

                    {/* Show Options if available (for objective questions) */}
                    {mistake.options && mistake.options.length > 0 && (
                      <div>
                         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">题目选项 (Options)</h4>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {mistake.options.map((opt, i) => (
                              <div key={i} className={`px-4 py-3 rounded-xl border text-sm font-medium flex items-center justify-between ${
                                opt === mistake.correctAnswer
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                  : opt === mistake.userAnswer
                                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-500'
                              }`}>
                                <span>{String.fromCharCode(65+i)}. {opt.replace(/^[A-Z]\.\s*/, '')}</span>
                                {opt === mistake.correctAnswer && <CheckCircle2 size={16} />}
                                {opt === mistake.userAnswer && opt !== mistake.correctAnswer && <X size={16} />}
                              </div>
                            ))}
                         </div>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <CheckCircle2 size={12} /> AI 深度解析 & 点评
                      </h4>
                      <div className="p-6 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-indigo-900 leading-relaxed text-sm font-medium">
                        {mistake.analysis}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] border border-dashed border-slate-200 p-24 text-center">
          <AlertTriangle size={64} className="mx-auto text-slate-200 mb-6" />
          <h3 className="text-2xl font-bold text-slate-800">错题本空空如也</h3>
          <p className="text-slate-400 mt-2">在综合练习或翻译实验室中将错题加入此处。</p>
        </div>
      )}
    </div>
  );
};

export default MistakeNotebook;
