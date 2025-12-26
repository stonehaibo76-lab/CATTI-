
import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  Calendar as CalendarIcon, 
  Trophy,
  CheckCircle2,
  BookOpen,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

const AttendanceCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [completedDates, setCompletedDates] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [showBackupAlert, setShowBackupAlert] = useState(false);

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const loadData = () => {
    const stored = localStorage.getItem('lessons_completed');
    const dates = stored ? JSON.parse(stored) : [];
    setCompletedDates(dates);
    calculateStreak(dates);
  };

  const saveData = (newDates: string[]) => {
    localStorage.setItem('lessons_completed', JSON.stringify(newDates));
    setCompletedDates(newDates);
    calculateStreak(newDates);
    window.dispatchEvent(new Event('storage'));
  };

  const calculateStreak = (dates: string[]) => {
    if (dates.length === 0) {
      setStreak(0);
      return;
    }
    
    const sortedDates = dates
      .map(d => new Date(d).setHours(0,0,0,0))
      .sort((a, b) => b - a);

    let currentStreak = 0;
    let today = new Date().setHours(0,0,0,0);
    let yesterday = today - 86400000;

    if (sortedDates[0] === today || sortedDates[0] === yesterday) {
      currentStreak = 1;
      for (let i = 0; i < sortedDates.length - 1; i++) {
        if (sortedDates[i] - sortedDates[i + 1] === 86400000) {
          currentStreak++;
        } else {
          break;
        }
      }
    }
    setStreak(currentStreak);
  };

  const toggleDate = (dateStr: string) => {
    let newDates;
    if (completedDates.includes(dateStr)) {
      if (confirm(`确定要撤销 ${dateStr} 的打卡记录吗？`)) {
        newDates = completedDates.filter(d => d !== dateStr);
      } else return;
    } else {
      newDates = [...completedDates, dateStr];
    }
    saveData(newDates);
  };

  // 离线备份：导出 JSON
  const exportAttendance = () => {
    const dataStr = JSON.stringify(completedDates, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `CATTI_Attendance_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // 离线备份：导入 JSON
  const importAttendance = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          if (confirm(`检测到 ${imported.length} 条记录，这会覆盖当前所有打卡进度，确定吗？`)) {
            saveData(imported);
            alert('数据恢复成功！');
          }
        } else {
          alert('无效的备份文件格式。');
        }
      } catch (err) {
        alert('文件解析失败。');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-14 sm:h-20 border-b border-r border-slate-50"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dateStr = dateObj.toLocaleDateString('zh-CN');
      const isCompleted = completedDates.includes(dateStr);
      const isToday = new Date().toLocaleDateString('zh-CN') === dateStr;

      days.push(
        <div 
          key={day} 
          onClick={() => toggleDate(dateStr)}
          title={isCompleted ? "点击撤销打卡" : "点击手动补签"}
          className={`h-14 sm:h-24 border-b border-r border-slate-50 p-2 sm:p-4 relative transition-all cursor-pointer hover:bg-slate-100 group ${isCompleted ? 'bg-indigo-50/30' : ''}`}
        >
          <span className={`text-xs font-black transition-all ${
            isToday ? 'bg-indigo-600 text-white w-6 h-6 flex items-center justify-center rounded-full shadow-lg' : 
            isCompleted ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
          }`}>
            {day}
          </span>
          {isCompleted ? (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-indigo-600/10 w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                <CheckCircle2 size={16} className="text-indigo-600" />
              </div>
            </div>
          ) : (
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <RefreshCw size={12} className="text-slate-300" />
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <header className="px-8 py-6 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-4">
            <CalendarIcon size={24} className="text-indigo-400" />
            <h3 className="text-xl font-black">{year}年 {month + 1}月</h3>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="p-2 hover:bg-white/10 rounded-xl transition-all"><ChevronLeft size={20} /></button>
            <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="p-2 hover:bg-white/10 rounded-xl transition-all"><ChevronRight size={20} /></button>
          </div>
        </header>
        <div className="grid grid-cols-7 border-l border-slate-50">
          {weekdays.map(d => (
            <div key={d} className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-r border-slate-50 bg-slate-50/50">{d}</div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-800">学习历程</h2>
          <p className="text-slate-500 font-medium">查看打卡足迹，支持点击日历手动补签。</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={exportAttendance}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download size={18} /> 导出本地备份
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm cursor-pointer">
            <Upload size={18} /> 恢复打卡记录
            <input type="file" className="hidden" accept=".json" onChange={importAttendance} />
          </label>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="bg-orange-50 p-5 rounded-2xl text-orange-600"><Flame size={32} /></div>
          <div>
            <div className="text-3xl font-black text-slate-800">{streak} 天</div>
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest">当前连续天数</div>
          </div>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="bg-indigo-50 p-5 rounded-2xl text-indigo-600"><CheckCircle2 size={32} /></div>
          <div>
            <div className="text-3xl font-black text-slate-800">{completedDates.length} 天</div>
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest">累计完成天数</div>
          </div>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6 relative group">
          <div className="bg-emerald-50 p-5 rounded-2xl text-emerald-600"><Trophy size={32} /></div>
          <div>
            <div className="text-3xl font-black text-slate-800">Lvl {Math.floor(completedDates.length / 7) + 1}</div>
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest">备考韧性等级</div>
          </div>
          {streak > 0 && streak % 7 === 0 && (
            <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-[8px] font-black px-2 py-1 rounded-full animate-bounce">
              EXCELLENT
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          {renderCalendar()}
        </div>
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl">
            <h4 className="font-black text-lg mb-4 flex items-center gap-2"><BookOpen size={20} /> 数据安全提示</h4>
            <p className="text-indigo-100 text-sm leading-relaxed mb-6">
              浏览器缓存清理或隐私模式可能会导致进度丢失。建议每周使用顶部的“导出”功能，将进度保存为 JSON 文件存放在电脑本地。
            </p>
            <div className="bg-white/10 p-4 rounded-2xl border border-white/10 flex items-start gap-3">
              <AlertTriangle className="text-amber-400 shrink-0" size={20} />
              <p className="text-xs text-indigo-100 leading-normal">
                点击日历中的日期可直接进行<strong>补签</strong>或<strong>修改</strong>历史进度。
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <h4 className="font-black text-slate-800 mb-4">进阶里程碑</h4>
            <div className="space-y-4">
              {[
                { label: '初窥门径', desc: '累计学习 7 天', days: 7 },
                { label: '渐入佳境', desc: '累计学习 30 天', days: 30 },
                { label: '翻译达人', desc: '累计学习 60 天', days: 60 },
                { label: '百炼成钢', desc: '累计学习 100 天', days: 100 }
              ].map((m, i) => (
                <div key={i} className={`flex items-center gap-4 ${completedDates.length >= m.days ? 'opacity-100' : 'opacity-40'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${completedDates.length >= m.days ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    <Trophy size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-800">{m.label}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">{m.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
