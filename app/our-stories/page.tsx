"use client";

import DeleteAchievement from "@/components/achievements/DeleteAchievement";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const AchievementsPage = () => {
  const achievements = useQuery(api.achievements.getAllAchievements);

  return (
    <div className="bg-purple-100 w-full  min-h-screen">
      <section className='py-12 px-4 max-w-6xl mx-auto'>
        <div className='flex flex-col sm:flex-row items-center justify-between gap-4 mb-10'>
          <h2 className='text-3xl font-bold text-[#213675] dark:text-blue-500'>
            Our Stories
          </h2>
          <Button asChild>
            <Link href='/our-stories/add-story'>Add Story</Link>
          </Button>
        </div>

        {achievements === undefined ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-5'>
            {[...Array(3)].map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.2 }}
                className='bg-card rounded-lg overflow-hidden shadow-lg'>
                <div className='animate-pulse bg-gray-200 dark:bg-slate-700 h-48 w-full' />
                <div className='p-6 space-y-3'>
                  <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4' />
                  <div className='h-3 bg-gray-200 dark:bg-slate-700 rounded w-full' />
                  <div className='h-3 bg-gray-200 dark:bg-slate-700 rounded w-2/3' />
                </div>
              </motion.div>
            ))}
          </div>
        ) : achievements.length === 0 ? (
          <p className='text-center italic text-muted-foreground py-8'>
            No achievements record found.
          </p>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-3'>
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                whileHover={{ y: -5 }}
                className='group bg-card dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow'>
                <h1 className='px-4 pt-4 font-medium line-clamp-2 leading-5'>
                  {achievement.title}
                </h1>
                <div className='flex items-center gap-3 px-4 py-3'>
                  <div className='relative w-32 aspect-video rounded-xl overflow-hidden shrink-0'>
                    {achievement.photoUrl && (
                      <Image
                        src={achievement.photoUrl}
                        alt={achievement.title || "Achievement image"}
                        fill
                        className='object-cover'
                        sizes='(max-width: 768px) 100vw, 50vw'
                      />
                    )}
                  </div>
                  <p className='line-clamp-3 text-sm leading-5'>{achievement.description}</p>
                </div>

                <div className='flex gap-4 justify-between'>
                  <DeleteAchievement
                    id={achievement._id}
                    title={achievement.title}
                  />
                  <Button asChild variant='outline' className='w-full'>
                    <Link href={`/our-stories/${achievement.slug}`}>
                      Update
                    </Link>
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AchievementsPage;
