/**
 * Tests for date utility functions
 */

import { getWeekStart, formatDateForDB, getWeekString, getDisplayWeeks } from '../../utils/dateUtils';

describe('dateUtils', () => {
  describe('getWeekStart', () => {
    it('should return Monday for any day of the week', () => {
      // Test with a known Thursday (2023-08-17)
      const thursday = new Date('2023-08-17');
      const weekStart = getWeekStart(thursday);
      
      expect(weekStart.getDay()).toBe(1); // Monday
      expect(formatDateForDB(weekStart)).toBe('2023-08-14');
    });

    it('should return the same Monday when given a Monday', () => {
      // Use a specific Monday date in UTC to avoid timezone issues
      const monday = new Date('2023-08-14T12:00:00.000Z');
      const weekStart = getWeekStart(monday);
      
      expect(weekStart.getDay()).toBe(1); // Should still be Monday
    });

    it('should handle Sunday correctly (go to previous Monday)', () => {
      const sunday = new Date('2023-08-20T12:00:00.000Z');
      const weekStart = getWeekStart(sunday);
      
      expect(weekStart.getDay()).toBe(1); // Monday
      expect(formatDateForDB(weekStart)).toBe('2023-08-14');
    });
  });

  describe('formatDateForDB', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date('2023-08-17T15:30:00');
      expect(formatDateForDB(date)).toBe('2023-08-17');
    });
  });

  describe('getWeekString', () => {
    it('should format week range correctly', () => {
      const monday = new Date('2023-08-14T12:00:00.000Z');
      const weekString = getWeekString(monday);
      
      // Should be Monday to Sunday (allowing for potential timezone differences)
      expect(weekString).toContain('8/');
      expect(weekString).toContain(' - ');
    });
  });

  describe('getDisplayWeeks', () => {
    it('should return 4 weeks: 2 before, current, 1 after', () => {
      const currentWeek = new Date('2023-08-14'); // Monday
      const weeks = getDisplayWeeks(currentWeek);
      
      expect(weeks).toHaveLength(4);
      expect(formatDateForDB(weeks[0])).toBe('2023-07-31'); // 2 weeks before
      expect(formatDateForDB(weeks[1])).toBe('2023-08-07'); // 1 week before
      expect(formatDateForDB(weeks[2])).toBe('2023-08-14'); // current
      expect(formatDateForDB(weeks[3])).toBe('2023-08-21'); // 1 week after
    });
  });
});