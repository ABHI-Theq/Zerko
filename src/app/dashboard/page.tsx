"use client"
import InterviewsBoard from '@/components/interview-boards'
import InterviewDialog from '@/components/InterviewDialog'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'
import React, { useState } from 'react'

const Dashboard = () => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const {data:session,status}=useSession();
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
      <hr  className=' my-4 w-full  border-1 border-t-black'/>
      <InterviewsBoard/>
      <InterviewDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}

export default Dashboard