"use server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function submitDeclaration(fiscalYear: string, regime: string, sec80C: number, sec80D: number) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");

  const existing = await db.taxDeclaration.findUnique({
    where: { userId_fiscalYear: { userId: session.user.id, fiscalYear } }
  });

  let declaration;
  if (existing) {
    declaration = await db.taxDeclaration.update({
      where: { id: existing.id },
      data: { regime, section80C: sec80C, section80D: sec80D, status: "PENDING" }
    });
  } else {
    declaration = await db.taxDeclaration.create({
      data: { userId: session.user.id, fiscalYear, regime, section80C: sec80C, section80D: sec80D, status: "PENDING" }
    });
  }

  revalidatePath("/dashboard/employee/taxes");
  return declaration;
}

export async function linkBankAccount(accountName: string, accountNumber: string, routingNumber: string, bankName: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");

  const bankAccount = await db.bankAccount.upsert({
    where: { userId: session.user.id },
    update: { accountName, accountNumber, routingNumber, bankName, isVerified: false },
    create: { userId: session.user.id, accountName, accountNumber, routingNumber, bankName, isVerified: false }
  });

  revalidatePath("/dashboard/employee/taxes");
  return bankAccount;
}