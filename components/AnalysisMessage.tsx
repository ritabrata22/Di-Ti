"use strict";

import React from 'react';
import { AIAnalysis } from '@/types';

interface AnalysisMessageProps {
  data: AIAnalysis;
}

export default function AnalysisMessage({ data }: AnalysisMessageProps) {
  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority || 'medium') {
      case 'high': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'low': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'medium':
      default: 
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
  };

  return (
    <div className="space-y-4 w-full">
      {/* 1. Safe parsing of summary text */}
      <p className="text-zinc-300 leading-relaxed text-sm md:text-base">
        {data?.summary || "Analyzing task distribution and priorities..."}
      </p>
      
      {/* 2. Safe parsing of estimated hours */}
      <div className="bg-zinc-950/40 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Estimated Total Commitment</span>
        <span className="text-sm font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
          {data?.estimatedTotalHours || 0} Hours
        </span>
      </div>

      {/* 3. Deeply defensive check on the priorities list map */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 px-1">Priority Mapping</h4>
        {data?.priorities && Array.isArray(data.priorities) && data.priorities.length > 0 ? (
          data.priorities.map((item, idx) => (
            <div key={idx} className="bg-zinc-950/60 border border-zinc-800 p-3 rounded-xl flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div className="space-y-1">
                <span className="text-sm font-medium text-zinc-200 block">{item?.taskTitle || "Untitled Task"}</span>
                <span className="text-xs text-zinc-400 block">{item?.reason || "No breakdown description provided."}</span>
              </div>
              <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border self-start ${getPriorityColor(item?.priority as any)}`}>
                {item?.priority || 'medium'}
              </span>
            </div>
          ))
        ) : (
          <p className="text-xs text-zinc-500 italic px-1">No priority data vectors returned from the analytical route.</p>
        )}
      </div>

      {/* 4. Safe checking for execution strategies array */}
      {data?.recommendedOrder && Array.isArray(data.recommendedOrder) && data.recommendedOrder.length > 0 && (
        <div className="bg-zinc-950/30 border border-zinc-800/60 rounded-xl p-4 space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Execution Strategy</h4>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-zinc-300">
            {data.recommendedOrder.map((step, idx) => (
              <li key={idx} className="marker:text-indigo-400 marker:font-bold">
                <span className="pl-1 text-zinc-200">{step || "System sequence checkpoint"}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}