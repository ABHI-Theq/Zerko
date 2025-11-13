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
import { useInterviewConAll } from '@/context/InterviewAllContext';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, FileText, ArrowRight, Briefcase } from 'lucide-react';

const InterviewsBoard = () => {
    const router = useRouter();
    const { interviews, loading } = useInterviewConAll();

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
            TECHNICAL: 'bg-blue-50 text-blue-700 border-blue-200',
            HR: 'bg-green-50 text-green-700 border-green-200',
            BEHAVIORAL: 'bg-amber-50 text-amber-700 border-amber-200',
            SYSTEM_DESIGN: 'bg-purple-50 text-purple-700 border-purple-200',
        };
        return colors[type] || 'bg-gray-50 text-gray-700 border-gray-200';
    };

    const formatDate = (dateString: string | Date | null) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className='flex w-full items-center justify-start'>
            {interviews && interviews.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
                    {interviews.map((interview, index) => (
                        <Card
                            key={index}
                            className="group relative overflow-hidden bg-white border border-gray-200/80
                                     rounded-xl shadow-sm hover:shadow-xl transition-all duration-300
                                     hover:scale-[1.02] hover:border-gray-300"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                            <CardHeader className="relative">
                                <div className="flex flex-col gap-1">

                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                            <Briefcase className="w-5 h-5 text-gray-700" />
                                        </div>

                                        <CardTitle className="text-base font-bold text-gray-900 line-clamp-2 group-hover:text-gray-700 transition-colors">
                                            {interview.post}
                                        </CardTitle>
                                    </div>

                                    <CardAction
                                        className={`text-xs font-semibold px-2.5 py-1 rounded-md border mt-1 w-fit ${getInterviewTypeColor(interview.interviewType || '')}`}
                                    >
                                        {interview.interviewType}
                                    </CardAction>

                                </div>
                            </CardHeader>


                            <CardContent className="relative z-10">
                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                        <FileText className="w-10 h-10 text-gray-400" />
                                        <p className="line-clamp-2 leading-relaxed">
                                            {interview.jobDescription && interview.jobDescription.length > 100
                                                ? `${interview.jobDescription.substring(0, 100)}...`
                                                : interview.jobDescription || 'No description'}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs">
                                        <div className="flex items-center gap-1.5 text-gray-600">
                                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                                            <span className="font-medium">{interview.duration || 'N/A'}m</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-gray-600">
                                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                            <span className="font-medium">{formatDate(interview.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>

                            <CardFooter className="relative z-10 border-t border-gray-100 bg-gray-50/80 rounded-b-xl">
    <button
        onClick={(e) => {
            e.stopPropagation();
            router.push(`/interviews/${interview.id}`);
        }}
        className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-gray-700 
                   hover:text-gray-900 transition-all group cursor-pointer"
    >
        <span>View Details</span>
        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
    </button>
</CardFooter>

                        </Card>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center w-full py-20 gap-4">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
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