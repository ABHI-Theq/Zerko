"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import Link from "next/link";
import { useState } from "react";

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
    <div className=" min-h-screen w-full flex justify-center items-center ">
      {/* Background Grid */}
     

      {/* Foreground content */}
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6 my-auto text-gray-800">
          ZERKO
        </h1>

        {/* {session ? (
          <div className="space-y-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-lg font-medium text-gray-700">User ID:</p>
              <p className="text-sm text-gray-600 mt-2 break-all">
                {session.user?.id}
              </p>
            </div>
            <Button
              onClick={onOut}
              className="w-full bg-red-500 hover:bg-red-600"
              disabled={isLoading}
            >
              {isLoading ? "Signing out..." : "Sign out"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-lg font-medium text-gray-700">
                No user logged in
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link href={"/auth/sign-in"}>
                <Button className="w-full bg-blue-500 hover:bg-blue-600">
                  Sign in
                </Button>
              </Link>
              <Link href={"/auth/sign-up"}>
                <Button variant="outline" className="w-full">
                  Sign up
                </Button>
              </Link>
            </div>
          </div>
        )} */}
      </div>
      </div>
    
  );
}
