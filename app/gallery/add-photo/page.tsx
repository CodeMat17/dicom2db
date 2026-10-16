"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { revalidateSite } from "@/lib/revalidate-site";
import {
  deleteManyFromCloudinary,
  uploadToCloudinary,
  type UploadedImage,
} from "@/lib/cloudinary-upload";
import { useMutation } from "convex/react";
import { ImagePlus, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

const orientationOf = ({ width, height }: UploadedImage) =>
  width === height ? "Square" : width > height ? "Landscape" : "Portrait";

const AddPhoto = () => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addPhoto = useMutation(api.gallery.addPhoto);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  // A post is a set of photos. Each one is uploaded as it is picked, so
  // publishing is just the record write.
  const [uploaded, setUploaded] = useState<UploadedImage[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [isPosting, setIsPosting] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    // Cleared so picking the same file again still fires a change event.
    e.target.value = "";
    if (!files.length) return;

    setUploadingCount((count) => count + files.length);
    // Uploaded one at a time so a failure names the file that caused it and
    // the ones before it are still kept.
    for (const file of files) {
      try {
        const image = await uploadToCloudinary(file, "gallery");
        setUploaded((current) => [...current, image]);
      } catch (error) {
        toast.error(`Upload failed: ${file.name}`, {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setUploadingCount((count) => count - 1);
      }
    }
  };

  // The asset is removed from Cloudinary too — nothing references it yet.
  const handleRemoveImage = async (publicId: string) => {
    setUploaded((current) =>
      current.filter((image) => image.imagePublicId !== publicId)
    );
    await deleteManyFromCloudinary([publicId]);
  };

  const move = (index: number, delta: number) => {
    setUploaded((current) => {
      const target = index + delta;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handlePost = async () => {
    if (!title.trim())
      return toast.error("Error!", { description: "Enter a title" });
    if (!description.trim())
      return toast.error("Error!", { description: "Enter a description" });
    if (!uploaded.length)
      return toast.error("Error!", {
        description: "Please upload at least one photo",
      });

    setIsPosting(true);
    try {
      await addPhoto({
        title,
        description,
        category: category || undefined,
        images: uploaded.map((image) => ({
          url: image.imageUrl,
          publicId: image.imagePublicId,
          width: image.width,
          height: image.height,
        })),
        // The published date is set here rather than typed in.
        publishedAt: Date.now(),
      });

      revalidateSite("gallery");
      toast.success("Success!", { description: "Photos published" });
      router.push("/gallery");
    } catch (error) {
      toast.error("Error!", {
        description:
          error instanceof Error ? error.message : "Failed to publish photos",
      });
    } finally {
      setIsPosting(false);
    }
  };

  const isUploading = uploadingCount > 0;

  return (
    <div className='px-4 py-12'>
      <div className='max-w-2xl mx-auto'>
        <h1 className='text-4xl font-bold text-center'>Add Gallery Post</h1>
        <p className='mt-3 text-center text-sm text-muted-foreground'>
          A post can hold several photos — the first one is the cover. Each
          keeps its own orientation on the site, and the published date is set
          automatically.
        </p>

        <div className='space-y-4 pt-8'>
          <div className='space-y-3'>
            <label className='text-sm text-muted-foreground'>Photos</label>

            {uploaded.length > 0 && (
              <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
                {uploaded.map((image, index) => (
                  <div
                    key={image.imagePublicId}
                    className='relative rounded-lg border bg-muted/40 p-2'>
                    <Image
                      src={image.imageUrl}
                      alt={`Photo ${index + 1}`}
                      width={image.width}
                      height={image.height}
                      className='rounded w-full h-32 object-contain'
                      unoptimized
                    />
                    <button
                      type='button'
                      onClick={() => handleRemoveImage(image.imagePublicId)}
                      disabled={isPosting}
                      className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors'>
                      <X className='w-4 h-4' />
                    </button>
                    <div className='mt-2 flex items-center justify-between text-xs text-muted-foreground'>
                      <span>{index === 0 ? "Cover" : `#${index + 1}`}</span>
                      <span>{orientationOf(image)}</span>
                    </div>
                    <div className='mt-1 flex gap-1'>
                      <Button
                        type='button'
                        size='sm'
                        variant='outline'
                        className='h-7 flex-1'
                        onClick={() => move(index, -1)}
                        disabled={index === 0 || isPosting}>
                        ←
                      </Button>
                      <Button
                        type='button'
                        size='sm'
                        variant='outline'
                        className='h-7 flex-1'
                        onClick={() => move(index, 1)}
                        disabled={index === uploaded.length - 1 || isPosting}>
                        →
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className='flex items-center gap-4'>
              <input
                type='file'
                accept='image/*'
                multiple
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
                {uploaded.length ? "Add More Photos" : "Upload Photos"}
              </Button>
              {isUploading && (
                <span className='text-sm'>
                  Uploading {uploadingCount} photo
                  {uploadingCount === 1 ? "" : "s"}...
                </span>
              )}
            </div>
          </div>

          <div className='space-y-1'>
            <label className='text-sm text-muted-foreground'>Title</label>
            <Input
              placeholder='Post title'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isPosting}
            />
          </div>

          <div className='space-y-1'>
            <label className='text-sm text-muted-foreground'>Description</label>
            <Textarea
              placeholder='What is happening in these photos?'
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
            {isPosting ? "Publishing..." : "Publish Post"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddPhoto;
