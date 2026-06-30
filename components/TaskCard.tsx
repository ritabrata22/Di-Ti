"use strict";

import React from 'react';
import { Task } from '@/types';
import { motion } from 'framer-motion';
import { Trash2, CheckCircle2, Circle } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: string, current: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function TaskCard({ task, onToggleComplete, onDelete }: TaskCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={`group w-full flex items-center justify-between p-4 bg-zinc-900/30 border rounded-xl transition-colors duration-150 ${
        task.completed ? 'border-zinc-800/40 bg-zinc-950/20' : 'border-zinc-800 hover:border-zinc-700/80'
      }`}
    >
      <div className="flex items-center space-x-3.5 flex-1 min-w-0">
        <button
          onClick={() => onToggleComplete(task.id, task.completed)}
          className={`flex-shrink-0 transition-transform active:scale-90 duration-100 focus:outline-none ${
            task.completed ? 'text-emerald-400' : 'text-zinc-600 hover:text-zinc-400'
          }`}
        >
          {task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
        </button>
        <span
          className={`text-sm font-medium transition-all duration-150 truncate pr-4 ${
            task.completed ? 'text-zinc-500 line-through' : 'text-zinc-200'
          }`}
        >
          {task.title}
        </span>
      </div>

      <button
        onClick={() => onDelete(task.id)}
        className="p-1.5 rounded-lg border border-transparent hover:border-red-500/20 text-zinc-600 hover:text-red-400 hover:bg-red-500/5 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-150 focus:outline-none"
        title="Delete objective vector"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </motion.div>
  );
}