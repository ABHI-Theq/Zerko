"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, Clock, Calendar, Briefcase, FileText, MessageSquare } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { useInterviewConAll } from "@/context/InterviewAllContext";
import Userbutton from "@/components/Userbutton";
import { useSession } from "next-auth/react";
import { Session } from "next-auth";
import { InterviewQuestion, transcriptTypeMsg } from "@/types";

export default function Page() {
  const params = useParams();
  const { interviews } = useInterviewConAll();
  const [interview, setInterview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { data: session } = useSession();

  console.log(params);

  useEffect(() => {
    if (interviews && params.id) {
      const found = interviews.find((i) => i.id === params.id);
      setInterview(found || null);
      console.log(interview);
      setLoading(false);
    }
  }, [params.id, interviews]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-950">
        <Spinner className="size-20 text-neutral-400" />
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-950">
        <div className="text-center">
          <p className="text-xl text-neutral-400">Interview not found</p>
        </div>
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
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-neutral-400 hover:text-white transition-all duration-200 hover:gap-3"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
            <Userbutton session={session as Session} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Title Section with subtle gradient */}
          <div className="mb-12 pb-8 border-b border-neutral-800/50">
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent">
              {interview.post}
            </h1>
            <div className="flex items-center gap-2 text-neutral-500">
              <Calendar className="w-4 h-4" />
              <p className="text-sm">
                Created on {formatDate(interview.createdAt)}
              </p>
            </div>
          </div>

          {/* Interview Details */}
          <div className="space-y-6">
            {/* Status & Duration Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="group bg-gradient-to-br from-neutral-900 to-neutral-900/50 p-6 rounded-2xl border border-neutral-800/50 hover:border-neutral-700/50 transition-all duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-neutral-800/50 rounded-lg">
                    <Briefcase className="w-4 h-4 text-neutral-400" />
                  </div>
                  <p className="text-xs uppercase tracking-wider text-neutral-500 font-medium">Status</p>
                </div>
                <p className="text-2xl font-semibold text-white capitalize">
                  {interview.status}
                </p>
              </div>
              
              <div className="group bg-gradient-to-br from-neutral-900 to-neutral-900/50 p-6 rounded-2xl border border-neutral-800/50 hover:border-neutral-700/50 transition-all duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-neutral-800/50 rounded-lg">
                    <Clock className="w-4 h-4 text-neutral-400" />
                  </div>
                  <p className="text-xs uppercase tracking-wider text-neutral-500 font-medium">Duration</p>
                </div>
                <p className="text-2xl font-semibold text-white">{interview.duration}</p>
              </div>
            </div>

            {/* Interview Type */}
            <div className="bg-gradient-to-br from-neutral-900 to-neutral-900/50 p-6 rounded-2xl border border-neutral-800/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-neutral-800/50 rounded-lg">
                  <MessageSquare className="w-4 h-4 text-neutral-400" />
                </div>
                <p className="text-xs uppercase tracking-wider text-neutral-500 font-medium">Interview Type</p>
              </div>
              <p className="text-xl font-medium text-white capitalize">
                {interview.interviewType}
              </p>
            </div>

            {/* Job Description */}
            <div className="bg-gradient-to-br from-neutral-900 to-neutral-900/50 p-8 rounded-2xl border border-neutral-800/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-neutral-800/50 rounded-lg">
                  <FileText className="w-4 h-4 text-neutral-400" />
                </div>
                <h2 className="text-xs uppercase tracking-wider text-neutral-500 font-medium">Job Description</h2>
              </div>
              <div className="prose prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-neutral-300 leading-relaxed">
                  {interview.jobDescription}
                </p>
              </div>
            </div>

            {/* Resume Data */}
            <div className="bg-gradient-to-br from-neutral-900 to-neutral-900/50 p-8 rounded-2xl border border-neutral-800/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-neutral-800/50 rounded-lg">
                  <FileText className="w-4 h-4 text-neutral-400" />
                </div>
                <h2 className="text-xs uppercase tracking-wider text-neutral-500 font-medium">Resume</h2>
              </div>
              <div className="prose prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-neutral-300 leading-relaxed">
                  {interview.resume}
                </p>
              </div>
            </div>

            {/* Transcript */}
            {interview.transcript && (
              <div className="bg-gradient-to-br from-neutral-900 to-neutral-900/50 p-8 rounded-2xl border border-neutral-800/50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-neutral-800/50 rounded-lg">
                    <MessageSquare className="w-4 h-4 text-neutral-400" />
                  </div>
                  <h2 className="text-xs uppercase tracking-wider text-neutral-500 font-medium">Interview Transcript</h2>
                </div>
                <div className="space-y-6">
                  {interview.transcript.map((msg: transcriptTypeMsg, idx: number) => (
                    <div 
                      key={idx} 
                      className={`flex gap-4 p-4 rounded-xl ${
                        msg.role === "interviewer" 
                          ? "bg-neutral-800/30" 
                          : "bg-neutral-800/50"
                      }`}
                    >
                      <div className="flex-shrink-0">
                        <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                          msg.role === "interviewer"
                            ? "bg-neutral-700 text-neutral-300"
                            : "bg-white text-neutral-900"
                        }`}>
                          {msg.role === "interviewer" ? "AI" : "You"}
                        </span>
                      </div>
                      <p className="flex-1 text-neutral-300 leading-relaxed pt-1">
                        {msg.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback */}
            {interview.feedback && (
              <div className="bg-gradient-to-br from-neutral-900 to-neutral-900/50 p-8 rounded-2xl border border-neutral-800/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-neutral-800/50 rounded-lg">
                    <MessageSquare className="w-4 h-4 text-neutral-400" />
                  </div>
                  <h2 className="text-xs uppercase tracking-wider text-neutral-500 font-medium">Feedback</h2>
                </div>
                <div className="text-neutral-300 leading-relaxed">
                  {interview.feedback}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}