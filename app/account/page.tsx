"use client"
import logo from "@/images/logo.png"
import Image from "next/image"
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form"
import { GoMail } from "react-icons/go";
import { LuLockKeyhole } from "react-icons/lu";
import { signIn, useSession } from "next-auth/react"; // NextAuth signIn handles everything!
import { redirect, useRouter } from "next/navigation";
import GoogleIcon from "public/icons/google.svg"

type FormValues = {
    identifier: string;
    password: string;
}

export default function LoginPage() {
    const { data: session } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (session) {
            redirect("/")
        }
    }, [session])

    const { register, handleSubmit, formState: { errors } } = useForm<FormValues>();

    const [isLoad, setIsLoad] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);

    useEffect(() => {
        setIsLoad(true)
    }, [])

    const onSubmit = handleSubmit(async (data) => {
        setIsProcessing(true);
        setLoginError(null);

        try {
            const result = await signIn("credentials", {
                identifier: data.identifier,
                password: data.password,
                redirect: false,
            });

            console.log(result)
            if (result?.error) {
                setLoginError(result.error);
            } else {
                router.push("/");
                router.refresh();
            }
        } catch (error) {
            console.error("Login failed:", error);
            setLoginError("Something went wrong. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    })

    return (
        <div className={`container mx-auto h-full`}>
            <div className={`flex md:flex-row flex-col md:gap-14 gap-10 items-center justify-center p-5 transition-slow ${isLoad ? "translate-y-0 opacity-100" : "translate-y-7 opacity-0"}`}>

                {/* Left Side Branding */}
                <div className="md:justify-items-start justify-items-center">
                    <div className="md:w-[180px] w-[120px]">
                        <Image src={logo} alt="logo" placeholder="empty" priority={false} width={200} height={200} className="w-full" />
                    </div>
                    <span className="w-[300px] block text-xl mt-8 md:text-start text-center">
                        Echo Up, where your voice matters. Speak, share, and connect.
                    </span>
                </div>

                {/* Right Side Form */}
                <div>
                    <form onSubmit={onSubmit} className="shadow-[0px_2px_25px_#8b8b8b1c] bg-dark-clr grid gap-4 md:px-8 md:py-8 px-5 py-6 rounded-xl md:w-[430px] w-full">
                        <div className="flex items-center gap-3 select-none">
                            <Image src={logo} alt="logo" className="md:w-[35px] w-[30px]" />
                            <h4 className="md:text-[22px] text-xl font-medium">Echo Up</h4>
                        </div>
                        <p className="md:text-[16px] text-[14px]">Share your world and connect with others.</p>

                        {loginError && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm px-3 py-2 rounded-lg text-center">
                                {loginError}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <div className="group">
                                <button type="button" className="px-[14px] py-2 cursor-pointer font-medium">Log in</button>
                                <div className="h-[3px] rounded-full w-full bg-main-blue"></div>
                            </div>
                            <Link href={"/account/signup"} className="group">
                                <button type="button" className="px-[14px] py-2 cursor-pointer">Sign up</button>
                                <div className="group-hover:h-[2px] h-[3px] rounded-full w-full group-hover:bg-[#5babf7]"></div>
                            </Link>
                        </div>

                        <div className="grid gap-3 mt-2">
                            <div className="relative">
                                <GoMail className="absolute md:top-[16px] top-[13px] left-[16px] text-[18px] text-gray-400" />
                                <input
                                    type="text"
                                    className={`w-full h-full bg-primary md:text-[17px] border outline-none focus:border-white/50 md:py-3 py-[10px] pl-11 pr-4 rounded-lg ${errors.identifier ? "border-red-600/80" : "border-white/20"}`}
                                    placeholder="Email or Username"
                                    {...register("identifier", { required: true })}
                                />
                            </div>
                            <div className="relative">
                                <LuLockKeyhole className="absolute md:top-[16px] top-[13px] left-[16px] text-[18px] text-gray-400" />
                                <input
                                    type="password"
                                    className={`w-full h-full bg-primary md:text-[17px] border outline-none focus:border-white/50 md:py-3 py-[10px] pl-11 pr-4 rounded-lg ${errors.password ? "border-red-600/80" : "border-white/20"}`}
                                    placeholder="Password"
                                    {...register("password", { required: true })}
                                />
                            </div>
                        </div>

                        <div className="text-end">
                            <span className="cursor-pointer text-sm hover:underline text-main-blue">Forgot password?</span>
                        </div>

                        <button
                            type="submit"
                            disabled={isProcessing}
                            className="mt-1 w-full flex justify-center items-center md:py-[10px] py-2 bg-main-blue rounded-lg md:text-[17px] font-medium cursor-pointer transition-all hover:bg-main-dark-blue disabled:opacity-70 disabled:cursor-not-allowed text-white"
                        >
                            {isProcessing ? (
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : "Login"}
                        </button>
                    </form>

                    <div className="flex gap-4 my-5 items-center">
                        <div className="w-full h-px border-t border-t-gray-300"></div>
                        <span className="text-[14px] text-gray-300">OR</span>
                        <div className="w-full h-px border-t border-t-gray-300"></div>
                    </div>

                    <button
                        type="button"
                        onClick={() => signIn("google")}
                        className="border border-white/20 flex items-center py-[10px] w-full justify-center gap-3 rounded-lg cursor-pointer transition-all hover:bg-white hover:text-black"
                        title="Sign in with Google"
                    >
                        <Image src={GoogleIcon} width={20} height={20} alt="Google Logo" />
                        <span>Sign in with Google</span>
                    </button>
                </div>
            </div>
        </div>
    )
}