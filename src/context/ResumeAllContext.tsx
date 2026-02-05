"use client"
import { ResumeContextDets } from "@/types";
import { useContext, createContext, Dispatch, SetStateAction, useState, useEffect, useCallback, useRef } from "react"
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

interface ResumesContextType {
    resumesAnalysis: ResumeContextDets[];
    loading: boolean;
    setLoading: Dispatch<SetStateAction<boolean>>;
    setResumesAnalysis: Dispatch<SetStateAction<ResumeContextDets[]>>;
    refetchResumes: () => Promise<void>;
}

const ResumesContext = createContext<ResumesContextType | null>(null)

// Polling interval for real-time updates (30 seconds)
const POLLING_INTERVAL = 30000;

export const ResumesContextProvider = ({ children }: { children: React.ReactNode }) => {
    const [resumesAnalysis, setResumesAnalysis] = useState<ResumeContextDets[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const { data: session, status } = useSession()
    const hasFetchedRef = useRef(false);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const isFetchingRef = useRef(false);

    const fetchAnalysis = useCallback(async (isInitialLoad = false) => {
        // Prevent concurrent fetches
        if (isFetchingRef.current) {
            console.log('⏸️ [RESUME_CONTEXT] Fetch already in progress, skipping...');
            return;
        }

        isFetchingRef.current = true;
        const fetchId = `ctx_fetch_${Date.now()}`;
        console.log(`🚀 [RESUME_CONTEXT] ${fetchId} - Starting to fetch all resumes (initial: ${isInitialLoad})`);
        
        // Only show loading on initial load
        if (isInitialLoad) {
            setLoading(true);
        }

        try {
            console.log(`📤 [RESUME_CONTEXT] ${fetchId} - Sending request to /api/resume/all`);
            const startTime = Date.now();
            const res = await fetch(`/api/resume/all`, { 
                method: "GET",
                headers: {
                    'Cache-Control': 'no-cache',
                },
            });
            const responseTime = Date.now() - startTime;
            
            console.log(`⏱️ [RESUME_CONTEXT] ${fetchId} - API response received in ${responseTime}ms`);
            
            if (!res.ok) {
                console.log(`❌ [RESUME_CONTEXT] ${fetchId} - API request failed with status: ${res.status}`);
                throw new Error(`Failed to fetch resumes: ${res.status}`);
            }
            
            const data = await res.json();
            console.log(`📊 [RESUME_CONTEXT] ${fetchId} - Received ${data.length} resumes`);
            console.log(`📋 [RESUME_CONTEXT] ${fetchId} - Resume statuses:`, data.map((r: ResumeContextDets) => ({ id: r.id, status: r.status, title: r.title })));
            
            setResumesAnalysis(data);
            hasFetchedRef.current = true;
            console.log(`✅ [RESUME_CONTEXT] ${fetchId} - Resume context updated successfully`);
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : "Error while fetching resumes list"
            console.error(`❌ [RESUME_CONTEXT] ${fetchId} - Error fetching resumes:`, error);
            
            // Only show toast on initial load errors
            if (isInitialLoad) {
                toast.error(errMsg);
            }
        } finally {
            setLoading(false);
            isFetchingRef.current = false;
        }
    }, []);

    const refetchResumes = useCallback(async () => {
        console.log('🔄 [RESUME_CONTEXT] Manual refetch triggered');
        await fetchAnalysis(false);
    }, [fetchAnalysis]);

    // Initial fetch on authentication
    useEffect(() => {
        console.log(`🔄 [RESUME_CONTEXT] useEffect triggered - status: ${status}, hasSession: ${!!session}`);

        if (status !== "authenticated" || !session || hasFetchedRef.current) {
            console.log(`⏸️ [RESUME_CONTEXT] Skipping fetch - not authenticated, no session, or already fetched`);
            return;
        }

        console.log(`🚀 [RESUME_CONTEXT] Starting initial resume fetch for user: ${session.user?.id}`);
        fetchAnalysis(true);
    }, [status, session?.user?.email, fetchAnalysis]);

    // Set up polling for real-time updates
    useEffect(() => {
        if (status !== "authenticated" || !session || !hasFetchedRef.current) return;

        console.log('⏰ [RESUME_CONTEXT] Setting up polling for real-time updates');
        
        // Clear any existing interval
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }

        // Set up new polling interval
        pollingIntervalRef.current = setInterval(() => {
            console.log('🔄 [RESUME_CONTEXT] Polling for updates...');
            fetchAnalysis(false);
        }, POLLING_INTERVAL);

        // Cleanup on unmount
        return () => {
            if (pollingIntervalRef.current) {
                console.log('🛑 [RESUME_CONTEXT] Clearing polling interval');
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, [status, session, fetchAnalysis]);

    return (
        <ResumesContext.Provider value={{loading, resumesAnalysis, setResumesAnalysis, setLoading, refetchResumes}}>
            {children}
        </ResumesContext.Provider>
    )
}

export const useResumeConAll=()=>{
    const context= useContext(ResumesContext)
    if(!context){
           throw new Error("useResumeConAll must be used within an ResumesContextProvider");
    }
    return context;
}