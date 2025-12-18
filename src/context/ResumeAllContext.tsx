"use client"
import { ResumeContextDets } from "@/types";
import { useContext, createContext, Dispatch, SetStateAction, useState, useEffect } from "react"
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

interface ResumesContextType {
    resumesAnalysis: ResumeContextDets[];
    loading: boolean;
    setLoading: Dispatch<SetStateAction<boolean>>;
    setResumesAnalysis: Dispatch<SetStateAction<ResumeContextDets[]>>;
}
const ResumesContext = createContext<ResumesContextType | null>(null)


export const ResumesContextProvider = ({ children }: { children: React.ReactNode }) => {
    const [resumesAnalysis, setResumesAnalysis] = useState<ResumeContextDets[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const { data: session, status } = useSession()

    const fetchAnalysis = async () => {
        const fetchId = `ctx_fetch_${Date.now()}`;
        console.log(`🚀 [RESUME_CONTEXT] ${fetchId} - Starting to fetch all resumes`);
        
        try {
            console.log(`📤 [RESUME_CONTEXT] ${fetchId} - Sending request to /api/resume/all`);
            const startTime = Date.now();
            const res = await fetch(`/api/resume/all`, { method: "GET" });
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
            console.log(`✅ [RESUME_CONTEXT] ${fetchId} - Resume context updated successfully`);
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : "Error while fetching resumes list"
            console.error(`❌ [RESUME_CONTEXT] ${fetchId} - Error fetching resumes:`, error);
            toast.error(errMsg)
        }
    }

    useEffect(() => {
        console.log(`🔄 [RESUME_CONTEXT] useEffect triggered - status: ${status}, hasSession: ${!!session}`);

        if (status !== "authenticated" || !session) {
            console.log(`⏸️ [RESUME_CONTEXT] Skipping fetch - not authenticated or no session`);
            return;
        }

        console.log(`🚀 [RESUME_CONTEXT] Starting resume fetch for user: ${session.user?.id}`);
        setLoading(true)
        try {
            fetchAnalysis()
        } catch (error) {
            console.error(`❌ [RESUME_CONTEXT] Error in useEffect:`, error);
            toast.error("Error while fetching resumes")
        } finally {
            setLoading(false)
            console.log(`🏁 [RESUME_CONTEXT] Loading state set to false`);
        }
    }, [status, session, session?.user])

    return (
        <ResumesContext.Provider value={{loading, resumesAnalysis,setResumesAnalysis,setLoading}}>
            {children}
        </ResumesContext.Provider>
    )
}

export const useResumeConAll=()=>{
    const context= useContext(ResumesContext)
    if(!context){
           throw new Error("useResumeConAll must be used within an InterviewAllProvider");
    }
    return context;
}