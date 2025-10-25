"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { Bot, User, PhoneOff, Mic, Clock, CheckCircle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import InterviewHeader from "@/components/InterviewHeader";
import { useInterviewCon } from "@/context/InterviewContext";
import { useParams, useRouter } from "next/navigation";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

interface Message {
  role: "interviewer" | "candidate";
  content: string;
  question_id?: number;
  isFinalQuestion?: boolean;
}

export default function Page() {
  const { interview } = useInterviewCon();
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [agentThinking, setAgentThinking] = useState(false);
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [isProcessingAnswer, setIsProcessingAnswer] = useState(false);
  const [isFinalQuestionAsked, setIsFinalQuestionAsked] = useState(false);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const isSpeakingRef = useRef(false);
  const shouldEndAfterSpeechRef = useRef(false);

  const interviewDuration = Number(interview.duration?.replace("m", "") || 5) * 60 * 1000;
  const [endTime] = useState<number>(Date.now() + interviewDuration);
  const [timeLeft, setTimeLeft] = useState<number>(interviewDuration);

  const post = interview.post;
  const job_description = interview.jobDescription;
  const resumeData = interview.resumeData;
  const questions = interview.questionsList;
  const interview_type = interview.interviewType || "technical";

  const SILENCE_TIMEOUT = 3000;
  const MIN_RESPONSE_LENGTH = 10;

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    isSpeakingRef.current = false;
  }, []);

  const speak = useCallback((text: string, onComplete?: () => void) => {
    if (interviewEnded) return;

    stopSpeaking();

    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    isSpeakingRef.current = true;

    utterance.onend = () => {
      isSpeakingRef.current = false;

      if (shouldEndAfterSpeechRef.current) {
        endInterview(true);
        return;
      }

      if (onComplete) {
        onComplete();
      }
    };

    utterance.onerror = () => {
      isSpeakingRef.current = false;
      if (onComplete) {
        onComplete();
      }
    };

    window.speechSynthesis.speak(utterance);
  }, [interviewEnded]);

  const cleanup = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore errors during cleanup
      }
      recognitionRef.current = null;
    }
    stopSpeaking();
    setIsListening(false);
    setIsMicOn(false);
    clearTimeout(silenceTimerRef.current);
  }, [stopSpeaking]);

  const startListening = useCallback(() => {
    if (interviewEnded || isProcessingAnswer || isSpeakingRef.current) {
      return;
    }

    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      setApiError("Speech Recognition is not supported in your browser.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let fullTranscript = "";

    recognition.onstart = () => {
      setIsListening(true);
      setIsMicOn(true);
      fullTranscript = "";
    };

    recognition.onresult = (event: any) => {
      const lastResult = event.results[event.results.length - 1];
      if (lastResult.isFinal) {
        const transcript = lastResult[0].transcript.trim();
        if (transcript) {
          fullTranscript = fullTranscript ? `${fullTranscript} ${transcript}` : transcript;
        }
      }

      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      }, SILENCE_TIMEOUT);
    };

    recognition.onend = () => {
      clearTimeout(silenceTimerRef.current);
      setIsListening(false);
      setIsMicOn(false);

      const finalTranscript = fullTranscript.trim();

      if (!finalTranscript || finalTranscript.length < MIN_RESPONSE_LENGTH) {
        handleAnswer("No answer detected.");
      } else {
        handleAnswer(finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      clearTimeout(silenceTimerRef.current);
      setIsListening(false);
      setIsMicOn(false);

      if (event.error === "no-speech") {
        handleAnswer("No answer detected.");
      } else if (event.error === "aborted") {
        // User manually stopped or interview ended
      } else {
        handleAnswer("Sorry, could not hear any response.");
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [interviewEnded, isProcessingAnswer]);

  const handleAnswer = useCallback(async (userText: string) => {
    if (isProcessingAnswer || interviewEnded) {
      return;
    }

    setIsProcessingAnswer(true);
    setAgentThinking(true);

    const newMessages: Message[] = [
      ...messages,
      { role: "candidate", content: userText }
    ];
    setMessages(newMessages);

    try {
      const currentTimeLeft = endTime - Date.now();

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_AGENT_API_URL}/api/interview/next`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            post,
            job_description,
            resumeData,
            questions,
            messages: newMessages,
            interview_type,
            time_left: Math.max(0, currentTimeLeft),
            force_next: false
          }),
        }
      );

      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }

      const data = await res.json();
      const aiMessage: Message = {
        role: "interviewer",
        content: data.data.AIResponse,
        question_id: data.data.question_id,
        isFinalQuestion: data.data.isFinalQuestion || false
      };

      setMessages((prev) => [...prev, aiMessage]);
      setAgentThinking(false);
      setIsProcessingAnswer(false);

      if (data.data.isFinalQuestion) {
        setIsFinalQuestionAsked(true);
      }

      if (data.data.endInterview) {
        shouldEndAfterSpeechRef.current = true;
        speak(data.data.AIResponse);
      } else {
        speak(data.data.AIResponse, () => {
          if (!interviewEnded) {
            startListening();
          }
        });
      }
    } catch (err) {
      console.error("Interview agent error:", err);
      setApiError("Connection to interview agent failed. Please try again.");
      setAgentThinking(false);
      setIsProcessingAnswer(false);
    }
  }, [
    isProcessingAnswer,
    interviewEnded,
    messages,
    endTime,
    post,
    job_description,
    resumeData,
    questions,
    interview_type,
    speak,
    startListening
  ]);

  const endInterview = useCallback(async (auto: boolean = false) => {
    if (interviewEnded) return;

    setInterviewEnded(true);
    cleanup();

    try {
      await fetch(`${process.env.NEXT_PUBLIC_URL}/api/interview/${id}/update-transcript`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
    } catch (err) {
      console.error("Failed to save transcript:", err);
    }

    setTimeout(() => {
      router.push("/dashboard");
    }, auto ? 2000 : 500);
  }, [interviewEnded, cleanup, messages, id, router]);

  useEffect(() => {
    const initInterview = async () => {
      setAgentThinking(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_AGENT_API_URL}/api/interview/next`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              post,
              job_description,
              resumeData,
              questions,
              messages: [],
              interview_type,
              time_left: interviewDuration,
              force_next: false
            }),
          }
        );

        if (!res.ok) {
          throw new Error(`API returned ${res.status}`);
        }

        const data = await res.json();
        const initialMessage: Message = {
          role: "interviewer",
          content: data.data.AIResponse,
          question_id: data.data.question_id,
          isFinalQuestion: data.data.isFinalQuestion || false
        };

        setMessages([initialMessage]);
        setLoading(false);
        setAgentThinking(false);

        if (data.data.isFinalQuestion) {
          setIsFinalQuestionAsked(true);
        }

        speak(data.data.AIResponse, () => {
          if (!interviewEnded) {
            startListening();
          }
        });
      } catch (err) {
        console.error("Failed to initialize interview:", err);
        setApiError("Failed to start interview. Please refresh and try again.");
        setMessages([
          {
            role: "interviewer",
            content: "Interview agent is currently unavailable."
          }
        ]);
        setLoading(false);
        setAgentThinking(false);
      }
    };

    initInterview();

    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (interviewEnded) return;

    const timer = setInterval(() => {
      const remaining = endTime - Date.now();
      setTimeLeft(remaining);

      if (remaining <= 0 && !agentThinking && !isMicOn && !isSpeakingRef.current) {
        endInterview(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [interviewEnded, endTime, agentThinking, isMicOn, endInterview]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Spinner className="size-20 text-white" />
      </div>
    );
  }

  const minutes = Math.max(0, Math.floor(timeLeft / 60000));
  const seconds = Math.max(0, Math.floor((timeLeft % 60000) / 1000));

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      <InterviewHeader post={post as string} />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col w-[380px] bg-zinc-950 border-r border-zinc-800 p-8 items-center justify-between">
          <div className="flex-1 flex flex-col items-center justify-center space-y-8">
            <div className="relative">
              <div
                className={`w-40 h-40 rounded-full bg-zinc-900 border-2 flex items-center justify-center transition-all duration-300 ${
                  isMicOn
                    ? "border-white shadow-lg shadow-white/20 scale-105"
                    : "border-zinc-700"
                }`}
              >
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
                {apiError
                  ? "Connection error occurred"
                  : interviewEnded
                  ? "Interview completed"
                  : agentThinking
                  ? "AI is thinking..."
                  : isMicOn
                  ? "Speak your answer clearly"
                  : "Waiting for your response"}
              </p>
              {agentThinking && (
                <p className="text-sm text-zinc-500">
                  Processing your response
                </p>
              )}
              {isFinalQuestionAsked && !interviewEnded && (
                <div className="flex items-center justify-center gap-2 mt-4 px-4 py-2 bg-amber-950 border border-amber-700 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-amber-500" />
                  <span className="text-xs text-amber-300 font-medium">
                    Final Question
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="w-full space-y-6">
            <div className="flex items-center justify-center gap-3 px-6 py-4 bg-zinc-900 rounded-xl border border-zinc-800">
              <Clock className="w-5 h-5 text-zinc-400" />
              <div className="text-center">
                <div className="text-2xl font-bold tracking-tight">
                  {minutes}:{String(seconds).padStart(2, "0")}
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  Time Remaining
                </div>
              </div>
            </div>

            <button
              onClick={() => endInterview(false)}
              disabled={interviewEnded}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-black rounded-xl font-medium hover:bg-zinc-200 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PhoneOff className="w-5 h-5" />
              End Interview
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-zinc-950">
          <div className="border-b border-zinc-800 px-8 py-6 bg-zinc-950">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                <Bot className="w-6 h-6 text-black" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">AI Interviewer</h2>
                <p className="text-xs text-zinc-500">
                  Powered by advanced AI technology
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "candidate" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-6 py-4 shadow-lg ${
                    msg.role === "interviewer"
                      ? "bg-white text-black"
                      : "bg-zinc-800 text-white border border-zinc-700"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {msg.role === "interviewer" ? (
                      <Bot className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                    <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
                      {msg.role === "interviewer" ? "AI Interviewer" : "You"}
                    </span>
                    {msg.isFinalQuestion && msg.role === "interviewer" && (
                      <span className="ml-2 px-2 py-0.5 bg-amber-500 text-black text-xs font-bold rounded">
                        FINAL
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}
            {agentThinking && (
              <div className="flex justify-start">
                <div className="bg-white text-black px-6 py-4 rounded-2xl shadow-lg">
                  <div className="flex items-center gap-3">
                    <Bot className="w-4 h-4" />
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            {apiError && (
              <div className="flex justify-center">
                <div className="bg-red-950 border border-red-800 text-red-200 px-6 py-3 rounded-xl text-sm">
                  {apiError}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
