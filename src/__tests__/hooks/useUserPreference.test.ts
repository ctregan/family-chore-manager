/**
 * Tests for useUserPreference hook
 */

import { renderHook, act } from '@testing-library/react';
import { useUserPreference } from '../../hooks/useUserPreference';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('useUserPreference', () => {
  beforeEach(() => {
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
  });

  it('should initialize with null when no preference stored', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => useUserPreference());
    
    expect(result.current.selectedUserId).toBeNull();
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('family-chore-manager-user-id');
  });

  it('should initialize with stored preference', () => {
    mockLocalStorage.getItem.mockReturnValue('user-123');
    
    const { result } = renderHook(() => useUserPreference());
    
    expect(result.current.selectedUserId).toBe('user-123');
  });

  it('should save user preference to localStorage', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => useUserPreference());
    
    act(() => {
      result.current.selectUser('user-456');
    });
    
    expect(result.current.selectedUserId).toBe('user-456');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('family-chore-manager-user-id', 'user-456');
  });

  it('should clear user preference from localStorage', () => {
    mockLocalStorage.getItem.mockReturnValue('user-123');
    
    const { result } = renderHook(() => useUserPreference());
    
    act(() => {
      result.current.clearUserPreference();
    });
    
    expect(result.current.selectedUserId).toBeNull();
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('family-chore-manager-user-id');
  });
});