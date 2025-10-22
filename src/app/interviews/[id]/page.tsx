"use client"
import { useInterviewConAll } from '@/context/InterviewAllContext'
import { useParams } from 'next/navigation';
import React from 'react'

const Page = () => {
    const params=useParams();
    const {id}=params;
    const {interviews,setInterviews}=useInterviewConAll()
    const PageInterview=interviews.find((interview)=>(interview.id===id))
    console.log(PageInterview);
    
  return (
    <div className=''>page
        <p>{PageInterview?.post}</p>
    </div>
  )
}

export default Page