"use client";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { Lightbulb, Rocket, Shield, Trophy } from "lucide-react";

export default function AboutUs() {
  const statements = useQuery(api.statements.getStatements);

  const mission = statements?.find((s) => s.type === "mission");
  const vision = statements?.find((s) => s.type === "vision");
  const coreValues = statements?.find((s) => s.type === "core-values");

  return (
    <div className='min-h-screen bg-purple-50 dark:bg-slate-700'>
      {/* Hero Section */}
      <section className='relative pt-20 px-4 max-w-6xl mx-auto'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 to-transparent opacity-20' />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className='relative z-10 text-center'>
          <h1 className='text-4xl md:text-5xl font-bold mb-6 text-[#213675] dark:text-blue-500'>
           Manage About Dicom
          </h1>
         
          
        </motion.div>
      </section>

      {/* Mission, Vision, Values */}
      {statements === undefined ? (
        <div className='text-center py-20 italic'>Statements loading...</div>
      ) : statements.length === 0 ? (
        <div className='text-center py-20 italic'>No statements found.</div>
      ) : (
        <section className='py-16 px-4 max-w-6xl mx-auto'>
          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {/* Mission */}
            {mission && (
              <motion.div
                whileHover={{ y: -5 }}
                className='bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg'>
                <div className='flex items-center gap-3 mb-4'>
                  <Rocket className='w-8 h-8 text-primary' />
                  <h2 className='text-2xl font-bold text-[#213675] dark:text-blue-500'>
                    {mission.title}
                  </h2>
                </div>
                <p className='text-muted-foreground'>{mission.content}</p>
              </motion.div>
            )}

            {/* Vision */}
            {vision && (
              <motion.div
                whileHover={{ y: -5 }}
                className='bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg'>
                <div className='flex items-center gap-3 mb-4'>
                  <Trophy className='w-8 h-8 text-primary' />
                  <h2 className='text-2xl font-bold text-[#213675] dark:text-blue-500'>
                    {vision.title}
                  </h2>
                </div>
                <p className='text-muted-foreground'>{vision.content}</p>
              </motion.div>
            )}

            {/* Core Values */}
            {coreValues && (
              <motion.div
                whileHover={{ y: -5 }}
                className='bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg'>
                <div className='flex items-center gap-3 mb-4'>
                  <Lightbulb className='w-8 h-8 text-primary' />
                  <h2 className='text-2xl font-bold text-[#213675] dark:text-blue-500'>
                    {coreValues.title}
                  </h2>
                </div>
                <ul className='space-y-3 text-muted-foreground'>
                  {coreValues.values?.map((value, i) => (
                    <li key={i} className='flex items-center gap-2'>
                      <Shield className='w-4 h-4 text-primary' />
                      {value}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>
        </section>
      )}

  
    </div>
  );
}
