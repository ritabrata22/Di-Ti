"use client";
"use strict";

import React, { useState, useEffect } from 'react';
import { useFirestoreTasks } from '@/hooks/useFirestoreTasks';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ChatMessage } from '@/types';

// Component Imports
import SearchFilter from '@/components/SearchFilter';
import DashboardStats from '@/components/DashboardStats';
import ChatSection from '@/components/ChatSection';
import TaskCard from '@/components/TaskCard';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, Clock, Calendar, AlertCircle, Settings2, Check } from 'lucide-react';

export default function TasksPage() {
  // CORRECT: Removed 'const { user } = useAuth();' and the useAuth hook definition
  const {
    filteredTasks,
    loading: tasksLoading,
    stats,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
  } = useFirestoreTasks(); // No arguments passed
  
  // ... rest of your component

  // Unified Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Core Form Field States
  const [taskTitle, setTaskTitle] = useState('');
  const [selectedTime, setSelectedTime] = useState({ type: 'flexible', value: 'Flexible Time' });
  const [selectedDeadline, setSelectedDeadline] = useState({ type: 'flexible', value: 'Flexible Deadline' });

  // Creation Dropdown Visibility States
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [showDeadlineDropdown, setShowDeadlineDropdown] = useState(false);

  // Inline Modification Editing State
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [inlineTime, setInlineTime] = useState({ type: 'flexible', value: 'Flexible Time' });
  const [inlineDeadline, setInlineDeadline] = useState({ type: 'flexible', value: 'Flexible Deadline' });

  // Time Parameter Inputs (Shared between creation and editing)
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [durationHours, setDurationHours] = useState('1');
  const [durationMinutes, setDurationMinutes] = useState('0');

  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem('ahead_ai_chat_history');
      if (savedMessages) setMessages(JSON.parse(savedMessages));
    } catch (e) {
      console.error("Failed to parse cached chat history records:", e);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('ahead_ai_chat_history', JSON.stringify(messages));
    }
  }, [messages]);

  const formatToAmPm = (timeStr: string) => {
    if (!timeStr) return '';
    const [hoursStr, minutesStr] = timeStr.split(':');
    let hours = parseInt(hoursStr, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${String(hours).padStart(2, '0')}:${minutesStr} ${ampm}`;
  };

  const isUrgentDeadline = (urgencyType: string, deadlineVal: string | null) => {
    if (urgencyType === 'flexible' || !deadlineVal) return false;
    if (deadlineVal === 'Today' || deadlineVal === 'Tomorrow') return true;
    
    const deadlineDate = new Date(deadlineVal);
    if (isNaN(deadlineDate.getTime())) return false;
    
    const timeDifference = deadlineDate.getTime() - Date.now();
    const hoursDifference = timeDifference / (1000 * 60 * 60);
    return hoursDifference >= 0 && hoursDifference <= 24;
  };

  const openInlineModifier = (task: any) => {
    setEditingTaskId(task.id);
    setInlineTime({ type: task.timeConstraint || 'flexible', value: task.timeSlotValue || 'Flexible Time' });
    setInlineDeadline({ type: task.urgency || 'flexible', value: task.deadlineValue || 'Flexible Deadline' });
  };

  const handleSaveInlineModifications = async (id: string) => {
    let calculatedTimeValue: string | null = null;

    if (inlineTime.type === 'fixed-slot') {
      calculatedTimeValue = `${formatToAmPm(startTime)} - ${formatToAmPm(endTime)}`;
    } else if (inlineTime.type === 'fixed-duration') {
      calculatedTimeValue = `${durationHours}h ${durationMinutes}m`;
    } else if (inlineTime.type === 'segment') {
      calculatedTimeValue = inlineTime.value;
    }

    await updateDoc(doc(db, 'tasks', id), {
      timeConstraint: inlineTime.type,
      timeSlotValue: inlineTime.type !== 'flexible' ? calculatedTimeValue : null,
      urgency: inlineDeadline.type,
      deadlineValue: inlineDeadline.type !== 'flexible' ? inlineDeadline.value : null,
    });

    setEditingTaskId(null);
  };

const handleAddTask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    // Remove the '!user' check since there is no user object anymore
    if (!taskTitle.trim()) return; 

    let calculatedTimeValue: string | null = null;

    if (selectedTime.type === 'fixed-slot') {
      calculatedTimeValue = `${formatToAmPm(startTime)} - ${formatToAmPm(endTime)}`;
    } else if (selectedTime.type === 'fixed-duration') {
      calculatedTimeValue = `${durationHours}h ${durationMinutes}m`;
    } else if (selectedTime.type === 'segment') {
      calculatedTimeValue = selectedTime.value;
    }

    await addDoc(collection(db, 'tasks'), {
      title: taskTitle.trim(),
      completed: false,
      createdAt: serverTimestamp(),
      // Remove this line entirely:
      // userId: user.uid, 
      timeConstraint: selectedTime.type,
      timeSlotValue: calculatedTimeValue,
      urgency: selectedDeadline.type,
      deadlineValue: selectedDeadline.type !== 'flexible' ? selectedDeadline.value : null,
    });

    setTaskTitle('');
    setSelectedTime({ type: 'flexible', value: 'Flexible Time' });
    setSelectedDeadline({ type: 'flexible', value: 'Flexible Deadline' });
  };

  const handleToggleComplete = async (id: string, currentStatus: boolean) => {
    await updateDoc(doc(db, 'tasks', id), { completed: !currentStatus });
  };

  const handleDeleteTask = async (id: string) => {
    await deleteDoc(doc(db, 'tasks', id));
  };

  const handleGeminiError = (status: number): string => {
    switch (status) {
      case 429: return "AI Unavailable\nDaily AI request limit reached. Please try again later.";
      case 503: return "AI Unavailable\nAI service is experiencing high demand.";
      default: return "An unexpected analytical synchronization error occurred.";
    }
  };

  const triggerAnalyzeTasks = async () => {
    if (aiLoading) return;

// 1. Add User's "click" as a message to the state immediately
  const userMessage: ChatMessage = { 
    id: crypto.randomUUID(), 
    role: 'user', 
    content: 'Analyze my current task vectors', 
    timestamp: Date.now() 
  };
  setMessages(prev => [...prev, userMessage]);

    setAiLoading(true);

    const contextualTaskPayload = filteredTasks.map(t => ({
      id: t.id,
      title: t.title,
      completed: t.completed,
      timeConstraintType: t.timeConstraint || 'flexible',
      allocatedTimeWindow: t.timeSlotValue || 'No specific window',
      urgencyType: t.urgency || 'flexible',
      deadlineTarget: t.deadlineValue || 'No specific deadline'
    }));

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: contextualTaskPayload }),
      });
      if (!response.ok) throw new Error(String(response.status));
      const { data } = await response.json();
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: data?.summary || "Analysis complete.", timestamp: Date.now(), type: 'analysis', analysisData: data }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: handleGeminiError(parseInt(err.message) || 500), timestamp: Date.now() }]);
    } finally {
      setAiLoading(false);
    }
  };

  const triggerGenerateSchedule = async () => {
    if (aiLoading) return;

// 1. ADD THIS: Push the user intent to the message history
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: 'Generate my chronological schedule based on these tasks.',
      timestamp: Date.now(),
      type: 'text'
    };
    setMessages(prev => [...prev, userMessage]);

    setAiLoading(true);

    const contextualTaskPayload = filteredTasks.map(t => ({
      id: t.id,
      title: t.title,
      completed: t.completed,
      timeConstraintType: t.timeConstraint || 'flexible',
      allocatedTimeWindow: t.timeSlotValue || 'Flexible Time',
      urgencyType: t.urgency || 'flexible',
      deadlineTarget: t.deadlineValue || 'Flexible Deadline'
    }));

    try {
      const response = await fetch('/api/ai/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: contextualTaskPayload }),
      });
      if (!response.ok) throw new Error(String(response.status));
      const { data } = await response.json();
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: "Here is your updated chronological schedule compiled exactly from your active task constraints:", timestamp: Date.now(), type: 'schedule', scheduleData: data }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: handleGeminiError(parseInt(err.message) || 500), timestamp: Date.now() }]);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 py-10 px-4 md:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <header className="flex flex-col space-y-2 border-b border-zinc-900 pb-6">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-500 bg-clip-text text-transparent">Di-Ti</h1>
          <p className="text-zinc-400 text-sm">Dynamic Intelligent Task Integrator</p>
        </header>

        <DashboardStats stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Operations & Lists Panel */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 px-1">Task Operations Vector</h2>
              
              <form onSubmit={handleAddTask} className="w-full bg-zinc-900/40 border border-zinc-800/80 p-4 rounded-2xl space-y-4 relative z-30">
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Enter task objective..."
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                  />
                  <button type="submit" className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all shadow-lg shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Add Vector</span>
                  </button>
                </div>

                {/* Dropdown Menu Option Strip */}
                <div className="flex flex-wrap gap-2.5 items-center pt-1 relative z-50">
                  <div className="relative">
                    <button type="button" onClick={() => { setShowTimeDropdown(!showTimeDropdown); setShowDeadlineDropdown(false); }} className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${selectedTime.type !== 'flexible' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{selectedTime.value}</span>
                    </button>
                    {showTimeDropdown && (
                      <div className="absolute left-0 mt-2 w-72 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-3 z-50 space-y-3 max-h-[26rem] overflow-y-auto scrollbar-thin">
                        
                        {/* Custom Time Window */}
                        <div className="space-y-1.5">
                          <button type="button" onClick={() => setSelectedTime({ type: 'fixed-slot', value: `${formatToAmPm(startTime)} - ${formatToAmPm(endTime)}` })} className={`w-full text-left font-bold text-[10px] uppercase tracking-wider rounded px-1.5 py-0.5 transition-colors ${selectedTime.type === 'fixed-slot' ? 'text-indigo-400 bg-indigo-500/5' : 'text-zinc-400'}`}>• Custom Time Window</button>
                          <div className="grid grid-cols-2 gap-2 pl-1.5">
                            <input type="time" value={startTime} onChange={(e) => { setStartTime(e.target.value); setSelectedTime({ type: 'fixed-slot', value: `${formatToAmPm(e.target.value)} - ${formatToAmPm(endTime)}` }); }} className="bg-zinc-900 text-xs text-zinc-200 rounded p-1 border border-zinc-800" />
                            <input type="time" value={endTime} onChange={(e) => { setEndTime(e.target.value); setSelectedTime({ type: 'fixed-slot', value: `${formatToAmPm(startTime)} - ${formatToAmPm(e.target.value)}` }); }} className="bg-zinc-900 text-xs text-zinc-200 rounded p-1 border border-zinc-800" />
                          </div>
                        </div>

                        <div className="border-t border-zinc-900" />

                        {/* Custom Duration Block */}
                        <div className="space-y-1.5">
                          <button type="button" onClick={() => setSelectedTime({ type: 'fixed-duration', value: `${durationHours}h ${durationMinutes}m` })} className={`w-full text-left font-bold text-[10px] uppercase tracking-wider rounded px-1.5 py-0.5 transition-colors ${selectedTime.type === 'fixed-duration' ? 'text-indigo-400 bg-indigo-500/5' : 'text-zinc-400'}`}>• Custom Duration Block</button>
                          <div className="grid grid-cols-2 gap-2 pl-1.5">
                            <select value={durationHours} onChange={(e) => { setDurationHours(e.target.value); setSelectedTime({ type: 'fixed-duration', value: `${e.target.value}h ${durationMinutes}m` }); }} className="w-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 rounded p-1">
                              {[0,1,2,3,4,5,6,7,8].map(h => <option key={h} value={h}>{h} hr</option>)}
                            </select>
                            <select value={durationMinutes} onChange={(e) => { setDurationMinutes(e.target.value); setSelectedTime({ type: 'fixed-duration', value: `${durationHours}h ${e.target.value}m` }); }} className="w-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 rounded p-1">
                              {[0,15,30,45].map(m => <option key={m} value={m}>{m} min</option>)}
                            </select>
                          </div>
                        </div>

                        <div className="border-t border-zinc-900" />
                        
                        {/* Day Segments */}
                        <div className="space-y-1">
                          <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider px-1.5">Broad Day Segments</div>
                          <div className="grid grid-cols-2 gap-1 px-1">
                            {['Morning Block', 'Afternoon Block', 'Evening Block', 'Night Block'].map((seg) => (
                              <button key={seg} type="button" onClick={() => setSelectedTime({ type: 'segment', value: seg })} className={`text-left px-2 py-1 text-xs rounded-md transition-all ${selectedTime.value === seg ? 'bg-indigo-600 text-white' : 'text-zinc-300 hover:bg-zinc-900'}`}>{seg.split(' ')[0]}</button>
                            ))}
                          </div>
                        </div>

                        <div className="border-t border-zinc-900 pt-1" />
                        <button type="button" onClick={() => setSelectedTime({ type: 'flexible', value: 'Flexible Time' })} className="w-full text-left text-xs text-zinc-500 hover:text-zinc-300">Reset to Flexible Time</button>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <button type="button" onClick={() => { setShowDeadlineDropdown(!showDeadlineDropdown); setShowTimeDropdown(false); }} className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${selectedDeadline.type !== 'flexible' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}>
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{selectedDeadline.value}</span>
                    </button>
                    {showDeadlineDropdown && (
                      <div className="absolute left-0 mt-2 w-56 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-2 z-50 space-y-1">
                        <button type="button" onClick={() => { setSelectedDeadline({ type: 'deadline', value: 'Today' }); setShowDeadlineDropdown(false); }} className="w-full text-left px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-900 rounded-lg">Today</button>
                        <button type="button" onClick={() => { setSelectedDeadline({ type: 'deadline', value: 'Tomorrow' }); setShowDeadlineDropdown(false); }} className="w-full text-left px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-900 rounded-lg">Tomorrow</button>
                        <input type="date" onChange={(e) => { if(e.target.value) { setSelectedDeadline({ type: 'deadline', value: e.target.value }); setShowDeadlineDropdown(false); } }} className="w-full bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-200 p-1 rounded mt-1" />
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </div>

            {/* Inventory Listing Block */}
            <div className="space-y-4 relative z-10">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 px-1">Active Inventories</h2>
              <SearchFilter searchQuery={searchQuery} onSearchChange={setSearchQuery} activeFilter={activeFilter} onFilterChange={setActiveFilter} />

              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
                {tasksLoading ? (
                  <div className="text-center py-8 text-xs text-zinc-500 animate-pulse">Syncing vectors...</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <AnimatePresence mode="popLayout">
                      {filteredTasks.map((task) => {
                        const urgent = isUrgentDeadline(task.urgency || 'flexible', task.deadlineValue);
                        const isEditing = editingTaskId === task.id;
                        
                        return (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className={`group relative flex flex-col p-3.5 bg-zinc-900/40 border rounded-xl transition-all ${
                              urgent && !task.completed ? 'border-l-2 border-l-red-500 border-y-zinc-800 border-r-zinc-800 bg-zinc-900/70' : 'border-zinc-800/80'
                            }`}
                          >
                            <div className="flex items-start justify-between w-full">
                              <div className="flex-1 min-w-0">
                                <TaskCard task={task} onToggleComplete={handleToggleComplete} onDelete={handleDeleteTask} />
                              </div>
                              
                              <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                                {urgent && !task.completed && (
                                  <div className="flex items-center space-x-1 text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-2 py-0.5 text-[10px] font-medium tracking-wide">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>24h Limit</span>
                                  </div>
                                )}
                                <button onClick={() => isEditing ? setEditingTaskId(null) : openInlineModifier(task)} className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors rounded hover:bg-zinc-900" title="Modify Time/Deadline">
                                  <Settings2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Inline Modification Sub-Panel */}
                            {isEditing && (
                              <div className="mt-3 p-3 bg-zinc-950 border border-zinc-800/80 rounded-xl space-y-3">
                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Modify Constraints</div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  
                                  {/* Edit Time Frame Block */}
                                  <div className="space-y-1">
                                    <label className="text-[9px] text-zinc-500 block">Scheduled Target</label>
                                    <select value={inlineTime.type} onChange={(e) => setInlineTime({ type: e.target.value, value: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 rounded p-1.5 focus:outline-none">
                                      <option value="flexible">Flexible Time</option>
                                      <option value="fixed-slot">Specific Custom Window</option>
                                      <option value="fixed-duration">Custom Duration Block</option>
                                      <option value="segment">Broad Segment</option>
                                    </select>
                                    
                                    {inlineTime.type === 'fixed-slot' && (
                                      <div className="grid grid-cols-2 gap-1 mt-1">
                                        <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-200 rounded p-1" />
                                        <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-200 rounded p-1" />
                                      </div>
                                    )}

                                    {inlineTime.type === 'fixed-duration' && (
                                      <div className="grid grid-cols-2 gap-1 mt-1">
                                        <select value={durationHours} onChange={(e) => setDurationHours(e.target.value)} className="bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-200 rounded p-1">
                                          {[1,2,3,4,5,6].map(h => <option key={h} value={h}>{h}h</option>)}
                                        </select>
                                        <select value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} className="bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-200 rounded p-1">
                                          {[0,15,30,45].map(m => <option key={m} value={m}>{m}m</option>)}
                                        </select>
                                      </div>
                                    )}

                                    {inlineTime.type === 'segment' && (
                                      <select onChange={(e) => setInlineTime({ type: 'segment', value: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-200 rounded p-1 mt-1">
                                        <option value="Morning Block">Morning Block</option>
                                        <option value="Afternoon Block">Afternoon Block</option>
                                        <option value="Evening Block">Evening Block</option>
                                        <option value="Night Block">Night Block</option>
                                      </select>
                                    )}
                                  </div>

                                  {/* Edit Deadline Limit Block */}
                                  <div className="space-y-1">
                                    <label className="text-[9px] text-zinc-500 block">Cutoff Boundary</label>
                                    <select value={inlineDeadline.type === 'flexible' ? 'flexible' : 'custom'} onChange={(e) => setInlineDeadline({ type: e.target.value === 'flexible' ? 'flexible' : 'deadline', value: e.target.value === 'flexible' ? 'Flexible Deadline' : 'Today' })} className="w-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 rounded p-1.5 focus:outline-none">
                                      <option value="flexible">No Deadline (Flexible)</option>
                                      <option value="custom">Assign Cutoff Boundary</option>
                                    </select>
                                    {inlineDeadline.type !== 'flexible' && (
                                      <div className="flex gap-1 mt-1">
                                        <select value={inlineDeadline.value} onChange={(e) => setInlineDeadline({ type: 'deadline', value: e.target.value })} className="bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-200 rounded p-1 flex-1">
                                          <option value="Today">Today</option>
                                          <option value="Tomorrow">Tomorrow</option>
                                        </select>
                                        <input type="date" onChange={(e) => { if(e.target.value) setInlineDeadline({ type: 'deadline', value: e.target.value }); }} className="bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-200 rounded p-1 max-w-[100px]" />
                                      </div>
                                    )}
                                  </div>

                                </div>
                                
                                <div className="flex justify-end pt-1 border-t border-zinc-900">
                                  <button type="button" onClick={() => handleSaveInlineModifications(task.id)} className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[11px] font-medium transition-colors">
                                    <Check className="w-3 h-3" />
                                    <span>Apply Changes</span>
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Static Info Badges Footer (Hidden while editing) */}
                            {!isEditing && ((task.timeConstraint && task.timeConstraint !== 'flexible') || (task.urgency && task.urgency !== 'flexible')) && (
                              <div className="mt-2 pl-7 flex flex-wrap gap-2 text-[10px]">
                                {task.timeSlotValue && (
                                  <span className="flex items-center space-x-1 bg-zinc-950 px-2 py-0.5 rounded text-zinc-400 border border-zinc-900">
                                    <Clock className="w-2.5 h-2.5 text-indigo-400" />
                                    <span>{task.timeSlotValue}</span>
                                  </span>
                                )}
                                {task.deadlineValue && (
                                  <span className={`flex items-center space-x-1 px-2 py-0.5 rounded border ${urgent && !task.completed ? 'bg-red-950/20 border-red-900/30 text-red-400/90' : 'bg-zinc-950 border-zinc-900 text-zinc-400'}`}>
                                    <Calendar className="w-2.5 h-2.5 text-emerald-400" />
                                    <span>Cutoff: {task.deadlineValue}</span>
                                  </span>
                                )}
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Connected Chat Interface */}
          <div className="lg:col-span-5">
            <ChatSection
              messages={messages}
              isLoading={aiLoading}
              onAnalyze={triggerAnalyzeTasks}
              onGenerateSchedule={triggerGenerateSchedule}
              onClearChat={() => {
                setMessages([]);
                localStorage.removeItem('ahead_ai_chat_history');
              }}
            />
          </div>

        </div>

      </div>
    </main>
  );
}