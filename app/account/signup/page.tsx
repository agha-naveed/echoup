"use client"
import logo from "@/images/logo.png"
import Image from "next/image"
import Link from "next/link";
import { useForm } from "react-hook-form"
import { GoMail } from "react-icons/go";
import { LuLockKeyhole } from "react-icons/lu";
import { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import GoogleIcon from "public/icons/google.svg"

type FormValues = {
    firstName: string;
    lastName: string;
    gender: "male" | "female";
    date: string;
    month: string;
    year: string;
    email: string;
    password: string;
    profileImage: FileList;
}

export default function page() {
    const [isLoad, setIsLoad] = useState(false);

    const [step, setStep] = useState(2);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const { data: session } = useSession();
    useEffect(() => {
        if (session) {
            redirect("/")
        }
    }, [session])


    useEffect(() => {
        setIsLoad(true)
    }, []);

    const {
        register,
        handleSubmit,
        trigger,
        watch,
        formState: { errors },
    } = useForm<FormValues>()

    const profileImage = watch("profileImage");

    const handleNextStep = async () => {
        const isStep1Valid = await trigger(["firstName", "email", "password"]);
        setTimeout(() => {
            if (isStep1Valid) {
                setStep(2);
            }
        }, 500)
    };

    const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const startYear = 1950;
    const currentYear = new Date().getFullYear();
    const years = Array.from(
        { length: currentYear - startYear + 1 },
        (_, i) => currentYear - i
    );

    const onSubmit = handleSubmit((data) => console.log(data))

    return (
        <div className="container mx-auto justify-center h-full gap-14 p-5">
            <div className={`flex flex-col items-center gap-14 transition-slow ${isLoad ? "translate-y-0 opacity-100" : "translate-y-7 opacity-0"}`}>
                <div className="flex md:flex-row flex-col items-center gap-6">
                    <div className="md:w-[100px] w-[120px]">
                        <Image src={logo} placeholder="empty" priority={false} width={200} height={200} alt="logo" className="w-full" />
                    </div>
                    <div className="grid items-center gap-1">
                        <h3 className="text-3xl md:block hidden font-medium">Echo Up</h3>
                        <span className="w-[300px] block md:text-[16px] text-xl md:text-start text-center">Echo Up, where your voice matters. Speak, share, and connect.</span>
                    </div>
                </div>
                {
                    step === 1 && (
                        <div className="flex flex-col gap-3">
                            {
                                session ? (
                                    <>
                                        <p>Hello {session.user?.name}</p>
                                        <button onClick={() => signOut()}>Logout</button>
                                    </>
                                ) : (
                                    <button onClick={() => signIn("google")} className="border border-white flex items-center py-[10px] w-full justify-center gap-3 rounded-lg cursor-pointer transition-all hover:bg-white hover:text-black" title="Signin with Google">
                                        <Image src={GoogleIcon} width={20} height={20} alt="Google Logo" />
                                        <span>Sign up with Google</span>
                                    </button>
                                )
                            }
                            <div className="flex gap-4 my-5 items-center">
                                <div className="w-full h-px border-t border-t-gray-300"></div>
                                <span className="text-[14px] text-gray-300">OR</span>
                                <div className="w-full h-px border-t border-t-gray-300"></div>
                            </div>

                            <form onSubmit={onSubmit} className={`shadow-[0px_2px_25px_#8b8b8b1c] bg-dark-clr grid gap-4 md:px-8 md:py-8 px-5 py-6 rounded-xl md:w-[550px] w-full transition-slow`}>
                                <div className="flex items-center gap-3 select-none">
                                    <Image src={logo} alt="logo" className="md:w-[35px] w-[30px]" />
                                    <h4 className="md:text-[22px] text-xl font-medium">Echo Up</h4>
                                </div>
                                <p className="md:text-[16px] text-[14px]">Share your world and connect with others.</p>
                                <div className="flex gap-3">
                                    <Link href={"/account"} className="group">
                                        <button className="px-[14px] py-2 cursor-pointer">Log in</button>
                                        <div className="group-hover:h-[2px] h-[3px] rounded-full w-full group-hover:bg-[#5babf7]"></div>
                                    </Link>
                                    <div className="group">
                                        <button className="px-[14px] py-2 cursor-pointer font-medium">Sign up</button>
                                        <div className="h-[3px] rounded-full w-full bg-main-blue"></div>
                                    </div>
                                </div>

                                <div className="grid gap-3 mt-2">
                                    <div className="flex lg:flex-row flex-col gap-3">
                                        <div className="relative w-full">
                                            <input type="text"
                                                className={`w-full h-full bg-primary md:text-[17px] outline-none border ${errors.firstName?.message?.includes("First name") ? "border-red-600/80" : "border-white/20"} md:py-3 py-[10px] px-4 rounded-lg`}
                                                placeholder="First Name"
                                                {...register("firstName", { required: "* First name is required" })} />
                                        </div>
                                        <div className="relative w-full">
                                            <input type="text"
                                                className="w-full h-full bg-primary md:text-[17px] border border-white/20 md:py-3 py-[10px] px-4 rounded-lg"
                                                placeholder="Last Name"
                                                {...register("lastName")} />
                                        </div>
                                    </div>

                                    <div className="grid w-full">
                                        <label htmlFor="" className="text-[15px] mb-[6px]">Date of Birth</label>

                                        <div className="flex gap-4 justify-between w-full">
                                            <select
                                                className="w-full h-full bg-primary border border-white/20 md:py-[10px] py-2 px-4 rounded-lg"
                                                {...register("date")}>
                                                {Array.from({ length: 31 }, (_, i) => (
                                                    <option key={`birthDate-${i}`} value={i + 1}>{i + 1}</option>
                                                ))}
                                            </select>

                                            <select
                                                className="w-full h-full bg-primary border border-white/20 md:py-[10px] py-2 px-4 rounded-lg"
                                                {...register("month")}>
                                                {monthsShort.map((i, idx) => (
                                                    <option key={`birthMonth-${idx}`} value={idx}>{i}</option>
                                                ))}
                                            </select>


                                            <select
                                                className="w-full h-full bg-primary border border-white/20 md:py-[10px] py-2 px-4 rounded-lg"
                                                {...register("year")}>
                                                {years.map((i, idx) => (
                                                    <option key={`birthYear-${idx}`} value={i}>{i}</option>
                                                ))}
                                            </select>

                                        </div>
                                    </div>

                                    <div className="relative my-1">
                                        <label htmlFor="" className="text-[15px] mb-[6px]">Gender</label>
                                        <div className="flex gap-3">
                                            <label htmlFor="gender-male-input" className="flex items-center gap-2 cursor-pointer md:text-xl text-[18px]">
                                                Male
                                                <input type="radio" id="gender-male-input" value={"male"} {...register("gender", { required: "* Gender is required" })} />
                                            </label>
                                            <label htmlFor="gender-female-input" className="flex items-center gap-2 cursor-pointer md:text-xl text-[18px]">
                                                Female
                                                <input type="radio" id="gender-female-input" value={"female"} {...register("gender")} />
                                            </label>
                                        </div>
                                        {
                                            errors.gender && (
                                                <p className="text-red-600/80 text-[14px]">{errors.gender.message}</p>
                                            )
                                        }

                                    </div>


                                    <div className="relative">
                                        <GoMail className="absolute md:top-[16px] top-[13px] left-[16px] text-[18px]" />
                                        <input type="email"
                                            className={`w-full h-full bg-primary text-[17px] outline-none border md:py-3 py-[10px] pl-11 pr-4 rounded-lg ${errors.email?.message?.includes("Email") ? "border-red-600/80" : "border-white/20"}`}
                                            placeholder="Email"
                                            {...register("email", { required: "* Email is Required" })} />
                                    </div>
                                    <div className="relative">
                                        <LuLockKeyhole className="absolute md:top-[16px] top-[13px] left-[16px] text-[18px]" />
                                        <input type="password"
                                            className={`w-full h-full bg-primary text-[17px] outline-none border md:py-3 py-[10px] pl-11 pr-4 rounded-lg ${errors.password?.message?.includes("password") ? "border-red-600/80" : "border-white/20"}`}
                                            placeholder="Password"
                                            {...register("password", { required: "password" })} />
                                    </div>
                                </div>

                                <div className="text-end">
                                    <span className="cursor-pointer">Forgot password?</span>
                                </div>

                                <button type="submit" onClick={handleNextStep} className="mt-1 w-full md:py-[10px] py-2 bg-main-blue rounded-lg md:text-[17px] font-medium cursor-pointer transition-all hover:bg-main-dark-blue">Sign up</button>

                            </form>
                        </div>
                    )
                }


            </div>
        </div>
    )
}
