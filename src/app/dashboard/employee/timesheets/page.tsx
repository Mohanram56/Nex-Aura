import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import TimesheetsClient from "./TimesheetsClient";
import { redirect } from "next/navigation";

export default async function TimesheetsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const projects = await db.project.findMany({
    where: { members: { some: { userId: session.user.id } } }
  });
  
  const timesheets = await db.timesheet.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
    include: { project: true }
  });

  return <TimesheetsClient timesheets={JSON.parse(JSON.stringify(timesheets))} projects={JSON.parse(JSON.stringify(projects))} />;
}