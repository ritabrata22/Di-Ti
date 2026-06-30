"use client";
"use strict";

import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '@/types';
import ChatBubble from './ChatBubble';
import LoadingBubble from './LoadingBubble';
import { Sparkles, Calendar, MessageSquare, Trash2 } from 'lucide-react';

interface ChatSectionProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onAnalyze: () => void;
  onGenerateSchedule: () => void;
  onClearChat: () => void; // Added property anchor to handle global cache deletion
}

export default function ChatSection({
  messages,
  isLoading,
  onAnalyze,
  onGenerateSchedule,
  onClearChat,
}: ChatSectionProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Smooth scroll to bottom whenever history expands or typing begins
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="w-full bg-zinc-900/40 border border-zinc-800 rounded-2xl flex flex-col h-[550px] overflow-hidden backdrop-blur-md shadow-xl">
      
      {/* Thread Header */}
      <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Ahead Copilot</h3>
            <p className="text-[11px] text-zinc-500">Powered by Gemini AI</p>
          </div>
        </div>
        
        {/* Real-time Status & Global Trash Flush */}
        <div className="flex items-center space-x-2">
          {messages.length > 0 && (
            <button
              onClick={onClearChat}
              disabled={isLoading}
              title="Clear Chat History"
              className="p-1.5 rounded-lg bg-zinc-950 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-900/50 disabled:opacity-40 disabled:pointer-events-none transition-all duration-150"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="flex items-center space-x-1.5 bg-zinc-950 px-2.5 py-1 rounded-full border border-zinc-800">
            <span className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
              {isLoading ? 'Processing' : 'Ready'}
            </span>
          </div>
        </div>
      </div>

      {/* Conversation Thread */}
      <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4 max-w-sm mx-auto space-y-3">
            <div className="p-3 bg-zinc-800/40 border border-zinc-700/50 rounded-2xl text-zinc-400">
              <Sparkles className="w-6 h-6 animate-pulse text-indigo-400" />
            </div>
            <h4 className="text-sm font-medium text-zinc-200">No active context</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Analyze your current task vectors or request a personalized chronological agenda below.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))
        )}
        
        {isLoading && <LoadingBubble />}
        <div ref={bottomRef} />
      </div>

      {/* Action Control Strip */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-900/60 grid grid-cols-2 gap-3">
        <button
          onClick={onAnalyze}
          disabled={isLoading}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 disabled:opacity-50 disabled:pointer-events-none rounded-xl text-xs font-semibold uppercase tracking-wider text-zinc-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Analyze Tasks</span>
        </button>

        <button
          onClick={onGenerateSchedule}
          disabled={isLoading}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 disabled:opacity-50 disabled:pointer-events-none rounded-xl text-xs font-semibold uppercase tracking-wider text-zinc-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        >
          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          <span>Generate Schedule</span>
        </button>
      </div>

    </div>
  );
}