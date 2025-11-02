"use client"
import InterviewsBoard from '@/components/interview-boards'
import InterviewDialog from '@/components/InterviewDialog'
import { Button } from '@/components/ui/button'
import { useInterviewCon } from '@/context/InterviewContext'
import { useInterviewConAll } from '@/context/InterviewAllContext'
import { useSession } from 'next-auth/react'
import React, { useEffect, useState } from 'react'

const Dashboard = () => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const {data:session,status}=useSession();
  const {interview,setInterview}=useInterviewCon()
  const {interviews}=useInterviewConAll()
  useEffect(() => {
  if (session?.user && setInterview) {
    setInterview(prev => ({ ...prev, name: session.user!.name! }));
  }
}, [session?.user?.name, setInterview,session?.user]);
  return (
        <div className='relative flex items-start justify-center flex-col gap-6 p-6 w-full'>
      <div className="flex items-start bg-gradient-to-br from-white to-gray-50 shadow-sm border border-gray-300 justify-center  p-6 gap-3 rounded-xl w-full">
        <div className="flex-1">
          <p className='text-2xl font-bold text-gray-900 mb-1'>Welcome back, {session?.user?.name?.split(' ')[0]}!</p>
          <p className='text-sm text-gray-600'>Ready to ace your next interview? Keep practicing to stay sharp.</p>
        </div>
        <div className="flex mt-2 items-center justify-center" >
        <Button
          onClick={()=>{
            setDialogOpen(true)
          }}
          className='bg-gray-900 hover:bg-gray-800 text-white px-6 h-11 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md'>
          Create Interview
        </Button>
        </div>
      </div>

      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className='text-xl font-bold text-gray-900'>Your Interviews</h2>
          <p className='text-sm text-gray-500'>{interviews?.length || 0} total</p>
        </div>
        <InterviewsBoard/>
      </div>

      <InterviewDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}

export default Dashboard