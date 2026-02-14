import { useResumeConAll } from '@/context/ResumeAllContext';
import { useRouter } from 'next/navigation'
import React from 'react'
import { Spinner } from './ui/spinner';
import { Button } from './ui/button';
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, Eye, Download, MoreVertical, Trash, Loader2 } from 'lucide-react';
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";
import toast from 'react-hot-toast';

const ResumesAnalysisComponent = () => {
    const router = useRouter();
    const { resumesAnalysis, loading, setResumesAnalysis } = useResumeConAll();

    const handleDelete = async (id: string) => {
        const deleteId = `del_${Date.now()}_${id.slice(0, 8)}`;
        console.log(`🗑️ [RESUME_BOARD] ${deleteId} - Starting resume deletion for id: ${id}`);
        
        toast.loading("Deleting resume...");

        try {
            console.log(`📤 [RESUME_BOARD] ${deleteId} - Sending DELETE request to /api/resume/${id}`);
            const startTime = Date.now();
            const res = await fetch(`/api/resume/${id}`, {
                method: 'DELETE'
            });
            const responseTime = Date.now() - startTime;
            
            console.log(`⏱️ [RESUME_BOARD] ${deleteId} - API response received in ${responseTime}ms`);
            
            const data = await res.json();
            if (data.error) {
                console.log(`❌ [RESUME_BOARD] ${deleteId} - API returned error: ${data.error}`);
                throw new Error(data.error);
            }
            
            console.log(`✅ [RESUME_BOARD] ${deleteId} - Resume deleted successfully from server`);
            toast.dismiss();
            toast.success("Resume deleted successfully");
            
            // Update context after deletion
            console.log(`🔄 [RESUME_BOARD] ${deleteId} - Updating local context to remove deleted resume`);
            setResumesAnalysis((resumes) => {
                const filteredResumes = resumes.filter((resume) => resume.id !== id);
                console.log(`📊 [RESUME_BOARD] ${deleteId} - Context updated: ${resumes.length} → ${filteredResumes.length} resumes`);
                return filteredResumes;
            });
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : "Error deleting resume";
            console.error(`❌ [RESUME_BOARD] ${deleteId} - Delete operation failed:`, error);
            console.error(`❌ [RESUME_BOARD] ${deleteId} - Error message: ${errMsg}`);
            toast.dismiss();
            toast.error(errMsg);
            return;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[40vh] w-full">
                <Spinner className="w-12 h-12" />
            </div>
        )
    }

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

    const truncateText = (text: string, maxLength: number) => {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    return (
        <div className='w-full px-2'>
            {resumesAnalysis && resumesAnalysis.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full">
                    {resumesAnalysis.map((resume, index) => (
                        <div 
                            key={resume.id || index}
                            className="group relative bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-gray-300 overflow-hidden"
                        >
                            {/* Delete Button */}
                            <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button className="p-1.5 rounded-md hover:bg-gray-100 transition cursor-pointer">
                                            <MoreVertical className="w-5 h-5 text-gray-600" />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-32 p-2" align="end">
                                        <button
                                            onClick={() => handleDelete(resume.id)}
                                            className="flex items-center gap-2 w-full px-2 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md cursor-pointer"
                                        >
                                            <Trash className="w-4 h-4" />
                                            Delete
                                        </button>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Top gradient bar */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                            {/* Header */}
                            <div className="p-4 md:p-6 pb-4">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-100 rounded-lg">
                                            <FileText className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 text-base md:text-lg line-clamp-1">
                                                {resume.title || `Resume Analysis #${index + 1}`}
                                            </h3>
                                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(resume.status)}`}>
                                                {getStatusIcon(resume.status)}
                                                {resume.status}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Score Display */}
                                {resume.status === 'COMPLETED' && (
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-600">Overall Score</span>
                                            <span className={`text-xl md:text-2xl font-bold ${getScoreColor(resume.totalScore)}`}>
                                                {resume.totalScore}/100
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className={`h-2 rounded-full transition-all duration-300 ${
                                                    resume.totalScore >= 80 ? 'bg-green-500' :
                                                    resume.totalScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}
                                                style={{ width: `${resume.totalScore}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Job Description Preview */}
                                <div className="mb-4">
                                    <h4 className="text-sm font-medium text-gray-600 mb-2">Job Description</h4>
                                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg line-clamp-3">
                                        {truncateText(resume.jobDescription, 120)}
                                    </p>
                                </div>

                                {/* Analysis Preview */}
                                {resume.status === 'COMPLETED' && resume.analysisResult && (
                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-gray-600 mb-2">Analysis Summary</h4>
                                        <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg line-clamp-2">
                                            {(() => {
                                                if (resume.analysisResult && typeof resume.analysisResult === 'object' && 'summary' in resume.analysisResult) {
                                                    return truncateText((resume.analysisResult as any).summary, 100);
                                                } else {
                                                    return "Analysis completed - view details for full results";
                                                }
                                            })()}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="px-4 md:px-6 pb-4 md:pb-6 pt-2 border-t border-gray-100">
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <Button
                                        onClick={() => router.push(`/resumes/${resume.id}`)}
                                        variant="outline"
                                        className="flex-1 h-9 text-sm"
                                        disabled={resume.status === 'PROCESSING'}
                                    >
                                        <FileText className="w-4 h-4 mr-2" />
                                        View Details
                                    </Button>
                                    <Button
                                        onClick={() => router.push(`/resumes/${resume.id}/analysis`)}
                                        className="flex-1 bg-gray-900 hover:bg-gray-800 text-white h-9 text-sm"
                                        disabled={resume.status === 'PROCESSING'}
                                    >
                                        {resume.status === 'PROCESSING' ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Eye className="w-4 h-4 mr-2" />
                                                {resume.status === 'COMPLETED' ? 'View Analysis' : 'View Status'}
                                            </>
                                        )}
                                    </Button>
                                    {resume.cloudinaryUrl && (
                                        <Button
                                            onClick={() => window.open(resume.cloudinaryUrl, '_blank')}
                                            variant="outline"
                                            className="h-9 px-3 sm:flex-none"
                                        >
                                            <Download className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
                    <div className="p-4 bg-gray-100 rounded-full mb-4">
                        <FileText className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Resume Evaluations Yet</h3>
                    <p className="text-gray-600 mb-6 max-w-md">
                        Start by uploading your resume to get detailed analysis and improvement suggestions.
                    </p>
                    <Button
                        onClick={() => router.push('/resumes')}
                        className="bg-gray-900 hover:bg-gray-800 text-white px-6 h-11"
                    >
                        Evaluate Your First Resume
                    </Button>
                </div>
            )}
        </div>
    )
}

export default ResumesAnalysisComponent