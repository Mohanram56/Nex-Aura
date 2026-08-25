import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import ComplianceClient from "./ComplianceClient";

export default async function CompliancePage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  if (session.user.role !== "HR_ADMIN") {
    redirect("/dashboard/employee");
  }

  // Fetch documents for the vault
  const documents = await db.document.findMany({
    include: {
      user: true,
    },
    orderBy: { uploadedAt: "desc" },
  });

  return <ComplianceClient initialDocuments={JSON.parse(JSON.stringify(documents))} />;
}
