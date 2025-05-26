"use client";

import { RichTextEditor } from "@/components/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { ImagePlus, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
};

const AddStory = () => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const addStory = useMutation(api.achievements.addStory);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [story, setStory] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [storageId, setStorageId] = useState<Id<"_storage"> | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      toast.error("Error!", { description: "Image must be less than 1MB" });
      return;
    }

    try {
      setIsUploading(true);
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!response.ok) throw new Error("Upload failed");
      const { storageId } = await response.json();

      setStorageId(storageId);
    } catch (error) {
      toast.error("Upload failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
      setPreviewUrl(null);
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
    setStorageId(null);
  };

  const handlePost = async () => {
    if (!title) return toast.error("Error!", { description: "Enter title" });
    if (!description)
      return toast.error("Error!", { description: "Enter description" });
    if (!storageId)
      return toast.error("Error!", { description: "Please upload a photo" });

    const slug = generateSlug(title);

    setIsPosting(true);
    try {
      await addStory({
        title,
        description,
        story,
        slug,
        photo: storageId,
      });

      toast.success("Success!", { description: "Story created successfully" });
      resetForm();
      router.back();
    } catch (error) {
      toast.error("Error!", {
        description:
          error instanceof Error ? error.message : "Failed to create story",
      });
    } finally {
      setIsPosting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStory("");
    setPreviewUrl(null);
    setStorageId(null);
  };

  return (
    <div className='px-4 py-12'>
      <div className='max-w-2xl mx-auto'>
        <h1 className='text-4xl font-bold text-center '>Add New Story</h1>
        <div className='space-y-3 pt-6'>
                  <div className='space-y-1'>
                      {!previewUrl && <div>  <label className='text-sm text-muted-foreground'>Cover Image</label>
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
                {previewUrl ? "Change Image" : "Upload Image"}
              </Button>
              {isUploading && <span className='text-sm'>Uploading...</span>}
            </div></div>}
          

            {previewUrl && (
              <div className='flex flex-col items-center gap-4 justify-center'>
                <div className='relative mt-2 w-full max-w-lg aspect-video'>
                  <Image
                    src={previewUrl}
                    alt='Preview'
                    fill
                    className='rounded-lg object-cover'
                    sizes='128px'
                  />
                  <button
                    type='button'
                    onClick={handleRemoveImage}
                    className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors'>
                    <X className='w-4 h-4' />
                  </button>
                </div>
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
                    {previewUrl ? "Change Image" : "Upload Image"}
                  </Button>
                  {isUploading && <span className='text-sm'>Uploading...</span>}
                </div>
              </div>
            )}
          </div>

          <div className='space-y-1'>
            <label className='text-sm text-muted-foreground'>Title</label>
            <Input
              placeholder='Story title'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isPosting}
            />
          </div>

          <div className='space-y-1'>
            <label className='text-sm text-muted-foreground'>Description</label>
            <Input
              placeholder='Story description'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPosting}
            />
          </div>

          <div className='space-y-1'>
            <label className='text-sm text-muted-foreground'>
              Story Content
            </label>
            <RichTextEditor value={story} onChange={setStory} />
          </div>
        </div>

        <div className='flex justify-end gap-2'>
          <Button
            variant='outline'
            onClick={() => router.back()}
            disabled={isPosting}>
            Cancel
          </Button>
          <Button onClick={handlePost} disabled={isPosting || isUploading}>
            {isPosting ? "Publishing..." : "Publish Story"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddStory;
