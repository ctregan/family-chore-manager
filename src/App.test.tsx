import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Family Chore Manager', () => {
  render(<App />);
  // The app should show loading initially, then the title
  const loadingOrTitle = screen.getByText(/Loading...|Family Chore Manager/i);
  expect(loadingOrTitle).toBeInTheDocument();
});
