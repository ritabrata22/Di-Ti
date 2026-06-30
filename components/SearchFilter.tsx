"use strict";

import React from 'react';
import { Search } from 'lucide-react';

interface SearchFilterProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  activeFilter: 'all' | 'pending' | 'completed';
  onFilterChange: (filter: 'all' | 'pending' | 'completed') => void;
}

export default function SearchFilter({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
}: SearchFilterProps) {
  
  const tabs = [
    { id: 'all', label: 'All Tasks' },
    { id: 'pending', label: 'Pending' },
    { id: 'completed', label: 'Completed' }
  ] as const;

  return (
    <div className="w-full flex flex-col md:flex-row items-stretch md:items-center gap-4 bg-zinc-900/20 border border-zinc-800/80 p-3 rounded-2xl">
      
      {/* Search Field Container */}
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search task vectors..."
          className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/80 transition-all duration-150"
        />
      </div>

      {/* Modern Filter Segment Control */}
      <div className="flex bg-zinc-950 border border-zinc-800 p-1 rounded-xl">
        {tabs.map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onFilterChange(tab.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 focus:outline-none ${
                isActive
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/50'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

    </div>
  );
}