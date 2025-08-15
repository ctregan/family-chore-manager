/**
 * Tests for UserStats component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { UserStats } from '../../components/UserStats/UserStats';

describe('UserStats', () => {
  const mockStats = {
    totalCompleted: 15,
    totalMissed: 3,
    thisWeekTotal: 4,
    thisWeekCompleted: 2,
    thisWeekMissed: 2,
  };

  it('should render user name and stats', () => {
    render(<UserStats userName="Charlie" stats={mockStats} />);

    expect(screen.getByText("Charlie's Stats")).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2/4')).toBeInTheDocument();
  });

  it('should render stat labels', () => {
    render(<UserStats userName="Charlie" stats={mockStats} />);

    expect(screen.getByText('Total Completed')).toBeInTheDocument();
    expect(screen.getByText('Total Missed')).toBeInTheDocument();
    expect(screen.getByText('This Week')).toBeInTheDocument();
  });

  it('should apply correct CSS classes to stat values', () => {
    render(<UserStats userName="Charlie" stats={mockStats} />);

    const completedValue = screen.getByText('15');
    const missedValue = screen.getByText('3');
    const thisWeekValue = screen.getByText('2/4');

    expect(completedValue).toHaveClass('stat-value', 'completed');
    expect(missedValue).toHaveClass('stat-value', 'missed');
    expect(thisWeekValue).toHaveClass('stat-value', 'this-week');
  });
});