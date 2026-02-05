"use client";
import {
  createContext,
  useState,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useRef,
  useCallback
} from "react";
import { useSession } from "next-auth/react";
import { InterviewContextType, InterviewDetsForAPI } from "../types";

const InterviewAllContext = createContext<InterviewContextType | null>(null);

// Polling interval for real-time updates (30 seconds)
const POLLING_INTERVAL = 30000;

export const InterviewAllProvider = ({ children }: { children: React.ReactNode }) => {
  const [interviews, setInterviews] = useState<InterviewDetsForAPI[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { data: session, status } = useSession();
  const hasFetchedRef = useRef(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRef = useRef(false);

  const fetchInterviews = useCallback(async (isInitialLoad = false) => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      console.log('⏸️ [INTERVIEW_CONTEXT] Fetch already in progress, skipping...');
      return;
    }

    isFetchingRef.current = true;
    
    // Only show loading on initial load
    if (isInitialLoad) {
      setLoading(true);
    }

    try {
      console.log(`🚀 [INTERVIEW_CONTEXT] Fetching interviews (initial: ${isInitialLoad})`);
      const res = await fetch(`/api/interview/all`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      const data = await res.json();

      if (data?.error) {
        console.error('❌ [INTERVIEW_CONTEXT] Error:', data.error);
        return;
      }

      const newInterviews = data.interviews || [];
      console.log(`✅ [INTERVIEW_CONTEXT] Fetched ${newInterviews.length} interviews`);

      setInterviews(newInterviews);
      hasFetchedRef.current = true;
    } catch (error) {
      console.error('❌ [INTERVIEW_CONTEXT] Fetch error:', error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  const refetchInterviews = useCallback(async () => {
    console.log('🔄 [INTERVIEW_CONTEXT] Manual refetch triggered');
    await fetchInterviews(false);
  }, [fetchInterviews]);

  // Initial fetch on authentication
  useEffect(() => {
    if (status !== "authenticated" || !session || hasFetchedRef.current) return;

    console.log('🎬 [INTERVIEW_CONTEXT] Initial fetch starting');
    fetchInterviews(true);
  }, [status, session?.user?.email, fetchInterviews]);

  // Set up polling for real-time updates
  useEffect(() => {
    if (status !== "authenticated" || !session || !hasFetchedRef.current) return;

    console.log('⏰ [INTERVIEW_CONTEXT] Setting up polling for real-time updates');
    
    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Set up new polling interval
    pollingIntervalRef.current = setInterval(() => {
      console.log('🔄 [INTERVIEW_CONTEXT] Polling for updates...');
      fetchInterviews(false);
    }, POLLING_INTERVAL);

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        console.log('🛑 [INTERVIEW_CONTEXT] Clearing polling interval');
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [status, session, fetchInterviews]);

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
