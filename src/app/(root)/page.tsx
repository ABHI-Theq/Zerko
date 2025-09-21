"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import { GlowEffect } from "@/components/motion-premitives/glow-effect";

export default function Home() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const onOut = async () => {
    setIsLoading(true);
    try {
      await signOut({ redirect: false });
      toast.success("Signed out successfully");
    } catch (error) {
      const errMsg =
        error instanceof Error ? error.message : "Error while signing out";
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center">
      {/* First Text */}
      <motion.div
        className="min-w-md w-[60vw] "
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <h1 className="text-[70px] font-medium text-center my-auto text-gray-800">
          Take your interview prepation to next level
        </h1>
      </motion.div>

      <hr className="border-t-2 border-black w-[64vw] my-2" />

      {/* Second Text */}
      <motion.div
        className="min-w-md w-full"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <h4 className="text-[30px] text-center text-gray-700">
          Personalized interview practice, instant feedback, and real-time skill improvement
        </h4>
      </motion.div>
         <motion.div 
         initial={{
          opacity:0,
          y:20
         }}
         animate={{
          opacity:1
          ,y:0
         }}
         transition={{
          duration:1
         }}
         className="relative mt-4">
        <Button className="relative text-xl rounded-2xl p-6 overflow-hidden">
          <motion.span
            whileHover={{
              scale: 1.1,
              transition: { duration: 0.2 },
            }}
            whileTap={{ scale: 0.9 }}
 className="block bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent"
          >
            Ace your prep
          </motion.span>
        </Button>
      </motion.div>
      
    </div>
  );
}
