/**
 * Refactored Family Chore Manager - Main orchestration component
 * 
 * This component now focuses on coordination and state management,
 * while delegating specific functionality to specialized components and hooks.
 */

import React, { useState, useEffect } from 'react';
import { getWeekStart, getDisplayWeeks } from './utils/dateUtils';
import { useChoreData } from './hooks/useChoreData';
import { useRealTimeSync } from './hooks/useRealTimeSync';
import { useNetworkStatus } from './hooks/useNetworkStatus';

// Components
import { ChoreGrid } from './components/ChoreGrid/ChoreGrid';
import { WeekNavigation } from './components/WeekNavigation/WeekNavigation';
import { OfflineIndicator } from './components/ui/OfflineIndicator';
import { AddChoreModal } from './components/modals/AddChoreModal';
import { SettingsModal } from './components/modals/SettingsModal';

import './ChoreManagerGrid.css';

const ChoreManagerGrid: React.FC = () => {
  // Week navigation state
  const [currentWeek, setCurrentWeek] = useState<Date>(getWeekStart());
  
  // Modal states
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAddChoreModal, setShowAddChoreModal] = useState(false);

  // Custom hooks
  const { isOffline } = useNetworkStatus();
  const {
    users,
    choreTemplates,
    loading,
    error,
    loadInitialData,
    loadCompletionsForWeeks,
    toggleChoreCompletion,
    addChore,
    deleteChore,
    updateUser,
    setError,
    getAssignedUser,
    getCompletionStatus
  } = useChoreData(currentWeek);

  // Real-time synchronization
  useRealTimeSync({
    onCompletionChange: () => {
      const displayWeeks = getDisplayWeeks(currentWeek);
      loadCompletionsForWeeks(displayWeeks);
    },
    onTemplateChange: loadInitialData,
    onUserChange: loadInitialData
  });

  // Network status handling
  useEffect(() => {
    const handleOnline = () => {
      setError(null);
      loadInitialData();
    };
    
    const handleOffline = () => {
      setError('You are offline. Changes will be saved when you reconnect.');
    };

    if (isOffline) {
      handleOffline();
    } else {
      window.addEventListener('online', handleOnline);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [isOffline, loadInitialData, setError]);

  // Load initial data on mount
  useEffect(() => {
    loadInitialData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load completions when week changes
  useEffect(() => {
    if (users.length > 0 && choreTemplates.length > 0) {
      const displayWeeks = getDisplayWeeks(currentWeek);
      loadCompletionsForWeeks(displayWeeks);
    }
  }, [currentWeek, users.length, choreTemplates.length, loadCompletionsForWeeks]);

  // Week navigation handler
  const handleWeekChange = (direction: number) => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + (direction * 7));
    setCurrentWeek(newWeek);
  };

  // Error handling for network issues
  const handleError = (message: string) => {
    if (isOffline) {
      setError('You are offline. Please check your connection and try again.');
    } else {
      setError(message);
    }
  };

  // Wrapper functions that include error handling
  const handleToggleCompletion = async (choreId: string, weekDate: Date) => {
    try {
      await toggleChoreCompletion(choreId, weekDate);
      if (error && !isOffline) {
        setError(null);
      }
    } catch (err) {
      handleError('Failed to update chore completion');
    }
  };

  const handleAddChore = async (name: string, weeksBetween: number, assignedUserIds: string[]) => {
    try {
      await addChore(name, weeksBetween, assignedUserIds);
    } catch (err) {
      handleError('Failed to add chore');
    }
  };

  const handleDeleteChore = async (choreId: string) => {
    try {
      await deleteChore(choreId);
    } catch (err) {
      handleError('Failed to delete chore');
    }
  };

  const handleUpdateUser = async (userId: string, updates: any) => {
    try {
      await updateUser(userId, updates);
    } catch (err) {
      handleError('Failed to update user settings');
    }
  };

  // Calculate display weeks
  const displayWeeks = getDisplayWeeks(currentWeek);

  // Loading state
  if (loading) {
    return <div className="app-container"><div>Loading...</div></div>;
  }

  // Error state (non-offline errors)
  if (error && !isOffline) {
    return (
      <div className="app-container">
        <div>Error: {error}</div>
        <button onClick={loadInitialData}>Retry</button>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-top">
          <h1>Family Chore Manager</h1>
          <OfflineIndicator isOffline={isOffline} error={error} />
        </div>
        
        <WeekNavigation 
          currentWeek={currentWeek} 
          onWeekChange={handleWeekChange} 
        />
      </header>

      <main className="main-content">
        <ChoreGrid
          choreTemplates={choreTemplates}
          weeks={displayWeeks}
          currentWeek={currentWeek}
          getAssignedUser={getAssignedUser}
          getCompletionStatus={getCompletionStatus}
          onToggleCompletion={handleToggleCompletion}
          onDeleteChore={handleDeleteChore}
          onAddChore={() => setShowAddChoreModal(true)}
        />
      </main>

      <div className="floating-actions">
        <button className="floating-btn settings-btn" onClick={() => setShowSettingsModal(true)}>
          ⚙️
        </button>
      </div>

      <SettingsModal
        isOpen={showSettingsModal}
        users={users}
        onClose={() => setShowSettingsModal(false)}
        onUpdateUser={handleUpdateUser}
      />

      <AddChoreModal
        isOpen={showAddChoreModal}
        users={users}
        onClose={() => setShowAddChoreModal(false)}
        onAddChore={handleAddChore}
      />
    </div>
  );
};

export default ChoreManagerGrid;