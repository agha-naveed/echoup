"use client"
import { useState, useRef, useEffect } from "react";
import { TbPhoto } from "react-icons/tb";
import { MdOutlineOndemandVideo } from "react-icons/md";
import { FiFileText } from "react-icons/fi";
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

    const contentRef = useRef<HTMLDivElement>(null);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        const text = e.currentTarget.textContent?.trim() || "";
        setIsEmpty(!text);

        if (errorMsg) setErrorMsg(null);
    };

    const handlePostSubmit = async () => {
        if (!contentRef.current) return;

        const text = contentRef.current.innerText.trim();
        if (!text) return;

        setIsPosting(true);
        setErrorMsg(null);

        try {
            await axios.post("/api/posts", { content: text });

            contentRef.current.innerText = "";
            setIsEmpty(true);

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
        <div className={`flex flex-col gap-2 px-5 py-3 bg-primary w-full rounded-xl text-foreground/80 border transition-all ${isFocus ? "border-foreground/40 shadow-[0_2px_15px_#a3a3a334]" : "border-main-border"}`} onFocus={(e: any) => {
            if (e.currentTarget.contains(e.target)) {
                setIsFocus(true);
            }
        }}
            onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                    setIsFocus(false);
                }
            }}
        >

            {errorMsg && (
                <div className="text-red-400 text-sm font-medium px-2 pb-1">
                    {errorMsg}
                </div>
            )}

            <div className="flex gap-3 w-full">
                <div className="min-w-[45.5px] w-[45.5px] h-[45.5px] max-w-[45.5px] max-h-[45.5px] min-h-[45.5px] rounded-full overflow-hidden mt-2 border border-main-border">
                    {session?.user?.image ? (
                        <Image
                            src={session.user.image}
                            alt="Profile"
                            width={100}
                            height={100}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-main-blue text-white flex items-center justify-center font-bold text-lg uppercase">
                            {session?.user?.name?.charAt(0) || "U"}
                        </div>
                    )}
                </div>

                <div className="select-none overflow-hidden min-w-0 flex-1">
                    <div
                        ref={contentRef}
                        contentEditable
                        onInput={handleInput}
                        role="textbox"
                        aria-multiline="true"
                        data-placeholder="Type Something..."
                        className={`editable-div post-open overflow-y-auto ${isEmpty ? "is-empty" : ""} lg:max-h-[400px] max-h-[300px] ${isFocus ? "min-h-[100px]" : "min-h-[50px]"} lg:w-full w-md:[400px] overflow-hidden resize-none p-1 outline-none whitespace-pre-wrap wrap-break-words break-all select-text`}
                    ></div>
                </div>
            </div>

            <div className="flex items-center justify-between pt-1">
                <div className="flex gap-1 items-center">
                    <button type="button" className="p-[6px] transition-all hover:bg-dark-clr rounded-lg cursor-pointer">
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
                    className={`btn-gradient ${isEmpty ? "opacity-50 cursor-not-allowed!" : ""} flex items-center justify-center min-w-[70px]`}
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