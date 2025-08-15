/**
 * Environment variable mocks for testing
 */

// Mock environment variables so tests don't require actual Supabase credentials
process.env.REACT_APP_SUPABASE_URL = 'http://localhost:3000';
process.env.REACT_APP_SUPABASE_ANON_KEY = 'mock-key-for-testing';

// Export empty object to make this a module
export {};