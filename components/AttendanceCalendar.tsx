
import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  Calendar as CalendarIcon, 
  Trophy,
  CheckCircle2,
  Download,
  Upload,
  RefreshCw,
} from 'lucide-react';

const AttendanceCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [completedDates, setCompletedDates] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  // --- 核心机制：唯一 ID 生成器 ---
  // 所有的日期比对、存储、渲染都必须经过这个函数
  // 格式：YYYY-MM-DD (例如 2023-11-05)
  const generateDateId = (year: number, month: number, day: number): string => {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // 辅助：将 Date 对象转为 ID (基于本地时间)
  const dateToId = (date: Date): string => {
    return generateDateId(date.getFullYear(), date.getMonth() + 1, date.getDate());
  };

  const loadData = () => {
    const stored = localStorage.getItem('lessons_completed');
    if (!stored) return;

    try {
      let dates: string[] = JSON.parse(stored);
      // 数据清洗：确保加载的数据也符合标准格式
      dates = dates.map(d => {
        // 尝试修复旧数据格式
        const match = String(d).match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
        if (match) {
          return generateDateId(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
        }
        return d;
      });
      dates = Array.from(new Set(dates)); // 去重
      setCompletedDates(dates);
      calculateStreak(dates);
    } catch (e) {
      console.error("Failed to load attendance data", e);
    }
  };

  const saveData = (newDates: string[]) => {
    const sorted = newDates.sort();
    localStorage.setItem('lessons_completed', JSON.stringify(sorted));
    setCompletedDates(sorted);
    calculateStreak(sorted);
    // 广播事件，通知 Sidebar 和 Dashboard 更新进度
    window.dispatchEvent(new Event('storage'));
  };

  const calculateStreak = (dates: string[]) => {
    if (dates.length === 0) {
      setStreak(0);
      return;
    }
    
    // 计算 Streak 需要时间戳
    const sortedTimestamps = dates
      .map(d => new Date(d.replace(/-/g, '/')).setHours(0,0,0,0))
      .sort((a, b) => b - a);

    let currentStreak = 0;
    const today = new Date().setHours(0,0,0,0);
    const yesterday = today - 86400000;

    // 如果最近一次打卡不是今天或昨天，说明连击已断
    if (sortedTimestamps[0] !== today && sortedTimestamps[0] !== yesterday) {
      if (sortedTimestamps[0] < yesterday) {
          setStreak(0);
          return;
      }
    }

    // 从最近的打卡日（今天或昨天）开始回溯
    let pivot = sortedTimestamps.includes(today) ? today : yesterday;
    
    if (sortedTimestamps.includes(pivot)) {
        currentStreak = 1;
        let checkDate = pivot - 86400000;
        while (sortedTimestamps.includes(checkDate)) {
            currentStreak++;
            checkDate -= 86400000;
        }
    }

    setStreak(currentStreak);
  };

  const toggleDate = (year: number, month: number, day: number) => {
    // 1. 生成标准 ID (模拟点击生成的数据)
    const dateId = generateDateId(year, month, day);
    
    let newDates;
    // 2. 检查是否已存在
    if (completedDates.includes(dateId)) {
      if (confirm(`确定要撤销 ${dateId} 的打卡记录吗？`)) {
        newDates = completedDates.filter(d => d !== dateId);
      } else return;
    } else {
      newDates = [...completedDates, dateId];
    }
    // 3. 保存并刷新
    saveData(newDates);
  };

  const exportAttendance = () => {
    if (completedDates.length === 0) return alert("暂无打卡记录可导出。");
    const dataStr = JSON.stringify(completedDates, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `CATTI_Attendance_${dateToId(new Date())}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // --- 导入逻辑：模拟逐个打卡 ---
  const importAttendance = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const resultStr = event.target?.result as string;
        const importedData = JSON.parse(resultStr);

        if (Array.isArray(importedData)) {
          // 这里的逻辑就像是：把文件里的每一个日期拿出来，
          // 在日历上找到对应的格子，然后“按”下去（生成标准ID）。
          const validImportedDates = importedData
            .map(item => {
               if (typeof item !== 'string') return "";
               
               // 方案 A: 尝试正则匹配 (最安全，忽略时区)
               // 匹配 YYYY-MM-DD 或 YYYY/MM/DD
               const match = item.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
               if (match) {
                 const year = parseInt(match[1], 10);
                 const month = parseInt(match[2], 10);
                 const day = parseInt(match[3], 10);
                 return generateDateId(year, month, day);
               }

               // 方案 B: 如果是 ISO 字符串或其他格式，尝试 Date 解析
               // 注意：这可能会受时区影响，但作为后备方案
               const d = new Date(item);
               if (!isNaN(d.getTime())) {
                 return generateDateId(d.getFullYear(), d.getMonth() + 1, d.getDate());
               }

               return "";
            })
            .filter(item => item !== "");

          if (validImportedDates.length === 0) {
            alert("文件读取成功，但未发现有效的日期格式。\n请确保导入的是日期字符串数组。");
            return;
          }

          // 合并现有数据，利用 Set 去重
          const mergedSet = new Set([...completedDates, ...validImportedDates]);
          const mergedArray = Array.from(mergedSet).sort();
          const newCount = mergedArray.length - completedDates.length;

          if (confirm(`解析完成！\n\n文件包含记录：${validImportedDates.length} 条\n将新增记录：${newCount} 条\n\n确定要同步到日历吗？`)) {
            // 保存，触发全应用更新
            saveData(mergedArray);
            
            // 自动跳转视图到最近的一个打卡日
            if (mergedArray.length > 0) {
              const lastDateStr = mergedArray[mergedArray.length - 1];
              // 简单解析最后一天，用于跳转日历视图
              const parts = lastDateStr.split('-').map(Number);
              if (parts.length === 3) {
                 setCurrentDate(new Date(parts[0], parts[1] - 1, parts[2]));
              }
            }
            alert("日历已同步！");
          }
        } else {
          alert("文件格式错误：请导入 JSON 数组格式的文件。");
        }
      } catch (err) {
        console.error(err);
        alert('文件解析失败，请检查文件是否损坏。');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const getPersistenceLevel = (count: number) => {
    if (count < 7) return "初涉江湖";
    if (count < 21) return "渐入佳境";
    if (count < 60) return "持之以恒";
    if (count < 120) return "炉火纯青";
    return "登峰造极";
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const renderCalendar = () => {
    const viewYear = currentDate.getFullYear();
    const viewMonth = currentDate.getMonth(); // 0 = Jan
    
    // 显示用的月份 (1 = Jan)
    const displayMonth = viewMonth + 1;

    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    const days = [];
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-14 sm:h-20 border-b border-r border-slate-50 bg-slate-50/20"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      // 渲染每个格子时，生成它的标准 ID
      const currentId = generateDateId(viewYear, displayMonth, day);
      
      // 检查 completedDates 数组里有没有这个标准 ID
      const isCompleted = completedDates.includes(currentId);
      const isToday = dateToId(new Date()) === currentId;

      days.push(
        <div 
          key={day} 
          onClick={() => toggleDate(viewYear, displayMonth, day)}
          title={isCompleted ? "点击撤销" : "点击补签"}
          className={`h-14 sm:h-24 border-b border-r border-slate-50 p-2 sm:p-4 relative transition-all cursor-pointer group ${
            isCompleted ? 'bg-indigo-50/40 hover:bg-indigo-50/60' : 'hover:bg-slate-50'
          }`}
        >
          <span className={`text-xs font-black transition-all inline-block w-6 h-6 text-center leading-6 rounded-full ${
            isToday 
              ? 'bg-indigo-600 text-white shadow-md' 
              : isCompleted 
                ? 'text-indigo-600' 
                : 'text-slate-400 group-hover:text-slate-600'
          }`}>
            {day}
          </span>
          
          {isCompleted && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-indigo-100/50 w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                <CheckCircle2 size={20} className="text-indigo-600" />
              </div>
            </div>
          )}
          
          {!isCompleted && (
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <RefreshCw size={14} className="text-slate-300" />
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden select-none">
        <header className="px-8 py-6 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-2.5 rounded-xl">
               <CalendarIcon size={20} className="text-indigo-400" />
            </div>
            <h3 className="text-xl font-black tracking-tight font-serif-en">{viewYear}年 {String(displayMonth).padStart(2, '0')}月</h3>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setCurrentDate(new Date(viewYear, viewMonth - 1))} className="p-2 hover:bg-white/10 rounded-xl transition-all"><ChevronLeft size={20} /></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 text-xs font-bold hover:bg-white/10 rounded-xl transition-all border border-white/10">今天</button>
            <button onClick={() => setCurrentDate(new Date(viewYear, viewMonth + 1))} className="p-2 hover:bg-white/10 rounded-xl transition-all"><ChevronRight size={20} /></button>
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
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800">学习历程</h2>
          <p className="text-slate-500 font-medium mt-2">可视化你的努力。坚持每天打卡，见证 B1 到 C2 的蜕变。</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={exportAttendance}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <Download size={18} /> 备份数据
          </button>
          <label className="flex items-center gap-2 px-5 py-3 bg-indigo-600 border border-indigo-600 rounded-2xl text-sm font-bold text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 cursor-pointer active:scale-95">
            <Upload size={18} /> 导入记录
            <input type="file" className="hidden" accept=".json" onChange={importAttendance} />
          </label>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="bg-orange-50 p-4 rounded-2xl text-orange-500">
            <Flame size={32} className="fill-current" />
          </div>
          <div>
            <div className="text-slate-400 text-xs font-black uppercase tracking-widest">当前连续打卡</div>
            <div className="text-3xl font-black text-slate-800">{streak} 天</div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="bg-blue-50 p-4 rounded-2xl text-blue-500">
            <CheckCircle2 size={32} />
          </div>
          <div>
            <div className="text-slate-400 text-xs font-black uppercase tracking-widest">累计打卡天数</div>
            <div className="text-3xl font-black text-slate-800">{completedDates.length} 天</div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
            <div className="bg-purple-50 p-4 rounded-2xl text-purple-500">
              <Trophy size={32} />
            </div>
            <div>
              <div className="text-slate-400 text-xs font-black uppercase tracking-widest">毅力等级</div>
              <div className="text-xl font-black text-slate-800">{getPersistenceLevel(completedDates.length)}</div>
            </div>
        </div>
      </div>

      <div>
        {renderCalendar()}
      </div>
    </div>
  );
};

export default AttendanceCalendar;
