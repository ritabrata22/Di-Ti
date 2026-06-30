"use strict";

import React from 'react';
import { ChatMessage } from '@/types';
import AnalysisMessage from './AnalysisMessage';
import PlannerMessage from './PlannerMessage';

interface ChatBubbleProps {
  message: ChatMessage;
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  // Safeguard: Extract the layout object no matter if it lives under 'data' or 'scheduleData'
  const targetScheduleData = message.scheduleData || (message as any).data;

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[90%] md:max-w-[75%] rounded-2xl p-4 shadow-md border transition-all duration-200 ${
          isUser
            ? 'bg-indigo-600 border-indigo-500 text-white rounded-tr-none'
            : 'bg-zinc-900 border-zinc-800 text-zinc-100 rounded-tl-none'
        }`}
      >
        {isUser ? (
          <p className="text-sm md:text-base leading-relaxed font-medium whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="w-full">
            {message.type === 'analysis' && message.analysisData ? (
              <AnalysisMessage data={message.analysisData} />
            ) : message.type === 'schedule' && targetScheduleData ? (
              /* Passes the extracted dynamic schema payload downstream safely */
              <PlannerMessage data={targetScheduleData} />
            ) : (
              <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap text-zinc-200">{message.content}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}