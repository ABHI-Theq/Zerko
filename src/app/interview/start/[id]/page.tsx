"use client";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, User, PhoneOff } from "lucide-react";
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

  // --- TIME HANDLING ---
  const EndTime = Number(interview.duration?.replace("m", "") || 5) * 60 * 1000 + Date.now();
  const [timeLeft, setTimeLeft] = useState<number>(EndTime - Date.now());
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [lastQuestionFlag, setLastQuestionFlag] = useState(false); // signal from backend
  const [endPending, setEndPending] = useState(false); // show "waiting for AI to finish/end" after timer is out

  const post = interview.post;
  const job_description = interview.jobDescription;
  const resumeData = interview.resumeData;
  const questions = interview.questionsList;
  const force_next = false;

  // -------- TTS + Next Listening ----------
  const speak = (text: string) => {
    const utter = new window.SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 1.05;
    utter.onend = () => {
      if (!interviewEnded && !endPending) startListening();
    };
    window.speechSynthesis.speak(utter);
  };

  // ------------- INIT INTERVIEW -------------
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
    // eslint-disable-next-line
  }, []);

  // ----------- TIMER: Now don't end instantly if endPending -----------
  useEffect(() => {
    if (interviewEnded) return;
    if (timeLeft <= 0 && !agentThinking && !isMicOn) {
      // Only truly end if not waiting for AI reply or user reply
      if (!endPending) endInterview(true);
      return;
    }
    if (timeLeft <= 0 && (agentThinking || isMicOn)) {
      // Timer out, but answer/chat not done!
      setEndPending(true);
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1000), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, interviewEnded, agentThinking, isMicOn, endPending]);

  // ----------- MIC LOGIC -----------
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
    recognition.onresult = (event: any) => {
      const transcript = event.results[event.resultIndex][0].transcript.trim();
      recognitionRef.current.lastTranscript = transcript;
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => recognition.stop(), 10000);
    };
    recognition.onend = () => {
      setIsListening(false);
      setIsMicOn(false);
      if (recognitionRef.current?.lastTranscript) {
        handleAnswer(recognitionRef.current.lastTranscript);
        recognitionRef.current.lastTranscript = "";
      } else {
        handleAnswer("No answer detected.");
      }
    };
    recognition.onerror = (_event:SpeechRecognition) => {
      setIsListening(false); setIsMicOn(false);
      handleAnswer("Sorry, could not hear any response.");
    };
    recognition.start();
    setIsListening(true); setIsMicOn(true);
  };

  // ---------- MAIN INTERVIEW LOGIC ----------
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
          force_next
        }),
      });
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const data = await res.json();
      setMessages((prev) => [...prev, {
        role: "interviewer",
        content: data.data.AIResponse,
        question_id: data.data.question_id
      }]);
      setLastQuestionFlag(!!data.data.lastQuestion);

      speak(data.data.AIResponse);

      if (data.data.endInterview) {
        setTimeout(() => endInterview(true), 8000); // let last message finish
      } else {
        // if timer had run out, but last interaction not finished, allow that to finish
        if (timeLeft <= 0) {
          setTimeout(() => endInterview(true), 8000); // ensures close after last message
        }
      }
    } catch (err) {
      setApiError("Interview agent is not working.");
    }
    setAgentThinking(false);
    setEndPending(false);
  };

  // --------- CLEANUP ETC ----------
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
    try {
      await fetch(`${process.env.NEXT_PUBLIC_URL}/api/interview/${id}/update-transcript`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
    } catch (err) { /* ignore */ }
    setTimeout(() => { router.push("/dashboard"); }, auto ? 3000 : 500);
  };

  if (loading)
    return (
      <div className="flex h-[100vh] items-center justify-center">
        <Spinner className="size-20" />
      </div>
    );

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <InterviewHeader post={post as string} />
      <div className="flex flex-1 p-4">
        {/* LEFT PANEL */}
        <div className="flex flex-col w-1/3 items-center justify-center border-r">
          <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="w-10 h-10 text-blue-600" />
          </div>
          <p className="mt-6 text-sm text-gray-700">
            {apiError
              ? "System error."
              : endPending
              ? "Interview ending... waiting for AI to finish."
              : isMicOn
              ? "Listening... Please answer the question."
              : agentThinking
              ? "Bot is thinking..."
              : "Waiting for your turn to answer."}
          </p>
          <p className="mt-2 text-xs text-gray-600">
            Time left: {Math.floor(timeLeft / 60000)}m {Math.floor((timeLeft % 60000) / 1000)}s
          </p>
        </div>
        {/* RIGHT PANEL */}
        <div className="flex flex-col flex-1 p-6 overflow-y-auto">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="w-6 h-6 text-purple-600" />
            <h2 className="font-semibold text-lg">AI Interviewer</h2>
          </div>
          <Card className="flex-1 overflow-y-auto">
            <CardContent className="space-y-3 p-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg max-w-[80%] shadow-sm text-sm ${
                    msg.role === "interviewer"
                      ? "bg-purple-100 text-purple-800 self-start"
                      : "bg-blue-100 text-blue-800 self-end ml-auto"
                  }`}>
                  <b>{msg.role === "interviewer" ? "AI:" : "You:"}</b> {msg.content}
                </div>
              ))}
              {apiError && <div className="text-red-600 text-sm mt-2">{apiError}</div>}
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="p-3 border-t flex justify-center bg-white">
        <button
          className="px-4 py-2 flex items-center gap-2 bg-red-600 text-white rounded"
          onClick={() => endInterview(false)}
        >
          <PhoneOff className="w-4 h-4 mr-2" /> End Interview
        </button>
      </div>
    </div>
  );
}
