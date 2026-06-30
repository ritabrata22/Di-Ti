import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const allTasks = body.tasks || [];
    const pendingTasks = allTasks.filter((task: any) => !task.completed);

    if (pendingTasks.length === 0) {
      return NextResponse.json({ success: true, data: { morning: [], afternoon: [], evening: [] } });
    }

    // Initialize schedule buckets
    const schedule: { morning: any[], afternoon: any[], evening: any[] } = {
      morning: [],
      afternoon: [],
      evening: []
    };

    // Global Clocks
    let clocks = { morning: 9, afternoon: 13, evening: 17, night: 20 };
    let mins = { morning: 0, afternoon: 0, evening: 0, night: 0 };

    // Helper: Extract Data
    const parseDuration = (val: string | null) => {
      const match = val?.match(/(\d+)h\s*(\d+)m/i);
      return match ? parseInt(match[1]) * 60 + parseInt(match[2]) : 60;
    };

    const formatTime = (hr: number, m: number) => {
      const p = hr >= 12 ? "PM" : "AM";
      const dHr = hr > 12 ? hr - 12 : hr === 0 ? 12 : hr;
      return `${String(dHr).padStart(2, '0')}:${String(m).padStart(2, '0')} ${p}`;
    };

    // Execution Engine
    const allocate = (block: 'morning' | 'afternoon' | 'evening' | 'night', task: any, duration: number) => {
      let targetHr = clocks[block];
      let targetMin = mins[block];

      const start = formatTime(targetHr, targetMin);
      targetMin += duration;
      while (targetMin >= 60) { targetHr++; targetMin -= 60; }
      const end = formatTime(targetHr, targetMin);

      const item = { 
        taskTitle: task.title, 
        timeSlot: `${start} - ${end}`, 
        notes: task.allocatedTimeWindow || "Routine allocation" 
      };

      // Push to UI buckets (Night goes to Evening UI bucket)
      const uiBlock = block === 'night' ? 'evening' : block;
      schedule[uiBlock].push(item);
      
      // Update clocks
      clocks[block] = targetHr;
      mins[block] = targetMin;
    };

    // Classification & Routing
    pendingTasks.forEach((task: any) => {
      const window = (task.allocatedTimeWindow || "").toLowerCase();
      const type = (task.timeConstraintType || "").toLowerCase();

      // Path A: Fixed Time (e.g., "09:00 AM - 10:00 AM")
      if (window.includes("-")) {
        const h = parseInt(window.split(':')[0]);
        const block = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
        schedule[block].push({ taskTitle: task.title, timeSlot: window, notes: "Fixed commitment" });
      }
      // Path B: Segments
      else if (window.includes("morning")) allocate('morning', task, 60);
      else if (window.includes("afternoon")) allocate('afternoon', task, 60);
      else if (window.includes("night")) allocate('night', task, 60);
      else if (window.includes("evening")) allocate('evening', task, 60);
      // Path C: Flexible/Duration
      else allocate('evening', task, parseDuration(task.allocatedTimeWindow));
    });

    return NextResponse.json({ success: true, data: schedule });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Scheduling Error" }, { status: 500 });
  }
}