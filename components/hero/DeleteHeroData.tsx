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
import { useMutation } from "convex/react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";

type Props = {
  id: Id<"heroSlides">;
  imgUrl: string | null;
};

const DeleteHeroData = ({ id, imgUrl }: Props) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteHeroSlide = useMutation(api.heroSlides.deleteHeroSlide);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteHeroSlide({ id });
      toast.success("Success!", { description: "Deleted successfully." });
    } catch (error) {
      toast.error("Failed!", { description: "Failed to delete hero slide." });
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const isValidImage = imgUrl && imgUrl.startsWith("http");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='destructive' className='w-full'>
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-sm'>
        <DialogHeader>
          <DialogTitle>Are you sure you want to delete this?</DialogTitle>
        </DialogHeader>
        {isValidImage && (
          <div className='flex items-center justify-center mb-4'>
            <Image
              alt='Hero preview'
              src={imgUrl!}
              width={400}
              height={300}
              className='rounded-xl object-cover'
              unoptimized
            />
          </div>
        )}
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

export default DeleteHeroData;
