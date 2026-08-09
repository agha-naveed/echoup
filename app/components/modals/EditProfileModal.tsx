"use client"
import { useState, useRef } from "react";
import Image from "next/image";
import { IoMdClose } from "react-icons/io";
import { FaCamera } from "react-icons/fa";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/app/context/UserContext";

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: any;
}

export default function EditProfileModal({ isOpen, onClose, currentUser }: EditProfileModalProps) {
    const supabase = createClient();

    // const { user: currentUser } = useUser();

    // console.log(currentUser?.profile_image)
    

    // Text States
    const [firstName, setFirstName] = useState(currentUser?.first_name || "");
    const [lastName, setLastName] = useState(currentUser?.last_name || "");

    // Image & Preview States
    const [profileFile, setProfileFile] = useState<File | null>(null);
    const [profilePreview, setProfilePreview] = useState(currentUser?.profile_image || "");
    
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState(currentUser?.cover_image || "");

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Refs for hidden file inputs
    const profileInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    // TODO: Replace these with your actual Cloudinary details
    const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;
    const CLOUDINARY_UPLOAD_PRESET = "my-images";

    if (!isOpen) return null;

    // Handle Image Selection
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
        }
    };

    // Helper: Upload to Cloudinary
    const uploadToCloudinary = async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const response = await fetch(CLOUDINARY_URL, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            throw new Error("Failed to upload image to Cloudinary");
        }

        const data = await response.json();
        return data.secure_url; // This is the optimized HTTPS URL from Cloudinary
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            let newProfileUrl = profilePreview;
            let newCoverUrl = coverPreview;

            // 1. Upload new images to Cloudinary if selected
            if (profileFile) {
                newProfileUrl = await uploadToCloudinary(profileFile);
            }
            if (coverFile) {
                newCoverUrl = await uploadToCloudinary(coverFile);
            }

            // 2. Update Supabase Database with the new Cloudinary URLs
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

            // 3. Close and refresh to reflect changes globally
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
                
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-main-border">
                    <h2 className="text-xl font-bold text-foreground">Edit Profile</h2>
                    <button onClick={onClose} disabled={isSubmitting} className="p-1 rounded-full hover:bg-dark-clr transition-colors">
                        <IoMdClose className="text-2xl text-foreground" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col">
                    {/* Cover Image Section */}
                    <div className="relative w-full h-40 bg-dark-clr group">
                        {coverPreview && (
                            <Image src={coverPreview} alt="Cover" layout="fill" objectFit="cover" />
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button type="button" onClick={() => coverInputRef.current?.click()} className="bg-black/50 p-3 rounded-full text-white hover:bg-black/70 transition">
                                <FaCamera className="text-xl" />
                            </button>
                        </div>
                        <input type="file" accept="image/*" ref={coverInputRef} className="hidden" onChange={(e) => handleImageChange(e, "cover")} />
                    </div>

                    {/* Profile Image Section */}
                    <div className="relative px-5 pb-4">
                        <div className="relative -top-12 w-24 h-24 rounded-full border-4 border-primary bg-dark-clr overflow-hidden group">
                            {profilePreview ? (
                                <Image src={profilePreview} alt="Profile" width={200} height={200} placeholder="blur" blurDataURL={profilePreview} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-main-blue text-white text-3xl font-bold">
                                    {firstName.charAt(0)}
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => profileInputRef.current?.click()}>
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

                    {/* Footer Actions */}
                    <div className="px-5 py-4 border-t border-main-border flex justify-end gap-3 mt-4">
                        <button 
                            type="button" 
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-5 py-2 rounded-full font-medium text-foreground hover:bg-dark-clr transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 rounded-full font-semibold bg-main-blue text-white hover:bg-main-dark-blue transition-colors disabled:opacity-70 flex items-center gap-2"
                        >
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}