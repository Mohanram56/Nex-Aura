"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getManagerDashboardData() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || (session.user.role !== "MANAGER" && session.user.role !== "HR_ADMIN")) {
    throw new Error("Unauthorized");
  }

  const managerId = session.user.id;
  const todayStr = new Date().toISOString().split("T")[0];

  console.log("DEBUG: getManagerDashboardData called with managerId:", managerId);
  const managerRecord = await db.user.findUnique({ where: { id: managerId } });
  console.log("DEBUG: Resolved Database Manager Record:", managerRecord ? { id: managerRecord.id, name: managerRecord.name, email: managerRecord.email } : null);

  try {
    // 1. Fetch team members managed by this manager
    const teamMembers = await db.user.findMany({
      where: { managerId },
      include: {
        attendances: {
          where: { date: todayStr },
        },
        assignedTasks: true,
        shifts: true,
      },
    });

    // 2. Fetch pending leave requests from team members
    const pendingLeaves = await db.leaveRequest.findMany({
      where: {
        user: { managerId },
        status: "PENDING",
      },
      include: {
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 3. Fetch all shifts for team members for scheduling
    const teamShifts = await db.shift.findMany({
      where: {
        user: { managerId },
      },
      include: {
        user: true,
      },
    });

    // 4. Fetch projects owned by this manager
    const projects = await db.project.findMany({
      where: { ownerId: managerId },
      include: {
        tasks: {
          include: { assignee: true },
        },
      },
    });

    // 5. Fetch leaderboard rankings
    const leaderboard = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        level: true,
        xp: true,
        streak: true,
        department: { select: { name: true } },
      },
      orderBy: [
        { level: "desc" },
        { xp: "desc" },
      ],
    });

    // 6. Fetch pending location bypass requests for manager's team
    const pendingBypasses = await db.task.findMany({
      where: {
        assignee: { managerId },
        bypassRequested: true,
      },
      include: {
        assignee: true,
        project: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return {
      teamMembers,
      pendingLeaves,
      teamShifts,
      projects,
      leaderboard,
      pendingBypasses,
    };
  } catch (error) {
    console.error("Error fetching manager data:", error);
    throw new Error("Failed to load manager dashboard data");
  }
}

export async function processApproval(type: "LEAVE" | "SHIFT_SWAP", id: string, status: "APPROVED" | "REJECTED") {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || (session.user.role !== "MANAGER" && session.user.role !== "HR_ADMIN")) {
    throw new Error("Unauthorized");
  }

  const managerId = session.user.id;

  if (type === "LEAVE") {
    const leave = await db.leaveRequest.update({
      where: { id },
      data: {
        status,
        approverId: managerId,
      },
      include: { user: true },
    });

    // Create notification for employee
    await db.notification.create({
      data: {
        userId: leave.userId,
        message: `Your leave request from ${leave.startDate.toLocaleDateString()} to ${leave.endDate.toLocaleDateString()} has been ${status.toLowerCase()}.`,
      },
    });

    // If approved, update user status to ON_LEAVE
    if (status === "APPROVED") {
      await db.user.update({
        where: { id: leave.userId },
        data: { status: "ON_LEAVE" },
      });
    }

    revalidatePath("/dashboard/manager");
    revalidatePath("/dashboard/employee");
    return leave;
  }
  
  throw new Error("Unsupported approval type");
}

export async function createOrUpdateShift(shiftId: string | null, userId: string, date: string, startTime: string, endTime: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || (session.user.role !== "MANAGER" && session.user.role !== "HR_ADMIN")) {
    throw new Error("Unauthorized");
  }

  // Conflict Detection: check if user already has a shift on this date
  const conflict = await db.shift.findFirst({
    where: {
      userId,
      date,
      id: shiftId ? { not: shiftId } : undefined,
    },
  });

  if (conflict) {
    throw new Error(`Schedule Conflict: This employee already has a shift assigned on ${date}.`);
  }

  let shift;
  if (shiftId) {
    shift = await db.shift.update({
      where: { id: shiftId },
      data: { date, startTime, endTime },
    });
  } else {
    shift = await db.shift.create({
      data: { userId, date, startTime, endTime, status: "SCHEDULED" },
    });
  }

  await db.notification.create({
    data: {
      userId,
      message: `Your shift for ${date} has been scheduled from ${startTime} to ${endTime}.`,
    },
  });

  revalidatePath("/dashboard/manager");
  revalidatePath("/dashboard/employee");
  return shift;
}

export async function deleteShift(shiftId: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || (session.user.role !== "MANAGER" && session.user.role !== "HR_ADMIN")) {
    throw new Error("Unauthorized");
  }

  const shift = await db.shift.delete({
    where: { id: shiftId },
  });

  revalidatePath("/dashboard/manager");
  revalidatePath("/dashboard/employee");
  return shift;
}

export async function assignTask(
  title: string,
  description: string,
  assigneeId: string,
  projectId: string,
  priority: string,
  dueDateStr: string,
  siteName?: string,
  latitude?: number,
  longitude?: number,
  geofenceRadius?: number
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || (session.user.role !== "MANAGER" && session.user.role !== "HR_ADMIN")) {
    throw new Error("Unauthorized");
  }

  const dueDate = dueDateStr ? new Date(dueDateStr) : null;

  const task = await db.task.create({
    data: {
      title,
      description,
      assigneeId,
      projectId,
      priority,
      dueDate,
      status: "TODO",
      siteName: siteName || "Field Site",
      latitude: latitude ?? 12.9716,
      longitude: longitude ?? 77.5946,
      geofenceRadius: geofenceRadius ?? 200.0,
    },
  });

  await db.notification.create({
    data: {
      userId: assigneeId,
      message: `New task assigned: "${title}" (Priority: ${priority})`,
    },
  });

  revalidatePath("/dashboard/manager");
  revalidatePath("/dashboard/employee");
  return task;
}

export async function getLeaderboardData() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || (session.user.role !== "MANAGER" && session.user.role !== "HR_ADMIN")) {
    throw new Error("Unauthorized");
  }

  // Fetch all users sorted by level (descending) and xp (descending)
  return db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      role: true,
      level: true,
      xp: true,
      streak: true,
      department: { select: { name: true } },
    },
    orderBy: [
      { level: "desc" },
      { xp: "desc" },
    ],
  });
}

export async function processBypassRequest(taskId: string, status: "APPROVED" | "REJECTED") {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || (session.user.role !== "MANAGER" && session.user.role !== "HR_ADMIN")) {
    throw new Error("Unauthorized");
  }

  const task = await db.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  let updatedTask;
  if (status === "APPROVED") {
    updatedTask = await db.task.update({
      where: { id: taskId },
      data: {
        bypassApproved: true,
        bypassRequested: false,
        status: "IN_PROGRESS",
        clockInTime: new Date(),
      },
    });

    if (task.assigneeId) {
      await db.notification.create({
        data: {
          userId: task.assigneeId,
          message: `Your location bypass request for "${task.title}" was APPROVED. Check-in successful!`,
        },
      });
    }
  } else {
    updatedTask = await db.task.update({
      where: { id: taskId },
      data: {
        bypassRequested: false,
        bypassReason: null,
      },
    });

    if (task.assigneeId) {
      await db.notification.create({
        data: {
          userId: task.assigneeId,
          message: `Your location bypass request for "${task.title}" was REJECTED.`,
        },
      });
    }
  }

  revalidatePath("/dashboard/manager");
  revalidatePath("/dashboard/employee/tasks");
  return updatedTask;
}
