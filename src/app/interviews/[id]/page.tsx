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
import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function Page() {
  const params = useParams();
  const {loading, interviews } = useInterviewConAll();
  const [interview, setInterview] = useState<any>(null);
  const router = useRouter();
  const { data: session } = useSession();

  console.log(params);

  useEffect(() => {
    if (interviews && params.id) {
      const found = interviews.find((i) => i.id === params.id);
      setInterview(found || null);
      console.log(interview);
    }
  }, [params.id, interviews]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="size-20 text-neutral-800" />
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-neutral-800">Interview not found</p>
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
    <div className="min-h-screen relative">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black backdrop-blur-xl border-b border-neutral-800/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-neutral-200 hover:text-netural transition-all duration-200 hover:gap-3"
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
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-br from-black to-neutral-700 bg-clip-text text-transparent">
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
              <div className="group bg-black p-6 rounded-2xl border border-neutral-800/50 hover:border-neutral-700/50 transition-all duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-neutral-800/50 rounded-lg">
                    <Briefcase className="w-4 h-4 text-neutral-400" />
                  </div>
                  <p className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Rating &#40; out of 10 &#41;</p>
                </div>
                <p className="text-2xl font-semibold text-white capitalize">
                  {interview.overall_rating}
                </p>
              </div>
              
              <div className="group bg-black p-6 rounded-2xl border border-neutral-800/50 hover:border-neutral-700/50 transition-all duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-neutral-800/50 rounded-lg">
                    <Clock className="w-4 h-4 text-neutral-400" />
                  </div>
                  <p className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Duration</p>
                </div>
                <p className="text-2xl font-semibold text-white">{interview.duration}</p>
              </div>
            </div>
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black p-6 rounded-2xl border border-neutral-800/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-neutral-800/50 rounded-lg">
                  <MessageSquare className="w-4 h-4 text-neutral-400" />
                </div>
                <p className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Interview Type</p>
              </div>
              <p className="text-xl font-medium text-white capitalize">
                {interview.interviewType}
              </p>
            </div>
            <div className="bg-black p-6 rounded-2xl border border-neutral-800/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-neutral-800/50 rounded-lg">
                  <FileText className="w-4 h-4 text-neutral-400" />
                </div>
                <p className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Resume</p>
              </div>
             <div className="bg-[#eeefff] hover:bg-neutral-100 px-4 py-2 rounded-md w-[20%]">
              <Link href={interview.resume} target={"_blank"} >Resume</Link>
             </div>
            </div>
            </div>
          </div>
          
            <Accordion
            type="multiple"
            className="w-full bg-black rounded-md p-4 pb-2 flex flex-col gap-2"
            >
              <AccordionItem value="item-1" className="">
              <AccordionTrigger className="text-neutral-300 text-lg p-0">
                Job Description
              </AccordionTrigger>
              <AccordionContent className="text-white p-2">
                <div className="bg-neutral-200 p-2 rounded-lg text-black">
                {interview.jobDescription}
                </div>
              </AccordionContent>
              </AccordionItem>
                            <AccordionItem value="item-2" className="">
              <AccordionTrigger className="text-neutral-300 text-lg p-0">
                List of Questions
              </AccordionTrigger>
              <AccordionContent className="text-white p-2">
                <div className="bg-neutral-200 p-2 rounded-lg text-black">
                {interview.questions && interview.questions.map((question: InterviewQuestion, idx: number) => (
                  <div key={idx} className="mb-4">
                    <h5 className="font-semibold">Q{idx + 1}: {question.question}</h5>
                   
                  </div>
                ))}
                </div>
              </AccordionContent>
              </AccordionItem>
                            <AccordionItem value="item-3" className="">
              <AccordionTrigger className="text-neutral-300 text-lg p-0">
                Interview Transcript
              </AccordionTrigger>
              <AccordionContent className="text-white p-2 ">
                <div className="bg-neutral-200 p-2 rounded-lg text-white max-h-96 overflow-y-auto flex flex-col  gap-4">
                  {interview.transcript && interview.transcript.map((msg: transcriptTypeMsg, idx: number) => (
                    <div 
                      key={idx} 
                      className={`flex gap-4 p-4 rounded-xl ${
                        msg.role === "interviewer" 
                          ? "bg-neutral-800" 
                          : "bg-neutral-700"
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
              </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4" className=""> 
              <AccordionTrigger className="text-neutral-300 text-lg p-0">
                Feedback
              </AccordionTrigger>
              <AccordionContent className="text-white p-2">
                <div className="bg-neutral-200 p-2 rounded-lg text-black">
                {interview.feedbackStr}</div></AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-5" className="">
              <AccordionTrigger className="text-neutral-300 text-lg p-0">
                Improvement Suggestions
              </AccordionTrigger>
              <AccordionContent className="text-white p-2">
                <div className="bg-neutral-800 p-2 rounded-lg">
                {interview.improvements &&  (
                  <div className="flex flex-col gap-4">
                  {interview.improvements.map((improve: string, idx: number) => (
                    <div key={idx} className="w-full">
                      <h2 className="text-xs uppercase tracking-wider text-neutral-400 font-medium mb-4">Improvement Suggestion {idx + 1}</h2>
                      {improve}
                      </div>
                    ))
                   }  
                   </div>)}
                   </div>
                   </AccordionContent>
              </AccordionItem>
                            <AccordionItem value="item-6" className="">
              <AccordionTrigger className="text-neutral-300 text-lg p-0">
                Strengths
              </AccordionTrigger>
              <AccordionContent className="text-white p-2">
                <div className="bg-neutral-800 p-2 rounded-lg">
                {interview.strengths &&  (
                  <div className="flex flex-col gap-4">
                  {interview.strengths.map((strength: string, idx: number) => (
                    <div key={idx} className="w-full ">
                      <h2 className="text-xs uppercase tracking-wider text-neutral-400 font-medium mb-4">STRENGTH {idx + 1}</h2>
                      {strength}
                      </div>
                    ))
                   }  
                   </div>)}
                   </div>
                   </AccordionContent>
              </AccordionItem>
            </Accordion>
            {/* <div className="bg-black p-8 rounded-2xl border border-neutral-800/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-neutral-800/50 rounded-lg">
                  <FileText className="w-4 h-4 text-neutral-400" />
                </div>
                <h2 className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Job Description</h2>
              </div>
              <div className="prose prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-neutral-300 leading-relaxed">
                  {interview.jobDescription}
                </p>
              </div>
            </div>
            {interview.transcript && (
              <div className="bg-black p-8 rounded-2xl border border-neutral-800/50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-neutral-800/50 rounded-lg">
                    <MessageSquare className="w-4 h-4 text-neutral-400" />
                  </div>
                  <h2 className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Interview Transcript</h2>
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

            {interview.feedbackStr && (
              <div className="bg-black p-8 rounded-2xl border border-neutral-800/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-neutral-800/50 rounded-lg">
                    <MessageSquare className="w-4 h-4 text-neutral-400" />
                  </div>
                  <h2 className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Feedback</h2>
                </div>
                <div className="text-neutral-300 leading-relaxed">
                  {interview.feedbackStr}
                </div>
              </div>
            )}

            {interview.improvements &&  (
              <div className="bg-black p-8 rounded-2xl border border-neutral-800/50">
                <div className="flex items-center gap-3 flex-col">
                  {interview.improvements.map((improve: string, idx: number) => (
                    <div key={idx} className="w-full text-white">
                      <h2 className="text-xs uppercase tracking-wider text-neutral-400 font-medium mb-4">Improvement Suggestion {idx + 1}</h2>
                      {improve}
                      </div> 
                    ))
                   }  
                </div>
              </div>
            )
            }
             {interview.strengths &&  (
              <div className="bg-black p-8 rounded-2xl border border-neutral-800/50">
                <div className="flex items-center gap-3 flex-col">
                  {interview.strengths.map((strength: string, idx: number) => (
                    <div key={idx} className="w-full text-white">
                      <h2 className="text-xs uppercase tracking-wider text-neutral-400 font-medium mb-4">Strength -&gt;  {idx + 1}</h2>
                      {strength}
                      </div> 
                    ))
                   }  
                </div>
              </div>
            )} */}
          </div>
        </div>
      </main>
    </div>
  );
}