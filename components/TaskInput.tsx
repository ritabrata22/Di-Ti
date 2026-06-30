"use client";
"use strict";


import React, { useState } from 'react';
import { Plus } from 'lucide-react';

interface TaskInputProps {
  onAddTask: (title: string) => Promise<void>;
}

export default function TaskInput({ onAddTask }: TaskInputProps) {
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;

    try {
      setSubmitting(true);
      await onAddTask(title.trim());
      setTitle('');
    } catch (err) {
      console.error("Task validation capture failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full bg-zinc-900/40 border border-zinc-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={submitting}
        placeholder="Queue a new objective vector..."
        className="flex-1 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/80 disabled:opacity-50 transition-all duration-150"
      />
      <button
        type="submit"
        disabled={!title.trim() || submitting}
        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 border border-indigo-500/20 disabled:border-transparent text-white font-semibold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
      >
        <Plus className="w-4 h-4" />
        <span>Add Vector</span>
      </button>
    </form>
  );
}