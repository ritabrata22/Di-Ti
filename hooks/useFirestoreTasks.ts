"use client";
"use strict";

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase'; 
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Task, DashboardStatsData } from '@/types';

// REMOVED userId parameter
export function useFirestoreTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Realtime subscription setup
  useEffect(() => {
    setLoading(true);
    
    // REMOVED 'where' clause - now fetches all tasks
    const q = query(
      collection(db, 'tasks'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const parsedTasks: Task[] = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as Task[];
      
      setTasks(parsedTasks);
      setLoading(false);
    }, (error) => {
      console.error("Firestore sync fail:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []); // Empty dependency array

  // Compute stats
  const stats = useMemo<DashboardStatsData>(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, completionRate };
  }, [tasks]);

  // Combined search and filtering logic
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        activeFilter === 'all' ||
        (activeFilter === 'completed' && task.completed) ||
        (activeFilter === 'pending' && !task.completed);

      return matchesSearch && matchesFilter;
    });
  }, [tasks, searchQuery, activeFilter]);

  return {
    tasks,
    filteredTasks,
    loading,
    stats,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
  };
}