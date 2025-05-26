'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { Trash } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { DialogClose } from "@radix-ui/react-dialog";
  

const DeleteTestimonial = ({id, name}: {id: Id<'testimonials'>, name: string}) => {

    const deleteTestimonial = useMutation(api.testimonials.deleteTestimonial);

    const [open, setOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
    
   if (!id) return

        setIsDeleting(true)
      try {
        await deleteTestimonial({ id });
          toast.success("Testimonial deleted.");
          setOpen(false)
      } catch (err) {
          toast.error("Failed to delete testimonial.");
          console.log('Error Msg: ', err);
      } finally {
          setIsDeleting(false)
      }
    };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size='icon' variant={"destructive"}>
          <Trash />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
                  <DialogDescription>Are you sure you want to delete the voice of <span className="font-medium">{ name}</span>?</DialogDescription>
       
              </DialogHeader>
              <DialogFooter>
                  <DialogClose asChild>
                      <Button>Close</Button> 
                  </DialogClose>
                  <Button onClick={handleDelete} variant={'destructive'}>
                      {isDeleting ? 'Deleting...' : 'Yes, delete'}</Button>
              </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DeleteTestimonial