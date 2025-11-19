# Testing Guide - Zerko Interview Platform

## 📋 Overview

This guide provides comprehensive information about testing in the Zerko project. We use Jest with React Testing Library to ensure code quality and reliability across all components, API routes, utilities, and hooks.

## 🎯 Testing Philosophy

- **Test user behavior, not implementation details**
- **Write tests that give confidence in refactoring**
- **Focus on accessibility and semantic queries**
- **Maintain high coverage for critical paths**
- **Keep tests simple, readable, and maintainable**

## 🚀 Quick Start

```bash
# Run all tests
pnpm test

# Run tests in watch mode (development)
pnpm test:watch

# Generate coverage report
pnpm test:coverage

# Run specific test file
pnpm test Button

# Run tests matching pattern
pnpm test components

# Update snapshots
pnpm test -- -u

# Verbose output
pnpm test -- --verbose

# Clear cache
pnpm test -- --clearCache
```

## 📊 Current Test Coverage

### Test Statistics
- **Total Test Files**: 7
- **Total Test Cases**: 137+
- **Lines of Test Code**: 1,390+
- **Coverage Target**: 70%+

### Coverage by Category

| Category | Files Tested | Test Cases | Coverage |
|----------|-------------|------------|----------|
| Components | 3 | 45+ | 80% |
| API Routes | 1 | 15+ | 30% |
| Utilities | 2 | 42+ | 80% |
| Hooks | 1 | 35+ | 40% |
| Features | 0 | 0 | 0% |

## 🧪 Test Structure

### Test File Organization

```
src/__tests__/
├── api/
│   └── sign-up.test.ts          # API route tests
├── components/
│   ├── Button.test.tsx          # UI component tests
│   ├── Navbar.test.tsx          # Navigation tests
│   └── Signin.test.tsx          # Form component tests
├── hooks/
│   └── useLocalStorage.test.ts  # Custom hook tests
├── lib/
│   └── utils.test.ts            # Utility function tests
├── util/
│   └── password.test.ts         # Password utility tests
└── README.md                    # Test suite documentation
```

### Test File Template

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentName } from '@/components/ComponentName';

describe('ComponentName', () => {
  describe('Rendering', () => {
    it('should render correctly', () => {
      render(<ComponentName />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should handle user interactions', async () => {
      const user = userEvent.setup();
      render(<ComponentName />);
      
      await user.click(screen.getByRole('button'));
      
      expect(screen.getByText('Success')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle errors gracefully', () => {
      render(<ComponentName error={true} />);
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });
});
```

## 🔧 Testing Tools & Configuration

### Core Testing Stack

```json
{
  "jest": "^29.7.0",
  "@testing-library/react": "^14.3.1",
  "@testing-library/jest-dom": "^6.9.1",
  "@testing-library/user-event": "^14.5.1",
  "jest-environment-jsdom": "^29.7.0",
  "node-mocks-http": "^1.17.2"
}
```

### Jest Configuration (`jest.config.js`)

```javascript
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
  ],
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
```

### Global Test Setup (`jest.setup.js`)

```javascript
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
```

## 📝 Writing Tests

### Component Testing Best Practices

#### 1. Use Semantic Queries

```typescript
// ✅ Good - Accessible queries
screen.getByRole('button', { name: /submit/i });
screen.getByLabelText('Email');
screen.getByText('Welcome');

// ❌ Bad - Implementation details
screen.getByClassName('btn-primary');
screen.getByTestId('submit-button');
```

#### 2. Test User Behavior

```typescript
// ✅ Good - Tests what user sees and does
it('should submit form when user clicks submit', async () => {
  const user = userEvent.setup();
  render(<LoginForm />);
  
  await user.type(screen.getByLabelText('Email'), 'test@example.com');
  await user.type(screen.getByLabelText('Password'), 'password123');
  await user.click(screen.getByRole('button', { name: /sign in/i }));
  
  expect(screen.getByText('Welcome back!')).toBeInTheDocument();
});

// ❌ Bad - Tests implementation
it('should call handleSubmit', () => {
  const handleSubmit = jest.fn();
  render(<LoginForm onSubmit={handleSubmit} />);
  // ...
});
```

#### 3. Handle Async Operations

```typescript
// ✅ Good - Proper async handling
it('should display data after loading', async () => {
  render(<DataComponent />);
  
  expect(screen.getByText('Loading...')).toBeInTheDocument();
  
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});

// Use findBy for async queries
const element = await screen.findByText('Async content');
```

#### 4. Mock External Dependencies

```typescript
// Mock API calls
jest.mock('@/lib/api', () => ({
  fetchData: jest.fn(() => Promise.resolve({ data: 'test' })),
}));

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));
```

### API Route Testing

```typescript
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/sign-up/route';

describe('POST /api/sign-up', () => {
  it('should create a new user', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(201);
    expect(JSON.parse(res._getData())).toEqual({
      success: true,
      message: 'User created successfully',
    });
  });

  it('should return 400 for invalid data', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { email: 'invalid' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
  });
});
```

### Hook Testing

```typescript
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with default value', () => {
    const { result } = renderHook(() => 
      useLocalStorage('key', 'default')
    );

    expect(result.current[0]).toBe('default');
  });

  it('should update value', () => {
    const { result } = renderHook(() => 
      useLocalStorage('key', 'initial')
    );

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(localStorage.getItem('key')).toBe('"updated"');
  });
});
```

### Utility Function Testing

```typescript
import { cn, formatDate, isValidEmail } from '@/lib/utils';

describe('Utils', () => {
  describe('cn (className merger)', () => {
    it('should merge class names', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15');
      expect(formatDate(date)).toBe('January 15, 2024');
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
    });
  });
});
```

## 🎨 Testing Patterns

### Pattern 1: Arrange-Act-Assert (AAA)

```typescript
it('should update user profile', async () => {
  // Arrange
  const user = userEvent.setup();
  const mockUpdate = jest.fn();
  render(<ProfileForm onUpdate={mockUpdate} />);

  // Act
  await user.type(screen.getByLabelText('Name'), 'John Doe');
  await user.click(screen.getByRole('button', { name: /save/i }));

  // Assert
  expect(mockUpdate).toHaveBeenCalledWith({ name: 'John Doe' });
});
```

### Pattern 2: Test Isolation

```typescript
describe('Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    // Cleanup after each test
    cleanup();
  });
});
```

### Pattern 3: Custom Render Function

```typescript
// test-utils.tsx
import { render } from '@testing-library/react';
import { ThemeProvider } from '@/lib/theme-provider';

export function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ThemeProvider>
      {ui}
    </ThemeProvider>
  );
}

// In tests
import { renderWithProviders } from '@/test-utils';

it('should render with theme', () => {
  renderWithProviders(<Component />);
});
```

## 🐛 Debugging Tests

### Enable Verbose Output

```bash
pnpm test -- --verbose
```

### Debug Specific Test

```typescript
import { screen, debug } from '@testing-library/react';

it('should debug component', () => {
  render(<Component />);
  
  // Print entire DOM
  debug();
  
  // Print specific element
  debug(screen.getByRole('button'));
});
```

### Use screen.logTestingPlaygroundURL()

```typescript
it('should help find queries', () => {
  render(<Component />);
  screen.logTestingPlaygroundURL();
  // Opens browser with query suggestions
});
```

### Run Single Test

```typescript
// Use .only to run single test
it.only('should run only this test', () => {
  // ...
});

// Or use .skip to skip test
it.skip('should skip this test', () => {
  // ...
});
```

## 📈 Coverage Reports

### Generate Coverage

```bash
pnpm test:coverage
```

### View Coverage Report

```bash
# Open HTML report
open coverage/lcov-report/index.html
```

### Coverage Thresholds

```javascript
coverageThresholds: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70,
  },
}
```

## 🔄 Continuous Integration

### Pre-commit Hook

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

pnpm test --passWithNoTests
```

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test:coverage
      - uses: codecov/codecov-action@v3
```

## 🎯 Testing Checklist

Before committing code, ensure:

- [ ] All tests pass (`pnpm test`)
- [ ] New features have tests
- [ ] Coverage meets thresholds
- [ ] No console errors or warnings
- [ ] Tests are descriptive and clear
- [ ] Mocks are properly cleaned up
- [ ] Async operations are handled
- [ ] Edge cases are covered

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [TESTING_QUICK_REFERENCE.md](./TESTING_QUICK_REFERENCE.md)
- [TESTING_SUMMARY.md](./TESTING_SUMMARY.md)

---

**Last Updated**: November 2025  
**Maintained By**: Zerko Development Team
