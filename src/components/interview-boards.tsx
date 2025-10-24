import Image from 'next/image';
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Spinner } from './ui/spinner';
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { useInterviewConAll } from '@/context/InterviewAllContext';
import { useRouter } from 'next/navigation';
import { InterviewDetails } from '@/types';

const InterviewsBoard = () => {
    const router=useRouter();
    // const {interviews,setInterviews}=useInterviewConAll();
    const [interviews,setInterviews]=useState<InterviewDetails[]>()
    const [loading, setLoading] = useState<boolean>(false);
    useEffect(() => {
        (async () => {
            setLoading(true)
            try {
                "use server"
                const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/interview/all`,
                    {
                        method: "GET",
                        headers: {
                            "content-type": "Application/Json"
                        }
                    }
                )
                const data = await res.json();
                if (data.error) {
                    toast.error(data.error)
                    return;
                }
                setInterviews([...data.interviews])
            } catch (error) {
                const errMsg = error instanceof Error ? error.message : "Error while fetching interviews"
                toast.error(errMsg);

            } finally {
                setLoading(false);
            }
        })()
    }, [])

    if (loading) {
        return (
            <div className="relative flex items-center justify-center min-h-[65vh] w-full">
                <Spinner className='w-20 h-20 ' />
            </div>
        )
    }
    return (

        <div className='flex  w-full items-center justify-start '>
            {
  interviews?.length!>0 ? (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full p-4">
      {interviews!.map((interview, index) => (
        <Card
          key={index}
          onClick={() => {
            // 🔹 Replace with your navigation or modal
            console.log("Clicked:", interview.post);
            toast.success(`Opening interview: ${interview.post}`);
          }}
          className="group relative overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 
                     rounded-2xl shadow-sm cursor-pointer transition-all duration-300 
                     hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98]"
        >
          {/* Hover Glow Border Effect */}
          <div className="absolute inset-0 bg-gray-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              {interview.post?.toUpperCase()}
            </CardTitle>
            <CardAction className="absolute top-3 right-3 bg-blue-600/10 text-blue-700 dark:text-blue-300 
                                   text-xs font-medium px-3 py-1 rounded-full border border-blue-400/30">
              {interview.interviewType}
            </CardAction>
          </CardHeader>

          <CardContent className="relative z-10 p-4 mx-5 bg-gray-50 dark:bg-gray-800/60 rounded-lg">
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              { interview!.jobDescription!.length > 200
                ? `${interview!.jobDescription!.substring(0, 200)}...`
                : interview.jobDescription}
            </p>
          </CardContent>

          <CardFooter className="relative z-10 flex justify-between items-center text-sm border-t border-gray-200 dark:border-gray-700 pt-3 mt-2">
            <p className="text-gray-500 dark:text-gray-400">
              Duration: <span className="text-gray-800 dark:text-white font-medium">{interview.duration}m</span>
            </p>
            <span  className="text-blue-600 dark:text-blue-400 text-xs font-semibold group-hover:underline">
              <button onClick={()=>{
                router.push(`/interviews/${interview.id}`)
              }}>
                View Details →
              </button>
            </span>
          </CardFooter>
        </Card>
      ))}
    </div>
  ) : (
    <div className="flex items-center justify-center text-2xl text-orange-600 w-full py-16 z-10">
      No Interviews Found
    </div>
  )
}


        </div>
    )
}

export default InterviewsBoard