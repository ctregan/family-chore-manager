/**
 * Date utility functions for the Family Chore Manager
 */

// Helper function to get Monday of current week (from supabase.ts)
export function getWeekStart(date: Date = new Date()): Date {
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(date)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

// Format date for database (YYYY-MM-DD) (from supabase.ts)
export function formatDateForDB(date: Date): string {
  return date.toISOString().split('T')[0]
}

// Format week range for display (e.g., "8/11 - 8/17")
export function getWeekString(date: Date): string {
  const endOfWeek = new Date(date);
  endOfWeek.setDate(date.getDate() + 6);
  
  const formatDate = (d: Date) => {
    return d.toLocaleDateString('en-US', { 
      month: 'numeric', 
      day: 'numeric'
    });
  };
  
  return `${formatDate(date)} - ${formatDate(endOfWeek)}`;
}

// Get array of weeks to display (current implementation: 2 weeks before, current, 1 week after)
export function getDisplayWeeks(currentWeek: Date): Date[] {
  const weeks: Date[] = [];
  for (let i = -2; i <= 1; i++) {
    const week = new Date(currentWeek);
    week.setDate(week.getDate() + (i * 7));
    weeks.push(week);
  }
  return weeks;
}