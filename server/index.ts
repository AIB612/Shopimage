import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";

// 1. IMMEDIATE STARTUP DIAGNOSTIC (Before any other local imports)
    console.log("[STARTUP] >>> PRE-FLIGHT CHECK START <<<");
    console.log(`[STARTUP] NODE_ENV is set to: ${process.env.NODE_ENV}`);
    if (process.env.NODE_ENV !== 'production') {
      console.warn("[STARTUP] WARNING: Running in non-production mode on Render might cause performance issues!");
    }

if (!process.env.DATABASE_URL) {
  console.error("[STARTUP] FATAL: DATABASE_URL is NOT defined in environment variables!");
}

import { registerRoutes } from "./routes";
import { serveStatic } from "./static";

const app = express();
const httpServer = createServer(app);

// Global error handlers
process.on("uncaughtException", (err) => {
  console.error("CRITICAL ERROR (uncaughtException):", err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("CRITICAL ERROR (unhandledRejection):", reason);
  process.exit(1);
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// ... rest of the middleware ...
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      log(logLine);
    }
  });
  next();
});

(async () => {
  try {
    console.log("[STARTUP] Registering routes...");
    await registerRoutes(httpServer, app);
    console.log("[STARTUP] Routes registered successfully.");

    app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error("Express Error Handler:", err);
      if (res.headersSent) return next(err);
      return res.status(status).json({ message });
    });

    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
    }

    const port = parseInt(process.env.PORT || "5000", 10);
    httpServer.listen({ port, host: "0.0.0.0" }, () => {
      log(`[STARTUP] Server is fully ONLINE on port ${port}`);
    });
  } catch (error: any) {
    console.error("[STARTUP] FATAL ERROR during initialization chain:");
    console.error(error);
    process.exit(1);
  }
})();
