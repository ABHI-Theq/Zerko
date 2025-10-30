"use client"
import InterviewsBoard from '@/components/interview-boards'
import InterviewDialog from '@/components/InterviewDialog'
import { Button } from '@/components/ui/button'
import { useInterviewCon } from '@/context/InterviewContext'
import { useSession } from 'next-auth/react'
import React, { useEffect, useState } from 'react'

const Dashboard = () => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const {data:session,status}=useSession();
  const {interview,setInterview}=useInterviewCon()
  useEffect(() => {
  if (session?.user && setInterview) {
    setInterview(prev => ({ ...prev, name: session.user!.name! }));
  }
}, [session?.user?.name, setInterview,session?.user]);
  return (
        <div className='relative flex items-start justify-center flex-col gap-4 p-2 w-full'>
      <div className="flex items-start bg-white shadow-lg justify-center p-4 gap-2 flex-col  rounded-lg w-full ">
      <p className='text-3xl text-black '>Welcome back {session?.user?.name}</p>
      <p className='text-sm text-black '>Time to get back on the practice of Interviews for The Big 4</p>
      </div>
      <div className='flex items-center justify-center'>

        <Button
        onClick={()=>{
          setDialogOpen(true)
        }}
         className='bg-black text-gray-200 text-center'>
          Create interview
        </Button>
      </div>
      <hr  className=' my-2 w-full  border-1 border-t-black'/>
      <h2 className='text-2xl font-serif'>Created Interviews</h2>
      <InterviewsBoard/>
      <InterviewDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}

export default Dashboard