"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

export default function AddCarousel() {
  const router = useRouter();
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const createSlide = useMutation(api.heroSlides.addHeroSlide);

  const imageInput = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!selectedImage || !title.trim() || !subtitle.trim()) {
      toast.error("All fields are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const uploadUrl = await generateUploadUrl();

      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": selectedImage.type,
        },
        body: selectedImage,
      });

      if (!res.ok) throw new Error("Image upload failed");

      const { storageId } = await res.json();

      await createSlide({
        title: title.trim(),
        subtitle: subtitle.trim(),
        img: storageId,
      });

      toast.success("Carousel slide added successfully");
      router.back();
    } catch (err) {
      console.error("Add slide error:", err);
      toast.error("Failed to add carousel slide");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='max-w-lg mx-auto px-4 py-12'>
      <h2 className='text-2xl font-bold mb-6'>Add Carousel Slide</h2>

      <div className='space-y-5'>
        {/* Image input */}
        <div>
          <label className='text-sm text-muted-foreground block mb-1'>
            Image
          </label>
          <Input
            type='file'
            accept='image/*'
            onChange={handleFileChange}
            ref={imageInput}
            disabled={isSubmitting}
          />
          {previewUrl && (
            <div className='relative w-full aspect-video mt-3 rounded overflow-hidden'>
              <Image
                src={previewUrl}
                alt='Preview'
                fill
                className='object-cover'
                unoptimized
              />
            </div>
          )}
        </div>

        {/* Title input */}
        <div>
          <label className='text-sm text-muted-foreground block mb-1'>
            Title
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='Enter carousel title'
            disabled={isSubmitting}
          />
        </div>

        {/* Subtitle input */}
        <div>
          <label className='text-sm text-muted-foreground block mb-1'>
            Subtitle
          </label>
          <Textarea
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder='Enter subtitle/description'
            disabled={isSubmitting}
          />
        </div>

        {/* Submit button */}
        <Button
          onClick={handleSubmit}
          className='w-full'
          disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className='w-4 h-4 animate-spin mr-2' />
              Uploading...
            </>
          ) : (
            "Submit"
          )}
        </Button>
      </div>
    </div>
  );
}
