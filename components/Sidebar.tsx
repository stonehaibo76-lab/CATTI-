import React, { useState, useEffect } from 'react';
import { AppView } from '../types';
import { 
  LayoutDashboard, 
  Map, 
  Languages, 
  BookOpen, 
  MessageSquare,
  GraduationCap, 
  ClipboardList, 
  Library, 
  CalendarCheck2, 
  Settings, 
  X, 
  Check, 
  Zap, 
  Bot,
  BookX,
  Link2,
  ExternalLink,
  KeyRound,
  CircleHelp
} from 'lucide-react';
import { getAIConfig } from '../services/geminiService';

interface SidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }: SidebarProps) => {
  const [progress, setProgress] = useState(0);
  const [daysToExam, setDaysToExam] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  
  // Settings State
  const [provider, setProvider] = useState<'gemini' | 'deepseek'>('gemini');
  const [geminiKey, setGeminiKey] = useState('');
  const [deepseekKey, setDeepseekKey] = useState('');

  useEffect(() => {
    const updateStats = () => {
      const stored = localStorage.getItem('lessons_completed');
      const completedCount = stored ? JSON.parse(stored).length : 0;
      // 180 days for 6 months plan
      setProgress(Math.min(Math.round((completedCount / 180) * 100), 100));

      const now = new Date();
      const currentYear = now.getFullYear();
      
      // CATTI exams are typically in June (month index 5) and November (month index 10)
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
    };

    updateStats();
    window.addEventListener('storage', updateStats);
    const interval = setInterval(updateStats, 10000); 
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', updateStats);
    };
  }, [currentView]);

  // Load settings on mount and when modal opens
  useEffect(() => {
    if (showSettings) {
      const config = getAIConfig();
      setProvider(config.provider);
      setGeminiKey(config.geminiKey || '');
      setDeepseekKey(config.deepseekKey || '');
    }
  }, [showSettings]);

  const saveSettings = () => {
    localStorage.setItem('ai_provider', provider);
    localStorage.setItem('gemini_key', geminiKey);
    localStorage.setItem('deepseek_key', deepseekKey);
    setShowSettings(false);
    // Trigger storage event to notify services if needed
    window.dispatchEvent(new Event('storage'));
    alert("设置已保存！");
  };

  const menuItems = [
    { id: AppView.DASHBOARD, label: '控制面板', icon: LayoutDashboard },
    { id: AppView.STUDY_PLAN, label: '备考计划', icon: Map },
    { id: AppView.ATTENDANCE, label: '学习历程', icon: CalendarCheck2 },
    { id: AppView.MISTAKE_NOTEBOOK, label: '错题回顾', icon: BookX },
    { id: AppView.TRANSLATION_LAB, label: '翻译实验室', icon: Languages },
    { id: AppView.COLLOCATIONS, label: '高频搭配', icon: Link2 },
    { id: AppView.SENTENCE_LIBRARY, label: '例句资源库', icon: Library },
    { id: AppView.WEEKLY_TEST, label: '每周测验', icon: ClipboardList },
    { id: AppView.VOCABULARY, label: '词汇宝库', icon: BookOpen },
    { id: AppView.AI_TUTOR, label: 'AI 私人导师', icon: MessageSquare },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen sticky top-0 flex flex-col z-40">
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="bg-indigo-600 p-2 rounded-lg text-white">
          <GraduationCap size={24} />
        </div>
        <h1 className="font-bold text-xl text-slate-800 tracking-tight">CATTI 精英</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              currentView === item.id
                ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 space-y-2">
        <button 
          onClick={() => onViewChange(AppView.HELP)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              currentView === AppView.HELP
                ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
        >
          <CircleHelp size={20} />
          <span className="font-medium">使用帮助</span>
        </button>

        <button 
          onClick={() => setShowSettings(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all"
        >
          <Settings size={20} />
          <span className="font-medium">AI 设置</span>
        </button>

        <div className="bg-slate-50 rounded-xl p-4 mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-400">180天总计划</span>
            <span className="text-xs font-bold text-indigo-600">{progress}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div className="bg-indigo-600 h-full transition-all duration-700 ease-out" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="mt-2 text-[10px] text-slate-400 text-center uppercase tracking-wider">距离下场考试: {daysToExam} 天</p>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 overflow-y-auto max-h-[90vh]">
            <button onClick={() => setShowSettings(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all"><X size={20} /></button>
            <h3 className="text-2xl font-black text-slate-800 mb-2">AI 模型设置</h3>
            <p className="text-slate-500 mb-8 font-medium text-sm">配置您的个人 API Key 以启用 AI 功能。</p>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setProvider('gemini')}
                  className={`p-5 rounded-2xl border-2 text-left transition-all relative ${
                    provider === 'gemini' 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-800 ring-2 ring-indigo-100' 
                    : 'border-slate-100 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                     <Zap size={24} className={provider === 'gemini' ? 'text-indigo-600' : 'text-slate-400'} />
                     {provider === 'gemini' && <Check size={16} className="text-indigo-600" />}
                  </div>
                  <div className="font-black text-lg">Gemini</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">Google Official</div>
                </button>

                <button 
                  onClick={() => setProvider('deepseek')}
                  className={`p-5 rounded-2xl border-2 text-left transition-all relative ${
                    provider === 'deepseek' 
                    ? 'border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-100' 
                    : 'border-slate-100 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                     <Bot size={24} className={provider === 'deepseek' ? 'text-blue-600' : 'text-slate-400'} />
                     {provider === 'deepseek' && <Check size={16} className="text-blue-600" />}
                  </div>
                  <div className="font-black text-lg">DeepSeek</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">DeepSeek-V3</div>
                </button>
              </div>

              {provider === 'gemini' && (
                <div className="space-y-3 animate-in slide-in-from-top-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Gemini API Key</label>
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[10px] font-bold text-indigo-500 flex items-center gap-1 hover:underline">
                      获取免费 Key <ExternalLink size={10} />
                    </a>
                  </div>
                  <div className="relative">
                    <input 
                      type="password" 
                      placeholder="AIzaSy..." 
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 font-mono text-sm transition-all"
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                    />
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    推荐使用 <span className="font-bold text-slate-600">Gemini 1.5 Pro</span> 或 <span className="font-bold text-slate-600">Flash</span>。
                    Key 仅存储在您的本地浏览器中，绝不会上传到我们的服务器。
                  </p>
                </div>
              )}

              {provider === 'deepseek' && (
                <div className="space-y-3 animate-in slide-in-from-top-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">DeepSeek API Key</label>
                    <a href="https://platform.deepseek.com/" target="_blank" rel="noreferrer" className="text-[10px] font-bold text-blue-500 flex items-center gap-1 hover:underline">
                      官网申请 <ExternalLink size={10} />
                    </a>
                  </div>
                  <div className="relative">
                    <input 
                      type="password" 
                      placeholder="sk-..." 
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-mono text-sm transition-all"
                      value={deepseekKey}
                      onChange={(e) => setDeepseekKey(e.target.value)}
                    />
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    DeepSeek 暂不支持语音合成(TTS)，朗读功能将自动降级使用 Web Speech API 或静音。
                  </p>
                </div>
              )}

              <button 
                onClick={saveSettings}
                className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl active:scale-95"
              >
                保存配置并连接
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;