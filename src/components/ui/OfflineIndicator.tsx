/**
 * Component for displaying network connectivity status
 */

import React from 'react';

interface OfflineIndicatorProps {
  isOffline: boolean;
  error?: string | null;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ isOffline, error }) => {
  if (!isOffline && !error) return null;

  return (
    <>
      {isOffline && (
        <div style={{ 
          fontSize: '0.8em', 
          color: '#ff6b6b', 
          fontWeight: 'bold',
          marginTop: '4px'
        }}>
          📱 Offline Mode
        </div>
      )}
      
      {error && isOffline && (
        <div style={{
          backgroundColor: '#fff3cd',
          color: '#856404',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '0.9em',
          marginTop: '8px',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}
    </>
  );
};