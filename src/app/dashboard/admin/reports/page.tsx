import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import ReportsClient from "./ReportsClient";
import { redirect } from "next/navigation";

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.role !== "HR_ADMIN") redirect("/dashboard");

  // Aggregate Data
  const headcount = await db.user.count({ where: { status: "ACTIVE" } });
  const totalSalaries = await db.salaryStructure.aggregate({ _sum: { basic: true, hra: true, allowance: true, pf: true, tax: true } });
  
  // Calculate Liabilities
  const grossMonthlyLiability = (totalSalaries._sum.basic || 0) + (totalSalaries._sum.hra || 0) + (totalSalaries._sum.allowance || 0);
  const totalMonthlyTDS = totalSalaries._sum.tax || 0;
  const totalMonthlyPF = totalSalaries._sum.pf || 0;
  const netMonthlyLiability = grossMonthlyLiability - totalMonthlyTDS - totalMonthlyPF;

  // Active Users with Bank Accounts linked
  const bankLinkedCount = await db.bankAccount.count();

  const metrics = {
    headcount,
    grossMonthlyLiability,
    netMonthlyLiability,
    totalMonthlyTDS,
    totalMonthlyPF,
    bankLinkedCount
  };

  return <ReportsClient metrics={metrics} />;
}