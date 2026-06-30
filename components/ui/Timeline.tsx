import React from 'react';

export function Timeline({ children }: { children: React.ReactNode }) {
  return <div className="relative border-l border-zinc-800 ml-2 pl-4 space-y-6 my-2">{children}</div>;
}

export function TimelineEvent({ title, time, children }: { title: string; time: string; children?: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-zinc-900 border border-zinc-950" />
      <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">{time}</div>
      <div className="text-sm font-medium text-zinc-100 mt-0.5">{title}</div>
      {children}
    </div>
  );
}