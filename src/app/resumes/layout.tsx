import React from 'react'
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from '@/components/app-sidebar'

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen overflow-hidden">
        {/* Sidebar */}
        <AppSidebar/>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="sticky top-0 z-20   px-4 py-2">
            <SidebarTrigger className="bg-transparent hover:bg-gray-100/50" />
          </div>
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}

export default DashboardLayout
