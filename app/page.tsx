"use client";

import DeleteHeroData from "@/components/hero/DeleteHeroData";
import UpdateHeroData from "@/components/hero/UpdateHeroData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import Image from "next/image";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";

type SlideWithUrl = {
  _id: Id<"heroSlides">;
  title: string;
  subtitle: string;
  alt: string;
  img: Id<"_storage">;
  imgUrl?: string | null;
};

export default function Home() {
  const heroData = useQuery(api.heroSlides.getHeroSlides);

  return (
    <div className='w-full max-w-5xl mx-auto min-h-screen px-4 py-12'>
      <div className='flex flex-col gap-4 sm:flex-row items-center justify-between mb-8'>
        <h1 className='text-3xl font-bold'>Manage Carousel</h1>
        <Button asChild>
          <Link href='/add-carousel'>Add Carousel</Link>
        </Button>
      </div>

      <div className='w-full'>
        {heroData === undefined ? (
          <div className='py-20 pl-6 italic animate-pulse'>
            Carousel data loading...
          </div>
        ) : heroData.length === 0 ? (
          <div className='py-20 pl-6 italic animate-pulse'>
            No carousel data found
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
            {heroData.map((hero: SlideWithUrl) => (
              <Card key={hero._id} className='overflow-hidden'>
                {hero.imgUrl ? (
                  <div className='relative aspect-video w-full mb-2 overflow-hidden'>
                    <Image
                      key={hero.imgUrl}
                      src={hero.imgUrl}
                      alt={hero.alt || "Hero image"}
                      fill
                      className='object-cover'
                    />
                  </div>
                ) : (
                  <div className='text-center italic animate-pulse py-6'>
                    Loading hero image...
                  </div>
                )}
                <CardContent>
                  <div className='w-full space-y-2'>
                    <div>
                      <label className='text-sm text-muted-foreground'>
                        Title
                      </label>
                      <p>{hero.title}</p>
                    </div>
                    <div>
                      <label className='text-sm text-muted-foreground'>
                        Subtitle
                      </label>
                      <p>{hero.subtitle}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className='space-x-6'>
                  <DeleteHeroData id={hero._id} imgUrl={hero.imgUrl ?? null} />
                  <UpdateHeroData
                    id={hero._id}
                    heroImgUrl={hero.imgUrl ?? null}
                    heroTitle={hero.title}
                    heroSubtitle={hero.subtitle}
                  />
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
