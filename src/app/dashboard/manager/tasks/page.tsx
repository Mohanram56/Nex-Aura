import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import TaskAllocationClient from "./TaskAllocationClient";

export default async function TaskAllocationPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const managerId = session.user.id;
  const isHrAdmin = session.user.role === "HR_ADMIN";

  // Fetch team members with their current tasks (HR Admin sees all managers & employees)
  const team = await db.user.findMany({
    where: isHrAdmin ? { role: { in: ["EMPLOYEE", "MANAGER"] } } : { managerId },
    include: { assignedTasks: true },
  });

  // Fetch projects and their tasks (HR Admin sees all projects)
  const projects = await db.project.findMany({
    where: isHrAdmin ? {} : { ownerId: managerId },
    include: {
      tasks: {
        include: { assignee: true },
      },
    },
  });

  return (
    <TaskAllocationClient
      team={JSON.parse(JSON.stringify(team))}
      projects={JSON.parse(JSON.stringify(projects))}
    />
  );
}
