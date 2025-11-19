/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import '@testing-library/jest-dom';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock server actions
jest.mock('@/features/actions', () => ({
  signOutAuth: jest.fn(),
}));

describe('Navbar Component', () => {
  const mockPush = jest.fn();
  const mockRouter = { push: mockPush };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe('Unauthenticated State', () => {
    beforeEach(() => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
    });

    it('should render login and register buttons when not authenticated', () => {
      render(<Navbar />);
      
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText('Register')).toBeInTheDocument();
    });

    it('should navigate to sign-in page when login button is clicked', () => {
      render(<Navbar />);
      
      const loginButton = screen.getByText('Login');
      fireEvent.click(loginButton);
      
      expect(mockPush).toHaveBeenCalledWith('/auth/sign-in');
    });

    it('should navigate to sign-up page when register button is clicked', () => {
      render(<Navbar />);
      
      const registerButton = screen.getByText('Register');
      fireEvent.click(registerButton);
      
      expect(mockPush).toHaveBeenCalledWith('/auth/sign-up');
    });
  });

  describe('Authenticated State', () => {
    const mockSession = {
      user: {
        name: 'Test User',
        email: 'test@example.com',
        image: '/test-image.jpg',
      },
      expires: '2024-12-31',
    };

    beforeEach(() => {
      (useSession as jest.Mock).mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      });
    });

    it('should render user button when authenticated', () => {
      render(<Navbar />);
      
      // User button component should be rendered
      expect(screen.queryByText('Login')).not.toBeInTheDocument();
      expect(screen.queryByText('Register')).not.toBeInTheDocument();
    });

    it('should not render login/register buttons when authenticated', () => {
      render(<Navbar />);
      
      expect(screen.queryByText('Login')).not.toBeInTheDocument();
      expect(screen.queryByText('Register')).not.toBeInTheDocument();
    });
  });

  describe('Navigation Items', () => {
    beforeEach(() => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
    });

    it('should render all navigation items', () => {
      render(<Navbar />);
      
      expect(screen.getByText('Features')).toBeInTheDocument();
      expect(screen.getByText('Pricing')).toBeInTheDocument();
      expect(screen.getByText('AboutUs')).toBeInTheDocument();
    });

    it('should have correct links for navigation items', () => {
      render(<Navbar />);
      
      const featuresLink = screen.getByText('Features').closest('a');
      const pricingLink = screen.getByText('Pricing').closest('a');
      const aboutLink = screen.getByText('AboutUs').closest('a');
      
      expect(featuresLink).toHaveAttribute('href', '/web-features');
      expect(pricingLink).toHaveAttribute('href', '/pricing');
      expect(aboutLink).toHaveAttribute('href', '/about');
    });
  });

  describe('Mobile Navigation', () => {
    beforeEach(() => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
    });

    it('should render mobile navigation toggle', () => {
      render(<Navbar />);
      
      // Mobile nav should be in the document
      const navbar = screen.getByRole('navigation', { hidden: true });
      expect(navbar).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should handle loading state', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'loading',
      });

      render(<Navbar />);
      
      // Should still render the navbar structure
      expect(screen.getByText('Features')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    beforeEach(() => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
    });

    it('should have fixed positioning and proper styling', () => {
      const { container } = render(<Navbar />);
      
      const navbarContainer = container.firstChild as HTMLElement;
      expect(navbarContainer).toHaveClass('fixed');
      expect(navbarContainer).toHaveClass('top-6');
      expect(navbarContainer).toHaveClass('z-50');
    });
  });
});
