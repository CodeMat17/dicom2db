"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { deleteManyFromCloudinary } from "@/lib/cloudinary-upload";
import { useMutation } from "convex/react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";

type Props = {
  id: Id<"gallery">;
  title: string;
  photoUrl: string | null;
  /** Shown next to the cover so the count being removed is obvious. */
  imageCount: number;
};

const DeleteGalleryPhoto = ({ id, title, photoUrl, imageCount }: Props) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  const deletePhoto = useMutation(api.gallery.deletePhoto);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { deletedPublicIds } = await deletePhoto({ id });
      await deleteManyFromCloudinary(deletedPublicIds);
      toast.success("Success!", { description: "Post deleted." });
      setOpen(false);
    } catch (error) {
      toast.error("Failed!", { description: "Could not delete the photo." });
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const isValidImage = photoUrl && photoUrl.startsWith("http");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='destructive' className='w-full'>
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-sm'>
        <DialogHeader>
          <DialogTitle>Delete “{title}”?</DialogTitle>
        </DialogHeader>
        {isValidImage && (
          <div className='flex items-center justify-center mb-4'>
            <Image
              alt={title}
              src={photoUrl}
              width={400}
              height={400}
              className='rounded-xl w-full h-auto max-h-64 object-contain'
              unoptimized
            />
          </div>
        )}
        <p className='text-sm text-muted-foreground'>
          This removes the post and its {imageCount} photo
          {imageCount === 1 ? "" : "s"}. It cannot be undone.
        </p>
        <DialogFooter>
          <Button
            className='w-full'
            variant='destructive'
            onClick={handleDelete}
            disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteGalleryPhoto;
