import { ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combines class names using clsx and tailwind-merge
 * @param inputs - Class names to combine
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date string
 * @param date - Date to format
 * @param options - Intl.DateTimeFormatOptions
 */
export function formatDate(date: Date, options: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  }).format(date)
}

/**
 * Validates an email address
 * @param email - Email to validate
 */
export function isValidEmail(email: string): boolean {
  // Email validation supporting:
  // - Plus signs in local part (user+tag@example.com)
  // - Single character TLDs (a@b.c)
  // - No leading/trailing dots
  // - No spaces anywhere
  const regex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{1,}$/
  
  // Additional checks
  if (!regex.test(email)) return false
  if (email.startsWith('.') || email.includes('..')) return false
  if (email.includes('@.') || email.includes('.@')) return false
  
  const [localPart] = email.split('@')
  if (localPart.endsWith('.')) return false
  
  return true
}

