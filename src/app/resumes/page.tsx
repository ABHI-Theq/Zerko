"use client"
import ResumeDialog from '@/components/ResumeDialog'
import ResumesAnalysisComponent from '@/components/Resumes-board'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useSession } from 'next-auth/react'
import { useResumeConAll } from '@/context/ResumeAllContext'
import React, { useState } from 'react'

const Page = () => {
    const { data: session } = useSession()
    const { resumesAnalysis } = useResumeConAll()
    const [resumeDialogOpen, setResumeDialogOpen] = useState<boolean>(false);

  return (
    <div className='relative flex items-start justify-center flex-col gap-6 p-4 md:p-6 w-full z-10'>
      <div className="flex flex-col md:flex-row items-start bg-white/95 backdrop-blur-sm shadow-lg border border-gray-200 justify-center p-4 md:p-6 gap-3 md:gap-4 rounded-xl w-full">
        <div className="flex-1 w-full">
          <p className='text-xl md:text-2xl font-bold text-gray-900 mb-1'>Welcome back, {session?.user?.name?.split(' ')[0]}!</p>
          <p className='text-sm text-gray-600'>Get perfectly evaluated scores for your resume and suggestions to upgrade it</p>
        </div>
        <div className="flex w-full md:w-auto md:mt-2 items-center justify-center">
          <Button
            onClick={() => setResumeDialogOpen(true)}
            className='bg-gray-900 hover:bg-gray-800 text-white px-6 h-11 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer w-full md:w-auto'
          >
            Evaluate Your Resume
          </Button>
        </div>
      </div>

      <div className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
          <h2 className='text-lg md:text-xl font-bold text-gray-900'>Your Resume Evaluations</h2>
          <p className='text-sm text-gray-500'>{resumesAnalysis?.length || 0} total</p>
        </div>
        <ResumesAnalysisComponent />
      </div>

      <ResumeDialog open={resumeDialogOpen} onOpenChange={setResumeDialogOpen} />
    </div>
  )
}

export default Page