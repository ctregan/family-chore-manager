/**
 * Tests for UserSelector component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserSelector } from '../../components/UserSelector/UserSelector';

const mockUsers = [
  { id: '1', name: 'Charlie', email: 'charlie@test.com', created_at: '2023-01-01T00:00:00Z' },
  { id: '2', name: 'Callie', email: 'callie@test.com', created_at: '2023-01-01T00:00:00Z' }
];

describe('UserSelector', () => {
  const mockOnUserSelect = jest.fn();

  beforeEach(() => {
    mockOnUserSelect.mockClear();
  });

  describe('when no user is selected', () => {
    it('should show user selection interface', () => {
      render(
        <UserSelector
          users={mockUsers}
          selectedUserId={null}
          onUserSelect={mockOnUserSelect}
        />
      );

      expect(screen.getByText('Who are you?')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
      expect(screen.getByText('Callie')).toBeInTheDocument();
    });

    it('should call onUserSelect when user clicks a name', () => {
      render(
        <UserSelector
          users={mockUsers}
          selectedUserId={null}
          onUserSelect={mockOnUserSelect}
        />
      );

      fireEvent.click(screen.getByText('Charlie'));
      expect(mockOnUserSelect).toHaveBeenCalledWith('1');
    });
  });

  describe('when user is selected', () => {
    it('should show greeting and switch user button', () => {
      render(
        <UserSelector
          users={mockUsers}
          selectedUserId='1'
          onUserSelect={mockOnUserSelect}
        />
      );

      expect(screen.getByText('Hi, Charlie!')).toBeInTheDocument();
      expect(screen.getByText('Switch User')).toBeInTheDocument();
    });

    it('should allow switching back to selection when Switch User is clicked', () => {
      render(
        <UserSelector
          users={mockUsers}
          selectedUserId='1'
          onUserSelect={mockOnUserSelect}
        />
      );

      fireEvent.click(screen.getByText('Switch User'));
      expect(screen.getByText('Who are you?')).toBeInTheDocument();
    });
  });
});