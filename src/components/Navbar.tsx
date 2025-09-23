"use client";
import {
  Navbar as ResizableNavbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { signOutAuth } from "@/features/actions";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils";
import { HelpCircle, LogOut, Settings2, User } from "lucide-react";

export default function Navbar() {
  const navItems = [
    { name: "Features", link: "/web-features" },
    { name: "Pricing", link: "/pricing" },
    { name: "AboutUs", link: "/about" },
  ];
  const { data: session ,status} = useSession();
  const router = useRouter();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);



  return (
    <div
      className="fixed top-6 left-1/2 -translate-x-1/2 w-[75vw] rounded-4xl z-50  bg-white backdrop-blur-md shadow-md"
      style={{ boxShadow: "0px 0px 39px 7px rgba(0,0,0,0.1)" }}
    >
      <ResizableNavbar>
        {/* Desktop Navigation */}
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} className="text-black dark:text-white" />

          <div className="flex items-center gap-4">
            {session ? (
              <>
                {/* <NavbarButton
                  variant="gradient"
                  onClick={() => router.push("/dashboard")}
                  className="text-white"
                >
                  Dashboard
                </NavbarButton>
                 */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild className="cursor-pointer">
                     <div className={("rounded-full relative")}>
      <Image
        src={session.user?.image ?? "/user.png"}
        alt="User"
        width={40}
        height={40}
        className="rounded-full cursor-pointer"
      />
    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>

                    <DropdownMenuGroup>
                      <DropdownMenuItem>Profile
                                                <DropdownMenuShortcut><User className="mr-2 h-4 w-4" /></DropdownMenuShortcut>
                      </DropdownMenuItem>
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
                  
              </>
            ) : (
              <>
                <NavbarButton
                  variant="gradient"
                  onClick={() => router.push("/auth/sign-in")}
                  className="text-white "
                >
                  Login
                </NavbarButton>
                <NavbarButton
                  variant="primary"
                  onClick={() => router.push("/auth/sign-up")}
                  className="bg-black text-white hover:bg-gray-800 shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset]"
                >
                  Register
                </NavbarButton>
              </>
            )}
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <Link
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative text-black hover:text-gray-800"
              >
                <span className="block">{item.name}</span>
              </Link>
            ))}

            <div className="flex w-full flex-col gap-4">
              {session ? (
                <>
                  {session.user?.image && (
                    <Image
                      src={session.user.image}
                      alt="User"
                      width={48}
                      height={48}
                      className="rounded-full mx-auto"
                    />
                  )}
                  <NavbarButton
                    onClick={async() => await signOutAuth()}
                    variant="primary"
                    className="w-full bg-red-500 text-white hover:bg-red-600"
                  >
                    Sign out
                  </NavbarButton>
                </>
              ) : (
                <>
                  <NavbarButton
                    onClick={() => router.push("/auth/sign-in")}
                    variant="primary"
                    className="w-full bg-indigo-500 text-white hover:bg-indigo-600"
                  >
                    Login
                  </NavbarButton>
                  <NavbarButton
                    onClick={() => router.push("/auth/sign-up")}
                    variant="primary"
                    className="w-full bg-indigo-500 text-white hover:bg-indigo-600"
                  >
                    Register
                  </NavbarButton>
                </>
              )}
            </div>
          </MobileNavMenu>
        </MobileNav>
      </ResizableNavbar>
    </div>
  );
}
