export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: any; // Firebase Timestamp
  userId: string;
  
  // Custom Manual Timeline Fields (Added to resolve red underlines)
  timeConstraint?: string;       // Options: 'flexible', 'fixed-slot', 'fixed-duration', 'segment'
  timeSlotValue?: string | null;  // Stores string values like: "09:00 AM - 10:00 AM" or "2h 30m"
  urgency?: string;              // Options: 'flexible', 'deadline'
  deadlineValue?: string | null;  // Stores cutoff dates like: "Today", "Tomorrow", or "2026-07-15"
}

export interface PlannerItem {
  taskTitle: string;
  timeSlot: string;
  notes?: string;
}

export interface DailyPlan {
  morning: PlannerItem[];
  afternoon: PlannerItem[];
  evening: PlannerItem[];
}

export interface PriorityItem {
  taskTitle: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

export interface AIAnalysis {
  summary: string;
  estimatedTotalHours: number;
  priorities: PriorityItem[];
  recommendedOrder: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string; // Fallback plain text or raw markdown
  timestamp: number;
  type?: 'text' | 'analysis' | 'schedule';
  analysisData?: AIAnalysis;
  scheduleData?: DailyPlan; // Maps precisely to page.tsx to render scheduled slots
}

export interface DashboardStatsData {
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
}