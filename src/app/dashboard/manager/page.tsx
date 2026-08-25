import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getManagerDashboardData } from "./actions";
import ManagerDashboardClient from "./ManagerDashboardClient";
import { redirect } from "next/navigation";

export default async function ManagerDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  if (session.user.role !== "MANAGER" && session.user.role !== "HR_ADMIN") {
    redirect("/dashboard/employee");
  }

  const data = await getManagerDashboardData();

  return <ManagerDashboardClient data={JSON.parse(JSON.stringify(data))} />;
}
