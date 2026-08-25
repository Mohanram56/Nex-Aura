import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    const fiscalYear = `${year}-${year+1}`;

    const users = await db.user.findMany({
      where: {
        status: "ACTIVE",
        salaryStructure: { isNot: null }
      },
      include: {
        salaryStructure: true,
        bankAccount: true,
        taxDeclarations: {
          where: { fiscalYear }
        }
      }
    });

    let processedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      if (!user.salaryStructure) continue;

      const existing = await db.payslip.findUnique({
        where: { userId_month_year: { userId: user.id, month, year } }
      });
      if (existing) {
        skippedCount++;
        continue;
      }

      const struct = user.salaryStructure;
      const taxDeclaration = user.taxDeclarations?.[0];
      let finalTax = struct.tax;
      
      if (taxDeclaration && taxDeclaration.regime === "OLD") {
         const savings = taxDeclaration.section80C + taxDeclaration.section80D;
         finalTax = Math.max(0, struct.tax - (savings * 0.1));
      }

      const earnings = struct.basic + struct.hra + struct.allowance;
      const deductions = struct.pf + finalTax;
      const netPay = earnings - deductions;

      await db.payslip.create({
        data: {
          userId: user.id,
          month,
          year,
          workedDays: 22,
          unpaidLeaves: 0,
          earnings,
          deductions,
          reimbursements: 0.0,
          netPay,
          status: user.bankAccount ? "PAID" : "PENDING"
        }
      });

      if (user.bankAccount) {
         console.log(`[BANK_API_MOCK] Initiated ACH Transfer of $${netPay.toFixed(2)} to Acct: ****${user.bankAccount.accountNumber.slice(-4)}`);
      }

      await db.notification.create({
        data: {
          userId: user.id,
          message: user.bankAccount 
            ? `Your payslip for ${month}/${year} was generated and salary was deposited.`
            : `Your payslip for ${month}/${year} is ready, but payout is pending bank setup.`
        }
      });

      processedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Automated Payroll Run Complete. Processed: ${processedCount}, Skipped: ${skippedCount}`
    });

  } catch (error: any) {
    console.error("Cron Payroll Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}