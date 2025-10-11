"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter,useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {Spinner} from "@/components/ui/spinner"
import { Mic, MicOff, User, Bot, Timer, PhoneOff } from "lucide-react";
import { useInterview } from "@/features/hooks/interview";
import toast from "react-hot-toast";

export default function InterviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const {interview,loading,error}=useInterview(id as string)
  if(error){
    toast.error(error)
    return;
  }
  const duration=useSearchParams().get("duration")
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [transcript, setTranscript] = useState([
    { sender: "ai", text: "Welcome! Let's start your interview." } 
  ]);

  if(loading){
    return (
      <>
      <div className="w-full h-[100vh] flex items-center justify-center">
        <Spinner className="size-20"/>
      </div>
      </>
    )
  }


  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 bg-white shadow">
        <h1 className="text-lg font-semibold">Interview Session #{id}</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-mono text-lg">
            <Timer className="w-5 h-5 text-blue-600" /> {}
          </div>
          <Button variant="destructive" onClick={()=>{}}>
            <PhoneOff className="w-4 h-4 mr-2" /> End Interview
          </Button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex flex-1">
        {/* Left: User */}
        <div className="flex flex-col items-center justify-center w-1/2 border-r p-6">
          <div className="w-64 h-48 bg-gray-200 rounded-xl flex items-center justify-center shadow-inner">
            <User className="w-16 h-16 text-gray-500" />
          </div>
          <div className="flex gap-4 mt-4">
            <Button
              variant={isMicOn ? "default" : "secondary"}
              onClick={() => setIsMicOn((p) => !p)}
            >
              {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Right: AI + Transcript */}
        <div className="flex flex-col w-1/2 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bot className="w-8 h-8 text-purple-600" />
            <h2 className="text-xl font-semibold">AI Interviewer</h2>
          </div>

          <Card className="flex-1 overflow-y-auto">
            <CardContent className="p-4 space-y-3">
              {transcript.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg max-w-[80%] shadow-sm text-sm ${
                    msg.sender === "ai"
                      ? "bg-purple-100 text-purple-800 self-start"
                      : "bg-blue-100 text-blue-800 self-end ml-auto"
                  }`}
                >
                  <span className="font-semibold">
                    {msg.sender === "ai" ? "AI:" : "You:"}
                  </span>{" "}
                  {msg.text}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Optional text input */}
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              placeholder="Type your answer..."
              className="flex-1 border rounded-lg px-3 py-2"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  setTranscript((prev) => [
                    ...prev,
                    { sender: "user", text: e.currentTarget.value },
                  ]);
                  e.currentTarget.value = "";
                }
              }}
            />
            <Button
              onClick={() => {
                const input = document.querySelector("input");
                if (input && input.value.trim()) {
                  setTranscript((prev) => [
                    ...prev,
                    { sender: "user", text: input.value },
                  ]);
                  input.value = "";
                }
              }}
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}