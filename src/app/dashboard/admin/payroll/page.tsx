import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PayrollClient from "./PayrollClient";
import { getCompanyPayrollDashboard } from "../../payroll/actions";

export default async function PayrollPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  if (session.user.role !== "HR_ADMIN") {
    redirect("/dashboard/employee");
  }

  const data = await getCompanyPayrollDashboard();

  return <PayrollClient initialEmployees={JSON.parse(JSON.stringify(data))} />;
}
