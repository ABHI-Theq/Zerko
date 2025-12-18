"use client";
import {
  createContext,
  useState,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useRef
} from "react";
import { useSession } from "next-auth/react";
import { InterviewContextType, InterviewDetsForAPI } from "../types";



const InterviewAllContext = createContext<InterviewContextType | null>(null);

export const InterviewAllProvider = ({ children }: { children: React.ReactNode }) => {
  const [interviews, setInterviews] = useState<InterviewDetsForAPI[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { data: session, status } = useSession();
  const hasFetchedRef = useRef(false);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/interview/all`);
      const data = await res.json();

      if (data?.error) {
        console.error(data.error);
        return;
      }

      setInterviews(data.interviews || []);
      hasFetchedRef.current = true;  // Mark as fetched
    } catch (error) {
      console.error(error instanceof Error ? error.message : "Fetch error");
    } finally {
      setLoading(false);
    }
  };

  const refetchInterviews = async () => {
    console.log('Refetching all interviews...');
    await fetchInterviews();
  };

  useEffect(() => {
    // Only fetch if authenticated and haven't fetched before
    if (status !== "authenticated" || !session || hasFetchedRef.current) return;

    fetchInterviews();
  }, [status, session?.user?.email,session]); // Only depend on email to prevent unnecessary re-renders

  return (
    <InterviewAllContext.Provider value={{ interviews, setInterviews, loading, setLoading, refetchInterviews }}>
      {children}
    </InterviewAllContext.Provider>
  );
};

export const useInterviewConAll = () => {
  const context = useContext(InterviewAllContext);
  if (!context) {
    throw new Error("useInterviewConAll must be used within an InterviewAllProvider");
  }
  return context;
};
