import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { api } from '../api/client';
import { AiAssistantPage } from '../pages/AiAssistantPage';

describe('protected navigation', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, '', '/tasks');
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('redirects unauthenticated users to login', async () => {
    render(<App />);

    const loginHeading = await screen.findByRole('heading', { name: 'Welcome Back' });
    expect(loginHeading).toBeTruthy();
  });

  it('sends on Enter, preserves Shift+Enter, disables repeat sends, and clears chat', async () => {
    let resolveRequest!: (value: any) => void;
    const sendMessage = vi.spyOn(api, 'sendChatMessage').mockImplementation(() => new Promise((resolve) => {
      resolveRequest = resolve;
    }));
    render(<AiAssistantPage />);

    const input = screen.getByRole('textbox', { name: 'Message the TimeWeave assistant' });
    fireEvent.change(input, { target: { value: 'Which task should I prioritize?' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
    expect(sendMessage).not.toHaveBeenCalled();

    fireEvent.keyDown(input, { key: 'Enter' });
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect((screen.getByRole('button', { name: 'Send message' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByLabelText('Assistant response is loading')).toBeTruthy();

    await act(async () => resolveRequest({ success: true, reply: 'You have one task due today.', actions: [] }));
    expect(await screen.findByText('You have one task due today.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Clear chat' }));
    expect(screen.queryByText('You have one task due today.')).toBeNull();
  });

  it('shows an error instead of fabricating an assistant answer when the API fails', async () => {
    vi.spyOn(api, 'sendChatMessage').mockRejectedValue(new Error('offline'));
    render(<AiAssistantPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Which tasks are overdue?' }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent?.includes('The assistant could not reach your task data.')).toBe(true);
    expect(screen.queryByText(/You currently have \d+ pending tasks/)).toBeNull();
  });

  it('ignores repeated quick-prompt clicks while a request is pending', () => {
    const sendMessage = vi.spyOn(api, 'sendChatMessage').mockImplementation(() => new Promise(() => {}));
    render(<AiAssistantPage />);

    const prompt = screen.getByRole('button', { name: 'Which tasks are overdue?' });
    fireEvent.click(prompt);
    fireEvent.click(prompt);

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect((prompt as HTMLButtonElement).disabled).toBe(true);
  });

  it('applies a generated schedule through the existing schedule APIs', async () => {
    vi.spyOn(api, 'sendChatMessage').mockResolvedValue({
      success: true,
      reply: 'Schedule preview for today.',
      actions: [{ label: 'Apply this schedule', action: 'apply_schedule' }]
    });
    const generateSchedule = vi.spyOn(api, 'generateSchedule').mockResolvedValue({ schedule_version_id: 'draft-123' } as any);
    const acceptSchedule = vi.spyOn(api, 'acceptSchedule').mockResolvedValue({} as any);
    render(<AiAssistantPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Generate a schedule for today.' }));
    await screen.findByText('Schedule preview for today.');
    fireEvent.click(screen.getByRole('button', { name: 'Apply this schedule' }));

    expect(await screen.findByText('Your reviewed schedule was applied and saved to your calendar.')).toBeTruthy();
    expect(generateSchedule).toHaveBeenCalledTimes(1);
    expect(acceptSchedule).toHaveBeenCalledWith('draft-123');
  });
});