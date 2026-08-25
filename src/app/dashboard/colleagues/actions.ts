"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function getColleaguesList() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  return db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatarUrl: true,
      role: true,
      designation: true,
      status: true,
      department: {
        select: {
          name: true,
        },
      },
      manager: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });
}
