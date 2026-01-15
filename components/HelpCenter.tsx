import React, { useState } from 'react';
import { 
  CircleHelp, 
  Settings, 
  LayoutDashboard, 
  Languages, 
  BookOpen, 
  BookX, 
  ShieldCheck, 
  Download, 
  Save,
  Zap,
  GraduationCap,
  Map,
  ClipboardList,
  Library,
  Link2,
  CalendarCheck2,
  MessageSquare,
  Search,
  Sword,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Info,
  CheckCircle2,
  MousePointerClick
} from 'lucide-react';

const HelpCenter: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string | null>('start');

  const toggleSection = (id: string) => {
    setActiveSection(activeSection === id ? null : id);
  };

  const SectionHeader = ({ id, icon: Icon, title, color }: any) => (
    <button 
      onClick={() => toggleSection(id)}
      className={`w-full flex items-center justify-between p-6 rounded-2xl border transition-all ${
        activeSection === id 
          ? `bg-white border-${color}-200 shadow-md` 
          : 'bg-white border-slate-100 hover:bg-slate-50'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${activeSection === id ? `bg-${color}-100 text-${color}-600` : 'bg-slate-100 text-slate-500'}`}>
          <Icon size={24} />
        </div>
        <h3 className={`text-lg font-bold ${activeSection === id ? 'text-slate-800' : 'text-slate-600'}`}>{title}</h3>
      </div>
      {activeSection === id ? <ChevronDown className="text-slate-400" /> : <ChevronRight className="text-slate-300" />}
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="text-center space-y-4 mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] mb-4 shadow-sm">
          <CircleHelp size={40} />
        </div>
        <h2 className="text-4xl font-black text-slate-800 tracking-tight">用户使用手册</h2>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">
          CATTI 精英导师功能全解。从每日打卡到全真模考，探索 AI 如何辅助您的翻译进阶之路。
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. Quick Start (Critical) */}
        <div className="space-y-4">
          <SectionHeader id="start" icon={Settings} title="快速开始：配置 AI 密钥" color="indigo" />
          
          {activeSection === 'start' && (
            <div className="p-8 bg-white border border-indigo-100 rounded-[2rem] shadow-sm animate-in slide-in-from-top-2">
               <div className="flex items-start gap-4 mb-6">
                 <div className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest mt-1">Must Do</div>
                 <p className="text-slate-600 font-medium leading-relaxed">
                   本应用基于生成式 AI 技术。为了获得题目生成、翻译批改和语音合成功能，您必须首先配置 API Key。
                 </p>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                     <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">Google Gemini (推荐)</h4>
                     <ul className="text-sm text-slate-500 space-y-2 list-disc list-inside">
                        <li>支持 TTS 语音朗读</li>
                        <li>响应速度快，模型智能度高</li>
                        <li><a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-bold">获取免费 Key</a></li>
                     </ul>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                     <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">DeepSeek</h4>
                     <ul className="text-sm text-slate-500 space-y-2 list-disc list-inside">
                        <li>中文语境理解能力极强</li>
                        <li>不支持语音朗读 (降级为浏览器语音)</li>
                     </ul>
                  </div>
               </div>
               <div className="flex items-center gap-2 text-xs text-slate-400 font-bold">
                  <ShieldCheck size={14} /> 隐私安全：Key 仅存储在本地浏览器 LocalStorage，直连官方 API。
               </div>
            </div>
          )}
        </div>

        {/* 2. Dashboard */}
        <div className="space-y-4">
          <SectionHeader id="dashboard" icon={LayoutDashboard} title="每日核心：控制面板 (Dashboard)" color="indigo" />
          
          {activeSection === 'dashboard' && (
            <div className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm animate-in slide-in-from-top-2 space-y-8">
               <p className="text-slate-600 font-medium">
                 这是每日学习的起点。点击顶部 <span className="bg-indigo-600 text-white px-2 py-0.5 rounded text-xs font-bold">生成今日个性化课堂</span> 按钮，AI 将根据您的当前阶段（如 B1 衔接期、C1 冲刺期）生成定制内容。
               </p>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-3">
                   <h4 className="font-black text-slate-800 flex items-center gap-2"><BookOpen size={18} className="text-indigo-500"/> 文章精读 (Reading)</h4>
                   <p className="text-sm text-slate-500">阅读每日外刊选段。点击标题旁的 <span className="font-bold text-slate-700">“详解文章”</span> 按钮，AI 会深度拆解长难句、提炼翻译技巧并提供全文参考译文。</p>
                 </div>
                 <div className="space-y-3">
                   <h4 className="font-black text-slate-800 flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-500"/> 综合练习 (Exercises)</h4>
                   <p className="text-sm text-slate-500">包含单选、完形填空或改错题。做完后点击“提交”，若做错，可一键点击 <span className="font-bold text-rose-500">“加入错题本”</span>。</p>
                 </div>
                 <div className="space-y-3">
                   <h4 className="font-black text-slate-800 flex items-center gap-2"><Languages size={18} className="text-purple-500"/> 笔译实务 (Translation)</h4>
                   <p className="text-sm text-slate-500">每日一句实务练习。点击 <span className="font-bold text-slate-700">“前往实验室”</span> 进行正式翻译和 AI 批改。</p>
                 </div>
                 <div className="space-y-3">
                   <h4 className="font-black text-slate-800 flex items-center gap-2"><CalendarCheck2 size={18} className="text-orange-500"/> 打卡机制 (Check-in)</h4>
                   <p className="text-sm text-slate-500">完成所有内容后，点击底部大按钮打卡。这将增加您的“学习历程”记录并推进备考进度条。</p>
                 </div>
               </div>
            </div>
          )}
        </div>

        {/* 3. Translation Lab */}
        <div className="space-y-4">
          <SectionHeader id="lab" icon={Languages} title="实战演练：翻译实验室 (Translation Lab)" color="emerald" />
          
          {activeSection === 'lab' && (
            <div className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm animate-in slide-in-from-top-2 space-y-6">
               <div className="flex gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><Zap size={24}/></div>
                 <div>
                   <h4 className="font-bold text-slate-800 mb-1">AI 随机出题</h4>
                   <p className="text-sm text-slate-500">点击顶部按钮，AI 会随机生成一句符合当前难度的句子（政经、文学、科技等主题）。</p>
                 </div>
               </div>
               <div className="flex gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0"><GraduationCap size={24}/></div>
                 <div>
                   <h4 className="font-bold text-slate-800 mb-1">深度批改系统</h4>
                   <p className="text-sm text-slate-500">提交译文后，AI 导师会从三个维度反馈：
                     <br/>1. <span className="font-bold">Critique</span>: 逐字逐句的点评与错误指出。
                     <br/>2. <span className="font-bold">Improved Version</span>: 提供一个 CATTI 高分标准的参考译文。
                     <br/>3. <span className="font-bold">Tips</span>: 针对该句的考试技巧点拨。
                   </p>
                 </div>
               </div>
               <div className="flex gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0"><Library size={24}/></div>
                 <div>
                   <h4 className="font-bold text-slate-800 mb-1">保存至例句库</h4>
                   <p className="text-sm text-slate-500">遇到好的句型或 AI 的神来之笔，点击保存，日后可在“例句资源库”中复习。</p>
                 </div>
               </div>
            </div>
          )}
        </div>

        {/* 4. Vocabulary & Collocations */}
        <div className="space-y-4">
          <SectionHeader id="vocab" icon={BookOpen} title="词汇积累：词汇宝库与高频搭配" color="rose" />
          
          {activeSection === 'vocab' && (
            <div className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm animate-in slide-in-from-top-2 space-y-8">
               <div>
                 <h4 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><BookOpen size={20} className="text-rose-500"/> 词汇宝库 (Vocabulary Vault)</h4>
                 <ul className="space-y-3 text-sm text-slate-600">
                   <li className="flex gap-2"><CheckCircle2 size={16} className="text-slate-400 mt-0.5"/> <span><strong>SRS 记忆法:</strong> 系统根据您的熟悉程度将单词分为 New, Learning, Reviewing, Mastered。</span></li>
                   <li className="flex gap-2"><CheckCircle2 size={16} className="text-slate-400 mt-0.5"/> <span><strong>导入导出:</strong> 支持 Excel 格式批量导入生词或导出备份。</span></li>
                   <li className="flex gap-2"><CheckCircle2 size={16} className="text-slate-400 mt-0.5"/> <span><strong>词影对决 (Game):</strong> 当您积累了足够多的“困难词汇”（复习多次仍未掌握）时，可开启此 RPG 模式，通过答题削减 Boss 血量，寓教于乐。</span></li>
                 </ul>
               </div>
               <div className="border-t border-slate-50 pt-6">
                 <h4 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><Link2 size={20} className="text-indigo-500"/> 高频搭配 (Collocations)</h4>
                 <p className="text-sm text-slate-500 mb-4">CATTI 考试中，地道的词语搭配（如 "enhance cooperation", "foster development"）是得分关键。</p>
                 <ul className="space-y-3 text-sm text-slate-600">
                   <li className="flex gap-2"><MousePointerClick size={16} className="text-slate-400 mt-0.5"/> <span><strong>主题生成:</strong> 选择“经贸”、“环保”等主题，AI 自动生成高频词组。</span></li>
                   <li className="flex gap-2"><MousePointerClick size={16} className="text-slate-400 mt-0.5"/> <span><strong>练习模式:</strong> 类似闪卡（Flashcards）的翻转记忆模式。</span></li>
                 </ul>
               </div>
            </div>
          )}
        </div>

        {/* 5. Assessment */}
        <div className="space-y-4">
          <SectionHeader id="test" icon={ClipboardList} title="考评复盘：周测与错题本" color="amber" />
          
          {activeSection === 'test' && (
            <div className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm animate-in slide-in-from-top-2 space-y-8">
               <div>
                 <h4 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><ClipboardList size={20} className="text-amber-500"/> 每周测验 (Weekly Test)</h4>
                 <p className="text-sm text-slate-500 mb-3">全真模拟 CATTI 二级笔译考试流程。建议周末抽出 1-2 小时进行。</p>
                 <div className="grid grid-cols-2 gap-4 text-sm font-bold text-slate-600">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">Section 1: 词汇语法 (单选)</div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">Section 2: 完形填空</div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">Section 3: 阅读理解</div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">Section 4: 实务翻译 (双向)</div>
                 </div>
                 <p className="text-xs text-slate-400 mt-3 font-medium">* 交卷后，AI 会立刻对主观题和客观题进行评分和详细点评。</p>
               </div>

               <div className="border-t border-slate-50 pt-6">
                 <h4 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><BookX size={20} className="text-rose-500"/> 错题回顾 (Mistake Notebook)</h4>
                 <p className="text-sm text-slate-500">
                   在<strong>综合练习</strong>或<strong>每周测验</strong>中做错的题目，或在实验室中不满意的翻译，都可以加入错题本。
                   <br/>复习时，您可以查看当时的错误答案、正确解析以及 AI 的分析。
                 </p>
               </div>
            </div>
          )}
        </div>

        {/* 6. Tools */}
        <div className="space-y-4">
          <SectionHeader id="tools" icon={GraduationCap} title="辅助工具：计划与导师" color="slate" />
          
          {activeSection === 'tools' && (
            <div className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm animate-in slide-in-from-top-2 grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                 <h4 className="font-bold text-slate-800 flex items-center gap-2"><Map size={16} /> 备考计划 (Study Plan)</h4>
                 <p className="text-xs text-slate-500 leading-relaxed">
                   查看 6 个月的进阶路线图。了解当前处于哪个阶段（B2, C1, C2）以及该阶段的学习重点和核心任务。
                 </p>
               </div>
               <div className="space-y-2">
                 <h4 className="font-bold text-slate-800 flex items-center gap-2"><MessageSquare size={16} /> AI 私人导师</h4>
                 <p className="text-xs text-slate-500 leading-relaxed">
                   一个自由对话窗口。您可以询问任何具体的英语问题，例如“这个词和那个词的区别是什么？”或“这句话为什么用虚拟语气？”。
                 </p>
               </div>
               <div className="space-y-2">
                 <h4 className="font-bold text-slate-800 flex items-center gap-2"><CalendarCheck2 size={16} /> 学习历程 (Attendance)</h4>
                 <p className="text-xs text-slate-500 leading-relaxed">
                   可视化您的打卡日历。支持查看连续打卡天数（Streak），并可导出/导入您的打卡记录以防数据丢失。
                 </p>
               </div>
               <div className="space-y-2">
                 <h4 className="font-bold text-slate-800 flex items-center gap-2"><Library size={16} /> 例句资源库</h4>
                 <p className="text-xs text-slate-500 leading-relaxed">
                   您的个人语料库。存储所有收藏的好句，并支持“随机挑战”模式，遮盖译文进行视译练习。
                 </p>
               </div>
            </div>
          )}
        </div>

        {/* 7. Data Safety */}
        <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden mt-8">
           <div className="relative z-10 flex items-start gap-4">
              <div className="bg-white/10 p-3 rounded-xl"><Save size={24}/></div>
              <div>
                <h3 className="text-xl font-bold mb-2">数据安全警示</h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">
                  本应用是一个纯前端应用（Local-First），所有数据（词汇、错题、打卡记录）都存储在您的浏览器缓存（LocalStorage）中。
                  <br/><br/>
                  <strong className="text-white">如果您清空浏览器缓存，数据将会丢失。</strong>
                </p>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg w-fit">
                   <Download size={14} /> 建议每周使用各模块的“导出 Excel/JSON”功能进行本地备份。
                </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default HelpCenter;