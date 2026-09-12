import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './auth.jsx';
import { LoginPage } from './pages.jsx';

vi.mock('./api.js', () => ({ api: { post: vi.fn() } }));
describe('login page', () => {
  it('renders the login form and supports typed credentials', async () => {
    render(<MemoryRouter><AuthProvider><LoginPage /></AuthProvider></MemoryRouter>);
    const email = screen.getByLabelText('Email');
    await userEvent.clear(email); await userEvent.type(email, 'learner@example.com');
    expect(email).toHaveValue('learner@example.com');
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
  });
});
