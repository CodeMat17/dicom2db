"use client";

import { Button } from "@/components/ui/button";
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
import { TrashIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  id: Id<"teamMembers">;
  name: string;
};

export default function DeleteStaff({ id, name }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const deleteStaff = useMutation(api.teamMembers.deleteStaff);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteStaff({ id });
      toast.success("Staff member deleted");
      setOpen(false);
    } catch (err) {
      toast.error("Failed to delete staff member");
      console.error("Delete Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size='icon' variant='destructive'>
          <TrashIcon className='w-4 h-4' />
        </Button>
      </DialogTrigger>

      <DialogContent className='max-w-sm'>
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
        </DialogHeader>

        <p>
          Are you sure you want to delete this staff member:{" "}
          <span className='font-medium'>{name}</span>? This action cannot be
          undone.
        </p>

        <DialogFooter className='flex justify-end gap-2'>
          <Button
            variant='ghost'
            onClick={() => setOpen(false)}
            disabled={loading}>
            Cancel
          </Button>
          <Button
            variant='destructive'
            onClick={handleDelete}
            disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
