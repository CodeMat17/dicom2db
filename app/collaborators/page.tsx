"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Collaborator = Doc<"collaborators"> & {
  imgUrl: string | null;
};

type CollaboratorFormData = {
  name: string;
  office: string;
  logo?: Id<"_storage">;
};

const CollaboratorDialog = ({
  isOpen,
  onClose,
  initialData,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    id: Id<"collaborators">;
    data: CollaboratorFormData;
    currentImageUrl?: string | null;
  };
  onSubmit: (data: CollaboratorFormData, id?: Id<"collaborators">) => void;
}) => {
  const [formData, setFormData] = useState<CollaboratorFormData>({
    name: "",
    office: "",
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  // Reset form when dialog opens/closes or initialData changes
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData(initialData.data);
      setPreviewUrl(initialData.currentImageUrl || null);
    } else if (!isOpen) {
      setFormData({ name: "", office: "" });
      setPreviewUrl(null);
    }
  }, [isOpen, initialData]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

      setFormData((prev) => ({ ...prev, logo: storageId }));
    } catch (error) {
      toast.error("Upload failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
      setPreviewUrl(initialData?.currentImageUrl || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData, initialData?.id);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Collaborator" : "Add New Collaborator"}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? "Update the collaborator's information"
              : "Add a new collaborator to your dashboard"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <label htmlFor='name' className='text-sm font-medium'>
              Name
            </label>
            <Input
              id='name'
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder='Enter collaborator name'
              required
            />
          </div>
          <div className='space-y-2'>
            <label htmlFor='office' className='text-sm font-medium'>
              Office
            </label>
            <Input
              id='office'
              value={formData.office}
              onChange={(e) =>
                setFormData({ ...formData, office: e.target.value })
              }
              placeholder='Enter office location'
              required
            />
          </div>
          <div className='space-y-2'>
            <label htmlFor='logo' className='text-sm font-medium'>
              Logo
            </label>
            <Input
              id='logo'
              type='file'
              accept='image/*'
              onChange={handleFileChange}
              disabled={isUploading}
            />
            {previewUrl && (
              <div className='relative h-32 w-32'>
                <Image
                  src={previewUrl}
                  alt='Preview'
                  fill
                  className='rounded-md object-cover'
                />
              </div>
            )}
          </div>
          <div className='flex justify-end space-x-2'>
            <Button variant='outline' onClick={onClose} type='button'>
              Cancel
            </Button>
            <Button type='submit' disabled={isUploading}>
              {initialData ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const Collaborators = () => {
  const collaborators = useQuery(api.collaborators.getCollaborators) as
    | Collaborator[]
    | undefined;
  const create = useMutation(api.collaborators.createCollaborator);
  const update = useMutation(api.collaborators.updateCollaborator);
  const remove = useMutation(api.collaborators.deleteCollaborator);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCollaborator, setSelectedCollaborator] =
    useState<Collaborator | null>(null);

  const handleCreate = async (data: CollaboratorFormData) => {
    if (!data.logo) {
      toast.error("Please upload a logo");
      return;
    }

    try {
      await create({
        name: data.name,
        office: data.office,
        logo: data.logo,
      });
      toast.success("Collaborator created successfully");
    } catch {
      toast.error("Failed to create collaborator");
    }
  };

  const handleUpdate = async (
    data: CollaboratorFormData,
    id?: Id<"collaborators">
  ) => {
    if (!id) return;

    try {
      const updateData: {
        id: Id<"collaborators">;
        name: string;
        office: string;
        logo?: Id<"_storage">;
      } = {
        id,
        name: data.name,
        office: data.office,
      };

      if (data.logo) {
        updateData.logo = data.logo;
      }

      await update(updateData);
      toast.success("Collaborator updated successfully");
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Failed to update collaborator");
    }
  };

  const handleDelete = async (id: Id<"collaborators">) => {
    try {
      await remove({ id });
      toast.success("Collaborator deleted successfully");
    } catch {
      toast.error("Failed to delete collaborator");
    }
  };

  const handleSubmit = (
    data: CollaboratorFormData,
    id?: Id<"collaborators">
  ) => {
    if (id) {
      handleUpdate(data, id);
    } else {
      handleCreate(data);
    }
  };

  return (
    <div className='w-full max-w-5xl mx-auto py-12 px-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Collaborators</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className='mr-2' />
          Add Collaborator
        </Button>
      </div>
      <Separator className='my-6' />

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {collaborators?.map((collaborator) => (
          <div
            key={collaborator._id}
            className='rounded-lg border bg-card p-6 shadow-sm'>
            <div className=''>
              <div>
                <h3 className='font-semibold'>{collaborator.name}</h3>
                <p className='text-sm text-muted-foreground'>
                  {collaborator.office}
                </p>
              </div>
            </div>

            <div className='flex items-center justify-center gap-5'>
              {collaborator.imgUrl && (
                <div className='relative mt-4 h-32 w-32 aspect-square'>
                  <Image
                    src={collaborator.imgUrl}
                    alt={collaborator.name}
                    fill
                    className='rounded-md object-cover'
                  />
                </div>
              )}
              <div className='flex flex-col border rounded-lg gap-4'>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => {
                    setSelectedCollaborator(collaborator);
                    setIsDialogOpen(true);
                  }}>
                  <Pencil className='h-4 w-4' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => handleDelete(collaborator._id)}>
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <CollaboratorDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedCollaborator(null);
        }}
        initialData={
          selectedCollaborator
            ? {
                id: selectedCollaborator._id,
                data: {
                  name: selectedCollaborator.name,
                  office: selectedCollaborator.office,
                  logo: selectedCollaborator.logo,
                },
                currentImageUrl: selectedCollaborator.imgUrl,
              }
            : undefined
        }
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default Collaborators;
