-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'STAFF');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ABSENT', 'LEAVE');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATED', 'UPDATED', 'APPROVED', 'REJECTED', 'DELETED');

-- CreateEnum
CREATE TYPE "CorrectionType" AS ENUM ('MISSED_PUNCH_IN', 'MISSED_PUNCH_OUT');

-- CreateEnum
CREATE TYPE "SalaryType" AS ENUM ('MONTHLY', 'HOURLY', 'DAILY');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'INAPP', 'WHATSAPP', 'PUSH');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('LOGIN', 'VERIFY_PHONE', 'REGISTER', 'RESET_PASSWORD');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('ATTENDANCE', 'SALARY', 'USER', 'COMPANY');

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "shiftStartTime" TEXT DEFAULT '09:00',
    "shiftEndTime" TEXT DEFAULT '18:00',
    "gracePeriodMinutes" INTEGER DEFAULT 30,
    "minWorkingHours" DOUBLE PRECISION DEFAULT 4.0,
    "maxDailyHours" DOUBLE PRECISION DEFAULT 16.0,
    "autoPunchOutBufferMinutes" INTEGER DEFAULT 30,
    "locationLat" DOUBLE PRECISION,
    "locationLng" DOUBLE PRECISION,
    "locationRadius" DOUBLE PRECISION DEFAULT 100.0,
    "overtimeThresholdHours" DOUBLE PRECISION DEFAULT 2.0,
    "nightPunchInWindowHours" DOUBLE PRECISION DEFAULT 2.0,
    "defaultSalaryType" "SalaryType" DEFAULT 'MONTHLY',
    "overtimeMultiplier" DOUBLE PRECISION DEFAULT 1.5,
    "enableLatePenalty" BOOLEAN DEFAULT false,
    "latePenaltyPerMinute" DOUBLE PRECISION DEFAULT 0,
    "enableAbsentPenalty" BOOLEAN DEFAULT false,
    "halfDayThresholdHours" DOUBLE PRECISION DEFAULT 4.0,
    "absentPenaltyPerDay" DOUBLE PRECISION DEFAULT 0,
    "pfPercentage" DOUBLE PRECISION DEFAULT 12.0,
    "esiPercentage" DOUBLE PRECISION DEFAULT 0.75,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_invitations" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STAFF',
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_configurations" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shift_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "companyId" UUID,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "baseSalary" DOUBLE PRECISION,
    "hourlyRate" DOUBLE PRECISION,
    "dailyRate" DOUBLE PRECISION,
    "salaryType" "SalaryType" DEFAULT 'MONTHLY',
    "workingDays" INTEGER DEFAULT 26,
    "overtimeRate" DOUBLE PRECISION,
    "pfEsiApplicable" BOOLEAN DEFAULT true,
    "joiningDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "attendanceDate" TIMESTAMP(3) NOT NULL,
    "punchIn" TIMESTAMP(3),
    "punchOut" TIMESTAMP(3),
    "punchInLocation" JSONB,
    "punchOutLocation" JSONB,
    "punchInImageUrl" TEXT,
    "punchOutImageUrl" TEXT,
    "autoPunchOut" BOOLEAN NOT NULL DEFAULT false,
    "autoPunchedOut" BOOLEAN NOT NULL DEFAULT false,
    "autoPunchOutAt" TIMESTAMP(3),
    "workingHours" DOUBLE PRECISION,
    "overtimeHours" DOUBLE PRECISION DEFAULT 0,
    "isLate" BOOLEAN NOT NULL DEFAULT false,
    "shiftDurationHours" DOUBLE PRECISION,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PENDING',
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "approvalReason" TEXT,
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorrectionRequest" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "attendanceId" UUID,
    "attendanceDate" TIMESTAMP(3) NOT NULL,
    "type" "CorrectionType" NOT NULL,
    "requestedTime" TIMESTAMP(3),
    "reason" TEXT NOT NULL,
    "evidence" TEXT,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" UUID,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorrectionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Salary" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "totalWorkingDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalWorkingHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overtimeHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lateMinutes" INTEGER NOT NULL DEFAULT 0,
    "halfDays" INTEGER NOT NULL DEFAULT 0,
    "absentDays" INTEGER NOT NULL DEFAULT 0,
    "baseAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overtimeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "penaltyAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossAmount" DOUBLE PRECISION NOT NULL,
    "netAmount" DOUBLE PRECISION NOT NULL,
    "type" "SalaryType" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "rejectedBy" UUID,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "lockedAt" TIMESTAMP(3),
    "recalculatedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Salary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_breakdowns" (
    "id" UUID NOT NULL,
    "salaryId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "hours" DOUBLE PRECISION,
    "quantity" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "salary_breakdowns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Otp" (
    "id" UUID NOT NULL,
    "phone" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveryStatus" TEXT DEFAULT 'PENDING',
    "deliveryAttempts" INTEGER NOT NULL DEFAULT 0,
    "deliveryChannels" JSONB,
    "deliveryResults" JSONB,

    CONSTRAINT "Otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "type" "ReportType" NOT NULL,
    "title" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "correctionRequestId" UUID,
    "attendanceId" UUID,
    "salaryId" UUID,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "provider" TEXT,
    "messageId" TEXT,
    "cost" DOUBLE PRECISION,
    "metadata" JSONB,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackgroundJob" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER,
    "logs" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackgroundJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_invitations_token_key" ON "company_invitations"("token");

-- CreateIndex
CREATE UNIQUE INDEX "shift_configurations_companyId_name_key" ON "shift_configurations"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "Attendance_companyId_attendanceDate_idx" ON "Attendance"("companyId", "attendanceDate");

-- CreateIndex
CREATE INDEX "Attendance_companyId_status_idx" ON "Attendance"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_userId_companyId_attendanceDate_key" ON "Attendance"("userId", "companyId", "attendanceDate");

-- CreateIndex
CREATE INDEX "CorrectionRequest_companyId_status_idx" ON "CorrectionRequest"("companyId", "status");

-- CreateIndex
CREATE INDEX "CorrectionRequest_userId_attendanceDate_idx" ON "CorrectionRequest"("userId", "attendanceDate");

-- CreateIndex
CREATE INDEX "Salary_companyId_month_year_idx" ON "Salary"("companyId", "month", "year");

-- CreateIndex
CREATE INDEX "Salary_companyId_status_idx" ON "Salary"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Salary_userId_month_year_key" ON "Salary"("userId", "month", "year");

-- CreateIndex
CREATE INDEX "salary_breakdowns_salaryId_idx" ON "salary_breakdowns"("salaryId");

-- CreateIndex
CREATE INDEX "Notification_userId_status_idx" ON "Notification"("userId", "status");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_category_key_key" ON "system_settings"("category", "key");

-- CreateIndex
CREATE INDEX "notification_logs_type_status_idx" ON "notification_logs"("type", "status");

-- CreateIndex
CREATE INDEX "notification_logs_channel_createdAt_idx" ON "notification_logs"("channel", "createdAt");

-- CreateIndex
CREATE INDEX "notification_logs_recipient_idx" ON "notification_logs"("recipient");

-- CreateIndex
CREATE INDEX "BackgroundJob_type_status_idx" ON "BackgroundJob"("type", "status");

-- AddForeignKey
ALTER TABLE "company_invitations" ADD CONSTRAINT "company_invitations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_configurations" ADD CONSTRAINT "shift_configurations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectionRequest" ADD CONSTRAINT "CorrectionRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectionRequest" ADD CONSTRAINT "CorrectionRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectionRequest" ADD CONSTRAINT "CorrectionRequest_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "Attendance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectionRequest" ADD CONSTRAINT "CorrectionRequest_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Salary" ADD CONSTRAINT "Salary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Salary" ADD CONSTRAINT "Salary_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Salary" ADD CONSTRAINT "Salary_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Salary" ADD CONSTRAINT "Salary_rejectedBy_fkey" FOREIGN KEY ("rejectedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_breakdowns" ADD CONSTRAINT "salary_breakdowns_salaryId_fkey" FOREIGN KEY ("salaryId") REFERENCES "Salary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_correctionRequestId_fkey" FOREIGN KEY ("correctionRequestId") REFERENCES "CorrectionRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "Attendance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_salaryId_fkey" FOREIGN KEY ("salaryId") REFERENCES "Salary"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
