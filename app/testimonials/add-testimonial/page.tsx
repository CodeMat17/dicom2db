"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function AddTestimonialPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    role?: string;
    body?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  const addTestimonial = useMutation(api.testimonials.addTestimonial);

  const validate = () => {
    const errs: typeof errors = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!role.trim()) errs.role = "Role is required";
    if (!body.trim()) errs.body = "Testimonial body is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await addTestimonial({ name, role, body });
      toast.success("Testimonial added successfully!");
      setName("");
      setRole("");
      setBody("");
      setErrors({});
    } catch (err) {
      toast.error("Failed to add testimonial.");
      console.log("Error Msg: ", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-purple-100 p-4'>
      <Card className='relative w-full max-w-xl shadow-xl border-none'>
        <CardHeader>
          <CardTitle className='text-2xl font-semibold'>
            
            Add Testimonial
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-6'>
            <div>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='Your name'
              />
              {errors.name && (
                <p className='text-sm text-red-500 mt-1'>{errors.name}</p>
              )}
            </div>

            <div>
              <Input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder='Your role (e.g. Head, Operations)'
              />
              {errors.role && (
                <p className='text-sm text-red-500 mt-1'>{errors.role}</p>
              )}
            </div>

            <div>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder='What do you want to share?'
                rows={5}
              />
              {errors.body && (
                <p className='text-sm text-red-500 mt-1'>{errors.body}</p>
              )}
            </div>

            <Button
              type='submit'
              disabled={loading}
              className='w-full rounded-xl text-base font-medium'>
              {loading ? "Submitting..." : "Submit Testimonial"}
            </Button>
          </form>
              </CardContent>
              <Button onClick={() => router.back()} className="absolute right-5 top-5">Go Back</Button>
      </Card>
    </div>
  );
}
