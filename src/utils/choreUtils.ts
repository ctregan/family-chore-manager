/**
 * Chore-related utility functions for the Family Chore Manager
 */

import { ChoreTemplate, User, ChoreAssignment } from '../lib/supabase';
import { formatDateForDB } from './dateUtils';

// Check if chore is due this week (client-side calculation)
export function isChoresDueThisWeek(chore: ChoreTemplate, weekDate: Date): boolean {
  const weeksSinceEpoch = Math.floor((weekDate.getTime() - new Date('1970-01-05').getTime()) / (7 * 24 * 60 * 60 * 1000));
  return (weeksSinceEpoch % chore.weeks_between) === 0;
}

// Calculate assigned user for a chore in a specific week (client-side rotation)
export function calculateAssignedUser(
  chore: ChoreTemplate, 
  weekDate: Date, 
  assignments: ChoreAssignment[], 
  users: User[]
): User | null {
  if (!isChoresDueThisWeek(chore, weekDate)) return null;
  
  if (assignments.length === 0) return null;

  // Calculate rotation
  const weeksSinceEpoch = Math.floor((weekDate.getTime() - new Date('1970-01-05').getTime()) / (7 * 24 * 60 * 60 * 1000));
  const occurrenceNumber = Math.floor(weeksSinceEpoch / chore.weeks_between);
  const rotationIndex = occurrenceNumber % assignments.length;
  const assignedUserId = assignments[rotationIndex].user_id;
  
  return users.find(u => u.id === assignedUserId) || null;
}

// Format frequency for display
export function formatFrequency(weeksBetween: number): string {
  if (weeksBetween === 1) return 'Weekly';
  if (weeksBetween === 2) return 'Bi-weekly';
  if (weeksBetween === 4) return 'Monthly';
  return `Every ${weeksBetween} weeks`;
}

// Generate optimistic completion object for UI updates
export function createOptimisticCompletion(
  choreId: string,
  weekDate: Date,
  assignedUser: User,
  currentCompleted: boolean
) {
  const newCompleted = !currentCompleted;
  return {
    id: `temp-${Date.now()}`,
    chore_template_id: choreId,
    assigned_user_id: assignedUser.id,
    completed_by_user_id: newCompleted ? assignedUser.id : undefined,
    week_start_date: formatDateForDB(weekDate),
    completed: newCompleted,
    completed_at: newCompleted ? new Date().toISOString() : undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}