"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getEmployeeDashboardData() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;
  const todayStr = new Date().toISOString().split("T")[0];

  try {
    const attendance = await db.attendance.findUnique({
      where: {
        userId_date: {
          userId,
          date: todayStr,
        },
      },
    });

    const shifts = await db.shift.findMany({
      where: { userId },
      orderBy: { date: "asc" },
      take: 5,
    });

    const leaveRequests = await db.leaveRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const tasks = await db.task.findMany({
      where: { assigneeId: userId },
      include: { project: true },
      orderBy: { dueDate: "asc" },
    });

    const goals = await db.performanceGoal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const documents = await db.document.findMany({
      where: { userId },
      orderBy: { uploadedAt: "desc" },
    });

    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const userProfile = await db.user.findUnique({
      where: { id: userId },
      include: { badges: true },
    });

    const salaryStructure = await db.salaryStructure.findUnique({
      where: { userId },
    });

    const payslips = await db.payslip.findMany({
      where: { userId },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    const expenseClaims = await db.expenseClaim.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const kras = await db.kRA.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return {
      attendance,
      shifts,
      leaveRequests,
      tasks,
      goals,
      documents,
      notifications,
      userProfile,
      salaryStructure,
      payslips,
      expenseClaims,
      kras,
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    throw new Error("Failed to load dashboard data");
  }
}

async function addXpToUser(userId: string, amount: number) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  let newXp = user.xp + amount;
  let newLevel = user.level;
  let leveledUp = false;

  while (newXp >= newLevel * 500) {
    newXp -= newLevel * 500;
    newLevel += 1;
    leveledUp = true;
  }

  await db.user.update({
    where: { id: userId },
    data: {
      xp: newXp,
      level: newLevel,
    },
  });

  if (leveledUp) {
    await db.notification.create({
      data: {
        userId,
        message: `🎉 Level Up! You reached Level ${newLevel}! Keep up the great work!`,
      },
    });
  }

  return { leveledUp, newLevel, newXp };
}

export async function clockInOrOut() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  // Find or create attendance log
  const existing = await db.attendance.findUnique({
    where: {
      userId_date: {
        userId,
        date: todayStr,
      },
    },
  });

  if (!existing) {
    // Clock In logic
    const hour = now.getHours();
    const minute = now.getMinutes();
    const isLate = hour > 9 || (hour === 9 && minute > 5);
    const status = isLate ? "LATE" : "PRESENT";

    const attendance = await db.attendance.create({
      data: {
        userId,
        date: todayStr,
        clockIn: now,
        status,
      },
    });

    await db.notification.create({
      data: {
        userId,
        message: `Clocked in at ${now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}. Status: ${status}`,
      },
    });

    // Gamification: Update login streaks and award clock-in XP
    const userProfile = await db.user.findUnique({ where: { id: userId } });
    let newStreak = 1;
    if (userProfile) {
      if (userProfile.lastActiveDate) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        if (userProfile.lastActiveDate === yesterdayStr) {
          newStreak = userProfile.streak + 1;
        } else if (userProfile.lastActiveDate === todayStr) {
          newStreak = userProfile.streak;
        }
      }

      await db.user.update({
        where: { id: userId },
        data: {
          streak: newStreak,
          lastActiveDate: todayStr,
        },
      });

      // Award +50 XP
      await addXpToUser(userId, 50);

      // Award "Consistent" badge for a 3-day active streak
      if (newStreak >= 3) {
        const hasConsistentBadge = await db.badge.findFirst({
          where: { userId, name: "Consistent" },
        });
        if (!hasConsistentBadge) {
          await db.badge.create({
            data: {
              userId,
              name: "Consistent",
              description: "Clocked in consecutively for 3 days.",
              icon: "Flame",
            },
          });
        }
      }
    }

    revalidatePath("/dashboard/employee");
    return { type: "CLOCK_IN", attendance };
  } else if (!existing.clockOut) {
    // Clock Out logic
    const attendance = await db.attendance.update({
      where: { id: existing.id },
      data: {
        clockOut: now,
      },
    });

    await db.notification.create({
      data: {
        userId,
        message: `Clocked out at ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
      },
    });

    revalidatePath("/dashboard/employee");
    return { type: "CLOCK_OUT", attendance };
  } else {
    throw new Error("Already completed shifts for today.");
  }
}

export async function submitLeaveRequest(
  type: string,
  startDateStr: string,
  endDateStr: string,
  reason: string
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  const leave = await db.leaveRequest.create({
    data: {
      userId,
      type,
      startDate,
      endDate,
      reason,
      status: "PENDING",
    },
  });

  // Alert Manager
  const user = await db.user.findUnique({ where: { id: userId } });
  if (user?.managerId) {
    await db.notification.create({
      data: {
        userId: user.managerId,
        message: `${user.name} submitted a new ${type.toLowerCase()} leave request starting ${startDate.toLocaleDateString()}.`,
      },
    });
  }

  revalidatePath("/dashboard/employee");
  return leave;
}

export async function updateTaskStatus(taskId: string, status: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;

  // Track previous status to prevent double-awarding XP
  const existingTask = await db.task.findUnique({ where: { id: taskId } });
  const wasDone = existingTask?.status === "DONE";

  const task = await db.task.update({
    where: { id: taskId },
    data: { status },
  });

  if (status === "DONE" && !wasDone) {
    // Award +100 XP for task completion
    await addXpToUser(userId, 100);

    // Check count of done tasks for the "Task Master" badge
    const completedCount = await db.task.count({
      where: { assigneeId: userId, status: "DONE" },
    });

    if (completedCount >= 3) {
      const hasTaskMaster = await db.badge.findFirst({
        where: { userId, name: "Task Master" },
      });
      if (!hasTaskMaster) {
        await db.badge.create({
          data: {
            userId,
            name: "Task Master",
            description: "Completed 3 or more team projects.",
            icon: "Award",
          },
        });
      }
    }
  }

  revalidatePath("/dashboard/employee");
  return task;
}

export async function getUserNotifications() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  return db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function dismissNotification(id: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  return db.notification.delete({
    where: { id, userId: session.user.id },
  });
}

export async function dismissAllNotifications() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  return db.notification.deleteMany({
    where: { userId: session.user.id },
  });
}

export async function getUserBadges() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  return db.badge.findMany({
    where: { userId: session.user.id },
    orderBy: { earnedAt: "desc" },
  });
}

function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in meters
}

export async function punchInToTask(taskId: string, userLat: number, userLng: number, gpsAccuracy?: number) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const task = await db.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  if (task.bypassRequested) {
    return {
      success: false,
      error: "Your location bypass request is pending manager approval.",
    };
  }

  const targetLat = task.latitude ?? 12.9716;
  const targetLng = task.longitude ?? 77.5946;
  const radius = task.geofenceRadius ?? 200.0;
  const accuracy = gpsAccuracy ?? 0;
  const effectiveRadius = radius + accuracy;

  const distance = getDistanceInMeters(userLat, userLng, targetLat, targetLng);

  // If approved by manager, we skip distance validation
  if (!task.bypassApproved && distance > effectiveRadius) {
    return {
      success: false,
      distance: Math.round(distance),
      canBypass: true,
      error: `Access Denied: You are ${Math.round(distance)} meters away from "${task.siteName ?? "Field Site"}". Target: ${radius}m (GPS accuracy error: +/- ${Math.round(accuracy)}m).`,
    };
  }

  // Allow punch in
  const updatedTask = await db.task.update({
    where: { id: taskId },
    data: {
      status: "IN_PROGRESS",
      clockInTime: new Date(),
      clockInLat: userLat,
      clockInLng: userLng,
      clockOutTime: null,
      clockOutLat: null,
      clockOutLng: null,
      actualDuration: null,
      bypassRequested: false, // reset requests
    },
  });

  revalidatePath("/dashboard/employee/tasks");
  revalidatePath("/dashboard/employee");
  return { success: true, task: updatedTask };
}

export async function punchOutOfTask(taskId: string, userLat: number, userLng: number, gpsAccuracy?: number, signatureDataUrl?: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const task = await db.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  const targetLat = task.latitude ?? 12.9716;
  const targetLng = task.longitude ?? 77.5946;
  const radius = task.geofenceRadius ?? 200.0;
  const accuracy = gpsAccuracy ?? 0;
  const effectiveRadius = radius + accuracy;

  const distance = getDistanceInMeters(userLat, userLng, targetLat, targetLng);

  // Skip distance validation if bypass was approved
  if (!task.bypassApproved && distance > effectiveRadius) {
    return {
      success: false,
      distance: Math.round(distance),
      error: `Access Denied: You are ${Math.round(distance)} meters away from the site. You must be on-site to punch out.`,
    };
  }

  const now = new Date();
  const clockIn = task.clockInTime ? new Date(task.clockInTime) : now;
  const durationMs = now.getTime() - clockIn.getTime();
  const actualDuration = Math.round(durationMs / (1000 * 60)); // in minutes

  const updatedTask = await db.task.update({
    where: { id: taskId },
    data: {
      status: "DONE",
      clockOutTime: now,
      clockOutLat: userLat,
      clockOutLng: userLng,
      actualDuration,
      customerSignature: signatureDataUrl || null,
      bypassRequested: false,
      bypassApproved: false, // reset bypass
    },
  });

  // Award XP +100 for task completion!
  await addXpToUser(session.user.id, 100);

  // Check count of done tasks for the "Task Master" badge
  const completedCount = await db.task.count({
    where: { assigneeId: session.user.id, status: "DONE" },
  });

  if (completedCount >= 3) {
    const hasTaskMaster = await db.badge.findFirst({
      where: { userId: session.user.id, name: "Task Master" },
    });
    if (!hasTaskMaster) {
      await db.badge.create({
        data: {
          userId: session.user.id,
          name: "Task Master",
          description: "Completed 3 or more team projects.",
          icon: "Award",
        },
      });
    }
  }

  revalidatePath("/dashboard/employee/tasks");
  revalidatePath("/dashboard/employee");
  return { success: true, task: updatedTask };
}

export async function requestBypass(taskId: string, reason: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const task = await db.task.findUnique({
    where: { id: taskId },
    include: { assignee: true },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  const updatedTask = await db.task.update({
    where: { id: taskId },
    data: {
      bypassRequested: true,
      bypassReason: reason,
      bypassApproved: false,
    },
  });

  const managerId = task.assignee?.managerId;
  if (managerId) {
    await db.notification.create({
      data: {
        userId: managerId,
        message: `${session.user.name || "Employee"} requested location bypass for "${task.title}": "${reason}"`,
        read: false,
      },
    });
  }

  revalidatePath("/dashboard/employee/tasks");
  revalidatePath("/dashboard/manager");
  return { success: true, task: updatedTask };
}

export async function calibrateTaskLocation(taskId: string, lat: number, lng: number) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const updatedTask = await db.task.update({
    where: { id: taskId },
    data: {
      latitude: lat,
      longitude: lng,
    },
  });

  revalidatePath("/dashboard/employee/tasks");
  return { success: true, task: updatedTask };
}
