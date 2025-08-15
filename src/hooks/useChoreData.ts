/**
 * Hook for managing chore-related data and operations
 */

import { useState, useCallback } from 'react';
import { db, User, ChoreTemplate, ChoreCompletion, ChoreAssignment } from '../lib/supabase';
import { getDisplayWeeks } from '../utils/dateUtils';
import { calculateAssignedUser, createOptimisticCompletion } from '../utils/choreUtils';

interface ChoreDataState {
  users: User[];
  choreTemplates: ChoreTemplate[];
  completions: ChoreCompletion[];
  assignments: { [choreId: string]: ChoreAssignment[] };
  loading: boolean;
  error: string | null;
}

interface ChoreDataActions {
  loadInitialData: () => Promise<void>;
  loadCompletionsForWeeks: (weeks: Date[]) => Promise<void>;
  toggleChoreCompletion: (choreId: string, weekDate: Date) => Promise<void>;
  addChore: (name: string, weeksBetween: number, assignedUserIds: string[]) => Promise<void>;
  deleteChore: (choreId: string) => Promise<void>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  setError: (error: string | null) => void;
  getAssignedUser: (choreId: string, weekDate: Date) => User | null;
  getCompletionStatus: (choreId: string, weekDate: Date) => boolean;
}

export function useChoreData(currentWeek: Date): ChoreDataState & ChoreDataActions {
  const [users, setUsers] = useState<User[]>([]);
  const [choreTemplates, setChoreTemplates] = useState<ChoreTemplate[]>([]);
  const [completions, setCompletions] = useState<ChoreCompletion[]>([]);
  const [assignments, setAssignments] = useState<{ [choreId: string]: ChoreAssignment[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((err: unknown, message: string) => {
    console.error(message, err);
    setError(message);
  }, []);

  const loadCompletionsForWeeks = useCallback(async (weeks: Date[]) => {
    try {
      const allCompletions = [];
      for (const week of weeks) {
        const weekCompletions = await db.getChoreCompletions(week);
        allCompletions.push(...weekCompletions);
      }
      setCompletions(allCompletions);
    } catch (err) {
      handleError(err, 'Failed to load completion data');
    }
  }, [handleError]);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load users and templates
      const [usersData, templatesData] = await Promise.all([
        db.getUsers(),
        db.getChoreTemplates()
      ]);
      
      setUsers(usersData);
      setChoreTemplates(templatesData);
      
      // Load assignments for all chores
      const assignmentPromises = templatesData.map(async (chore) => {
        const choreAssignments = await db.getChoreAssignments(chore.id);
        return { choreId: chore.id, assignments: choreAssignments };
      });
      
      const assignmentResults = await Promise.all(assignmentPromises);
      const assignmentsMap: { [choreId: string]: ChoreAssignment[] } = {};
      assignmentResults.forEach(({ choreId, assignments }) => {
        assignmentsMap[choreId] = assignments;
      });
      setAssignments(assignmentsMap);
      
      // Load completions for displayed weeks
      const displayWeeks = getDisplayWeeks(currentWeek);
      await loadCompletionsForWeeks(displayWeeks);
      
    } catch (err) {
      handleError(err, 'Failed to load initial data');
    } finally {
      setLoading(false);
    }
  }, [currentWeek, loadCompletionsForWeeks, handleError]);

  const getAssignedUser = useCallback((choreId: string, weekDate: Date): User | null => {
    const chore = choreTemplates.find(c => c.id === choreId);
    if (!chore) return null;
    
    const choreAssignments = assignments[choreId] || [];
    return calculateAssignedUser(chore, weekDate, choreAssignments, users);
  }, [choreTemplates, assignments, users]);

  const getCompletionStatus = useCallback((choreId: string, weekDate: Date): boolean => {
    const completion = completions.find(c => 
      c.chore_template_id === choreId && 
      c.week_start_date === weekDate.toISOString().split('T')[0]
    );
    return completion?.completed || false;
  }, [completions]);

  const updateCompletionState = useCallback((choreId: string, weekDate: Date, completion: ChoreCompletion | null) => {
    const weekStartStr = weekDate.toISOString().split('T')[0];
    setCompletions(prev => {
      const filtered = prev.filter(c => !(c.chore_template_id === choreId && c.week_start_date === weekStartStr));
      return completion ? [...filtered, completion] : filtered;
    });
  }, []);

  const toggleChoreCompletion = useCallback(async (choreId: string, weekDate: Date) => {
    try {
      const assignedUser = getAssignedUser(choreId, weekDate);
      if (!assignedUser) return;

      const currentCompleted = getCompletionStatus(choreId, weekDate);
      const optimisticCompletion = createOptimisticCompletion(choreId, weekDate, assignedUser, currentCompleted);
      
      // Optimistic update
      updateCompletionState(choreId, weekDate, optimisticCompletion);

      try {
        // Database operation
        const dbResult = await db.toggleChoreCompletion(choreId, weekDate, assignedUser.id);
        updateCompletionState(choreId, weekDate, dbResult);
        
        if (error) setError(null);
      } catch (dbError) {
        console.error('Database operation failed, reverting optimistic update:', dbError);
        
        // Revert optimistic update
        const originalCompletion = completions.find(c => 
          c.chore_template_id === choreId && 
          c.week_start_date === weekDate.toISOString().split('T')[0]
        );
        updateCompletionState(choreId, weekDate, originalCompletion || null);
        setError('Failed to update chore completion - reverted changes');
        throw dbError;
      }
    } catch (err) {
      console.error('Error toggling completion:', err);
      const errorMessage = err instanceof Error ? err.message : '';
      if (!errorMessage.includes('reverted')) {
        setError('Failed to update chore completion');
      }
    }
  }, [getAssignedUser, getCompletionStatus, updateCompletionState, completions, error]);

  const addChore = useCallback(async (name: string, weeksBetween: number, assignedUserIds: string[]) => {
    try {
      const newChore = await db.createChoreTemplate(name, weeksBetween);
      await db.setChoreAssignments(newChore.id, assignedUserIds);
      
      // Reload data
      const newTemplates = await db.getChoreTemplates();
      setChoreTemplates(newTemplates);
      
      const choreAssignments = await db.getChoreAssignments(newChore.id);
      setAssignments(prev => ({ ...prev, [newChore.id]: choreAssignments }));
      
      const displayWeeks = getDisplayWeeks(currentWeek);
      await loadCompletionsForWeeks(displayWeeks);
    } catch (err) {
      handleError(err, 'Failed to add chore');
    }
  }, [currentWeek, loadCompletionsForWeeks, handleError]);

  const deleteChore = useCallback(async (choreId: string) => {
    try {
      await db.deleteChoreTemplate(choreId);
      const newTemplates = await db.getChoreTemplates();
      setChoreTemplates(newTemplates);
      
      const displayWeeks = getDisplayWeeks(currentWeek);
      await loadCompletionsForWeeks(displayWeeks);
    } catch (err) {
      handleError(err, 'Failed to delete chore');
    }
  }, [currentWeek, loadCompletionsForWeeks, handleError]);

  const updateUser = useCallback(async (userId: string, updates: Partial<User>) => {
    try {
      await db.updateUser(userId, updates);
      const newUsers = await db.getUsers();
      setUsers(newUsers);
    } catch (err) {
      handleError(err, 'Failed to update user');
    }
  }, [handleError]);

  return {
    // State
    users,
    choreTemplates,
    completions,
    assignments,
    loading,
    error,
    
    // Actions
    loadInitialData,
    loadCompletionsForWeeks,
    toggleChoreCompletion,
    addChore,
    deleteChore,
    updateUser,
    setError,
    getAssignedUser,
    getCompletionStatus
  };
}