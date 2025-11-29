import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

// Import routes
import authRoutes from "./routes/auth";

// Family routes
import familyElderRoutes from "./routes/family/elders";
import familyCaregiverRoutes from "./routes/family/caregivers";
import familyBillRoutes from "./routes/family/bills";
import familyActivityRoutes from "./routes/family/activities";
import familyAppointmentRoutes from "./routes/family/appointments";
import familyReportRoutes from "./routes/family/reports";
import familyNotificationRoutes from "./routes/family/notifications";
import familyMoodRoutes from "./routes/family/moods";

// Caregiver routes
import caregiverTaskRoutes from "./routes/caregiver/tasks";
import caregiverHealthRoutes from "./routes/caregiver/health";
import caregiverMoodRoutes from "./routes/caregiver/moods";
import caregiverExpenseRoutes from "./routes/caregiver/expenses";
import caregiverReportRoutes from "./routes/caregiver/reports";
import caregiverAttendanceRoutes from "./routes/caregiver/attendance";
import caregiverNotificationRoutes from "./routes/caregiver/notifications";

// Shared routes
import uploadRoutes from "./routes/shared/upload";
import healthRoutes from "./routes/shared/health";
import profileRoutes from "./routes/shared/profile";

dotenv.config();

const app: Express = express();
// Log frontend requests: method, path, origin (with color)
const methodColors: Record<string, string> = {
  GET: "\x1b[32m", // green
  POST: "\x1b[33m", // yellow
  PATCH: "\x1b[35m", // magenta
  DELETE: "\x1b[31m", // red
};
app.use((req: Request, res: Response, next) => {
  const origin = req.headers.origin || req.headers.referer || "unknown";
  if (allowedOrigins.includes(origin)) {
    const color = methodColors[req.method] || "";
    const reset = "\x1b[0m";
    console.log(
      `${color}🌐 [FRONTEND] ${req.method} ${req.originalUrl} | Origin: ${origin}${reset}`
    );
  }
  next();
});
const PORT = process.env.PORT || 8000;

// Middleware
const allowedOrigins = [
  "http://localhost:3000",
  "http://192.168.1.44:3000",
  "http://localhost:8080",
  process.env.FRONTEND_URL,
].filter(Boolean);

// ในโหมด development อนุญาตทุก origin (รองรับ IP address)
const isDevelopment = process.env.NODE_ENV !== "production";

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps, curl, etc)
      if (!origin) return callback(null, true);

      // ใน development mode อนุญาตทุก origin ที่มา port 3000
      if (isDevelopment && origin.includes(":3000")) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "CareLink API Server",
    version: "1.0.0",
    status: "running",
  });
});

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/auth", authRoutes);

// Family Routes (ลูกหลาน)
app.use("/api/family/elders", familyElderRoutes);
app.use("/api/family/caregivers", familyCaregiverRoutes);
app.use("/api/family/bills", familyBillRoutes);
app.use("/api/family/activities", familyActivityRoutes);
app.use("/api/family/appointments", familyAppointmentRoutes);
app.use("/api/family/reports", familyReportRoutes);
app.use("/api/family/notifications", familyNotificationRoutes);
app.use("/api/family/moods", familyMoodRoutes);

// Caregiver Routes (ผู้ดูแล)
app.use("/api/caregiver/tasks", caregiverTaskRoutes);
app.use("/api/caregiver/health", caregiverHealthRoutes);
app.use("/api/caregiver/moods", caregiverMoodRoutes);
app.use("/api/caregiver/expenses", caregiverExpenseRoutes);
app.use("/api/caregiver/reports", caregiverReportRoutes);
app.use("/api/caregiver/attendance", caregiverAttendanceRoutes);
app.use("/api/caregiver/notifications", caregiverNotificationRoutes);

// Shared Routes (ใช้ร่วมกัน)
app.use("/api/upload", uploadRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/profile", profileRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err: Error, req: Request, res: Response) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ error: "Internal server error", message: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📂 API Base URL: http://localhost:${PORT}/api`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `🌐 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`
  );
});

export default app;
