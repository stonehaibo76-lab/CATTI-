
import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { getGeminiResponse } from '../services/geminiService';
import { Send, User, Bot, Loader2 } from 'lucide-react';

const AITutor: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "你好！我是你的 CATTI 私人导师。今天我该如何帮助你从 B1 进阶到 C2 呢？你可以随时询问关于语法、词汇用法或具体翻译难点的问题。" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await getGeminiResponse(input);
      setMessages(prev => [...prev, { role: 'model', text: response || "抱歉，我无法处理该请求，请重试。" }]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-160px)] flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <header className="px-8 py-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
        <div className="bg-indigo-600 p-2 rounded-xl text-white">
          <Bot size={24} />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">CATTI 大师导师</h3>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-xs text-slate-500 font-medium">实时在线</span>
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-4 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'
              }`}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className={`p-5 rounded-3xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-100' 
                  : 'bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100'
              }`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex gap-4 max-w-[80%]">
              <div className="shrink-0 w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                <Bot size={20} />
              </div>
              <div className="p-5 bg-slate-50 text-slate-400 rounded-3xl rounded-tl-none border border-slate-100 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                正在思考...
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-slate-100 bg-slate-50/30">
        <div className="relative">
          <input
            type="text"
            className="w-full pl-6 pr-16 py-5 rounded-2xl bg-white border border-slate-100 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 outline-none transition-all shadow-sm font-medium"
            placeholder="问我任何关于英语或翻译的问题..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-3.5 rounded-xl hover:bg-indigo-700 disabled:bg-slate-200 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-100"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="mt-3 text-center text-[10px] text-slate-400 font-medium uppercase tracking-widest">
          由 Gemini 3 Pro • CATTI 专业模块提供动力
        </p>
      </div>
    </div>
  );
};

export default AITutor;
