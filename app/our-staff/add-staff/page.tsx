"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function AddStaff() {
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const addStaff = useMutation(api.teamMembers.addStaff);
  const router = useRouter();

  useEffect(() => {
    if (image) {
      const url = URL.createObjectURL(image);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImagePreview(null);
    }
  }, [image]);

  const uploadImage = async (file: File) => {
    const res = await fetch("/api/storage/upload-url", {
      method: "POST",
    });

    const { uploadUrl } = await res.json();

    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      body: file,
    });

    const { storageId } = await uploadRes.json();
    return storageId;
  };

  const handleSubmit = async () => {
    if (!name || !position || !profile || !image) {
      toast.error("All fields are required");
      return;
    }

    if (image.size > 512000) {
      toast.error("Image must be smaller than 500KB");
      return;
    }

    setLoading(true);
    try {
      const imageId = await uploadImage(image);

      await addStaff({
        name,
        position,
        email,
        profile,
        image: imageId,
      });

      toast.success("Staff member added");
      setName("");
      setPosition("");
      setEmail("");
      setProfile("");
      setImage(null);
      router.push("/our-staff");
    } catch (err) {
        toast.error("Failed to add staff member");
        console.log('Error Msg :', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='max-w-lg mx-auto px-4 py-12 space-y-6'>
      <div className='flex flex-col sm:flex-row gap-3 items-center sm: justify-between'>
        <h1 className='text-2xl font-semibold'>Add New Staff Member</h1>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>

      <div className='space-y-2'>
        <div>
          <label className='text-sm text-muted-foreground'>Name</label>
          <Input
            id='name'
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className='text-sm text-muted-foreground'>Position</label>
          <Input
            id='position'
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          />
        </div>
{/* {role === 'director'} */}
        <div>
          <label className='text-sm text-muted-foreground'>Email (optional)</label>
          <Input
            type='email'
            id='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className='text-sm text-muted-foreground'>Profile</label>
          <Textarea
            id='profile'
            rows={3}
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
          />
        </div>

        <div>
          <label className='text-sm text-muted-foreground'>
            Profile Image (max 500KB)
          </label>
          <Input
            type='file'
            accept='image/*'
            onChange={(e) => setImage(e.target.files?.[0] || null)}
          />
          {imagePreview && (
            <div className='mt-2 w-32 h-32 relative rounded-lg border overflow-hidden'>
              <Image
                src={imagePreview}
                alt='Preview'
                layout='fill'
                objectFit='cover'
              />
            </div>
          )}
        </div>

        <Button className='w-full' onClick={handleSubmit} disabled={loading}>
          {loading ? "Adding..." : "Add Staff"}
        </Button>
      </div>
    </div>
  );
}
