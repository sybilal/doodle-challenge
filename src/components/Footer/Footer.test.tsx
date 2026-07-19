import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Footer from './Footer';
import { renderWithClient } from '../../test/test-utils';
import { CURRENT_USER } from '../../utils/constants';
import type { IMessage } from '../../models/IMessage';

vi.mock('../../services/messages.service', () => ({
  createMessage: vi.fn(),
}));

import { createMessage } from '../../services/messages.service';
const mockedCreate = vi.mocked(createMessage);

const sentMessage = (message: string): IMessage => ({
  _id: 'generated-id',
  message,
  author: CURRENT_USER,
  createdAt: '2026-01-15T09:30:00.000Z',
});

describe('Footer', () => {
  beforeEach(() => {
    mockedCreate.mockResolvedValue(sentMessage('hi'));
  });

  it('exposes the input via an accessible "Message" label', () => {
    renderWithClient(<Footer />);
    expect(screen.getByRole('textbox', { name: /message/i })).toBeInTheDocument();
  });

  it('disables the send button until the user types a non-empty message', async () => {
    const user = userEvent.setup();
    renderWithClient(<Footer />);

    const button = screen.getByRole('button', { name: /send/i });
    expect(button).toBeDisabled();

    await user.type(screen.getByRole('textbox', { name: /message/i }), 'Hello');
    expect(button).toBeEnabled();
  });

  it('keeps the button disabled for whitespace-only input', async () => {
    const user = userEvent.setup();
    renderWithClient(<Footer />);

    await user.type(screen.getByRole('textbox', { name: /message/i }), '   ');
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
  });

  it('sends the trimmed message as the current user and clears the input', async () => {
    const user = userEvent.setup();
    renderWithClient(<Footer />);

    const input = screen.getByRole('textbox', { name: /message/i });
    await user.type(input, '  Hello world  ');
    await user.click(screen.getByRole('button', { name: /send/i }));

    // React Query passes a context object as a second arg, so assert on the payload only.
    expect(mockedCreate).toHaveBeenCalledTimes(1);
    expect(mockedCreate.mock.calls[0][0]).toEqual({
      message: 'Hello world',
      author: CURRENT_USER,
    });
    await waitFor(() => expect(input).toHaveValue(''));
  });

  it('shows a pending state and disables input while sending', async () => {
    let resolveSend: (value: IMessage) => void = () => {};
    mockedCreate.mockReturnValue(
      new Promise<IMessage>((resolve) => {
        resolveSend = resolve;
      }),
    );

    const user = userEvent.setup();
    renderWithClient(<Footer />);

    const input = screen.getByRole('textbox', { name: /message/i });
    await user.type(input, 'Hello');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(screen.getByRole('button', { name: /sending/i })).toBeInTheDocument();
    expect(input).toBeDisabled();

    resolveSend(sentMessage('Hello'));
    await waitFor(() => expect(input).toBeEnabled());
  });
});
