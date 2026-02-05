"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, Clock, Calendar, Briefcase, FileText, MessageSquare, Star, TrendingUp, Award, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { useInterviewConAll } from "@/context/InterviewAllContext";
import Userbutton from "@/components/Userbutton";
import { useSession } from "next-auth/react";
import { Session } from "next-auth";
import { InterviewQuestion, transcriptTypeMsg } from "@/types";
import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import convertMarkdown from "@/lib/convert_markdown";
import { motion } from "framer-motion";

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

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "from-green-500 to-emerald-600";
    if (rating >= 6) return "from-blue-500 to-cyan-600";
    if (rating >= 4) return "from-yellow-500 to-orange-600";
    return "from-red-500 to-rose-600";
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 8) return "Excellent";
    if (rating >= 6) return "Good";
    if (rating >= 4) return "Fair";
    return "Needs Improvement";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-all duration-200 hover:gap-3 group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Dashboard</span>
            </button>
            <Userbutton session={session as Session} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-8 md:p-12">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                      {interview.post}
                    </h1>
                    <div className="flex items-center gap-4 text-gray-300 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">{formatDate(interview.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-sm capitalize">{interview.interviewType}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Rating Badge */}
                  <div className="flex-shrink-0">
                    <div className={`bg-gradient-to-br ${getRatingColor(interview.overall_rating)} p-6 rounded-2xl shadow-2xl`}>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Star className="w-5 h-5 text-white fill-white" />
                          <span className="text-3xl font-bold text-white">{interview.overall_rating}</span>
                          <span className="text-white/80 text-lg">/10</span>
                        </div>
                        <p className="text-xs text-white/90 font-medium uppercase tracking-wider">
                          {getRatingLabel(interview.overall_rating)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-50">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{interview.duration}</p>
                  <p className="text-xs text-gray-600 uppercase tracking-wide">Minutes</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{interview.questions?.length || 0}</p>
                  <p className="text-xs text-gray-600 uppercase tracking-wide">Questions</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{interview.strengths?.length || 0}</p>
                  <p className="text-xs text-gray-600 uppercase tracking-wide">Strengths</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{interview.improvements?.length || 0}</p>
                  <p className="text-xs text-gray-600 uppercase tracking-wide">Improvements</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Resume Link Card */}
          {interview.resume && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-6"
            >
              <Link 
                href={interview.resume} 
                target="_blank"
                className="block bg-white rounded-2xl shadow-md border border-gray-200 p-6 hover:shadow-xl hover:border-blue-300 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">View Resume</h3>
                      <p className="text-sm text-gray-600">Click to open your submitted resume</p>
                    </div>
                  </div>
                  <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </Link>
            </motion.div>
          )}

          {/* Detailed Feedback Section - MOVED TO TOP */}
          {interview.feedbackStr && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mb-6"
            >
              <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Star className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Detailed Feedback</h2>
                  </div>
                </div>
                <div className="p-6">
                  <div 
                    className="prose prose-sm max-w-none bg-gradient-to-br from-gray-50 to-blue-50/30 p-6 rounded-xl border border-gray-200"
                    dangerouslySetInnerHTML={{ __html: convertMarkdown(interview.feedbackStr) }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Content Sections */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Strengths Section */}
            {interview.strengths && interview.strengths.length > 0 && (
              <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-green-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Award className="w-5 h-5 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Your Strengths</h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid gap-4">
                    {interview.strengths.map((strength: string, idx: number) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex gap-4 p-4 bg-green-50 rounded-xl border border-green-100"
                      >
                        <div className="flex-shrink-0">
                          <CheckCircle2 className="w-5 h-5 text-green-600 mt-1" />
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-800 leading-relaxed">{strength}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Improvements Section */}
            {interview.improvements && interview.improvements.length > 0 && (
              <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-6 py-4 border-b border-orange-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-orange-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Areas for Improvement</h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid gap-4">
                    {interview.improvements.map((improve: string, idx: number) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex gap-4 p-4 bg-orange-50 rounded-xl border border-orange-100"
                      >
                        <div className="flex-shrink-0">
                          <AlertCircle className="w-5 h-5 text-orange-600 mt-1" />
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-800 leading-relaxed">{improve}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Sections Accordion */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Additional Information</h2>
              </div>
              <Accordion type="multiple" className="w-full">
                {/* Job Description */}
                <AccordionItem value="item-1" className="border-b border-gray-200 last:border-0">
                  <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-5 h-5 text-gray-600" />
                      <span className="font-semibold text-gray-900">Job Description</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <div 
                      className="prose prose-sm max-w-none bg-gray-50 p-6 rounded-xl border border-gray-200"
                      dangerouslySetInnerHTML={{__html: convertMarkdown(interview.jobDescription)}}
                    />
                  </AccordionContent>
                </AccordionItem>

                {/* Questions */}
                <AccordionItem value="item-2" className="border-b border-gray-200 last:border-0">
                  <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-gray-600" />
                      <span className="font-semibold text-gray-900">Interview Questions ({interview.questions?.length || 0})</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <div className="space-y-4">
                      {interview.questions && interview.questions.map((question: InterviewQuestion, idx: number) => (
                        <div key={idx} className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                          <div className="flex gap-3">
                            <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">
                              {idx + 1}
                            </span>
                            <p className="flex-1 text-gray-800 font-medium leading-relaxed pt-1">
                              {question.question}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Transcript */}
                <AccordionItem value="item-3" className="border-b border-gray-200 last:border-0">
                  <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <span className="font-semibold text-gray-900">Interview Transcript</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <div className="max-h-[600px] overflow-y-auto space-y-4 pr-2">
                      {interview.transcript && interview.transcript.map((msg: transcriptTypeMsg, idx: number) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`flex gap-4 p-5 rounded-xl ${
                            msg.role === "interviewer" 
                              ? "bg-blue-50 border border-blue-100" 
                              : "bg-gray-50 border border-gray-200"
                          }`}
                        >
                          <div className="flex-shrink-0">
                            <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-xs font-bold uppercase ${
                              msg.role === "interviewer"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-900 text-white"
                            }`}>
                              {msg.role === "interviewer" ? "AI" : "You"}
                            </span>
                          </div>
                          <div className="flex-1 pt-2">
                            <p className="text-gray-800 leading-relaxed">
                              {msg.content}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}