"use client";
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { QuestionsListSchema, QuestionsList } from "@/types";
import { useInterviewCon } from "@/context/InterviewContext";
import { useInterviewConAll } from "@/context/InterviewAllContext";
import { convertSegmentPathToStaticExportFilename } from "next/dist/shared/lib/segment-cache/segment-value-encoding";

interface QuestionGenerationProps {
  open: boolean;
  onClose: () => void;
  interviewId: string;
  interviewPost: string;
  jobDescription: string;
  interviewType: string;
  durationStr: string;
}

const QuestionGeneration: React.FC<QuestionGenerationProps> = ({
  open,
  onClose,
  interviewId,
  interviewPost,
  jobDescription,
  interviewType,
  durationStr,
}) => {
  const [loading, setLoading] = useState(false);
  const { interview, setInterview } = useInterviewCon();
  const { refetchInterviews } = useInterviewConAll();
  const router = useRouter();

  const generateAndSaveQuestions = async () => {
    setLoading(true);
    try {
      // Guard: resumeData must be available before generating questions
      if (!interview.resumeData) {
        throw new Error("Resume data is not available. Please try again.");
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_AGENT_API_URL}/api/generate/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post: interviewPost,
          job_description: jobDescription,
          resumeData: interview.resumeData,
          interview_type: interviewType,
          duration: durationStr,
        }),
      });

      const data = await res.json();
      // console.log("stautr: "+res.status);
      if (res.status === 429) {
        throw new Error("AI service quota exceeded. Please try again later or contact support.");
      }
      if (!res.ok || !data.success) throw new Error("Failed to generate questions");

      let questionsList = data.data.questions;
      if (typeof questionsList === "string") questionsList = JSON.parse(questionsList);

      const questions: QuestionsList = QuestionsListSchema.parse(questionsList);
      setInterview((prev) => ({ ...prev, questionsList: questions }));

      toast.success("Questions generated successfully!");

      // Save to DB
      await fetch(`/api/interview/${interviewId}/update-questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions }),
      });

      // Trigger refetch to update the interviews list
      console.log('🔄 [QUESTION_GEN] Triggering interview list refetch after creation');
      await refetchInterviews();

      toast.success("Redirecting to Interview...");
      onClose();
      router.push(`/interview/start/${interviewId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error generating questions");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) generateAndSaveQuestions();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(openState) => {
      // Only allow closing via the X button, not by clicking outside or pressing Escape
      if (!openState && !loading) {
        onClose();
      }
    }}>
      <DialogContent onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Generating Questions...</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-6 gap-4">
          <p className="text-center">
            {loading ? "Please wait while we generate questions..." : "Generation complete!"}
          </p>
          {loading && <Spinner className="size-10" />}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuestionGeneration;
