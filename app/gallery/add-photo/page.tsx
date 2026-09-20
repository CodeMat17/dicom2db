"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import {
  uploadToCloudinary,
  type UploadedImage,
} from "@/lib/cloudinary-upload";
import { useMutation } from "convex/react";
import { ImagePlus, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const AddPhoto = () => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addPhoto = useMutation(api.gallery.addPhoto);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // Cloudinary reports the stored dimensions, which is what decides whether
  // the site shows this photo portrait or landscape.
  const [uploaded, setUploaded] = useState<UploadedImage | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setPreviewUrl(URL.createObjectURL(file));
      setUploaded(await uploadToCloudinary(file, "gallery"));
    } catch (error) {
      toast.error("Upload failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
      setPreviewUrl(null);
      setUploaded(null);
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleRemoveImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setUploaded(null);
  };

  const handlePost = async () => {
    if (!title.trim())
      return toast.error("Error!", { description: "Enter a title" });
    if (!description.trim())
      return toast.error("Error!", { description: "Enter a description" });
    if (!uploaded)
      return toast.error("Error!", { description: "Please upload a photo" });

    setIsPosting(true);
    try {
      await addPhoto({
        title,
        description,
        category: category || undefined,
        imageUrl: uploaded.imageUrl,
        imagePublicId: uploaded.imagePublicId,
        width: uploaded.width,
        height: uploaded.height,
        // The published date is set here rather than typed in.
        publishedAt: Date.now(),
      });

      toast.success("Success!", { description: "Photo published" });
      router.push("/gallery");
    } catch (error) {
      toast.error("Error!", {
        description:
          error instanceof Error ? error.message : "Failed to publish photo",
      });
    } finally {
      setIsPosting(false);
    }
  };

  const orientation = uploaded
    ? uploaded.width === uploaded.height
      ? "Square"
      : uploaded.width > uploaded.height
        ? "Landscape"
        : "Portrait"
    : null;

  return (
    <div className='px-4 py-12'>
      <div className='max-w-2xl mx-auto'>
        <h1 className='text-4xl font-bold text-center'>Add Gallery Photo</h1>
        <p className='mt-3 text-center text-sm text-muted-foreground'>
          The photo keeps its own orientation on the site — portraits show
          portrait, landscapes show landscape. The published date is set
          automatically.
        </p>

        <div className='space-y-4 pt-8'>
          <div className='space-y-1'>
            {!previewUrl && (
              <div>
                <label className='text-sm text-muted-foreground'>Photo</label>
                <div className='flex items-center gap-4'>
                  <input
                    type='file'
                    accept='image/*'
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                    className='hidden'
                    disabled={isUploading}
                  />
                  <Button
                    variant='outline'
                    type='button'
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || isPosting}>
                    <ImagePlus className='w-4 h-4 mr-2' />
                    Upload Photo
                  </Button>
                  {isUploading && <span className='text-sm'>Uploading...</span>}
                </div>
              </div>
            )}

            {previewUrl && (
              <div className='flex flex-col items-center gap-4 justify-center'>
                <div className='relative mt-2 w-full max-w-lg'>
                  {/* Shown at its natural ratio so what you see here is what
                      the public grid renders. */}
                  <Image
                    src={previewUrl}
                    alt='Preview'
                    width={uploaded?.width ?? 800}
                    height={uploaded?.height ?? 600}
                    className='rounded-lg w-full h-auto object-contain'
                    unoptimized
                  />
                  <button
                    type='button'
                    onClick={handleRemoveImage}
                    className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors'>
                    <X className='w-4 h-4' />
                  </button>
                </div>

                {uploaded && (
                  <p className='text-sm text-muted-foreground'>
                    {orientation} · {uploaded.width}×{uploaded.height}px
                  </p>
                )}

                <div className='flex items-center gap-4'>
                  <input
                    type='file'
                    accept='image/*'
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                    className='hidden'
                    disabled={isUploading}
                  />
                  <Button
                    variant='outline'
                    type='button'
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || isPosting}>
                    <ImagePlus className='w-4 h-4 mr-2' />
                    Change Photo
                  </Button>
                  {isUploading && <span className='text-sm'>Uploading...</span>}
                </div>
              </div>
            )}
          </div>

          <div className='space-y-1'>
            <label className='text-sm text-muted-foreground'>Title</label>
            <Input
              placeholder='Photo title'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isPosting}
            />
          </div>

          <div className='space-y-1'>
            <label className='text-sm text-muted-foreground'>Description</label>
            <Textarea
              placeholder='What is happening in this photo?'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPosting}
              rows={4}
            />
          </div>

          <div className='space-y-1'>
            <label className='text-sm text-muted-foreground'>
              Category (optional)
            </label>
            <Input
              placeholder='e.g. Tech Fest 2025'
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isPosting}
            />
          </div>
        </div>

        <div className='flex justify-end gap-2 pt-6'>
          <Button
            variant='outline'
            onClick={() => router.back()}
            disabled={isPosting}>
            Cancel
          </Button>
          <Button onClick={handlePost} disabled={isPosting || isUploading}>
            {isPosting ? "Publishing..." : "Publish Photo"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddPhoto;
