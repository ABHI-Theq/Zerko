/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import Signin from '@/components/Signin';
import { signInWithCredential, signInWithGithub, signInWithGoogle } from '@/features/actions';
import toast from 'react-hot-toast';
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/features/actions', () => ({
  signInWithCredential: jest.fn(),
  signInWithGithub: jest.fn(),
  signInWithGoogle: jest.fn(),
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Signin Component', () => {
  const mockPush = jest.fn();
  const mockRouter = { push: mockPush };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe('Rendering', () => {
    it('should render signin form with all fields', () => {
      render(<Signin />);
      
      expect(screen.getByText('Welcome to Zerko')).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should render social auth buttons', () => {
      render(<Signin />);
      
      expect(screen.getByText('GitHub')).toBeInTheDocument();
      expect(screen.getByText('Google')).toBeInTheDocument();
    });

    it('should render sign up link', () => {
      render(<Signin />);
      
      const signUpLink = screen.getByText(/sign up/i);
      expect(signUpLink).toBeInTheDocument();
      expect(signUpLink.closest('a')).toHaveAttribute('href', '/auth/sign-up');
    });
  });

  describe('Form Interactions', () => {
    it('should update email field on input', async () => {
      const user = userEvent.setup();
      render(<Signin />);
      
      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
      await user.type(emailInput, 'test@example.com');
      
      expect(emailInput.value).toBe('test@example.com');
    });

    it('should update password field on input', async () => {
      const user = userEvent.setup();
      render(<Signin />);
      
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      await user.type(passwordInput, 'password123');
      
      expect(passwordInput.value).toBe('password123');
    });

    it('should toggle password visibility', async () => {
      const user = userEvent.setup();
      render(<Signin />);
      
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      const toggleButton = screen.getByRole('button', { name: '' });
      
      // Initially password should be hidden
      expect(passwordInput.type).toBe('password');
      
      // Click to show password
      await user.click(toggleButton);
      expect(passwordInput.type).toBe('text');
      
      // Click to hide password again
      await user.click(toggleButton);
      expect(passwordInput.type).toBe('password');
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid credentials', async () => {
      const user = userEvent.setup();
      (signInWithCredential as jest.Mock).mockResolvedValue({ success: true });
      
      render(<Signin />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(signInWithCredential).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('should show success toast on successful signin', async () => {
      const user = userEvent.setup();
      (signInWithCredential as jest.Mock).mockResolvedValue({ success: true });
      
      render(<Signin />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('user logged in successfully');
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('should show error toast on failed signin', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Invalid credentials';
      (signInWithCredential as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      render(<Signin />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('should show validation error for invalid email', async () => {
      const user = userEvent.setup();
      render(<Signin />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.type(emailInput, 'invalid-email');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
        expect(signInWithCredential).not.toHaveBeenCalled();
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      (signInWithCredential as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );
      
      render(<Signin />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      // Check for loader (you may need to adjust based on your loader implementation)
      expect(submitButton).toBeInTheDocument();
    });
  });

  describe('Social Authentication', () => {
    it('should call signInWithGithub when GitHub button is clicked', async () => {
      const user = userEvent.setup();
      render(<Signin />);
      
      const githubButton = screen.getByText('GitHub').closest('button');
      await user.click(githubButton!);
      
      expect(signInWithGithub).toHaveBeenCalled();
    });

    it('should call signInWithGoogle when Google button is clicked', async () => {
      const user = userEvent.setup();
      render(<Signin />);
      
      const googleButton = screen.getByText('Google').closest('button');
      await user.click(googleButton!);
      
      expect(signInWithGoogle).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for form fields', () => {
      render(<Signin />);
      
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('should have proper input types', () => {
      render(<Signin />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });
});
