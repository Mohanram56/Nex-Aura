import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import SchedulingClient from "./SchedulingClient";

export default async function SchedulingPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const managerId = session.user.id;

  // Fetch team members
  const team = await db.user.findMany({
    where: { managerId },
  });

  // Fetch shifts
  const shifts = await db.shift.findMany({
    where: { user: { managerId } },
    include: { user: true },
    orderBy: { date: "asc" },
  });

  return (
    <SchedulingClient
      team={JSON.parse(JSON.stringify(team))}
      shifts={JSON.parse(JSON.stringify(shifts))}
    />
  );
}
