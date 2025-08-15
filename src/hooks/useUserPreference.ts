/**
 * Hook for managing user preference in localStorage
 */

import { useState, useEffect } from 'react';

const USER_PREFERENCE_KEY = 'family-chore-manager-user-id';

export const useUserPreference = () => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    // Load user preference from localStorage on mount
    const savedUserId = localStorage.getItem(USER_PREFERENCE_KEY);
    if (savedUserId) {
      setSelectedUserId(savedUserId);
    }
  }, []);

  const selectUser = (userId: string) => {
    setSelectedUserId(userId);
    localStorage.setItem(USER_PREFERENCE_KEY, userId);
  };

  const clearUserPreference = () => {
    setSelectedUserId(null);
    localStorage.removeItem(USER_PREFERENCE_KEY);
  };

  return {
    selectedUserId,
    selectUser,
    clearUserPreference,
  };
};