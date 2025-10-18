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
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const [isMicOn, setIsMicOn] = useState(false);

  const {interview,setInterview}=useInterviewCon()

  const [apiError, setApiError] = useState<string | null>(null);

  const userName = interview.name;
  const post = interview.post;
  const job_description = interview.jobDescription;
  const resumeData = interview.resumeData;
  const questions = interview.questionsList;

  const router=useRouter()

  const speak = (text: string) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 1.05;
    window.speechSynthesis.speak(utter);
  };

  // --- Initialize Interview ---
  
  useEffect(() => {
    const initInterview = async () => {
      try {
                  console.log(JSON.stringify({
          post,
          job_description,
          resumeData,
          questions,
          messages: [],
        }))
        const res = await fetch(`${process.env.NEXT_PUBLIC_AGENT_API_URL}/api/interview/next`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            post,
            job_description,
            resumeData,
            questions,
            messages: [],
            interview_type:interview.interviewType,
            duration:interview.duration
          }),
        });

        if (!res.ok) throw new Error(`API returned ${res.status}`);

        const data = await res.json();
        const aiMsg = { role: "interviewer", content: data.AIResponse };
        setMessages([aiMsg]);
        speak(`Welcome ${userName}! ${data.AIResponse}`);
      } catch (err) {
        console.error("Interview agent initialization failed:", err);
        setApiError("Interview agent is not working.");
        setMessages([{ role: "interviewer", content: "Interview agent is not working." }]);
      } finally {
        setLoading(false);
      }
    };

    initInterview();
  }, []);

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech Recognition not supported in your browser.");
      return;
    }

    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.resultIndex][0].transcript.trim();
      console.log("User said:", transcript);

      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        console.log("10s silence detected - sending to backend...");
        recognition.stop();
        sendToAI(transcript);
      }, 10000);
    };

    recognition.onend = () => {
      setIsListening(false);
      setIsMicOn(false);
    };

    recognition.start();
    setIsListening(true);
    setIsMicOn(true);
    console.log("Listening...");
  };

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
                      interview_type:interview.interviewType,
            duration:interview.duration
        }),
      });
      

      if (!res.ok) throw new Error(`API returned ${res.status}`);

      const data = await res.json();
      const aiMsg = { role: "interviewer", content: data.AIResponse };
      setMessages((prev) => [...prev, aiMsg]);
      speak(data.AIResponse);
    } catch (err) {
      console.error("Failed to fetch AI response:", err);
      const errorMsg = { role: "interviewer", content: "Interview agent is not working." };
      setMessages((prev) => [...prev, errorMsg]);
      setApiError("Interview agent is not working.");
    }
  };

  if (loading)
    return (
      <div className="flex h-[100vh] items-center justify-center">
        <Spinner className="size-20" />
      </div>
    );

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* HEADER */}
     <InterviewHeader post={post as string}/>

      {/* BODY */}
      <div className="flex flex-1 p-4">
        {/* Left: User */}
        <div className="flex flex-col w-1/3 items-center justify-center border-r">
          <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="w-10 h-10 text-blue-600" />
          </div>
          <Button
            onClick={startListening}
            className="mt-4"
            variant={isMicOn ? "default" : "secondary"}
          >
            {isMicOn ? <Mic /> : <MicOff />}{" "}
            {isMicOn ? "Listening..." : "Start Speaking"}
          </Button>
        </div>

        {/* Right: Chat */}
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
              {apiError && (
                <div className="text-red-600 text-sm mt-2">{apiError}</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* END INTERVIEW BUTTON */}
      <div className="p-3 border-t flex justify-center bg-white">
        <Button variant="destructive" onClick={()=>{
          router.push("/dashboard")
        }}>
          <PhoneOff className="w-4 h-4 mr-2" /> End Interview
        </Button>
      </div>
    </div>
  );
}
