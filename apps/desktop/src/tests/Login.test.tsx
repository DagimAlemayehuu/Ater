import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '../routes/login';
import { AuthProvider } from '../context/auth-context';
import { ConfigProvider } from '../lib/ConfigContext';
import { BrowserRouter } from 'react-router-dom';

describe('Login Component', () => {
  it('renders login credentials form fields', () => {
    const { container } = render(
      <BrowserRouter>
        <ConfigProvider>
          <AuthProvider>
            <Login />
          </AuthProvider>
        </ConfigProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Ater/i)).toBeInTheDocument();
    expect(screen.getByText(/Enter your credentials to activate/i)).toBeInTheDocument();
    expect(container.querySelector('input[type="email"]')).toBeInTheDocument();
    expect(container.querySelector('input[type="password"]')).toBeInTheDocument();
    expect(container.querySelector('input[type="text"]')).toBeInTheDocument();
  });

  it('shows activation errors when values do not meet constraints', async () => {
    const { container } = render(
      <BrowserRouter>
        <ConfigProvider>
          <AuthProvider>
            <Login />
          </AuthProvider>
        </ConfigProvider>
      </BrowserRouter>
    );

    const emailInput = container.querySelector('input[type="email"]') as HTMLInputElement;
    const passwordInput = container.querySelector('input[type="password"]') as HTMLInputElement;
    const codeInput = container.querySelector('input[type="text"]') as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /Activate/i });

    // Submit invalid password
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: '12' } }); // < 4 chars
    fireEvent.change(codeInput, { target: { value: 'ABCDEF' } });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Verification Failure/i)).toBeInTheDocument();
      expect(screen.getByText(/Password must be at least 4 characters long/i)).toBeInTheDocument();
    });
  });
});
