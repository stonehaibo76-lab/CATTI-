
import React from 'react';
import { STUDY_ROADMAP } from '../constants';
import { Lock, CheckCircle2, Circle } from 'lucide-react';

const PlanView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <header className="mb-12 text-center">
        <h2 className="text-4xl font-black text-slate-800 mb-4">六个月 CATTI 深度进阶计划</h2>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          专为 B1 基础学员定制的 180 天科学备考路线，旨在通过系统化的训练，将词汇与翻译实务能力稳步提升至 C2/CATTI 二级水平。
        </p>
      </header>

      <div className="relative">
        <div className="absolute left-[27px] top-0 bottom-0 w-0.5 bg-slate-200"></div>
        
        <div className="space-y-12">
          {STUDY_ROADMAP.map((phase) => (
            <div key={phase.id} className="relative pl-16 group">
              <div className={`absolute left-0 top-0 w-14 h-14 rounded-full flex items-center justify-center border-4 border-white shadow-md z-10 transition-colors ${
                phase.status === 'completed' ? 'bg-emerald-500 text-white' : 
                phase.status === 'active' ? 'bg-indigo-600 text-white' : 
                'bg-slate-100 text-slate-400'
              }`}>
                {phase.status === 'completed' ? <CheckCircle2 size={24} /> : 
                 phase.status === 'active' ? <span className="font-bold">{phase.id}</span> : 
                 <Lock size={20} />}
              </div>

              <div className={`p-8 rounded-3xl border transition-all ${
                phase.status === 'active' 
                  ? 'bg-white border-indigo-200 shadow-xl shadow-indigo-50 ring-1 ring-indigo-50' 
                  : 'bg-white/50 border-slate-100 grayscale-[0.5]'
              }`}>
                <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                  <h3 className="text-2xl font-bold text-slate-800">{phase.title}</h3>
                  <span className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-500 font-bold text-sm">
                    {phase.duration}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                  <div>
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">核心焦点</h4>
                    <div className="flex flex-wrap gap-2">
                      {phase.focus.map((f, i) => (
                        <span key={i} className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-sm font-semibold">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">关键任务</h4>
                    <ul className="space-y-3">
                      {phase.tasks.map((task, i) => (
                        <li key={i} className="flex items-start gap-3 text-slate-600 text-sm">
                          <Circle size={8} className="mt-1.5 fill-slate-300 text-slate-300" />
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {phase.status === 'active' && (
                  <button className="mt-8 w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100">
                    继续当前阶段
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlanView;
