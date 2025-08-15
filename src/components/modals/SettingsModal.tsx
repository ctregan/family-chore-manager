/**
 * Modal for managing user settings (names and colors)
 */

import React, { useState, useEffect } from 'react';
import { User } from '../../lib/supabase';

interface SettingsModalProps {
  isOpen: boolean;
  users: User[];
  onClose: () => void;
  onUpdateUser: (userId: string, updates: Partial<User>) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  users,
  onClose,
  onUpdateUser
}) => {
  const [editingUsers, setEditingUsers] = useState<User[]>([]);

  useEffect(() => {
    if (isOpen) {
      setEditingUsers([...users]);
    }
  }, [isOpen, users]);

  const handleSave = async () => {
    try {
      for (const user of editingUsers) {
        const originalUser = users.find(u => u.id === user.id);
        if (originalUser && (originalUser.name !== user.name || originalUser.color !== user.color)) {
          await onUpdateUser(user.id, { name: user.name, color: user.color });
        }
      }
      onClose();
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  const updateUser = (index: number, field: keyof User, value: string) => {
    const newUsers = [...editingUsers];
    newUsers[index] = { ...newUsers[index], [field]: value };
    setEditingUsers(newUsers);
  };

  if (!isOpen) return null;

  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <span className="close-btn" onClick={onClose}>&times;</span>
        <h2>Settings</h2>
        
        {editingUsers.map((user, index) => (
          <div key={user.id} className="setting-group">
            <label htmlFor={`user-${user.id}`}>User {index + 1} Name:</label>
            <input 
              type="text" 
              id={`user-${user.id}`}
              value={user.name}
              onChange={(e) => updateUser(index, 'name', e.target.value)}
              placeholder="Enter name"
            />
            <input 
              type="color" 
              value={user.color}
              onChange={(e) => updateUser(index, 'color', e.target.value)}
            />
          </div>
        ))}
        
        <button className="save-btn" onClick={handleSave}>
          Save Settings
        </button>
      </div>
    </div>
  );
};