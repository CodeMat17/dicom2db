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
import { useMutation } from "convex/react";
import { PenBox } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Props = {
  id: Id<"testimonials">;
  t_name: string;
  t_role: string;
  t_body: string;
};

export function UpdateTestimonialDialog({ id, t_name, t_role, t_body }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(t_name);
  const [role, setRole] = useState(t_role);
  const [body, setBody] = useState(t_body);
  const [loading, setLoading] = useState(false);

  const updateTestimonial = useMutation(api.testimonials.updateTestimonial);

  useEffect(() => {
    if (open) {
      setName(t_name);
      setRole(t_role);
      setBody(t_body);
    }
  }, [open, t_name, t_role, t_body]);

  const handleUpdate = async () => {
    if (!name.trim() || !role.trim() || !body.trim()) {
      toast.error("All fields are required");
      return;
    }

    setLoading(true);
    try {
      await updateTestimonial({ id, name, role, body });
      toast.success("Testimonial updated");
      setOpen(false);
    } catch (err) {
      toast.error("Failed to update testimonial");
      console.log("Error Msg: ", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size='icon' variant={"outline"}>
          <PenBox />
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>Edit Testimonial</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Name'
          />
          <Input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder='Role'
          />
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder='Testimonial'
          />

          <Button onClick={handleUpdate} disabled={loading} className='w-full'>
            {loading ? "Updating..." : "Update Testimonial"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
