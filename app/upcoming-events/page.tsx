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
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type EventFormData = {
  title: string;
  note: string;
};

const EventDialog = ({
  isOpen,
  onClose,
  initialData,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    id: Id<"events">;
    data: EventFormData;
  };
  onSubmit: (data: EventFormData, id?: Id<"events">) => void;
}) => {
  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    note: "",
  });

  // Reset form when dialog opens/closes or initialData changes
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData(initialData.data);
    } else if (!isOpen) {
      setFormData({ title: "", note: "" });
    }
  }, [isOpen, initialData]);

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
            {initialData ? "Edit Event" : "Add New Event"}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? "Update the event details"
              : "Add a new upcoming event"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <label htmlFor='title' className='text-sm font-medium'>
              Title
            </label>
            <Input
              id='title'
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder='Enter event title'
              required
            />
          </div>
          <div className='space-y-2'>
            <label htmlFor='note' className='text-sm font-medium'>
              Note
            </label>
            <Textarea
              id='note'
              value={formData.note}
              onChange={(e) =>
                setFormData({ ...formData, note: e.target.value })
              }
              placeholder='Enter event details'
              required
              rows={4}
            />
          </div>
          <div className='flex justify-end space-x-2'>
            <Button variant='outline' onClick={onClose} type='button'>
              Cancel
            </Button>
            <Button type='submit'>{initialData ? "Update" : "Create"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const UpcomingEvents = () => {
  const events = useQuery(api.events.getEvents);
  const create = useMutation(api.events.createEvent);
  const update = useMutation(api.events.updateEvent);
  const remove = useMutation(api.events.deleteEvent);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Doc<"events"> | null>(
    null
  );

  const handleCreate = async (data: EventFormData) => {
    try {
      await create(data);
      toast.success("Event created successfully");
    } catch (error) {
      console.error("Create failed:", error);
      toast.error("Failed to create event");
    }
  };

  const handleUpdate = async (data: EventFormData, id?: Id<"events">) => {
    if (!id) return;

    try {
      await update({
        id,
        ...data,
      });
      toast.success("Event updated successfully");
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Failed to update event");
    }
  };

  const handleDelete = async (id: Id<"events">) => {
    try {
      await remove({ id });
      toast.success("Event deleted successfully");
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete event");
    }
  };

  const handleSubmit = (data: EventFormData, id?: Id<"events">) => {
    if (id) {
      handleUpdate(data, id);
    } else {
      handleCreate(data);
    }
  };

  return (
    <div className='w-full max-w-5xl mx-auto py-12 px-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Upcoming Events</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className='mr-2' />
          Add Event
        </Button>
      </div>
      <Separator className='my-6' />

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {events?.map((event) => (
          <div
            key={event._id}
            className='rounded-lg border bg-card p-6 shadow-sm space-y-4 flex flex-col'>
            <div className='space-y-3 flex-1 mb-4'>
              <h3 className='font-semibold text-lg leading-5'>{event.title}</h3>
              <p className='text-sm text-muted-foreground bg-gray-50 p-2 rounded-md'>
                {event.note}
              </p>
            </div>
            <div className='flex items-center justify-center gap-2 mt-auto'>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => {
                  setSelectedEvent(event);
                  setIsDialogOpen(true);
                }}>
                <Pencil className='h-4 w-4' />
              </Button>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => handleDelete(event._id)}>
                <Trash2 className='h-4 w-4' />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <EventDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedEvent(null);
        }}
        initialData={
          selectedEvent
            ? {
                id: selectedEvent._id,
                data: {
                  title: selectedEvent.title || "",
                  note: selectedEvent.note || "",
                },
              }
            : undefined
        }
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default UpcomingEvents;
