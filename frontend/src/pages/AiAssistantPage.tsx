import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Bot, Send, Sparkles, Trash2, User } from 'lucide-react';
import { api } from '../api/client';
import { ChatMessage } from '../types';

const quickPrompts = [
  'What tasks do I have today?',
  'Which tasks are overdue?',
  'What is my total pending workload?',
  'Am I overcommitted today?',
  'Which task should I prioritize?',
  'Generate a schedule for today.',
  'How many tasks have I completed?',
  'What is my average task duration?',
  'How can I improve my productivity?',
  'I want to focus on my highest-priority task.'
];

function createWelcomeMessage(): ChatMessage {
  return {
    id: 'welcome',
    sender: 'assistant',
    content: 'Hello! I can help you understand your tasks, workload, priorities, and schedule using your TimeWeave records. I use rule-based analysis and the local scheduling service, not a generative AI model.',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    actions: [
      { label: 'What tasks do I have today?', action: 'ask' },
      { label: 'Show overdue tasks', action: 'ask' },
      { label: 'Generate my schedule', action: 'ask' }
    ]
  };
}

function timestamp(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const AiAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([createWelcomeMessage()]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [requestError, setRequestError] = useState('');
  const busyRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages, isSending]);

  const sendQuery = async (queryText: string) => {
    const text = queryText.trim();
    if (!text || busyRef.current) return;

    busyRef.current = true;
    setRequestError('');
    setMessages((previous) => [...previous, {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: timestamp()
    }]);
    setIsSending(true);

    try {
      const response = await api.sendChatMessage(text);
      if (!response?.success || typeof response.reply !== 'string') {
        throw new Error('The assistant returned an invalid response. Please try again.');
      }
      setMessages((previous) => [...previous, {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        content: response.reply,
        timestamp: timestamp(),
        actions: response.actions || []
      }]);
    } catch {
      setRequestError('The assistant could not reach your task data. Check your connection and try again.');
    } finally {
      busyRef.current = false;
      setIsSending(false);
    }
  };

  const submitInput = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = inputMessage;
    if (!text.trim() || busyRef.current) return;
    setInputMessage('');
    void sendQuery(text);
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      const text = inputMessage;
      if (!text.trim() || busyRef.current) return;
      setInputMessage('');
      void sendQuery(text);
    }
  };

  const handleActionClick = async (action: NonNullable<ChatMessage['actions']>[number]) => {
    if (action.action !== 'apply_schedule') {
      void sendQuery(action.query || action.label);
      return;
    }
    if (busyRef.current) return;

    busyRef.current = true;
    setRequestError('');
    setIsSending(true);
    try {
      const generated = await api.generateSchedule();
      if (!generated?.schedule_version_id) throw new Error('No schedule draft was returned.');
      await api.acceptSchedule(generated.schedule_version_id);
      setMessages((previous) => [...previous, {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        content: 'Your reviewed schedule was applied and saved to your calendar.',
        timestamp: timestamp()
      }]);
    } catch {
      setRequestError('The schedule could not be applied. Your existing accepted schedule was not changed.');
    } finally {
      busyRef.current = false;
      setIsSending(false);
    }
  };

  const clearChat = () => {
    if (busyRef.current) return;
    setRequestError('');
    setMessages([createWelcomeMessage()]);
    setInputMessage('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden animate-in fade-in duration-200">
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#818CF8] flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-slate-900">TimeWeave Assistant</h1>
            <p className="text-xs text-slate-500">Personal, data-backed planning</p>
          </div>
        </div>
        <button
          type="button"
          onClick={clearChat}
          disabled={isSending}
          aria-label="Clear chat"
          title="Clear chat"
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-white hover:text-slate-800 disabled:opacity-40"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 sm:px-6 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-bold text-slate-400 uppercase shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-500" /> Quick:
        </span>
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => void sendQuery(prompt)}
            disabled={isSending}
            className="px-3 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 transition shrink-0 disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4" aria-live="polite">
        {messages.map((message) => {
          const isUser = message.sender === 'user';
          return (
            <div key={message.id} className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isUser ? 'bg-slate-800 text-white' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`space-y-2 max-w-[88%] sm:max-w-lg ${isUser ? 'text-right' : ''}`}>
                <div className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${isUser ? 'bg-[#6366F1] text-white rounded-tr-xs' : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-xs'}`}>
                  <p className="whitespace-pre-line text-left">{message.content}</p>
                </div>
                {message.actions?.length ? (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {message.actions.map((action, index) => (
                      <button
                        key={`${message.id}-${index}`}
                        type="button"
                        onClick={() => handleActionClick(action)}
                        disabled={isSending}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-[#6366F1] border border-indigo-200 rounded-lg text-xs font-bold transition flex items-center gap-1 disabled:opacity-50"
                      >
                        <span>{action.label}</span><ArrowRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                ) : null}
                <span className="text-[10px] text-slate-400 block px-1">{message.timestamp}</span>
              </div>
            </div>
          );
        })}

        {requestError && <p role="alert" className="ml-11 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{requestError}</p>}
        {isSending && (
          <output aria-label="Assistant response is loading" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><Bot className="w-4 h-4" /></div>
            <div className="p-3 bg-slate-50 rounded-2xl text-xs text-slate-500 flex items-center gap-2 border border-slate-200">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              <span>Checking your tasks and schedule...</span>
            </div>
          </output>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={submitInput} className="p-3 sm:p-4 border-t border-slate-100 bg-white flex items-end gap-3">
        <textarea
          aria-label="Message the TimeWeave assistant"
          placeholder="Ask about your tasks, workload, or schedule..."
          value={inputMessage}
          onChange={(event) => setInputMessage(event.target.value)}
          onKeyDown={handleInputKeyDown}
          disabled={isSending}
          rows={2}
          className="flex-1 resize-none px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || isSending}
          aria-label="Send message"
          className="w-11 h-11 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] text-white flex items-center justify-center shadow-md shadow-indigo-500/20 transition disabled:opacity-40 shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};