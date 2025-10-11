import Image from 'next/image';
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

const InterviewsBoard = () => {

    const [interviews, setInterviews] = useState<any[]>([]);
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
                <div className="w-16 h-16 border-10 border-t-black border-b-black border-l-transparent border-r-transparent rounded-full animate-spin"></div>
            </div>
        )
    }
    return (

        <div className='flex relative w-full items-center justify-start'>
            {
                interviews.length > 0 ? (
                    interviews.map((interview, index) => (
                        <div key={index} className="p-4 border rounded-md shadow-sm mb-3">
<Image
  src={interview.resume}
alt="resume"
width={400}
height={400}
  title="Resume"
/>

                        </div>
                    ))
                ) : (
                    <div className="flex items-center justify-center text-2xl text-orange-600">
                        No Interviews Found
                    </div>
                )
            }

        </div>
    )
}

export default InterviewsBoard