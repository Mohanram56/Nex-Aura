"use server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function enrollCourse(courseId: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");

  const enrollment = await db.courseEnrollment.create({
    data: {
      userId: session.user.id,
      courseId,
      progress: 0,
      status: "ENROLLED"
    }
  });

  revalidatePath("/dashboard/employee/learning");
  return enrollment;
}

export async function updateProgress(enrollmentId: string, progress: number) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");

  const data: any = { progress };
  if (progress >= 100) {
    data.progress = 100;
    data.status = "COMPLETED";
    data.completedAt = new Date();
  }

  const enrollment = await db.courseEnrollment.update({
    where: { id: enrollmentId, userId: session.user.id },
    data,
    include: { course: true }
  });

  if (progress >= 100) {
    await db.notification.create({
      data: {
        userId: session.user.id,
        message: `Congratulations! You completed the course: ${enrollment.course.title}`
      }
    });
  }

  revalidatePath("/dashboard/employee/learning");
  return enrollment;
}