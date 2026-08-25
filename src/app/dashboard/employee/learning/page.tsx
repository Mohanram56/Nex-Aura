import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import LearningClient from "./LearningClient";
import { redirect } from "next/navigation";

export default async function LearningPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect("/login");

  const courses = await db.course.findMany();
  const enrollments = await db.courseEnrollment.findMany({
    where: { userId: session.user.id },
    include: { course: true }
  });

  return <LearningClient courses={JSON.parse(JSON.stringify(courses))} enrollments={JSON.parse(JSON.stringify(enrollments))} />;
}