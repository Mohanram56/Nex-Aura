"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import * as bcrypt from "bcryptjs";

export async function getAdminDashboardData() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.role !== "HR_ADMIN") {
    throw new Error("Unauthorized");
  }

  try {
    // 1. Fetch organization-wide users
    const allUsers = await db.user.findMany({
      include: {
        department: true,
        manager: true,
        attendances: true,
        leaveRequests: true,
        goals: true,
      },
      orderBy: { name: "asc" },
    });

    // 2. Fetch departments
    const departments = await db.department.findMany({
      include: {
        users: true,
      },
    });

    // 3. Fetch all compliance documents
    const allDocuments = await db.document.findMany({
      include: {
        user: true,
      },
      orderBy: { uploadedAt: "desc" },
    });

    return {
      allUsers,
      departments,
      allDocuments,
    };
  } catch (error) {
    console.error("Error fetching admin data:", error);
    throw new Error("Failed to load HR Admin directory records");
  }
}

export async function onboardEmployee(
  name: string,
  email: string,
  role: string,
  departmentId: string,
  managerId: string | null,
  avatarUrl: string | null
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.role !== "HR_ADMIN") {
    throw new Error("Unauthorized");
  }

  // Check unique email
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("Employee account with this email already exists.");
  }

  // Hash default password
  const defaultPassword = await bcrypt.hash("password123", 10);

  const newUser = await db.user.create({
    data: {
      name,
      email,
      password: defaultPassword,
      role,
      departmentId: departmentId || null,
      managerId: managerId || null,
      status: "ACTIVE",
      avatarUrl: avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150", // Standard valid default avatar
    },
  });

  // Create onboarding notification
  await db.notification.create({
    data: {
      userId: newUser.id,
      message: "Welcome to Apollo! Please complete your onboarding checklist and contract signatures.",
    },
  });

  revalidatePath("/dashboard/admin");
  return newUser;
}

export async function updateEmployee(
  id: string,
  name: string,
  email: string,
  role: string,
  departmentId: string,
  managerId: string | null,
  avatarUrl: string | null
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.role !== "HR_ADMIN") {
    throw new Error("Unauthorized");
  }

  // Check email uniqueness if email is modified
  const existing = await db.user.findFirst({
    where: {
      email,
      NOT: { id },
    },
  });
  if (existing) {
    throw new Error("Another employee account with this email already exists.");
  }

  const updatedUser = await db.user.update({
    where: { id },
    data: {
      name,
      email,
      role,
      departmentId: departmentId || null,
      managerId: managerId || null,
      avatarUrl: avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    },
  });

  revalidatePath("/dashboard/admin");
  return updatedUser;
}

