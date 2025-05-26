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
import clsx from "clsx";
import { useMutation } from "convex/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

type Props = {
  id: Id<"heroSlides">;
  heroImgUrl: string | null;
  heroTitle: string;
  heroSubtitle: string;
};

const UpdateHeroData = ({ id, heroImgUrl, heroTitle, heroSubtitle }: Props) => {
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const updateHeroSlide = useMutation(api.heroSlides.updateHeroSlide);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");

  const [isUpdating, setIsUpdating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);

  useEffect(() => {
    if (isDialogOpen) {
      setTitle(heroTitle)
      setSubtitle(heroSubtitle)
      setPreviewUrl(null);
      setSelectedImage(null);
}
  }, [isDialogOpen, heroTitle, heroSubtitle])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpdate = async () => {
    if ( !title.trim() || !subtitle.trim()) {
      toast.error("All fields are required");
      return;
    }

    setIsUpdating(true);
    try {
      let newStorageId: Id<"_storage"> | undefined;

      if (selectedImage) {
         const uploadUrl = await generateUploadUrl();
      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": selectedImage.type,
        },
        body: selectedImage,
      });
        
      if (!uploadRes.ok) throw new Error("Image upload failed");
 
      const { storageId } = await uploadRes.json();
      newStorageId = storageId;

      }
     



      await updateHeroSlide({
        id,
        title: title.trim(),
        subtitle: subtitle.trim(),
        ...(newStorageId && { img: newStorageId }),
      });

      toast.success("Done!", { description: "Hero updated successfully." });
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Failed!", { description: "Could not update hero slide." });
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const imageToShow = previewUrl || heroImgUrl;

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' className='w-full'>
          Update
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-sm'>
        <DialogHeader>
          <DialogTitle>Edit Carousel Slide</DialogTitle>
        </DialogHeader>

        {imageToShow && (
          <div
            className={clsx(
              "relative w-full h-[130px] aspect-video rounded-xl overflow-hidden",
              isImageLoading && "bg-muted animate-pulse"
            )}>
            <Image
              alt='Hero image preview'
              src={imageToShow}
              fill
              className='object-cover'
              onLoad={() => setIsImageLoading(false)}
            />
          </div>
        )}

        <div className='space-y-1'>
          <div>
            <label className='text-sm text-muted-foreground'>
              Change Image
            </label>
            <Input type='file' accept='image/*' onChange={handleFileChange} />
          </div>
          <div>
            <label className='text-sm text-muted-foreground'>Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className='text-sm text-muted-foreground'>Subtitle</label>
            <Textarea
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            className='w-full'
            onClick={handleUpdate}
            disabled={isUpdating}>
            {isUpdating ? "Updating..." : "Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateHeroData;
