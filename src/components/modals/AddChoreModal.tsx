/**
 * Modal for adding new chores to the system
 */

import React, { useState, useEffect } from 'react';
import { User } from '../../lib/supabase';

interface AddChoreModalProps {
  isOpen: boolean;
  users: User[];
  onClose: () => void;
  onAddChore: (name: string, weeksBetween: number, assignedUserIds: string[]) => Promise<void>;
}

export const AddChoreModal: React.FC<AddChoreModalProps> = ({
  isOpen,
  users,
  onClose,
  onAddChore
}) => {
  const [choreName, setChoreName] = useState('');
  const [weeksBetween, setWeeksBetween] = useState(1);
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([]);

  // Initialize with all users selected by default
  useEffect(() => {
    if (users.length > 0 && assignedUserIds.length === 0) {
      setAssignedUserIds(users.map(u => u.id));
    }
  }, [users, assignedUserIds.length]);

  const handleSubmit = async () => {
    if (!choreName.trim() || assignedUserIds.length === 0) return;
    
    await onAddChore(choreName.trim(), weeksBetween, assignedUserIds);
    
    // Reset form
    setChoreName('');
    setWeeksBetween(1);
    setAssignedUserIds(users.map(u => u.id));
    onClose();
  };

  const handleUserToggle = (userId: string, checked: boolean) => {
    if (checked) {
      setAssignedUserIds([...assignedUserIds, userId]);
    } else {
      setAssignedUserIds(assignedUserIds.filter(id => id !== userId));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <span className="close-btn" onClick={onClose}>&times;</span>
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
                onChange={(e) => handleUserToggle(user.id, e.target.checked)}
              />
              {user.name}
            </label>
          ))}
        </div>
        
        <button className="save-btn" onClick={handleSubmit}>
          Add Chore
        </button>
      </div>
    </div>
  );
};