import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoadingBar from './LoadingBar';

describe('LoadingBar', () => {
  it('renders the message', () => {
    render(<LoadingBar message="Loading messages…" />);
    expect(screen.getByText('Loading messages…')).toBeInTheDocument();
  });

  it('announces loading state politely via role="status"', () => {
    render(<LoadingBar message="Loading messages…" />);
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
  });

  it('announces errors assertively via role="alert"', () => {
    render(<LoadingBar message="Failed to load" isError />);
    const region = screen.getByRole('alert');
    expect(region).toHaveAttribute('aria-live', 'assertive');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('renders plain text (no button) when no action is provided', () => {
    render(<LoadingBar message="Loading messages…" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders a keyboard-accessible button labelled with the message when an action is provided', () => {
    render(<LoadingBar message="Retry loading" actionFn={() => {}} />);
    expect(screen.getByRole('button', { name: 'Retry loading' })).toBeInTheDocument();
  });

  it('invokes the action when the button is clicked', async () => {
    const actionFn = vi.fn();
    const user = userEvent.setup();
    render(<LoadingBar message="Retry loading" actionFn={actionFn} />);

    await user.click(screen.getByRole('button', { name: 'Retry loading' }));

    expect(actionFn).toHaveBeenCalledTimes(1);
  });
});
