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
import { useSession } from "next-auth/react";
import { collectRoutesUsingEdgeRuntime } from "next/dist/build/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Navbar() {
  const navItems = [
    { name: "Features", link: "/web-features" },
    { name: "Pricing", link: "/pricing" },
    { name: "AboutUs", link: "/about" },
  ];
  const {data:session}=useSession();
  const router=useRouter();


  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
<div
  className="fixed top-6 left-1/2 -translate-x-1/2 w-[75vw] rounded-4xl z-50 px-2 bg-white backdrop-blur-md shadow-md"
  style={{ boxShadow: "0px 0px 39px 7px rgba(0,0,0,0.1)" }}
>

      <ResizableNavbar>
        {/* Desktop Navigation */}
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} className="text-white dark:text-white" />
          <div className="flex items-center gap-4">
            <NavbarButton
              variant="gradient"
                            onClick={()=>{router.push("/auth/sign-in")}}
              className="text-black "
            >
              Login
            </NavbarButton>
            <NavbarButton
              variant="primary"
              onClick={()=>{router.push("/auth/sign-up")}}
              className="bg-black text-white hover:bg-gray-800 shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset]"
            >
              Register
            </NavbarButton>
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
            </div>
          </MobileNavMenu>
        </MobileNav>
      </ResizableNavbar>
    </div>
  );
}
