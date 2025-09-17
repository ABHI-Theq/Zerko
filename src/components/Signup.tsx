"use client";
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { LoaderOne } from "@/components/ui/loader";
import {
    IconBrandGithub,
    IconBrandGoogle,
    IconEye,
    IconEyeOff,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth";
import { UserSignup, userSignupSchema } from "@/types";
import toast from "react-hot-toast";

export default function Signup() {
    const [showPassword, setShowPassword] = useState(false);
    const [loading,setLoading]=useState<boolean>(false)
    const [user,setUser]=useState<UserSignup>({
        firstname:"",
        lastname:"",
        email:"",
        password:""
    })


    const router=useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const parsed=userSignupSchema.safeParse(user);
        if(!parsed.success){
            toast.error(`${parsed.error.issues[0].message}`)
            console.log(parsed.error.issues[0].message);
            return;
        }

        setLoading(true);

        try {
            "use server"
            const res=await fetch(`${process.env.NEXT_PUBLIC_URL}/api/sign-up`,{
                method:"POST",
                headers:{
                    'Content-Type':'application/json'
                },
                body:JSON.stringify(user)
            })
            const data=await res.json();

            if(data.status!=201){
                toast.error(`${data.error}`);
                return;
            }
            router.push("/");
            setLoading(false)
        } catch (error) {
            toast.error(error instanceof Error?error.message:`Some error occured${error}`)
            setLoading(false)
            return;
        }

    };

    return (
        <div className="shadow-input mx-auto w-full max-w-md rounded-2xl bg-black p-8 text-white">
            <h2 className="text-xl font-bold text-neutral-100">Welcome to Zerko</h2>

            <form className="my-8" onSubmit={handleSubmit}>
                {/* Name */}
                <div className="mb-4 flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
                    <LabelInputContainer>
                        <Label htmlFor="firstname" className="text-neutral-300">
                            First name
                        </Label>
                        <Input
                            id="firstname"
                            onChange={(e)=>{
                                setUser({...user,firstname:e.target.value.trim()})
                            }}  
                            placeholder="Tyler"
                            type="text"
                            className="bg-neutral-900 text-white border-neutral-700"
                        />
                    </LabelInputContainer>
                    <LabelInputContainer>
                        <Label htmlFor="lastname" className="text-neutral-300">
                            Last name
                        </Label>
                        <Input
                            id="lastname"
                            onChange={(e)=>{
                                setUser({...user,lastname:e.target.value.trim()})
                            }}
                            placeholder="Galpin"
                            type="text"
                            className="bg-neutral-900 text-white border-neutral-700"
                        />
                    </LabelInputContainer>
                </div>

                {/* Email */}
                <LabelInputContainer className="mb-4">
                    <Label htmlFor="email" className="text-neutral-300">
                        Email Address
                    </Label>
                    <Input
                        id="email"
                        onChange={(e)=>{
                                setUser({...user,email:e.target.value})
                            }}
                        placeholder="projectmayhem@fc.com"
                        type="email"
                        className="bg-neutral-900 text-white border-neutral-700"
                    />
                </LabelInputContainer>

                {/* Password with Eye toggle */}
                <LabelInputContainer className="mb-4">
                    <Label htmlFor="password" className="text-neutral-300">
                        Password
                    </Label>
                    <div className="relative w-full">
                        <Input
                            id="password"
                            onChange={(e)=>{
                                setUser({...user,password:e.target.value})
                            }}
                            placeholder="••••••••"
                            type={showPassword ? "text" : "password"}
                            className="bg-neutral-900 text-white border-neutral-700 w-full pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-3 flex items-center text-neutral-400 hover:text-white"
                        >
                            {showPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                        </button>
                    </div>
                </LabelInputContainer>


                {/* Submit */}
                <button
                    className=" group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-zinc-900 to-zinc-800 font-medium text-white shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]"
                    type="submit"
                >
                    {
                        loading?(
                            <div className="h-3 w-15 mx-auto mb-4"> <LoaderOne/>
                            </div>
                        ):(
                    <p>Sign up &rarr;</p>
                        )
                    }
                    <BottomGradient />
                </button>
                <p className="pt-2">Already have account? <Link href={"/auth/sign-in"} className="text-blue-500 hover:underline">Sign in</Link> here</p>

                {/* Divider */}
                <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-700 to-transparent" />

                {/* Social Auth */}
                <div className="flex space-x-5">
                    <div onClick={async()=>await signIn("github",{redirectTo:"/"})} className="w-full">
                    <AuthButton
                     icon={<IconBrandGithub className="h-4 w-4" />} label="GitHub" />
                    </div>
                    <div onClick={async()=>await signIn("google",{redirectTo:"/"})} className="w-full">
                    <AuthButton icon={<IconBrandGoogle className="h-4 w-4" />} label="Google" />
                    </div>
                </div>
            </form>
        </div>
    );
}

const AuthButton = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
    <button
        className="group/btn shadow-input relative flex h-10 w-full items-center justify-start space-x-2 rounded-md bg-neutral-900 px-4 font-medium text-white border border-neutral-800 hover:bg-neutral-800"
        type="button"
    >
        {icon}
        <span className="text-sm text-neutral-300">{label}</span>
        <BottomGradient />
    </button>
);

const BottomGradient = () => {
    return (
        <>
            <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
            <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
        </>
    );
};

const LabelInputContainer = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    return <div className={cn("flex w-full flex-col space-y-2", className)}>{children}</div>;
};
