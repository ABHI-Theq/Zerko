import React from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Image from 'next/image';
import Link from 'next/link';
import type { Session } from 'next-auth';
import { signOutAuth } from '@/features/actions';
import { HelpCircle, LogOut, Settings2, User } from 'lucide-react';

const Userbutton = ({
  session,
  showDetails = false
}: {
  session: Session
  showDetails?: boolean
}) => {
  return (
    <div>
        <DropdownMenu>
                  <DropdownMenuTrigger asChild className="cursor-pointer ">
                     <div className="rounded-full relative w-full flex justify-center gap-2 py-1 px-1 items-center">
      <Image
        src={session?.user?.image ?? "/user.png"}
        alt="User"
        width={40}
        height={40}
        className="rounded-full cursor-pointer"
      />
      {showDetails && (
              <div>
                <p className="font-medium">{session?.user?.name}</p>
                <p className="text-sm">{session?.user?.email}</p>
              </div>
            )}
    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>

                    <DropdownMenuGroup>
                      <Link href="/profile">
                        <DropdownMenuItem>Profile
                          <DropdownMenuShortcut><User className="mr-2 h-4 w-4" /></DropdownMenuShortcut>
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem>Settings
                        <DropdownMenuShortcut><Settings2 className="mr-2 h-4 w-4" /></DropdownMenuShortcut>
                      </DropdownMenuItem>
                      <DropdownMenuItem>Help
                        <DropdownMenuShortcut><HelpCircle className="mr-2 h-4 w-4" /></DropdownMenuShortcut>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator/>
                    <DropdownMenuItem onClick={async()=>{
                        await signOutAuth();
                      }}>
                       
                        Log out
                        <DropdownMenuShortcut><LogOut className="mr-2 h-4 w-4" /></DropdownMenuShortcut>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
    </div>
  )
}

export default Userbutton