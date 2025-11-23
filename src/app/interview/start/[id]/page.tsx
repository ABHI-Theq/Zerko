"use client";
import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, User, PhoneOff, Mic, Clock, MicOff, RefreshCw, AlertCircle, Keyboard } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useInterviewCon } from "@/context/InterviewContext";
import { useInterviewConAll } from "@/context/InterviewAllContext";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import ReloadGuard from "@/components/Reload";

declare global {
  interface Window { 
    webkitSpeechRecognition: any; 
    SpeechRecognition: any;
    brave?: { isBrave: () => Promise<boolean> };
  }
}

// Enhanced Browser detection with async Brave detection and comprehensive browser support
const getBrowserInfo = async () => {
  if (typeof window === 'undefined') {
    return { 
      isBrave: false, 
      isChrome: false, 
      isFirefox: false, 
      isSafari: false, 
      isEdge: false,
      browserName: 'unknown'
    };
  }
  
  const userAgent = navigator.userAgent;
  
  // Detect Edge (must check before Chrome since Edge includes 'Chrome' in UA)
  const isEdge = userAgent.includes('Edg/') || userAgent.includes('Edge/');
  
  // Detect Chrome (but not Edge or Brave)
  const isChrome = userAgent.includes('Chrome') && !isEdge;
  
  // Detect Firefox
  const isFirefox = userAgent.includes('Firefox');
  
  // Detect Safari (must exclude Chrome-based browsers)
  const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent) && !isChrome && !isEdge;
  
  // Proper async Brave detection with multiple fallback mechanisms
  let isBrave = false;
  
  // Method 1: Official Brave API (most reliable)
  if (window.brave && typeof window.brave.isBrave === 'function') {
    try {
      isBrave = await window.brave.isBrave();
      console.log('Brave detected via official API');
    } catch (e) {
      console.warn('Brave API detection failed:', e);
    }
  }
  
  // Method 2: Fallback - Check user agent string
  if (!isBrave && userAgent.includes('Brave')) {
    isBrave = true;
    console.log('Brave detected via user agent');
  }
  
  // Method 3: Fallback - Check for Brave-specific navigator properties
  if (!isBrave && (navigator as any).brave !== undefined) {
    isBrave = true;
    console.log('Brave detected via navigator property');
  }
  
  // Determine browser name for logging
  const browserName = isBrave ? 'Brave' 
    : isEdge ? 'Edge'
    : isChrome ? 'Chrome'
    : isFirefox ? 'Firefox'
    : isSafari ? 'Safari'
    : 'unknown';
  
  console.log(`Browser detected: ${browserName}`);
  
  return { isBrave, isChrome, isFirefox, isSafari, isEdge, browserName };
};

// Speech recognition support check
const isSpeechRecognitionSupported = () => {
  if (typeof window === 'undefined') return false;
  return ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
};

// Enhanced speech recognition manager with comprehensive browser-specific handling
class SpeechRecognitionManager {
  private recognition: any = null;
  private isSupported: boolean = false;
  private isAvailable: boolean = false;
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
    this.isSupported = isSpeechRecognitionSupported();
    
    if (this.isSupported) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      try {
        this.recognition = new SpeechRecognition();
        this.isAvailable = true;
        console.log(`SpeechRecognitionManager initialized for ${browserInfo.browserName}`);
      } catch (error) {
        console.error('Failed to initialize SpeechRecognition:', error);
        this.isAvailable = false;
      }
    } else {
      console.warn('Speech recognition not supported in this browser');
    }
  }

  createInstance() {
    if (!this.isAvailable) {
      console.error('Speech recognition not available');
      return null;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Apply browser-specific configurations
    console.log(`Creating speech recognition instance for ${this.browserInfo.browserName}`);
    
    if (this.browserInfo.isBrave) {
      // Brave-optimized configuration
      recognition.continuous = false;
      recognition.interimResults = false; // Disable interim results for Brave stability
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      console.log('Applied Brave-specific configuration: interimResults=false');
    } else if (this.browserInfo.isChrome || this.browserInfo.isEdge) {
      // Chrome and Edge (Chromium-based) configuration
      recognition.continuous = false;
      recognition.interimResults = true; // Enable interim results for better UX
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      console.log('Applied Chrome/Edge configuration: interimResults=true');
    } else if (this.browserInfo.isFirefox) {
      // Firefox configuration (more conservative)
      recognition.continuous = false;
      recognition.interimResults = false; // Firefox has limited support for interim results
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      console.log('Applied Firefox configuration: interimResults=false');
    } else if (this.browserInfo.isSafari) {
      // Safari configuration
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      console.log('Applied Safari configuration');
    } else {
      // Default configuration for unknown browsers
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      console.log('Applied default configuration for unknown browser');
    }
    
    return recognition;
  }

  isRecognitionAvailable() {
    return this.isAvailable;
  }

  getBrowserInfo() {
    return this.browserInfo;
  }
}

export default function Page() {
  const { interview } = useInterviewCon();
  const { refetchInterviews } = useInterviewConAll();
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<{ role: string; content: string; question_id?: number }[]>([]);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [agentThinking, setAgentThinking] = useState(false);
  const [endInterviewed, setEndInterviewed] = useState(false);
  const [browserInfo, setBrowserInfo] = useState({ 
    isBrave: false, 
    isChrome: false, 
    isFirefox: false, 
    isSafari: false, 
    isEdge: false,
    browserName: 'unknown'
  });
  const [microphoneGranted, setMicrophoneGranted] = useState(false);
  const [awaitingPermission, setAwaitingPermission] = useState(false);
  const [recognitionAvailable, setRecognitionAvailable] = useState(true);
  const [useFallback, setUseFallback] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualInputText, setManualInputText] = useState("");
  const [braveWarningShown, setBraveWarningShown] = useState(false);
  const [networkRetryCount, setNetworkRetryCount] = useState(0);
  const [apiRetryCount, setApiRetryCount] = useState(0);
  const [showRetryButton, setShowRetryButton] = useState(false);
  const [lastFailedRequest, setLastFailedRequest] = useState<{
    userText: string;
    messages: any[];
    timestamp: number;
  } | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const recognitionManager = useRef<SpeechRecognitionManager | null>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const browserRestartRef = useRef(0);

  // Refs for robust silence handling
  const silenceCheckerRef = useRef<any>(null);
  const lastSpokenAtRef = useRef<number | null>(null);
  const explicitStopRef = useRef(false);
  const sessionTranscriptRef = useRef<string>("");

  const EndTime = Number(interview.duration?.replace("m", "") || 5) * 60 * 1000 + Date.now();
  const [timeLeft, setTimeLeft] = useState<number>(EndTime - Date.now());
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [lastQuestionFlag, setLastQuestionFlag] = useState(false);
  const [endPending, setEndPending] = useState(false);

  const post = interview.post;
  const job_description = interview.jobDescription;
  const resumeData = interview.resumeData;
  const questions = interview.questionsList;
  const force_next = false;

  // Initialize browser detection and speech recognition manager
  useEffect(() => {
    const initBrowser = async () => {
      const info = await getBrowserInfo();
      setBrowserInfo(info);
      
      // Initialize recognition manager with full browser info
      recognitionManager.current = new SpeechRecognitionManager(info);
      setRecognitionAvailable(recognitionManager.current.isRecognitionAvailable());
      
      // Show Brave-specific warning
      if (info.isBrave && !braveWarningShown) {
        setBraveWarningShown(true);
        toast((t) => (
          <div className="space-y-2">
            <p className="font-semibold">🛡️ Brave Browser Detected</p>
            <p className="text-sm">For best experience:</p>
            <ul className="text-xs space-y-1 list-disc list-inside">
              <li>Disable Shields for this site</li>
              <li>Allow microphone permissions</li>
              <li>If voice fails, use text input</li>
            </ul>
          </div>
        ), {
          duration: 8000,
          icon: '🛡️',
        });
      }
      
      // Log browser detection for debugging
      console.log('Browser initialization complete:', {
        browser: info.browserName,
        speechRecognitionAvailable: recognitionManager.current?.isRecognitionAvailable()
      });
    };
    
    initBrowser();
  }, []);

  // Request microphone permission
  useEffect(() => {
    const requestMicrophonePermission = async () => {
      if (typeof window === 'undefined' || !navigator.mediaDevices) {
        setApiError("Microphone access not supported in this browser");
        setLoading(false);
        return;
      }

      try {
        setAwaitingPermission(true);
        
        toast.loading('Please allow microphone access to start the interview...', {
          duration: 4000,
        });

        // Request microphone access with enhanced permissions for Brave
        const constraints = browserInfo.isBrave ? {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 16000, // Explicit sample rate for Brave
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

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Immediately stop the stream - we just needed permission
        stream.getTracks().forEach(track => track.stop());
        
        setMicrophoneGranted(true);
        setAwaitingPermission(false);
        toast.success('Microphone access granted!', {
          duration: 2000,
        });
        
      } catch (error: any) {
        console.error('Microphone permission error:', error);
        setAwaitingPermission(false);
        
        if (error.name === 'NotAllowedError') {
          const message = browserInfo.isBrave 
            ? "Microphone permission denied. Please disable Brave Shields and allow microphone access."
            : "Microphone permission denied. Please allow microphone access and refresh the page.";
          setApiError(message);
          toast.error(message, {
            duration: 7000,
          });
        } else {
          setApiError("Failed to access microphone. Please check permissions.");
          toast.error('Failed to access microphone. Please check browser permissions.', {
            duration: 5000,
          });
        }
        setLoading(false);
      }
    };

    requestMicrophonePermission();
  }, [browserInfo.isBrave]);

  // TTS with enhanced Brave support
  const speak = (text: string) => {
    if (interviewEnded || !microphoneGranted) return;
    
    window.speechSynthesis.cancel();
    
    const utter = new window.SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = browserInfo.isBrave ? 1.0 : 1.05; // Slightly slower for Brave
    utter.onend = () => {
      if (!interviewEnded && !endPending && microphoneGranted) {
        // Longer delay for Brave to ensure speech is fully complete
        setTimeout(() => {
          startListening();
        }, browserInfo.isBrave ? 1200 : 800);
      }
    };
    utter.onerror = (error) => {
      console.error('Speech synthesis error:', error);
      if (!interviewEnded && !endPending && microphoneGranted) {
        setTimeout(() => {
          startListening();
        }, browserInfo.isBrave ? 1200 : 800);
      }
    };
    window.speechSynthesis.speak(utter);
  };

  // Initialize interview with enhanced error handling
  useEffect(() => {
    const initInterview = async () => {
      if (!microphoneGranted || messages.length > 0) return;
      
      setAgentThinking(true);
      console.log('Initializing interview:', {
        post,
        interviewType: interview.interviewType,
        questionsCount: questions?.length || 0,
        timestamp: new Date().toISOString()
      });
      
      try {
        // API call with timeout (30 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_AGENT_API_URL}/api/interview/next`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            post,
            job_description,
            resumeData,
            questions,
            messages: [],
            interview_type: interview.interviewType,
            time_left: timeLeft,
            force_next
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error('Interview initialization API error:', {
            status: res.status,
            statusText: res.statusText,
            errorData,
            timestamp: new Date().toISOString()
          });
          
          // User-friendly error messages based on status code
          let errorMessage = 'Failed to initialize interview. ';
          if (res.status === 500) {
            errorMessage += 'The interview service is experiencing issues.';
          } else if (res.status === 503) {
            errorMessage += 'The interview service is temporarily unavailable.';
          } else if (res.status === 429) {
            errorMessage += 'Too many requests. Please wait a moment.';
          } else {
            errorMessage += `Server returned error ${res.status}.`;
          }
          errorMessage += ' Please refresh the page to try again.';
          
          throw new Error(errorMessage);
        }
        
        const data = await res.json();
        
        console.log('Interview initialized successfully:', {
          questionId: data.data.question_id,
          lastQuestion: data.data.lastQuestion,
          timestamp: new Date().toISOString()
        });
        
        setMessages([{
          role: "interviewer",
          content: data.data.AIResponse,
          question_id: data.data.question_id
        }]);
        setLastQuestionFlag(!!data.data.lastQuestion);
        
        // Clear any previous errors on successful initialization
        setApiError(null);
        
        speak(data.data.AIResponse);
      } catch (err: any) {
        console.error('Interview initialization error:', {
          error: err,
          message: err.message,
          name: err.name,
          timestamp: new Date().toISOString()
        });
        
        let errorMessage = "Failed to initialize interview. ";
        
        if (err.name === 'AbortError') {
          errorMessage = "Interview initialization timed out after 30 seconds. The service is taking too long to respond. Please refresh the page and try again.";
        } else if (err.message.includes('fetch') || err.message.includes('network')) {
          errorMessage = "Network error during initialization. Please check your internet connection and refresh the page.";
        } else if (err.message.includes('Failed to initialize')) {
          // Use the detailed error message from the status code handling
          errorMessage = err.message;
        } else {
          errorMessage = "Interview agent is not working. Please refresh the page and try again.";
        }
        
        setApiError(errorMessage);
        setMessages([{ role: "interviewer", content: errorMessage }]);
        toast.error(errorMessage, { duration: 7000 });
      } finally {
        setLoading(false);
        setAgentThinking(false);
      }
    };
    
    if (microphoneGranted && messages.length === 0) {
      initInterview();
    }
    
    // Cleanup on component unmount (Requirement 12.5)
    return () => {
      console.log('Component unmounting - calling cleanup');
      cleanup();
    };
  }, [microphoneGranted]);

  // Timer with automatic interview termination at 30 seconds (Requirement 11.2)
  useEffect(() => {
    if (interviewEnded || !microphoneGranted) return;
    
    // Automatic interview end at 30 seconds (Requirement 11.2)
    if (timeLeft <= 30000 && !endPending && !agentThinking) {
      console.log('Time limit reached (30 seconds), automatically ending interview');
      setEndPending(true);
      
      // Stop any ongoing speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn('Error stopping recognition on time limit:', e);
        }
      }
      
      // Cancel any ongoing TTS
      window.speechSynthesis.cancel();
      
      toast.loading('Time limit reached. Ending interview...', { duration: 3000 });
      
      // End interview automatically
      setTimeout(() => {
        endInterview(true);
      }, 500);
      return;
    }
    
    // Normal timer countdown
    if (timeLeft <= 0 && !agentThinking && !isMicOn) {
      if (!endPending) endInterview(true);
      return;
    }
    
    const timer = setInterval(() => setTimeLeft((t) => t - 1000), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, interviewEnded, agentThinking, isMicOn, endPending, microphoneGranted]);

  // ENHANCED MIC LOGIC WITH BRAVE-SPECIFIC HANDLING
  const startListening = () => {
    if (!microphoneGranted) {
      toast.error('Microphone permission required.');
      return;
    }

    // Reset state for new listening session
    browserRestartRef.current = 0;
    sessionTranscriptRef.current = ""; // Clear session transcript (Requirement 5.5)
    lastSpokenAtRef.current = null; // Reset timestamp tracking (Requirement 5.1)
    explicitStopRef.current = false;
    setNetworkRetryCount(0);
    
    console.log('Starting new listening session with clean state');

    let hasSpokenSomething = false;
    let recognitionErrorOccurred = false;
    let networkErrorCount = 0;

    const recognition = recognitionManager.current?.createInstance();
    
    if (!recognition) {
      console.error('Speech recognition not available');
      handleRecognitionFallback();
      return;
    }

    recognitionRef.current = recognition;

    recognition.onstart = () => {
      console.log('Speech recognition started');
      recognitionErrorOccurred = false;
      setIsListening(true);
      setIsMicOn(true);
      lastSpokenAtRef.current = Date.now();
    };

    recognition.onresult = (event: any) => {
      console.log('Speech recognition result received');
      
      // Reset silence timer on ANY speech result (including interim results)
      // This implements Requirements 5.1 and 5.4
      lastSpokenAtRef.current = Date.now();
      hasSpokenSomething = true;

      let finalTranscript = "";
      let hasInterimResults = false;
      
      // For Brave, prioritize final results
      if (browserInfo.isBrave) {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + " ";
          }
        }
      } else {
        // For other browsers, process both interim and final results
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            hasInterimResults = true;
            // Log interim results for debugging
            console.log('Interim result detected:', transcript);
          }
        }
      }

      // Accumulate session transcript (Requirement 5.5)
      if (finalTranscript.trim()) {
        sessionTranscriptRef.current += finalTranscript;
        console.log('Session transcript updated:', sessionTranscriptRef.current);
      }
      
      // Log silence timer reset for interim results (Requirement 5.4)
      if (hasInterimResults) {
        console.log('Silence timer reset on interim result');
      }
    };

    recognition.onerror = (event: any) => {
      const errorType = event?.error || 'unknown';
      const errorMessage = event?.message || 'No error message provided';
      
      // Comprehensive error logging for all error types
      console.error("Speech recognition error:", {
        type: errorType,
        message: errorMessage,
        browser: browserInfo.browserName,
        timestamp: new Date().toISOString(),
        networkRetryCount: networkErrorCount,
        hasSpokenSomething,
        sessionTranscript: sessionTranscriptRef.current
      });
      
      recognitionErrorOccurred = true;

      // NETWORK ERROR HANDLING WITH EXPONENTIAL BACKOFF
      if (errorType === 'network') {
        networkErrorCount++;
        setNetworkRetryCount(networkErrorCount);
        
        console.log(`Network error detected (attempt ${networkErrorCount}/3)`, {
          browser: browserInfo.browserName,
          isBrave: browserInfo.isBrave
        });
        
        // Try to restart recognition with exponential backoff
        if (networkErrorCount < 3) {
          // Exponential backoff: 500ms, 1000ms, 1500ms
          const backoffDelay = 500 * networkErrorCount;
          
          toast.loading(`Reconnecting... (${networkErrorCount}/3)`, {
            duration: backoffDelay + 500,
          });
          
          console.log(`Retrying with exponential backoff: ${backoffDelay}ms`);
          
          // Don't stop immediately - try to restart with backoff
          setTimeout(() => {
            try {
              const newRecognition = recognitionManager.current?.createInstance();
              if (newRecognition) {
                recognitionRef.current = newRecognition;
                // Reattach all handlers
                setupRecognitionHandlers(newRecognition);
                newRecognition.start();
                console.log(`Speech recognition restarted after ${backoffDelay}ms delay`);
              }
            } catch (e) {
              console.error("Failed to restart after network error:", e);
              handleRecognitionFallback();
            }
          }, backoffDelay);
          return;
        } else {
          // After 3 attempts, automatically switch to fallback mode
          console.log('Network error retry limit reached (3/3), switching to fallback mode');
          
          // Enhanced message for Brave users
          if (browserInfo.isBrave) {
            toast((t) => (
              <div className="space-y-2">
                <p className="font-semibold">🛡️ Voice Recognition Failed in Brave</p>
                <p className="text-sm">After 3 attempts, voice recognition is unavailable.</p>
                <p className="text-sm font-medium">Please use text input or click Retry.</p>
              </div>
            ), {
              duration: 6000,
              icon: '⚠️',
            });
          } else {
            toast.error('Voice recognition unavailable. Switching to text input.', {
              duration: 4000,
            });
          }
          
          handleRecognitionFallback();
          return;
        }
      }

      // PERMISSION ERROR HANDLING (not-allowed)
      if (errorType === 'not-allowed') {
        console.error('Microphone permission denied:', {
          browser: browserInfo.browserName,
          isBrave: browserInfo.isBrave
        });
        
        setRecognitionAvailable(false);
        
        const permissionMessage = browserInfo.isBrave
          ? 'Microphone permission denied. Please disable Brave Shields and allow microphone access.'
          : 'Microphone permission denied. Please allow microphone access in your browser settings.';
        
        toast.error(permissionMessage, { duration: 7000 });
        setApiError(permissionMessage);
        
        explicitStopRef.current = true;
        try { 
          recognition.stop(); 
        } catch (e) { 
          /* ignore */ 
        }
        return;
      }

      // NO-SPEECH ERROR HANDLING
      if (errorType === 'no-speech') {
        console.log('No speech detected, moving to next question');
        explicitStopRef.current = true;
        try { 
          recognition.stop(); 
        } catch (e) { 
          /* ignore */ 
        }
        // Submit "no answer detected" to move to next question
        handleAnswer("No answer detected.");
        return;
      }

      // ABORTED ERROR (usually intentional stop)
      if (errorType === 'aborted') {
        console.log('Speech recognition aborted (intentional stop)');
        explicitStopRef.current = true;
        return;
      }

      // OTHER ERRORS - Log and display user-friendly message
      console.error(`Unhandled speech recognition error: ${errorType}`, {
        message: errorMessage,
        browser: browserInfo.browserName
      });
      
      toast.error(`Speech recognition error: ${errorType}`, { duration: 3000 });

      explicitStopRef.current = true;
      try { 
        recognition.stop(); 
      } catch (e) { 
        /* ignore */ 
      }
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      
      // Proper cleanup of silence checker interval (Requirement 5.2, 5.3)
      if (silenceCheckerRef.current) {
        clearInterval(silenceCheckerRef.current);
        silenceCheckerRef.current = null;
        console.log('Silence checker interval cleared');
      }

      setIsListening(false);
      setIsMicOn(false);

      const now = Date.now();
      // Browser-specific silence thresholds: 8s standard, 10s Brave
      const silenceThreshold = browserInfo.isBrave ? 10000 : 8000;
      const wasTrueSilence = explicitStopRef.current || 
                            (lastSpokenAtRef.current !== null && (now - lastSpokenAtRef.current) >= silenceThreshold);
      
      console.log('Recognition end analysis:', {
        explicitStop: explicitStopRef.current,
        lastSpokenAt: lastSpokenAtRef.current,
        silenceDuration: lastSpokenAtRef.current ? now - lastSpokenAtRef.current : null,
        silenceThreshold,
        wasTrueSilence,
        sessionTranscript: sessionTranscriptRef.current
      });

      // If network error occurred multiple times, use fallback
      if (recognitionErrorOccurred && networkErrorCount >= 3) {
        handleRecognitionFallback();
        return;
      }

      if (recognitionErrorOccurred && !hasSpokenSomething) {
        handleRecognitionFallback();
        return;
      }

      if (wasTrueSilence || hasSpokenSomething) {
        // Submit accumulated session transcript (Requirement 5.5)
        const finalAnswer = sessionTranscriptRef.current.trim();
        if (finalAnswer) {
          console.log('Submitting session transcript as answer:', {
            length: finalAnswer.length,
            transcript: finalAnswer
          });
          handleAnswer(finalAnswer);
        } else if (hasSpokenSomething) {
          console.log('Speech detected but transcript unclear');
          handleAnswer("Could not process the answer clearly.");
        } else {
          if (!recognitionErrorOccurred) {
            console.log('No speech detected during session');
            handleAnswer("No answer detected.");
          } else {
            handleRecognitionFallback();
          }
        }
        return;
      }

      // Attempt restart for premature endings (reduced for Brave)
      const maxRestarts = browserInfo.isBrave ? 1 : 2;
      if (browserRestartRef.current < maxRestarts) {
        browserRestartRef.current++;
        setTimeout(() => {
          try {
            const newRecognition = recognitionManager.current?.createInstance();
            if (newRecognition) {
              recognitionRef.current = newRecognition;
              setupRecognitionHandlers(newRecognition);
              newRecognition.start();
            }
          } catch (e) {
            console.error("Failed to restart recognition:", e);
            handleRecognitionFallback();
          }
        }, browserInfo.isBrave ? 500 : 300);
        return;
      }

      const finalAnswer = sessionTranscriptRef.current.trim();
      if (finalAnswer) {
        handleAnswer(finalAnswer);
      } else {
        handleRecognitionFallback();
      }
    };

    // Helper to setup handlers (for retry logic)
    const setupRecognitionHandlers = (rec: any) => {
      rec.onstart = recognition.onstart;
      rec.onresult = recognition.onresult;
      rec.onerror = recognition.onerror;
      rec.onend = recognition.onend;
    };

    // Start silence detection with browser-specific thresholds (Requirements 5.2, 5.3)
    // Clear any existing silence checker
    if (silenceCheckerRef.current) {
      clearInterval(silenceCheckerRef.current);
      silenceCheckerRef.current = null;
    }
    
    // Browser-specific silence thresholds: 8s standard, 10s Brave
    const silenceThreshold = browserInfo.isBrave ? 10000 : 8000;
    
    console.log(`Starting silence detection with ${silenceThreshold}ms threshold for ${browserInfo.browserName}`);
    
    // Continuous silence checker interval (Requirement 5.1, 5.2, 5.3)
    silenceCheckerRef.current = setInterval(() => {
      const lastSpoken = lastSpokenAtRef.current;
      
      if (lastSpoken) {
        const silenceDuration = Date.now() - lastSpoken;
        
        // Check if silence threshold exceeded
        if (silenceDuration >= silenceThreshold) {
          console.log(`Silence detected: ${silenceDuration}ms >= ${silenceThreshold}ms threshold`);
          explicitStopRef.current = true;
          
          try {
            if (recognitionRef.current) {
              recognitionRef.current.stop();
              console.log('Speech recognition stopped due to silence');
            }
          } catch (e) {
            console.warn('Error stopping recognition on silence:', e);
          }
        }
      }
    }, 1000); // Check every second for continuous monitoring

    // Start recognition
    try {
      console.log('Starting speech recognition...');
      recognition.start();
    } catch (e) {
      console.error("Failed to start recognition:", e);
      setIsListening(false);
      setIsMicOn(false);
      handleRecognitionFallback();
    }
  };

  const handleRecognitionFallback = () => {
    console.log('Using manual input fallback');
    setUseFallback(true);
    setShowManualInput(true);
    
    toast((t) => (
      <div className="space-y-2">
        <p className="font-semibold">Voice recognition unavailable</p>
        <p className="text-sm">Please use the text input box to type your answer.</p>
      </div>
    ), {
      duration: 5000,
      icon: '⌨️',
    });
  };

  const handleManualSubmit = () => {
    if (manualInputText.trim()) {
      handleAnswer(manualInputText.trim());
      setManualInputText("");
      setShowManualInput(false);
      setUseFallback(false);
    } else {
      toast.error('Please enter your answer');
    }
  };

  // Main interview logic with enhanced error handling (Requirement 7.2)
  const handleAnswer = async (userText: string, isRetry: boolean = false) => {
    console.log('Handling answer:', { userText, isRetry, apiRetryCount });
    setAgentThinking(true);
    setShowManualInput(false);
    setShowRetryButton(false); // Hide retry button while processing
    setIsRetrying(isRetry);
    
    // Only add message if not a retry (to avoid duplicates)
    if (!isRetry) {
      setMessages(prevMsgs => [...prevMsgs, { role: "candidate", content: userText }]);
    }

    // Prepare request data
    const currentMessages = isRetry && lastFailedRequest 
      ? lastFailedRequest.messages 
      : [...messages, { role: "candidate", content: userText }];

    try {
      // API call with timeout handling (30 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_AGENT_API_URL}/api/interview/next`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post, job_description, resumeData,
          questions,
          messages: currentMessages,
          interview_type: interview.interviewType,
          time_left: EndTime - Date.now(),
          force_next,
          lastQuestionAnswered: lastQuestionFlag
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Enhanced API error handling with specific status codes
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.detail || `API returned ${res.status}`;
        
        console.error('API Error:', {
          status: res.status,
          statusText: res.statusText,
          errorMessage,
          timestamp: new Date().toISOString(),
          isRetry,
          apiRetryCount
        });
        
        // User-friendly error messages based on status code
        let userMessage = 'Failed to get AI response. ';
        let canRetry = true;
        
        if (res.status === 500) {
          userMessage += 'The interview service is experiencing issues.';
        } else if (res.status === 503) {
          userMessage += 'The interview service is temporarily unavailable.';
        } else if (res.status === 429) {
          userMessage += 'Too many requests. Please wait a moment before retrying.';
        } else if (res.status >= 400 && res.status < 500) {
          userMessage += 'Invalid request. Please contact support.';
          canRetry = false; // Don't allow retry for client errors
        } else {
          userMessage += 'An unexpected error occurred.';
        }
        
        // Store failed request for retry
        if (canRetry && !isRetry) {
          setLastFailedRequest({
            userText,
            messages: currentMessages,
            timestamp: Date.now()
          });
          setShowRetryButton(true);
          userMessage += ' You can retry or continue with text input.';
        } else if (canRetry && isRetry) {
          setShowRetryButton(true);
          userMessage += ' Please try again or use text input.';
        }
        
        setApiError(userMessage);
        toast.error(userMessage, { duration: 6000 });
        
        // Preserve interview state - don't terminate
        setAgentThinking(false);
        setEndPending(false);
        
        // Offer fallback to text input after a delay
        if (!showManualInput && canRetry) {
          setTimeout(() => {
            if (!showManualInput) {
              setShowManualInput(true);
              toast('You can continue with text input', { duration: 3000 });
            }
          }, 3000);
        }
        return;
      }
      
      const data = await res.json();
      
      // Log successful API response
      console.log('API Response received:', {
        questionId: data.data.question_id,
        endInterview: data.data.endInterview,
        lastQuestion: data.data.lastQuestion,
        timestamp: new Date().toISOString(),
        wasRetry: isRetry
      });
      
      const aiResponse = {
        role: "interviewer",
        content: data.data.AIResponse,
        question_id: data.data.question_id
      };
      
      setMessages(prevMsgs => [...prevMsgs, aiResponse]);
      
      // Handle last question flag from backend (Requirement 11.1)
      if (data.data.lastQuestion) {
        console.log('Last question flag received from backend - this is the final question');
        setLastQuestionFlag(true);
      } else {
        setLastQuestionFlag(false);
      }
      
      // Clear any previous API errors and retry state on success
      setApiError(null);
      setApiRetryCount(0);
      setLastFailedRequest(null);
      setShowRetryButton(false);
      setIsRetrying(false);

      // Handle interview end from backend (Requirements 11.2, 11.3)
      if (data.data.endInterview) {
        console.log('Interview end signal received from backend');
        setEndPending(true);
        
        const utterance = new SpeechSynthesisUtterance(data.data.AIResponse);
        window.speechSynthesis.speak(utterance);
        utterance.onend = () => {
          toast.loading('Saving interview transcript...', { duration: 3000 });
          endInterview(true);
        };
      } else {
        speak(data.data.AIResponse);
      }
    } catch (err: any) {
      // Enhanced error logging with context
      console.error('API Error:', {
        error: err,
        message: err.message,
        name: err.name,
        stack: err.stack,
        timestamp: new Date().toISOString(),
        userText,
        messagesCount: messages.length,
        isRetry,
        apiRetryCount
      });
      
      // Handle different error types with user-friendly messages
      let errorMessage = "Failed to get AI response. ";
      const canRetry = true;
      
      if (err.name === 'AbortError') {
        errorMessage = "Request timed out after 30 seconds. The interview service is taking too long to respond.";
        console.error('API request timeout after 30 seconds');
      } else if (err.message.includes('fetch') || err.message.includes('network')) {
        errorMessage = "Network error. Please check your internet connection.";
        console.error('Network fetch error:', err.message);
      } else {
        errorMessage = "Interview agent is not working. An unexpected error occurred.";
      }
      
      // Store failed request for retry
      if (canRetry && !isRetry) {
        setLastFailedRequest({
          userText,
          messages: currentMessages,
          timestamp: Date.now()
        });
        setShowRetryButton(true);
        errorMessage += ' You can retry or continue with text input.';
      } else if (canRetry && isRetry) {
        setShowRetryButton(true);
        errorMessage += ' Please try again or use text input.';
      }
      
      setApiError(errorMessage);
      toast.error(errorMessage, { duration: 6000 });
      
      // Preserve interview state - allow retry or manual completion
      setAgentThinking(false);
      setEndPending(false);
      setIsRetrying(false);
      
      // Offer fallback to text input after error
      if (!showManualInput) {
        setTimeout(() => {
          if (!showManualInput) {
            setShowManualInput(true);
            toast('You can continue with text input', { duration: 3000 });
          }
        }, 3000);
      }
    }
  };
  
  // Retry last failed API request with improved error handling
  const handleRetryLastRequest = () => {
    if (!lastFailedRequest) {
      toast.error('No failed request to retry');
      return;
    }
    
    // Check if request is too old (more than 5 minutes)
    const requestAge = Date.now() - lastFailedRequest.timestamp;
    if (requestAge > 300000) {
      toast.error('Request is too old to retry. Please continue with a new answer.');
      setLastFailedRequest(null);
      setShowRetryButton(false);
      setShowManualInput(true);
      return;
    }
    
    console.log('Retrying last failed request:', {
      userText: lastFailedRequest.userText,
      timestamp: lastFailedRequest.timestamp,
      age: requestAge,
      previousRetries: apiRetryCount
    });
    
    const newRetryCount = apiRetryCount + 1;
    
    // Limit retry attempts to prevent infinite loops
    if (newRetryCount > 3) {
      toast.error('Maximum retry attempts reached. Please use text input to continue.');
      setShowRetryButton(false);
      setShowManualInput(true);
      setLastFailedRequest(null);
      setApiRetryCount(0);
      return;
    }
    
    setApiRetryCount(newRetryCount);
    
    toast.loading(`Retrying request (attempt ${newRetryCount}/3)...`, { duration: 2000 });
    
    // Clear error state before retry
    setApiError(null);
    
    // Retry with the stored request data
    handleAnswer(lastFailedRequest.userText, true);
  };

  // Comprehensive cleanup function with proper resource management (Requirement 12.5)
  const cleanup = () => {
    console.log('Cleaning up interview resources:', {
      timestamp: new Date().toISOString(),
      hasRecognition: !!recognitionRef.current,
      hasSilenceChecker: !!silenceCheckerRef.current,
      hasSilenceTimer: !!silenceTimerRef.current
    });
    
    // Stop speech recognition with proper error handling
    try {
      if (recognitionRef.current) {
        // Try abort first (more forceful), then stop
        if (recognitionRef.current.abort) {
          recognitionRef.current.abort();
        }
        recognitionRef.current.stop();
        console.log('Speech recognition stopped successfully');
      }
    } catch (e) { 
      console.warn('Error stopping speech recognition during cleanup:', e);
    }
    
    // Cancel all TTS utterances to prevent audio after cleanup
    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        console.log('TTS utterances cancelled successfully');
      }
    } catch (e) {
      console.warn('Error cancelling TTS during cleanup:', e);
    }
    
    // Clear all timers and intervals with proper cleanup
    // This includes silence checker and any other timers
    try {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        clearInterval(silenceTimerRef.current);
        silenceTimerRef.current = null;
        console.log('Silence timer cleared');
      }
      
      if (silenceCheckerRef.current) {
        clearInterval(silenceCheckerRef.current);
        silenceCheckerRef.current = null;
        console.log('Silence checker interval cleared');
      }
    } catch (e) {
      console.warn('Error clearing timers during cleanup:', e);
    }
    
    // Null all references to prevent memory leaks
    try {
      recognitionRef.current = null;
      lastSpokenAtRef.current = null;
      explicitStopRef.current = false;
      sessionTranscriptRef.current = "";
      browserRestartRef.current = 0;
      console.log('All references nulled successfully');
    } catch (e) {
      console.warn('Error nulling references during cleanup:', e);
    }
    
    console.log('Cleanup complete - all resources released');
  };

  const endInterview = async (auto = false) => {
    if (interviewEnded) return;
    setInterviewEnded(true);
    
    // Call cleanup to release all resources before ending interview (Requirement 12.5)
    console.log('Ending interview - calling cleanup to release resources');
    cleanup();

    const toastId = toast.loading('Saving interview transcript...');
    
    // Log interview conclusion (Requirements 11.4, 11.5)
    console.log('Ending interview:', {
      auto,
      messagesCount: messages.length,
      interviewId: id,
      timeLeft: Math.max(0, Math.floor(timeLeft / 1000)),
      lastQuestionAnswered: lastQuestionFlag,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Save transcript with timeout (15 seconds)
      const transcriptController = new AbortController();
      const transcriptTimeout = setTimeout(() => transcriptController.abort(), 15000);
      
      const transcriptRes = await fetch(`/api/interview/${id}/update-transcript`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
        signal: transcriptController.signal
      });

      clearTimeout(transcriptTimeout);

      if (!transcriptRes.ok) {
        const errorData = await transcriptRes.json().catch(() => ({}));
        console.error('Failed to save transcript:', {
          status: transcriptRes.status,
          errorData,
          timestamp: new Date().toISOString()
        });
        
        // Provide specific error message based on status
        let transcriptError = 'Failed to save transcript. ';
        if (transcriptRes.status === 500) {
          transcriptError += 'Server error occurred.';
        } else if (transcriptRes.status === 404) {
          transcriptError += 'Interview not found.';
        } else {
          transcriptError += `Error ${transcriptRes.status}.`;
        }
        
        throw new Error(transcriptError);
      }
      
      // Transcript saved successfully (Requirement 11.4)
      console.log('Transcript saved successfully to database:', {
        interviewId: id,
        messagesCount: messages.length,
        timestamp: new Date().toISOString()
      });

      toast.loading('Generating interview feedback...', { id: toastId });
      
      // Generate feedback with timeout (30 seconds)
      const feedbackController = new AbortController();
      const feedbackTimeout = setTimeout(() => feedbackController.abort(), 30000);
      
      const feedbackRes = await fetch(`${process.env.NEXT_PUBLIC_AGENT_API_URL}/api/feedback/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post,
          jobDescription: interview.jobDescription,
          resume_data: interview.resumeData,
          transcript: messages,
          question_list: questions,
          interview_type: interview.interviewType
        }),
        signal: feedbackController.signal
      });

      clearTimeout(feedbackTimeout);

      if (!feedbackRes.ok) {
        const errorData = await feedbackRes.json().catch(() => ({}));
        console.error('Failed to generate feedback:', {
          status: feedbackRes.status,
          errorData,
          timestamp: new Date().toISOString()
        });
        
        // Provide specific error message based on status
        let feedbackError = 'Failed to generate feedback. ';
        if (feedbackRes.status === 500) {
          feedbackError += 'AI service error.';
        } else if (feedbackRes.status === 503) {
          feedbackError += 'Service temporarily unavailable.';
        } else {
          feedbackError += `Error ${feedbackRes.status}.`;
        }
        
        throw new Error(feedbackError);
      }
      
      const feedbackData = await feedbackRes.json();
      
      // Feedback generated successfully (Requirement 11.5)
      console.log('Feedback generated successfully by Interview Agent:', {
        interviewId: id,
        hasFeedback: !!feedbackData.feedback,
        timestamp: new Date().toISOString()
      });

      // Save feedback with timeout (15 seconds) (Requirement 11.5)
      const saveFeedbackController = new AbortController();
      const saveFeedbackTimeout = setTimeout(() => saveFeedbackController.abort(), 15000);
      
      const saveFeedbackRes = await fetch(`/api/interview/${id}/save-feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: feedbackData.feedback }),
        signal: saveFeedbackController.signal
      });
      
      clearTimeout(saveFeedbackTimeout);
      
      if (!saveFeedbackRes.ok) {
        console.error('Failed to save feedback to database:', {
          status: saveFeedbackRes.status,
          timestamp: new Date().toISOString()
        });
        // Don't throw - feedback was generated, just not saved
        toast('Feedback generated but not saved. Check dashboard.', { 
          id: toastId, 
          duration: 4000,
          icon: '⚠️'
        });
      } else {
        // Feedback saved and redirecting to dashboard (Requirement 11.5)
        console.log('Feedback saved successfully to database:', {
          interviewId: id,
          timestamp: new Date().toISOString()
        });
        toast.success('Interview completed successfully!', { id: toastId });
      }
      
      // Redirect to dashboard (Requirement 11.5)
      console.log('Redirecting to dashboard after interview completion');
      
      // Refetch all interviews to update the dashboard with the newly completed interview
      await refetchInterviews();
      console.log('All interviews refetched successfully');
      
      setTimeout(() => {
        router.push("/dashboard");
      }, auto ? 3000 : 500);
    } catch (err: any) {
      console.error('Error completing interview:', {
        error: err,
        message: err.message,
        name: err.name,
        interviewId: id,
        timestamp: new Date().toISOString()
      });
      
      // Enhanced error messages with specific guidance
      let errorMessage = 'Error completing interview. ';
      let shouldRedirect = true;
      
      if (err.name === 'AbortError') {
        if (err.message?.includes('transcript')) {
          errorMessage += 'Transcript save timed out after 15 seconds. Your interview data may not be saved.';
        } else if (err.message?.includes('feedback')) {
          errorMessage += 'Feedback generation timed out after 30 seconds. Your transcript was saved.';
        } else {
          errorMessage += 'Request timed out. Some data may not be saved.';
        }
      } else if (err.message.includes('transcript')) {
        errorMessage = err.message + ' Your interview data may not be saved. Please contact support.';
        shouldRedirect = false; // Don't redirect if transcript wasn't saved
      } else if (err.message.includes('feedback')) {
        errorMessage = err.message + ' Your transcript was saved. You can check the dashboard.';
      } else if (err.message.includes('network') || err.message.includes('fetch')) {
        errorMessage += 'Network error. Please check your connection. Your data may not be saved.';
      } else {
        errorMessage += 'An unexpected error occurred. Please check your results in the dashboard.';
      }
      
      toast.error(errorMessage, { id: toastId, duration: 7000 });
      
      // Redirect to dashboard if appropriate
      if (shouldRedirect) {
        // Refetch all interviews before redirecting
        await refetchInterviews().catch(err => {
          console.error('Failed to refetch interviews:', err);
        });
        
        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
      } else {
        // Offer manual retry for critical failures
        toast((t) => (
          <div className="space-y-2">
            <p className="font-semibold">Critical Error</p>
            <p className="text-sm">{errorMessage}</p>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                // Reset state and allow user to try ending again
                setInterviewEnded(false);
                setEndPending(false);
              }}
              className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
            >
              Try Again
            </button>
          </div>
        ), {
          duration: 10000,
        });
      }
    }
  };

  const lastMessageRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (messages.length === 0) return;
    const t = setTimeout(() => {
      lastMessageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
    return () => clearTimeout(t);
  }, [messages]);

  // Cleanup on page unload/refresh (Requirement 12.5)
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('Page unloading - calling cleanup');
      cleanup();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Permission pending UI
  if (awaitingPermission || (!microphoneGranted && !apiError)) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <div className="text-center space-y-8 max-w-md mx-4">
          <div className="w-32 h-32 rounded-full bg-zinc-900 border-4 border-blue-500 flex items-center justify-center mx-auto">
            <MicOff className="w-16 h-16 text-blue-400" />
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-bold">Microphone Access Required</h1>
            <p className="text-zinc-400 text-lg">
              Please allow microphone access to start your AI interview.
            </p>
            {browserInfo.isBrave && (
              <div className="p-4 bg-yellow-900 border-2 border-yellow-700 rounded-lg space-y-2 shadow-xl">
                <p className="text-yellow-200 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  🛡️ Brave Browser Detected
                </p>
                <div className="text-yellow-100 text-sm space-y-1 text-left">
                  <p className="font-medium">Please follow these steps:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Click the Brave Shields icon (🛡️) in the address bar</li>
                    <li>Disable &#34;Shields&#34; for this site</li>
                    <li>Click &#34;Allow&#34; when prompted for microphone access</li>
                    <li>Refresh the page if needed</li>
                  </ol>
                  <p className="mt-2 text-xs text-yellow-200 italic">
                    Note: If voice fails, you can always use text input
                  </p>
                </div>
              </div>
            )}
          </div>
          <Spinner className="size-12 text-blue-500 mx-auto" />
        </div>
      </div>
    );
  }

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Spinner className="size-20 text-white" />
      </div>
    );

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      <ReloadGuard onBeforeReload={endInterview} />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col w-[380px] bg-zinc-950 border-r border-zinc-800 p-8 items-center justify-between">
          <div className="flex-1 flex flex-col items-center justify-center space-y-8">
            <div className="relative">
              <div className={`w-40 h-40 rounded-full bg-zinc-900 border-2 flex items-center justify-center transition-all duration-300 ${
                isMicOn ? 'border-white shadow-lg shadow-white/20 scale-105' : 'border-zinc-700'
              }`}>
                <User className="w-16 h-16 text-zinc-400" strokeWidth={1.5} />
              </div>
              {isMicOn && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full shadow-lg animate-pulse">
                    <Mic className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Listening</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-center space-y-3 max-w-xs">
              {/* Enhanced status message display with appropriate icons */}
              <div className="flex flex-col items-center gap-2">
                {showManualInput ? (
                  <div className="flex items-center gap-2 text-base font-medium text-white">
                    <Keyboard className="w-5 h-5 text-blue-400" />
                    <span>Type your answer below</span>
                  </div>
                ) : useFallback ? (
                  <div className="flex items-center gap-2 text-base font-medium text-white">
                    <Keyboard className="w-5 h-5 text-blue-400" />
                    <span>Please type your answer...</span>
                  </div>
                ) : apiError ? (
                  <div className="flex items-center gap-2 text-base font-medium text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <span>System error occurred</span>
                  </div>
                ) : endPending ? (
                  <div className="flex items-center gap-2 text-base font-medium text-white">
                    <Clock className="w-5 h-5 text-blue-400" />
                    <span>Finalizing interview...</span>
                  </div>
                ) : isMicOn ? (
                  <div className="flex items-center gap-2 text-base font-medium text-white">
                    <Mic className="w-5 h-5 text-green-400 animate-pulse" />
                    <span>Speak now...</span>
                  </div>
                ) : agentThinking ? (
                  <div className="flex items-center gap-2 text-base font-medium text-white">
                    <Spinner className="w-5 h-5 text-blue-400" />
                    <span>AI is processing your response</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-base font-medium text-white">
                    <Mic className="w-5 h-5 text-zinc-400" />
                    <span>Ready to listen</span>
                  </div>
                )}
              </div>
              
              {/* Network retry counter display with prominent styling */}
              {networkRetryCount > 0 && networkRetryCount < 3 && (
                <div className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-900/30 border border-yellow-700/50 rounded-lg">
                  <RefreshCw className="w-4 h-4 text-yellow-400 animate-spin" />
                  <span className="text-sm font-medium text-yellow-200">
                    Reconnecting... ({networkRetryCount}/3)
                  </span>
                </div>
              )}
              
              {/* Recognition unavailable warning */}
              {!recognitionAvailable && !useFallback && (
                <div className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-900/30 border border-orange-700/50 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-orange-400" />
                  <span className="text-sm text-orange-200">
                    Voice recognition unavailable
                  </span>
                </div>
              )}
            </div>

            {/* Retry button for recognition failures - enhanced for Brave */}
            {!recognitionAvailable && !showManualInput && (
              <button
                onClick={() => {
                  setRecognitionAvailable(true);
                  setNetworkRetryCount(0);
                  browserRestartRef.current = 0;
                  toast.success('Attempting to re-enable speech recognition');
                  console.log('Manual retry initiated - counters reset');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-lg"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Voice Recognition
              </button>
            )}
            
            {/* Retry button after network failures - Brave-specific */}
            {browserInfo.isBrave && networkRetryCount >= 3 && !showManualInput && !isMicOn && (
              <button
                onClick={() => {
                  setNetworkRetryCount(0);
                  browserRestartRef.current = 0;
                  setRecognitionAvailable(true);
                  setUseFallback(false);
                  toast.success('Retrying voice recognition...', { duration: 2000 });
                  console.log('Brave retry button clicked - all counters reset');
                  // Attempt to restart listening
                  setTimeout(() => {
                    if (!agentThinking && !isMicOn) {
                      startListening();
                    }
                  }, 500);
                }}
                className="flex items-center gap-2 px-5 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors shadow-lg border-2 border-yellow-500"
              >
                <RefreshCw className="w-5 h-5" />
                <span className="font-semibold">Retry Voice (0/3)</span>
              </button>
            )}
            
            {/* Retry button for failed API requests */}
            {showRetryButton && lastFailedRequest && !agentThinking && (
              <button
                onClick={handleRetryLastRequest}
                disabled={isRetrying}
                className="flex items-center gap-2 px-5 py-3 bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg transition-colors shadow-lg border-2 border-green-500 disabled:border-zinc-600"
              >
                <RefreshCw className={`w-5 h-5 ${isRetrying ? 'animate-spin' : ''}`} />
                <span className="font-semibold">
                  {isRetrying ? 'Retrying...' : `Retry Last Request ${apiRetryCount > 0 ? `(${apiRetryCount}/3)` : ''}`}
                </span>
              </button>
            )}
            
            {!isMicOn && !agentThinking && !showManualInput && (
              <button
                onClick={() => setShowManualInput(true)}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors border border-zinc-600"
              >
                <Keyboard className="w-4 h-4" />
                Type Answer Instead
              </button>
            )}
            
            {/* Manual completion option when API errors persist */}
            {apiError && apiRetryCount >= 2 && !agentThinking && (
              <button
                onClick={() => {
                  toast((t) => (
                    <div className="space-y-3">
                      <p className="font-semibold">Complete Interview Manually?</p>
                      <p className="text-sm">The interview service is experiencing issues. You can:</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            toast.dismiss(t.id);
                            endInterview(false);
                          }}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-sm font-medium"
                        >
                          End Interview Now
                        </button>
                        <button
                          onClick={() => {
                            toast.dismiss(t.id);
                            setShowManualInput(true);
                            setApiError(null);
                            setShowRetryButton(false);
                          }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium"
                        >
                          Continue with Text
                        </button>
                      </div>
                    </div>
                  ), {
                    duration: 10000,
                  });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors border border-orange-500"
              >
                <AlertCircle className="w-4 h-4" />
                Manual Completion Options
              </button>
            )}
          </div>

          <div className="w-full space-y-6">
            <div className={`flex items-center justify-center gap-3 px-6 py-4 rounded-xl border transition-all duration-300 ${
              timeLeft <= 120000 
                ? 'bg-red-900/30 border-red-700/50 shadow-lg shadow-red-500/20' 
                : 'bg-zinc-900 border-zinc-800'
            }`}>
              <Clock className={`w-5 h-5 transition-colors ${
                timeLeft <= 120000 ? 'text-red-400' : 'text-zinc-400'
              }`} />
              <div className="text-center">
                <div className={`text-2xl font-bold tracking-tight transition-colors ${
                  timeLeft <= 120000 ? 'text-red-400' : 'text-white'
                }`}>
                  {String(Math.max(0, Math.floor(timeLeft / 60000))).padStart(1, '0')}:
                  {String(Math.max(0, Math.floor((timeLeft % 60000) / 1000))).padStart(2, '0')}
                </div>
                <div className={`text-xs mt-0.5 transition-colors ${
                  timeLeft <= 120000 ? 'text-red-300' : 'text-zinc-500'
                }`}>
                  {timeLeft <= 120000 ? 'Time Running Low!' : 'Time Remaining'}
                </div>
              </div>
            </div>
            
            <button
              onClick={() => endInterview(false)}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-black rounded-xl font-medium hover:bg-zinc-200 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <PhoneOff className="w-5 h-5" />
              End Interview
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-zinc-950">
          <div className="border-b border-zinc-800 px-8 py-6 bg-zinc-950">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center transition-all duration-300 ${
                  agentThinking ? 'animate-pulse shadow-lg shadow-blue-500/50' : ''
                }`}>
                  <Bot className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">AI Interviewer</h2>
                  <p className="text-xs text-zinc-500">
                    {agentThinking ? 'Processing your response...' : 'Powered by advanced AI technology'}
                  </p>
                </div>
              </div>
              {browserInfo.isBrave && (
                <div 
                  className="flex items-center gap-2 px-3 py-1.5 bg-yellow-900/40 border border-yellow-600/60 rounded-full shadow-lg cursor-help"
                  title="Brave browser detected. Voice recognition may require Shields to be disabled."
                >
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs font-medium text-yellow-200">🛡️ Brave Browser</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
            <AnimatePresence initial={false} mode="popLayout">
              {messages.map((msg, idx) => {
                const isLast = idx === messages.length - 1;
                const isAI = msg.role === "interviewer";
                
                return (
                  <motion.div
                    key={idx}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ 
                      duration: 0.3,
                      ease: [0.4, 0.0, 0.2, 1],
                      layout: { duration: 0.2 }
                    }}
                    className={`flex ${isAI ? "justify-start" : "justify-end"}`}
                    ref={isLast ? lastMessageRef : undefined}
                  >
                    <motion.div 
                      layout
                      className={`max-w-[75%] rounded-2xl px-6 py-4 shadow-lg transition-all duration-200 ${
                        isAI
                          ? "bg-white text-black hover:shadow-xl"
                          : "bg-zinc-900 text-white border-2 border-zinc-700 hover:border-zinc-600 hover:shadow-xl"
                      }`}
                    >
                      {/* Role indicator with icon */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          isAI ? "bg-black" : "bg-white"
                        }`}>
                          {isAI ? (
                            <Bot className={`w-4 h-4 ${isAI ? "text-white" : "text-black"}`} />
                          ) : (
                            <User className={`w-4 h-4 ${isAI ? "text-white" : "text-black"}`} />
                          )}
                        </div>
                        <span className={`text-xs font-bold uppercase tracking-wider ${
                          isAI ? "text-black/70" : "text-white/70"
                        }`}>
                          {isAI ? "AI Interviewer" : "You"}
                        </span>
                      </div>
                      
                      {/* Message content */}
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.2 }}
                        className="text-sm leading-relaxed whitespace-pre-wrap"
                      >
                        {msg.content}
                      </motion.p>
                    </motion.div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {/* API Error Display with enhanced information */}
            {apiError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex justify-center"
              >
                <div className="bg-red-950 border-2 border-red-800 text-red-200 px-6 py-4 rounded-xl text-sm shadow-lg max-w-md">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="font-semibold text-base">API Error</span>
                  </div>
                  <p className="mb-3">{apiError}</p>
                  {showRetryButton && (
                    <div className="text-xs text-red-300 bg-red-900/50 px-3 py-2 rounded border border-red-700">
                      <p className="font-medium mb-1">What you can do:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li>Click &#34;Retry Last Request&#34; to try again</li>
                        <li>Use &#34;Type Answer Instead&#34; to continue with text</li>
                        {apiRetryCount >= 2 && <li>Click &#34;Manual Completion Options&#34; to end or continue</li>}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Manual Input Area */}
          {showManualInput && (
            <div className="border-t border-zinc-800 p-6 bg-zinc-900 shadow-lg">
              <div className="max-w-4xl mx-auto space-y-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-900/30 border border-blue-700/50 rounded-lg">
                  <Keyboard className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-blue-200">Type your answer below and press Send (or Enter)</span>
                </div>
                <div className="flex gap-3">
                  <textarea
                    value={manualInputText}
                    onChange={(e) => setManualInputText(e.target.value)}
                    placeholder="Type your answer here..."
                    className="flex-1 bg-zinc-800 border-2 border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none transition-all"
                    rows={3}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleManualSubmit();
                      }
                    }}
                    autoFocus
                  />
                  <button
                    onClick={handleManualSubmit}
                    disabled={!manualInputText.trim()}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-xl font-medium transition-all shadow-lg hover:shadow-xl disabled:shadow-none"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}