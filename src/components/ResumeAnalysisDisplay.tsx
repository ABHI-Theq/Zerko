"use client";
import { ResumeContextDets } from "@/types";
import { Spinner } from "./ui/spinner";
import { Button } from "./ui/button";
import { 
  XCircle, 
  AlertCircle, 
  FileText,
  AlertTriangle,
  ArrowLeft,
  RefreshCw
} from "lucide-react";

interface ResumeAnalysisDisplayProps {
  resume: ResumeContextDets;
  onRetry?: () => void;
  retrying?: boolean;
}

const ResumeAnalysisDisplay = ({ resume, onRetry, retrying = false }: ResumeAnalysisDisplayProps) => {
  console.log(`🎨 [RESUME_DISPLAY] Rendering resume analysis display:`, {
    resumeId: resume.id,
    status: resume.status,
    totalScore: resume.totalScore,
    hasAnalysisResult: !!resume.analysisResult,
    title: resume.title
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Processing State
  if (resume.status === 'PROCESSING') {
    console.log(`⏳ [RESUME_DISPLAY] Rendering PROCESSING state for resume: ${resume.id}`);
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg p-12">
          <div className="text-center">
            <div className="mb-8">
              <div className="relative">
                <Spinner className="w-12 h-12 mx-auto mb-6 text-blue-600" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full animate-ping"></div>
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Analyzing Your Resume</h2>
              <p className="text-gray-600 mb-6">
                Our AI is carefully analyzing your resume against the job description. This usually takes 2-3 minutes.
              </p>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm">
                💡 We &#39; re evaluating your resume for relevance, formatting, keywords, and overall presentation quality. This page will automatically update when complete.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                <span>Auto-checking status every 3 seconds</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Failed State
  if (resume.status === 'FAILED') {
    console.log(`❌ [RESUME_DISPLAY] Rendering FAILED state for resume: ${resume.id}`);
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg p-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Analysis Failed</h2>
            <p className="text-gray-600 mb-8">
              We encountered an error while analyzing your resume. This could be due to file format issues, temporary server problems, or the analysis service being unavailable.
            </p>

            <div className="bg-red-50 rounded-lg p-4 mb-8 text-left">
              <p className="text-red-800 text-sm">
                <strong>Common causes and solutions:</strong>
              </p>
              <ul className="text-red-700 text-sm mt-2 space-y-1">
                <li>• <strong>Service unavailable:</strong> The analysis service may be down. Try the retry button.</li>
                <li>• <strong>File format:</strong> Ensure your resume is in PDF, DOC, or DOCX format</li>
                <li>• <strong>File corruption:</strong> Check that the file isn &#39; t corrupted or password-protected</li>
                <li>• <strong>Timeout:</strong> Large files or complex layouts may cause timeouts</li>
                <li>• <strong>Network issues:</strong> Check your internet connection and try again</li>
              </ul>
            </div>

            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => window.location.href = '/resumes'}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Resumes
              </Button>
              {onRetry && (
                <Button
                  onClick={onRetry}
                  disabled={retrying}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
                  {retrying ? 'Retrying...' : 'Retry Analysis'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Uploaded State (shouldn't happen but just in case)
  if (resume.status === 'UPLOADED') {
    console.log(`📤 [RESUME_DISPLAY] Rendering UPLOADED state for resume: ${resume.id}`);
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Resume Uploaded</h2>
              <p className="text-gray-600 mb-6">
                Your resume has been uploaded successfully. Analysis should start automatically.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Waiting for analysis to start...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Completed State - Show Analysis Results
  if (resume.status === 'COMPLETED') {
    console.log(`✅ [RESUME_DISPLAY] Rendering COMPLETED state for resume: ${resume.id}, score: ${resume.totalScore}`);
    let analysisData: any = null;
    try {
      // Handle both string and object cases from database
      if (typeof resume.analysisResult === 'string') {
        console.log(`🔄 [RESUME_DISPLAY] Parsing analysis result from string for resume: ${resume.id}`);
        analysisData = JSON.parse(resume.analysisResult);
      } else if (resume.analysisResult && typeof resume.analysisResult === 'object') {
        console.log(`📊 [RESUME_DISPLAY] Using analysis result object for resume: ${resume.id}`);
        analysisData = resume.analysisResult;
      }
      console.log(`📋 [RESUME_DISPLAY] Analysis data keys:`, analysisData ? Object.keys(analysisData) : 'null');
    } catch (error) {
      console.error(`❌ [RESUME_DISPLAY] Error parsing analysis result for resume ${resume.id}:`, error);
      analysisData = null;
    }

    return (
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Overall Score Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg p-8 mb-8">
          <div className="text-center">
            <div className={`text-6xl font-bold mb-2 ${getScoreColor(resume.totalScore)}`}>
              {resume.totalScore}
            </div>
            <div className="text-gray-500 text-lg mb-4">out of 100</div>
            <div className="w-64 bg-gray-100 rounded-full h-2 mx-auto mb-4">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${getScoreBgColor(resume.totalScore)}`}
                style={{ width: `${resume.totalScore}%` }}
              />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Overall Resume Score</h2>
            <p className="text-gray-600">Based on job requirements and best practices</p>
          </div>
        </div>

        {/* Job Description */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Target Job Description</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{resume.jobDescription}</p>
          </div>
        </div>

        {/* Analysis Results */}
        {analysisData ? (
          <div className="space-y-6">
            {/* Summary */}
            {analysisData.summary && (
              <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Executive Summary</h3>
                <p className="text-gray-700 leading-relaxed">{analysisData.summary}</p>
              </div>
            )}

            {/* Score Breakdown */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Detailed Analysis</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Relevance */}
                {analysisData.relevance && (
                  <div className="bg-white/80 border border-gray-200 rounded-lg p-5 hover:border-gray-300 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Skills Relevance</h4>
                      <span className={`text-xl font-semibold ${analysisData.relevance.score >= 16 ? 'text-green-600' : analysisData.relevance.score >= 12 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {analysisData.relevance.score}/20
                      </span>
                    </div>
                    <div className="space-y-2">
                      {analysisData.relevance.matched?.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-green-700 mb-1">Matched Skills:</p>
                          <div className="flex flex-wrap gap-1">
                            {analysisData.relevance.matched.map((skill: string, index: number) => (
                              <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {analysisData.relevance.missing?.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-red-700 mb-1">Missing Skills:</p>
                          <div className="flex flex-wrap gap-1">
                            {analysisData.relevance.missing.map((skill: string, index: number) => (
                              <span key={index} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {analysisData.relevance.suggestion && (
                        <p className="text-sm text-gray-600 mt-2">{analysisData.relevance.suggestion}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Impact */}
                {analysisData.impact && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">Impact & Metrics</h4>
                      <span className={`text-lg font-bold ${(analysisData.impact.quantification_score + analysisData.impact.action_verbs_score) >= 20 ? 'text-green-600' : (analysisData.impact.quantification_score + analysisData.impact.action_verbs_score) >= 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {analysisData.impact.quantification_score + analysisData.impact.action_verbs_score}/25
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Quantification:</span>
                        <span className="font-medium">{analysisData.impact.quantification_score}/15</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Action Verbs:</span>
                        <span className="font-medium">{analysisData.impact.action_verbs_score}/10</span>
                      </div>
                      {analysisData.impact.suggestion && (
                        <p className="text-sm text-gray-600 mt-2">{analysisData.impact.suggestion}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* ATS Compatibility */}
                {analysisData.ats_compatibility && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">ATS Compatibility</h4>
                      <span className={`text-lg font-bold ${analysisData.ats_compatibility.score >= 16 ? 'text-green-600' : analysisData.ats_compatibility.score >= 12 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {analysisData.ats_compatibility.score}/20
                      </span>
                    </div>
                    <div className="space-y-2">
                      {analysisData.ats_compatibility.detected_sections?.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Detected Sections:</p>
                          <div className="flex flex-wrap gap-1">
                            {analysisData.ats_compatibility.detected_sections.map((section: string, index: number) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                {section}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {analysisData.ats_compatibility.formatting_issues?.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-orange-700 mb-1">Formatting Issues:</p>
                          <ul className="text-sm text-orange-600 space-y-1">
                            {analysisData.ats_compatibility.formatting_issues.map((issue: string, index: number) => (
                              <li key={index} className="flex items-start gap-1">
                                <span className="text-orange-500 mt-0.5">•</span>
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Job Alignment */}
                {analysisData.jd_alignment && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">Job Alignment</h4>
                      <span className={`text-lg font-bold ${analysisData.jd_alignment.score >= 20 ? 'text-green-600' : analysisData.jd_alignment.score >= 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {analysisData.jd_alignment.score}/25
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Match Status:</span>
                        <span className={`font-medium px-2 py-1 rounded text-xs ${
                          analysisData.jd_alignment.match_status === 'High' ? 'bg-green-100 text-green-800' :
                          analysisData.jd_alignment.match_status === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {analysisData.jd_alignment.match_status}
                        </span>
                      </div>
                      {analysisData.jd_alignment.suggestion && (
                        <p className="text-sm text-gray-600 mt-2">{analysisData.jd_alignment.suggestion}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Analysis Data Unavailable</h3>
              <p className="text-gray-600">
                The detailed analysis results couldn &#39; t be displayed. The analysis may still be processing.
              </p>
            </div>
          </div>
        )}

        {/* Resume Text (if available) */}
        {resume.resumeText && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-100 rounded-lg">
                <FileText className="w-5 h-5 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Extracted Resume Text</h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                {resume.resumeText}
              </pre>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default fallback
  console.log(`⚠️ [RESUME_DISPLAY] Rendering default fallback state for resume: ${resume.id}, status: ${resume.status}`);
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unknown Status</h2>
          <p className="text-gray-600 mb-6">
            We &#39; re not sure about the current status of your resume analysis.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
            <span>Status will update automatically</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeAnalysisDisplay;