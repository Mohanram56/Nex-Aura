import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import AppraisalsClient from "./AppraisalsClient";
import { redirect } from "next/navigation";

export default async function AppraisalsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || (session.user.role !== "MANAGER" && session.user.role !== "HR_ADMIN")) {
    redirect("/dashboard");
  }

  const teamMembers = await db.user.findMany({
    where: { managerId: session.user.id }
  });
  
  const appraisals = await db.appraisal.findMany({
    where: { managerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { user: true }
  });

  return <AppraisalsClient team={JSON.parse(JSON.stringify(teamMembers))} appraisals={JSON.parse(JSON.stringify(appraisals))} />;
}