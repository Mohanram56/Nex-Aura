import "dotenv/config";
import { db as prisma } from "../src/lib/db";
import * as bcrypt from "bcryptjs";

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.notification.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.performanceGoal.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.projectMember.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.shift.deleteMany({});
  await prisma.leaveRequest.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.department.deleteMany({});

  // 1. Create Departments
  const engineering = await prisma.department.create({
    data: { name: "Engineering" },
  });

  const hrDept = await prisma.department.create({
    data: { name: "Human Resources" },
  });

  console.log("Created departments:", engineering.name, hrDept.name);

  // 2. Hash Passwords
  const adminPassword = await bcrypt.hash("Mohan@1234", 10);
  const managerPassword = await bcrypt.hash("Narmatha@1234", 10);
  const employeePassword = await bcrypt.hash("John@1234", 10);
 
  // 3. Create HR/Admin User (Mohanram M)
  const admin = await prisma.user.create({
    data: {
      name: "Mohanram M",
      email: "mohanrammurugesan1@gmail.com",
      password: adminPassword,
      role: "HR_ADMIN",
      departmentId: hrDept.id,
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
      status: "ACTIVE",
      requiresPasswordChange: false,
      xp: 1500,
      level: 3,
      streak: 5,
    },
  });

  // 4. Create Manager User (Narmatha)
  const manager = await prisma.user.create({
    data: {
      name: "Narmatha",
      email: "narmatha@gmail.com",
      password: managerPassword,
      role: "MANAGER",
      departmentId: engineering.id,
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      status: "ACTIVE",
      requiresPasswordChange: false,
      xp: 2200,
      level: 4,
      streak: 12,
    },
  });

  // 5. Create Employee User (John) managed by Narmatha
  const employee = await prisma.user.create({
    data: {
      name: "John",
      email: "john@gmail.com",
      password: employeePassword,
      role: "EMPLOYEE",
      departmentId: engineering.id,
      managerId: manager.id,
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      status: "ACTIVE",
      requiresPasswordChange: false,
      xp: 850,
      level: 2,
      streak: 3,
    },
  });

  // 5b. Create Badges for John
  await prisma.badge.createMany({
    data: [
      {
        userId: employee.id,
        name: "Fast Starter",
        description: "Completed onboarding checklist on day one.",
        icon: "Zap",
      },
      {
        userId: employee.id,
        name: "Punctual Master",
        description: "Clocked in on time for 3 consecutive days.",
        icon: "Flame",
      },
    ],
  });

  console.log("Created users:", admin.email, manager.email, employee.email);

  // 6. Create some Projects and Project Members
  const project = await prisma.project.create({
    data: {
      name: "Apollo WFM Dashboard",
      description: "Building the internal workforce management platform.",
      ownerId: manager.id,
    },
  });

  await prisma.projectMember.createMany({
    data: [
      { projectId: project.id, userId: manager.id },
      { projectId: project.id, userId: employee.id },
    ],
  });

  // 7. Create some Tasks
  await prisma.task.createMany({
    data: [
      {
        title: "Setup Auth Routes & Middleware",
        description: "Implement NextAuth.js with RBAC.",
        assigneeId: employee.id,
        projectId: project.id,
        status: "IN_PROGRESS",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // in 2 days
        priority: "HIGH",
        siteName: "Chennai Tech Hub",
        latitude: 13.0827,
        longitude: 80.2707,
        geofenceRadius: 200.0,
      },
      {
        title: "Design System Tokens",
        description: "Create shared button, input, card primitives.",
        assigneeId: employee.id,
        projectId: project.id,
        status: "TODO",
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        priority: "MEDIUM",
        siteName: "Bengaluru Dev Office",
        latitude: 12.9716,
        longitude: 77.5946,
        geofenceRadius: 250.0,
      },
      {
        title: "Review Design Specifications",
        description: "Review WFM requirements and alignment.",
        assigneeId: manager.id,
        projectId: project.id,
        status: "DONE",
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        priority: "LOW",
        siteName: "Delhi Corporate Headquarters",
        latitude: 28.6139,
        longitude: 77.2090,
        geofenceRadius: 300.0,
      },
    ],
  });

  // 8. Create Attendance logs (for the current month)
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  
  // Let's seed attendance for Marcus for the past 3 days
  for (let i = 1; i <= 3; i++) {
    const dayStr = String(today.getDate() - i).padStart(2, "0");
    const dateStr = `${year}-${month}-${dayStr}`;
    
    const clockInTime = new Date(`${dateStr}T08:55:00Z`);
    const clockOutTime = new Date(`${dateStr}T17:05:00Z`);

    await prisma.attendance.create({
      data: {
        userId: employee.id,
        date: dateStr,
        clockIn: clockInTime,
        clockOut: clockOutTime,
        status: "PRESENT",
      },
    });
  }

  // Today's attendance (currently clocked in!)
  const todayStr = `${year}-${month}-${String(today.getDate()).padStart(2, "0")}`;
  await prisma.attendance.create({
    data: {
      userId: employee.id,
      date: todayStr,
      clockIn: new Date(`${todayStr}T09:02:00Z`), // slightly late
      status: "LATE",
    },
  });

  // 9. Create Shifts
  await prisma.shift.createMany({
    data: [
      {
        userId: employee.id,
        date: todayStr,
        startTime: "09:00",
        endTime: "17:00",
        status: "SCHEDULED",
      },
      {
        userId: employee.id,
        date: `${year}-${month}-${String(today.getDate() + 1).padStart(2, "0")}`,
        startTime: "09:00",
        endTime: "17:00",
        status: "SCHEDULED",
      },
    ],
  });

  // 10. Create Leave Requests
  await prisma.leaveRequest.create({
    data: {
      userId: employee.id,
      type: "ANNUAL",
      startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      status: "PENDING",
      reason: "Family vacation trip.",
    },
  });

  // 11. Create Performance Goals
  await prisma.performanceGoal.createMany({
    data: [
      {
        userId: employee.id,
        title: "Complete WFM App Design System",
        progress: 80.0,
        cycleId: "Q3-2026",
      },
      {
        userId: employee.id,
        title: "Achieve 95% Code Coverage",
        progress: 45.0,
        cycleId: "Q3-2026",
      },
    ],
  });

  // 12. Create Documents
  await prisma.document.createMany({
    data: [
      {
        userId: employee.id,
        type: "CONTRACT",
        name: "Employment_Agreement_John.pdf",
        fileUrl: "/documents/Employment_Agreement_John.pdf",
      },
      {
        userId: employee.id,
        type: "PAYSLIP",
        name: "Payslip_July_2026.pdf",
        fileUrl: "/documents/Payslip_July_2026.pdf",
      },
    ],
  });

  // 13. Create Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: employee.id,
        message: "Your timesheet for last week has been approved.",
        read: false,
      },
      {
        userId: employee.id,
        message: "New shift assigned for tomorrow.",
        read: true,
      },
      {
        userId: manager.id,
        message: "John submitted a leave request for next month.",
        read: false,
      },
    ],
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
