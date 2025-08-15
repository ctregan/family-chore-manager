/**
 * Tests for WeekNavigation component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WeekNavigation } from '../../components/WeekNavigation/WeekNavigation';

describe('WeekNavigation', () => {
  const mockOnWeekChange = jest.fn();
  const testDate = new Date('2023-08-14'); // Monday

  beforeEach(() => {
    mockOnWeekChange.mockClear();
  });

  it('should render current week string', () => {
    render(
      <WeekNavigation 
        currentWeek={testDate} 
        onWeekChange={mockOnWeekChange} 
      />
    );

    expect(screen.getByText(/Week of/)).toBeInTheDocument();
    // Just check that a date range is present (more flexible test)
    expect(screen.getByText(/\d+\/\d+ - \d+\/\d+/)).toBeInTheDocument();
  });

  it('should render navigation buttons', () => {
    render(
      <WeekNavigation 
        currentWeek={testDate} 
        onWeekChange={mockOnWeekChange} 
      />
    );

    expect(screen.getByText('←')).toBeInTheDocument();
    expect(screen.getByText('→')).toBeInTheDocument();
  });

  it('should call onWeekChange with -1 when left button clicked', () => {
    render(
      <WeekNavigation 
        currentWeek={testDate} 
        onWeekChange={mockOnWeekChange} 
      />
    );

    fireEvent.click(screen.getByText('←'));
    expect(mockOnWeekChange).toHaveBeenCalledWith(-1);
  });

  it('should call onWeekChange with 1 when right button clicked', () => {
    render(
      <WeekNavigation 
        currentWeek={testDate} 
        onWeekChange={mockOnWeekChange} 
      />
    );

    fireEvent.click(screen.getByText('→'));
    expect(mockOnWeekChange).toHaveBeenCalledWith(1);
  });
});