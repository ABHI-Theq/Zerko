import React, { useState, ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from 'next/navigation'
import { Textarea } from "@/components/ui/textarea"
import { InterviewCreationSchema, InterviewType } from '@/types'
import toast from 'react-hot-toast'

interface InterviewDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const InterviewDialog = ({ open, onOpenChange }: InterviewDialogProps) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [step, setStep] = useState<number>(1)
  const [post, setPost] = useState<string | null>(null)
  const [postError, setPostError] = useState<string>("")
  const [jobDescription, setJobDescription] = useState<string | null>(null)
  const [resume, setResume] = useState<File | null>(null)
  const [resumeError, setResumeError] = useState<string>("")
  const [duration, setDuration] = useState<string>("")
  const [interviewType, setInterviewType] = useState<string>("")
  const router = useRouter()

  const handleStartInterview = async () => {
    // console.log(resume?.type);

    if(loading) return;
    setLoading(true)
    const parsed = InterviewCreationSchema.safeParse({
      post,
      jobDescription,
      resume,
      interviewType: interviewType as InterviewType,
      duration: Number(duration)
    })
    if (parsed.error) {
      toast.error(`${parsed.error.issues[0].message}`)
      console.log(parsed.error.issues[0].message);
      return;
    }
    // Prepare FormData for file upload
    const formData = new FormData();
    formData.append("post", post ?? "");
    formData.append("jobDescription", jobDescription ?? "");
    if (resume) formData.append("resume", resume);
    formData.append("interviewType", interviewType);
    formData.append("duration", duration);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/interview/new`, {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      // console.log(data);

      if (data.error) {
        toast.error(`${data.error}`)
        return;
      }
      const interviewId = data.interviewDets.id;
      console.log(interviewId);
      
      toast.success("Interview created successfully!")
      onOpenChange?.(false)
      router.push(`/interview/start/${interviewId}?duration=${duration}`)
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "error while initiating the interview process"
      toast.error(`${errMsg}`)
      return;
    }
    finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className=''>
            {step === 1 ? "Upload Details" : "Interview Settings"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Fill in the job details and upload a resume."
              : "Select interview duration and type before starting."}
          </DialogDescription>
        </DialogHeader>
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor='job-post'>Post</Label>
              <Input
                id="post"
                name="post"
                type="text"
                onChange={(e) => {
                  const value = e.target.value
                  // Allow only letters and spaces
                  if (/[^a-zA-Z\s]/.test(value)) {
                    setPostError("Post must contain only letters and spaces")
                  } else {
                    setPostError("")
                  }
                  setPost(value)
                }}
                value={post ?? ""}
              />
              {postError && (
                <p className="text-red-500 text-xs mt-1">{postError}</p>
              )}
            </div>
            <div>
              <Label htmlFor="job-description">Job Description</Label>
              <Textarea
                className='bg-neutral-100 text-black overflow-auto max-h-64 h-32'
                placeholder='Enter the Job Description over here'
                onChange={(e) => {
                  setJobDescription(e.target.value)
                }}
              />
            </div>
            <div>
              <Label htmlFor="resume">Resume</Label>
              <Input
                id="resume"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={e => {
                  const file = e.target.files?.[0] || null;
                  if (
                    file &&
                    ![
                      "application/pdf",
                      "application/msword",
                      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    ].includes(file.type)
                  ) {
                    setResumeError("Only PDF, DOC, or DOCX files are allowed")
                    e.target.value = ""; // Reset the input
                    setResume(null);
                    return;
                  }
                  setResumeError("");
                  setResume(file);
                }}
              />
              {
                resumeError && (
                  <p className='text-red-500 text-xs mt-1'>{resumeError}</p>
                )
              }
            </div>
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => onOpenChange?.(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!jobDescription || !resume || !!postError || !post}
              >
                Next
              </Button>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <div className='flex w-full items-center justify-start gap-4'>
              <div>
                <Label>Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
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
                    <SelectItem value="SYSTEM_DESIGN">System Design</SelectItem>
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
                {loading ? (<div className="relative flex items-center justify-center">
                  <div className="w-6 h-6 border-4 border-t-white border-b-white border-l-transparent border-r-transparent rounded-full animate-spin"></div>
                </div>) : (<p>Start Interview</p>)}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default InterviewDialog