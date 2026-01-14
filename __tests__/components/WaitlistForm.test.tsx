import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WaitlistForm from '@/components/WaitlistForm';

// Mock fetch globally
global.fetch = vi.fn();

describe('WaitlistForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render form fields', () => {
    render(<WaitlistForm />);
    
    expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Your company (optional)')).toBeInTheDocument();
    expect(screen.getByText('Join Waitlist')).toBeInTheDocument();
  });

  it('should show error for invalid email', async () => {
    // Mock API error response
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid email address' }),
    });

    render(<WaitlistForm />);
    
    const emailInput = screen.getByPlaceholderText('you@company.com');
    const submitButton = screen.getByText('Join Waitlist');

    fireEvent.change(emailInput, { target: { value: 'invalid' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Invalid email/i)).toBeInTheDocument();
    });
  });

  it('should show success message after successful submission', async () => {
    // Mock successful API response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: 'Successfully joined!' }),
    });

    render(<WaitlistForm />);
    
    const nameInput = screen.getByPlaceholderText('Your name');
    const emailInput = screen.getByPlaceholderText('you@company.com');
    const submitButton = screen.getByText('Join Waitlist');

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/on the list/i)).toBeInTheDocument();
    });
  });

  it('should show error message on API failure', async () => {
    // Mock failed API response
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'This email is already on the waitlist!' }),
    });

    render(<WaitlistForm />);
    
    const emailInput = screen.getByPlaceholderText('you@company.com');
    const submitButton = screen.getByText('Join Waitlist');

    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('This email is already on the waitlist!')).toBeInTheDocument();
    });
  });

  it('should disable submit button while loading', async () => {
    // Mock delayed API response
    (global.fetch as any).mockImplementationOnce(() =>
      new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              ok: true,
              json: async () => ({ success: true }),
            }),
          100
        )
      )
    );

    render(<WaitlistForm />);
    
    const emailInput = screen.getByPlaceholderText('you@company.com');
    const submitButton = screen.getByText('Join Waitlist');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    // Button should be disabled during submission
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText(/on the list/i)).toBeInTheDocument();
    });
  });

  it('should handle network errors gracefully', async () => {
    // Mock network error
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<WaitlistForm />);
    
    const emailInput = screen.getByPlaceholderText('you@company.com');
    const submitButton = screen.getByText('Join Waitlist');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Should show a generic error message
      const errorElement = screen.queryByText(/failed|error|try again/i);
      expect(errorElement).toBeInTheDocument();
    });
  });

  it('should allow optional fields to be empty', async () => {
    // Mock successful API response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<WaitlistForm />);
    
    const emailInput = screen.getByPlaceholderText('you@company.com');
    const submitButton = screen.getByText('Join Waitlist');

    // Only fill email, leave name and company empty
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/on the list/i)).toBeInTheDocument();
    });
  });
});
