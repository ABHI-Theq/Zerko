"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ResumeContextDets, AnalysisResult } from "@/types";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Download, 
  RefreshCw, 
  FileText, 
  Calendar,
  Target,
  BarChart3,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";

const ResumeDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const resumeId = params.resumeId as string;
  
  const [resume, setResume] = useState<ResumeContextDets | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResumeData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/resume/${resumeId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Resume not found");
        }
        throw new Error("Failed to fetch resume data");
      }
      
      const data = await response.json();
      setResume(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (resumeId) {
      fetchResumeData();
    }
  }, [resumeId]);

  // Background polling function (no loading state change)
  const pollResumeStatus = async () => {
    try {
      const response = await fetch(`/api/resume/${resumeId}`);
      
      if (response.ok) {
        const data = await response.json();
        setResume(data);
      }
    } catch (err) {
      // Silent fail for background polling
      console.error("Background polling error:", err);
    }
  };

  // Auto-refresh for processing status
  useEffect(() => {
    if (resume?.status === "PROCESSING") {
      const interval = setInterval(() => {
        pollResumeStatus(); // Use background polling instead
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [resume?.status, resumeId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'PROCESSING':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'UPLOADED':
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'PROCESSING':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'FAILED':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'UPLOADED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner className="w-12 h-12 mx-auto mb-4" />
          <p className="text-gray-600">Loading resume details...</p>
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
              {error || "We couldn't load your resume details. Please try again."}
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
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push("/resumes")}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Resumes
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{resume.title}</h1>
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
              <Button
                onClick={() => router.push(`/resumes/${resumeId}/analysis`)}
                className="flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                View Analysis
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <FileText className="w-8 h-8 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Resume Status</h2>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border mt-2 ${getStatusColor(resume.status)}`}>
                    {getStatusIcon(resume.status)}
                    {resume.status}
                  </div>
                </div>
              </div>
              
              {resume.status === 'COMPLETED' && (
                <div className="text-right">
                  <div className="text-sm text-gray-600 mb-1">Overall Score</div>
                  <div className={`text-3xl font-bold ${getScoreColor(resume.totalScore)}`}>
                    {resume.totalScore}/100
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Resume Info */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Job Target</h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-wrap">{resume.jobDescription}</p>
            </div>
          </div>

          {/* Resume Text Preview */}
          {resume.resumeText && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Resume Content Preview</h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                  {resume.resumeText.substring(0, 500)}
                  {resume.resumeText.length > 500 && "..."}
                </pre>
              </div>
            </div>
          )}

          {/* Analysis Summary */}
          {resume.status === 'COMPLETED' && resume.analysisResult && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Analysis Summary</h3>
                </div>
                <Button
                  onClick={() => router.push(`/resumes/${resumeId}/analysis`)}
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Full Analysis
                </Button>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-blue-800">
                  {(() => {
                    if (resume.analysisResult && typeof resume.analysisResult === 'object' && 'summary' in resume.analysisResult) {
                      const analysisData = resume.analysisResult as AnalysisResult;
                      const summary = analysisData.summary;
                      return summary.substring(0, 200) + (summary.length > 200 ? "..." : "");
                    } else {
                      return "Detailed analysis available - click 'View Full Analysis' to see complete results.";
                    }
                  })()}
                </p>
              </div>
            </div>
          )}

          {/* Processing State */}
          {resume.status === 'PROCESSING' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-center py-8">
                <Spinner className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Analysis in Progress</h3>
                <p className="text-gray-600 mb-4">
                  Our AI is analyzing your resume. This usually takes 2-3 minutes.
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Spinner className="w-4 h-4" />
                  <span>Auto-refreshing status...</span>
                </div>
              </div>
            </div>
          )}

          {/* Failed State */}
          {resume.status === 'FAILED' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Analysis Failed</h3>
                <p className="text-gray-600 mb-4">
                  There was an error analyzing your resume. Please try uploading again.
                </p>
                <Button
                  onClick={() => router.push("/resumes")}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Resumes
                </Button>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Details</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Created:</span>
                <span className="ml-2 font-medium">
                  {new Date(resume.createdAt || "").toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Last Updated:</span>
                <span className="ml-2 font-medium">
                  {new Date(resume.updatedAt || "").toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Resume ID:</span>
                <span className="ml-2 font-mono text-xs">{resume.id}</span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="ml-2 font-medium">{resume.status}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeDetailsPage;