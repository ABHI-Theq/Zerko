import React from 'react'

const InterviewLayout = ({children}:{children:React.ReactNode}) => {
  return (
    <main className='bg-white z-10'>
        {children}
    </main>
  )
}

export default InterviewLayout