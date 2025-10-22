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
  interviews: InterviewDetails[];
  setInterviews: Dispatch<SetStateAction<InterviewDetails[]>>;
}

const InterviewAllContext = createContext<InterviewContextType | null>(null);

export const InterviewAllProvider = ({ children }: { children: React.ReactNode }) => {
  const [interviews, setInterviews] = useState<InterviewDetails[]>([]);

  return (
    <InterviewAllContext.Provider value={{ interviews, setInterviews }}>
      {children}
    </InterviewAllContext.Provider>
  );
};

export const useInterviewConAll = () => {
  const context = useContext(InterviewAllContext);
  if (!context) {
    throw new Error("useInterviewConAll must be used within an InterviewAll  Provider");
  }
  return context;
};
