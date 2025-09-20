import Navbar from '@/components/Navbar'
import React from 'react'

const HomeLayout = ({children}:{children:React.ReactNode}) => {
  return (



    <>
  <Navbar />
            <main className="relative z-10">{children}</main>
      </>
  )
}

export default HomeLayout