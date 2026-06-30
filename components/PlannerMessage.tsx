"use strict";

import React from 'react';
import { DailyPlan, PlannerItem } from '@/types';
import { Timeline, TimelineEvent } from '@/components/ui/Timeline'; 

interface PlannerMessageProps {
  data: DailyPlan;
}

export default function PlannerMessage({ data }: PlannerMessageProps) {
  const renderSlots = (items: PlannerItem[], segmentName: string) => {
    if (!items || items.length === 0) return null;
    
    return items.map((item, idx) => (
      <TimelineEvent 
        key={`${segmentName}-${idx}`} 
        title={item.taskTitle} 
        time={`${segmentName} • ${item.timeSlot}`}
      >
        {item.notes && <p className="text-zinc-400 text-xs mt-0.5">{item.notes}</p>}
      </TimelineEvent>
    ));
  };

  return (
    <div className="w-full space-y-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Chronological Itinerary</div>
      
      <Timeline>
        {/* Reason: Generates sequential chronological schedule blocks */}
        {renderSlots(data.morning, 'Morning')}
        {renderSlots(data.afternoon, 'Afternoon')}
        {renderSlots(data.evening, 'Evening')}
      </Timeline>
    </div>
  );
}