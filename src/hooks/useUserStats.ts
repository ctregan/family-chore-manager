/**
 * Hook for calculating user statistics
 */

import { useMemo } from 'react';
import { ChoreTemplate, ChoreCompletion } from '../lib/supabase';
import { getWeekStart, formatDateForDB } from '../utils/dateUtils';

interface UserStats {
  totalCompleted: number;
  totalMissed: number;
  thisWeekTotal: number;
  thisWeekCompleted: number;
  thisWeekMissed: number;
}

export const useUserStats = (
  userId: string | null,
  choreTemplates: ChoreTemplate[],
  completions: ChoreCompletion[],
  getAssignedUser: (choreId: string, weekDate: Date) => { id: string } | null,
  currentWeek: Date
) => {
  const stats = useMemo((): UserStats => {
    if (!userId) {
      return {
        totalCompleted: 0,
        totalMissed: 0,
        thisWeekTotal: 0,
        thisWeekCompleted: 0,
        thisWeekMissed: 0,
      };
    }

    const currentWeekStr = formatDateForDB(getWeekStart(currentWeek));
    
    // Calculate stats based on actual completion data we have
    // This is more accurate than trying to reconstruct all historical assignments
    let totalCompleted = 0;
    let totalMissed = 0;
    let thisWeekTotal = 0;
    let thisWeekCompleted = 0;

    // Get this week's assigned chores for the user
    choreTemplates.forEach(template => {
      const assignedUser = getAssignedUser(template.id, currentWeek);
      if (assignedUser?.id === userId) {
        thisWeekTotal++;
        
        const thisWeekCompletion = completions.find(c => 
          c.chore_template_id === template.id && 
          c.week_start_date === currentWeekStr
        );
        
        if (thisWeekCompletion?.completed) {
          thisWeekCompleted++;
        }
      }
    });

    // Count historical completions and misses from available completion data
    completions.forEach(completion => {
      const weekDate = new Date(completion.week_start_date + 'T00:00:00');
      const template = choreTemplates.find(t => t.id === completion.chore_template_id);
      
      if (template) {
        const assignedUser = getAssignedUser(template.id, weekDate);
        
        if (assignedUser?.id === userId) {
          if (completion.completed) {
            totalCompleted++;
          } else {
            // Only count as missed if the week has passed
            const weekStart = getWeekStart(weekDate);
            const currentWeekStart = getWeekStart(currentWeek);
            if (weekStart < currentWeekStart) {
              totalMissed++;
            }
          }
        }
      }
    });

    const thisWeekMissed = thisWeekTotal - thisWeekCompleted;

    return {
      totalCompleted,
      totalMissed,
      thisWeekTotal,
      thisWeekCompleted,
      thisWeekMissed,
    };
  }, [userId, choreTemplates, completions, getAssignedUser, currentWeek]);

  return stats;
};