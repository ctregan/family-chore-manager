/**
 * Week navigation component for changing the current displayed week
 */

import React from 'react';
import { getWeekString } from '../../utils/dateUtils';

interface WeekNavigationProps {
  currentWeek: Date;
  onWeekChange: (direction: number) => void;
}

export const WeekNavigation: React.FC<WeekNavigationProps> = ({ 
  currentWeek, 
  onWeekChange 
}) => {
  return (
    <div className="week-navigation">
      <button className="week-btn" onClick={() => onWeekChange(-1)}>
        ←
      </button>
      <span className="current-week">
        Week of {getWeekString(currentWeek)}
      </span>
      <button className="week-btn" onClick={() => onWeekChange(1)}>
        →
      </button>
    </div>
  );
};