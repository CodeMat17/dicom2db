"use client";

import DeleteGalleryPhoto from "@/components/gallery/DeleteGalleryPhoto";
import UpdateGalleryPhoto from "@/components/gallery/UpdateGalleryPhoto";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import dayjs from "dayjs";
import Image from "next/image";
import Link from "next/link";

/** Label the shape so an editor can see at a glance how it will be shown. */
const orientationOf = (width?: number, height?: number) => {
  if (!width || !height) return "Unknown";
  if (width === height) return "Square";
  return width > height ? "Landscape" : "Portrait";
};

export default function GalleryDashboard() {
  const photos = useQuery(api.gallery.getAllPhotos);

  return (
    <div className='w-full max-w-5xl mx-auto min-h-screen px-4 py-12'>
      <div className='flex flex-col gap-4 sm:flex-row items-center justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold'>Manage Gallery</h1>
          <p className='text-sm text-muted-foreground mt-1'>
            Photos publish to the site in their own orientation, newest first.
          </p>
        </div>
        <Button asChild>
          <Link href='/gallery/add-photo'>Add Photo</Link>
        </Button>
      </div>

      {photos === undefined ? (
        <div className='py-20 pl-6 italic animate-pulse'>
          Gallery data loading...
        </div>
      ) : photos.length === 0 ? (
        <div className='py-20 pl-6 italic'>No gallery photos found</div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
          {photos.map((photo) => (
            <Card key={photo._id} className='overflow-hidden flex flex-col'>
              {photo.photoUrl ? (
                <div className='relative w-full bg-muted'>
                  {/* Contained, not cropped, so the listing shows the real
                      shape of the file that was uploaded. */}
                  <Image
                    src={photo.photoUrl}
                    alt={photo.title}
                    width={photo.width ?? 800}
                    height={photo.height ?? 600}
                    className='w-full h-56 object-contain'
                    unoptimized
                  />
                </div>
              ) : (
                <div className='text-center italic animate-pulse py-6'>
                  Loading photo...
                </div>
              )}

              <CardContent className='flex-1 pt-4'>
                <div className='w-full space-y-2'>
                  <div>
                    <label className='text-sm text-muted-foreground'>
                      Title
                    </label>
                    <p className='font-medium'>{photo.title}</p>
                  </div>
                  <div>
                    <label className='text-sm text-muted-foreground'>
                      Description
                    </label>
                    <p className='text-sm line-clamp-3'>{photo.description}</p>
                  </div>
                  <div className='flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground'>
                    <span>
                      Published{" "}
                      {dayjs(photo.publishedAt).format("MMM DD, YYYY")}
                    </span>
                    <span>{orientationOf(photo.width, photo.height)}</span>
                    {photo.category && <span>{photo.category}</span>}
                  </div>
                </div>
              </CardContent>

              <CardFooter className='gap-3'>
                <DeleteGalleryPhoto
                  id={photo._id}
                  title={photo.title}
                  photoUrl={photo.photoUrl}
                />
                <UpdateGalleryPhoto
                  id={photo._id}
                  title={photo.title}
                  description={photo.description}
                  category={photo.category}
                  photoUrl={photo.photoUrl}
                />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
