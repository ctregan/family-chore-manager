/**
 * UserSelector component - allows users to identify themselves and remembers preference
 */

import React, { useState } from 'react';
import { User } from '../../lib/supabase';

interface UserSelectorProps {
  users: User[];
  selectedUserId: string | null;
  onUserSelect: (userId: string) => void;
}

export const UserSelector: React.FC<UserSelectorProps> = ({
  users,
  selectedUserId,
  onUserSelect,
}) => {
  const [isSelecting, setIsSelecting] = useState(!selectedUserId);

  const handleUserSelect = (userId: string) => {
    onUserSelect(userId);
    setIsSelecting(false);
  };

  const selectedUser = users.find(user => user.id === selectedUserId);

  if (!isSelecting && selectedUser) {
    return (
      <div className="user-selector-display">
        <span className="user-greeting">
          Hi, {selectedUser.name}! 
        </span>
        <button 
          onClick={() => setIsSelecting(true)}
          className="change-user-btn"
        >
          Switch User
        </button>
      </div>
    );
  }

  return (
    <div className="user-selector">
      <h3>Who are you?</h3>
      <div className="user-options">
        {users.map(user => (
          <button
            key={user.id}
            onClick={() => handleUserSelect(user.id)}
            className="user-option"
          >
            {user.name}
          </button>
        ))}
      </div>
    </div>
  );
};