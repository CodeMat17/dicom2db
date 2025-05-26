"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";

type Props = {
  id: Id<"achievements">;
  title: string;
};

const DeleteAchievement = ({ id, title }: Props) => {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const deleteAchievement = useMutation(api.achievements.deleteAchievement);

  const handleDelete = async () => {
    if (!id) return;

    setLoading(true);
    try {
      await deleteAchievement({ id });

      toast.success("Done!", {
        description: "Achievement deleted successfully",
      });
      router.push("/achievements");
    } catch (error) {
      toast.error("Deletion failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='destructive' className='w-full'>
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Are you sure you want to delete this story:
            <br /> <span className='text-blue-500'>{title}</span>?
          </DialogTitle>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Close</Button>
          </DialogClose>
          <Button onClick={handleDelete}>
            {loading ? "Deleting..." : "Yes, delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteAchievement;
