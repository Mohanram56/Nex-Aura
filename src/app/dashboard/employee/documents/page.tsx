import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import DocumentsClient from "./DocumentsClient";

export default async function DocumentsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Fetch all documents
  const documents = await db.document.findMany({
    where: { userId },
    orderBy: { uploadedAt: "desc" },
  });

  return <DocumentsClient documents={JSON.parse(JSON.stringify(documents))} />;
}
