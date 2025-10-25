"use client";
import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, User, PhoneOff, Mic, Clock } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import InterviewHeader from "@/components/InterviewHeader";
import { useInterviewCon } from "@/context/InterviewContext";
import { useParams, useRouter } from "next/navigation";

declare global {
  interface Window { webkitSpeechRecognition: any; SpeechRecognition: any; }
}

export default function InterviewPage() {
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
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);

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

  const speak = (text: string) => {
    const utter = new window.SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 1.05;
    utter.onend = () => {
      if (!interviewEnded && !endPending) startListening();
    };
    window.speechSynthesis.speak(utter);
  };

  useEffect(() => {
    const initInterview = async () => {
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
    initInterview();
    return cleanup;
  }, []);

  useEffect(() => {
    if (interviewEnded) return;
    if (timeLeft <= 0 && !agentThinking && !isMicOn) {
      if (!endPending) endInterview(true);
      return;
    }
    if (timeLeft <= 0 && (agentThinking || isMicOn)) {
      setEndPending(true);
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1000), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, interviewEnded, agentThinking, isMicOn, endPending]);

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Speech Recognition not supported.");
      return;
    }
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    // start an initial silence timer: if user doesn't say anything for 7s consider "no answer"
    clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => recognition.stop(), 7000);

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.resultIndex][0].transcript.trim();
      recognitionRef.current.lastTranscript = transcript;
      // reset silence timer to 7s after each result chunk
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => recognition.stop(), 7000);
    };
    recognition.onend = () => {
      setIsListening(false);
      setIsMicOn(false);
      // if user produced some transcript, send it; otherwise send explicit no-answer marker
      if (recognitionRef.current?.lastTranscript) {
        handleAnswer(recognitionRef.current.lastTranscript);
        recognitionRef.current.lastTranscript = "";
      } else {
        handleAnswer("No answer detected.");
      }
    };
    recognition.onerror = (_event:any) => {
      setIsListening(false); setIsMicOn(false);
      handleAnswer("Sorry, could not hear any response.");
    };
    recognition.start();
    setIsListening(true); setIsMicOn(true);
  };

  const handleAnswer = async (userText: string) => {
    setAgentThinking(true);
    const newMessages = [...messages, { role: "candidate", content: userText }];
    setMessages(newMessages);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AGENT_API_URL}/api/interview/next`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post, job_description, resumeData,
          questions,
          messages: newMessages,
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
      setMessages((prev) => [...prev, aiResponse]);
      setLastQuestionFlag(!!data.data.lastQuestion);

      if (data.data.endInterview) {
        // Only speak the final message, don't start listening after
        const utterance = new SpeechSynthesisUtterance(data.data.AIResponse);
        utterance.onend = () => {
          toast.loading('Saving interview transcript...', { duration: 3000 });
          endInterview(true);
        };
        window.speechSynthesis.speak(utterance);
      } else {
        speak(data.data.AIResponse);
      }
    } catch (err) {
      setApiError("Interview agent is not working.");
    }
    setAgentThinking(false);
    setEndPending(false);
  };

  const cleanup = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    window.speechSynthesis.cancel();
    recognitionRef.current = null;
    clearTimeout(silenceTimerRef.current);
  };

  const endInterview = async (auto = false) => {
    if (interviewEnded) return;
    setInterviewEnded(true);
    cleanup();
    
    const toastId = toast.loading('Saving interview transcript...');
    
    try {
      await fetch(`${process.env.NEXT_PUBLIC_URL}/api/interview/${id}/update-transcript`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      
      toast.success('Transcript saved successfully!', { id: toastId });
      toast('Redirecting to dashboard...', { 
        icon: '👋',
        duration: 2000 
      });
    } catch (err) {
      toast.error('Failed to save transcript', { id: toastId });
    }
    
    setTimeout(() => {
      router.push("/dashboard");
    }, auto ? 3000 : 500);
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Spinner className="size-20 text-white" />
      </div>
    );

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      <InterviewHeader post={post as string} />

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
                {apiError
                  ? "System error occurred"
                  : endPending
                  ? "Finalizing interview..."
                  : isMicOn
                  ? "Speak clearly into your microphone"
                  : agentThinking
                  ? "AI is processing your response"
                  : "Your turn to respond"}
              </p>
              <p className="text-sm text-zinc-500">
                {agentThinking ? "Please wait while the AI prepares the next question" : ""}
              </p>
            </div>
          </div>

          <div className="w-full space-y-6">
            <div className="flex items-center justify-center gap-3 px-6 py-4 bg-zinc-900 rounded-xl border border-zinc-800">
              <Clock className="w-5 h-5 text-zinc-400" />
              <div className="text-center">
                <div className="text-2xl font-bold tracking-tight">
                  {Math.floor(timeLeft / 60000)}:{String(Math.floor((timeLeft % 60000) / 1000)).padStart(2, '0')}
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

        <div className="flex-1 flex flex-col bg-zinc-950">
          <div className="border-b border-zinc-800 px-8 py-6 bg-zinc-950">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                <Bot className="w-6 h-6 text-black" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">AI Interviewer</h2>
                <p className="text-xs text-zinc-500">Powered by advanced AI technology</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "candidate" ? "justify-end" : "justify-start"}`}
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
                  </div>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
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
