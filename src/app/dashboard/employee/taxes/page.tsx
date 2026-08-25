import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import TaxesClient from "./TaxesClient";
import { redirect } from "next/navigation";

export default async function TaxesPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect("/login");

  const declarations = await db.taxDeclaration.findMany({
    where: { userId: session.user.id },
    orderBy: { fiscalYear: "desc" }
  });

  // Check if they have a linked bank account
  const bankAccount = await db.bankAccount.findUnique({
    where: { userId: session.user.id }
  });

  return <TaxesClient declarations={JSON.parse(JSON.stringify(declarations))} bankAccount={JSON.parse(JSON.stringify(bankAccount))} />;
}