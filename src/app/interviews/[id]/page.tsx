"use client";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { useInterviewConAll } from "@/context/InterviewAllContext";
import Userbutton from "@/components/Userbutton";
import { useSession } from "next-auth/react";
import { Session } from "next-auth";
import { InterviewQuestion, transcriptTypeMsg } from "@/types";

export default function InterviewDetailsPage() {
  const params = useParams();
  const { interviews } = useInterviewConAll();
  const [interview, setInterview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { data: session } = useSession();

  console.log(params);
  console.log(interviews);
  
  
  useEffect(() => {
    if (interviews && params.id) {
      const found = interviews.find((i) => i.id === params.id);
      setInterview(found || null);
      setLoading(false);
    }
  }, [params.id, interviews]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Spinner className="size-20 text-white" />
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        Interview not found
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <Userbutton session={session as Session} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Title Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{interview.post}</h1>
            <p className="text-zinc-400">
              Created on {formatDate(interview.createdAt)}
            </p>
          </div>

          {/* Interview Details */}
          <div className="space-y-6">
            {/* Status & Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                <p className="text-sm text-zinc-400 mb-2">Status</p>
                <p className="text-lg font-medium capitalize">
                  {interview.status}
                </p>
              </div>
              <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                <p className="text-sm text-zinc-400 mb-2">Duration</p>
                <p className="text-lg font-medium">{interview.duration}</p>
              </div>
            </div>

            {/* Interview Type */}
            <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
              <p className="text-sm text-zinc-400 mb-2">Interview Type</p>
              <p className="text-lg font-medium capitalize">
                {interview.interviewType}
              </p>
            </div>

            {/* Job Description */}
            <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
              <p className="text-sm text-zinc-400 mb-2">Job Description</p>
              <div className="prose prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{interview.jobDescription}</p>
              </div>
            </div>

            {/* Resume Data */}
            <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
              <p className="text-sm text-zinc-400 mb-2">Resume</p>
              <div className="prose prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{interview.resumeData}</p>
              </div>
            </div>

            {/* Transcript */}
            {interview.transcript && (
              <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                <p className="text-sm text-zinc-400 mb-4">Interview Transcript</p>
                <div className="space-y-4">
                  {interview.transcript.map((msg:transcriptTypeMsg, idx:number) => (
                    <div key={idx} className="flex gap-4">
                      <span className="text-zinc-400 uppercase text-sm font-medium w-24">
                        {msg.role === "interviewer" ? "AI" : "You"}:
                      </span>
                      <p className="flex-1">{msg.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}