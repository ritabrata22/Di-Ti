"use strict";

import React from 'react';
import { DashboardStatsData } from '@/types';
import { CheckCircle2, Circle, ListTodo, Percent } from 'lucide-react';

interface DashboardStatsProps {
  stats: DashboardStatsData;
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  const cards = [
    { label: 'Total Vectors', value: stats.total, icon: ListTodo, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
    { label: 'Pending', value: stats.pending, icon: Circle, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Efficiency', value: `${stats.completionRate}%`, icon: Percent, color: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {cards.map((card, idx) => (
        <div key={idx} className="bg-zinc-900/40 border border-zinc-800/80 p-4 rounded-2xl flex items-center justify-between backdrop-blur-sm">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block">
              {card.label}
            </span>
            <span className="text-xl md:text-2xl font-bold text-zinc-100 tracking-tight block">
              {card.value}
            </span>
          </div>
          <div className={`p-2.5 rounded-xl border ${card.color}`}>
            <card.icon className="w-4 h-4" />
          </div>
        </div>
      ))}
    </div>
  );
}