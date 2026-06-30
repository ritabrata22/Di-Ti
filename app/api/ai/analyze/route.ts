import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const allTasks = body.tasks || [];

    // Filter out completed tasks
    const pendingTasks = allTasks.filter((task: any) => !task.completed);

    if (pendingTasks.length === 0) {
      return NextResponse.json({ 
        success: true, 
        data: {
          summary: "No pending tasks detected for analysis.",
          estimatedTotalHours: 0,
          priorities: [],
          recommendedOrder: ["All items are cleared. Add new entries to generate analysis data."]
        }
      });
    }

    // Smart structural mapping based on actual task data
    const priorities = pendingTasks.map((task: any) => {
      const taskTitle = task.title || "Unassigned Task";
      const lowerTitle = taskTitle.toLowerCase();
      
      let priority: 'high' | 'medium' | 'low' = 'medium';
      let reason = "Standard task item mapped to default queue parameters.";

      // Neutral Keyword Scanner
      if (
        lowerTitle.includes('dsa') || 
        lowerTitle.includes('interview') || 
        lowerTitle.includes('exam') || 
        lowerTitle.includes('hackathon') ||
        lowerTitle.includes('physics') ||
        lowerTitle.includes('chemistry') ||
        lowerTitle.includes('math')
      ) {
        priority = 'high';
        reason = "High-priority constraint. Recommended for early execution sequence.";
      } else if (lowerTitle.includes('magazine') || lowerTitle.includes('read') || lowerTitle.includes('movie') || lowerTitle.includes('game')) {
        priority = 'low';
        reason = "Low-priority secondary item. Positioned at lower tier of timeline queue.";
      } else if (lowerTitle.includes('literature') || lowerTitle.includes('study') || lowerTitle.includes('revise')) {
        priority = 'medium';
        reason = "Medium-priority routine item. Balanced distribution across schedule tracker.";
      }

      return { taskTitle, reason, priority };
    });

    // Sort: High priority items bubble to the top
    const sortedPriorities = [...priorities].sort((a: any, b: any) => {
      const weight = { high: 3, medium: 2, low: 1 };
      return weight[b.priority] - weight[a.priority];
    });

    // Calculate dynamic processing hours
    const estimatedTotalHours = sortedPriorities.reduce((acc: number, curr: any) => {
      if (curr.priority === 'high') return acc + 2.5;
      if (curr.priority === 'medium') return acc + 1.5;
      return acc + 1;
    }, 0);

    // Build completely neutral step-by-step strategies
    const recommendedOrder = sortedPriorities.map((item: any, idx: number) => {
      if (item.priority === 'high') {
        return `Step ${idx + 1}: Process high-priority sequence block: "${item.taskTitle}".`;
      }
      if (item.priority === 'medium') {
        return `Step ${idx + 1}: Process standard routine item: "${item.taskTitle}".`;
      }
      return `Step ${idx + 1}: Address remaining lower-priority queue entry: "${item.taskTitle}".`;
    });

    const dashboardAnalysis = {
      summary: `Analysis complete. Evaluated ${pendingTasks.length} active pending records. Tasks sorted sequentially based on current priority weighting.`,
      estimatedTotalHours: Math.round(estimatedTotalHours),
      priorities: sortedPriorities,
      recommendedOrder
    };

    return NextResponse.json({ success: true, data: dashboardAnalysis });

  } catch (error) {
    console.error("AI Analysis Engine Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}