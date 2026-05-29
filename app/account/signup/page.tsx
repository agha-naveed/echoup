"use client"
import logo from "@/images/logo.png"
import Image from "next/image"
import Link from "next/link";
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signUpFormSchema, type SignUpFormValues } from "@/schema/user";

import { GoMail } from "react-icons/go";
import { LuLockKeyhole } from "react-icons/lu";
import { ChangeEvent, useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import GoogleIcon from "public/icons/google.svg"
import { BsCameraFill } from "react-icons/bs";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";

export default function Page() {
    const [isLoad, setIsLoad] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [selectedOption, setSelectedOption] = useState<string>("google");
    const [step, setStep] = useState(1);
    const [preview, setPreview] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const searchParams = useSearchParams();

    const { data: session, status } = useSession();

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    useEffect(() => {
        if (!file) return;
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    useEffect(() => {
        setIsLoad(true)
    }, []);

    const {
        register,
        handleSubmit,
        trigger,
        getValues,
        setError,
        setValue,
        formState: { errors },
    } = useForm<SignUpFormValues>({
        resolver: zodResolver(signUpFormSchema),
        mode: "onChange",
    })

    useEffect(() => {
    const googleEmail = searchParams.get("email");
    const googleName = searchParams.get("name");
    const googleImg = searchParams.get("image");

    if (googleEmail && step === 1) {
        // Auto-fill form and skip to Step 2 instantly
        const nameParts = googleName?.split(" ") || [];
        setValue("firstName", nameParts[0] || "");
        setValue("lastName", nameParts.length > 1 ? nameParts.slice(1).join(" ") : "");
        setValue("email", googleEmail);
        
        setSelectedOption("google");
        setStep(2); 
    } else if (status === "authenticated" && session?.user && step === 1) {
        // Fallback for existing sessions (if any)
        const nameParts = session.user.name?.split(" ") || [];
        setValue("firstName", nameParts[0] || "");
        setValue("lastName", nameParts.length > 1 ? nameParts.slice(1).join(" ") : "");
        if (session.user.email) setValue("email", session.user.email);
        setSelectedOption("google");
    }
}, [searchParams, status, session, setValue, step]);


    const handleNextStep = async () => {
        const isStep1Valid = await trigger(["firstName", "email", "password", "gender"]);

        if (isStep1Valid) {
            setIsProcessing(true);

            try {
                const response = await axios.get(`/api/account/signup/${getValues("email")}`)

                const data = await response.data;

                if (data.exists) {
                    setError("email", { type: "manual", message: "This email is already registered." });
                } else {
                    setStep(2);
                }
            } catch (error) {
                console.error("Failed to check email:", error);
                setStep(2);
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const navigate = useRouter()

    const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const startYear = 1950;
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => currentYear - i);

    const onSubmit = handleSubmit(async (data) => {
        console.log(data)
        setIsProcessing(true);
        const actualMonth = (parseInt(data.month) + 1).toString();
        const formattedDate = `${data.year}-${actualMonth.padStart(2, '0')}-${data.date.padStart(2, '0')}`;
        try {
            const userResponse = await axios.get(`/api/account/signup/?username=${data.username}`);
            if (userResponse.status == 200) {
                let finalProfileImageUrl;
                if (selectedOption == "upload") {
                    if (file) {
                        const formData = new FormData();
                        formData.append("file", file);
                        formData.append("upload_preset", "my-images");

                        const cloudinaryRes = await axios.post(
                            `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
                            formData
                        );

                        finalProfileImageUrl = cloudinaryRes.data.secure_url;
                    }
                    console.log("Final Submission:", {
                        ...data,
                        imageOption: selectedOption,
                        finalProfileImage: finalProfileImageUrl
                    });
                    const addData = await axios.post("/api/account/signup", {
                        ...data, profileImage: finalProfileImageUrl, dateOfBirth: formattedDate
                    })
                    if (addData.status == 200) {
                        navigate.push("/account");
                    }
                    else {
                        setError("root", { type: "manual", message: "Some Problem Occurred." });
                    }
                }
                else if (selectedOption === "google") {
                    if (file) {
                        const formData = new FormData();
                        formData.append("file", file);
                        formData.append("upload_preset", "my-images");

                        const cloudinaryRes = await axios.post(
                            `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
                            formData
                        );

                        finalProfileImageUrl = cloudinaryRes.data.secure_url;
                    }
                    const addData = await axios.post("/api/account/signup", {
                        ...data, profileImage: file ? finalProfileImageUrl : session?.user?.image, dateOfBirth: formattedDate
                    })
                    if (addData.status == 200) {
                        navigate.push("/account");
                    }
                    else {
                        setError("root", { type: "manual", message: "Some Problem Occurred." });
                    }
                }
                else {
                    const addData = await axios.post("/api/account/signup", data)
                    if (addData.status == 200) {
                        navigate.push("/account");
                    }
                    else {
                        setError("root", { type: "manual", message: "Some Problem Occurred." });
                    }
                }
            }

            else {
                console.log(userResponse.data)
                setError("username", { type: "manual", message: "This username is already taken." });
                setIsProcessing(false);
                return;
            }
        } catch (error) {
            setError("username", { type: "manual", message: "This username is already taken." });
        } finally {
            setIsProcessing(false);
        }
    })

    return (
        <div className="container mx-auto h-full p-5 overflow-hidden">
            <div className={`flex flex-col items-center gap-5 transition-slow ${isLoad ? "translate-y-0 opacity-100" : "translate-y-7 opacity-0"}`}>

                <div className="flex md:flex-row flex-col items-center gap-6 mb-5">
                    <div className="md:w-[80px] w-[100px]">
                        <Image src={logo} placeholder="empty" priority={false} width={200} height={200} alt="logo" className="w-full" />
                    </div>
                    <div className="grid items-center gap-1">
                        <h3 className="text-[26px] md:block hidden font-medium">Echo Up</h3>
                        <span className="block md:text-[15px] text-xl md:text-start text-center">Echo Up, where your voice matters.
                            <br />Speak, share, and connect.</span>
                    </div>
                </div>

                <div className="w-full overflow-hidden max-w-3xl pb-10">
                    <form
                        onSubmit={onSubmit}
                        className="flex items-start transition-transform duration-500 ease-in-out w-full"
                        style={{ transform: `translateX(-${(step - 1) * 100}%)` }}
                    >

                        {/* STEP 1 */}
                        <div className="w-full shrink-0 flex justify-center px-4">
                            <div className="flex flex-col gap-3 w-full items-center">
                                {!session ? (
                                    <>
                                        <button type="button" onClick={() => signIn("google")} className="border border-white flex items-center py-[10px] w-full md:w-[550px] justify-center gap-3 rounded-lg cursor-pointer transition-all hover:bg-white hover:text-black" title="Signin with Google">
                                            <Image src={GoogleIcon} width={20} height={20} alt="Google Logo" />
                                            <span>Sign up with Google</span>
                                        </button>
                                        <div className="flex gap-4 my-5 items-center w-full md:w-[550px]">
                                            <div className="w-full h-px border-t border-t-gray-300"></div>
                                            <span className="text-[14px] text-gray-300">OR</span>
                                            <div className="w-full h-px border-t border-t-gray-300"></div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 w-full md:w-[550px] bg-white/5 border border-white/10 p-4 rounded-lg mb-4">
                                        <div className="flex items-center gap-3">
                                            {session.user?.image && (
                                                <Image src={session.user.image} alt="Profile" width={30} height={30} className="rounded-full" />
                                            )}
                                            <p className="text-sm text-gray-300">
                                                Continuing as <strong className="text-white">{session.user?.name}</strong>
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => signOut()}
                                            className="text-sm text-main-blue transition-colors mt-1 cursor-pointer hover:underline"
                                        >
                                            Not you? Use a different account
                                        </button>
                                    </div>
                                )}
                                <div className="shadow-[0px_2px_25px_#8b8b8b1c] bg-dark-clr grid gap-4 md:px-8 md:py-8 px-5 py-6 rounded-xl md:w-[550px] w-full">
                                    <div className="flex items-center gap-3 select-none">
                                        <Image src={logo} alt="logo" className="md:w-[35px] w-[30px]" />
                                        <h4 className="md:text-[22px] text-xl font-medium">Echo Up</h4>
                                    </div>
                                    <p className="md:text-[16px] text-[14px]">Share your world and connect with others.</p>
                                    <div className="flex gap-3">
                                        <Link href={"/account"} className="group">
                                            <button type="button" className="px-[14px] py-2 cursor-pointer">Log in</button>
                                            <div className="group-hover:h-[2px] h-[3px] rounded-full w-full group-hover:bg-[#5babf7]"></div>
                                        </Link>
                                        <div className="group">
                                            <button type="button" className="px-[14px] py-2 cursor-pointer font-medium">Sign up</button>
                                            <div className="h-[3px] rounded-full w-full bg-main-blue"></div>
                                        </div>
                                    </div>

                                    <div className="grid gap-3 mt-2">
                                        <div className="flex lg:flex-row flex-col gap-3">
                                            <div className="relative w-full">
                                                <input type="text"
                                                    className={`w-full h-full bg-primary md:text-[17px] outline-none border ${errors.firstName ? "border-red-600/80" : "border-white/20"} md:py-3 py-[10px] px-4 rounded-lg`}
                                                    placeholder="First Name"
                                                    {...register("firstName")} />
                                            </div>
                                            <div className="relative w-full">
                                                <input type="text"
                                                    className="w-full h-full bg-primary md:text-[17px] border border-white/20 md:py-3 py-[10px] px-4 rounded-lg"
                                                    placeholder="Last Name"
                                                    {...register("lastName")} />
                                            </div>
                                        </div>

                                        <div className="grid w-full">
                                            <label className="text-[15px] mb-[6px]">Date of Birth</label>
                                            <div className="flex gap-4 justify-between w-full">
                                                <select className="w-full h-full bg-primary border border-white/20 md:py-[10px] py-2 px-4 rounded-lg" {...register("date")}>
                                                    {Array.from({ length: 31 }, (_, i) => (<option key={`birthDate-${i}`} value={i + 1}>{i + 1}</option>))}
                                                </select>
                                                <select className="w-full h-full bg-primary border border-white/20 md:py-[10px] py-2 px-4 rounded-lg" {...register("month")}>
                                                    {monthsShort.map((i, idx) => (<option key={`birthMonth-${idx}`} value={idx}>{i}</option>))}
                                                </select>
                                                <select className="w-full h-full bg-primary border border-white/20 md:py-[10px] py-2 px-4 rounded-lg" {...register("year")}>
                                                    {years.map((i, idx) => (<option key={`birthYear-${idx}`} value={i}>{i}</option>))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="relative my-1">
                                            <label className="text-[15px] mb-[6px]">Gender</label>
                                            <div className="flex gap-3">
                                                <label className="flex items-center gap-2 cursor-pointer md:text-xl text-[18px]">
                                                    Male <input type="radio" value="male" {...register("gender")} />
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer md:text-xl text-[18px]">
                                                    Female <input type="radio" value="female" {...register("gender")} />
                                                </label>
                                            </div>
                                            {errors.gender && (<p className="text-red-600/80 text-[14px] mt-1">{errors.gender.message}</p>)}
                                        </div>

                                        <div>
                                            <div className="relative">
                                                <GoMail className="absolute md:top-[16px] top-[13px] left-[16px] text-[18px]" />
                                                <input type="email"
                                                    disabled={!!session}
                                                    className={`w-full h-full bg-primary text-[17px] outline-none border ${session && "cursor-not-allowed bg-dark-clr! text-gray-500"} md:py-3 py-[10px] pl-11 pr-4 rounded-lg ${errors.email ? "border-red-600/80" : "border-white/20"}`}
                                                    placeholder="Email"
                                                    {...register("email")} />
                                            </div>
                                            {errors.email && <p className="text-red-600/80 text-[14px] mt-1">{errors.email.message}</p>}
                                        </div>

                                        <div>
                                            <div className="relative">
                                                <LuLockKeyhole className="absolute md:top-[16px] top-[13px] left-[16px] text-[18px]" />
                                                <input type="password"
                                                    className={`w-full h-full bg-primary text-[17px] outline-none border md:py-3 py-[10px] pl-11 pr-4 rounded-lg ${errors.password ? "border-red-600/80" : "border-white/20"}`}
                                                    placeholder="Password"
                                                    {...register("password")} />
                                            </div>
                                            {errors.password && <p className="text-red-600/80 text-[14px] mt-1">{errors.password.message}</p>}
                                        </div>
                                    </div>

                                    <div className="text-end">
                                        <span className="cursor-pointer">Forgot password?</span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleNextStep}
                                        disabled={isProcessing}
                                        className="mt-1 w-full flex justify-center items-center md:py-[10px] py-2 bg-main-blue rounded-lg md:text-[17px] font-medium cursor-pointer transition-all hover:bg-main-dark-blue disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isProcessing ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Continue"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* STEP 2 */}
                        <div className="w-full shrink-0 flex justify-center px-4">
                            <div className="shadow-[0px_2px_25px_#8b8b8b1c] bg-dark-clr grid w-full p-8 rounded-xl md:w-[550px]">
                                <h2 className="text-[27px] font-bold mb-8 text-center">Choose Your Profile Picture</h2>

                                <div className="flex flex-col sm:flex-row justify-center gap-10 mb-10">
                                    {
                                        session?.user?.image && (
                                            <div className="flex flex-col items-center gap-4 w-[152px]">
                                                <div className={`relative w-32 h-32 rounded-full p-1 transition-all ${selectedOption === "google" ? "bg-main-blue shadow-[0_0_20px_rgba(91,171,247,0.4)]" : "bg-transparent"}`}>
                                                    <Image src={session?.user?.image || ""} alt="Google Profile" className="w-full h-full object-cover rounded-full" width={100} height={100} />
                                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white rounded-full p-1 shadow-md">
                                                        <Image src={GoogleIcon} alt="google" width={20} height={20} />
                                                    </div>
                                                </div>
                                                <p className="text-sm">Use your Google Photo</p>
                                                <button type="button" onClick={() => setSelectedOption("google")} className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${selectedOption === "google" ? "bg-main-blue text-white" : "bg-transparent border border-white/20 hover:border-white/50"}`}>
                                                    Keep this image
                                                </button>
                                            </div>
                                        )
                                    }

                                    <div className="flex flex-col items-center gap-4 w-[152px]">
                                        <label htmlFor="signup-image-upload" className={`relative w-32 h-32 rounded-full transition-all flex items-center overflow-hidden justify-center p-1.25 ${selectedOption === "upload" ? "bg-main-blue shadow-[0_0_20px_rgba(91,171,247,0.4)]" : "bg-transparent"}`}>
                                            <div className="w-full h-full bg-primary rounded-full flex items-center justify-center object-cover cursor-pointer border border-white/20" title="Upload an Image">
                                                {preview ? (<Image src={preview} alt="Preview" width={100} height={100} className="w-full h-full rounded-full object-cover" />) : (<BsCameraFill size={40} className="text-gray-400" />)}
                                            </div>
                                            <input type="file" className="hidden" id="signup-image-upload" onChange={handleChange} />
                                        </label>
                                        <p className="text-sm">Upload a New Photo</p>
                                        <label htmlFor={!preview ? "signup-image-upload" : ""} onClick={() => setSelectedOption("upload")} className={`px-6 py-2 cursor-pointer rounded-full text-sm font-medium transition-colors ${selectedOption === "upload" ? "bg-main-blue text-white" : "bg-transparent border border-white/20 hover:border-white/50"}`}>
                                            {preview ? "Keep this Image" : "Upload"}
                                        </label>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center gap-4 mt-2">
                                    <button type="button" onClick={() => setStep(3)} className="w-full md:py-[10px] py-2 bg-main-blue rounded-lg md:text-[17px] font-medium cursor-pointer transition-all hover:bg-main-dark-blue text-white">
                                        {
                                            session || file ?
                                                "Confirm Image" : "Skip for now"
                                        }
                                    </button>

                                    {!session && (
                                        <button type="button" className="text-gray-400 hover:text-white text-sm font-medium transition-colors" onClick={() => setStep(1)}>
                                            Back to Info
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* STEP 3 */}
                        <div className="w-full shrink-0 flex justify-center px-4">
                            <div className="shadow-[0px_2px_25px_#8b8b8b1c] bg-dark-clr grid w-full p-8 rounded-xl md:w-[550px]">
                                <div className="text-center mb-6">
                                    <h2 className="text-[27px] font-bold mb-2">Pick a Username</h2>
                                    <p className="text-[14px] text-gray-300">This is how people will find and mention you.</p>
                                </div>

                                <div className="relative mb-8 mt-2">
                                    <div>
                                        <span className="absolute left-4 md:top-[12px] top-[10px] text-gray-400 font-bold text-lg">@</span>
                                        <input
                                            type="text"
                                            placeholder="username"
                                            className={`w-full h-full bg-primary md:text-[17px] outline-none border ${errors.username ? "border-red-600/80" : "border-white/20"} md:py-3 py-[10px] pl-10 pr-4 rounded-lg`}
                                            {...register("username")}
                                        />
                                    </div>
                                    {errors.username && <p className="text-red-600/80 text-[14px] mt-2">{errors.username.message}</p>}
                                </div>

                                <div className="flex flex-col items-center gap-4">
                                    <button
                                        type="submit"
                                        disabled={isProcessing}
                                        className="w-full flex justify-center items-center md:py-[10px] py-2 bg-main-blue rounded-lg md:text-[17px] font-medium cursor-pointer transition-all hover:bg-main-dark-blue disabled:opacity-70 disabled:cursor-not-allowed text-white"
                                    >
                                        {isProcessing ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Complete Sign Up"}
                                    </button>
                                    <button type="button" className="text-gray-400 hover:text-white text-sm font-medium transition-colors" onClick={() => setStep(2)}>
                                        Back to Picture
                                    </button>
                                </div>
                            </div>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    )
}