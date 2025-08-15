/**
 * Main chore grid component displaying the weekly chore matrix
 */

import React from 'react';
import { ChoreTemplate, User } from '../../lib/supabase';
import { ChoreRow } from '../ChoreRow/ChoreRow';
import { getWeekString, formatDateForDB } from '../../utils/dateUtils';

interface ChoreGridProps {
  choreTemplates: ChoreTemplate[];
  weeks: Date[];
  currentWeek: Date;
  getAssignedUser: (choreId: string, week: Date) => User | null;
  getCompletionStatus: (choreId: string, week: Date) => boolean;
  onToggleCompletion: (choreId: string, week: Date) => Promise<void>;
  onDeleteChore: (choreId: string) => Promise<void>;
  onAddChore: () => void;
}

export const ChoreGrid: React.FC<ChoreGridProps> = ({
  choreTemplates,
  weeks,
  currentWeek,
  getAssignedUser,
  getCompletionStatus,
  onToggleCompletion,
  onDeleteChore,
  onAddChore
}) => {
  return (
    <div className="chore-grid-container">
      <div className="chore-grid">
        {/* Header Row */}
        <div className="grid-header">
          <div className="grid-cell header-cell chore-name-header">Chore</div>
          {weeks.map((week) => (
            <div 
              key={week.toISOString()} 
              className={`grid-cell header-cell week-header ${
                formatDateForDB(week) === formatDateForDB(currentWeek) ? 'current-week-header' : ''
              }`}
            >
              {getWeekString(week)}
            </div>
          ))}
        </div>

        {/* Chore Rows */}
        {choreTemplates.map(chore => (
          <ChoreRow 
            key={chore.id}
            chore={chore}
            weeks={weeks}
            getAssignedUser={getAssignedUser}
            getCompletionStatus={getCompletionStatus}
            onToggleCompletion={onToggleCompletion}
            onDeleteChore={onDeleteChore}
          />
        ))}
      </div>

      <button className="add-chore-grid-btn" onClick={onAddChore}>
        + Add New Chore
      </button>
    </div>
  );
};