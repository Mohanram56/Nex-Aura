"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import * as bcrypt from "bcryptjs";

export async function changeInitialPassword(newPassword: string) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !session.user.email) {
    throw new Error("Unauthorized");
  }

  // Hash the new password securely
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update the user's password and reset their first-login requirement
  await db.user.update({
    where: { email: session.user.email },
    data: {
      password: hashedPassword,
      requiresPasswordChange: false,
    },
  });

  return { success: true };
}
