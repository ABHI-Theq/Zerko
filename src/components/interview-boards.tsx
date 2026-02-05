import React from 'react'
import toast from 'react-hot-toast'
import { Spinner } from './ui/spinner';
import {
    Card,
    CardAction,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { MoreVertical, Trash, Star, TrendingUp, Award } from "lucide-react";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";

import { useInterviewConAll } from '@/context/InterviewAllContext';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, FileText, ArrowRight, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';

const InterviewsBoard = () => {
    const router = useRouter();
    const { interviews,setInterviews, loading } = useInterviewConAll();

    if (loading) {
        return (
            <div className="relative flex flex-col items-center justify-center min-h-[65vh] w-full gap-4">
                <Spinner className='w-16 h-16 text-gray-700' />
                <p className="text-sm text-gray-500">Loading your interviews...</p>
            </div>
        )
    }

    const getInterviewTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            TECHNICAL: 'bg-blue-500',
            HR: 'bg-green-500',
            BEHAVIORAL: 'bg-amber-500',
            SYSTEM_DESIGN: 'bg-purple-500',
        };
        return colors[type] || 'bg-gray-500';
    };

    const getInterviewTypeBadge = (type: string) => {
        const colors: Record<string, string> = {
            TECHNICAL: 'bg-blue-50 text-blue-700 border-blue-200',
            HR: 'bg-green-50 text-green-700 border-green-200',
            BEHAVIORAL: 'bg-amber-50 text-amber-700 border-amber-200',
            SYSTEM_DESIGN: 'bg-purple-50 text-purple-700 border-purple-200',
        };
        return colors[type] || 'bg-gray-50 text-gray-700 border-gray-200';
    };

    const getRatingColor = (rating: number | null | undefined) => {
        if (!rating) return "from-gray-400 to-gray-500";
        if (rating >= 8) return "from-green-500 to-emerald-600";
        if (rating >= 6) return "from-blue-500 to-cyan-600";
        if (rating >= 4) return "from-yellow-500 to-orange-600";
        return "from-red-500 to-rose-600";
    };

    const formatDate = (dateString: string | Date | null) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const handleDelete =async (id: string) => {
        toast.loading("Deleting interview...");

        try {
            const res=await fetch(`/api/interview/${id}/end`, {
                method: 'GET'
            });
            const data=await res.json();
            if(data.error){
                throw new Error(data.error);
            }
            toast.dismiss();
            toast.success("Interview deleted successfully");
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : "Error deleting interview";
            toast.dismiss();
            toast.error(errMsg);
            return;
        }
            //Updating Interview Context after deletion
            setInterviews((interviews)=>{
                return  interviews.filter((interview)=>interview.id!==id)
            });
    };


    return (
        <div className='flex w-full items-center justify-start'>
            {interviews && interviews.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                    {interviews.map((interview, index) => (
                        <motion.div
                            key={interview.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="h-full"
                        >
                            <Card
                                className="group relative overflow-hidden bg-white border border-gray-200
                                         rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300
                                         hover:-translate-y-1 cursor-pointer h-full flex flex-col"
                                onClick={() => router.push(`/interviews/${interview.id}`)}
                            >
                                {/* Colored Top Border */}
                                <div className={`absolute top-0 left-0 w-full h-1.5 ${getInterviewTypeColor(interview.interviewType || '')} opacity-80`}></div>

                                {/* Delete Button */}
                                <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <Popover>
                                        <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <button className="p-2 rounded-lg hover:bg-gray-100 bg-white shadow-md transition">
                                                <MoreVertical className="w-4 h-4 text-gray-600" />
                                            </button>
                                        </PopoverTrigger>

                                        <PopoverContent className="w-36 p-2" align="end">
                                            <button
                                                onClick={async(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(interview.id as string);
                                                }}
                                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                                            >
                                                <Trash className="w-4 h-4" />
                                                Delete
                                            </button>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex-1 min-w-0">
                                            {/* Interview Name */}
                                            <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                                                {interview.name || 'Untitled Interview'}
                                            </h3>
                                            {/* Post Title */}
                                            <p className="text-sm text-gray-600 line-clamp-1 flex items-center gap-2">
                                                <Briefcase className="w-4 h-4 flex-shrink-0" />
                                                {interview.post}
                                            </p>
                                        </div>

                                        {/* Rating Badge */}
                                        {interview.overall_rating && (
                                            <div className={`flex-shrink-0 bg-gradient-to-br ${getRatingColor(interview.overall_rating)} p-2 rounded-xl shadow-lg`}>
                                                <div className="flex items-center gap-1">
                                                    <Star className="w-3 h-3 text-white fill-white" />
                                                    <span className="text-sm font-bold text-white">{interview.overall_rating}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Interview Type Badge */}
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${getInterviewTypeBadge(interview.interviewType || '')}`}>
                                            {interview.interviewType}
                                        </span>
                                    </div>
                                </CardHeader>

                                <CardContent className="pb-4 flex-1">
                                    {/* Job Description Preview */}
                                    <div className="mb-4 h-[60px]">
                                        <div className="flex items-start gap-2 text-sm text-gray-600">
                                            <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                            <p className="line-clamp-3 leading-relaxed">
                                                {interview.jobDescription && interview.jobDescription.length > 80
                                                    ? interview.jobDescription.substring(0, 80).replace(/\*\*(.*?)\*\*/g, "$1") + "..."
                                                    : interview.jobDescription || 'No description'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex items-center gap-2 text-xs bg-gray-50 rounded-lg p-2">
                                            <Clock className="w-4 h-4 text-blue-500" />
                                            <div>
                                                <p className="text-gray-500 text-[10px] uppercase">Duration</p>
                                                <p className="font-semibold text-gray-900">{interview.duration}m</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs bg-gray-50 rounded-lg p-2">
                                            <Calendar className="w-4 h-4 text-purple-500" />
                                            <div>
                                                <p className="text-gray-500 text-[10px] uppercase">Date</p>
                                                <p className="font-semibold text-gray-900">{formatDate(interview.createdAt)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Performance Indicators */}
                                    {(interview.strengths?.length || interview.improvements?.length) && (
                                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 min-h-[40px]">
                                            {interview.strengths && interview.strengths.length > 0 && (
                                                <div className="flex items-center gap-1.5 text-xs text-green-600">
                                                    <Award className="w-3.5 h-3.5" />
                                                    <span className="font-medium">{interview.strengths.length} Strengths</span>
                                                </div>
                                            )}
                                            {interview.improvements && interview.improvements.length > 0 && (
                                                <div className="flex items-center gap-1.5 text-xs text-orange-600">
                                                    <TrendingUp className="w-3.5 h-3.5" />
                                                    <span className="font-medium">{interview.improvements.length} Tips</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>

                                <CardFooter className="border-t border-gray-100 bg-gradient-to-br from-gray-50 to-white">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/interviews/${interview.id}`);
                                        }}
                                        className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-gray-700 
                                                 hover:text-blue-600 transition-all group/btn py-1"
                                    >
                                        <span>View Details</span>
                                        <ArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" />
                                    </button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center w-full py-20 gap-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <FileText className="w-10 h-10 text-gray-400" />
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-semibold text-gray-700 mb-1">No Interviews Yet</p>
                        <p className="text-sm text-gray-500">Create your first interview to get started</p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default InterviewsBoard