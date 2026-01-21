import {
  PrismaClient,
  Role,
  AttendanceStatus,
  SalaryType,
  AccountStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Utility functions
function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function deleteAllDataInDB() {
  console.log("🧹 Clearing existing data...");
  await prisma.auditLog.deleteMany();
  await prisma.salaryBreakdown.deleteMany();
  await prisma.salary.deleteMany();
  await prisma.correctionRequest.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.shiftConfiguration.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.pushSubscription.deleteMany();
  await prisma.otp.deleteMany();
  await prisma.companyInvitation.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();
  await prisma.systemSetting.deleteMany();
}

async function main() {
  if (process.env.CLEAR_DB_BEFORE_LAGAR_SEEDING === "true") {
    await deleteAllDataInDB();
    console.log("✅ Existing data cleared.");
  }
  console.log("🌱 Seeding Lagar Data...");

  // Create additional companies for lagar data
  console.log("🏢 Creating Additional Companies for Lagar Data...");
  const lagarCompanyData = [
    { name: "Lagar Industries", industry: "Manufacturing", size: "Large" },
    { name: "Lagar Tech Solutions", industry: "Technology", size: "Medium" },
    { name: "Lagar Financial Services", industry: "Finance", size: "Large" },
    { name: "Lagar Healthcare", industry: "Healthcare", size: "Medium" },
    { name: "Lagar Logistics", industry: "Transportation", size: "Large" },
    { name: "Lagar Construction", industry: "Construction", size: "Large" },
    { name: "Lagar Retail Chain", industry: "Retail", size: "Medium" },
    { name: "Lagar Education Services", industry: "Education", size: "Large" },
    {
      name: "Lagar Hospitality Group",
      industry: "Hospitality",
      size: "Medium",
    },
    { name: "Lagar Energy Solutions", industry: "Energy", size: "Large" },
    { name: "Lagar Automotive", industry: "Automotive", size: "Medium" },
    {
      name: "Lagar Pharmaceuticals",
      industry: "Pharmaceuticals",
      size: "Large",
    },
    { name: "Lagar Telecom", industry: "Telecommunications", size: "Medium" },
    { name: "Lagar Media Corp", industry: "Media", size: "Large" },
    { name: "Lagar Consulting", industry: "Consulting", size: "Medium" },
  ];

  const companyCreateData = lagarCompanyData.map((data, i) => ({
    name: data.name,
    description: `${data.name} - Specialized in ${data.industry}`,
    status: "ACTIVE" as AccountStatus,
    shiftStartTime: "09:00",
    shiftEndTime: "18:00",
    gracePeriodMinutes: 15,
    minWorkingHours: 4.0,
    maxDailyHours: 12.0,
    autoPunchOutBufferMinutes: 30,
    locationLat: 28.6139 + (Math.random() - 0.5) * 2,
    locationLng: 77.209 + (Math.random() - 0.5) * 2,
    locationRadius: 100.0,
    overtimeThresholdHours: 2.0,
    nightPunchInWindowHours: 2.0,
    defaultSalaryType: getRandomElement([
      "MONTHLY",
      "HOURLY",
      "DAILY",
    ] as SalaryType[]),
    overtimeMultiplier: 1.5,
    enableLatePenalty: true,
    latePenaltyPerMinute: 2.0,
    enableAbsentPenalty: true,
    halfDayThresholdHours: 4.0,
    absentPenaltyPerDay: 500.0,
    pfPercentage: 12.0,
    esiPercentage: 0.75,
  }));

  const lagarCompanies = await prisma.company.createManyAndReturn({
    data: companyCreateData,
  });
  console.log(`✅ Created ${lagarCompanies.length} Lagar companies`);

  // Create users for lagar companies
  console.log("👥 Creating Users for Lagar Companies...");
  const adminPassword = await bcrypt.hash("lagaradmin123", 10);
  const staffPassword = await bcrypt.hash("lagarstaff123", 10);

  const userCreateData = [];

  for (let i = 0; i < lagarCompanies.length; i++) {
    const company = lagarCompanies[i];
    console.log(
      `Preparing users for company ${i + 1}/${lagarCompanies.length}: ${company.name}`,
    );

    // 1 Admin per company
    userCreateData.push({
      email: `lagaradmin${i + 1}@${company.name.toLowerCase().replace(/\s+/g, "")}.com`,
      phone: `+91${9500000000 + i}`,
      password: adminPassword,
      role: "ADMIN" as Role,
      status: "ACTIVE" as AccountStatus,
      companyId: company.id,
      firstName: `LagarAdmin${i + 1}`,
      lastName: company.name.split(" ")[0],
      onboardingCompleted: true,
      baseSalary: 90000,
      salaryType: "MONTHLY" as SalaryType,
      workingDays: 26,
      pfEsiApplicable: true,
      joiningDate: addDays(new Date(), -365),
    });

    // 50-80 Staff per company
    const staffCount = getRandomInt(50, 80);
    console.log(`Preparing ${staffCount} staff members for ${company.name}`);
    for (let j = 0; j < staffCount; j++) {
      const salaryType = getRandomElement([
        "MONTHLY",
        "HOURLY",
        "DAILY",
      ] as SalaryType[]);
      let baseSalary = 0;
      let hourlyRate = 0;
      let dailyRate = 0;

      switch (salaryType) {
        case "MONTHLY":
          baseSalary = 30000 + getRandomInt(0, 40000);
          break;
        case "HOURLY":
          hourlyRate = 200 + getRandomInt(0, 300);
          break;
        case "DAILY":
          dailyRate = 1000 + getRandomInt(0, 1500);
          break;
      }

      userCreateData.push({
        email: `lagarstaff${j + 1}.company${i + 1}@${company.name.toLowerCase().replace(/\s+/g, "")}.com`,
        phone: `+91${9600000000 + i * 100 + j}`,
        password: staffPassword,
        role: "STAFF" as Role,
        status: "ACTIVE" as AccountStatus,
        companyId: company.id,
        firstName: getRandomElement([
          "Arjun",
          "Priya",
          "Rohan",
          "Ananya",
          "Vikram",
          "Kavya",
          "Aditya",
          "Sneha",
          "Rahul",
          "Megha",
        ]),
        lastName: getRandomElement([
          "Sharma",
          "Verma",
          "Gupta",
          "Singh",
          "Patel",
          "Jain",
          "Agarwal",
          "Yadav",
          "Mishra",
          "Chauhan",
        ]),
        onboardingCompleted: true,
        baseSalary: baseSalary || null,
        hourlyRate: hourlyRate || null,
        dailyRate: dailyRate || null,
        salaryType,
        workingDays: 26,
        pfEsiApplicable: Math.random() > 0.3,
        joiningDate: addDays(new Date(), -getRandomInt(30, 730)),
      });
    }
  }

  const lagarUsers = await prisma.user.createManyAndReturn({
    data: userCreateData,
  });
  console.log(`✅ Created ${lagarUsers.length} Lagar users`);

  // Create attendance data for lagar users (last 6 months)
  console.log("⏰ Creating Attendance Data for Lagar Users...");
  const today = new Date();
  const sixMonthsAgo = addDays(today, -180);

  const attendanceCreateData = [];
  const staffUsers = lagarUsers.filter((u) => u.role === "STAFF");
  console.log(
    `Preparing attendance for ${staffUsers.length} staff members over 180 days each`,
  );

  // Create a map of companyId to adminId for quick lookup
  const adminMap = new Map();
  lagarUsers
    .filter((u) => u.role === "ADMIN")
    .forEach((admin) => {
      adminMap.set(admin.companyId, admin.id);
    });

  for (let i = 0; i < staffUsers.length; i++) {
    const user = staffUsers[i];
    if (i % 50 === 0)
      console.log(
        `Preparing attendance for user ${i + 1}/${staffUsers.length}`,
      );
    for (let days = 0; days < 180; days++) {
      const attendanceDate = addDays(sixMonthsAgo, days);
      const dayOfWeek = attendanceDate.getDay();

      // Skip weekends
      if (dayOfWeek === 0 || (dayOfWeek === 6 && Math.random() > 0.6)) continue;

      const attendanceType = getRandomElement([
        "PRESENT",
        "PRESENT",
        "PRESENT",
        "PRESENT",
        "ABSENT",
        "LEAVE",
        "LATE",
      ]);

      let punchIn: Date | null = null;
      let punchOut: Date | null = null;
      let status: AttendanceStatus = "PENDING";
      let workingHours = 0;

      switch (attendanceType) {
        case "PRESENT":
          punchIn = new Date(attendanceDate);
          punchIn.setHours(8 + getRandomInt(0, 3), getRandomInt(0, 59), 0, 0);
          const workHours = 7 + Math.random() * 3;
          punchOut = addHours(punchIn, workHours);
          workingHours = Math.round(workHours * 100) / 100;
          status = "APPROVED";
          break;
        case "LATE":
          punchIn = new Date(attendanceDate);
          punchIn.setHours(10 + getRandomInt(0, 2), getRandomInt(0, 59), 0, 0);
          punchOut = addHours(punchIn, 6 + Math.random() * 2);
          workingHours =
            Math.round(
              ((punchOut.getTime() - punchIn.getTime()) / (1000 * 60 * 60)) *
                100,
            ) / 100;
          status = "APPROVED";
          break;
        case "ABSENT":
          status = "ABSENT";
          break;
        case "LEAVE":
          status = "LEAVE";
          break;
      }

      attendanceCreateData.push({
        userId: user.id,
        companyId: user.companyId!,
        attendanceDate,
        punchIn,
        punchOut,
        workingHours: workingHours || null,
        status,
        approvedBy:
          status === "APPROVED" ? adminMap.get(user.companyId!) : null,
        approvedAt:
          status === "APPROVED"
            ? addHours(attendanceDate, getRandomInt(1, 8))
            : null,
      });
    }
  }

  console.log(`Inserting ${attendanceCreateData.length} attendance records...`);
  await prisma.attendance.createMany({
    data: attendanceCreateData,
  });
  console.log(
    `✅ Created ${attendanceCreateData.length} Lagar attendance records`,
  );

  console.log("\n🎉 LAGAR DATA SEED COMPLETED SUCCESSFULLY!");
  console.log("📊 LAGAR DATA SUMMARY:");
  console.log(`   • ${lagarCompanies.length} Lagar Companies`);
  console.log(`   • ${lagarUsers.length} Lagar Users`);
  console.log(`   • ${attendanceCreateData.length} Lagar Attendance Records`);

  console.log("\n🔑 LAGAR LOGIN CREDENTIALS:");
  console.log("Lagar Admin → lagaradmin1@lagarindustries.com / lagaradmin123");
  console.log(
    "Lagar Staff → lagarstaff1.company1@lagarindustries.com / lagarstaff123",
  );
}

// Helper function for hours
function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

export { main as default };
