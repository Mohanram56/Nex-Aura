import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageTransition } from "@/components/PageTransition";
import { db } from "@/lib/db";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.email) {
    redirect("/login");
  }

  // Fetch the user's password change requirement dynamically on each page load
  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { requiresPasswordChange: true },
  });

  const requiresPasswordChange = user?.requiresPasswordChange ?? false;

  return (
    <DashboardLayout requiresPasswordChange={requiresPasswordChange}>
      <PageTransition>{children}</PageTransition>
    </DashboardLayout>
  );
}
