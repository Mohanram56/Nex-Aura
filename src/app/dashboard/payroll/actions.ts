"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// 1. Fetch Employee Compensation Profile (Salaries, Payslips, Claims)
export async function getEmployeeCompensationData(userId: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const isSelf = session.user.id === userId;
  const isHr = session.user.role === "HR_ADMIN";
  const userRecord = await db.user.findUnique({ where: { id: userId } });
  const isManager = userRecord?.managerId === session.user.id;

  if (!isSelf && !isHr && !isManager) {
    throw new Error("Access Denied: You do not have permissions for this employee's salary profile.");
  }

  const salaryStructure = await db.salaryStructure.findUnique({
    where: { userId },
  });

  const payslips = await db.payslip.findMany({
    where: { userId },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  const expenseClaims = await db.expenseClaim.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return {
    salaryStructure,
    payslips,
    expenseClaims,
  };
}

// 2. Submit Mileage / Tool / Fuel Expense Claim
export async function submitExpenseClaim(title: string, amount: number, description?: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const claim = await db.expenseClaim.create({
    data: {
      userId: session.user.id,
      title,
      amount,
      description,
      status: "PENDING",
    },
  });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
  });
  if (user?.managerId) {
    await db.notification.create({
      data: {
        userId: user.managerId,
        message: `${session.user.name || "Employee"} submitted a travel reimbursement claim: "${title}" ($${amount})`,
        read: false,
      },
    });
  }

  revalidatePath("/dashboard/employee");
  revalidatePath("/dashboard/manager/approvals");
  return claim;
}

// 3. Fetch Pending Expenses for Manager Review
export async function getManagerExpenseQueue() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || (session.user.role !== "MANAGER" && session.user.role !== "HR_ADMIN")) {
    throw new Error("Unauthorized");
  }

  const managerId = session.user.id;

  return db.expenseClaim.findMany({
    where: {
      user: { managerId },
      status: "PENDING",
    },
    include: {
      user: {
        select: {
          name: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

// 4. Accept / Reject Expense Claims
export async function processExpenseClaim(claimId: string, status: "APPROVED" | "REJECTED") {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || (session.user.role !== "MANAGER" && session.user.role !== "HR_ADMIN")) {
    throw new Error("Unauthorized");
  }

  const claim = await db.expenseClaim.findUnique({
    where: { id: claimId },
  });

  if (!claim) {
    throw new Error("Expense claim not found.");
  }

  const updatedClaim = await db.expenseClaim.update({
    where: { id: claimId },
    data: {
      status,
      approvedById: session.user.id,
    },
  });

  await db.notification.create({
    data: {
      userId: claim.userId,
      message: `Your travel expense claim "${claim.title}" was ${status} by your manager.`,
      read: false,
    },
  });

  revalidatePath("/dashboard/manager/approvals");
  revalidatePath("/dashboard/employee");
  return updatedClaim;
}

// 5. Calculate Monthly Payroll & Deductions (Zoho Payroll Engine)
export async function calculateMonthlyPayroll(userId: string, month: number, year: number) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.role !== "HR_ADMIN") {
    throw new Error("Unauthorized: Only HR Admins can compute monthly payrolls.");
  }

  const salaryStructure = await db.salaryStructure.findUnique({
    where: { userId },
  });

  if (!salaryStructure) {
    throw new Error("Cannot calculate payroll: Salary structure has not been defined for this employee.");
  }

  const { basic, hra, allowance, pf, tax } = salaryStructure;
  const daysInMonth = new Date(year, month, 0).getDate();

  const startDateStr = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDateStr = `${year}-${String(month).padStart(2, "0")}-${daysInMonth}`;

  const unpaidLeaves = await db.leaveRequest.findMany({
    where: {
      userId,
      status: "APPROVED",
      type: "UNPAID",
      OR: [
        {
          startDate: { lte: endDateStr },
          endDate: { gte: startDateStr },
        },
      ],
    },
  });

  let unpaidDays = 0;
  const targetMonthStart = new Date(year, month - 1, 1).getTime();
  const targetMonthEnd = new Date(year, month, 0, 23, 59, 59).getTime();

  for (const leave of unpaidLeaves) {
    const leaveStart = Math.max(targetMonthStart, new Date(leave.startDate).getTime());
    const leaveEnd = Math.min(targetMonthEnd, new Date(leave.endDate).getTime());
    
    if (leaveEnd >= leaveStart) {
      const diffMs = leaveEnd - leaveStart;
      const days = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
      unpaidDays += days;
    }
  }

  const unpaidDeduction = (basic / daysInMonth) * unpaidDays;

  const firstDayOfMonth = new Date(year, month - 1, 1);
  const lastDayOfMonth = new Date(year, month, 0, 23, 59, 59);

  const approvedClaims = await db.expenseClaim.findMany({
    where: {
      userId,
      status: "APPROVED",
      updatedAt: {
        gte: firstDayOfMonth,
        lte: lastDayOfMonth,
      },
    },
  });

  const reimbursements = approvedClaims.reduce((sum: number, c: any) => sum + c.amount, 0);

  const earnings = basic + hra + allowance;
  const deductions = pf + tax + unpaidDeduction;
  const netPay = Math.max(0, earnings - deductions + reimbursements);
  const workedDays = Math.max(0, daysInMonth - unpaidDays);

  const payslip = await db.payslip.upsert({
    where: {
      userId_month_year: {
        userId,
        month,
        year,
      },
    },
    update: {
      workedDays,
      unpaidLeaves: unpaidDays,
      earnings,
      deductions,
      reimbursements,
      netPay: Math.round(netPay * 100) / 100,
      status: "PENDING",
    },
    create: {
      userId,
      month,
      year,
      workedDays,
      unpaidLeaves: unpaidDays,
      earnings,
      deductions,
      reimbursements,
      netPay: Math.round(netPay * 100) / 100,
      status: "PENDING",
    },
  });

  revalidatePath("/dashboard/admin/payroll");
  revalidatePath("/dashboard/employee");
  return payslip;
}

// 6. Mark Payslips as PAID
export async function finalizePayslipPayment(payslipId: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.role !== "HR_ADMIN") {
    throw new Error("Unauthorized");
  }

  const updated = await db.payslip.update({
    where: { id: payslipId },
    data: { status: "PAID" },
  });

  await db.notification.create({
    data: {
      userId: updated.userId,
      message: `Your payslip for ${updated.month}/${updated.year} has been processed and marked as PAID.`,
      read: false,
    },
  });

  revalidatePath("/dashboard/admin/payroll");
  revalidatePath("/dashboard/employee");
  return updated;
}

// 7. KRA Goals Retrieval
export async function getEmployeeKRAs(userId: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  return db.kRA.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

// 8. Update KRA Progress
export async function updateKRAProgress(kraId: string, progress: number) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const kra = await db.kRA.findUnique({
    where: { id: kraId },
  });

  if (!kra || kra.userId !== session.user.id) {
    throw new Error("Access Denied: Goal not found or belongs to another user.");
  }

  const updatedKRA = await db.kRA.update({
    where: { id: kraId },
    data: { progress: Math.min(kra.target, Math.max(0, progress)) },
  });

  revalidatePath("/dashboard/employee");
  return updatedKRA;
}

// 9. Create KRA Goal for Employee
export async function createKRA(userId: string, title: string, target: number, dueDate?: Date) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || (session.user.role !== "MANAGER" && session.user.role !== "HR_ADMIN")) {
    throw new Error("Unauthorized");
  }

  const newGoal = await db.kRA.create({
    data: {
      userId,
      title,
      target,
      progress: 0,
      dueDate,
    },
  });

  await db.notification.create({
    data: {
      userId,
      message: `Your manager assigned you a new KRA performance target: "${title}" (Target: ${target})`,
      read: false,
    },
  });

  revalidatePath("/dashboard/employee");
  return newGoal;
}

// 10. Fetch Company Payroll Directory
export async function getCompanyPayrollDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.role !== "HR_ADMIN") {
    throw new Error("Unauthorized");
  }

  const employees = await db.user.findMany({
    where: { role: { in: ["EMPLOYEE", "MANAGER"] } },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      salaryStructure: true,
      payslips: {
        orderBy: [{ year: "desc" }, { month: "desc" }],
      },
    },
    orderBy: { name: "asc" },
  });

  return employees;
}

// 11. Upsert Salary Structure for Admin Setup
export async function upsertSalaryStructure(
  targetUserId: string,
  basic: number,
  hra: number,
  allowance: number,
  pf: number,
  tax: number
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.role !== "HR_ADMIN") {
    throw new Error("Unauthorized");
  }

  const updated = await db.salaryStructure.upsert({
    where: { userId: targetUserId },
    update: { basic, hra, allowance, pf, tax },
    create: { userId: targetUserId, basic, hra, allowance, pf, tax },
  });

  revalidatePath("/dashboard/admin/payroll");
  return updated;
}
