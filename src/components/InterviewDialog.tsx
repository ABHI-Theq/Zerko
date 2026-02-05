"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
import { InterviewCreationSchema, InterviewType } from "@/types";
import { useInterviewCon } from "@/context/InterviewContext";
import ParsingResume from "./ParsingResume";
import QuestionGeneration from "./QuestionGeneration";
import { jobPosts } from "@/data/posts";

interface InterviewDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const InterviewDialog = ({ open, onOpenChange }: InterviewDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [name, setName] = useState<string>("");
  const [nameError, setNameError] = useState("");
  const [nameExists, setNameExists] = useState(false);
  const [checkingName, setCheckingName] = useState(false);
  const [post, setPost] = useState<string | null>(null);
  const [jobDescription, setJobDescription] = useState<string | null>(null);
  const [resume, setResume] = useState<File | null>(null);
  const [resumeError, setResumeError] = useState("");
  const [duration, setDuration] = useState("");
  const [interviewType, setInterviewType] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [currentInterviewId, setCurrentInterviewId] = useState("");
  const [progressStep, setProgressStep] = useState<"upload" | "parse" | "generate" | "done" | null>(null);
  const { setInterview } = { ...useInterviewCon() };

  // Generate default name based on current date
  const generateDefaultName = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    return `Interview - ${dateStr}`;
  };

  // Initialize with default name when dialog opens
  useEffect(() => {
    if (open && !name) {
      setName(generateDefaultName());
    }
  }, [open]);

  // Check name availability
  const checkNameAvailability = async (nameToCheck: string) => {
    if (!nameToCheck.trim()) {
      setNameError("");
      setNameExists(false);
      return;
    }

    setCheckingName(true);
    try {
      const response = await fetch('/api/interview/check-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameToCheck.trim() }),
      });

      const data = await response.json();
      
      if (data.exists) {
        setNameExists(true);
        setNameError(data.message);
      } else {
        setNameExists(false);
        setNameError("");
      }
    } catch (error) {
      console.error('Error checking name:', error);
      setNameError("Error checking name availability");
    } finally {
      setCheckingName(false);
    }
  };

  // Debounce name checking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (name.trim()) {
        checkNameAvailability(name);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [name]);

  // Handle Start Interview
  const handleStartInterview = async () => {
    if (loading) return;

    // Validation
    if (!name.trim()) {
      setNameError("Interview name is required");
      return;
    }
    
    if (nameExists) {
      setNameError("Please choose a different name");
      return;
    }

    setLoading(true);
    setProgressStep("upload");

    const parsed = InterviewCreationSchema.safeParse({
      post,
      jobDescription,
      resume,
      interviewType: interviewType as InterviewType,
      duration: Number(duration),
    });

    if (parsed.error) {
      toast.error(parsed.error.issues[0].message);
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("post", post ?? "");
    formData.append("jobDescription", jobDescription ?? "");
    if (resume) formData.append("resume", resume);
    formData.append("interviewType", interviewType);
    formData.append("duration", duration);

    try {
      const res = await fetch(`/api/interview/new`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setCurrentInterviewId(data.interviewDets.id);
      //  setting sup resume url
      let Rurl=data.interviewDets.resume;
      if(Rurl){
        Rurl=Rurl.replace("/upload/f_jpg/","/upload/")
        console.log(Rurl);
        setResumeUrl(Rurl);
        
      }

      

      setProgressStep("parse");
      onOpenChange?.(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error initiating interview"
      );
    } finally {
      setLoading(false);
    }
  };

  // Update Interview Context when resumeUrl is ready
  useEffect(() => {
    if (resumeUrl && setInterview) {
      setInterview((prev) => ({
        ...prev,
        post: post,
        interviewType: interviewType,
        jobDescription: jobDescription,
        resumeUrl: resumeUrl,
        duration:`${duration}m`
      }));
      console.log("Interview context updated successfully");
      
      
    }
  }, [resumeUrl, post, interviewType, jobDescription, setInterview,duration]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>
              {step === 1 ? "Upload Details" : "Interview Settings"}
            </DialogTitle>
            <DialogDescription>
              {step === 1
                ? "Fill in the job details and upload a resume."
                : "Select interview duration and type before starting."}
            </DialogDescription>
          </DialogHeader>

          {/* Step 1: Job Details + Resume */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Interview Name *</Label>
                <div className="relative mt-2">
                  <Input
                    id="name"
                    placeholder="Enter a unique name for this interview"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pr-10"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {checkingName && <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />}
                    {!checkingName && name.trim() && !nameExists && (
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {!checkingName && nameExists && (
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                </div>
                {nameError && (
                  <p className="text-sm text-red-600 mt-1">{nameError}</p>
                )}
                {!nameError && name.trim() && !nameExists && !checkingName && (
                  <p className="text-sm text-green-600 mt-1">Name is available</p>
                )}
              </div>

              <div className="">
                <Label htmlFor="post">Post</Label>
                <Select value={post ?? ""} onValueChange={setPost} >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] overflow-y-auto">
                     {jobPosts.map((job) => (
    <SelectItem key={job.value} value={job.value}>
      {job.label}
    </SelectItem>
  ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="job-description">Job Description</Label>
                <Textarea
                  className="bg-neutral-100 text-black overflow-auto max-h-64 h-32"
                  placeholder="Enter the Job Description over here"
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="resume">Resume</Label>
                <Input
                  id="resume"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (
                      file &&
                      ![
                        "application/pdf",
                        "application/msword",
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                      ].includes(file.type)
                    ) {
                      setResumeError("Only PDF, DOC, or DOCX files are allowed");
                      e.target.value = "";
                      setResume(null);
                      return;
                    }
                    setResumeError("");
                    setResume(file);
                  }}
                />
                {resumeError && (
                  <p className="text-red-500 text-xs mt-1">{resumeError}</p>
                )}
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => onOpenChange?.(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => setStep(2)}
                  disabled={!name.trim() || nameExists || !jobDescription || !resume || !post || checkingName}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Duration + Type */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex w-full items-center justify-start gap-4">
                <div>
                  <Label>Duration</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 Minutes</SelectItem>
                      <SelectItem value="15">15 Minutes</SelectItem>
                      <SelectItem value="30">30 Minutes</SelectItem>
                      <SelectItem value="60">1 Hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Interview Type</Label>
                  <Select value={interviewType} onValueChange={setInterviewType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TECHNICAL">Technical</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="BEHAVIORAL">Behavioral</SelectItem>
                      <SelectItem value="SYSTEM_DESIGN">
                        System Design
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  onClick={handleStartInterview}
                  disabled={!duration || !interviewType}
                >
                  {loading ? "Uploading..." : "Start Interview"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Step 2 → Parsing */}
      {progressStep === "parse" && resumeUrl && (
        <ParsingResume
          open={true}
          onClose={() => setProgressStep(null)}
          resumeUrl={resumeUrl}
          onParsed={() => setProgressStep("generate")}
        />
      )}

      {/* Step 3 → Question Generation */}
      {progressStep === "generate" && currentInterviewId && (
        <QuestionGeneration
          open={true}
          onClose={() => {
            setProgressStep("done");
            setStep(1);
          }}
          interviewId={currentInterviewId}
          interviewPost={post ?? ""}
          jobDescription={jobDescription ?? ""}
          interviewType={interviewType}
          durationStr={`${duration}m`}
        />
      )}
    </>
  );
};

export default InterviewDialog;