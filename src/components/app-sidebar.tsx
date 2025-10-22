"use client"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Files, Home, Settings2 } from "lucide-react"
import { useSession } from "next-auth/react"
import Image from "next/image"
import Link from "next/link"
import Userbutton from "./Userbutton"
import { Session } from "next-auth"
import { IconDashboard } from "@tabler/icons-react"

export function AppSidebar() {

    const {data:session}=useSession()
    const currentUrl=window.location.href;


    const links=[
        {
            title:"Home",
            url:"/",
            icon:Home,
        },{
          title:"Dashboard",
          url:"/dashboard",
          icon: IconDashboard
        },
        {
            title:"resumes",
            url:"/resumes",
            icon:Files
        },{
            title:"settings",
            url:"/settings",
            icon:Settings2
        }
    ]

  return (
    <div style={{
      boxShadow: "13px 4px 21px 3px rgba(0,0,0,0.1)"
    }} >
    <Sidebar>
      <SidebarHeader className="flex flex-row items-center justify-center">
        <Image
        src="/logo.png"
        alt="Logo"
        width={40}
        height={40}
        className=""
        />
        <p className="text-black text-md font-medium">Zerko</p>
      </SidebarHeader>
                       <hr className="bg-gray-800 border-t-1 border-gray-700 "/>
      <SidebarContent className="">
        <SidebarGroup className="">
        <SidebarGroupLabel className="text-lg ">Details Section</SidebarGroupLabel>
        <SidebarGroupContent>
            <SidebarMenu>
            {links.map((e)=>(
                <SidebarMenuItem key={e.title}  className="">
                    <SidebarMenuButton className="h-10 hover:bg-neutral-300">
                        <Link href={`${process.env.NEXT_PUBLIC_URL}${e.url}`} className="flex items-center justify-start gap-4  relative w-full bg-">
                        {e.icon && <e.icon/>}
                        <span className="text-md font-medium">{e.title}</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
            </SidebarMenu>
        </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent><div className="hover:bg-gray-200">
        
                    <hr className="bg-gray-800 border-t-1 border-gray-700 "/>
      <SidebarFooter>
        <Userbutton session={session as Session} showDetails={true}/>
      </SidebarFooter>
      </div>
    </Sidebar>
    </div>
  )
}