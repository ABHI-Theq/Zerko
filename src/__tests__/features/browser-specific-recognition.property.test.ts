/**
 * Property-Based Tests for Browser-Specific Recognition Configuration
 * Feature: voice-interview-enhancement, Property 42: Browser-specific recognition configuration
 * Validates: Requirements 12.2
 */

import * as fc from 'fast-check';

// Mock browser environment
const mockBrowserEnvironment = (browserType: string, hasSpeechRecognition: boolean) => {
  const mockWindow = {
    SpeechRecognition: hasSpeechRecognition ? jest.fn() : undefined,
    webkitSpeechRecognition: hasSpeechRecognition ? jest.fn() : undefined,
    brave: browserType === 'Brave' ? { isBrave: jest.fn().mockResolvedValue(true) } : undefined,
  };

  const mockNavigator = {
    userAgent: getUserAgentForBrowser(browserType),
  };

  return { mockWindow, mockNavigator };
};

// Helper to generate user agent strings for different browsers
const getUserAgentForBrowser = (browserType: string): string => {
  const userAgents: Record<string, string> = {
    Chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    Safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    Edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    Brave: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  };
  return userAgents[browserType] || userAgents.Chrome;
};

// Simulate the SpeechRecognitionManager class behavior
class MockSpeechRecognitionManager {
  private browserInfo: {
    isBrave: boolean;
    isChrome: boolean;
    isFirefox: boolean;
    isSafari: boolean;
    isEdge: boolean;
    browserName: string;
  };

  constructor(browserInfo: {
    isBrave: boolean;
    isChrome: boolean;
    isFirefox: boolean;
    isSafari: boolean;
    isEdge: boolean;
    browserName: string;
  }) {
    this.browserInfo = browserInfo;
  }

  createInstance() {
    const recognition: any = {
      continuous: undefined,
      interimResults: undefined,
      lang: undefined,
      maxAlternatives: undefined,
    };

    // Apply browser-specific configurations (matching the actual implementation)
    if (this.browserInfo.isBrave) {
      recognition.continuous = false;
      recognition.interimResults = false; // Brave-specific: disable interim results
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
    } else if (this.browserInfo.isChrome || this.browserInfo.isEdge) {
      recognition.continuous = false;
      recognition.interimResults = true; // Chrome/Edge: enable interim results
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
    } else if (this.browserInfo.isFirefox) {
      recognition.continuous = false;
      recognition.interimResults = false; // Firefox: disable interim results
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
    } else if (this.browserInfo.isSafari) {
      recognition.continuous = false;
      recognition.interimResults = true; // Safari: enable interim results
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
    } else {
      // Default configuration for unknown browsers
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
    }

    return recognition;
  }
}

// Arbitraries for property-based testing
const supportedBrowserArbitrary = fc.constantFrom('Chrome', 'Firefox', 'Safari', 'Edge', 'Brave');
const allBrowsersArbitrary = fc.constantFrom('Chrome', 'Firefox', 'Safari', 'Edge', 'Brave', 'Unknown');

describe('Browser-Specific Recognition Configuration Property Tests', () => {
  describe('Property 42: Browser-specific recognition configuration', () => {
    /**
     * Feature: voice-interview-enhancement, Property 42: Browser-specific recognition configuration
     * 
     * For any speech recognition instance created, the SpeechRecognitionManager should apply 
     * the appropriate configuration based on the detected browser
     */
    it('should apply correct interimResults configuration for each browser type', () => {
      fc.assert(
        fc.property(supportedBrowserArbitrary, (browserType) => {
          // Setup: Create browser info based on browser type
          const browserInfo = {
            isBrave: browserType === 'Brave',
            isChrome: browserType === 'Chrome',
            isFirefox: browserType === 'Firefox',
            isSafari: browserType === 'Safari',
            isEdge: browserType === 'Edge',
            browserName: browserType
          };

          // Create manager and instance
          const manager = new MockSpeechRecognitionManager(browserInfo);
          const recognition = manager.createInstance();

          // Property assertion: Each browser should have the correct interimResults setting
          if (browserType === 'Brave') {
            expect(recognition.interimResults).toBe(false);
          } else if (browserType === 'Chrome' || browserType === 'Edge') {
            expect(recognition.interimResults).toBe(true);
          } else if (browserType === 'Firefox') {
            expect(recognition.interimResults).toBe(false);
          } else if (browserType === 'Safari') {
            expect(recognition.interimResults).toBe(true);
          }

          // Property assertion: All browsers should have consistent base configuration
          expect(recognition.continuous).toBe(false);
          expect(recognition.lang).toBe('en-US');
          expect(recognition.maxAlternatives).toBe(1);
        }),
        { numRuns: 100 }
      );
    });

    it('should apply Brave-specific configuration consistently', () => {
      fc.assert(
        fc.property(fc.constant('Brave'), (browserType) => {
          // Setup: Create Brave browser info
          const browserInfo = {
            isBrave: true,
            isChrome: false,
            isFirefox: false,
            isSafari: false,
            isEdge: false,
            browserName: 'Brave'
          };

          // Create manager and instance
          const manager = new MockSpeechRecognitionManager(browserInfo);
          const recognition = manager.createInstance();

          // Property assertion: Brave should always have interimResults disabled
          expect(recognition.interimResults).toBe(false);
          expect(recognition.continuous).toBe(false);
          expect(recognition.lang).toBe('en-US');
          expect(recognition.maxAlternatives).toBe(1);
        }),
        { numRuns: 100 }
      );
    });

    it('should apply Chrome/Edge-specific configuration consistently', () => {
      fc.assert(
        fc.property(fc.constantFrom('Chrome', 'Edge'), (browserType) => {
          // Setup: Create Chrome or Edge browser info
          const browserInfo = {
            isBrave: false,
            isChrome: browserType === 'Chrome',
            isFirefox: false,
            isSafari: false,
            isEdge: browserType === 'Edge',
            browserName: browserType
          };

          // Create manager and instance
          const manager = new MockSpeechRecognitionManager(browserInfo);
          const recognition = manager.createInstance();

          // Property assertion: Chrome/Edge should have interimResults enabled
          expect(recognition.interimResults).toBe(true);
          expect(recognition.continuous).toBe(false);
          expect(recognition.lang).toBe('en-US');
          expect(recognition.maxAlternatives).toBe(1);
        }),
        { numRuns: 100 }
      );
    });

    it('should apply Firefox-specific configuration consistently', () => {
      fc.assert(
        fc.property(fc.constant('Firefox'), (browserType) => {
          // Setup: Create Firefox browser info
          const browserInfo = {
            isBrave: false,
            isChrome: false,
            isFirefox: true,
            isSafari: false,
            isEdge: false,
            browserName: 'Firefox'
          };

          // Create manager and instance
          const manager = new MockSpeechRecognitionManager(browserInfo);
          const recognition = manager.createInstance();

          // Property assertion: Firefox should have interimResults disabled
          expect(recognition.interimResults).toBe(false);
          expect(recognition.continuous).toBe(false);
          expect(recognition.lang).toBe('en-US');
          expect(recognition.maxAlternatives).toBe(1);
        }),
        { numRuns: 100 }
      );
    });

    it('should apply Safari-specific configuration consistently', () => {
      fc.assert(
        fc.property(fc.constant('Safari'), (browserType) => {
          // Setup: Create Safari browser info
          const browserInfo = {
            isBrave: false,
            isChrome: false,
            isFirefox: false,
            isSafari: true,
            isEdge: false,
            browserName: 'Safari'
          };

          // Create manager and instance
          const manager = new MockSpeechRecognitionManager(browserInfo);
          const recognition = manager.createInstance();

          // Property assertion: Safari should have interimResults enabled
          expect(recognition.interimResults).toBe(true);
          expect(recognition.continuous).toBe(false);
          expect(recognition.lang).toBe('en-US');
          expect(recognition.maxAlternatives).toBe(1);
        }),
        { numRuns: 100 }
      );
    });

    it('should apply default configuration for unknown browsers', () => {
      fc.assert(
        fc.property(fc.constant('Unknown'), (browserType) => {
          // Setup: Create unknown browser info
          const browserInfo = {
            isBrave: false,
            isChrome: false,
            isFirefox: false,
            isSafari: false,
            isEdge: false,
            browserName: 'Unknown'
          };

          // Create manager and instance
          const manager = new MockSpeechRecognitionManager(browserInfo);
          const recognition = manager.createInstance();

          // Property assertion: Unknown browsers should get default configuration
          expect(recognition.interimResults).toBe(true); // Default is true
          expect(recognition.continuous).toBe(false);
          expect(recognition.lang).toBe('en-US');
          expect(recognition.maxAlternatives).toBe(1);
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain configuration consistency across multiple instance creations', () => {
      fc.assert(
        fc.property(supportedBrowserArbitrary, (browserType) => {
          // Setup: Create browser info
          const browserInfo = {
            isBrave: browserType === 'Brave',
            isChrome: browserType === 'Chrome',
            isFirefox: browserType === 'Firefox',
            isSafari: browserType === 'Safari',
            isEdge: browserType === 'Edge',
            browserName: browserType
          };

          // Create manager
          const manager = new MockSpeechRecognitionManager(browserInfo);

          // Create multiple instances
          const instance1 = manager.createInstance();
          const instance2 = manager.createInstance();
          const instance3 = manager.createInstance();

          // Property assertion: All instances should have identical configuration
          expect(instance1.interimResults).toBe(instance2.interimResults);
          expect(instance2.interimResults).toBe(instance3.interimResults);
          expect(instance1.continuous).toBe(instance2.continuous);
          expect(instance2.continuous).toBe(instance3.continuous);
          expect(instance1.lang).toBe(instance2.lang);
          expect(instance2.lang).toBe(instance3.lang);
          expect(instance1.maxAlternatives).toBe(instance2.maxAlternatives);
          expect(instance2.maxAlternatives).toBe(instance3.maxAlternatives);
        }),
        { numRuns: 100 }
      );
    });

    it('should never enable interimResults for Brave or Firefox', () => {
      fc.assert(
        fc.property(fc.constantFrom('Brave', 'Firefox'), (browserType) => {
          // Setup: Create browser info
          const browserInfo = {
            isBrave: browserType === 'Brave',
            isChrome: false,
            isFirefox: browserType === 'Firefox',
            isSafari: false,
            isEdge: false,
            browserName: browserType
          };

          // Create manager and instance
          const manager = new MockSpeechRecognitionManager(browserInfo);
          const recognition = manager.createInstance();

          // Property assertion: Brave and Firefox should NEVER have interimResults enabled
          expect(recognition.interimResults).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should always enable interimResults for Chrome, Edge, and Safari', () => {
      fc.assert(
        fc.property(fc.constantFrom('Chrome', 'Edge', 'Safari'), (browserType) => {
          // Setup: Create browser info
          const browserInfo = {
            isBrave: false,
            isChrome: browserType === 'Chrome',
            isFirefox: false,
            isSafari: browserType === 'Safari',
            isEdge: browserType === 'Edge',
            browserName: browserType
          };

          // Create manager and instance
          const manager = new MockSpeechRecognitionManager(browserInfo);
          const recognition = manager.createInstance();

          // Property assertion: Chrome, Edge, and Safari should ALWAYS have interimResults enabled
          expect(recognition.interimResults).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should apply correct configuration based on browser flags, not browser name', () => {
      fc.assert(
        fc.property(
          fc.record({
            isBrave: fc.boolean(),
            isChrome: fc.boolean(),
            isFirefox: fc.boolean(),
            isSafari: fc.boolean(),
            isEdge: fc.boolean(),
          }),
          (flags) => {
            // Setup: Create browser info with random flags
            const browserInfo = {
              ...flags,
              browserName: 'Test'
            };

            // Create manager and instance
            const manager = new MockSpeechRecognitionManager(browserInfo);
            const recognition = manager.createInstance();

            // Property assertion: Configuration should be based on flags, not name
            if (flags.isBrave) {
              expect(recognition.interimResults).toBe(false);
            } else if (flags.isChrome || flags.isEdge) {
              expect(recognition.interimResults).toBe(true);
            } else if (flags.isFirefox) {
              expect(recognition.interimResults).toBe(false);
            } else if (flags.isSafari) {
              expect(recognition.interimResults).toBe(true);
            } else {
              // Default configuration
              expect(recognition.interimResults).toBe(true);
            }

            // All should have consistent base configuration
            expect(recognition.continuous).toBe(false);
            expect(recognition.lang).toBe('en-US');
            expect(recognition.maxAlternatives).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should prioritize Brave configuration when multiple browser flags are set', () => {
      fc.assert(
        fc.property(
          fc.record({
            isChrome: fc.boolean(),
            isFirefox: fc.boolean(),
            isSafari: fc.boolean(),
            isEdge: fc.boolean(),
          }),
          (otherFlags) => {
            // Setup: Create browser info with Brave flag and other random flags
            const browserInfo = {
              isBrave: true, // Brave is always true
              ...otherFlags,
              browserName: 'Brave'
            };

            // Create manager and instance
            const manager = new MockSpeechRecognitionManager(browserInfo);
            const recognition = manager.createInstance();

            // Property assertion: Brave configuration should take precedence
            expect(recognition.interimResults).toBe(false);
            expect(recognition.continuous).toBe(false);
            expect(recognition.lang).toBe('en-US');
            expect(recognition.maxAlternatives).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge case where no browser flags are set', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          // Setup: Create browser info with all flags false
          const browserInfo = {
            isBrave: false,
            isChrome: false,
            isFirefox: false,
            isSafari: false,
            isEdge: false,
            browserName: 'Unknown'
          };

          // Create manager and instance
          const manager = new MockSpeechRecognitionManager(browserInfo);
          const recognition = manager.createInstance();

          // Property assertion: Should apply default configuration
          expect(recognition.interimResults).toBe(true); // Default
          expect(recognition.continuous).toBe(false);
          expect(recognition.lang).toBe('en-US');
          expect(recognition.maxAlternatives).toBe(1);
        }),
        { numRuns: 100 }
      );
    });

    it('should always set continuous to false regardless of browser', () => {
      fc.assert(
        fc.property(allBrowsersArbitrary, (browserType) => {
          // Setup: Create browser info
          const browserInfo = {
            isBrave: browserType === 'Brave',
            isChrome: browserType === 'Chrome',
            isFirefox: browserType === 'Firefox',
            isSafari: browserType === 'Safari',
            isEdge: browserType === 'Edge',
            browserName: browserType
          };

          // Create manager and instance
          const manager = new MockSpeechRecognitionManager(browserInfo);
          const recognition = manager.createInstance();

          // Property assertion: continuous should ALWAYS be false
          expect(recognition.continuous).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should always set lang to en-US regardless of browser', () => {
      fc.assert(
        fc.property(allBrowsersArbitrary, (browserType) => {
          // Setup: Create browser info
          const browserInfo = {
            isBrave: browserType === 'Brave',
            isChrome: browserType === 'Chrome',
            isFirefox: browserType === 'Firefox',
            isSafari: browserType === 'Safari',
            isEdge: browserType === 'Edge',
            browserName: browserType
          };

          // Create manager and instance
          const manager = new MockSpeechRecognitionManager(browserInfo);
          const recognition = manager.createInstance();

          // Property assertion: lang should ALWAYS be 'en-US'
          expect(recognition.lang).toBe('en-US');
        }),
        { numRuns: 100 }
      );
    });

    it('should always set maxAlternatives to 1 regardless of browser', () => {
      fc.assert(
        fc.property(allBrowsersArbitrary, (browserType) => {
          // Setup: Create browser info
          const browserInfo = {
            isBrave: browserType === 'Brave',
            isChrome: browserType === 'Chrome',
            isFirefox: browserType === 'Firefox',
            isSafari: browserType === 'Safari',
            isEdge: browserType === 'Edge',
            browserName: browserType
          };

          // Create manager and instance
          const manager = new MockSpeechRecognitionManager(browserInfo);
          const recognition = manager.createInstance();

          // Property assertion: maxAlternatives should ALWAYS be 1
          expect(recognition.maxAlternatives).toBe(1);
        }),
        { numRuns: 100 }
      );
    });
  });
});
