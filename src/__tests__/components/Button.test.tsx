/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';
import '@testing-library/jest-dom';

describe('Button Component', () => {
  describe('Rendering', () => {
    it('should render button with text', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('should render button with children', () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      );
      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should apply default variant classes', () => {
      render(<Button>Default</Button>);
      const button = screen.getByText('Default');
      expect(button).toHaveClass('bg-primary');
    });

    it('should apply destructive variant classes', () => {
      render(<Button variant="destructive">Delete</Button>);
      const button = screen.getByText('Delete');
      expect(button).toHaveClass('bg-destructive');
    });

    it('should apply outline variant classes', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByText('Outline');
      expect(button).toHaveClass('border');
    });

    it('should apply ghost variant classes', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByText('Ghost');
      expect(button).toHaveClass('hover:bg-accent');
    });
  });

  describe('Sizes', () => {
    it('should apply default size classes', () => {
      render(<Button>Default Size</Button>);
      const button = screen.getByText('Default Size');
      expect(button).toHaveClass('h-9');
    });

    it('should apply small size classes', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByText('Small');
      expect(button).toHaveClass('h-8');
    });

    it('should apply large size classes', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByText('Large');
      expect(button).toHaveClass('h-10');
    });

    it('should apply icon size classes', () => {
      render(<Button size="icon">🔍</Button>);
      const button = screen.getByText('🔍');
      expect(button).toHaveClass('size-9');
    });
  });

  describe('Interactions', () => {
    it('should handle click events', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByText('Click me');
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not trigger click when disabled', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick} disabled>Disabled</Button>);
      
      const button = screen.getByText('Disabled');
      fireEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should apply disabled styles', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByText('Disabled');
      expect(button).toHaveClass('disabled:opacity-50');
      expect(button).toBeDisabled();
    });
  });

  describe('Custom Props', () => {
    it('should accept custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByText('Custom');
      expect(button).toHaveClass('custom-class');
    });

    it('should accept type prop', () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByText('Submit');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should accept aria attributes', () => {
      render(<Button aria-label="Close dialog">X</Button>);
      const button = screen.getByLabelText('Close dialog');
      expect(button).toBeInTheDocument();
    });
  });

  describe('AsChild Prop', () => {
    it('should render as child component when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );
      const link = screen.getByText('Link Button');
      expect(link.tagName).toBe('A');
      expect(link).toHaveAttribute('href', '/test');
    });
  });
});
