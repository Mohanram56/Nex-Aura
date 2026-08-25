import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import TeamPerformanceClient from "./TeamPerformanceClient";

export default async function TeamPerformancePage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const managerId = session.user.id;

  // Fetch team members and their OKRs
  const team = await db.user.findMany({
    where: { managerId },
    include: { goals: true },
  });

  return <TeamPerformanceClient team={JSON.parse(JSON.stringify(team))} />;
}
