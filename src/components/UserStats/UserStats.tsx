/**
 * UserStats component - displays user's chore completion statistics
 */

import React from 'react';

interface UserStatsProps {
  userName: string;
  stats: {
    totalCompleted: number;
    totalMissed: number;
    thisWeekTotal: number;
    thisWeekCompleted: number;
    thisWeekMissed: number;
  };
}

export const UserStats: React.FC<UserStatsProps> = ({ userName, stats }) => {
  return (
    <div className="user-stats">
      <div className="stats-header">
        <span className="stats-title">{userName}'s Stats</span>
      </div>
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-value completed">{stats.totalCompleted}</span>
          <span className="stat-label">Total Completed</span>
        </div>
        <div className="stat-item">
          <span className="stat-value missed">{stats.totalMissed}</span>
          <span className="stat-label">Total Missed</span>
        </div>
        <div className="stat-item">
          <span className="stat-value this-week">{stats.thisWeekCompleted}/{stats.thisWeekTotal}</span>
          <span className="stat-label">This Week</span>
        </div>
      </div>
    </div>
  );
};