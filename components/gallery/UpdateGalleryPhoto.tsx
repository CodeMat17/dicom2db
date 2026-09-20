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
import { Id } from "@/convex/_generated/dataModel";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
  type UploadedImage,
} from "@/lib/cloudinary-upload";
import { useMutation } from "convex/react";
import { ImagePlus } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";

type Props = {
  id: Id<"gallery">;
  title: string;
  description: string;
  category?: string;
  photoUrl: string | null;
};

const UpdateGalleryPhoto = ({
  id,
  title: initialTitle,
  description: initialDescription,
  category: initialCategory,
  photoUrl,
}: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updatePhoto = useMutation(api.gallery.updatePhoto);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [category, setCategory] = useState(initialCategory ?? "");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<UploadedImage | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Reopening the dialog should show the stored values, not a stale edit.
  useEffect(() => {
    if (open) return;
    setTitle(initialTitle);
    setDescription(initialDescription);
    setCategory(initialCategory ?? "");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setUploaded(null);
    // `previewUrl` is cleaned up here, not tracked as a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialTitle, initialDescription, initialCategory]);

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

  const handleSave = async () => {
    if (!title.trim())
      return toast.error("Error!", { description: "Enter a title" });
    if (!description.trim())
      return toast.error("Error!", { description: "Enter a description" });

    setIsSaving(true);
    try {
      const { replacedPublicId } = await updatePhoto({
        id,
        title,
        description,
        category: category || undefined,
        // Omitted when unchanged, so the existing asset is kept.
        ...(uploaded
          ? {
              imageUrl: uploaded.imageUrl,
              imagePublicId: uploaded.imagePublicId,
              width: uploaded.width,
              height: uploaded.height,
            }
          : {}),
      });

      await deleteFromCloudinary(replacedPublicId);
      toast.success("Success!", { description: "Photo updated" });
      setOpen(false);
    } catch (error) {
      toast.error("Error!", {
        description:
          error instanceof Error ? error.message : "Failed to update photo",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const shown = previewUrl ?? photoUrl;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' className='w-full'>
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-lg max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Edit photo</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {shown && (
            <Image
              src={shown}
              alt={title}
              width={uploaded?.width ?? 800}
              height={uploaded?.height ?? 600}
              className='rounded-lg w-full h-auto max-h-72 object-contain'
              unoptimized
            />
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
              disabled={isUploading || isSaving}>
              <ImagePlus className='w-4 h-4 mr-2' />
              Replace Photo
            </Button>
            {isUploading && <span className='text-sm'>Uploading...</span>}
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
