"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ResumeContextDets } from "@/types";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import ResumeAnalysisDisplay from "@/components/ResumeAnalysisDisplay";
import { useResumeConAll } from "@/context/ResumeAllContext";

const ResumeAnalysisPage = () => {
  const params = useParams();
  const router = useRouter();
  const resumeId = params.resumeId as string;
  const { resumesAnalysis } = useResumeConAll();
  
  const [resume, setResume] = useState<ResumeContextDets | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  // Health check function for Python API
  const checkPythonApiHealth = async (): Promise<boolean> => {
    const healthId = `health_${Date.now()}`;
    console.log(`🏥 [HEALTH_CHECK] ${healthId} - Checking Python API health`);
    
    try {
      const pythonApiUrl = process.env.NEXT_PUBLIC_AGENT_API_URL || 'http://localhost:8000';
      const response = await fetch(`${pythonApiUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      const isHealthy = response.ok;
      console.log(`${isHealthy ? '✅' : '❌'} [HEALTH_CHECK] ${healthId} - Python API health: ${isHealthy ? 'OK' : 'FAILED'}`);
      return isHealthy;
    } catch (error) {
      console.error(`❌ [HEALTH_CHECK] ${healthId} - Health check failed:`, error);
      return false;
    }
  };

  // Initial fetch function (shows loading)
  const fetchResumeData = async () => {
    const fetchId = `fetch_${Date.now()}`;
    console.log(`🚀 [INITIAL_FETCH] ${fetchId} - Starting initial data fetch for resume: ${resumeId}`);
    
    try {
      setLoading(true);
      setError(null);
      
      console.log(`📤 [INITIAL_FETCH] ${fetchId} - Sending request to /api/resume/${resumeId}`);
      const startTime = Date.now();
      const response = await fetch(`/api/resume/${resumeId}`);
      const responseTime = Date.now() - startTime;
      
      console.log(`⏱️ [INITIAL_FETCH] ${fetchId} - Response received in ${responseTime}ms`);
      
      if (!response.ok) {
        console.log(`❌ [INITIAL_FETCH] ${fetchId} - Request failed with status: ${response.status}`);
        if (response.status === 404) {
          throw new Error("Resume not found");
        }
        throw new Error("Failed to fetch resume data");
      }
      
      const data = await response.json();
      console.log(`📊 [INITIAL_FETCH] ${fetchId} - Resume data received:`, {
        id: data.id,
        title: data.title,
        status: data.status,
        totalScore: data.totalScore,
        hasAnalysisResult: !!data.analysisResult
      });
      
      setResume(data);
      console.log(`✅ [INITIAL_FETCH] ${fetchId} - Resume state updated successfully`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      console.log(`❌ [INITIAL_FETCH] ${fetchId} - Fetch failed:`, errorMessage);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      console.log(`🏁 [INITIAL_FETCH] ${fetchId} - Initial fetch completed`);
    }
  };

  // Background polling function (no loading state change)
  const pollResumeStatus = async () => {
    const pollId = `poll_${Date.now()}`;
    console.log(`🔄 [POLLING] ${pollId} - Starting background status check for resume: ${resumeId}`);
    
    try {
      const startTime = Date.now();
      const response = await fetch(`/api/resume/${resumeId}`);
      const responseTime = Date.now() - startTime;
      
      console.log(`⏱️ [POLLING] ${pollId} - API response received in ${responseTime}ms`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`📊 [POLLING] ${pollId} - Current status: ${data.status}, Score: ${data.totalScore}`);
        
        // Check if status changed
        if (resume && data.status !== resume.status) {
          console.log(`🔄 [POLLING] ${pollId} - Status changed: ${resume.status} → ${data.status}`);
        }
        
        setResume(data);
        
        // Log when analysis completes or fails
        if (data.status === 'COMPLETED') {
          console.log(`✅ [POLLING] ${pollId} - Analysis completed! Final score: ${data.totalScore}`);
          toast.success("Resume analysis completed successfully!");
        } else if (data.status === 'FAILED') {
          console.log(`❌ [POLLING] ${pollId} - Analysis failed`);
          toast.error("Resume analysis failed. Please try again or contact support.");
        } else if (data.status === 'PROCESSING') {
          // Check if analysis has been processing for too long (more than 10 minutes)
          const createdAt = new Date(data.createdAt || data.updatedAt);
          const now = new Date();
          const processingTime = now.getTime() - createdAt.getTime();
          const maxProcessingTime = 10 * 60 * 1000; // 10 minutes
          
          if (processingTime > maxProcessingTime) {
            console.log(`⚠️ [POLLING] ${pollId} - Analysis has been processing for ${Math.round(processingTime / 60000)} minutes, marking as failed`);
            
            // Automatically mark as failed
            try {
              await fetch(`/api/resume/${resumeId}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 'FAILED' }),
              });
              console.log(`✅ [POLLING] ${pollId} - Status updated to FAILED due to timeout`);
              toast.error("Analysis timed out. Please try again.");
            } catch (timeoutError) {
              console.error(`❌ [POLLING] ${pollId} - Failed to update timeout status:`, timeoutError);
            }
          }
        }
      } else {
        console.log(`❌ [POLLING] ${pollId} - API request failed with status: ${response.status}`);
      }
    } catch (err) {
      // Silent fail for background polling
      console.error(`❌ [POLLING] ${pollId} - Background polling error:`, err);
    }
  };

  // Retry analysis function
  const retryAnalysis = async () => {
    const retryId = `retry_${Date.now()}`;
    console.log(`🔄 [RETRY_ANALYSIS] ${retryId} - Starting retry for resume: ${resumeId}`);
    
    if (!resume) {
      console.log(`❌ [RETRY_ANALYSIS] ${retryId} - No resume data available for retry`);
      return;
    }

    setRetrying(true);
    
    try {
      // First, check if Python API is healthy
      console.log(`🏥 [RETRY_ANALYSIS] ${retryId} - Checking Python API health before retry`);
      const isApiHealthy = await checkPythonApiHealth();
      
      if (!isApiHealthy) {
        throw new Error('Python API is not available. Please ensure the analysis service is running.');
      }
      
      console.log(`📤 [RETRY_ANALYSIS] ${retryId} - Python API is healthy, proceeding with retry`);
      
      // Create the same payload as the original request
      const retryPayload = {
        resumeId: resume.id,
        fileUrl: resume.cloudinaryUrl,
        JobDescription: resume.jobDescription,
      };
      
      console.log(`📋 [RETRY_ANALYSIS] ${retryId} - Retry payload:`, retryPayload);
      
      // First, update status back to PROCESSING
      const updateResponse = await fetch(`/api/resume/${resumeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'PROCESSING' }),
      });
      
      if (updateResponse.ok) {
        console.log(`✅ [RETRY_ANALYSIS] ${retryId} - Status updated to PROCESSING`);
        // Update local state
        setResume(prev => prev ? { ...prev, status: 'PROCESSING' } : null);
        
        // Call Python API directly
        const pythonApiUrl = process.env.NEXT_PUBLIC_AGENT_API_URL || 'http://localhost:8000';
        const pythonResponse = await fetch(`${pythonApiUrl}/api/analysis`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(retryPayload),
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        if (pythonResponse.ok) {
          console.log(`✅ [RETRY_ANALYSIS] ${retryId} - Retry request sent successfully`);
          toast.success("Analysis retry started! The page will update automatically when complete.");
        } else {
          const errorText = await pythonResponse.text();
          throw new Error(`Python API returned ${pythonResponse.status}: ${errorText}`);
        }
      } else {
        const errorData = await updateResponse.json();
        throw new Error(errorData.error || 'Failed to update resume status');
      }
      
    } catch (error) {
      console.error(`❌ [RETRY_ANALYSIS] ${retryId} - Retry failed:`, error);
      const errorMsg = error instanceof Error ? error.message : 'Retry failed';
      toast.error(`Retry failed: ${errorMsg}`);
      
      // If retry fails, make sure to reset status back to FAILED
      try {
        await fetch(`/api/resume/${resumeId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'FAILED' }),
        });
        setResume(prev => prev ? { ...prev, status: 'FAILED' } : null);
        console.log(`🔄 [RETRY_ANALYSIS] ${retryId} - Status reset to FAILED after retry failure`);
      } catch (resetError) {
        console.error(`❌ [RETRY_ANALYSIS] ${retryId} - Failed to reset status:`, resetError);
      }
    } finally {
      setRetrying(false);
      console.log(`🏁 [RETRY_ANALYSIS] ${retryId} - Retry process completed`);
    }
  };

  // Try to get resume from context first, then fetch if not found
  useEffect(() => {
    if (resumeId) {
      // Check if resume exists in context
      const contextResume = resumesAnalysis.find(r => r.id === resumeId);
      
      if (contextResume) {
        console.log('✅ [RESUME_ANALYSIS] Using resume from context (instant load)');
        setResume(contextResume);
        setLoading(false);
      } else {
        console.log('🔄 [RESUME_ANALYSIS] Resume not in context, fetching from API');
        fetchResumeData();
      }
    }
  }, []); // Only run once on mount

  // Background polling for processing status
  useEffect(() => {
    if (resume?.status === "PROCESSING") {
      console.log(`🔄 [POLLING_SETUP] Starting polling for resume: ${resumeId} (status: ${resume.status})`);
      
      const interval = setInterval(() => {
        pollResumeStatus(); // Use background polling instead
      }, 3000);

      return () => {
        console.log(`🛑 [POLLING_SETUP] Stopping polling for resume: ${resumeId}`);
        clearInterval(interval);
      };
    } else if (resume?.status) {
      console.log(`ℹ️ [POLLING_SETUP] No polling needed for resume: ${resumeId} (status: ${resume.status})`);
    }
  }, [resume?.status]); // Only depend on status, not resumeId

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner className="w-12 h-12 mx-auto mb-4" />
          <p className="text-gray-600">Loading resume analysis...</p>
        </div>
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {error === "Resume not found" ? "Resume Not Found" : "Error Loading Resume"}
            </h2>
            <p className="text-gray-600 mb-6">
              {error || "We couldn't load your resume analysis. Please try again."}
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => router.push("/resumes")}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Resumes
            </Button>
            <Button
              onClick={fetchResumeData}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative z-10">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push(`/resumes/${resumeId}`)}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Resume
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{resume.title} - Analysis</h1>
                <p className="text-sm text-gray-600">
                  Created on {new Date(resume.createdAt || "").toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {resume.cloudinaryUrl && (
                <Button
                  onClick={() => window.open(resume.cloudinaryUrl, "_blank")}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Resume
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ResumeAnalysisDisplay 
          resume={resume} 
          onRetry={retryAnalysis}
          retrying={retrying}
        />
      </div>
    </div>
  );
};

export default ResumeAnalysisPage;