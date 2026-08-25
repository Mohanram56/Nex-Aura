import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import OnboardingClient from "./OnboardingClient";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  if (session.user.role !== "HR_ADMIN") {
    redirect("/dashboard/employee");
  }

  // Fetch all users
  const users = await db.user.findMany({
    orderBy: { name: "asc" },
  });

  return <OnboardingClient users={JSON.parse(JSON.stringify(users))} />;
}
