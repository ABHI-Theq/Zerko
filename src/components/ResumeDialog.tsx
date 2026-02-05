"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useResumeConAll } from "@/context/ResumeAllContext";

const ResumeDialog = ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => {
  
  const [title, setTitle] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<string>("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeError, setResumeError] = useState<string>("");
  const [titleError, setTitleError] = useState<string>("");
  const [titleExists, setTitleExists] = useState<boolean>(false);
  const [checkingTitle, setCheckingTitle] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { refetchResumes } = useResumeConAll();
  const router = useRouter();

  // Generate default title based on current date
  const generateDefaultTitle = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    return `Resume Analysis - ${dateStr}`;
  };

  // Initialize with default title when dialog opens
  useEffect(() => {
    if (open && !title) {
      setTitle(generateDefaultTitle());
    }
  }, [open, title]);

  // Debounced title checking function
  const checkTitleAvailability = useCallback(
    async (titleToCheck: string) => {
      if (!titleToCheck.trim()) {
        setTitleError("");
        setTitleExists(false);
        return;
      }

      setCheckingTitle(true);
      try {
        const response = await fetch('/api/resume/check-title', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: titleToCheck.trim() }),
        });

        const data = await response.json();
        
        if (data.exists) {
          setTitleExists(true);
          setTitleError(data.message);
        } else {
          setTitleExists(false);
          setTitleError("");
        }
      } catch (error) {
        console.error('Error checking title:', error);
        setTitleError("Error checking title availability");
      } finally {
        setCheckingTitle(false);
      }
    },
    []
  );

  // Debounce title checking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (title.trim()) {
        checkTitleAvailability(title);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [title, checkTitleAvailability]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setTitle("");
      setJobDescription("");
      setResumeFile(null);
      setResumeError("");
      setTitleError("");
      setTitleExists(false);
      setCheckingTitle(false);
      setIsSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    console.log("🚀 [RESUME_DIALOG] Starting resume submission process");
    
    // Validation
    if (!title.trim()) {
      console.log("❌ [RESUME_DIALOG] Validation failed: Title is required");
      setTitleError("Title is required");
      return;
    }
    
    if (titleExists) {
      console.log("❌ [RESUME_DIALOG] Validation failed: Title already exists");
      setTitleError("Please choose a different title");
      return;
    }

    if (!resumeFile) {
      console.log("❌ [RESUME_DIALOG] Validation failed: No resume file");
      setResumeError("Please upload your resume file.");
      return;
    }

    if (!jobDescription.trim()) {
      console.log("❌ [RESUME_DIALOG] Validation failed: No job description");
      toast.error("Job description is required");
      return;
    }

    console.log("✅ [RESUME_DIALOG] All validations passed, preparing submission");
    console.log("📋 [RESUME_DIALOG] Submission details:", {
      title: title.trim(),
      resumeFileName: resumeFile.name,
      resumeFileSize: resumeFile.size,
      jobDescriptionLength: jobDescription.length
    });

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("jobDescription", jobDescription);
      formData.append("resume", resumeFile);

      console.log("📤 [RESUME_DIALOG] Sending request to /api/resume/create");
      const startTime = Date.now();

      const res = await fetch(`/api/resume/create`, {
        method: "POST",
        body: formData
      });

      const responseTime = Date.now() - startTime;
      console.log(`⏱️ [RESUME_DIALOG] API response received in ${responseTime}ms`);

      if (!res.ok) {
        console.log(`❌ [RESUME_DIALOG] API request failed with status: ${res.status}`);
        const errorData = await res.json();
        console.log("❌ [RESUME_DIALOG] Error response:", errorData);
        throw new Error(errorData.error || "Failed to evaluate resume. Try again later.");
      }

      const data = await res.json();
      console.log("✅ [RESUME_DIALOG] Resume created successfully:", {
        resumeId: data.resumeId,
        success: data.success
      });

      // Trigger refetch to update the resumes list
      console.log('🔄 [RESUME_DIALOG] Triggering resume list refetch after creation');
      await refetchResumes();

      toast.success("Resume evaluation started successfully! Redirecting to analysis page...");
      
      console.log(`🔄 [RESUME_DIALOG] Redirecting to /resumes/${data.resumeId}/analysis`);
      router.push(`/resumes/${data.resumeId}/analysis`);
      onOpenChange?.(false);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Error evaluating resume. Try again later.";
      console.log("❌ [RESUME_DIALOG] Submission failed:", errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
      console.log("🏁 [RESUME_DIALOG] Submission process completed");
    }
  };

  const isFormValid = title.trim() && !titleExists && resumeFile && jobDescription.trim() && !checkingTitle;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg w-full" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Resume Evaluation
          </DialogTitle>
          <DialogDescription className="mt-1 text-gray-600">
            Upload your resume to get a detailed evaluation and suggestions for improvement.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Title Field */}
          <div>
            <Label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title *
            </Label>
            <div className="relative mt-2">
              <Input
                id="title"
                placeholder="Enter a title for your resume analysis"
                className="pr-10"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {checkingTitle && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                {!checkingTitle && title.trim() && !titleExists && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                {!checkingTitle && titleExists && (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
            </div>
            {titleError && (
              <p className="text-sm text-red-600 mt-1">{titleError}</p>
            )}
            {!titleError && title.trim() && !titleExists && !checkingTitle && (
              <p className="text-sm text-green-600 mt-1">Title is available</p>
            )}
          </div>

          {/* Job Description Field */}
          <div>
            <Label htmlFor="job-description" className="block text-sm font-medium text-gray-700">
              Job Description *
            </Label>
            <Textarea
              id="job-description"
              placeholder="Paste the job description here..."
              className="mt-2 max-h-64 h-32 resize-none"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>

          {/* Resume Upload Field */}
          <div>
            <Label htmlFor="resume-upload" className="block text-sm font-medium text-gray-700">
              Upload Resume *
            </Label>
            <input
              type="file"
              id="resume-upload"
              className="mt-2 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
              accept=".pdf,.doc,.docx"
              onChange={(e) => {
                const file = e.target.files ? e.target.files[0] : null;
                if (file) {
                  if (file.type.includes("pdf") || file.type.includes("word") || file.type.includes("msword")) {
                    setResumeFile(file);
                    setResumeError("");
                  } else {
                    setResumeError("Please upload a valid PDF or Word document.");
                    setResumeFile(null);
                  }
                }
              }}
            />
            {resumeError && <p className="text-sm text-red-600 mt-1">{resumeError}</p>}
            {resumeFile && !resumeError && (
              <p className="text-sm text-green-600 mt-1">✓ {resumeFile.name}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange?.(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze Resume"
              )}
            </Button>
          </div>
        </div>


      </DialogContent>
    </Dialog>
  )
}

export default ResumeDialog