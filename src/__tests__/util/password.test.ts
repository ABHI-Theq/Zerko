/**
 * Password Utility Tests
 * Tests for password hashing functionality
 */
import { saltAndHashPassword } from '@/util/password';
import bcrypt from 'bcryptjs';

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  genSalt: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('Password Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saltAndHashPassword', () => {
    it('should generate salt with correct rounds', async () => {
      const mockSalt = 'mockSalt123';
      const mockHash = 'mockHashedPassword';
      
      (bcrypt.genSalt as jest.Mock).mockResolvedValue(mockSalt);
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      await saltAndHashPassword('password123');

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
    });

    it('should hash password with generated salt', async () => {
      const mockSalt = 'mockSalt123';
      const mockHash = 'mockHashedPassword';
      const password = 'mySecurePassword';
      
      (bcrypt.genSalt as jest.Mock).mockResolvedValue(mockSalt);
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      await saltAndHashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, mockSalt);
    });

    it('should return hashed password', async () => {
      const mockSalt = 'mockSalt123';
      const mockHash = 'mockHashedPassword';
      
      (bcrypt.genSalt as jest.Mock).mockResolvedValue(mockSalt);
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      const result = await saltAndHashPassword('password123');

      expect(result).toBe(mockHash);
    });

    it('should handle different passwords', async () => {
      const passwords = ['password1', 'password2', 'password3'];
      const mockSalt = 'mockSalt';
      
      (bcrypt.genSalt as jest.Mock).mockResolvedValue(mockSalt);
      
      for (let i = 0; i < passwords.length; i++) {
        const mockHash = `hash${i}`;
        (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);
        
        const result = await saltAndHashPassword(passwords[i]);
        
        expect(bcrypt.hash).toHaveBeenCalledWith(passwords[i], mockSalt);
        expect(result).toBe(mockHash);
      }
    });

    it('should handle empty password', async () => {
      const mockSalt = 'mockSalt';
      const mockHash = 'emptyHash';
      
      (bcrypt.genSalt as jest.Mock).mockResolvedValue(mockSalt);
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      const result = await saltAndHashPassword('');

      expect(bcrypt.hash).toHaveBeenCalledWith('', mockSalt);
      expect(result).toBe(mockHash);
    });

    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(1000);
      const mockSalt = 'mockSalt';
      const mockHash = 'longHash';
      
      (bcrypt.genSalt as jest.Mock).mockResolvedValue(mockSalt);
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      const result = await saltAndHashPassword(longPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith(longPassword, mockSalt);
      expect(result).toBe(mockHash);
    });

    it('should handle special characters in password', async () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const mockSalt = 'mockSalt';
      const mockHash = 'specialHash';
      
      (bcrypt.genSalt as jest.Mock).mockResolvedValue(mockSalt);
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      const result = await saltAndHashPassword(specialPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith(specialPassword, mockSalt);
      expect(result).toBe(mockHash);
    });

    it('should handle unicode characters in password', async () => {
      const unicodePassword = '密码🔐';
      const mockSalt = 'mockSalt';
      const mockHash = 'unicodeHash';
      
      (bcrypt.genSalt as jest.Mock).mockResolvedValue(mockSalt);
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      const result = await saltAndHashPassword(unicodePassword);

      expect(bcrypt.hash).toHaveBeenCalledWith(unicodePassword, mockSalt);
      expect(result).toBe(mockHash);
    });

    it('should throw error if salt generation fails', async () => {
      (bcrypt.genSalt as jest.Mock).mockRejectedValue(new Error('Salt generation failed'));

      await expect(saltAndHashPassword('password123')).rejects.toThrow('Salt generation failed');
    });

    it('should throw error if hashing fails', async () => {
      const mockSalt = 'mockSalt';
      
      (bcrypt.genSalt as jest.Mock).mockResolvedValue(mockSalt);
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hashing failed'));

      await expect(saltAndHashPassword('password123')).rejects.toThrow('Hashing failed');
    });

    it('should generate different hashes for same password (due to different salts)', async () => {
      const password = 'samePassword';
      
      // First call
      (bcrypt.genSalt as jest.Mock).mockResolvedValueOnce('salt1');
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hash1');
      const result1 = await saltAndHashPassword(password);
      
      // Second call
      (bcrypt.genSalt as jest.Mock).mockResolvedValueOnce('salt2');
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hash2');
      const result2 = await saltAndHashPassword(password);

      expect(result1).not.toBe(result2);
    });
  });
});
