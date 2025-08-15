/**
 * Individual chore row component displaying a chore across multiple weeks
 */

import React, { useState, useEffect } from 'react';
import { ChoreTemplate, User } from '../../lib/supabase';
import { formatFrequency } from '../../utils/choreUtils';

interface ChoreRowProps {
  chore: ChoreTemplate;
  weeks: Date[];
  getAssignedUser: (choreId: string, week: Date) => User | null;
  getCompletionStatus: (choreId: string, week: Date) => boolean;
  onToggleCompletion: (choreId: string, week: Date) => Promise<void>;
  onDeleteChore: (choreId: string) => Promise<void>;
}

export const ChoreRow: React.FC<ChoreRowProps> = ({ 
  chore, 
  weeks, 
  getAssignedUser, 
  getCompletionStatus, 
  onToggleCompletion, 
  onDeleteChore 
}) => {
  const [assignedUsers, setAssignedUsers] = useState<{ [key: string]: User | null }>({});

  useEffect(() => {
    const loadAssignedUsers = () => {
      const assigned: { [key: string]: User | null } = {};
      for (const week of weeks) {
        assigned[week.toISOString()] = getAssignedUser(chore.id, week);
      }
      setAssignedUsers(assigned);
    };
    
    loadAssignedUsers();
  }, [chore.id, weeks, getAssignedUser]);

  return (
    <div className="grid-row">
      <div className="grid-cell chore-name-cell">
        <span className="chore-name">{chore.name}</span>
        <span className="frequency-indicator">
          {formatFrequency(chore.weeks_between)}
        </span>
        <button 
          className="delete-chore-btn"
          onClick={() => onDeleteChore(chore.id)}
          title="Delete chore"
        >
          ×
        </button>
      </div>
      
      {weeks.map(week => {
        const assignedUser = assignedUsers[week.toISOString()];
        const isCompleted = getCompletionStatus(chore.id, week);
        
        return (
          <div 
            key={`${chore.id}-${week.toISOString()}`} 
            className="grid-cell completion-cell"
            style={assignedUser ? {
              backgroundColor: assignedUser.color,
              opacity: isCompleted ? 1 : 0.3,
              cursor: 'pointer'
            } : {}}
            onClick={assignedUser && Object.keys(assignedUsers).length > 0 ? () => onToggleCompletion(chore.id, week) : undefined}
            title={assignedUser ? `${assignedUser.name} - ${isCompleted ? 'Completed' : 'Not completed'}` : ''}
          >
            {assignedUser && (
              <div className="completion-indicator">
                {isCompleted ? '✓' : ''}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};