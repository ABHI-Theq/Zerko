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
import { InterviewDetails } from "../types";

interface InterviewContextType {
  interviews: InterviewDetails[];
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setInterviews: Dispatch<SetStateAction<InterviewDetails[]>>;
}

const InterviewAllContext = createContext<InterviewContextType | null>(null);

export const InterviewAllProvider = ({ children }: { children: React.ReactNode }) => {
  const [interviews, setInterviews] = useState<InterviewDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { data: session, status } = useSession();
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    // Only fetch if authenticated and haven't fetched before
    if (status !== "authenticated" || !session || hasFetchedRef.current) return;

    const fetchInterviews = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/interview/all`);
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

    fetchInterviews();
  }, [status, session?.user?.email]); // Only depend on email to prevent unnecessary re-renders

  return (
    <InterviewAllContext.Provider value={{ interviews, setInterviews, loading, setLoading }}>
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
