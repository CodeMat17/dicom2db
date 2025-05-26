"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function EditAchievements() {
  const stats = useQuery(api.achievementsStat.getAchievementsStats);
  const update = useMutation(api.achievementsStat.updateAchievementsStats);

  const [form, setForm] = useState({
    nationalChampions: 0,
    internationalRecognition: 0,
    studentWinners: 0,
    universityAwards: 0,
  });

  const [loadingField, setLoadingField] = useState<null | keyof typeof form>(
    null
  );

  // Initialize form values once stats are fetched
  useEffect(() => {
    if (stats) {
      setForm({
        nationalChampions: stats.nationalChampions,
        internationalRecognition: stats.internationalRecognition,
        studentWinners: stats.studentWinners,
        universityAwards: stats.universityAwards,
      });
    }
  }, [stats]);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: parseInt(value || "0"),
    }));
  };

  const handleUpdate = async (field: keyof typeof form) => {
    if (!stats?._id) return;

    setLoadingField(field);
    try {
      await update({ id: stats._id, [field]: form[field] });
      toast.success(`${field.replace(/([A-Z])/g, " $1")} updated`);
    } catch (err) {
      toast.error("Update failed", { description: String(err) });
    } finally {
      setLoadingField(null);
    }
  };

  return (
    <div className='flex flex-col py-8 space-y-6 max-w-md mx-auto items-center'>
      <h1 className='text-4xl font-bold text-center mb-4'>
        Manage Achievements Statistics
      </h1>

      {!stats ? (
        <div className='text-muted-foreground py-8 animate-pulse'>
          Loading stats...
        </div>
      ) : (
        <>
          {(
            [
              ["nationalChampions", "National Champions"],
              ["internationalRecognition", "International Recognition"],
              ["studentWinners", "Student Winners"],
              ["universityAwards", "University Awards"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className='flex flex-col gap-2'>
              <label className='text-sm text-muted-foreground'>{label}</label>
              <div className='flex items-center gap-2'>
                <Input
                  type='number'
                  value={form[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className='w-32'
                />
                <Button
                  onClick={() => handleUpdate(key)}
                  disabled={loadingField === key}>
                  {loadingField === key ? "Updating..." : "Update"}
                </Button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
