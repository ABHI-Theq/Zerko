"use client";
import {
  createContext,
  useState,
  Dispatch,
  SetStateAction,
  useContext
} from "react";
import { InterviewDetails } from "../types";

interface InterviewContextType {
  interview: InterviewDetails;
  setInterview: Dispatch<SetStateAction<InterviewDetails>>;
}

const InterviewContext = createContext<InterviewContextType | null>(null);

export const InterviewProvider = ({ children }: { children: React.ReactNode }) => {
  const [interview, setInterview] = useState<InterviewDetails>({
    name: null,
    post: null,
    jobDescription: null,
    resumeUrl: null,
    interviewType: null,
    questionsList: null,
    resumeData: null,
    duration: null
  });

  return (
    <InterviewContext.Provider value={{ interview, setInterview }}>
      {children}
    </InterviewContext.Provider>
  );
};

export const useInterviewCon = () => {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error("useInterviewCon must be used within an InterviewProvider");
  }
  return context;
};
