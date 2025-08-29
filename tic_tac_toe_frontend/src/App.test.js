import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Tic Tac Toe title', () => {
  render(<App />);
  const heading = screen.getByText(/tic tac toe/i);
  expect(heading).toBeInTheDocument();
});
