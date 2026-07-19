import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Chat from './Chat';

vi.mock('../../components/Conversation', () => ({
  default: () => <div data-testid="conversation" />,
}));
vi.mock('../../components/Footer', () => ({
  default: () => <div data-testid="footer" />,
}));

describe('Chat', () => {
  it('renders a main landmark named "Chat"', () => {
    render(<Chat />);
    expect(screen.getByRole('main', { name: 'Chat' })).toBeInTheDocument();
  });

  it('provides a top-level heading for screen readers', () => {
    render(<Chat />);
    expect(screen.getByRole('heading', { level: 1, name: 'Chat' })).toBeInTheDocument();
  });

  it('renders the conversation and the footer', () => {
    render(<Chat />);
    expect(screen.getByTestId('conversation')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});
