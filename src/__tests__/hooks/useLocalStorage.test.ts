/**
 * Custom Hook Test: useLocalStorage
 * Tests for localStorage hook functionality
 */
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

describe('useLocalStorage Hook', () => {
  const TEST_KEY = 'test-key';
  const TEST_VALUE = 'test-value';

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Initialization', () => {
    it('should return initial value when localStorage is empty', () => {
      const { result } = renderHook(() => useLocalStorage(TEST_KEY, TEST_VALUE));
      
      const [storedValue] = result.current;
      expect(storedValue).toBe(TEST_VALUE);
    });

    it('should return stored value from localStorage if it exists', () => {
      const existingValue = 'existing-value';
      localStorage.setItem(TEST_KEY, JSON.stringify(existingValue));

      const { result } = renderHook(() => useLocalStorage(TEST_KEY, TEST_VALUE));
      
      const [storedValue] = result.current;
      expect(storedValue).toBe(existingValue);
    });

    it('should handle complex objects as initial value', () => {
      const complexObject = {
        name: 'John',
        age: 30,
        hobbies: ['reading', 'coding'],
      };

      const { result } = renderHook(() => useLocalStorage(TEST_KEY, complexObject));
      
      const [storedValue] = result.current;
      expect(storedValue).toEqual(complexObject);
    });

    it('should handle arrays as initial value', () => {
      const arrayValue = [1, 2, 3, 4, 5];

      const { result } = renderHook(() => useLocalStorage(TEST_KEY, arrayValue));
      
      const [storedValue] = result.current;
      expect(storedValue).toEqual(arrayValue);
    });

    it('should handle null as initial value', () => {
      const { result } = renderHook(() => useLocalStorage(TEST_KEY, null));
      
      const [storedValue] = result.current;
      expect(storedValue).toBeNull();
    });

    it('should handle boolean as initial value', () => {
      const { result } = renderHook(() => useLocalStorage(TEST_KEY, true));
      
      const [storedValue] = result.current;
      expect(storedValue).toBe(true);
    });

    it('should handle number as initial value', () => {
      const { result } = renderHook(() => useLocalStorage(TEST_KEY, 42));
      
      const [storedValue] = result.current;
      expect(storedValue).toBe(42);
    });
  });

  describe('Updating Values', () => {
    it('should update localStorage when value changes', () => {
      const { result } = renderHook(() => useLocalStorage(TEST_KEY, TEST_VALUE));
      
      const newValue = 'new-value';
      act(() => {
        const [, setValue] = result.current;
        setValue(newValue);
      });

      const [storedValue] = result.current;
      expect(storedValue).toBe(newValue);
      expect(localStorage.getItem(TEST_KEY)).toBe(JSON.stringify(newValue));
    });

    it('should update with object values', () => {
      const initialObject = { count: 0 };
      const { result } = renderHook(() => useLocalStorage(TEST_KEY, initialObject));
      
      const updatedObject = { count: 5 };
      act(() => {
        const [, setValue] = result.current;
        setValue(updatedObject);
      });

      const [storedValue] = result.current;
      expect(storedValue).toEqual(updatedObject);
      expect(JSON.parse(localStorage.getItem(TEST_KEY)!)).toEqual(updatedObject);
    });

    it('should update with array values', () => {
      const { result } = renderHook(() => useLocalStorage(TEST_KEY, [1, 2, 3]));
      
      const newArray = [4, 5, 6];
      act(() => {
        const [, setValue] = result.current;
        setValue(newArray);
      });

      const [storedValue] = result.current;
      expect(storedValue).toEqual(newArray);
    });

    it('should handle multiple updates', () => {
      const { result } = renderHook(() => useLocalStorage(TEST_KEY, 0));
      
      act(() => {
        const [, setValue] = result.current;
        setValue(1);
      });
      expect(result.current[0]).toBe(1);

      act(() => {
        const [, setValue] = result.current;
        setValue(2);
      });
      expect(result.current[0]).toBe(2);

      act(() => {
        const [, setValue] = result.current;
        setValue(3);
      });
      expect(result.current[0]).toBe(3);
    });

    it('should update to null', () => {
      const { result } = renderHook(() => useLocalStorage(TEST_KEY, 'value'));
      
      act(() => {
        const [, setValue] = result.current;
        setValue(null);
      });

      const [storedValue] = result.current;
      expect(storedValue).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should return initial value if localStorage.getItem throws error', () => {
      const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
      getItemSpy.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const { result } = renderHook(() => useLocalStorage(TEST_KEY, TEST_VALUE));
      
      const [storedValue] = result.current;
      expect(storedValue).toBe(TEST_VALUE);

      getItemSpy.mockRestore();
    });

    it('should handle invalid JSON in localStorage', () => {
      localStorage.setItem(TEST_KEY, 'invalid-json{');

      const { result } = renderHook(() => useLocalStorage(TEST_KEY, TEST_VALUE));
      
      const [storedValue] = result.current;
      expect(storedValue).toBe(TEST_VALUE);
    });

    it('should handle localStorage.setItem errors gracefully', () => {
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
      setItemSpy.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const { result } = renderHook(() => useLocalStorage(TEST_KEY, TEST_VALUE));
      
      // Should not throw error
      act(() => {
        const [, setValue] = result.current;
        setValue('new-value');
      });

      setItemSpy.mockRestore();
    });
  });

  describe('Persistence', () => {
    it('should persist value across hook re-renders', () => {
      const { result, rerender } = renderHook(() => useLocalStorage(TEST_KEY, TEST_VALUE));
      
      act(() => {
        const [, setValue] = result.current;
        setValue('persisted-value');
      });

      rerender();

      const [storedValue] = result.current;
      expect(storedValue).toBe('persisted-value');
    });

    it('should persist value across hook unmount and remount', () => {
      const { result, unmount } = renderHook(() => useLocalStorage(TEST_KEY, TEST_VALUE));
      
      act(() => {
        const [, setValue] = result.current;
        setValue('persisted-value');
      });

      unmount();

      const { result: newResult } = renderHook(() => useLocalStorage(TEST_KEY, TEST_VALUE));
      const [storedValue] = newResult.current;
      expect(storedValue).toBe('persisted-value');
    });
  });

  describe('Multiple Instances', () => {
    it('should sync between multiple hook instances with same key', () => {
      const { result: result1 } = renderHook(() => useLocalStorage(TEST_KEY, TEST_VALUE));
      const { result: result2 } = renderHook(() => useLocalStorage(TEST_KEY, TEST_VALUE));
      
      act(() => {
        const [, setValue] = result1.current;
        setValue('synced-value');
      });

      // Both instances should have access to the same localStorage value
      expect(localStorage.getItem(TEST_KEY)).toBe(JSON.stringify('synced-value'));
    });

    it('should maintain separate values for different keys', () => {
      const key1 = 'key-1';
      const key2 = 'key-2';
      
      const { result: result1 } = renderHook(() => useLocalStorage(key1, 'value-1'));
      const { result: result2 } = renderHook(() => useLocalStorage(key2, 'value-2'));
      
      act(() => {
        const [, setValue1] = result1.current;
        setValue1('updated-1');
      });

      act(() => {
        const [, setValue2] = result2.current;
        setValue2('updated-2');
      });

      expect(result1.current[0]).toBe('updated-1');
      expect(result2.current[0]).toBe('updated-2');
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety with string', () => {
      const { result } = renderHook(() => useLocalStorage<string>(TEST_KEY, 'string'));
      
      const [value] = result.current;
      expect(typeof value).toBe('string');
    });

    it('should maintain type safety with number', () => {
      const { result } = renderHook(() => useLocalStorage<number>(TEST_KEY, 42));
      
      const [value] = result.current;
      expect(typeof value).toBe('number');
    });

    it('should maintain type safety with object', () => {
      interface User {
        name: string;
        age: number;
      }
      
      const initialUser: User = { name: 'John', age: 30 };
      const { result } = renderHook(() => useLocalStorage<User>(TEST_KEY, initialUser));
      
      const [value] = result.current;
      expect(value).toHaveProperty('name');
      expect(value).toHaveProperty('age');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string as key', () => {
      const { result } = renderHook(() => useLocalStorage('', TEST_VALUE));
      
      const [storedValue] = result.current;
      expect(storedValue).toBe(TEST_VALUE);
    });

    it('should handle very long keys', () => {
      const longKey = 'a'.repeat(1000);
      const { result } = renderHook(() => useLocalStorage(longKey, TEST_VALUE));
      
      const [storedValue] = result.current;
      expect(storedValue).toBe(TEST_VALUE);
    });

    it('should handle special characters in key', () => {
      const specialKey = 'key-with-!@#$%^&*()';
      const { result } = renderHook(() => useLocalStorage(specialKey, TEST_VALUE));
      
      const [storedValue] = result.current;
      expect(storedValue).toBe(TEST_VALUE);
    });

    it('should handle undefined as value', () => {
      const { result } = renderHook(() => useLocalStorage(TEST_KEY, undefined));
      
      const [storedValue] = result.current;
      expect(storedValue).toBeUndefined();
    });
  });
});
