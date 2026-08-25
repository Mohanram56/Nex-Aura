import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import LeaveClient from "./LeaveClient";

export default async function LeavePage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Fetch all leave requests
  const leaveRequests = await db.leaveRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return <LeaveClient leaveRequests={JSON.parse(JSON.stringify(leaveRequests))} />;
}
