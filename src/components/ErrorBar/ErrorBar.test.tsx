import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBar from './ErrorBar';

describe('ErrorBar', () => {
  it('renders the message', () => {
    render(<ErrorBar message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('announces itself to screen readers via role="alert"', () => {
    render(<ErrorBar message="Something went wrong" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
  });

  it('does not render a retry button when no retry handler is provided', () => {
    render(<ErrorBar message="Something went wrong" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders a retry button with an accessible name describing the error', () => {
    render(<ErrorBar message="Couldn't load older messages." retryFn={() => {}} />);
    expect(
      screen.getByRole('button', { name: "Retry: Couldn't load older messages." }),
    ).toBeInTheDocument();
  });

  it('invokes the retry handler when the button is clicked', async () => {
    const retryFn = vi.fn();
    const user = userEvent.setup();
    render(<ErrorBar message="Couldn't load older messages." retryFn={retryFn} />);

    await user.click(screen.getByRole('button', { name: /retry/i }));

    expect(retryFn).toHaveBeenCalledTimes(1);
  });
});
