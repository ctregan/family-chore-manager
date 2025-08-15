/**
 * Hook for managing real-time subscriptions and data synchronization
 */

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface RealTimeSyncOptions {
  onCompletionChange?: () => void;
  onTemplateChange?: () => void;
  onUserChange?: () => void;
}

export function useRealTimeSync(options: RealTimeSyncOptions = {}) {
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now());

  useEffect(() => {
    const subscriptions: any[] = [];

    // Subscribe to chore completion changes
    if (options.onCompletionChange) {
      const completionSubscription = supabase
        .channel('completions-' + Date.now())
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'chore_completions'
          },
          () => {
            options.onCompletionChange?.();
            setLastSyncTime(Date.now());
          }
        )
        .subscribe();

      subscriptions.push(completionSubscription);
    }

    // Subscribe to chore template changes
    if (options.onTemplateChange) {
      const templateSubscription = supabase
        .channel('templates-' + Date.now())
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'chore_templates' },
          () => {
            options.onTemplateChange?.();
          }
        )
        .subscribe();

      subscriptions.push(templateSubscription);
    }

    // Subscribe to user changes
    if (options.onUserChange) {
      const userSubscription = supabase
        .channel('users-' + Date.now())
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'users' },
          () => {
            options.onUserChange?.();
          }
        )
        .subscribe();

      subscriptions.push(userSubscription);
    }

    // Fallback polling mechanism
    const pollInterval = setInterval(() => {
      const timeSinceLastSync = Date.now() - lastSyncTime;
      if (timeSinceLastSync > 30000) { // 30 seconds
        options.onCompletionChange?.();
        setLastSyncTime(Date.now());
      }
    }, 30000);

    // Cleanup
    return () => {
      subscriptions.forEach(sub => {
        supabase.removeChannel(sub);
      });
      clearInterval(pollInterval);
    };
  }, [options, lastSyncTime]); // eslint-disable-line react-hooks/exhaustive-deps

  return { lastSyncTime };
}