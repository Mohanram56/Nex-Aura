import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getEmployeeDashboardData } from "./actions";
import EmployeeDashboardClient from "./EmployeeDashboardClient";

export default async function EmployeeDashboard() {
  const session = await getServerSession(authOptions);
  const data = await getEmployeeDashboardData();

  return <EmployeeDashboardClient data={data} user={session?.user} />;
}
