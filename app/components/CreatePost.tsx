"use client"
import { useState, useRef } from "react";
import { TbPhoto } from "react-icons/tb";
import { MdOutlineOndemandVideo } from "react-icons/md";
import { FiFileText } from "react-icons/fi";
import { IoMdClose } from "react-icons/io"; // Added for the 'Remove Image' button
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";

const CreatePost = () => {
    const { data: session } = useSession();
    const router = useRouter();

    const [isFocus, setIsFocus] = useState(false);
    const [isEmpty, setIsEmpty] = useState(true);
    const [isPosting, setIsPosting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);

    const contentRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        const text = e.currentTarget.textContent?.trim() || "";
        if (selectedFiles.length > 0) {
            setIsEmpty(false);
        }
        else {
            setIsEmpty(!text);
        }
        if (errorMsg) setErrorMsg(null);
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {

        if (!e.target.files) return;

        setIsEmpty(false)
        const files = Array.from(e.target.files);

        if (selectedFiles.length + files.length > 4) {
            setErrorMsg("You can only attach up to 4 images.");
            return;
        }

        setSelectedFiles((prev) => [...prev, ...files]);

        const newPreviewUrls = files.map((file) => URL.createObjectURL(file));
        setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);

        setErrorMsg(null);
    };

    const removeImage = (indexToRemove: number) => {
        URL.revokeObjectURL(previewUrls[indexToRemove]);

        if (selectedFiles.length === 1) {
            setIsEmpty(true)
        }
        setPreviewUrls((prev) => prev.filter((_, i) => i !== indexToRemove));
        setSelectedFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
    };

    const handlePostSubmit = async () => {
        const text = contentRef.current?.innerText.trim() || "";

        if (!text && selectedFiles.length === 0) return;

        setIsPosting(true);
        setErrorMsg(null);

        try {
            let uploadedImageUrls: string[] = [];

            if (selectedFiles.length > 0) {
                console.log("yes")
                const getImagesUrl = selectedFiles.map(async (file, idx) => {
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("upload_preset", "my-images");
                    const response = (await axios.post(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
                        formData));
                    return await response.data.secure_url
                })
                uploadedImageUrls = await Promise.all(getImagesUrl)
            }

            await axios.post("/api/posts", {
                content: text,
                imageUrls: uploadedImageUrls
            });

            if (contentRef.current) contentRef.current.innerText = "";
            setIsEmpty(true);
            setSelectedFiles([]);
            setPreviewUrls([]);
            router.refresh();

        } catch (error: any) {
            console.error("Post failed:", error);
            if (error.response?.data?.error) {
                setErrorMsg(error.response.data.error);
            } else {
                setErrorMsg("Failed to post. Please try again.");
            }
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div className={`flex flex-col gap-2 px-5 py-3 bg-primary w-full rounded-xl text-foreground/80 border transition-all ${isFocus ? "border-foreground/40 shadow-[0_2px_15px_#a3a3a334]" : "border-main-border"}`}
            onFocus={(e) => {
                if (e.currentTarget.contains(e.target)) {
                    setIsFocus(true);
                }
            }}
            onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                    setIsFocus(false);
                }
            }}>

            {errorMsg && (
                <div className="text-red-400 text-sm font-medium px-2 pb-1">
                    {errorMsg}
                </div>
            )}
            <div>

                <div className="flex gap-3 w-full">
                    <div className="min-w-[45.5px] w-[45.5px] h-[45.5px] max-w-[45.5px] max-h-[45.5px] min-h-[45.5px] rounded-full overflow-hidden mt-2 border border-main-border">
                        {session?.user?.image ? (
                            <Image src={session.user.image} alt="Profile" width={100} height={100} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-main-blue text-white flex items-center justify-center font-bold text-lg uppercase">
                                {session?.user?.name?.charAt(0) || "U"}
                            </div>
                        )}
                    </div>

                    <div className="select-none overflow-hidden min-w-0 flex-1 flex flex-col gap-3">
                        <div
                            ref={contentRef}
                            contentEditable
                            onInput={handleInput}
                            role="textbox"
                            aria-multiline="true"
                            data-placeholder="What's on your mind?"
                            className={`editable-div post-open overflow-y-auto ${isEmpty ? "is-empty" : ""} lg:max-h-[400px] max-h-[300px] ${isFocus ? "min-h-[100px]" : "min-h-[50px]"} w-full overflow-hidden resize-none p-1 outline-none whitespace-pre-wrap wrap-break-words break-all select-text`}
                        ></div>
                    </div>
                </div>
                {previewUrls.length > 0 && (
                    <div className={`flex gap-3 mt-5`}>
                        {previewUrls.map((url, index) => (
                            <div key={index} className="relative group">
                                <div className="overflow-hidden rounded-xl w-20 h-20 border border-main-border">
                                    <Image src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" width={100} height={100} />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute -top-2 -right-2 bg-white/60 hover:bg-white/80 cursor-pointer text-black p-0.5 rounded-full transition-colors"
                                >
                                    <IoMdClose size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between pt-1">
                <div className="flex gap-1 items-center">

                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleImageSelect}
                    />

                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-[6px] transition-all hover:bg-dark-clr rounded-lg cursor-pointer"
                    >
                        <TbPhoto className="text-[19px]" />
                    </button>

                    <button type="button" className="p-[6px] transition-all hover:bg-dark-clr rounded-lg cursor-pointer">
                        <MdOutlineOndemandVideo className="text-[19px]" />
                    </button>
                    <button type="button" className="p-[6px] transition-all hover:bg-dark-clr rounded-lg cursor-pointer">
                        <FiFileText className="text-[19px]" />
                    </button>
                </div>

                <button
                    type="button"
                    onClick={handlePostSubmit}
                    className={`btn-gradient ${isEmpty ? "opacity-50 cursor-not-allowed!" : "cursor-pointer"} flex items-center justify-center min-w-[70px]`}
                >
                    {isPosting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : "Post"}
                </button>
            </div>
        </div>
    )
}

export default CreatePost;