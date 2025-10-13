import React from 'react'

const InterviewPageLayout = ({children}:{children:React.ReactNode}) => {
  return (

    <>
    <div className='bg-blue-600 Z-10'>
        {children}
    </div>
    </>
  )
}

export default InterviewPageLayout