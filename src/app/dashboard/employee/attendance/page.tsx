import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import AttendanceClient from "./AttendanceClient";

export default async function AttendancePage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Fetch all attendance logs for the employee
  const attendances = await db.attendance.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });

  return <AttendanceClient attendances={JSON.parse(JSON.stringify(attendances))} />;
}
