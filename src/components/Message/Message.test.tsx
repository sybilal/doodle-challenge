import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Message from './Message';

const baseProps = {
  author: 'Bilal',
  message: 'Hey there',
  createdAt: '2026-01-15T09:30:00.000Z',
};

describe('Message', () => {
  it('shows the author name for messages from others', () => {
    render(<Message {...baseProps} />);
    expect(screen.getByText('Bilal')).toBeInTheDocument();
  });

  it('hides the author name for your own messages', () => {
    render(<Message {...baseProps} isYou />);
    expect(screen.queryByText('Bilal')).not.toBeInTheDocument();
  });

  it('decodes HTML entities in the message body', () => {
    render(<Message {...baseProps} message="Bilal &amp; John" />);
    expect(screen.getByText('Bilal & John')).toBeInTheDocument();
  });

  it('exposes each message as a labelled list item for screen readers', () => {
    render(<Message {...baseProps} />);
    const item = screen.getByRole('listitem');
    expect(item).toHaveAccessibleName(/Bilal/);
  });

  it('labels your own messages as "You" rather than the author name', () => {
    render(<Message {...baseProps} isYou />);
    expect(screen.getByRole('listitem')).toHaveAccessibleName(/^You,/);
  });
});
