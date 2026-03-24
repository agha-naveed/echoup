"use client"
import { useState } from "react";
import { TbPhoto } from "react-icons/tb";
import { MdOutlineOndemandVideo } from "react-icons/md";
import { FiFileText } from "react-icons/fi";
import Image from "next/image";

const CreatePost = () => {
    const [isFocus, setIsFocus] = useState(false)
    const [isEmpty, setIsEmpty] = useState(true);

    const handleInput = (e: any) => {
        const text = e.currentTarget.textContent.trim();
        setIsEmpty(!text);
    };

    return (
        <div className={`flex flex-col gap-2 px-5 py-3 bg-primary w-full rounded-xl text-foreground/80 border ${isFocus ? "border-foreground/40 shadow-[0_2px_15px_#a3a3a334]" : "border-main-border"}`} onFocus={() => setIsFocus(true)} onBlur={() => setIsFocus(false)}>
            <div className="flex gap-3 w-full">
                <div className="min-w-[45.5px] w-[45.5px] h-[45.5px] max-w-[45.5px] max-h-[45.5px] min-h-[45.5px] rounded-full overflow-hidden mt-2">
                    <Image src={"https://ntvb.tmsimg.com/assets/assets/487578_v9_bb.jpg?w=360&h=480"} alt="s" width={100} height={100} className="w-full h-full object-cover" />
                </div>
                <div className="select-none overflow-hidden min-w-0 flex-1">
                    <div
                        contentEditable
                        onInput={handleInput}
                        role="textbox"
                        aria-multiline="true"
                        data-placeholder="Type Something..."
                        className={`editable-div post-open overflow-y-auto ${isEmpty ? "is-empty" : ""} min-h-[50px] lg:max-h-[400px] max-h-[300px] focus:min-h-[100px] lg:w-[498px] w-md:[400px] overflow-hidden resize-none p-1 outline-none
                        whitespace-pre-wrap wrap-break-words break-all select-text`}>
                    </div>
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
                <button type="button" className="btn-gradient">Post</button>
            </div>

        </div>
    )
}

export default CreatePost