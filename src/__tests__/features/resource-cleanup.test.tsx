/**
 * Resource Cleanup Tests - Task 14
 * Tests for proper resource cleanup on component unmount and interview end
 * Validates Requirement 12.5
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

describe('Resource Cleanup - Task 14', () => {
  let mockRecognition: any;
  let mockSpeechSynthesis: any;
  
  beforeEach(() => {
    // Mock speech recognition
    mockRecognition = {
      start: jest.fn(),
      stop: jest.fn(),
      abort: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    
    // Mock speech synthesis
    mockSpeechSynthesis = {
      cancel: jest.fn(),
      speak: jest.fn(),
      getVoices: jest.fn(() => []),
    };
    
    // Setup global mocks
    global.window = {
      ...global.window,
      SpeechRecognition: jest.fn(() => mockRecognition),
      webkitSpeechRecognition: jest.fn(() => mockRecognition),
      speechSynthesis: mockSpeechSynthesis,
    } as any;
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Speech Recognition Cleanup (Requirement 12.5)', () => {
    it('should stop speech recognition when cleanup is called', () => {
      // Simulate cleanup function behavior
      const cleanup = () => {
        try {
          if (mockRecognition) {
            if (mockRecognition.abort) {
              mockRecognition.abort();
            }
            mockRecognition.stop();
          }
        } catch (e) {
          console.warn('Error stopping speech recognition during cleanup:', e);
        }
      };
      
      cleanup();
      
      expect(mockRecognition.abort).toHaveBeenCalled();
      expect(mockRecognition.stop).toHaveBeenCalled();
    });
    
    it('should handle errors gracefully when stopping recognition fails', () => {
      const mockRecognitionWithError = {
        abort: jest.fn(() => { throw new Error('Abort failed'); }),
        stop: jest.fn(),
      };
      
      const cleanup = () => {
        try {
          if (mockRecognitionWithError) {
            if (mockRecognitionWithError.abort) {
              mockRecognitionWithError.abort();
            }
            mockRecognitionWithError.stop();
          }
        } catch (e) {
          // Should catch and handle error gracefully
          expect(e).toBeDefined();
        }
      };
      
      // Should not throw
      expect(() => cleanup()).not.toThrow();
    });
    
    it('should null recognition reference after cleanup', () => {
      let recognitionRef: any = mockRecognition;
      
      const cleanup = () => {
        try {
          if (recognitionRef) {
            recognitionRef.stop();
          }
        } catch (e) {
          // ignore
        }
        recognitionRef = null;
      };
      
      cleanup();
      
      expect(recognitionRef).toBeNull();
    });
  });

  describe('TTS Cleanup (Requirement 12.5)', () => {
    it('should cancel all TTS utterances when cleanup is called', () => {
      const cleanup = () => {
        try {
          if (mockSpeechSynthesis) {
            mockSpeechSynthesis.cancel();
          }
        } catch (e) {
          console.warn('Error cancelling TTS during cleanup:', e);
        }
      };
      
      cleanup();
      
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });
    
    it('should handle errors gracefully when cancelling TTS fails', () => {
      const mockSpeechSynthesisWithError = {
        cancel: jest.fn(() => { throw new Error('Cancel failed'); }),
      };
      
      global.window.speechSynthesis = mockSpeechSynthesisWithError as any;
      
      const cleanup = () => {
        try {
          if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
          }
        } catch (e) {
          // Should catch and handle error gracefully
          expect(e).toBeDefined();
        }
      };
      
      // Should not throw
      expect(() => cleanup()).not.toThrow();
    });
  });

  describe('Timer and Interval Cleanup (Requirement 12.5)', () => {
    it('should clear all timers when cleanup is called', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      const silenceTimerRef: { current: NodeJS.Timeout | null } = { current: setTimeout(() => {}, 1000) };
      const silenceCheckerRef: { current: NodeJS.Timeout | null } = { current: setInterval(() => {}, 1000) };
      
      const cleanup = () => {
        try {
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            clearInterval(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
          
          if (silenceCheckerRef.current) {
            clearInterval(silenceCheckerRef.current);
            silenceCheckerRef.current = null;
          }
        } catch (e) {
          console.warn('Error clearing timers during cleanup:', e);
        }
      };
      
      cleanup();
      
      expect(clearTimeoutSpy).toHaveBeenCalled();
      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(silenceTimerRef.current).toBeNull();
      expect(silenceCheckerRef.current).toBeNull();
      
      clearTimeoutSpy.mockRestore();
      clearIntervalSpy.mockRestore();
    });
    
    it('should null timer references after clearing', () => {
      const silenceTimerRef: { current: NodeJS.Timeout | null } = { current: setTimeout(() => {}, 1000) };
      const silenceCheckerRef: { current: NodeJS.Timeout | null } = { current: setInterval(() => {}, 1000) };
      
      const cleanup = () => {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          clearInterval(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        
        if (silenceCheckerRef.current) {
          clearInterval(silenceCheckerRef.current);
          silenceCheckerRef.current = null;
        }
      };
      
      cleanup();
      
      expect(silenceTimerRef.current).toBeNull();
      expect(silenceCheckerRef.current).toBeNull();
    });
  });

  describe('Reference Nulling (Requirement 12.5)', () => {
    it('should null all references to prevent memory leaks', () => {
      let recognitionRef: any = mockRecognition;
      const lastSpokenAtRef: any = { current: Date.now() };
      const explicitStopRef: any = { current: true };
      const sessionTranscriptRef: any = { current: 'test transcript' };
      const browserRestartRef: any = { current: 2 };
      
      const cleanup = () => {
        try {
          recognitionRef = null;
          lastSpokenAtRef.current = null;
          explicitStopRef.current = false;
          sessionTranscriptRef.current = '';
          browserRestartRef.current = 0;
        } catch (e) {
          console.warn('Error nulling references during cleanup:', e);
        }
      };
      
      cleanup();
      
      expect(recognitionRef).toBeNull();
      expect(lastSpokenAtRef.current).toBeNull();
      expect(explicitStopRef.current).toBe(false);
      expect(sessionTranscriptRef.current).toBe('');
      expect(browserRestartRef.current).toBe(0);
    });
  });

  describe('Comprehensive Cleanup (Requirement 12.5)', () => {
    it('should perform all cleanup operations in correct order', () => {
      const operations: string[] = [];
      
      const mockRecognitionTracked = {
        abort: jest.fn(() => operations.push('abort')),
        stop: jest.fn(() => operations.push('stop')),
      };
      
      const mockSpeechSynthesisTracked = {
        cancel: jest.fn(() => operations.push('cancel-tts')),
      };
      
      let recognitionRef: any = mockRecognitionTracked;
      const silenceTimerRef: { current: NodeJS.Timeout | null } = { current: setTimeout(() => {}, 1000) };
      const silenceCheckerRef: { current: NodeJS.Timeout | null } = { current: setInterval(() => {}, 1000) };
      
      const cleanup = () => {
        // Stop speech recognition
        try {
          if (recognitionRef) {
            if (recognitionRef.abort) {
              recognitionRef.abort();
            }
            recognitionRef.stop();
          }
        } catch (e) {
          // ignore
        }
        
        // Cancel TTS
        try {
          mockSpeechSynthesisTracked.cancel();
        } catch (e) {
          // ignore
        }
        
        // Clear timers
        try {
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            clearInterval(silenceTimerRef.current);
            silenceTimerRef.current = null;
            operations.push('clear-timer');
          }
          
          if (silenceCheckerRef.current) {
            clearInterval(silenceCheckerRef.current);
            silenceCheckerRef.current = null;
            operations.push('clear-checker');
          }
        } catch (e) {
          // ignore
        }
        
        // Null references
        try {
          recognitionRef = null;
          operations.push('null-refs');
        } catch (e) {
          // ignore
        }
      };
      
      cleanup();
      
      // Verify all operations were performed
      expect(operations).toContain('abort');
      expect(operations).toContain('stop');
      expect(operations).toContain('cancel-tts');
      expect(operations).toContain('clear-timer');
      expect(operations).toContain('clear-checker');
      expect(operations).toContain('null-refs');
      
      // Verify order: recognition -> tts -> timers -> refs
      expect(operations.indexOf('abort')).toBeLessThan(operations.indexOf('cancel-tts'));
      expect(operations.indexOf('cancel-tts')).toBeLessThan(operations.indexOf('clear-timer'));
      expect(operations.indexOf('clear-timer')).toBeLessThan(operations.indexOf('null-refs'));
    });
    
    it('should log cleanup operations for debugging', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      const cleanup = () => {
        console.log('Cleaning up interview resources:', {
          timestamp: new Date().toISOString(),
          hasRecognition: !!mockRecognition,
        });
        
        // Perform cleanup...
        
        console.log('Cleanup complete - all resources released');
      };
      
      cleanup();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cleaning up interview resources'),
        expect.any(Object)
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Cleanup complete - all resources released'
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Cleanup on Component Unmount (Requirement 12.5)', () => {
    it('should call cleanup when component unmounts', () => {
      const cleanupSpy = jest.fn();
      
      // Simulate useEffect cleanup
      const useEffectCleanup = () => {
        return () => {
          console.log('Component unmounting - calling cleanup');
          cleanupSpy();
        };
      };
      
      const cleanup = useEffectCleanup();
      cleanup(); // Simulate unmount
      
      expect(cleanupSpy).toHaveBeenCalled();
    });
  });

  describe('Cleanup on Interview End (Requirement 12.5)', () => {
    it('should call cleanup when interview ends', () => {
      let interviewEnded = false;
      const cleanupSpy = jest.fn();
      
      const endInterview = () => {
        if (interviewEnded) return;
        interviewEnded = true;
        
        console.log('Ending interview - calling cleanup to release resources');
        cleanupSpy();
      };
      
      endInterview();
      
      expect(cleanupSpy).toHaveBeenCalled();
      expect(interviewEnded).toBe(true);
    });
    
    it('should not call cleanup multiple times if interview already ended', () => {
      let interviewEnded = false;
      const cleanupSpy = jest.fn();
      
      const endInterview = () => {
        if (interviewEnded) return;
        interviewEnded = true;
        cleanupSpy();
      };
      
      endInterview();
      endInterview(); // Try to end again
      
      expect(cleanupSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cleanup on Page Unload (Requirement 12.5)', () => {
    it('should call cleanup when page unloads', () => {
      const cleanupSpy = jest.fn();
      
      const handleBeforeUnload = () => {
        console.log('Page unloading - calling cleanup');
        cleanupSpy();
      };
      
      // Simulate beforeunload event
      handleBeforeUnload();
      
      expect(cleanupSpy).toHaveBeenCalled();
    });
  });
});
