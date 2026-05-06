import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

const artifactDir = process.env["ARTIFACT_DIR"];

if (artifactDir) {
  const frontendPath = path.join(artifactDir, "public");
  logger.info({ frontendPath }, "Serving static files from");
  app.use(express.static(frontendPath));

  app.get("/admin", (_req, res) => {
    res.sendFile(path.join(frontendPath, "admin.html"));
  });

  app.get("/admin/{*path}", (_req, res) => {
    res.sendFile(path.join(frontendPath, "admin.html"));
  });

  app.get("/{*path}", (_req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
} else {
  app.get("/", (_req, res) => {
    res.json({
      name: "Lucky Earth News API",
      version: "1.0.0",
      status: "ok",
      docs: "/api/health",
    });
  });
}

export default app;
