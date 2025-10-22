"use client";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, MicOff, Bot, User, PhoneOff } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import InterviewHeader from "@/components/InterviewHeader";
import { useInterviewCon } from "@/context/InterviewContext";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function InterviewPage() {
  const { interview } = useInterviewCon();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<{ role: string; content: string; question_id?: number }[]>([]);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);

  // --- TIME HANDLING ---
  const EndTime = Number(interview.duration?.replace("m", "") || 5) * 60 * 1000 + Date.now();
  const [timeLeft, setTimeLeft] = useState<number>(EndTime - Date.now());
  const [interviewEnded, setInterviewEnded] = useState(false);

  const post = interview.post;
  const job_description = interview.jobDescription;
  const resumeData = interview.resumeData;
  const questions = interview.questionsList;

  // ====
  // SET THIS TO TRUE TO FORCE SEQUENTIAL INTERVIEW; FALSE FOR HYBRID/FREE FLOW
  const force_next = false; // <-- CHANGE TO TRUE FOR SEQUENTIAL ONLY!
  // ====


  const speak = (text: string) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 1.05;
    window.speechSynthesis.speak(utter);
  };

  // ----------------- INIT INTERVIEW -----------------
  useEffect(() => {
    const initInterview = async () => {
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
            force_next // <<< --- Always send this to API!
          }),
        });
        if (!res.ok) throw new Error(`API returned ${res.status}`);
        const data = await res.json();
        // Use the returned question_id from backend
        const aiMsg = { role: "interviewer", content: data.data.AIResponse, question_id: data.data.question_id };
        setMessages([aiMsg]);
        speak(`${data.data.AIResponse}`);
      } catch (err) {
        console.error("Init failed:", err);
        setApiError("Interview agent is not working.");
        setMessages([{ role: "interviewer", content: "Interview agent is not working." }]);
      } finally {
        setLoading(false);
      }
    };
    initInterview();
    return cleanup;
  }, []);

  // ----------------- TIMER -----------------
  useEffect(() => {
    if (interviewEnded) return;
    if (timeLeft <= 0) {
      endInterview(true);
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1000), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, interviewEnded]);

  // ----------------- START LISTENING -----------------
  const startListening = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Speech Recognition not supported in your browser.");
      return;
    }
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      // Use latest result for transcript
      const transcript = event.results[event.resultIndex][0].transcript.trim();
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        recognition.stop();
        sendToAI(transcript);
      }, 10000); // 10s silence
    };

    recognition.onend = () => {
      setIsListening(false);
      setIsMicOn(false);
    };

    recognition.start();
    setIsListening(true);
    setIsMicOn(true);
  };

  // ----------------- SEND ANSWER TO AI -----------------
  const sendToAI = async (userText: string) => {
    const newMessages = [...messages, { role: "candidate", content: userText }];
    setMessages(newMessages);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AGENT_API_URL}/api/interview/next`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post,
          job_description,
          resumeData,
          questions,
          messages: newMessages,
          interview_type: interview.interviewType,
          time_left: timeLeft,
          force_next // <<< --- Always send this to API!
        }),
      });
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const data = await res.json();
      // Save both AI response and question_id for tracking
      const aiMsg = {
        role: "interviewer",
        content: data.data.AIResponse,
        question_id: data.data.question_id
      };
      setMessages((prev) => [...prev, aiMsg]);
      speak(data.data.AIResponse);
      console.log(data);
      

      if (data.data.endInterview) {
        setTimeout(() => endInterview(true), 5000);
      }
    } catch (err) {
      console.error("AI response failed:", err);
      const errorMsg = { role: "interviewer", content: "Interview agent is not working." };
      setMessages((prev) => [...prev, errorMsg]);
      setApiError("Interview agent is not working.");
    }
  };

  // ----------------- CLEANUP -----------------
  const cleanup = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    window.speechSynthesis.cancel();
    recognitionRef.current = null;
  };

  // ----------------- END INTERVIEW -----------------
  const endInterview = async (auto = false) => {
    if (interviewEnded) return;
    setInterviewEnded(true);
    cleanup();

    // Send final transcript
    try {
      await fetch(`${process.env.NEXT_PUBLIC_URL}/api/interview/update-transcript`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
    } catch (err) {
      console.error("Failed to update transcript:", err);
    }

    setTimeout(() => {
      router.push("/dashboard");
    }, auto ? 3000 : 500);
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
          <Button
            onClick={startListening}
            className="mt-4"
            variant={isMicOn ? "default" : "secondary"}
          >
            {isMicOn ? <Mic /> : <MicOff />} {isMicOn ? "Listening..." : "Start Speaking"}
          </Button>
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
                  }`}
                >
                  <b>{msg.role === "interviewer" ? "AI:" : "You:"}</b> {msg.content}
                </div>
              ))}
              {apiError && <div className="text-red-600 text-sm mt-2">{apiError}</div>}
            </CardContent>
          </Card>
        </div>
      </div>
      {/* FOOTER */}
      <div className="p-3 border-t flex justify-center bg-white">
        <Button variant="destructive" onClick={() => endInterview(false)}>
          <PhoneOff className="w-4 h-4 mr-2" /> End Interview
        </Button>
      </div>
    </div>
  );
}
