import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getAdminDashboardData } from "./actions";
import AdminDashboardClient from "./AdminDashboardClient";
import { redirect } from "next/navigation";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  if (session.user.role !== "HR_ADMIN") {
    redirect("/dashboard/employee");
  }

  const data = await getAdminDashboardData();

  return <AdminDashboardClient data={JSON.parse(JSON.stringify(data))} />;
}
