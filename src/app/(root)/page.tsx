"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";

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
        transition={{ duration: .5 }}
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
        transition={{ duration: .5 }}
      >
        <h4 className="text-[30px] text-center text-gray-700">
          Personalized interview practice, instant feedback, and real-time skill improvement
        </h4>
      </motion.div>
    </div>
  );
}
