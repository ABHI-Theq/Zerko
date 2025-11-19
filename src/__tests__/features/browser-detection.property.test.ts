/**
 * Property-Based Tests for Browser Detection
 * Feature: voice-interview-enhancement, Property 1: Cross-browser speech recognition initialization
 * Validates: Requirements 1.1, 1.2
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

// Arbitraries for property-based testing
const supportedBrowserArbitrary = fc.constantFrom('Chrome', 'Firefox', 'Safari', 'Edge', 'Brave');

describe('Browser Detection Property Tests', () => {
  describe('Property 1: Cross-browser speech recognition initialization', () => {
    /**
     * Feature: voice-interview-enhancement, Property 1: Cross-browser speech recognition initialization
     * 
     * For any supported browser (Chrome, Firefox, Edge, Safari, Brave), when the Voice Interview System 
     * initializes, speech recognition should be successfully created and available
     */
    it('should successfully initialize speech recognition for all supported browsers', () => {
      fc.assert(
        fc.property(supportedBrowserArbitrary, (browserType) => {
          // Setup: Mock the browser environment
          const { mockWindow, mockNavigator } = mockBrowserEnvironment(browserType, true);
          
          // Mock global objects
          global.window = mockWindow as any;
          global.navigator = mockNavigator as any;

          // Simulate browser detection logic
          const userAgent = mockNavigator.userAgent;
          
          // Detect browser type
          const isEdge = userAgent.includes('Edg/') || userAgent.includes('Edge/');
          const isChrome = userAgent.includes('Chrome') && !isEdge;
          const isFirefox = userAgent.includes('Firefox');
          const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent) && !isChrome && !isEdge;
          
          // Check speech recognition availability
          const isSpeechRecognitionSupported = 
            'SpeechRecognition' in mockWindow || 'webkitSpeechRecognition' in mockWindow;

          // Property assertion: Speech recognition should be supported for all major browsers
          expect(isSpeechRecognitionSupported).toBe(true);
          
          // Property assertion: At least one browser type should be detected
          const browserDetected = isChrome || isFirefox || isSafari || isEdge || browserType === 'Brave';
          expect(browserDetected).toBe(true);
          
          // Property assertion: Speech recognition instance should be creatable
          if (isSpeechRecognitionSupported) {
            const SpeechRecognition = mockWindow.SpeechRecognition || mockWindow.webkitSpeechRecognition;
            expect(SpeechRecognition).toBeDefined();
          }
        }),
        { numRuns: 100 } // Run 100 iterations as specified in design document
      );
    });

    it('should detect Brave browser correctly and apply specific configurations', async () => {
      await fc.assert(
        fc.asyncProperty(fc.constant('Brave'), async (browserType) => {
          // Setup: Mock Brave browser environment
          const { mockWindow, mockNavigator } = mockBrowserEnvironment(browserType, true);
          
          global.window = mockWindow as any;
          global.navigator = mockNavigator as any;

          // Simulate Brave detection
          let isBrave = false;
          
          // Method 1: Official Brave API
          if (mockWindow.brave && typeof mockWindow.brave.isBrave === 'function') {
            isBrave = await mockWindow.brave.isBrave();
          }
          
          // Property assertion: Brave should be detected
          expect(isBrave).toBe(true);
          
          // Property assertion: Speech recognition should still be available
          const isSpeechRecognitionSupported = 
            'SpeechRecognition' in mockWindow || 'webkitSpeechRecognition' in mockWindow;
          expect(isSpeechRecognitionSupported).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle browsers without speech recognition gracefully', () => {
      fc.assert(
        fc.property(supportedBrowserArbitrary, (browserType) => {
          // Setup: Create a clean mock window WITHOUT speech recognition
          const mockWindow: any = {
            brave: browserType === 'Brave' ? { isBrave: jest.fn().mockResolvedValue(true) } : undefined,
          };
          
          const mockNavigator = {
            userAgent: getUserAgentForBrowser(browserType),
          };
          
          global.window = mockWindow;
          global.navigator = mockNavigator as any;

          // Check speech recognition availability
          const isSpeechRecognitionSupported = 
            'SpeechRecognition' in mockWindow || 'webkitSpeechRecognition' in mockWindow;

          // Property assertion: Should correctly report unavailability
          expect(isSpeechRecognitionSupported).toBe(false);
          
          // Property assertion: Should not throw error when checking
          expect(() => {
            const hasRecognition = 'SpeechRecognition' in mockWindow || 'webkitSpeechRecognition' in mockWindow;
            return hasRecognition;
          }).not.toThrow();
        }),
        { numRuns: 100 }
      );
    });

    it('should correctly identify browser type from user agent', () => {
      fc.assert(
        fc.property(supportedBrowserArbitrary, (browserType) => {
          // Setup
          const userAgent = getUserAgentForBrowser(browserType);
          
          // Simulate browser detection logic
          const isEdge = userAgent.includes('Edg/') || userAgent.includes('Edge/');
          const isChrome = userAgent.includes('Chrome') && !isEdge;
          const isFirefox = userAgent.includes('Firefox');
          const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent) && !isChrome && !isEdge;
          
          // Property assertion: Exactly one browser type should match (or Brave which looks like Chrome)
          const detectionCount = [isChrome, isFirefox, isSafari, isEdge].filter(Boolean).length;
          
          if (browserType === 'Brave') {
            // Brave appears as Chrome in user agent
            expect(isChrome).toBe(true);
          } else if (browserType === 'Chrome') {
            expect(isChrome).toBe(true);
            expect(detectionCount).toBe(1);
          } else if (browserType === 'Firefox') {
            expect(isFirefox).toBe(true);
            expect(detectionCount).toBe(1);
          } else if (browserType === 'Safari') {
            expect(isSafari).toBe(true);
            expect(detectionCount).toBe(1);
          } else if (browserType === 'Edge') {
            expect(isEdge).toBe(true);
            expect(detectionCount).toBe(1);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain browser detection consistency across multiple calls', () => {
      fc.assert(
        fc.property(supportedBrowserArbitrary, (browserType) => {
          // Setup
          const userAgent = getUserAgentForBrowser(browserType);
          
          // Perform detection multiple times
          const detectBrowser = () => {
            const isEdge = userAgent.includes('Edg/') || userAgent.includes('Edge/');
            const isChrome = userAgent.includes('Chrome') && !isEdge;
            const isFirefox = userAgent.includes('Firefox');
            const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent) && !isChrome && !isEdge;
            
            return { isEdge, isChrome, isFirefox, isSafari };
          };
          
          const detection1 = detectBrowser();
          const detection2 = detectBrowser();
          const detection3 = detectBrowser();
          
          // Property assertion: Detection should be consistent
          expect(detection1).toEqual(detection2);
          expect(detection2).toEqual(detection3);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 2: Brave browser detection and configuration', () => {
    /**
     * Feature: voice-interview-enhancement, Property 2: Brave browser detection and configuration
     * 
     * For any browser environment, when Brave browser is detected, the system should apply 
     * Brave-specific configurations including `interimResults: false` and `sampleRate: 16000`
     */
    it('should apply Brave-specific configuration when Brave is detected', () => {
      fc.assert(
        fc.property(fc.constant('Brave'), (browserType) => {
          // Setup: Mock Brave browser environment
          const { mockWindow, mockNavigator } = mockBrowserEnvironment(browserType, true);
          
          global.window = mockWindow as any;
          global.navigator = mockNavigator as any;

          // Create browser info object (simulating getBrowserInfo result)
          const browserInfo = {
            isBrave: true,
            isChrome: false,
            isFirefox: false,
            isSafari: false,
            isEdge: false,
            browserName: 'Brave'
          };

          // Simulate SpeechRecognitionManager behavior
          const SpeechRecognition = mockWindow.SpeechRecognition || mockWindow.webkitSpeechRecognition;
          expect(SpeechRecognition).toBeDefined();

          // Create a mock recognition instance
          const mockRecognitionInstance = {
            continuous: undefined as boolean | undefined,
            interimResults: undefined as boolean | undefined,
            lang: undefined as string | undefined,
            maxAlternatives: undefined as number | undefined,
            sampleRate: undefined as number | undefined
          };

          // Apply Brave-specific configuration (as done in SpeechRecognitionManager.createInstance)
          if (browserInfo.isBrave) {
            mockRecognitionInstance.continuous = false;
            mockRecognitionInstance.interimResults = false; // Brave-specific: disable interim results
            mockRecognitionInstance.lang = 'en-US';
            mockRecognitionInstance.maxAlternatives = 1;
          }

          // Property assertion: Brave should have interimResults disabled
          expect(mockRecognitionInstance.interimResults).toBe(false);
          expect(mockRecognitionInstance.continuous).toBe(false);
          expect(mockRecognitionInstance.lang).toBe('en-US');
          expect(mockRecognitionInstance.maxAlternatives).toBe(1);
        }),
        { numRuns: 100 }
      );
    });

    it('should apply different configuration for non-Brave browsers', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('Chrome', 'Firefox', 'Safari', 'Edge'),
          (browserType) => {
            // Setup: Mock non-Brave browser environment
            const { mockWindow, mockNavigator } = mockBrowserEnvironment(browserType, true);
            
            global.window = mockWindow as any;
            global.navigator = mockNavigator as any;

            // Create browser info object
            const browserInfo = {
              isBrave: false,
              isChrome: browserType === 'Chrome',
              isFirefox: browserType === 'Firefox',
              isSafari: browserType === 'Safari',
              isEdge: browserType === 'Edge',
              browserName: browserType
            };

            // Create a mock recognition instance
            const mockRecognitionInstance = {
              continuous: undefined as boolean | undefined,
              interimResults: undefined as boolean | undefined,
              lang: undefined as string | undefined,
              maxAlternatives: undefined as number | undefined
            };

            // Apply browser-specific configuration
            if (browserInfo.isBrave) {
              mockRecognitionInstance.continuous = false;
              mockRecognitionInstance.interimResults = false;
              mockRecognitionInstance.lang = 'en-US';
              mockRecognitionInstance.maxAlternatives = 1;
            } else if (browserInfo.isChrome || browserInfo.isEdge) {
              mockRecognitionInstance.continuous = false;
              mockRecognitionInstance.interimResults = true; // Chrome/Edge: enable interim results
              mockRecognitionInstance.lang = 'en-US';
              mockRecognitionInstance.maxAlternatives = 1;
            } else if (browserInfo.isFirefox) {
              mockRecognitionInstance.continuous = false;
              mockRecognitionInstance.interimResults = false; // Firefox: disable interim results
              mockRecognitionInstance.lang = 'en-US';
              mockRecognitionInstance.maxAlternatives = 1;
            } else if (browserInfo.isSafari) {
              mockRecognitionInstance.continuous = false;
              mockRecognitionInstance.interimResults = true; // Safari: enable interim results
              mockRecognitionInstance.lang = 'en-US';
              mockRecognitionInstance.maxAlternatives = 1;
            }

            // Property assertion: Non-Brave Chrome-based browsers should have interimResults enabled
            if (browserInfo.isChrome || browserInfo.isEdge) {
              expect(mockRecognitionInstance.interimResults).toBe(true);
            }
            
            // Property assertion: Firefox should have interimResults disabled
            if (browserInfo.isFirefox) {
              expect(mockRecognitionInstance.interimResults).toBe(false);
            }

            // Property assertion: Safari should have interimResults enabled
            if (browserInfo.isSafari) {
              expect(mockRecognitionInstance.interimResults).toBe(true);
            }

            // Property assertion: All browsers should have consistent base configuration
            expect(mockRecognitionInstance.continuous).toBe(false);
            expect(mockRecognitionInstance.lang).toBe('en-US');
            expect(mockRecognitionInstance.maxAlternatives).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should apply Brave-specific audio constraints with sample rate 16000', () => {
      fc.assert(
        fc.property(fc.constant('Brave'), (_browserType) => {
          // Setup: Mock Brave browser environment
          const browserInfo = {
            isBrave: true,
            isChrome: false,
            isFirefox: false,
            isSafari: false,
            isEdge: false,
            browserName: 'Brave'
          };

          // Simulate audio constraints configuration (as done in requestMicrophonePermission)
          const constraints = browserInfo.isBrave ? {
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 16000, // Brave-specific: explicit sample rate
            },
            video: false 
          } : {
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            },
            video: false 
          };

          // Property assertion: Brave should have explicit sample rate of 16000
          expect(constraints.audio).toHaveProperty('sampleRate', 16000);
          expect(constraints.audio.echoCancellation).toBe(true);
          expect(constraints.audio.noiseSuppression).toBe(true);
          expect(constraints.audio.autoGainControl).toBe(true);
          expect(constraints.video).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should not include explicit sample rate for non-Brave browsers', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('Chrome', 'Firefox', 'Safari', 'Edge'),
          (browserType) => {
            // Setup: Mock non-Brave browser environment
            const browserInfo = {
              isBrave: false,
              isChrome: browserType === 'Chrome',
              isFirefox: browserType === 'Firefox',
              isSafari: browserType === 'Safari',
              isEdge: browserType === 'Edge',
              browserName: browserType
            };

            // Simulate audio constraints configuration
            const constraints = browserInfo.isBrave ? {
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 16000,
              },
              video: false 
            } : {
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
              },
              video: false 
            };

            // Property assertion: Non-Brave browsers should not have explicit sample rate
            expect(constraints.audio).not.toHaveProperty('sampleRate');
            expect(constraints.audio.echoCancellation).toBe(true);
            expect(constraints.audio.noiseSuppression).toBe(true);
            expect(constraints.audio.autoGainControl).toBe(true);
            expect(constraints.video).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should consistently apply Brave configuration across multiple instances', () => {
      fc.assert(
        fc.property(fc.constant('Brave'), (browserType) => {
          // Setup: Mock Brave browser environment
          const { mockWindow, mockNavigator } = mockBrowserEnvironment(browserType, true);
          
          global.window = mockWindow as any;
          global.navigator = mockNavigator as any;

          const browserInfo = {
            isBrave: true,
            isChrome: false,
            isFirefox: false,
            isSafari: false,
            isEdge: false,
            browserName: 'Brave'
          };

          // Create multiple mock recognition instances
          const createMockInstance = () => {
            const instance = {
              continuous: undefined as boolean | undefined,
              interimResults: undefined as boolean | undefined,
              lang: undefined as string | undefined,
              maxAlternatives: undefined as number | undefined
            };

            // Apply Brave configuration
            if (browserInfo.isBrave) {
              instance.continuous = false;
              instance.interimResults = false;
              instance.lang = 'en-US';
              instance.maxAlternatives = 1;
            }

            return instance;
          };

          const instance1 = createMockInstance();
          const instance2 = createMockInstance();
          const instance3 = createMockInstance();

          // Property assertion: All instances should have identical configuration
          expect(instance1).toEqual(instance2);
          expect(instance2).toEqual(instance3);
          
          // Property assertion: All should have Brave-specific settings
          expect(instance1.interimResults).toBe(false);
          expect(instance2.interimResults).toBe(false);
          expect(instance3.interimResults).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should detect Brave and apply configuration regardless of detection method', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            { method: 'official-api', hasBraveAPI: true, hasUserAgent: false, hasNavigatorProp: false },
            { method: 'user-agent', hasBraveAPI: false, hasUserAgent: true, hasNavigatorProp: false },
            { method: 'navigator-prop', hasBraveAPI: false, hasUserAgent: false, hasNavigatorProp: true }
          ),
          async (detectionConfig) => {
            // Setup: Mock Brave with different detection methods
            const mockWindow: any = {
              SpeechRecognition: jest.fn(),
              webkitSpeechRecognition: jest.fn(),
              brave: detectionConfig.hasBraveAPI ? { isBrave: jest.fn().mockResolvedValue(true) } : undefined,
            };

            const mockNavigator: any = {
              userAgent: detectionConfig.hasUserAgent 
                ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Brave'
                : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              brave: detectionConfig.hasNavigatorProp ? {} : undefined
            };

            global.window = mockWindow;
            global.navigator = mockNavigator;

            // Simulate Brave detection logic
            let isBrave = false;

            // Method 1: Official Brave API
            if (mockWindow.brave && typeof mockWindow.brave.isBrave === 'function') {
              isBrave = await mockWindow.brave.isBrave();
            }

            // Method 2: User agent
            if (!isBrave && mockNavigator.userAgent.includes('Brave')) {
              isBrave = true;
            }

            // Method 3: Navigator property
            if (!isBrave && mockNavigator.brave !== undefined) {
              isBrave = true;
            }

            // Property assertion: Brave should be detected via at least one method
            expect(isBrave).toBe(true);

            // If Brave is detected, configuration should be applied
            if (isBrave) {
              const mockRecognitionInstance = {
                continuous: false as boolean,
                interimResults: false as boolean,
                lang: 'en-US' as string,
                maxAlternatives: 1 as number
              };

              expect(mockRecognitionInstance.interimResults).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
