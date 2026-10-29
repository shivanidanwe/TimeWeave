import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  User,
  Send,
  Sparkles,
  Plus,
  Check,
  Calendar,
  AlertCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { api } from '../api/client';
import { ChatMessage } from '../types';

export const AiAssistantPage: React.FC = () => {
  const { user } = useAuth();
  const { tasks } = useTasks();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      content: "Hello! I am your TimeWeave AI productivity coach. I analyze your actual tasks, durations, and preferences to help you stay balanced.\n\nTry selecting one of the suggested prompts below or ask me anything about your schedule!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actions: [
        { label: 'Plan my day', action: 'plan_day' },
        { label: 'Which tasks are overdue?', action: 'check_overdue' },
        { label: 'Do I have enough time?', action: 'check_time' },
        { label: 'Which task should I do next?', action: 'suggest_next' }
      ]
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendQuery = async (queryText: string) => {
    if (!queryText.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);

    try {
      const res = await api.sendChatMessage(queryText, messages);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: res.actions
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        content: `I analyzed your tasks. You currently have ${tasks.filter(t => t.status !== 'Completed').length} pending tasks. Head to 'AI Planner' or 'Calendar' to generate a full energy-aware schedule.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputMessage.trim();
    setInputMessage('');
    sendQuery(text);
  };

  const handleActionClick = async (action: any) => {
    if (action.action === 'apply_schedule') {
      try {
        const schedRes = await api.generateSchedule();
        if (schedRes?.schedule_version_id) {
          await api.acceptSchedule(schedRes.schedule_version_id);
          const confirmMsg: ChatMessage = {
            id: Date.now().toString(),
            sender: 'assistant',
            content: '✅ Your schedule has been successfully created, activated, and saved to your calendar!',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, confirmMsg]);
        }
      } catch (e: any) {
        alert('Failed to activate schedule: ' + e.message);
      }
    } else {
      sendQuery(action.label);
    }
  };

  const promptSuggestions = [
    'Plan my day.',
    'Which tasks are overdue?',
    'Do I have enough time for these tasks?',
    'Which task should I do next?',
    'Show me my workload for tomorrow.'
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden animate-in fade-in duration-200">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#818CF8] flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>TimeWeave AI Assistant</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </h1>
            <p className="text-xs text-slate-500">Adaptive Scheduling Coach &amp; Workload Advisor</p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          Deterministic &amp; Data-Backed
        </span>
      </div>

      {/* Suggested Quick Prompts Bar */}
      <div className="px-6 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-500" />
          <span>Quick:</span>
        </span>
        {promptSuggestions.map((prompt, i) => (
          <button
            key={i}
            onClick={() => sendQuery(prompt)}
            disabled={isSending}
            className="px-3 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 transition shrink-0 shadow-2xs"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isUser
                    ? 'bg-slate-800 text-white'
                    : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`space-y-2 max-w-lg ${isUser ? 'text-right' : ''}`}>
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-[#6366F1] text-white rounded-tr-xs'
                      : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-xs'
                  }`}
                >
                  <p className="whitespace-pre-line text-left">{msg.content}</p>
                </div>

                {/* Interactive Action Buttons */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {msg.actions.map((act: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => handleActionClick(act)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-[#6366F1] border border-indigo-200 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs active:scale-95"
                      >
                        <span>{act.label}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                )}

                <span className="text-[10px] text-slate-400 block px-1">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl text-xs text-slate-500 flex items-center gap-2 border border-slate-200">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></div>
              <span>Analyzing tasks, capacity, and deadlines...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white flex items-center gap-3">
        <input
          type="text"
          placeholder="Ask a scheduling question (e.g. 'Plan my day', 'Which tasks are overdue?')..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          disabled={isSending}
          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || isSending}
          className="w-11 h-11 rounded-2xl bg-[#6366F1] hover:bg-[#4F46E5] text-white flex items-center justify-center shadow-md shadow-indigo-500/20 transition disabled:opacity-40 active:scale-95 shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
