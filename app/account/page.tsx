"use client"
import logo from "@/images/logo.png"
import Image from "next/image"
import Link from "next/link";
import { useForm } from "react-hook-form"
import { createClient } from "@/utils/supabase/client";
import { GoMail } from "react-icons/go";
import { LuLockKeyhole } from "react-icons/lu";
import { useEffect, useState } from "react";
import GoogleIcon from "public/icons/google.svg"
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [isLoad, setIsLoad] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        setIsLoad(true);
    }, []);

    const { register, handleSubmit, setError, formState: { errors } } = useForm();

    const handleGoogleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    };

    const onSubmit = handleSubmit(async (data) => {
        setIsProcessing(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });

            if (error) {
                setError("root", { type: "manual", message: "Invalid email or password." });
                setIsProcessing(false);
                return;
            }

            // Success! Send them to the feed.
            router.push("/post");

        } catch (error) {
            console.error(error);
            setError("root", { type: "manual", message: "An error occurred during login." });
            setIsProcessing(false);
        }
    });

    return (
        <div className="container mx-auto h-full p-5 overflow-hidden">
            <div className={`flex flex-col items-center gap-5 transition-slow ${isLoad ? "translate-y-0 opacity-100" : "translate-y-7 opacity-0"}`}>

                <div className="flex md:flex-row flex-col items-center gap-6 mb-5">
                    <div className="md:w-[80px] w-[100px]">
                        <Image src={logo} placeholder="empty" priority={false} width={200} height={200} alt="logo" className="w-full" />
                    </div>
                    <div className="grid items-center gap-1">
                        <h3 className="text-[26px] md:block hidden font-medium">Echo Up</h3>
                        <span className="block md:text-[15px] text-xl md:text-start text-center">Welcome back.<br />Log in to see what's happening.</span>
                    </div>
                </div>

                <div className="w-full shrink-0 flex justify-center px-4 pb-10">
                    <div className="flex flex-col gap-3 w-full items-center">
                        
                        <button type="button" 
                        onClick={handleGoogleLogin} 
                        className="border border-white flex items-center py-[10px] w-full md:w-[550px] justify-center gap-3 rounded-lg cursor-pointer transition-all hover:bg-white hover:text-black" title="Login with Google">
                            <Image src={GoogleIcon} width={20} height={20} alt="Google Logo" />
                            <span>Log in with Google</span>
                        </button>

                        <div className="flex gap-4 my-5 items-center w-full md:w-[550px]">
                            <div className="w-full h-px border-t border-t-gray-300"></div>
                            <span className="text-[14px] text-gray-300">OR</span>
                            <div className="w-full h-px border-t border-t-gray-300"></div>
                        </div>

                        <form onSubmit={onSubmit} className="shadow-[0px_2px_25px_#8b8b8b1c] bg-dark-clr grid gap-4 md:px-8 md:py-8 px-5 py-6 rounded-xl md:w-[550px] w-full">
                            <div className="flex items-center gap-3 select-none">
                                <Image src={logo} alt="logo" className="md:w-[35px] w-[30px]" />
                                <h4 className="md:text-[22px] text-xl font-medium">Log in to Echo Up</h4>
                            </div>
                            
                            <div className="flex gap-3 mt-2">
                                <div className="group">
                                    <button type="button" className="px-[14px] py-2 cursor-pointer font-medium">Log in</button>
                                    <div className="h-[3px] rounded-full w-full bg-main-blue"></div>
                                </div>
                                <Link href={"/account/signup"} className="group">
                                    <button type="button" className="px-[14px] py-2 cursor-pointer">Sign up</button>
                                    <div className="group-hover:h-[2px] h-[3px] rounded-full w-full group-hover:bg-[#5babf7]"></div>
                                </Link>
                            </div>

                            <div className="grid gap-4 mt-4">
                                <div>
                                    <div className="relative">
                                        <GoMail className="absolute md:top-[16px] top-[13px] left-[16px] text-[18px]" />
                                        <input type="email"
                                            className="w-full h-full bg-primary text-[17px] outline-none border border-white/20 md:py-3 py-[10px] pl-11 pr-4 rounded-lg focus:border-main-blue transition-colors"
                                            placeholder="Email"
                                            {...register("email", { required: true })} />
                                    </div>
                                </div>

                                <div>
                                    <div className="relative">
                                        <LuLockKeyhole className="absolute md:top-[16px] top-[13px] left-[16px] text-[18px]" />
                                        <input type="password"
                                            className="w-full h-full bg-primary text-[17px] outline-none border border-white/20 md:py-3 py-[10px] pl-11 pr-4 rounded-lg focus:border-main-blue transition-colors"
                                            placeholder="Password"
                                            {...register("password", { required: true })} />
                                    </div>
                                </div>
                            </div>

                            {errors.root && <p className="text-red-600/80 text-[14px] mt-1 text-center">{errors.root.message as string}</p>}

                            <div className="text-end mt-1">
                                <span className="cursor-pointer text-sm text-gray-400 hover:text-white transition-colors">Forgot password?</span>
                            </div>

                            <button
                                type="submit"
                                disabled={isProcessing}
                                className="mt-2 w-full flex justify-center items-center md:py-[10px] py-2 bg-main-blue rounded-lg md:text-[17px] font-medium cursor-pointer transition-all hover:bg-main-dark-blue disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Log in"}
                            </button>
                        </form>

                    </div>
                </div>
            </div>
        </div>
    )
}