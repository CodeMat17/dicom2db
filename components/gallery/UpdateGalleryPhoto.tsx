"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { revalidateSite } from "@/lib/revalidate-site";
import { Id } from "@/convex/_generated/dataModel";
import {
  deleteManyFromCloudinary,
  uploadToCloudinary,
} from "@/lib/cloudinary-upload";
import { useMutation } from "convex/react";
import { ImagePlus, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";

/** One photo of the post, in the shape the mutation takes. */
export type GalleryImageInput = {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
};

type Props = {
  id: Id<"gallery">;
  title: string;
  description: string;
  category?: string;
  images: { url: string; publicId: string | null; width?: number; height?: number }[];
};

const UpdateGalleryPhoto = ({
  id,
  title: initialTitle,
  description: initialDescription,
  category: initialCategory,
  images: initialImages,
}: Props) => {
  const updatePhoto = useMutation(api.gallery.updatePhoto);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [category, setCategory] = useState(initialCategory ?? "");
  const [images, setImages] = useState<GalleryImageInput[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Only photos carrying a Cloudinary id can be rewritten; a legacy row whose
  // file still lives in Convex storage has none, so it is shown but has to be
  // replaced rather than kept when the set is saved.
  const storedImages = initialImages.filter(
    (image): image is GalleryImageInput & { publicId: string } => !!image.publicId
  );
  const storedKey = storedImages.map((image) => image.publicId).join("|");

  // Reopening the dialog should show the stored values, not a stale edit.
  useEffect(() => {
    if (open) return;
    setTitle(initialTitle);
    setDescription(initialDescription);
    setCategory(initialCategory ?? "");
    setImages(storedImages);
    // `storedImages` is rebuilt each render; `storedKey` tracks its identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialTitle, initialDescription, initialCategory, storedKey]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;

    setUploadingCount((count) => count + files.length);
    for (const file of files) {
      try {
        const image = await uploadToCloudinary(file, "gallery");
        setImages((current) => [
          ...current,
          {
            url: image.imageUrl,
            publicId: image.imagePublicId,
            width: image.width,
            height: image.height,
          },
        ]);
      } catch (error) {
        toast.error(`Upload failed: ${file.name}`, {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setUploadingCount((count) => count - 1);
      }
    }
  };

  // Dropped from the set only — the file is deleted once the save goes
  // through, so cancelling the dialog leaves the post intact.
  const removeImage = (publicId: string) =>
    setImages((current) =>
      current.filter((image) => image.publicId !== publicId)
    );

  const move = (index: number, delta: number) =>
    setImages((current) => {
      const target = index + delta;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const handleSave = async () => {
    if (!title.trim())
      return toast.error("Error!", { description: "Enter a title" });
    if (!description.trim())
      return toast.error("Error!", { description: "Enter a description" });
    if (!images.length)
      return toast.error("Error!", {
        description: "A post needs at least one photo",
      });

    setIsSaving(true);
    try {
      const { replacedPublicIds } = await updatePhoto({
        id,
        title,
        description,
        category: category || undefined,
        images,
      });

      await deleteManyFromCloudinary(replacedPublicIds);
      revalidateSite("gallery");
      toast.success("Success!", { description: "Post updated" });
      setOpen(false);
    } catch (error) {
      toast.error("Error!", {
        description:
          error instanceof Error ? error.message : "Failed to update post",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isUploading = uploadingCount > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' className='w-full'>
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-lg max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Edit post</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {images.length > 0 && (
            <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
              {images.map((image, index) => (
                <div
                  key={image.publicId}
                  className='relative rounded-lg border bg-muted/40 p-2'>
                  <Image
                    src={image.url}
                    alt={`${title} ${index + 1}`}
                    width={image.width ?? 800}
                    height={image.height ?? 600}
                    className='rounded w-full h-28 object-contain'
                    unoptimized
                  />
                  <button
                    type='button'
                    onClick={() => removeImage(image.publicId)}
                    disabled={isSaving}
                    className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors'>
                    <X className='w-4 h-4' />
                  </button>
                  <div className='mt-2 text-xs text-muted-foreground'>
                    {index === 0 ? "Cover" : `#${index + 1}`}
                  </div>
                  <div className='mt-1 flex gap-1'>
                    <Button
                      type='button'
                      size='sm'
                      variant='outline'
                      className='h-7 flex-1'
                      onClick={() => move(index, -1)}
                      disabled={index === 0 || isSaving}>
                      ←
                    </Button>
                    <Button
                      type='button'
                      size='sm'
                      variant='outline'
                      className='h-7 flex-1'
                      onClick={() => move(index, 1)}
                      disabled={index === images.length - 1 || isSaving}>
                      →
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className='flex items-center gap-4'>
            <label className='inline-flex'>
              <input
                type='file'
                accept='image/*'
                multiple
                onChange={handleFileSelect}
                className='hidden'
                disabled={isUploading || isSaving}
              />
              <span
                className='inline-flex items-center rounded-md border px-3 py-2 text-sm cursor-pointer hover:bg-accent'
                aria-disabled={isUploading || isSaving}>
                <ImagePlus className='w-4 h-4 mr-2' />
                Add Photos
              </span>
            </label>
            {isUploading && (
              <span className='text-sm'>
                Uploading {uploadingCount} photo
                {uploadingCount === 1 ? "" : "s"}...
              </span>
            )}
          </div>

          <div className='space-y-1'>
            <label className='text-sm text-muted-foreground'>Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className='space-y-1'>
            <label className='text-sm text-muted-foreground'>Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSaving}
              rows={4}
            />
          </div>

          <div className='space-y-1'>
            <label className='text-sm text-muted-foreground'>
              Category (optional)
            </label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isSaving}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => setOpen(false)}
            disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isUploading}>
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateGalleryPhoto;
