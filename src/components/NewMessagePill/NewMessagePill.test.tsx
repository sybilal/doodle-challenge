import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewMessagePill from './NewMessagePill';

describe('NewMessagePill', () => {
  it('renders the message text', () => {
    render(<NewMessagePill message="New Messages ⬇️" actionFn={() => {}} />);
    expect(screen.getByText('New Messages ⬇️')).toBeInTheDocument();
  });

  it('is a button with a descriptive accessible name', () => {
    render(<NewMessagePill message="New Messages ⬇️" actionFn={() => {}} />);
    expect(
      screen.getByRole('button', { name: 'Scroll to newest messages' }),
    ).toBeInTheDocument();
  });

  it('invokes the action when clicked', async () => {
    const actionFn = vi.fn();
    const user = userEvent.setup();
    render(<NewMessagePill message="New Messages ⬇️" actionFn={actionFn} />);

    await user.click(screen.getByRole('button', { name: 'Scroll to newest messages' }));

    expect(actionFn).toHaveBeenCalledTimes(1);
  });
});
