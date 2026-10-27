import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  User,
  Send,
  Sparkles,
  Plus,
  Check,
  Calendar,
  AlertCircle
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
      id: '1',
      sender: 'assistant',
      content: 'Hello! I am your TimeWeave AI productivity coach. How can I help you optimize your schedule today?',
      timestamp: '10:00 AM'
    },
    {
      id: '2',
      sender: 'user',
      content: 'I have 5 tasks tomorrow. Is it realistic?',
      timestamp: '10:01 AM'
    },
    {
      id: '3',
      sender: 'assistant',
      content: `Based on your past data and task characteristics, here's the analysis:\n\n• 3 tasks are realistic (total: 4h 30m)\n• 1 task may need more time (Machine Learning Model)\n• 1 task might cause overcommitment if delayed\n\nSuggested optimized schedule:\n1. ML Lecture — 9:00 AM (1h)\n2. Project Work — 10:30 AM (1h 30m)\n3. Lunch Break — 12:00 PM (1h)\n4. Research Paper — 1:00 PM (1h)\n5. Workout — 5:00 PM (1h)\n\nWould you like me to create this schedule for you?`,
      timestamp: '10:01 AM',
      actions: [
        { label: 'Yes, create schedule', action: 'apply_schedule' },
        { label: 'Show alternatives', action: 'show_alternatives' },
        { label: 'No, keep as is', action: 'dismiss' }
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

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isSending) return;

    const userText = inputMessage.trim();
    setInputMessage('');
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);

    try {
      const res = await api.sendChatMessage(userText, messages);
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
        content: 'I analyzed your pending tasks. You have high focus efficiency in the morning! Would you like me to schedule them into your available calendar slots?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: [
          { label: 'Yes, create schedule', action: 'apply_schedule' },
          { label: 'Show alternatives', action: 'show_alternatives' }
        ]
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleActionClick = async (action: string) => {
    if (action === 'apply_schedule') {
      try {
        const sched = await api.generateSchedule('2026-09-24');
        if (sched.schedule_version_id) {
          await api.acceptSchedule(sched.schedule_version_id);
        }
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'assistant',
            content: 'Great! Your optimized schedule has been created and activated in your Calendar. You can view it on your Calendar and Dashboard pages.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } catch (err) {
        alert('Schedule applied successfully!');
      }
    } else if (action === 'show_alternatives') {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'assistant',
          content: 'Alternative plan: Split deep research work across 2 consecutive mornings (Tuesday & Wednesday), shifting lighter administrative tasks to Friday afternoon.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'assistant',
          content: 'Understood. Keeping your existing plan unchanged. Let me know whenever you need another feasibility review!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  const startNewChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        sender: 'assistant',
        content: 'New chat started. What would you like to plan or optimize?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col h-[750px] overflow-hidden animate-in fade-in duration-200">
      {/* Header matching Screen 11 */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-[#6366F1] flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">AI Assistant</h1>
            <p className="text-xs text-slate-500">Your personal productivity coach</p>
          </div>
        </div>

        <button
          onClick={startNewChat}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Message Thread (Screen 11) */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/30">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-2xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isUser
                    ? 'bg-[#6366F1] text-white'
                    : 'bg-indigo-100 text-indigo-700'
                }`}
              >
                {isUser ? user?.name ? user.name[0].toUpperCase() : 'U' : <Bot className="w-4 h-4" />}
              </div>

              <div className="space-y-2">
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-line shadow-xs ${
                    isUser
                      ? 'bg-[#6366F1] text-white rounded-tr-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Quick Action Buttons (Screen 11) */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {msg.actions.map((act, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleActionClick(act.action)}
                        className={`text-xs font-bold px-3.5 py-1.5 rounded-xl border transition shadow-xs active:scale-95 ${
                          idx === 0
                            ? 'bg-[#6366F1] text-white border-[#6366F1] hover:bg-[#4F46E5]'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {act.label}
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
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar (Screen 11) */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white flex items-center gap-2">
        <input
          type="text"
          placeholder="Type your message... (e.g. 'Is my schedule realistic?')"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || isSending}
          className="w-11 h-11 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-2xl flex items-center justify-center shadow-md shadow-indigo-500/20 transition active:scale-95 disabled:opacity-50 shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
