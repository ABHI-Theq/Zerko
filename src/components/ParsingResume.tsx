"use client";
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import toast from "react-hot-toast";
import { useInterviewCon } from "@/context/InterviewContext";

interface ParsingResumeProps {
  open: boolean;
  onClose: () => void;
  resumeUrl: string;
  onParsed: () => void; // callback after successful parsing
}

const ParsingResume: React.FC<ParsingResumeProps> = ({ open, onClose, resumeUrl, onParsed }) => {
  const [loading, setLoading] = useState(false);
  const { setInterview } = useInterviewCon();
    console.log(resumeUrl);
    
  const getResumeData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AGENT_API_URL}/api/parse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeUrl }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Error parsing resume");
        console.log(data);
        
      setInterview((prev) => ({ ...prev, resumeData: data.resumeData }));
      toast.success("Resume parsed successfully!");
      onParsed();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error parsing resume";
      toast.error(msg);
      console.error("❌ Resume parsing error:", msg);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) getResumeData();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Parsing Resume...</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-6 gap-4">
          <p className="text-center">
            {loading ? "Please wait while we parse the resume..." : "Parsing complete!"}
          </p>
          {loading && <Spinner className="size-10" />}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ParsingResume;
