"use server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function submitAppraisal(userId: string, quarter: string, year: number, rating: number, feedback: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");

  const appraisal = await db.appraisal.create({
    data: {
      userId,
      managerId: session.user.id,
      quarter,
      year,
      rating,
      feedback,
    }
  });

  await db.notification.create({
    data: {
      userId,
      message: `Your performance appraisal for ${quarter} ${year} has been published.`,
    }
  });

  revalidatePath("/dashboard/manager/appraisals");
  revalidatePath("/dashboard/employee");
  return appraisal;
}