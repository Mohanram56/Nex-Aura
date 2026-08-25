import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import ApprovalsClient from "./ApprovalsClient";

export default async function ApprovalsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const managerId = session.user.id;

  // Fetch pending leaves
  const pendingLeaves = await db.leaveRequest.findMany({
    where: {
      user: { managerId },
      status: "PENDING",
    },
    include: {
      user: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Fetch pending location bypasses
  const pendingBypasses = await db.task.findMany({
    where: {
      assignee: { managerId },
      bypassRequested: true,
    },
    include: {
      assignee: true,
      project: true,
    },
    orderBy: { updatedAt: "asc" },
  });

  // Fetch pending travel/tool expense claims
  const pendingExpenses = await db.expenseClaim.findMany({
    where: {
      user: { managerId },
      status: "PENDING",
    },
    include: {
      user: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <ApprovalsClient 
      pendingLeaves={JSON.parse(JSON.stringify(pendingLeaves))} 
      pendingBypasses={JSON.parse(JSON.stringify(pendingBypasses))}
      pendingExpenses={JSON.parse(JSON.stringify(pendingExpenses))}
    />
  );
}
