"use client"
import { ChangeEvent, useEffect, useState } from "react";
import Image from "next/image"
import { IoCamera } from "react-icons/io5";
import { BiImageAdd } from "react-icons/bi";
import { MdPerson, MdOutlineLock } from "react-icons/md";
import { useForm } from "react-hook-form";
import { IoMdInformationCircleOutline } from "react-icons/io";

type FormValues = {
    firstName: string;
    lastName: string;
    username: string;
}

const page = () => {

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormValues>()

    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>("https://ntvb.tmsimg.com/assets/assets/487578_v9_bb.jpg?w=360&h=480");

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


    const onSubmit = handleSubmit((data) => {
        console.log(data)
    })

    return (
        <div className="md:w-fit w-full flex flex-col gap-7 h-screen">
            <div className='bg-primary flex gap-8 rounded-2xl w-[800px] h-fit border border-main-border shadow-lg px-5 py-4 w-full'>
                <div className='flex justify-between mt-6'>
                    <div className="group min-w-[120px] w-[120px] h-[120px] max-w-[120px] max-h-[120px] min-h-[120px] relative partial-dark-gradient">
                        <div className="w-full h-full rounded-full overflow-hidden relative bg-zinc-900 flex items-center justify-center">
                            {
                                preview ?
                                    <Image src={preview} alt="s" width={100} height={100} className="w-full h-full object-cover" />
                                    : <MdPerson className="text-white/60 text-7xl" />
                            }
                            <div className="absolute bottom-0 w-full h-full cursor-pointer gradient-inner-div"></div>
                        </div>
                        <ul className="w-full group-hover:block hidden z-10 text-black rounded-md overflow-hidden bg-white absolute top-[100px] left-0 text-[14px]">
                            <li>
                                <button className="px-2 py-[6px] w-full text-start transition-all hover:bg-gray-200 cursor-pointer flex gap-1 items-center">
                                    <IoCamera className="text-[18px]" /> Camera
                                </button>
                            </li>
                            <li>
                                <input type="file" id="image-upload-in-setting" className="hidden" accept="image/*" onChange={handleChange} />
                                <label htmlFor="image-upload-in-setting" className="px-2 py-[6px] w-full text-start transition-all hover:bg-gray-200 cursor-pointer flex gap-1 items-center">
                                    <BiImageAdd className="text-[18px]" /> Browse
                                </label>
                            </li>
                            <li>
                                <button onClick={() => {
                                    setFile(null); setPreview(null);
                                }} className="px-2 py-[6px] w-full text-start transition-all hover:bg-gray-200 cursor-pointer flex gap-1 items-center">
                                    Remove Picture
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>

                <form onSubmit={onSubmit} className="w-full text-foreground">
                    <div className="flex gap-5">
                        <div className="grid gap-1">
                            <label htmlFor="" className="text-[17px]">First Name</label>
                            <input type="text"
                                className="w-full h-full bg-dark-clr/60 md:text-[17px] border border-white/20 md:py-3 py-[10px] px-4 rounded-lg"
                                {...register("firstName")} />
                        </div>
                        <div className="grid gap-1">
                            <label htmlFor="" className="text-[17px]">Last Name</label>
                            <input type="text"
                                className="w-full h-full bg-dark-clr/60 md:text-[17px] border border-white/20 md:py-3 py-[10px] px-4 rounded-lg"
                                {...register("lastName")} />
                        </div>
                    </div>

                    <div className="mt-3 grid gap-1">
                        <label htmlFor="" className="text-[17px]">Username</label>
                        <input type="text" value={"@asd"}
                            className="w-full h-full bg-dark-clr/60 md:text-[17px] border border-white/20 md:py-3 py-[10px] px-4 rounded-lg"
                            {...register("lastName")} />
                    </div>

                    <div className="mt-4 flex gap-3 text-[18px]">
                        <span>Email</span>
                        <span className="text-white/50 cursor-pointer flex items-center gap-1">
                            naveed@gmail.com
                            <div className="flex items-center gap-[6px] group">
                                <IoMdInformationCircleOutline />
                                <div className="hidden group-hover:flex items-center cursor-default">
                                    <div className="triangle-shape rotate-[177deg] bg-zinc-600 w-[10px] h-[10px] relative left-[2px]"></div>
                                    <div className="bg-zinc-600 text-foreground text-[13px] py-[2px] px-3 rounded-md">
                                        Email cannot be change.
                                    </div>
                                </div>
                            </div>
                        </span>

                    </div>
                </form>
            </div>

            <div className='bg-primary grid gap-3 rounded-2xl w-[800px] h-fit border border-main-border shadow-lg px-5 py-4 w-full text-foreground'>
                <span className="text-xl font-medium mb-2">Change Password</span>

                <div className="flex gap-3">
                    <div className="relative w-full">
                        <MdOutlineLock className="absolute text-[19px] top-[14px] left-[12px]" />
                        <input type="text"
                            placeholder="Current password"
                            className="w-full h-full bg-dark-clr/60 md:text-[17px] border border-white/20 md:py-3 py-[10px] pr-4 pl-10 rounded-lg" />
                    </div>

                    <div className="relative w-full">
                        <MdOutlineLock className="absolute text-[19px] top-[14px] left-[12px]" />
                        <input type="text"
                            placeholder="New password"
                            className="w-full h-full bg-dark-clr/60 md:text-[17px] border border-white/20 md:py-3 py-[10px] pr-4 pl-10 rounded-lg" />
                    </div>
                </div>

                <div className="flex gap-3">
                    <div className="relative w-full">
                        <MdOutlineLock className="absolute text-[19px] top-[14px] left-[12px]" />
                        <input type="text"
                            placeholder="Confirm new password"
                            className="w-full h-full bg-dark-clr/60 md:text-[17px] border border-white/20 md:py-3 py-[10px] pr-4 pl-10 rounded-lg" />
                    </div>
                    <button type="button" className="w-[91%] btn-gradient px-7 py-[7px] rounded-lg font-medium cursor-pointer transition-all shadow-main">Change Password</button>
                </div>
            </div>
        </div>
    )
}

export default page