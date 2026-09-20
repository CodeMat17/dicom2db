"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
} from "@/lib/cloudinary-upload";
import { useMutation } from "convex/react";
import { PenIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Props = {
  id: Id<"teamMembers">;
  staff_name: string;
  staff_position: string;
  staff_email?: string;
  staff_profile?: string;
  staff_imageUrl: string | null;
  staff_role: string;
};

export default function UpdateStaff({
  id,
  staff_name,
  staff_position,
  staff_email,
  staff_profile,
  staff_imageUrl,
  staff_role,
}: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(staff_name);
  const [position, setPosition] = useState(staff_position);
  const [email, setEmail] = useState(staff_email || "");
  const [profile, setProfile] = useState(staff_profile || "");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    staff_imageUrl
  );
  const [loading, setLoading] = useState(false);
  const updateStaff = useMutation(api.teamMembers.updateStaff);

  useEffect(() => {
    if (image) {
      const url = URL.createObjectURL(image);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [image]);

  const handleUpdate = async () => {
    if (!name || !position || !profile) {
      toast.error("All fields  are required");
      return;
    }

    setLoading(true);
    try {
      const uploaded = image
        ? await uploadToCloudinary(image, "staff")
        : null;

      const { replacedPublicId } = await updateStaff({
        id,
        name,
        position,
        profile,
        email,
        ...(uploaded && {
          imageUrl: uploaded.imageUrl,
          imagePublicId: uploaded.imagePublicId,
        }),
      });

      await deleteFromCloudinary(replacedPublicId);

      toast.success("Staff member updated");
      setOpen(false);
    } catch (err) {
      console.error("Update Error:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update staff member"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size='icon' variant='outline'>
          <PenIcon className='w-4 h-4' />
        </Button>
      </DialogTrigger>

      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>Update Staff Member</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Name'
          />
          <Input
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder='Position'
          />
          {staff_role === "director" && (
            <Input
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='Email'
            />
          )}
          <Textarea
            rows={3}
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
            placeholder='Profile'
          />

          <div>
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
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>
            )}
          </div>

          <Button onClick={handleUpdate} disabled={loading} className='w-full'>
            {loading ? "Updating..." : "Update Staff"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
