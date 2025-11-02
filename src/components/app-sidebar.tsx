"use client";
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
} from "@/components/ui/sidebar";
import { Files, Home, Settings2 } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import Userbutton from "./Userbutton";
import { Session } from "next-auth";
import { IconDashboard } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function AppSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const links = [
    { title: "Home", url: "/", icon: Home },
    { title: "Dashboard", url: "/dashboard", icon: IconDashboard },
    { title: "Resumes", url: "/resumes", icon: Files },
    { title: "Settings", url: "/settings", icon: Settings2 },
  ];

  const isActive = (url: string) => {
    if (url === "/" && pathname === "/") return true;
    if (url !== "/" && pathname.startsWith(url)) return true;
    return false;
  };

  return (
    <div className="h-full bg-white border-r border-gray-200">
      <Sidebar className="bg-white">
        <SidebarHeader className="flex flex-row items-center justify-start gap-3 px-6 py-5 border-b border-gray-100">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm">
            <Image src="/logo.png" alt="Logo" width={30} height={30} className="" />
          </div>
          <div className="flex flex-col">
            <p className="text-gray-900 text-xl font-bold tracking-tight">Zerko</p>
            <p className="text-xs text-gray-500">Interview Prep</p>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-3 py-4">
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
              Navigation
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {links.map((e) => (
                  <SidebarMenuItem key={e.title}>
                    <SidebarMenuButton
                      className={`h-11 rounded-lg transition-all duration-200 ${
                        isActive(e.url)
                          ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Link
                        href={e.url}
                        className="flex items-center justify-start gap-3 w-full"
                      >
                        {e.icon && (
                          <e.icon
                            className={`w-5 h-5 transition-colors ${
                              isActive(e.url) ? 'text-white' : 'text-gray-500'
                            }`}
                          />
                        )}
                        <span className={`text-sm font-medium ${
                          isActive(e.url) ? 'text-white' : 'text-gray-700'
                        }`}>
                          {e.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <div className="mt-6 mx-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                <span className="text-lg">💡</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-900 mb-1">Pro Tip</p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Practice regularly to improve your interview skills
                </p>
              </div>
            </div>
          </div>
        </SidebarContent>

        <SidebarFooter className="border-t border-gray-100 p-3">
          <div className="rounded-lg hover:bg-gray-50 transition-colors">
            <Userbutton session={session as Session} showDetails={true} />
          </div>
        </SidebarFooter>
      </Sidebar>
    </div>
  );
}