"use client"
import { useState, useRef } from "react";
import { TbPhoto } from "react-icons/tb";
import { MdOutlineOndemandVideo } from "react-icons/md";
import { FiFileText } from "react-icons/fi";
import { IoMdClose } from "react-icons/io";
import Image from "next/image";
import { useRouter } from "next/navigation";
import axios from "axios";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "../../context/UserContext";

// Initialized outside the component to prevent connection locks
const supabase = createClient();

const CreatePost = () => {
    const router = useRouter();
    const { user: currentUser } = useUser();

    const [isFocus, setIsFocus] = useState(false);
    const [isEmpty, setIsEmpty] = useState(true);
    const [isPosting, setIsPosting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Image states
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);

    // Video states
    const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
    const [isReel, setIsReel] = useState(false);

    const contentRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        const text = e.currentTarget.textContent?.trim() || "";
        if (selectedFiles.length > 0 || selectedVideo) {
            setIsEmpty(false);
        } else {
            setIsEmpty(!text);
        }
        if (errorMsg) setErrorMsg(null);
    };

    // --- IMAGE LOGIC ---
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;

        if (selectedVideo) {
            setErrorMsg("You cannot upload images and a video in the same post.");
            return;
        }

        const files = Array.from(e.target.files);

        if (selectedFiles.length + files.length > 4) {
            setErrorMsg("You can only attach up to 4 images.");
            return;
        }

        setIsEmpty(false);
        setSelectedFiles((prev) => [...prev, ...files]);

        const newPreviewUrls = files.map((file) => URL.createObjectURL(file));
        setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
        setErrorMsg(null);
    };

    const removeImage = (indexToRemove: number) => {
        URL.revokeObjectURL(previewUrls[indexToRemove]);

        const remainingFiles = selectedFiles.filter((_, i) => i !== indexToRemove);
        setSelectedFiles(remainingFiles);
        setPreviewUrls((prev) => prev.filter((_, i) => i !== indexToRemove));

        if (remainingFiles.length === 0 && !(contentRef.current?.innerText.trim())) {
            setIsEmpty(true);
        }
    };

    // --- VIDEO LOGIC ---
    const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (selectedFiles.length > 0) {
            setErrorMsg("You cannot upload a video and images in the same post.");
            return;
        }

        if (!file.type.startsWith("video/")) {
            setErrorMsg("Please select a valid video file.");
            return;
        }

        const MAX_FILE_SIZE = 10 * 1024 * 1024;
        if (file.size > MAX_FILE_SIZE) {
            setErrorMsg("Video is too large! Maximum file size is 10MB.");
            return;
        }

        const videoUrl = URL.createObjectURL(file);
        const videoElement = document.createElement("video");
        videoElement.src = videoUrl;

        videoElement.onloadedmetadata = () => {
            const durationInSeconds = videoElement.duration;

            if (durationInSeconds < 30) {
                setIsReel(true);
            } else {
                setIsReel(false);
            }

            URL.revokeObjectURL(videoUrl);
            setIsEmpty(false);
            setSelectedVideo(file);
            setErrorMsg(null);
        };

        videoElement.onerror = () => {
            URL.revokeObjectURL(videoUrl);
            setErrorMsg("Error reading video file. Please try another video.");
        };
    };

    const removeVideo = () => {
        setSelectedVideo(null);
        if (!(contentRef.current?.innerText.trim())) {
            setIsEmpty(true);
        }
    };

    // --- SUBMIT LOGIC (OPTION 1: AUTOMATIC AI TRANSCRIPTION & HASHTAGS) ---
    const handlePostSubmit = async () => {
        const text = contentRef.current?.innerText.trim() || "";

        if ((!text && selectedFiles.length === 0 && !selectedVideo) || !currentUser) return;

        setIsPosting(true);
        setErrorMsg(null);

        try {
            let uploadedImageUrls: string[] = [];
            let uploadedVideoUrl: string | null = null;
            let generatedSubtitlesVtt: string | null = null;
            let finalCaption = text;

            // 1A. Upload images to Cloudinary
            if (selectedFiles.length > 0) {
                const getImagesUrl = selectedFiles.map(async (file) => {
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("upload_preset", "my-images");
                    const response = await axios.post(
                        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
                        formData
                    );
                    return response.data.secure_url;
                });
                uploadedImageUrls = await Promise.all(getImagesUrl);
            }

            // 1B. Upload video to Cloudinary
            if (selectedVideo) {
                const formData = new FormData();
                formData.append("file", selectedVideo);
                formData.append("upload_preset", "my-images");

                const response = await axios.post(
                    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload`,
                    formData
                );
                uploadedVideoUrl = response.data.secure_url;

                // 1C. Call FastAPI Faster-Whisper for Subtitles, Caption & Hashtags
                if (isReel && uploadedVideoUrl) {
                    try {
                        console.log("🎙️ Sending video to FastAPI for AI transcription...");
                        const aiRes = await axios.post("http://localhost:8000/api/reels/transcribe", {
                            video_url: uploadedVideoUrl
                        });

                        const { subtitles_vtt, suggested_caption, hashtags } = aiRes.data;
                        generatedSubtitlesVtt = subtitles_vtt || null;

                        // Case 1: User left caption blank -> Use full AI suggested caption + hashtags
                        if (!finalCaption && suggested_caption) {
                            finalCaption = suggested_caption;
                        }
                        // Case 2: User wrote a caption without hashtags -> Append AI hashtags
                        else if (finalCaption && !finalCaption.includes("#") && hashtags?.length > 0) {
                            finalCaption = `${finalCaption} ${hashtags.join(" ")}`;
                        }

                        console.log("✅ AI Transcription complete:", { finalCaption, hasSubtitles: !!generatedSubtitlesVtt });
                    } catch (transcribeErr) {
                        console.error("⚠️ AI Transcription failed (continuing post creation):", transcribeErr);
                    }
                }
            }

            // 2. Insert Post directly into Supabase (with subtitles_vtt and finalCaption)
            const { data: insertedData, error: insertError } = await supabase
                .from("posts")
                .insert({
                    content: finalCaption,
                    image_url: uploadedImageUrls,
                    video_url: uploadedVideoUrl,
                    subtitles_vtt: generatedSubtitlesVtt,
                    is_reel: isReel,
                    author_id: currentUser.id
                })
                .select();

            if (insertError) throw insertError;

            // 2B. Existing background video processing hook
            if (isReel && uploadedVideoUrl && insertedData && insertedData.length > 0) {
                try {
                    await axios.post("http://127.0.0.1:8000/api/reels/process_video", {
                        post_id: insertedData[0].id,
                        video_url: uploadedVideoUrl
                    });
                } catch (aiError) {
                    console.error("Failed to trigger AI processing:", aiError);
                }
            }

            // 3. Reset UI state on success
            if (contentRef.current) contentRef.current.innerText = "";
            setIsEmpty(true);
            setSelectedFiles([]);
            setPreviewUrls([]);
            setSelectedVideo(null);
            setIsReel(false);
            router.refresh();

        } catch (error: any) {
            console.error("Post failed:", error);
            setErrorMsg("Failed to post. Please try again.");
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div
            ref={containerRef}
            tabIndex={-1}
            className={`flex flex-col gap-2 relative overflow-hidden px-5 py-3 bg-primary w-full rounded-xl text-foreground/80 border transition-all ${isFocus ? "border-foreground/40 shadow-[0_2px_15px_#a3a3a334]" : "border-main-border"}`}
            onFocus={() => setIsFocus(true)}
            onBlur={(e) => {
                if (containerRef.current && containerRef.current.contains(e.relatedTarget as Node)) {
                    return;
                }
                setIsFocus(false);
            }}
        >
            {errorMsg && (
                <div className="text-red-400 text-sm font-medium px-2 pb-1">
                    {errorMsg}
                </div>
            )}

            <div>
                <div className="flex gap-3 w-full">
                    <div className="min-w-[45.5px] w-[45.5px] h-[45.5px] max-w-[45.5px] max-h-[45.5px] min-h-[45.5px] rounded-full overflow-hidden mt-2 border border-main-border">
                        {currentUser?.profile_image ? (
                            <Image src={currentUser.profile_image} alt="Profile" width={100} height={100} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-main-blue text-white flex items-center justify-center font-bold text-lg uppercase">
                                {currentUser?.first_name?.charAt(0) || "U"}
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
                            data-placeholder="What's on your mind? (Leave blank on a Reel for AI auto-caption)"
                            className={`editable-div post-open overflow-y-auto ${isEmpty ? "is-empty" : ""} lg:max-h-[400px] max-h-[300px] ${isFocus ? "min-h-[100px]" : "min-h-[50px]"} w-full overflow-hidden resize-none p-1 outline-none whitespace-pre-wrap wrap-break-words break-all select-text`}
                        ></div>
                    </div>
                </div>

                {/* Image Previews */}
                {previewUrls.length > 0 && (
                    <div className="flex gap-3 mt-5">
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

                {/* Video Preview */}
                {selectedVideo && (
                    <div className="relative group w-fit mt-5">
                        <video
                            src={URL.createObjectURL(selectedVideo)}
                            className="max-h-[200px] rounded-xl border border-main-border object-cover"
                            controls
                        />
                        <button
                            type="button"
                            onClick={() => { removeVideo(); setIsReel(false); }}
                            className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-lg transition-colors cursor-pointer"
                        >
                            <IoMdClose size={18} />
                        </button>
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
                    <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        ref={videoInputRef}
                        onChange={handleVideoSelect}
                    />

                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => fileInputRef.current?.click()}
                        className="p-[6px] transition-all hover:bg-dark-clr rounded-lg cursor-pointer"
                        title="Add Image"
                    >
                        <TbPhoto className="text-[19px]" />
                    </button>

                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => videoInputRef.current?.click()}
                        className="p-[6px] transition-all hover:bg-dark-clr rounded-lg cursor-pointer"
                        title="Add Video/Reel"
                    >
                        <MdOutlineOndemandVideo className="text-[19px]" />
                    </button>

                    <button type="button" className="p-[6px] transition-all hover:bg-dark-clr rounded-lg cursor-pointer">
                        <FiFileText className="text-[19px]" />
                    </button>
                </div>

                <button
                    type="button"
                    onClick={() => { handlePostSubmit(); setIsFocus(false); }}
                    disabled={isEmpty || isPosting || !currentUser}
                    className={`btn-gradient ${isEmpty || !currentUser ? "opacity-50 cursor-not-allowed!" : "cursor-pointer"} flex items-center justify-center min-w-[70px]`}
                >
                    {isPosting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : "Post"}
                </button>
            </div>
        </div>
    );
};

export default CreatePost;