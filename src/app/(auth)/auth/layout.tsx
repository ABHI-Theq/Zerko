import React from 'react'

const layout = ({children}:{
  children: React.ReactNode;
}) => {
  return (
        <div className="w-full h-[100vh] bg-gray-300  flex items-center justify-center">
            {children}
        </div>
  )
}

export default layout