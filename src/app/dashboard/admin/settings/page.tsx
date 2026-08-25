import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  if (session.user.role !== "HR_ADMIN") {
    redirect("/dashboard/employee");
  }

  // Fetch all departments
  const departments = await db.department.findMany({
    include: {
      users: true,
    },
  });

  return <SettingsClient departments={JSON.parse(JSON.stringify(departments))} />;
}
