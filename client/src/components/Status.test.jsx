import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Status } from './Status.jsx';

describe('shared UI states', () => {
  it('renders loading, error, and empty states', () => {
    const { rerender } = render(<Status loading />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();

    rerender(<Status error={{ message: 'Request failed' }} />);
    expect(screen.getByText('Request failed')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <Status empty="No records">ignored</Status>
      </MemoryRouter>,
    );
    expect(screen.getByText('No records')).toBeInTheDocument();
  });
});
