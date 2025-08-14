import React, { useState, useEffect } from 'react';
import { db, User, ChoreTemplate, ChoreCompletion, getWeekStart, formatDateForDB } from './lib/supabase';
import './ChoreManagerGrid.css';

const ChoreManagerGrid: React.FC = () => {
  const [currentWeek, setCurrentWeek] = useState<Date>(getWeekStart());
  const [users, setUsers] = useState<User[]>([]);
  const [choreTemplates, setChoreTemplates] = useState<ChoreTemplate[]>([]);
  const [completions, setCompletions] = useState<ChoreCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAddChoreModal, setShowAddChoreModal] = useState(false);
  const [choreName, setChoreName] = useState('');
  const [weeksBetween, setWeeksBetween] = useState(1);
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([]);
  
  // Settings modal states
  const [editingUsers, setEditingUsers] = useState<User[]>([]);

  // Helper: Handle errors consistently
  const handleError = (err: unknown, message: string) => {
    console.error(message, err);
    setError(message);
  };

  const loadCompletionsForDisplayedWeeks = async () => {
    try {
      const displayWeeks = getDisplayWeeks();
      const allCompletions = [];
      for (const week of displayWeeks) {
        const weekCompletions = await db.getChoreCompletions(week);
        allCompletions.push(...weekCompletions);
      }
      setCompletions(allCompletions);
    } catch (err) {
      handleError(err, 'Failed to load completion data');
    }
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load users and templates first
      const [usersData, templatesData] = await Promise.all([
        db.getUsers(),
        db.getChoreTemplates()
      ]);
      
      setUsers(usersData);
      setChoreTemplates(templatesData);
      
      // Load completions for all displayed weeks
      await loadCompletionsForDisplayedWeeks();
      
      // Initialize assignedUserIds with all users if not already set
      if (assignedUserIds.length === 0 && usersData.length > 0) {
        setAssignedUserIds(usersData.map(u => u.id));
      }
    } catch (err) {
      handleError(err, 'Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  // Load initial data (only on first mount)
  useEffect(() => {
    loadInitialData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load completions when week changes
  useEffect(() => {
    if (users.length > 0 && choreTemplates.length > 0) {
      loadCompletionsForDisplayedWeeks();
    }
  }, [currentWeek]); // eslint-disable-line react-hooks/exhaustive-deps

  // Week navigation
  const getWeekString = (date: Date): string => {
    const endOfWeek = new Date(date);
    endOfWeek.setDate(date.getDate() + 6);
    
    const formatDate = (d: Date) => {
      return d.toLocaleDateString('en-US', { 
        month: 'numeric', 
        day: 'numeric'
      });
    };
    
    return `${formatDate(date)} - ${formatDate(endOfWeek)}`;
  };

  const changeWeek = (direction: number) => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + (direction * 7));
    setCurrentWeek(newWeek);
  };

  const getDisplayWeeks = (): Date[] => {
    const weeks: Date[] = [];
    for (let i = -2; i <= 1; i++) {
      const week = new Date(currentWeek);
      week.setDate(week.getDate() + (i * 7));
      weeks.push(week);
    }
    return weeks;
  };

  // Helper: Check if chore is due this week
  const isChoresDueThisWeek = (chore: ChoreTemplate, weekDate: Date): boolean => {
    const weeksSinceEpoch = Math.floor((weekDate.getTime() - new Date('1970-01-05').getTime()) / (7 * 24 * 60 * 60 * 1000));
    return (weeksSinceEpoch % chore.weeks_between) === 0;
  };

  // Get assigned user for a chore in a specific week (client-side calculation)
  const getAssignedUser = async (choreId: string, weekDate: Date): Promise<User | null> => {
    try {
      const chore = choreTemplates.find(c => c.id === choreId);
      if (!chore || !isChoresDueThisWeek(chore, weekDate)) return null;

      const assignments = await db.getChoreAssignments(choreId);
      if (assignments.length === 0) return null;

      // Calculate rotation
      const weeksSinceEpoch = Math.floor((weekDate.getTime() - new Date('1970-01-05').getTime()) / (7 * 24 * 60 * 60 * 1000));
      const occurrenceNumber = Math.floor(weeksSinceEpoch / chore.weeks_between);
      const rotationIndex = occurrenceNumber % assignments.length;
      const assignedUserId = assignments[rotationIndex].user_id;
      
      return users.find(u => u.id === assignedUserId) || null;
    } catch (err) {
      console.error('Error getting assigned user:', err);
      return null;
    }
  };

  // Toggle chore completion
  const toggleChoreCompletion = async (choreId: string, weekDate: Date) => {
    try {
      const assignedUser = await getAssignedUser(choreId, weekDate);
      if (!assignedUser) return;

      const weekStartStr = formatDateForDB(weekDate);
      const currentCompletion = completions.find(c => 
        c.chore_template_id === choreId && 
        c.week_start_date === weekStartStr
      );
      
      // Optimistically update UI immediately
      const newCompleted = !currentCompletion?.completed;
      const optimisticCompletion: ChoreCompletion = {
        id: currentCompletion?.id || `temp-${Date.now()}`,
        chore_template_id: choreId,
        assigned_user_id: assignedUser.id,
        completed_by_user_id: newCompleted ? assignedUser.id : undefined,
        week_start_date: weekStartStr,
        completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : undefined,
        created_at: currentCompletion?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Helper function to update completion state
      const updateCompletionState = (completion: ChoreCompletion | null) => {
        setCompletions(prev => {
          const filtered = prev.filter(c => !(c.chore_template_id === choreId && c.week_start_date === weekStartStr));
          return completion ? [...filtered, completion] : filtered;
        });
      };

      // Update state optimistically
      updateCompletionState(optimisticCompletion);

      // Then perform the actual database operation
      try {
        const dbResult = await db.toggleChoreCompletion(choreId, weekDate, assignedUser.id);
        updateCompletionState(dbResult);
      } catch (dbError) {
        console.error('Database operation failed, reverting optimistic update:', dbError);
        
        // Revert optimistic update on database failure
        updateCompletionState(currentCompletion || null);
        setError('Failed to update chore completion - reverted changes');
        throw dbError;
      }
    } catch (err) {
      console.error('Error toggling completion:', err);
      const errorMessage = err instanceof Error ? err.message : '';
      if (!errorMessage.includes('reverted')) {
        setError('Failed to update chore completion');
      }
    }
  };

  // Get completion status for a chore in a specific week
  const getCompletionStatus = (choreId: string, weekDate: Date): boolean => {
    const completion = completions.find(c => 
      c.chore_template_id === choreId && 
      c.week_start_date === formatDateForDB(weekDate)
    );
    return completion?.completed || false;
  };

  // Add new chore
  const addChore = async () => {
    if (!choreName.trim() || assignedUserIds.length === 0) return;
    
    try {
      const newChore = await db.createChoreTemplate(choreName.trim(), weeksBetween);
      await db.setChoreAssignments(newChore.id, assignedUserIds);
      
      setChoreName('');
      setWeeksBetween(1);
      setAssignedUserIds(users.map(u => u.id)); // Reset to all users
      setShowAddChoreModal(false);
      
      // Reload templates and completions
      const newTemplates = await db.getChoreTemplates();
      setChoreTemplates(newTemplates);
      await loadCompletionsForDisplayedWeeks();
    } catch (err) {
      handleError(err, 'Failed to add chore');
    }
  };

  // Delete chore
  const deleteChore = async (choreId: string) => {
    try {
      await db.deleteChoreTemplate(choreId);
      const newTemplates = await db.getChoreTemplates();
      setChoreTemplates(newTemplates);
      await loadCompletionsForDisplayedWeeks();
    } catch (err) {
      handleError(err, 'Failed to delete chore');
    }
  };

  // Settings modal functions
  const openSettingsModal = () => {
    setEditingUsers([...users]);
    setShowSettingsModal(true);
  };

  const saveSettings = async () => {
    try {
      for (const user of editingUsers) {
        if (users.find(u => u.id === user.id)) {
          await db.updateUser(user.id, { name: user.name, color: user.color });
        }
      }
      
      setUsers(editingUsers);
      setShowSettingsModal(false);
    } catch (err) {
      handleError(err, 'Failed to save settings');
    }
  };

  const displayWeeks = getDisplayWeeks();

  if (loading) {
    return <div className="app-container"><div>Loading...</div></div>;
  }

  if (error) {
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
        </div>
        <div className="week-navigation">
          <button className="week-btn" onClick={() => changeWeek(-1)}>←</button>
          <span className="current-week">Week of {getWeekString(currentWeek)}</span>
          <button className="week-btn" onClick={() => changeWeek(1)}>→</button>
        </div>
      </header>

      <main className="main-content">
        <div className="chore-grid-container">
          <div className="chore-grid">
            {/* Header Row */}
            <div className="grid-header">
              <div className="grid-cell header-cell chore-name-header">Chore</div>
              {displayWeeks.map((week, index) => (
                <div key={week.toISOString()} className={`grid-cell header-cell week-header ${formatDateForDB(week) === formatDateForDB(currentWeek) ? 'current-week-header' : ''}`}>
                  {getWeekString(week)}
                </div>
              ))}
            </div>

            {/* Chore Rows */}
            {choreTemplates.map(chore => (
              <ChoreRow 
                key={chore.id}
                chore={chore}
                weeks={displayWeeks}
                users={users}
                getAssignedUser={getAssignedUser}
                getCompletionStatus={getCompletionStatus}
                toggleCompletion={toggleChoreCompletion}
                deleteChore={deleteChore}
              />
            ))}
          </div>

          <button className="add-chore-grid-btn" onClick={() => setShowAddChoreModal(true)}>
            + Add New Chore
          </button>
        </div>
      </main>

      <div className="floating-actions">
        <button className="floating-btn settings-btn" onClick={openSettingsModal}>
          ⚙️
        </button>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="modal" onClick={(e) => e.target === e.currentTarget && setShowSettingsModal(false)}>
          <div className="modal-content">
            <span className="close-btn" onClick={() => setShowSettingsModal(false)}>&times;</span>
            <h2>Settings</h2>
            {editingUsers.map((user, index) => (
              <div key={user.id} className="setting-group">
                <label htmlFor={`user-${user.id}`}>User {index + 1} Name:</label>
                <input 
                  type="text" 
                  id={`user-${user.id}`}
                  value={user.name}
                  onChange={(e) => {
                    const newUsers = [...editingUsers];
                    newUsers[index].name = e.target.value;
                    setEditingUsers(newUsers);
                  }}
                  placeholder="Enter name"
                />
                <input 
                  type="color" 
                  value={user.color}
                  onChange={(e) => {
                    const newUsers = [...editingUsers];
                    newUsers[index].color = e.target.value;
                    setEditingUsers(newUsers);
                  }}
                />
              </div>
            ))}
            <button className="save-btn" onClick={saveSettings}>Save Settings</button>
          </div>
        </div>
      )}

      {/* Add Chore Modal */}
      {showAddChoreModal && (
        <div className="modal" onClick={(e) => e.target === e.currentTarget && setShowAddChoreModal(false)}>
          <div className="modal-content">
            <span className="close-btn" onClick={() => setShowAddChoreModal(false)}>&times;</span>
            <h2>Add New Chore</h2>
            <div className="setting-group">
              <label htmlFor="choreName">Chore Name:</label>
              <input 
                type="text" 
                id="choreName" 
                value={choreName}
                onChange={(e) => setChoreName(e.target.value)}
                placeholder="Enter chore name"
                autoFocus
              />
            </div>
            <div className="setting-group">
              <label htmlFor="weeksBetween">Frequency (weeks between):</label>
              <select 
                id="weeksBetween"
                value={weeksBetween}
                onChange={(e) => setWeeksBetween(parseInt(e.target.value))}
              >
                <option value={1}>Every week</option>
                <option value={2}>Every 2 weeks</option>
                <option value={4}>Every month</option>
                <option value={8}>Every 2 months</option>
              </select>
            </div>
            <div className="setting-group">
              <label>Initially Assigned To:</label>
              <small style={{display: 'block', marginBottom: '8px', color: '#666', fontStyle: 'italic'}}>
                Select who will rotate this chore. The first person selected will be assigned first.
              </small>
              {users.map(user => (
                <label key={user.id} className="checkbox-label">
                  <input 
                    type="checkbox"
                    checked={assignedUserIds.includes(user.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setAssignedUserIds([...assignedUserIds, user.id]);
                      } else {
                        setAssignedUserIds(assignedUserIds.filter(id => id !== user.id));
                      }
                    }}
                  />
                  {user.name}
                </label>
              ))}
            </div>
            <button className="save-btn" onClick={addChore}>Add Chore</button>
          </div>
        </div>
      )}
    </div>
  );
};

// Separate component for chore rows to handle async assigned user logic
const ChoreRow: React.FC<{
  chore: ChoreTemplate;
  weeks: Date[];
  users: User[];
  getAssignedUser: (choreId: string, week: Date) => Promise<User | null>;
  getCompletionStatus: (choreId: string, week: Date) => boolean;
  toggleCompletion: (choreId: string, week: Date) => Promise<void>;
  deleteChore: (choreId: string) => Promise<void>;
}> = ({ chore, weeks, users, getAssignedUser, getCompletionStatus, toggleCompletion, deleteChore }) => {
  const [assignedUsers, setAssignedUsers] = useState<{ [key: string]: User | null }>({});

  useEffect(() => {
    const loadAssignedUsers = async () => {
      const assigned: { [key: string]: User | null } = {};
      for (const week of weeks) {
        assigned[week.toISOString()] = await getAssignedUser(chore.id, week);
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
          {chore.weeks_between === 1 ? 'Weekly' : `Every ${chore.weeks_between} weeks`}
        </span>
        <button 
          className="delete-chore-btn"
          onClick={() => deleteChore(chore.id)}
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
            onClick={assignedUser && Object.keys(assignedUsers).length > 0 ? () => toggleCompletion(chore.id, week) : undefined}
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

export default ChoreManagerGrid;