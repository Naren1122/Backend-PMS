import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

//basic configurations
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));
app.use(express.static("public"));

app.use(cookieParser()); // for cookie

//cors configurations
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"], // from postman
  })
);

// import the routes
import healthCheckRouter from "./routes/healthcheck.routes.js";

app.use("/api/v1/healthcheck", healthCheckRouter);

import authRouter from "./routes/auth.routes.js";
app.use("/api/v1/auth", authRouter);

// Adding the project management routes
import projectRouter from "./routes/project.routes.js";
app.use("/api/v1/projects", projectRouter);
app.use("/api/v1", projectRouter);

// Adding the task management routes
import taskRouter from "./routes/task.routes.js";
app.use("/api/v1/tasks", taskRouter);

// Add this import after the other route imports
import noteRouter from "./routes/note.routes.js";
app.use("/api/v1/notes", noteRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Log error to console with timestamp
  const timestamp = new Date().toISOString();
  console.error("\n========================================");
  console.error(`[${timestamp}] ERROR: ${statusCode} - ${message}`);
  console.error(`[${timestamp}] PATH: ${req.method} ${req.path}`);
  console.error(`[${timestamp}] BODY:`, JSON.stringify(req.body, null, 2));
  console.error(
    `[${timestamp}] HEADERS:`,
    JSON.stringify(req.headers, null, 2)
  );
  if (err.errors && err.errors.length > 0) {
    console.error(`[${timestamp}] ERRORS:`, err.errors);
  }
  console.error(`[${timestamp}] STACK TRACE:`);
  console.error(err.stack);
  console.error("========================================\n");

  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || [],
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

export default app;
