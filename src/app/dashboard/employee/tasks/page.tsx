import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import TasksClient from "./TasksClient";

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Fetch all tasks
  const tasks = await db.task.findMany({
    where: { assigneeId: userId },
    include: { project: true },
    orderBy: { dueDate: "asc" },
  });

  return <TasksClient tasks={JSON.parse(JSON.stringify(tasks))} />;
}
