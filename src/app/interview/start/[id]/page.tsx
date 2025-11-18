"use client";
import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, User, PhoneOff, Mic, Clock, MicOff, RefreshCw, AlertCircle, Keyboard } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useInterviewCon } from "@/context/InterviewContext";
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

// Enhanced Browser detection with async Brave detection
const getBrowserInfo = async () => {
  if (typeof window === 'undefined') return { isBrave: false, isChrome: false, isFirefox: false, isSafari: false };
  
  const userAgent = navigator.userAgent;
  const isChrome = userAgent.includes('Chrome') && !userAgent.includes('Edg');
  const isFirefox = userAgent.includes('Firefox');
  const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
  
  // Proper async Brave detection
  let isBrave = false;
  if (window.brave && typeof window.brave.isBrave === 'function') {
    try {
      isBrave = await window.brave.isBrave();
    } catch (e) {
      console.warn('Brave detection failed:', e);
    }
  }
  
  // Fallback Brave detection
  if (!isBrave && userAgent.includes('Brave')) {
    isBrave = true;
  }
  
  return { isBrave, isChrome, isFirefox, isSafari };
};

// Speech recognition support check
const isSpeechRecognitionSupported = () => {
  if (typeof window === 'undefined') return false;
  return ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
};

// Enhanced speech recognition with Brave-specific handling
class SpeechRecognitionManager {
  private recognition: any = null;
  private isSupported: boolean = false;
  private isAvailable: boolean = false;
  private isBrave: boolean = false;

  constructor(isBrave: boolean = false) {
    this.isBrave = isBrave;
    this.isSupported = isSpeechRecognitionSupported();
    if (this.isSupported) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      try {
        this.recognition = new SpeechRecognition();
        this.isAvailable = true;
      } catch (error) {
        console.error('Failed to initialize SpeechRecognition:', error);
        this.isAvailable = false;
      }
    }
  }

  createInstance() {
    if (!this.isAvailable) return null;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Brave-optimized configuration
    if (this.isBrave) {
      recognition.continuous = false;
      recognition.interimResults = false; // Disable interim results for Brave
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
    } else {
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
    }
    
    return recognition;
  }

  isRecognitionAvailable() {
    return this.isAvailable;
  }
}

export default function Page() {
  const { interview } = useInterviewCon();
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
  const [browserInfo, setBrowserInfo] = useState({ isBrave: false, isChrome: false, isFirefox: false, isSafari: false });
  const [microphoneGranted, setMicrophoneGranted] = useState(false);
  const [awaitingPermission, setAwaitingPermission] = useState(false);
  const [recognitionAvailable, setRecognitionAvailable] = useState(true);
  const [useFallback, setUseFallback] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualInputText, setManualInputText] = useState("");
  const [braveWarningShown, setBraveWarningShown] = useState(false);
  const [networkRetryCount, setNetworkRetryCount] = useState(0);

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
      
      // Initialize recognition manager with Brave flag
      recognitionManager.current = new SpeechRecognitionManager(info.isBrave);
      setRecognitionAvailable(recognitionManager.current.isRecognitionAvailable());
      
      // Show Brave-specific warning
      if (info.isBrave && !braveWarningShown) {
        setBraveWarningShown(true);
        toast((t) => (
          <div className="space-y-2">
            <p className="font-semibold">Brave Browser Detected</p>
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

  // Initialize interview
  useEffect(() => {
    const initInterview = async () => {
      if (!microphoneGranted || messages.length > 0) return;
      
      setAgentThinking(true);
      try {
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
        });
        if (!res.ok) throw new Error(`API returned ${res.status}`);
        const data = await res.json();
        setMessages([{
          role: "interviewer",
          content: data.data.AIResponse,
          question_id: data.data.question_id
        }]);
        setLastQuestionFlag(!!data.data.lastQuestion);
        speak(data.data.AIResponse);
      } catch (err) {
        setApiError("Interview agent is not working.");
        setMessages([{ role: "interviewer", content: "Interview agent is not working." }]);
      } finally {
        setLoading(false);
        setAgentThinking(false);
      }
    };
    
    if (microphoneGranted && messages.length === 0) {
      initInterview();
    }
    
    return cleanup;
  }, [microphoneGranted]);

  // Timer
  useEffect(() => {
    if (interviewEnded || !microphoneGranted) return;
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

    // Reset state
    browserRestartRef.current = 0;
    sessionTranscriptRef.current = "";
    lastSpokenAtRef.current = null;
    explicitStopRef.current = false;
    setNetworkRetryCount(0);

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
      lastSpokenAtRef.current = Date.now();
      hasSpokenSomething = true;

      let finalTranscript = "";
      
      // For Brave, prioritize final results
      if (browserInfo.isBrave) {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + " ";
          }
        }
      } else {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          }
        }
      }

      if (finalTranscript.trim()) {
        sessionTranscriptRef.current += finalTranscript;
        console.log('Current transcript:', sessionTranscriptRef.current);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Recognition error:", event?.error);
      recognitionErrorOccurred = true;

      // BRAVE-SPECIFIC NETWORK ERROR HANDLING
      if (event.error === 'network' && browserInfo.isBrave) {
        networkErrorCount++;
        setNetworkRetryCount(networkErrorCount);
        
        console.log(`Brave network error (attempt ${networkErrorCount}/3)`);
        
        // Try to restart recognition for Brave network errors
        if (networkErrorCount < 3) {
          toast.loading(`Reconnecting speech recognition... (${networkErrorCount}/3)`, {
            duration: 2000,
          });
          
          // Don't stop immediately - try to restart
          setTimeout(() => {
            try {
              const newRecognition = recognitionManager.current?.createInstance();
              if (newRecognition) {
                recognitionRef.current = newRecognition;
                // Reattach all handlers
                setupRecognitionHandlers(newRecognition);
                newRecognition.start();
              }
            } catch (e) {
              console.error("Failed to restart after network error:", e);
              handleRecognitionFallback();
            }
          }, 500);
          return;
        } else {
          // After 3 attempts, offer manual input
          toast.error('Voice recognition unavailable. Please use text input.', {
            duration: 4000,
          });
          handleRecognitionFallback();
          return;
        }
      }

      // Handle other errors
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        toast.error(`Speech recognition error: ${event.error}`, { duration: 3000 });
      }

      if (event.error === 'not-allowed') {
        setRecognitionAvailable(false);
        toast.error('Microphone permission denied. Please allow access.', { duration: 5000 });
      }

      explicitStopRef.current = true;
      try { 
        recognition.stop(); 
      } catch (e) { 
        /* ignore */ 
      }
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      
      if (silenceCheckerRef.current) {
        clearInterval(silenceCheckerRef.current);
        silenceCheckerRef.current = null;
      }

      setIsListening(false);
      setIsMicOn(false);

      const now = Date.now();
      const silenceThreshold = browserInfo.isBrave ? 10000 : 8000; // Longer threshold for Brave
      const wasTrueSilence = explicitStopRef.current || 
                            (lastSpokenAtRef.current !== null && (now - lastSpokenAtRef.current) >= silenceThreshold);

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
        const finalAnswer = sessionTranscriptRef.current.trim();
        if (finalAnswer) {
          console.log('Submitting answer:', finalAnswer);
          handleAnswer(finalAnswer);
        } else if (hasSpokenSomething) {
          handleAnswer("Could not process the answer clearly.");
        } else {
          if (!recognitionErrorOccurred) {
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

    // Start silence detection (longer for Brave)
    if (silenceCheckerRef.current) {
      clearInterval(silenceCheckerRef.current);
    }
    
    const silenceCheckInterval = browserInfo.isBrave ? 10000 : 8000;
    silenceCheckerRef.current = setInterval(() => {
      const last = lastSpokenAtRef.current;
      if (last && Date.now() - last >= silenceCheckInterval) {
        explicitStopRef.current = true;
        try {
          if (recognitionRef.current) recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    }, 1000);

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

  // Main interview logic
  const handleAnswer = async (userText: string) => {
    console.log('Handling answer:', userText);
    setAgentThinking(true);
    setShowManualInput(false);
    
    setMessages(prevMsgs => [...prevMsgs, { role: "candidate", content: userText }]);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AGENT_API_URL}/api/interview/next`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post, job_description, resumeData,
          questions,
          messages: [...messages, { role: "candidate", content: userText }],
          interview_type: interview.interviewType,
          time_left: EndTime - Date.now(),
          force_next,
          lastQuestionAnswered: lastQuestionFlag
        }),
      });
      
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      
      const data = await res.json();
      const aiResponse = {
        role: "interviewer",
        content: data.data.AIResponse,
        question_id: data.data.question_id
      };
      
      setMessages(prevMsgs => [...prevMsgs, aiResponse]);
      setLastQuestionFlag(!!data.data.lastQuestion);

      if (data.data.endInterview) {
        const utterance = new SpeechSynthesisUtterance(data.data.AIResponse);
        window.speechSynthesis.speak(utterance);
        utterance.onend = () => {
          toast.loading('Saving interview transcript...', { duration: 3000 });
          endInterview(true);
        };
      } else {
        speak(data.data.AIResponse);
      }
    } catch (err) {
      console.error('API Error:', err);
      setApiError("Interview agent is not working.");
      toast.error('Failed to get AI response');
    } finally {
      setAgentThinking(false);
      setEndPending(false);
    }
  };

  // Cleanup
  const cleanup = () => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort && recognitionRef.current.abort();
        recognitionRef.current.stop();
      }
    } catch (e) { 
      console.warn('Cleanup warning:', e);
    }
    
    window.speechSynthesis.cancel();
    recognitionRef.current = null;
    
    [silenceTimerRef, silenceCheckerRef].forEach(ref => {
      if (ref.current) {
        clearTimeout(ref.current);
        clearInterval(ref.current);
        ref.current = null;
      }
    });
    
    lastSpokenAtRef.current = null;
    explicitStopRef.current = false;
  };

  const endInterview = async (auto = false) => {
    if (interviewEnded) return;
    setInterviewEnded(true);
    cleanup();

    const toastId = toast.loading('Saving interview transcript...');
    try {
      const transcriptRes = await fetch(`/api/interview/${id}/update-transcript`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });

      if (!transcriptRes.ok) throw new Error('Failed to save transcript');

      toast.loading('Generating interview feedback...', { id: toastId });
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
      });

      if (!feedbackRes.ok) throw new Error('Failed to generate feedback');
      const feedbackData = await feedbackRes.json();

      await fetch(`/api/interview/${id}/save-feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: feedbackData.feedback }),
      });

      toast.success('Interview completed successfully!', { id: toastId });
      setTimeout(() => {
        router.push("/dashboard");
      }, auto ? 3000 : 500);
    } catch (err) {
      console.error(err);
      toast.error('Error completing interview', { id: toastId });
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
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
              <div className="p-4 bg-yellow-900 border border-yellow-700 rounded-lg space-y-2">
                <p className="text-yellow-200 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Brave Browser Detected
                </p>
                <div className="text-yellow-100 text-sm space-y-1 text-left">
                  <p>Please follow these steps:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Click the Brave Shields icon (🛡️) in the address bar</li>
                    <li>Disable &#34;Shields&#34; for this site</li>
                    <li>Click &#34;Allow&#34; when prompted for microphone access</li>
                    <li>Refresh the page if needed</li>
                  </ol>
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
                  <div className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full shadow-lg">
                    <Mic className="w-4 h-4 animate-pulse" />
                    <span className="text-sm font-medium">Listening</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-center space-y-3 max-w-xs">
              <p className="text-base font-medium text-white">
                {showManualInput
                  ? "Type your answer below"
                  : useFallback
                  ? "Please type your answer..."
                  : apiError
                  ? "System error occurred"
                  : endPending
                  ? "Finalizing interview..."
                  : isMicOn
                  ? "Speak now..."
                  : agentThinking
                  ? "AI is processing your response"
                  : "Your turn to respond"}
              </p>
              
              {browserInfo.isBrave && networkRetryCount > 0 && (
                <p className="text-sm text-yellow-500">
                  Brave network retry: {networkRetryCount}/3
                </p>
              )}
              
              {!recognitionAvailable && !useFallback && (
                <p className="text-sm text-yellow-500">
                  Voice recognition unavailable. Using text input.
                </p>
              )}
            </div>

            {!recognitionAvailable && !showManualInput && (
              <button
                onClick={() => {
                  setRecognitionAvailable(true);
                  setNetworkRetryCount(0);
                  toast.success('Attempting to re-enable speech recognition');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Voice Recognition
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
          </div>

          <div className="w-full space-y-6">
            <div className="flex items-center justify-center gap-3 px-6 py-4 bg-zinc-900 rounded-xl border border-zinc-800">
              <Clock className="w-5 h-5 text-zinc-400" />
              <div className="text-center">
                <div className="text-2xl font-bold tracking-tight">
                  {String(Math.max(0, Math.floor(timeLeft / 60000))).padStart(1, '0')}:
                  {String(Math.max(0, Math.floor((timeLeft % 60000) / 1000))).padStart(2, '0')}
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">Time Remaining</div>
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
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                  <Bot className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">AI Interviewer</h2>
                  <p className="text-xs text-zinc-500">Powered by advanced AI technology</p>
                </div>
              </div>
              {browserInfo.isBrave && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-900/30 border border-yellow-700/50 rounded-full">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs text-yellow-200">Brave Browser</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => {
                const isLast = idx === messages.length - 1;
                return (
                  <motion.div
                    key={idx}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.16 }}
                    className={`flex ${msg.role === "candidate" ? "justify-end" : "justify-start"}`}
                    ref={isLast ? lastMessageRef : undefined}
                  >
                    <motion.div layout className={`max-w-[75%] rounded-2xl px-6 py-4 shadow-lg ${
                      msg.role === "interviewer"
                        ? "bg-white text-black"
                        : "bg-zinc-800 text-white border border-zinc-700"
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {msg.role === "interviewer" ? (
                          <Bot className="w-4 h-4" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                        <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
                          {msg.role === "interviewer" ? "AI Interviewer" : "You"}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    </motion.div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {apiError && (
              <div className="flex justify-center">
                <div className="bg-red-950 border border-red-800 text-red-200 px-6 py-3 rounded-xl text-sm">
                  {apiError}
                </div>
              </div>
            )}
          </div>

          {/* Manual Input Area */}
          {showManualInput && (
            <div className="border-t border-zinc-800 p-6 bg-zinc-900">
              <div className="max-w-4xl mx-auto space-y-4">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Keyboard className="w-4 h-4" />
                  <span>Type your answer below and press Send</span>
                </div>
                <div className="flex gap-3">
                  <textarea
                    value={manualInputText}
                    onChange={(e) => setManualInputText(e.target.value)}
                    placeholder="Type your answer here..."
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 resize-none"
                    rows={3}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleManualSubmit();
                      }
                    }}
                  />
                  <button
                    onClick={handleManualSubmit}
                    disabled={!manualInputText.trim()}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-xl font-medium transition-colors"
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