import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import PerformanceClient from "./PerformanceClient";

export default async function PerformancePage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Fetch all goals
  const goals = await db.performanceGoal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return <PerformanceClient goals={JSON.parse(JSON.stringify(goals))} />;
}
