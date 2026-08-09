"use client"
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { IoMdClose } from "react-icons/io";
import { FaCamera } from "react-icons/fa";
import { createClient } from "@/utils/supabase/client";

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: any;
}

// Helper: Crops the image perfectly based on the user's drag position
const getCroppedCover = async (imageSrc: string, positionPercentY: number): Promise<File> => {
    return new Promise((resolve, reject) => {
        const image = new window.Image();
        image.src = imageSrc;
        image.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject("Canvas not supported");

            // Modal cover size ratio: max-w-lg (512px) and h-40 (160px)
            const targetAspectRatio = 512 / 160;
            
            let cropWidth = image.width;
            let cropHeight = image.width / targetAspectRatio;

            // If the image is wider than the target ratio, constraint by height instead
            if (cropHeight > image.height) {
                cropHeight = image.height;
                cropWidth = image.height * targetAspectRatio;
            }

            canvas.width = cropWidth;
            canvas.height = cropHeight;

            // Calculate exact pixel offset based on the percentage
            const maxYOffset = image.height - cropHeight;
            const offsetY = (positionPercentY / 100) * maxYOffset;
            const offsetX = (image.width - cropWidth) / 2;

            // Draw the cropped portion to the canvas
            ctx.drawImage(
                image,
                offsetX, offsetY, cropWidth, cropHeight, // Source coordinates
                0, 0, cropWidth, cropHeight              // Destination coordinates
            );

            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(new File([blob], "cover-cropped.jpg", { type: "image/jpeg" }));
                } else {
                    reject("Failed to create blob");
                }
            }, 'image/jpeg', 0.9);
        };
        image.onerror = () => reject("Failed to load image for cropping");
    });
};

export default function EditProfileModal({ isOpen, onClose, currentUser }: EditProfileModalProps) {
    const supabase = createClient();

    // Text States
    const [firstName, setFirstName] = useState(currentUser?.first_name || "");
    const [lastName, setLastName] = useState(currentUser?.last_name || "");


    // Image & Preview States
    const [profileFile, setProfileFile] = useState<File | null>(null);
    const [profilePreview, setProfilePreview] = useState(currentUser?.profile_image || "");
    
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState("");

    // const [coverImage, setCoverImage] = useState("");

    useEffect(() => {
        const fetchCoverImage = async () => {
            if (!currentUser?.id) return;

            // Only fetch the cover_image column, nothing else!
            const { data } = await supabase
                .from('users')
                .select('cover_image')
                .eq('id', currentUser.id)
                .single();

            if (data?.cover_image) {
                setCoverPreview(data.cover_image);
            }
        };

        fetchCoverImage();
    }, [currentUser?.id, supabase]);

    // Draggable Cover States
    const [coverY, setCoverY] = useState(50); // 50% is perfectly centered
    const [dragStart, setDragStart] = useState<number | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const profileInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    // TODO: Replace these with your actual Cloudinary details
    const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;
    const CLOUDINARY_UPLOAD_PRESET = "my-images";

    if (!isOpen) return null;

    // --- DRAG TO REPOSITION LOGIC ---
    const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        if (!coverFile) return; // Only allow dragging for new uploads
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        setDragStart(clientY);
    };

    const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (dragStart === null || !coverFile) return;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const deltaY = clientY - dragStart;
        
        const containerHeight = 160; // Represents the h-40 container
        const percentageChange = (deltaY / containerHeight) * 100;
        
        setCoverY(prev => {
            let newY = prev - percentageChange;
            if (newY < 0) newY = 0;
            if (newY > 100) newY = 100;
            return newY;
        });
        
        setDragStart(clientY);
    };

    const handleDragEnd = () => setDragStart(null);

    // --- IMAGE SELECTION ---
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: "profile" | "cover") => {
        const file = e.target.files?.[0];
        if (!file) return;

        const previewUrl = URL.createObjectURL(file);
        
        if (type === "profile") {
            setProfileFile(file);
            setProfilePreview(previewUrl);
        } else {
            setCoverFile(file);
            setCoverPreview(previewUrl);
            setCoverY(50); // Reset position when selecting a new image
        }
    };

    // --- CLOUDINARY UPLOAD ---
    const uploadToCloudinary = async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const response = await fetch(CLOUDINARY_URL, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) throw new Error("Failed to upload image to Cloudinary");
        const data = await response.json();
        return data.secure_url;
    };

    // --- SUBMISSION ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            let newProfileUrl = profilePreview;
            let newCoverUrl = coverPreview;

            // 1. Process and Upload Cover Image
            if (coverFile) {
                // Generate the mathematically perfectly cropped file based on drag state!
                const croppedCover = await getCroppedCover(coverPreview, coverY);
                newCoverUrl = await uploadToCloudinary(croppedCover);
            }

            // 2. Upload Profile Image
            if (profileFile) {
                newProfileUrl = await uploadToCloudinary(profileFile);
            }

            // 3. Update Supabase
            const { error: dbError } = await supabase
                .from('users')
                .update({
                    first_name: firstName,
                    last_name: lastName,
                    profile_image: newProfileUrl,
                    cover_image: newCoverUrl
                })
                .eq('id', currentUser.id);

            if (dbError) throw dbError;

            onClose();
            window.location.reload(); 

        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-primary w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-main-border animate-fade-in">
                
                <div className="flex items-center justify-between px-5 py-4 border-b border-main-border">
                    <h2 className="text-xl font-bold text-foreground">Edit Profile</h2>
                    <button onClick={onClose} disabled={isSubmitting} className="p-1 rounded-full hover:bg-dark-clr transition-colors">
                        <IoMdClose className="text-2xl text-foreground" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col">
                    {/* Cover Image Section */}
                    <div 
                        className={`relative w-full h-40 bg-dark-clr group overflow-hidden ${coverFile ? 'cursor-move touch-none' : ''}`}
                        onMouseDown={handleDragStart}
                        onMouseMove={handleDragMove}
                        onMouseUp={handleDragEnd}
                        onMouseLeave={handleDragEnd}
                        onTouchStart={handleDragStart}
                        onTouchMove={handleDragMove}
                        onTouchEnd={handleDragEnd}
                    >
                        {coverFile && (
                            <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md text-white text-[12px] px-2.5 py-1 rounded shadow-md pointer-events-none z-10 font-medium tracking-wide">
                                ↕ Drag to reposition
                            </div>
                        )}

                        {coverPreview && (
                            <Image 
                                src={coverPreview} 
                                alt="Cover" 
                                layout="fill" 
                                objectFit="cover"
                                style={{ objectPosition: `center ${coverY}%` }} // Live visual update
                                draggable={false}
                            />
                        )}
                        
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <button 
                                type="button" 
                                onClick={(e) => { e.stopPropagation(); coverInputRef.current?.click(); }} 
                                className="bg-black/50 p-3 rounded-full text-white hover:bg-black/70 transition pointer-events-auto"
                            >
                                <FaCamera className="text-xl" />
                            </button>
                        </div>
                        <input type="file" accept="image/*" ref={coverInputRef} className="hidden" onChange={(e) => handleImageChange(e, "cover")} />
                    </div>

                    {/* Profile Image Section */}
                    <div className="relative px-5 pb-4">
                        <div className="relative -top-12 w-24 h-24 rounded-full border-4 border-primary bg-dark-clr overflow-hidden group">
                            {profilePreview ? (
                                <Image src={profilePreview} alt="Profile" layout="fill" objectFit="cover" draggable={false} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-main-blue text-white text-3xl font-bold">
                                    {firstName.charAt(0)}
                                </div>
                            )}
                            <div 
                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" 
                                onClick={() => profileInputRef.current?.click()}
                            >
                                <FaCamera className="text-white text-lg" />
                            </div>
                        </div>
                        <input type="file" accept="image/*" ref={profileInputRef} className="hidden" onChange={(e) => handleImageChange(e, "profile")} />

                        {/* Name Inputs */}
                        <div className="grid gap-4 mt-[-30px]">
                            <div className="grid gap-1.5">
                                <label className="text-sm font-medium text-foreground/80">First Name</label>
                                <input 
                                    type="text" 
                                    required
                                    value={firstName} 
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full bg-dark-clr border border-main-border rounded-lg px-4 py-2.5 text-foreground outline-none focus:border-main-blue transition-colors"
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <label className="text-sm font-medium text-foreground/80">Last Name</label>
                                <input 
                                    type="text" 
                                    required
                                    value={lastName} 
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full bg-dark-clr border border-main-border rounded-lg px-4 py-2.5 text-foreground outline-none focus:border-main-blue transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="px-5 py-4 border-t border-main-border flex justify-end gap-3 mt-4">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="px-5 py-2 rounded-full font-medium text-foreground hover:bg-dark-clr transition-colors disabled:opacity-50">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting} className="px-6 py-2 rounded-full font-semibold bg-main-blue text-white hover:bg-main-dark-blue transition-colors disabled:opacity-70 flex items-center gap-2">
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}