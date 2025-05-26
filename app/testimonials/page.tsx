"use client";

import DeleteTestimonial from "@/components/testimonials/DeleteTestimonial";
import { UpdateTestimonialDialog } from "@/components/testimonials/UpdateTestimonial";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import Link from "next/link";

export default function TestimonialsPage() {
  const testimonials = useQuery(api.testimonials.getTestimonials);

  return (
    <div className='min-h-screen bg-purple-50 dark:bg-slate-950'>
      {/* Hero Section */}
      <section className='pt-20 pb-6 px-4 max-w-4xl mx-auto text-center'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}>
          <div className='inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6'>
            <Quote className='w-8 h-8 text-primary' />
          </div>
          <div className='flex flex-col sm:flex-row items-center sm:justify-between'>
            <h1 className='text-4xl md:text-5xl font-bold mb-3'>
              Testimonials
            </h1>
            <Button asChild>
              <Link href='/testimonials/add-testimonial'>Add Testimonial</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Testimonial Grid */}
      <section className='py-12 px-4 max-w-5xl mx-auto'>
        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {testimonials === undefined ? (
            <div className='italic text-center animate-pulse'>
              Testimonials loading...
            </div>
          ) : testimonials.length === 0 ? (
            <div className='italic text-center animate-pulse'>
              No testimonials found.
            </div>
          ) : (
            testimonials?.map((testimonial) => (
              <motion.div
                key={testimonial._id}
                whileHover={{ y: -5 }}
                className='relative bg-white dark:bg-gray-700 p-8 rounded-xl shadow-md flex flex-col h-full'>
                <Quote className='w-8 h-8 text-primary/70 mb-4' />
                <p className='line-clamp-5 mb-6 flex-1'>&quot;{testimonial.body}&quot;</p>

                <div className='mt-auto'>
                  <h3 className='font-bold'>{testimonial.name}</h3>
                  <p className='text-sm text-muted-foreground'>
                    {testimonial.role}
                  </p>
                </div>
                <div className='absolute right-8 top-8 space-x-3'>
                  <DeleteTestimonial
                    id={testimonial._id}
                    name={testimonial.name}
                  />
                  <UpdateTestimonialDialog
                    id={testimonial._id}
                    t_name={testimonial.name}
                    t_role={testimonial.role}
                    t_body={testimonial.body}
                  />
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
