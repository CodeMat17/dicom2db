// app/(routes)/achievements/[slug]/page.tsx

"use client";

import { RichTextEditor } from "@/components/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { ImagePlus, Loader2, Lock, LockOpen, X } from "lucide-react";
import Image from "next/image";
import { notFound, useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function AchievementPage() {
  const router = useRouter();
  const params = useParams();
  const slugParam = params.slug as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const storyData = useQuery(api.achievements.getAchievementBySlug, {
    slug: slugParam,
  });

  // Handle errors using useEffect
  useEffect(() => {
    if (storyData === null) {
      toast.error("Achievement not found");
      router.push("/achievements");
    }
  }, [storyData, router]);

 

  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const updateAchievement = useMutation(api.achievements.updateAchievement);

  const [isEditing, setIsEditing] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Individual state variables
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [storyContent, setStoryContent] = useState("");
  const [photoStorageId, setPhotoStorageId] = useState<Id<"_storage"> | null>(
    null
  );

  // Initialize state from storyData
  useEffect(() => {
    if (storyData) {
      setTitle(storyData.title);
      setSlug(storyData.slug);
      setDescription(storyData.description);
      setStoryContent(storyData.story || "");
      setPhotoStorageId(storyData.photo);
      setPreviewUrl(storyData.photoUrl);
    }
  }, [storyData]);

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Generate slug from title when locked
  useEffect(() => {
    if (isLocked && storyData?.title) {
      const newSlug = generateSlug(title);
      setSlug(newSlug);
    }
  }, [title, isLocked, storyData]);

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
      setPhotoStorageId(storageId);
    } catch (error) {
      toast.error("Upload failed", { description: `${error}` });
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!title) return toast.error("Title is required");
    if (!slug) return toast.error("Slug is required");
    if (!photoStorageId) return toast.error("Photo is required");

    setIsSaving(true);
    try {
      await updateAchievement({
        id: storyData!._id,
        title,
        description,
        story: storyContent,
        slug,
        photo: photoStorageId,
      });

      toast.success("Achievement updated successfully");
      setIsEditing(false);
      // Redirect to new slug if it changed
      if (slug !== slugParam) {
        router.back()
      } else {
        router.refresh();
      }
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update achievement", { description: `${error}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (storyData) {
      setTitle(storyData.title);
      setSlug(storyData.slug);
      setDescription(storyData.description);
      setStoryContent(storyData.story || "");
      setPhotoStorageId(storyData.photo);
      setPreviewUrl(storyData.photoUrl);
    }
    setIsEditing(false);
  };

  if (storyData === undefined) {
    return <SkeletonPage />;
  }

  if (!storyData) {
    return notFound();
  }

  return (
    <article className='max-w-3xl mx-auto px-4 py-12'>
      <div className='flex justify-between items-center gap-4 mb-8'>
        <h1 className='text-4xl font-bold'>
          {isEditing ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className='text-4xl font-bold'
            />
          ) : (
            storyData.title
          )}
        </h1>
        <div className='flex gap-2'>
          {isEditing ? (
            <>
              <Button
                variant='outline'
                onClick={handleCancel}
                disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Edit</Button>
          )}
        </div>
      </div>

      <div className='mb-8'>
        {isEditing ? (
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className='flex-1'
              />
              <Button
                variant='outline'
                size='icon'
                onClick={() => setIsLocked(!isLocked)}>
                {isLocked ? <Lock size={16} /> : <LockOpen size={16} />}
              </Button>
            </div>

            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Enter description'
            />
          </div>
        ) : (
          <>
            <p className='text-lg text-muted-foreground mb-4'>
              {storyData.description}
            </p>
            {storyData._creationTime && (
              <footer className='mb-6 text-sm text-muted-foreground italic'>
                Published{" "}
                {new Date(storyData._creationTime).toLocaleDateString()}
              </footer>
            )}
          </>
        )}
      </div>

      {/* Image Section */}
      <div className='relative w-full h-64 rounded-lg overflow-hidden mb-8'>
        {isEditing ? (
          <div className='relative w-full h-full border-2 border-dashed rounded-lg'>
            <input
              type='file'
              accept='image/*'
              onChange={handleFileSelect}
              ref={fileInputRef}
              className='hidden'
              disabled={isUploading}
            />
            {previewUrl ? (
              <>
                <Image
                  src={previewUrl}
                  alt={title}
                  fill
                  className='object-cover object-top'
                />
                <button
                  className='absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full'
                  onClick={() => {
                    setPreviewUrl(null);
                    setPhotoStorageId(null);
                  }}>
                  <X size={16} />
                </button>
              </>
            ) : (
              <button
                className='w-full h-full flex items-center justify-center'
                onClick={() => fileInputRef.current?.click()}>
                <ImagePlus size={24} className='mr-2' />
                {isUploading ? "Uploading..." : "Upload Image"}
              </button>
            )}
          </div>
        ) : storyData.photoUrl ? (
          <Image
            src={storyData.photoUrl}
            alt={storyData.title}
            fill
            className='object-cover'
          />
        ) : null}
      </div>

      {/* Story Content */}
      {isEditing ? (
        <RichTextEditor value={storyContent} onChange={setStoryContent} />
      ) : (
        storyData.story && (
          <section className='space-y-6'>
            <div
              className='[&>p]:mb-4 [&>p]:text-gray-700 [&>p]:dark:text-gray-300 [&>p]:leading-relaxed
                       [&>ul]:list-disc [&>ul]:pl-8 [&>ul]:mb-4
                       [&>ol]:list-decimal [&>ol]:pl-8 [&>ol]:mb-4
                       [&>li]:mb-2 [&>*+*]:mt-4'
              dangerouslySetInnerHTML={{ __html: storyData.story }}
            />
          </section>
        )
      )}
    </article>
  );
}

const SkeletonPage = () => (
  <div className='max-w-3xl mx-auto p-4'>
    <Skeleton className='h-8 w-3/4 mb-4' />
    <Skeleton className='h-4 w-1/2 mb-8' />
    <div className='flex gap-4 mb-8'>
      <Skeleton className='h-64 w-full' />
    </div>
    <Skeleton className='h-4 w-full mb-4' />
    <Skeleton className='h-4 w-full mb-4' />
    <Skeleton className='h-4 w-2/3 mb-4' />
  </div>
);

const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
};
