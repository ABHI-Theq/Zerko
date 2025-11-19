/**
 * API Route Test: /api/sign-up
 * Tests user registration endpoint
 */
import { POST } from '@/app/api/sign-up/route';
import prisma from '@/lib/prisma';
import { saltAndHashPassword } from '@/util/password';
import { NextRequest } from 'next/server';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Mock password utility
jest.mock('@/util/password', () => ({
  saltAndHashPassword: jest.fn(),
}));

describe('POST /api/sign-up', () => {
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashedPassword123',
    image: '/user.png',
    emailVerified: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Registration', () => {
    it('should create a new user with valid data', async () => {
      const requestBody = {
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (saltAndHashPassword as jest.Mock).mockResolvedValue('hashedPassword123');
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/sign-up', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
      });
      expect(saltAndHashPassword).toHaveBeenCalledWith('password123');
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'hashedPassword123',
          image: '/user.png',
        },
      });
      expect(data.status).toBe(201);
      expect(data.user).toEqual(mockUser);
    });

    it('should hash the password before storing', async () => {
      const requestBody = {
        firstname: 'Jane',
        lastname: 'Smith',
        email: 'jane@example.com',
        password: 'plainPassword',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (saltAndHashPassword as jest.Mock).mockResolvedValue('hashedPassword456');
      (prisma.user.create as jest.Mock).mockResolvedValue({
        ...mockUser,
        email: 'jane@example.com',
        password: 'hashedPassword456',
      });

      const request = new NextRequest('http://localhost:3000/api/sign-up', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      await POST(request);

      expect(saltAndHashPassword).toHaveBeenCalledWith('plainPassword');
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: 'hashedPassword456',
          }),
        })
      );
    });

    it('should set default user image', async () => {
      const requestBody = {
        firstname: 'Test',
        lastname: 'User',
        email: 'test@example.com',
        password: 'password123',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (saltAndHashPassword as jest.Mock).mockResolvedValue('hashedPassword');
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/sign-up', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      await POST(request);

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            image: '/user.png',
          }),
        })
      );
    });
  });

  describe('Validation and Error Handling', () => {
    it('should return error if user already exists', async () => {
      const requestBody = {
        firstname: 'John',
        lastname: 'Doe',
        email: 'existing@example.com',
        password: 'password123',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/sign-up', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.error).toBe('User already exists');
      expect(data.status).toBe(400);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const requestBody = {
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (saltAndHashPassword as jest.Mock).mockResolvedValue('hashedPassword');
      (prisma.user.create as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest('http://localhost:3000/api/sign-up', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.error).toBe('Database connection failed');
      expect(data.status).toBe(500);
    });

    it('should handle password hashing errors', async () => {
      const requestBody = {
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (saltAndHashPassword as jest.Mock).mockRejectedValue(
        new Error('Hashing failed')
      );

      const request = new NextRequest('http://localhost:3000/api/sign-up', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.error).toBe('Hashing failed');
      expect(data.status).toBe(500);
    });

    it('should handle generic errors', async () => {
      const requestBody = {
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      (prisma.user.findUnique as jest.Mock).mockRejectedValue('Unknown error');

      const request = new NextRequest('http://localhost:3000/api/sign-up', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.error).toBe('error occurred while signing up');
      expect(data.status).toBe(500);
    });
  });

  describe('Request Body Parsing', () => {
    it('should correctly parse request body', async () => {
      const requestBody = {
        firstname: 'Alice',
        lastname: 'Wonder',
        email: 'alice@example.com',
        password: 'secure123',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (saltAndHashPassword as jest.Mock).mockResolvedValue('hashed');
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/sign-up', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      await POST(request);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: 'Alice Wonder',
          email: 'alice@example.com',
          password: 'hashed',
          image: '/user.png',
        },
      });
    });

    it('should combine firstname and lastname correctly', async () => {
      const requestBody = {
        firstname: 'Multi',
        lastname: 'Word Name',
        email: 'test@example.com',
        password: 'password',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (saltAndHashPassword as jest.Mock).mockResolvedValue('hashed');
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/sign-up', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      await POST(request);

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Multi Word Name',
          }),
        })
      );
    });
  });
});
