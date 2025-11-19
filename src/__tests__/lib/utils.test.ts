/**
 * Utility Functions Tests
 * Tests for common utility functions
 */
import { cn, formatDate, isValidEmail } from '@/lib/utils';

describe('Utility Functions', () => {
  describe('cn (className merger)', () => {
    it('should merge class names correctly', () => {
      const result = cn('class1', 'class2');
      expect(result).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      const result = cn('base', true && 'conditional', false && 'hidden');
      expect(result).toBe('base conditional');
    });

    it('should merge Tailwind classes correctly', () => {
      const result = cn('px-2 py-1', 'px-4');
      // Should keep only px-4 due to tailwind-merge
      expect(result).toContain('px-4');
      expect(result).toContain('py-1');
    });

    it('should handle undefined and null values', () => {
      const result = cn('class1', undefined, null, 'class2');
      expect(result).toBe('class1 class2');
    });

    it('should handle arrays of classes', () => {
      const result = cn(['class1', 'class2'], 'class3');
      expect(result).toBe('class1 class2 class3');
    });

    it('should handle objects with boolean values', () => {
      const result = cn({
        'class1': true,
        'class2': false,
        'class3': true,
      });
      expect(result).toBe('class1 class3');
    });

    it('should return empty string for no arguments', () => {
      const result = cn();
      expect(result).toBe('');
    });
  });

  describe('formatDate', () => {
    const testDate = new Date('2024-01-15T12:00:00Z');

    it('should format date with default options', () => {
      const result = formatDate(testDate);
      expect(result).toMatch(/January 15, 2024/);
    });

    it('should format date with custom options', () => {
      const result = formatDate(testDate, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      expect(result).toMatch(/01\/15\/2024/);
    });

    it('should format date with short month', () => {
      const result = formatDate(testDate, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      expect(result).toMatch(/Jan 15, 2024/);
    });

    it('should format date with weekday', () => {
      const result = formatDate(testDate, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      expect(result).toContain('2024');
    });

    it('should handle different dates correctly', () => {
      const date1 = new Date('2023-12-31');
      const date2 = new Date('2024-01-01');
      
      const result1 = formatDate(date1);
      const result2 = formatDate(date2);
      
      expect(result1).toContain('2023');
      expect(result2).toContain('2024');
    });

    it('should format current date', () => {
      const now = new Date();
      const result = formatDate(now);
      
      expect(result).toContain(now.getFullYear().toString());
    });
  });

  describe('isValidEmail', () => {
    describe('Valid Emails', () => {
      it('should validate standard email', () => {
        expect(isValidEmail('test@example.com')).toBe(true);
      });

      it('should validate email with subdomain', () => {
        expect(isValidEmail('user@mail.example.com')).toBe(true);
      });

      it('should validate email with plus sign', () => {
        expect(isValidEmail('user+tag@example.com')).toBe(true);
      });

      it('should validate email with numbers', () => {
        expect(isValidEmail('user123@example456.com')).toBe(true);
      });

      it('should validate email with dots', () => {
        expect(isValidEmail('first.last@example.com')).toBe(true);
      });

      it('should validate email with hyphens', () => {
        expect(isValidEmail('user-name@example-domain.com')).toBe(true);
      });

      it('should validate email with underscores', () => {
        expect(isValidEmail('user_name@example.com')).toBe(true);
      });
    });

    describe('Invalid Emails', () => {
      it('should reject email without @', () => {
        expect(isValidEmail('testexample.com')).toBe(false);
      });

      it('should reject email without domain', () => {
        expect(isValidEmail('test@')).toBe(false);
      });

      it('should reject email without local part', () => {
        expect(isValidEmail('@example.com')).toBe(false);
      });

      it('should reject email without TLD', () => {
        expect(isValidEmail('test@example')).toBe(false);
      });

      it('should reject email with spaces', () => {
        expect(isValidEmail('test @example.com')).toBe(false);
        expect(isValidEmail('test@ example.com')).toBe(false);
      });

      it('should reject email with multiple @', () => {
        expect(isValidEmail('test@@example.com')).toBe(false);
        expect(isValidEmail('test@test@example.com')).toBe(false);
      });

      it('should reject empty string', () => {
        expect(isValidEmail('')).toBe(false);
      });

      it('should reject email with only spaces', () => {
        expect(isValidEmail('   ')).toBe(false);
      });

      it('should reject email starting with dot', () => {
        expect(isValidEmail('.test@example.com')).toBe(false);
      });

      it('should reject email ending with dot', () => {
        expect(isValidEmail('test.@example.com')).toBe(false);
      });
    });

    describe('Edge Cases', () => {
      it('should handle very long email', () => {
        const longEmail = 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com';
        expect(isValidEmail(longEmail)).toBe(true);
      });

      it('should handle minimum valid email', () => {
        expect(isValidEmail('a@b.c')).toBe(true);
      });

      it('should reject special characters in wrong places', () => {
        expect(isValidEmail('test!@example.com')).toBe(false);
        expect(isValidEmail('test@exam ple.com')).toBe(false);
      });
    });
  });
});
