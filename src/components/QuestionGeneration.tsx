"use client";
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { QuestionsListSchema, QuestionsList } from "@/types";

interface QuestionGenerationProps {
  open: boolean;
  onClose: () => void;
  interviewId: string;
  interviewPost: string;
  jobDescription: string;
  resumeUrl: string;
  interviewType: string;
  durationStr: string;
}

const QuestionGeneration: React.FC<QuestionGenerationProps> = ({
  open,
  onClose,
  interviewId,
  interviewPost,
  jobDescription,
  resumeUrl,
  interviewType,
  durationStr,
}) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const generateAndSaveQuestions = async () => {
    setLoading(true);
    try {
      // 1️⃣ Generate questions
      console.log(interviewType);
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_AGENT_API_URL}/api/generate/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post: interviewPost,
          job_description: jobDescription,
          resume_url: resumeUrl,
          interview_type: interviewType,
          duration: durationStr,
        }),
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const quess = await res.json();
      if (!quess.success || !quess.data) throw new Error("Invalid data from server");

      // 2️⃣ Validate using Zod
      const questions: QuestionsList = QuestionsListSchema.parse(quess.data);

      toast.success("Questions generated successfully!");

      // 3️⃣ Save questions to the interview
      const saveRes = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/interview/${interviewId}/update-questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions }),
      });

      const data=await saveRes.json()

      if(data.error){
        toast.error(`${data.error}`)
        return;
      }

      console.log(data.interviewDets.questions);
      

      toast.success("Interview created with questions!");
      onClose();

      // 4️⃣ Redirect to interview page
      router.push(`/interview/start/${interviewId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error generating questions";
      toast.error(msg);
      onClose(); // Drop back if unrecoverable
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) generateAndSaveQuestions();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generating Questions</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-6 gap-4">
          <p className="text-center">
            {loading
              ? "Please wait while we generate questions..."
              : "Unable to generate questions. Closing dialog."}
          </p>
          {loading && <Spinner className="size-10" />}
          {!loading && (
            <Button variant="destructive" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuestionGeneration;
