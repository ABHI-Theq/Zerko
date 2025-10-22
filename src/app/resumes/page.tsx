"use client"
import { Spinner } from '@/components/ui/spinner'
import { InterviewDetails } from '@/types'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

const Page = () => {
    const {data:session,status}=useSession()
    const [resumes, setResumes] = useState<string[]>([]);
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
                    const rsl=data.interviews.map((obj:any)=>obj.resume)
                    console.log(rsl);
                    
                    setResumes(rsl)
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
               <Spinner className='w-20 h-20 '/>
            </div>
        )
    }

  return (
    <>
                <div className='relative flex items-start justify-center flex-col gap-4 p-2 w-full'>
      <div className="flex items-start bg-white shadow-lg justify-center p-4 gap-2 flex-col  rounded-lg w-full ">
      <p className='text-3xl text-black '>Welcome back {session?.user?.name}</p>
      <p className='text-sm text-black '>Time to get back on the practice of Interviews for The Big 4</p>
      </div>
      <div className='mt-5  w-full'>
      <h2 className='text-2xl font-medium font-serif'>Resumes</h2>
      <hr className="w-full border-t-1 border-t-black"/>
      <div className=" m-4 flex  wrap items-center justify-start gap-4">
        
        {
            resumes?(
                
        resumes.map((resume,index)=>(
            <div key={index} className="">
              <Image
            src={resume}
            alt="error"
            width={400}
            height={400}
            onClick={()=>{
                window.open(resume,"_blank")
            }}
            className='cursor-pointer rounded-xl'
           />
            </div>
        ))
        
            ):(
                 <div className="flex items-center justify-center text-2xl text-orange-600">
                        No Interviews Found
                    </div>
            )
        }
      </div>
      </div>
    </div>
    </>
  )
}

export default Page