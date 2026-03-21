"use client"
import logo from "@/images/logo.png"
import Image from "next/image"
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form"
import { GoMail } from "react-icons/go";
import { LuLockKeyhole } from "react-icons/lu";
import { signIn, signOut, useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import GoogleIcon from "public/icons/google.svg"

type FormValues = {
    email: string
    password: string
}

export default function page() {
    const { data: session } = useSession();

    useEffect(() => {
        if (session) {
            redirect("/")
        }
    }, [session])

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormValues>()

    const onSubmit = handleSubmit((data) => console.log(data))
    const [isLoad, setIsLoad] = useState(false)

    useEffect(() => {
        setIsLoad(true)
    }, [])


    return (
        <div className={`container mx-auto h-full`}>
            <div className={`flex md:flex-row flex-col md:gap-14 gap-10 items-center justify-center p-5 transition-slow ${isLoad ? "translate-y-0 opacity-100" : "translate-y-7 opacity-0"}`}>
                <div className="md:justify-items-start justify-items-center">
                    <div className="md:w-[180px] w-[120px]">
                        <Image src={logo} alt="logo" placeholder="blur" priority={false} width={200} height={200} className="w-full" />
                    </div>
                    <span className="w-[300px] block text-xl mt-8 md:text-start text-center">Echo Up, where your voice matters. Speak, share, and connect.</span>
                </div>

                <div>
                    <form onSubmit={onSubmit} className="shadow-[0px_2px_25px_#8b8b8b1c] bg-dark-clr grid gap-4 md:px-8 md:py-8 px-5 py-6 rounded-xl md:w-[430px] w-full">
                        <div className="flex items-center gap-3 select-none">
                            <Image src={logo} alt="logo" className="md:w-[35px] w-[30px]" />
                            <h4 className="md:text-[22px] text-xl font-medium">Echo Up</h4>
                        </div>
                        <p className="md:text-[16px] text-[14px]">Share your world and connect with others.</p>
                        <div className="flex gap-3">
                            <div className="group">
                                <button className="px-[14px] py-2 cursor-pointer font-medium">Log in</button>
                                <div className="h-[3px] rounded-full w-full bg-main-blue"></div>
                            </div>
                            <Link href={"/account/signup"} className="group">
                                <button className="px-[14px] py-2 cursor-pointer">Sign up</button>
                                <div className="group-hover:h-[2px] h-[3px] rounded-full w-full group-hover:bg-[#5babf7]"></div>
                            </Link>
                        </div>

                        <div className="grid gap-3 mt-2">
                            <div className="relative">
                                <GoMail className="absolute md:top-[16px] top-[13px] left-[16px] text-[18px]" />
                                <input type="email"
                                    className="w-full h-full bg-primary md:text-[17px] border border-white/20 md:py-3 py-[10px] pl-11 pr-4 rounded-lg"
                                    placeholder="Email"
                                    {...register("email")} />
                            </div>
                            <div className="relative">
                                <LuLockKeyhole className="absolute md:top-[16px] top-[13px] left-[16px] text-[18px]" />
                                <input type="password"
                                    className="w-full h-full bg-primary md:text-[17px] border border-white/20 md:py-3 py-[10px] pl-11 pr-4 rounded-lg"
                                    placeholder="Password"
                                    {...register("password")} />
                            </div>
                        </div>

                        <div className="text-end">
                            <span className="cursor-pointer">Forgot password?</span>
                        </div>

                        <button className="mt-1 w-full md:py-[10px] py-2 bg-main-blue rounded-lg md:text-[17px] font-medium cursor-pointer transition-all hover:bg-main-dark-blue">Login</button>

                    </form>
                    <div className="flex gap-4 my-5 items-center">
                        <div className="w-full h-px border-t border-t-gray-300"></div>
                        <span className="text-[14px] text-gray-300">OR</span>
                        <div className="w-full h-px border-t border-t-gray-300"></div>
                    </div>
                    {
                        session ? (
                            <>
                                <p>Hello {session.user?.name}</p>
                                <button onClick={() => signOut()}>Logout</button>
                            </>
                        ) : (
                            <button onClick={() => signIn("google")} className="border border-white flex items-center py-[10px] w-full justify-center gap-3 rounded-lg cursor-pointer transition-all hover:bg-white hover:text-black" title="Signin with Google">
                                <Image src={GoogleIcon} width={20} height={20} alt="Google Logo" />
                                <span>Sign in with Google</span>
                            </button>
                        )
                    }
                </div>
            </div>
        </div>
    )
}
