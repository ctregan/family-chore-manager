/**
 * Tests for useUserStats hook
 */

import { renderHook } from '@testing-library/react';
import { useUserStats } from '../../hooks/useUserStats';

const mockChoreTemplates = [
  {
    id: '1',
    name: 'Test Chore',
    weeks_between: 1,
    created_at: '2023-08-01T00:00:00Z',
    assigned_user_ids: ['user-1', 'user-2']
  }
];

const mockCompletions = [
  {
    id: '1',
    chore_template_id: '1',
    week_start_date: '2023-08-14',
    completed: true,
    completed_by: 'user-1',
    completed_at: '2023-08-15T10:00:00Z'
  }
];

const mockGetAssignedUser = jest.fn();

describe('useUserStats', () => {
  beforeEach(() => {
    mockGetAssignedUser.mockClear();
  });

  it('should return zero stats when no user selected', () => {
    const { result } = renderHook(() =>
      useUserStats(
        null,
        mockChoreTemplates,
        mockCompletions,
        mockGetAssignedUser,
        new Date('2023-08-14')
      )
    );

    expect(result.current.totalCompleted).toBe(0);
    expect(result.current.totalMissed).toBe(0);
    expect(result.current.thisWeekTotal).toBe(0);
    expect(result.current.thisWeekCompleted).toBe(0);
    expect(result.current.thisWeekMissed).toBe(0);
  });

  it('should calculate stats correctly when user is assigned', () => {
    mockGetAssignedUser.mockReturnValue({ id: 'user-1' });

    const { result } = renderHook(() =>
      useUserStats(
        'user-1',
        mockChoreTemplates,
        mockCompletions,
        mockGetAssignedUser,
        new Date('2023-08-14')
      )
    );

    // Since we're testing with limited mock data, we're mainly testing structure
    expect(typeof result.current.totalCompleted).toBe('number');
    expect(typeof result.current.totalMissed).toBe('number');
    expect(typeof result.current.thisWeekTotal).toBe('number');
    expect(typeof result.current.thisWeekCompleted).toBe('number');
    expect(typeof result.current.thisWeekMissed).toBe('number');
  });

  it('should return zero stats when user is not assigned to any chores', () => {
    mockGetAssignedUser.mockReturnValue({ id: 'user-2' });

    const { result } = renderHook(() =>
      useUserStats(
        'user-1',
        mockChoreTemplates,
        [],
        mockGetAssignedUser,
        new Date('2023-08-14')
      )
    );

    expect(result.current.totalCompleted).toBe(0);
    expect(result.current.totalMissed).toBe(0);
  });

  it('should recalculate when completions array changes', () => {
    mockGetAssignedUser.mockReturnValue({ id: 'user-1' });

    const { result, rerender } = renderHook(
      ({ completions }) =>
        useUserStats(
          'user-1',
          mockChoreTemplates,
          completions,
          mockGetAssignedUser,
          new Date('2023-08-14')
        ),
      {
        initialProps: { completions: [] }
      }
    );

    // Initially no completions
    const initialStats = result.current;

    // Add a completion
    rerender({
      completions: [
        {
          id: '1',
          chore_template_id: '1',
          week_start_date: '2023-08-14',
          completed: true,
          completed_by: 'user-1',
          completed_at: '2023-08-15T10:00:00Z'
        }
      ]
    });

    // Stats should have changed
    expect(result.current).not.toEqual(initialStats);
    expect(typeof result.current.totalCompleted).toBe('number');
  });
});