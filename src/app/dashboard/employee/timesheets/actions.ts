"use server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function logHours(dateStr: string, hours: number, projectId: string, description: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");

  const timesheet = await db.timesheet.create({
    data: {
      userId: session.user.id,
      date: new Date(dateStr),
      hours,
      projectId: projectId || null,
      description,
    }
  });

  revalidatePath("/dashboard/employee/timesheets");
  return timesheet;
}